import re
from typing import List, Dict, Any
from app.models.schemas import FileDiff, BlastRadiusScore, BlastRadiusBreakdown, SeverityEnum, RBACIssue, CrossFileImpact

class BlastRadiusCalculator:
    """
    Architectural Blast-Radius Scoring Engine.
    Generates a holistic impact score (0 to 100) predicting the failure surface
    and risk propagation of pull request changes.
    """

    CORE_PATH_KEYWORDS = [
        ("config", 30),
        ("middleware", 35),
        ("auth", 40),
        ("security", 40),
        ("db", 35),
        ("database", 35),
        ("models", 30),
        ("gateway", 35),
        ("utils", 20),
        ("core", 25),
        ("router", 20),
        ("api", 20),
        ("components", 10),
        ("views", 10),
        ("styles", 5),
        ("docs", 0)
    ]

    @classmethod
    def calculate(
        cls,
        files: List[FileDiff],
        rbac_issues: List[RBACIssue],
        cross_file_impacts: List[CrossFileImpact]
    ) -> BlastRadiusScore:
        """
        Computes composite blast radius metrics across 5 architectural dimensions.
        """
        affected_components: Set_str = set()
        
        # 1. Dependency Depth Score (Core vs Leaf)
        core_weight_sum = 0
        total_files = max(1, len(files))
        
        for file in files:
            path_lower = file.filename.lower()
            file_weight = 10  # default weight
            
            for kw, weight in cls.CORE_PATH_KEYWORDS:
                if kw in path_lower:
                    file_weight = max(file_weight, weight)
                    affected_components.add(f"Core Module: {kw.capitalize()}")
            
            core_weight_sum += file_weight
            
            # Extract component from path
            parts = [p for p in file.filename.split("/") if p and p not in (".", "src", "app")]
            if len(parts) >= 2:
                affected_components.add(f"Module: {parts[0]}")
            else:
                affected_components.add(file.filename)

        dep_depth_score = min(100.0, round((core_weight_sum / (total_files * 40.0)) * 100, 1))

        # 2. API Surface Score (Endpoints modified/added)
        endpoint_count = 0
        for file in files:
            endpoint_matches = re.findall(r'^\+\s*(?:router|app|@app|@router)\.(post|put|delete|patch|get)\b', file.patch, re.MULTILINE | re.IGNORECASE)
            endpoint_count += len(endpoint_matches)
        
        api_surface_score = min(100.0, round(endpoint_count * 20.0, 1))

        # 3. Data Mutation Score (DB models & schema alterations)
        data_mutation_points = 0
        for file in files:
            if any(k in file.filename.lower() for k in ["model", "schema", "migration", "entity", "prisma", "typeorm", "mongoose"]):
                data_mutation_points += 35
                affected_components.add("Persistence Layer (Data Models)")
        
        data_mutation_score = min(100.0, float(data_mutation_points))

        # 4. RBAC Exposure Score
        rbac_exposure_score = min(100.0, round(len(rbac_issues) * 35.0, 1))
        if rbac_issues:
            affected_components.add("Access Control & Authorization Layer")

        # 5. Cyclomatic Complexity Delta
        cyclomatic_delta = 0
        branching_keywords = ["if ", "else if", "elif ", "switch ", "case ", "for ", "while ", "catch ", "?", "&&", "||"]
        for file in files:
            added_lines = [l.strip() for l in file.patch.split("\n") if l.strip().startswith("+") and not l.strip().startswith("+++")]
            for line in added_lines:
                for kw in branching_keywords:
                    if kw in line:
                        cyclomatic_delta += 1

        # Composite overall calculation (weighted blend)
        # Weights: Core Depth (25%), API Surface (25%), Data Mutation (20%), RBAC (20%), Cross-File Ripple (10%)
        cross_file_penalty = min(20.0, len(cross_file_impacts) * 10.0)
        
        raw_composite = (
            (dep_depth_score * 0.25) +
            (api_surface_score * 0.25) +
            (data_mutation_score * 0.20) +
            (rbac_exposure_score * 0.20) +
            cross_file_penalty
        )
        
        overall_score = min(100, max(5, int(round(raw_composite))))

        # Determine risk level
        if overall_score >= 70:
            risk_level = SeverityEnum.CRITICAL
        elif overall_score >= 45:
            risk_level = SeverityEnum.HIGH
        elif overall_score >= 25:
            risk_level = SeverityEnum.MEDIUM
        else:
            risk_level = SeverityEnum.LOW

        summary = (
            f"Blast Radius evaluated at {overall_score}/100 ({risk_level.value}). "
            f"{len(files)} files modified across {len(affected_components)} functional subsystems, "
            f"introducing +{cyclomatic_delta} branching complexity points."
        )

        return BlastRadiusScore(
            overall_score=overall_score,
            risk_level=risk_level,
            affected_components=sorted(list(affected_components)),
            breakdown=BlastRadiusBreakdown(
                dependency_depth_score=dep_depth_score,
                api_surface_score=api_surface_score,
                data_mutation_score=data_mutation_score,
                rbac_exposure_score=rbac_exposure_score,
                cyclomatic_delta=float(cyclomatic_delta)
            ),
            summary=summary
        )
