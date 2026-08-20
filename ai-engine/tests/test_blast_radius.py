import pytest
from app.core.blast_radius import BlastRadiusCalculator
from app.models.schemas import FileDiff, RBACIssue, SeverityEnum

def test_blast_radius_core_versus_leaf():
    core_diff = """
    + function dispatchAuthToken() { ... }
    """
    files_core = [
        FileDiff(filename="src/config/auth/kernel.ts", status="modified", patch=core_diff, additions=100, deletions=50)
    ]
    score_core = BlastRadiusCalculator.calculate(
        files=files_core,
        rbac_issues=[
            RBACIssue(
                route="/kernel",
                method="POST",
                file="src/config/auth/kernel.ts",
                line=1,
                issue_type="AUTH",
                description="Core auth",
                remediation_advice="Add auth guard",
                severity=SeverityEnum.CRITICAL
            )
        ],
        cross_file_impacts=[]
    )
    
    leaf_diff = """
    + const label = "Submit Form";
    """
    files_leaf = [
        FileDiff(filename="src/components/Footer.tsx", status="modified", patch=leaf_diff, additions=2, deletions=1)
    ]
    score_leaf = BlastRadiusCalculator.calculate(files=files_leaf, rbac_issues=[], cross_file_impacts=[])
    
    assert score_core.overall_score > score_leaf.overall_score
    assert score_core.risk_level in [SeverityEnum.MEDIUM, SeverityEnum.HIGH, SeverityEnum.CRITICAL]

def test_blast_radius_zero_diff_returns_clean():
    files = [
        FileDiff(filename="README.md", status="modified", patch="", additions=0, deletions=0)
    ]
    score = BlastRadiusCalculator.calculate(files=files, rbac_issues=[], cross_file_impacts=[])
    assert score.overall_score < 20

def test_blast_radius_multi_axis_factors():
    diff = """
    + router.post('/api/charge', async (req, res) => {
    +   if (req.body.isVip) {
    +     while (retries < 5) {
    +       try { await chargeUser(); } catch(e) {}
    +     }
    +   }
    + });
    """
    files = [
        FileDiff(filename="src/api/billing/chargeEngine.ts", status="modified", patch=diff, additions=30, deletions=5)
    ]
    score = BlastRadiusCalculator.calculate(files=files, rbac_issues=[], cross_file_impacts=[])
    assert score.breakdown.dependency_depth_score > 0
    assert score.breakdown.cyclomatic_delta > 0
    assert len(score.affected_components) >= 1
