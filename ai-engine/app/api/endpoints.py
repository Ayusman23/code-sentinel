import time
import logging
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any

from app.models.schemas import (
    DiffAnalysisRequest, DiffAnalysisResponse, SecurityScanRequest,
    BlastRadiusScore, ScanStatusEnum, SeverityEnum, FileDiff
)
from app.core.secret_scrubber import SecretScrubber
from app.core.ast_engine import ASTContextEngine
from app.core.rbac_verifier import RBACVerifier
from app.core.blast_radius import BlastRadiusCalculator
from app.core.noise_filter import NoiseFilter
from app.core.gemini_orchestrator import GeminiOrchestrator
from app.config import get_settings, Settings

logger = logging.getLogger("codesentinel.api")
router = APIRouter()

# Global orchestrator instance
gemini_orchestrator = GeminiOrchestrator()

@router.post("/analyze-diff", response_model=DiffAnalysisResponse)
async def analyze_diff(
    request: DiffAnalysisRequest,
    settings: Settings = Depends(get_settings)
) -> DiffAnalysisResponse:
    """
    Comprehensive End-to-End Pull Request Analysis:
    1. Sub-Millisecond In-Flight Secret Interception & Sanitization
    2. Cross-File Contextual AST Traversal
    3. Deterministic RBAC & Logic Verification
    4. Architectural Blast-Radius Scoring
    5. Gemini LLM Reasoning & Test-Compliant Remediation Generation
    6. High-Signal Noise Suppression
    """
    start_time = time.perf_counter()

    try:
        # Step 1: Sub-millisecond Secret Interception across all files
        all_intercepted_secrets = []
        sanitized_diffs = {}
        for file in request.files:
            sanitized_patch, findings, _ = SecretScrubber.scrub(
                text=file.patch,
                filename=file.filename,
                min_entropy=settings.SECRET_ENTROPY_THRESHOLD
            )
            sanitized_diffs[file.filename] = sanitized_patch
            all_intercepted_secrets.extend(findings)

        # Step 2: Contextual AST Traversal & Cross-file Mapping
        ast_data = ASTContextEngine.analyze_diffs(request.files, request.context)
        cross_file_impacts = ast_data.get("cross_file_impacts", [])

        # Step 3: Deterministic RBAC & Logic Verification
        rbac_issues, rbac_vulns = RBACVerifier.verify(request.files)

        # Step 4: Architectural Blast-Radius Scoring
        blast_radius = BlastRadiusCalculator.calculate(
            files=request.files,
            rbac_issues=rbac_issues,
            cross_file_impacts=cross_file_impacts
        )

        # Step 5: Gemini LLM Orchestration with AST & Sanitized Diff context
        gemini_result = await gemini_orchestrator.analyze(
            files=request.files,
            sanitized_diffs=sanitized_diffs,
            ast_data=ast_data,
            rbac_issues=rbac_issues,
            secrets=all_intercepted_secrets,
            context=request.context
        )

        # Combine vulnerabilities
        all_vulns = gemini_result.get("vulnerabilities", []) + rbac_vulns

        # Step 6: High-Signal Noise Suppression (Filter out formatting/style false positives)
        filtered_vulns, noise_stats = NoiseFilter.filter_vulnerabilities(all_vulns)

        # Merge Remediations
        remediations = gemini_result.get("remediations", [])

        elapsed_ms = (time.perf_counter() - start_time) * 1000

        # Compute combined overall risk
        overall_risk_str = gemini_result.get("overall_risk", "HIGH")
        if any(v.severity == SeverityEnum.CRITICAL for v in filtered_vulns) or blast_radius.risk_level == SeverityEnum.CRITICAL:
            overall_risk = SeverityEnum.CRITICAL
        elif any(v.severity == SeverityEnum.HIGH for v in filtered_vulns) or blast_radius.risk_level == SeverityEnum.HIGH:
            overall_risk = SeverityEnum.HIGH
        elif any(v.severity == SeverityEnum.MEDIUM for v in filtered_vulns):
            overall_risk = SeverityEnum.MEDIUM
        else:
            overall_risk = SeverityEnum.LOW

        return DiffAnalysisResponse(
            status=ScanStatusEnum.COMPLETED,
            overall_risk=overall_risk,
            blast_radius=blast_radius,
            secrets_intercepted=all_intercepted_secrets,
            vulnerabilities=filtered_vulns,
            rbac_issues=rbac_issues,
            cross_file_impacts=cross_file_impacts,
            remediations=remediations,
            noise_suppression_stats=noise_stats,
            executive_summary=gemini_result.get("executive_summary", "Security analysis successfully finalized."),
            execution_time_ms=round(elapsed_ms, 2),
            ai_engine_used=gemini_result.get("ai_engine_used", "CodeSentinel Core Engine")
        )

    except Exception as e:
        logger.error(f"Error during diff analysis: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"AI Engine Analysis Error: {str(e)}")

@router.post("/security-scan")
async def security_scan(request: SecurityScanRequest) -> Dict[str, Any]:
    """
    Lightweight targeted scan on arbitrary code snippet or diff hunk.
    """
    file_diff = FileDiff(
        filename=request.filename or "snippet.ts",
        patch=request.code_or_diff,
        additions=len(request.code_or_diff.splitlines()),
        deletions=0
    )
    
    full_req = DiffAnalysisRequest(
        title="Security Sandbox Scan",
        author="security-engineer",
        files=[file_diff],
        context=request.context
    )
    
    res = await analyze_diff(full_req, get_settings())
    return res.dict()

@router.post("/blast-radius", response_model=BlastRadiusScore)
async def compute_blast_radius(request: DiffAnalysisRequest) -> BlastRadiusScore:
    """
    Directly computes the architectural blast radius score for a set of file diffs.
    """
    ast_data = ASTContextEngine.analyze_diffs(request.files, request.context)
    rbac_issues, _ = RBACVerifier.verify(request.files)
    return BlastRadiusCalculator.calculate(
        files=request.files,
        rbac_issues=rbac_issues,
        cross_file_impacts=ast_data.get("cross_file_impacts", [])
    )
