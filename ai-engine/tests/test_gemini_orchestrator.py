import pytest
from app.core.gemini_orchestrator import GeminiOrchestrator
from app.models.schemas import FileDiff, RBACIssue, SecretInterceptionResult, SeverityEnum

@pytest.mark.asyncio
async def test_fallback_heuristic_generator_with_secret():
    orchestrator = GeminiOrchestrator()
    files = [
        FileDiff(
            filename="src/routes/payment.ts",
            status="modified",
            patch="+ const token = 'ghp_secret123456789012345678901234567890';"
        )
    ]
    secret = SecretInterceptionResult(
        rule_id="GITHUB_PAT",
        secret_type="GitHub Personal Access Token",
        file="src/routes/payment.ts",
        line=1,
        raw_matched_hash="sha256:abc",
        entropy_score=4.5,
        is_live_risk=True,
        redacted_preview="[REDACTED]"
    )
    result = await orchestrator.analyze(
        files=files,
        sanitized_diffs={"src/routes/payment.ts": files[0].patch},
        ast_data={},
        rbac_issues=[],
        secrets=[secret],
        context=None
    )
    assert "vulnerabilities" in result
    assert len(result["vulnerabilities"]) >= 1
    assert "remediations" in result
    assert len(result["remediations"]) >= 1
    assert "```suggestion" in result["remediations"][0].github_markdown_suggestion
