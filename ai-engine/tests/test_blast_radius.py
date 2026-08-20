import pytest
from app.models.schemas import FileDiff, RBACIssue, SeverityEnum
from app.core.blast_radius import BlastRadiusCalculator

def test_blast_radius_core_versus_leaf():
    core_diff = FileDiff(
        filename="src/middleware/auth.ts",
        patch="""
        + router.post('/api/auth/login', handler);
        + router.post('/api/auth/register', handler);
        + router.delete('/api/auth/session', handler);
        + if (condition1) {
        +   if (condition2) {
        +     doAction();
        +   }
        + }
        """
    )
    
    rbac_issue = RBACIssue(
        route="/api/auth/session",
        method="DELETE",
        file="src/middleware/auth.ts",
        line=4,
        issue_type="MISSING_AUTH_MIDDLEWARE",
        description="Auth missing",
        severity=SeverityEnum.CRITICAL,
        remediation_advice="Add auth"
    )

    score = BlastRadiusCalculator.calculate([core_diff], [rbac_issue], [])
    assert score.overall_score >= 30
    assert score.risk_level in [SeverityEnum.MEDIUM, SeverityEnum.HIGH, SeverityEnum.CRITICAL]
    assert score.breakdown.cyclomatic_delta >= 2
