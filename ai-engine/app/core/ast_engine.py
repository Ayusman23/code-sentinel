import re
import ast
from typing import List, Dict, Any, Set, Optional
from app.models.schemas import FileDiff, RepoContext, CrossFileImpact, SeverityEnum

class ASTContextEngine:
    """
    Cross-File Contextual AST Traversal Engine.
    Analyzes multi-file diffs to extract symbol definitions, export signature changes,
    and cross-file dependency ripples (e.g., schema breaking changes, missing caller updates).
    """

    @classmethod
    def analyze_diffs(cls, files: List[FileDiff], context: Optional[RepoContext] = None) -> Dict[str, Any]:
        """
        Parses all modified files in the PR, maps symbol changes, and detects cross-file breaking changes.
        """
        symbol_definitions: Dict[str, Dict[str, Any]] = {}
        symbol_mutations: List[Dict[str, Any]] = []
        cross_file_impacts: List[CrossFileImpact] = []
        files_by_name = {f.filename: f for f in files}

        # Step 1: Extract signatures and changes from each file
        for file in files:
            ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
            extracted = cls._extract_file_symbols(file.filename, file.patch, file.raw_content, ext)
            symbol_definitions[file.filename] = extracted
            
            # Check for deleted/mutated exports in patch
            mutations = cls._detect_export_mutations(file.filename, file.patch, ext)
            symbol_mutations.extend(mutations)

        # Step 2: Cross-file contract validation
        for mutation in symbol_mutations:
            symbol_name = mutation["symbol"]
            source_file = mutation["file"]
            mutation_type = mutation["type"]
            
            for other_filename, other_file in files_by_name.items():
                if other_filename == source_file:
                    continue
                
                # Check if other file imports or references this symbol
                if symbol_name in other_file.patch or (other_file.raw_content and symbol_name in other_file.raw_content):
                    # Check if other file updated its call signature
                    if mutation_type == "PARAMETER_COUNT_CHANGED":
                        old_params = mutation.get("old_params", [])
                        new_params = mutation.get("new_params", [])
                        
                        # If required param added and caller didn't change arguments
                        if len(new_params) > len(old_params):
                            cross_file_impacts.append(CrossFileImpact(
                                source_file=source_file,
                                target_file=other_filename,
                                impact_type="INTERFACE_CONTRACT_MUTATION",
                                symbol=symbol_name,
                                description=(
                                    f"Symbol '{symbol_name}' in '{source_file}' signature modified from "
                                    f"({', '.join(old_params)}) to ({', '.join(new_params)}). "
                                    f"Target file '{other_filename}' imports '{symbol_name}' but may not pass required arguments."
                                ),
                                severity=SeverityEnum.HIGH
                            ))
                    elif mutation_type == "EXPORT_REMOVED":
                        cross_file_impacts.append(CrossFileImpact(
                            source_file=source_file,
                            target_file=other_filename,
                            impact_type="SCHEMA_BREAK",
                            symbol=symbol_name,
                            description=(
                                f"Exported symbol '{symbol_name}' was removed or renamed in '{source_file}', "
                                f"breaking references in '{other_filename}'."
                            ),
                            severity=SeverityEnum.CRITICAL
                        ))

        # Step 3: Check Schema / Model vs Controller Desynchronization
        cls._detect_schema_controller_desync(files, cross_file_impacts)

        return {
            "symbol_definitions": symbol_definitions,
            "symbol_mutations": symbol_mutations,
            "cross_file_impacts": cross_file_impacts
        }

    @classmethod
    def _extract_file_symbols(cls, filename: str, patch: str, raw_content: Optional[str], ext: str) -> Dict[str, Any]:
        """Extracts function, class, and export definitions."""
        symbols = {"functions": [], "classes": [], "exports": [], "imports": []}
        
        content_to_scan = raw_content if raw_content else patch
        
        # JS / TS regex extraction
        if ext in ("ts", "tsx", "js", "jsx"):
            # Functions
            fn_matches = re.findall(r'(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)', content_to_scan)
            for fn_name, params in fn_matches:
                param_list = [p.strip().split(":")[0].strip() for p in params.split(",") if p.strip()]
                symbols["functions"].append({"name": fn_name, "params": param_list})
            
            # Arrow function exports: export const doSomething = (a, b) =>
            arrow_matches = re.findall(r'export\s+(?:const|let)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\(([^)]*)\)', content_to_scan)
            for fn_name, params in arrow_matches:
                param_list = [p.strip().split(":")[0].strip() for p in params.split(",") if p.strip()]
                symbols["functions"].append({"name": fn_name, "params": param_list})

            # Classes
            cls_matches = re.findall(r'class\s+([a-zA-Z0-9_$]+)(?:\s+extends\s+[a-zA-Z0-9_$]+)?', content_to_scan)
            symbols["classes"].extend(cls_matches)

            # Imports: import { a, b } from './path'
            imp_matches = re.findall(r'import\s+\{([^}]+)\}\s+from\s+[\'"]([^\'"]+)[\'"]', content_to_scan)
            for imp_names, imp_path in imp_matches:
                imported_symbols = [s.strip() for s in imp_names.split(",") if s.strip()]
                symbols["imports"].append({"source": imp_path, "symbols": imported_symbols})

        # Python AST parsing
        elif ext == "py":
            try:
                # Try parsing raw content if valid python
                if raw_content:
                    tree = ast.parse(raw_content)
                    for node in ast.walk(tree):
                        if isinstance(node, ast.FunctionDef):
                            params = [arg.arg for arg in node.args.args]
                            symbols["functions"].append({"name": node.name, "params": params})
                        elif isinstance(node, ast.ClassDef):
                            symbols["classes"].append(node.name)
            except Exception:
                # Regex fallback for patch fragments
                fn_matches = re.findall(r'def\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\):', patch)
                for fn_name, params in fn_matches:
                    param_list = [p.strip().split(":")[0].strip() for p in params.split(",") if p.strip()]
                    symbols["functions"].append({"name": fn_name, "params": param_list})

        return symbols

    @classmethod
    def _detect_export_mutations(cls, filename: str, patch: str, ext: str) -> List[Dict[str, Any]]:
        """Identifies removed exports or altered signatures from unified diff."""
        mutations = []
        lines = [l.strip() for l in patch.split("\n")]
        
        removed_lines = [l[1:].strip() for l in lines if l.startswith("-") and not l.startswith("---")]
        added_lines = [l[1:].strip() for l in lines if l.startswith("+") and not l.startswith("+++")]

        # Look for function signature changes
        for rem in removed_lines:
            fn_rem = re.search(r'(?:export\s+)?(?:async\s+)?(?:def|function|const)\s+([a-zA-Z0-9_$]+)\s*=?\s*\(([^)]*)\)', rem)
            if fn_rem:
                sym_name = fn_rem.group(1)
                params_str = fn_rem.group(2) if fn_rem.lastindex and fn_rem.lastindex >= 2 and fn_rem.group(2) else ""
                old_params = [p.strip().split(":")[0].strip() for p in params_str.split(",") if p.strip()]
                
                # Check if it was replaced in added lines with different params
                matched_added = False
                for add in added_lines:
                    if sym_name in add:
                        fn_add = re.search(r'(?:export\s+)?(?:async\s+)?(?:def|function|const)\s+' + re.escape(sym_name) + r'\s*=?\s*\(([^)]*)\)', add)
                        if fn_add:
                            add_params_str = fn_add.group(1) if fn_add.lastindex and fn_add.group(1) else ""
                            new_params = [p.strip().split(":")[0].strip() for p in add_params_str.split(",") if p.strip()]
                            matched_added = True
                            if len(old_params) != len(new_params):
                                mutations.append({
                                    "file": filename,
                                    "symbol": sym_name,
                                    "type": "PARAMETER_COUNT_CHANGED",
                                    "old_params": old_params,
                                    "new_params": new_params
                                })
                            break
                if not matched_added and ("export" in rem or "def " in rem):
                    mutations.append({
                        "file": filename,
                        "symbol": sym_name,
                        "type": "EXPORT_REMOVED"
                    })

        return mutations

    @classmethod
    def _detect_schema_controller_desync(cls, files: List[FileDiff], impacts: List[CrossFileImpact]):
        """Detects if a model/schema file was altered (e.g. required field added/renamed) without controller updates."""
        schema_files = [f for f in files if "model" in f.filename.lower() or "schema" in f.filename.lower() or "entities" in f.filename.lower()]
        controller_files = [f for f in files if "controller" in f.filename.lower() or "route" in f.filename.lower() or "handler" in f.filename.lower()]

        for sf in schema_files:
            # Check if required fields or columns added in patch
            field_additions = re.findall(r'\+\s*([a-zA-Z0-9_]+)\s*:\s*\{[^}]*required:\s*true', sf.patch, re.IGNORECASE)
            field_additions += re.findall(r'\+\s*(?:column|field)\s+([a-zA-Z0-9_]+)', sf.patch, re.IGNORECASE)
            
            for field in field_additions:
                # Check if controllers handle this new required field
                for cf in controller_files:
                    if field not in cf.patch:
                        impacts.append(CrossFileImpact(
                            source_file=sf.filename,
                            target_file=cf.filename,
                            impact_type="SCHEMA_BREAK",
                            symbol=field,
                            description=(
                                f"Schema/Model '{sf.filename}' introduced required field '{field}', but controller '{cf.filename}' "
                                f"does not validate or map this field during creation/updates."
                            ),
                            severity=SeverityEnum.HIGH
                        ))
