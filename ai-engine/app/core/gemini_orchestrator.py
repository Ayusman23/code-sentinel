import json
import logging
import re
from typing import List, Dict, Any, Optional
import google.generativeai as genai

from app.config import get_settings
from app.models.schemas import (
    FileDiff, RepoContext, Vulnerability, RemediationSuggestion,
    SecretInterceptionResult, RBACIssue, CrossFileImpact, SeverityEnum
)

logger = logging.getLogger("codesentinel.gemini")

class GeminiOrchestrator:
    """
    Structured Prompt Orchestrator leveraging Google Gemini API.
    Transforms raw code diffs and contextual AST analysis into structured,
    test-compliant remediations with committable GitHub Markdown suggestions.
    """

    def __init__(self):
        self.settings = get_settings()
        self.api_key = self.settings.GEMINI_API_KEY
        self.is_configured = bool(self.api_key and not self.api_key.startswith("your_"))
        
        if self.is_configured:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel(self.settings.GEMINI_MODEL)
                logger.info(f"Gemini API initialized with model {self.settings.GEMINI_MODEL}")
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini API: {e}. Fallback heuristics active.")
                self.is_configured = False

    async def analyze(
        self,
        files: List[FileDiff],
        sanitized_diffs: Dict[str, str],
        ast_data: Dict[str, Any],
        rbac_issues: List[RBACIssue],
        secrets: List[SecretInterceptionResult],
        context: Optional[RepoContext] = None
    ) -> Dict[str, Any]:
        """
        Executes Gemini LLM analysis or deterministic rule-based fallback.
        """
        if self.is_configured:
            try:
                return await self._run_gemini_analysis(files, sanitized_diffs, ast_data, rbac_issues, secrets, context)
            except Exception as e:
                logger.error(f"Gemini API invocation failed: {e}. Utilizing deterministic fallback engine.")

        # Fallback Heuristic & Rule-based Generator
        return self._run_heuristic_generator(files, sanitized_diffs, ast_data, rbac_issues, secrets, context)

    async def _run_gemini_analysis(
        self,
        files: List[FileDiff],
        sanitized_diffs: Dict[str, str],
        ast_data: Dict[str, Any],
        rbac_issues: List[RBACIssue],
        secrets: List[SecretInterceptionResult],
        context: Optional[RepoContext]
    ) -> Dict[str, Any]:
        """Sends rich context to Gemini with structured JSON output instructions."""
        prompt = self._build_prompt(files, sanitized_diffs, ast_data, rbac_issues, secrets, context)
        
        generation_config = {
            "temperature": 0.2,
            "top_p": 0.95,
            "response_mime_type": "application/json"
        }

        response = await self.model.generate_content_async(
            prompt,
            generation_config=generation_config
        )
        
        response_text = response.text.strip()
        
        # Parse JSON from model output
        try:
            parsed = json.loads(response_text)
            return self._transform_gemini_output(parsed, files)
        except json.JSONDecodeError:
            # Clean markdown codeblocks if present
            cleaned = re.sub(r'^```json\s*|\s*```$', '', response_text, flags=re.MULTILINE).strip()
            parsed = json.loads(cleaned)
            return self._transform_gemini_output(parsed, files)

    def _build_prompt(
        self,
        files: List[FileDiff],
        sanitized_diffs: Dict[str, str],
        ast_data: Dict[str, Any],
        rbac_issues: List[RBACIssue],
        secrets: List[SecretInterceptionResult],
        context: Optional[RepoContext]
    ) -> str:
        framework = ", ".join(context.frameworks) if context and context.frameworks else "Node.js/Express, Python"
        test_fw = context.test_framework if context and context.test_framework else "jest"
        
        diff_payload = "\n\n".join([
            f"=== FILE: {f.filename} (Status: {f.status}) ===\n{sanitized_diffs.get(f.filename, f.patch)}"
            for f in files
        ])

        ast_summary = json.dumps({
            "cross_file_impacts": [i.dict() for i in ast_data.get("cross_file_impacts", [])],
            "symbol_mutations": ast_data.get("symbol_mutations", [])
        }, indent=2)

        rbac_summary = json.dumps([r.dict() for r in rbac_issues], indent=2)
        secrets_summary = json.dumps([s.dict() for s in secrets], indent=2)

        return f"""
You are CodeSentinel, an elite Principal DevSecOps & Security Architect reviewing a GitHub Pull Request.
Target Ecosystem: {framework}
Testing Paradigm: {test_fw}

Input Code Patches (Secrets have already been scrubbed in-flight):
{diff_payload}

Contextual AST Engine Findings:
{ast_summary}

Deterministic RBAC Analyzer Findings:
{rbac_summary}

Secret Interception Audit:
{secrets_summary}

YOUR TASK:
Analyze the PR diffs and provide a high-signal DevSecOps assessment.
Filter out all stylistic formatting (ESLint concerns). Focus exclusively on:
1. Critical Logic & Security Flaws (CWE, OWASP Top 10, Auth Bypass, IDOR, SQLi, Race Conditions, SSRF).
2. Cross-file state/schema breaks.
3. Test-compliant remediation patches formatted as committable GitHub Markdown suggestions.

Return ONLY a valid JSON object matching this schema:
{{
  "overall_risk": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "executive_summary": "Concise 2-3 sentence architectural risk summary",
  "vulnerabilities": [
    {{
      "id": "VULN-001",
      "rule_id": "RULE_NAME",
      "title": "Clear vulnerability title",
      "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
      "cwe_id": "CWE-XXX",
      "owasp_category": "A01:2021-...",
      "file": "path/to/file.ts",
      "line_start": 12,
      "line_end": 15,
      "description": "Detailed explanation of flaw",
      "impact": "Concrete attack vector impact",
      "confidence": 0.95
    }}
  ],
  "remediations": [
    {{
      "id": "REM-001",
      "vulnerability_id": "VULN-001",
      "file": "path/to/file.ts",
      "line_start": 12,
      "line_end": 15,
      "original_code": "code being replaced",
      "suggested_code": "secure replacement code",
      "github_markdown_suggestion": "```suggestion\\nsecure replacement code\\n```",
      "explanation": "Why this fixes the issue",
      "test_verification_snippet": "describe('security test', () => {{ ... }})"
    }}
  ]
}}
"""

    def _transform_gemini_output(self, parsed: Dict[str, Any], files: List[FileDiff]) -> Dict[str, Any]:
        """Validates and formats the Gemini response into typed schemas."""
        vulns: List[Vulnerability] = []
        for v in parsed.get("vulnerabilities", []):
            vulns.append(Vulnerability(
                id=v.get("id", f"VULN-{len(vulns)+1}"),
                rule_id=v.get("rule_id", "SECURITY_DEFECT"),
                title=v.get("title", "Security Vulnerability"),
                severity=SeverityEnum(v.get("severity", "HIGH")),
                cwe_id=v.get("cwe_id", "CWE-693"),
                owasp_category=v.get("owasp_category", "A01:2021-Broken Access Control"),
                file=v.get("file", files[0].filename if files else "unknown"),
                line_start=v.get("line_start", 1),
                line_end=v.get("line_end", 1),
                description=v.get("description", "Potential vulnerability detected."),
                impact=v.get("impact", "System integrity or confidentiality compromised."),
                confidence=v.get("confidence", 0.95)
            ))

        remediations: List[RemediationSuggestion] = []
        for r in parsed.get("remediations", []):
            suggested_code = r.get("suggested_code", "")
            gh_sugg = r.get("github_markdown_suggestion") or f"```suggestion\n{suggested_code}\n```"
            
            remediations.append(RemediationSuggestion(
                id=r.get("id", f"REM-{len(remediations)+1}"),
                vulnerability_id=r.get("vulnerability_id"),
                file=r.get("file", files[0].filename if files else "unknown"),
                line_start=r.get("line_start", 1),
                line_end=r.get("line_end", 1),
                original_code=r.get("original_code", ""),
                suggested_code=suggested_code,
                github_markdown_suggestion=gh_sugg,
                explanation=r.get("explanation", "Applies secure coding practices and authorization guards."),
                test_verification_snippet=r.get("test_verification_snippet", "// Verified by automated test suite")
            ))

        return {
            "overall_risk": parsed.get("overall_risk", "HIGH"),
            "executive_summary": parsed.get("executive_summary", "Security analysis completed."),
            "vulnerabilities": vulns,
            "remediations": remediations,
            "ai_engine_used": f"Gemini ({self.settings.GEMINI_MODEL})"
        }

    def _run_heuristic_generator(
        self,
        files: List[FileDiff],
        sanitized_diffs: Dict[str, str],
        ast_data: Dict[str, Any],
        rbac_issues: List[RBACIssue],
        secrets: List[SecretInterceptionResult],
        context: Optional[RepoContext]
    ) -> Dict[str, Any]:
        """
        High-precision deterministic rule engine that crafts rich, test-compliant remediations
        when offline or in fallback mode.
        """
        vulns: List[Vulnerability] = []
        remediations: List[RemediationSuggestion] = []
        
        # 1. Convert intercepted secrets to high-priority vulnerabilities & remediations
        for s in secrets:
            vuln_id = f"SEC-LEAK-{s.file.replace('/', '_')}-{s.line}"
            vulns.append(Vulnerability(
                id=vuln_id,
                rule_id=f"SECRET_{s.rule_id}",
                title=f"Hardcoded Credential Exposure: {s.secret_type}",
                severity=SeverityEnum.CRITICAL,
                cwe_id="CWE-798",
                owasp_category="A07:2021-Identification and Authentication Failures",
                file=s.file,
                line_start=s.line,
                line_end=s.line,
                description=f"Direct exposure of {s.secret_type} in commit diff. Intercepted in-flight with entropy score {s.entropy_score}.",
                impact="Immediate credential compromise, enabling unauthorized API access, lateral network movement, or data exfiltration.",
                confidence=0.99
            ))

            env_var_name = f"{s.rule_id.upper()}_KEY"
            remediations.append(RemediationSuggestion(
                id=f"REM-SECRET-{len(remediations)+1}",
                vulnerability_id=vuln_id,
                file=s.file,
                line_start=s.line,
                line_end=s.line,
                original_code=s.redacted_preview,
                suggested_code=f"process.env.{env_var_name} || config.{env_var_name.lower()}",
                github_markdown_suggestion=f"```suggestion\nconst secretKey = process.env.{env_var_name};\n```",
                explanation=f"Extract credential to environment variables (`process.env.{env_var_name}`) and rotate exposed key immediately in secrets vault.",
                test_verification_snippet=(
                    f"test('does not leak {s.secret_type} in codebase', () => {{\n"
                    f"  expect(process.env.{env_var_name}).toBeDefined();\n"
                    f"  expect(config.{env_var_name.lower()}).not.toContain('AKIA');\n"
                    f"}});"
                )
            ))

        # 2. Add RBAC remediations
        for r in rbac_issues:
            vuln_id = f"RBAC-{r.file.replace('/', '_')}-{r.line}"
            remediations.append(RemediationSuggestion(
                id=f"REM-RBAC-{len(remediations)+1}",
                vulnerability_id=vuln_id,
                file=r.file,
                line_start=r.line,
                line_end=r.line,
                original_code=f"router.{r.method.lower()}('{r.route}', handler)",
                suggested_code=f"router.{r.method.lower()}('{r.route}', requireAuth, requireRole(['admin']), handler)",
                github_markdown_suggestion=(
                    f"```suggestion\n"
                    f"router.{r.method.lower()}('{r.route}', requireAuth, requireRole(['admin']), handler);\n"
                    f"```"
                ),
                explanation=r.remediation_advice,
                test_verification_snippet=(
                    f"describe('RBAC Verification for {r.method} {r.route}', () => {{\n"
                    f"  it('should return 401 Unauthorized when unauthenticated', async () => {{\n"
                    f"    const res = await request(app).{r.method.lower()}('{r.route}');\n"
                    f"    expect(res.status).toBe(401);\n"
                    f"  }});\n"
                    f"  it('should return 403 Forbidden for non-admin role', async () => {{\n"
                    f"    const res = await request(app).{r.method.lower()}('{r.route}').set('Authorization', 'Bearer user-token');\n"
                    f"    expect(res.status).toBe(403);\n"
                    f"  }});\n"
                    f"}});"
                )
            ))

        # 3. Cross-file impact remediations
        for c in ast_data.get("cross_file_impacts", []):
            vuln_id = f"AST-DESYNC-{c.source_file.replace('/', '_')}"
            vulns.append(Vulnerability(
                id=vuln_id,
                rule_id="CROSS_FILE_SCHEMA_DESYNC",
                title=f"Cross-File Breaking Change: {c.symbol}",
                severity=c.severity,
                cwe_id="CWE-710",
                owasp_category="A04:2021-Insecure Design",
                file=c.target_file,
                line_start=1,
                line_end=5,
                description=c.description,
                impact="Runtime ReferenceError / TypeError or corrupted data ingestion across microservices/modules.",
                confidence=0.94
            ))

        # Determine overall risk
        has_critical = any(v.severity == SeverityEnum.CRITICAL for v in vulns)
        has_high = any(v.severity == SeverityEnum.HIGH for v in vulns)
        overall_risk = "CRITICAL" if has_critical else ("HIGH" if has_high else ("MEDIUM" if vulns else "LOW"))

        exec_summary = (
            f"Automated AI DevSecOps review completed across {len(files)} files. "
            f"Detected {len(vulns)} high-signal vulnerability findings, {len(secrets)} intercepted secrets, "
            f"and {len(rbac_issues)} authorization logic bypasses."
        )

        return {
            "overall_risk": overall_risk,
            "executive_summary": exec_summary,
            "vulnerabilities": vulns,
            "remediations": remediations,
            "ai_engine_used": "Deterministic Rule & AST Heuristic Engine (Offline Resilient)"
        }
