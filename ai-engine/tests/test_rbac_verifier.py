import pytest
from app.models.schemas import FileDiff, SeverityEnum
from app.core.rbac_verifier import RBACVerifier

def test_missing_auth_on_mutating_endpoint():
    diff = FileDiff(
        filename="src/routes/adminRoutes.js",
        patch="""
        + router.delete('/api/admin/flush-database', async (req, res) => {
        +   await db.drop();
        +   res.send({ success: true });
        + });
        """
    )
    issues, vulns = RBACVerifier.verify([diff])
    assert len(issues) >= 1
    assert issues[0].issue_type == "MISSING_AUTH_MIDDLEWARE"
    assert issues[0].severity == SeverityEnum.CRITICAL

def test_privilege_escalation_detection():
    diff = FileDiff(
        filename="src/controllers/user.js",
        patch="""
        + export async function updateProfile(req, res) {
        +   const user = await User.findById(req.user.id);
        +   user.role = req.body.role;
        +   await user.save();
        + }
        """
    )
    issues, vulns = RBACVerifier.verify([diff])
    assert any(i.issue_type == "PRIVILEGE_ESCALATION" for i in issues)
    assert any(v.cwe_id == "CWE-915" for v in vulns)
