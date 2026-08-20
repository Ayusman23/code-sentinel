import pytest
from app.core.rbac_verifier import RBACVerifier
from app.models.schemas import FileDiff

def test_missing_auth_on_mutating_endpoint():
    diff = """
    + router.post('/api/admin/users/delete', async (req, res) => {
    +   await User.deleteMany({ _id: { $in: req.body.ids } });
    +   res.send({ status: 'deleted' });
    + });
    """
    file_diff = FileDiff(filename="src/routes/adminRoutes.js", status="modified", patch=diff)
    issues, vulns = RBACVerifier.verify([file_diff])
    assert len(issues) >= 1 or len(vulns) >= 1
    assert any("AUTH" in issue.issue_type.upper() or "MUTATING" in issue.issue_type.upper() for issue in issues) or any("CWE-306" in v.cwe_id for v in vulns)

def test_privilege_escalation_detection():
    diff = """
    + router.put('/api/users/profile', authMiddleware, async (req, res) => {
    +   const user = await User.findById(req.user.id);
    +   user.role = req.body.role;
    +   await user.save();
    +   res.send(user);
    + });
    """
    file_diff = FileDiff(filename="src/routes/userRoutes.js", status="modified", patch=diff)
    issues, vulns = RBACVerifier.verify([file_diff])
    assert len(issues) >= 1 or len(vulns) >= 1
    assert any("PRIVILEGE" in issue.issue_type.upper() or "ROLE" in issue.issue_type.upper() for issue in issues) or any("CWE-915" in v.cwe_id or "CWE-269" in v.cwe_id for v in vulns)

def test_protected_route_with_proper_guards_passes():
    diff = """
    + router.post('/api/orders/refund', authenticate, requireRole('FINANCE_ADMIN'), async (req, res) => {
    +   const order = await Order.findOne({ _id: req.body.orderId, tenantId: req.user.tenantId });
    +   if (!order) return res.status(404).send();
    +   await refundBridge.process(order);
    +   res.send({ status: 'refunded' });
    + });
    """
    file_diff = FileDiff(filename="src/routes/orderRoutes.js", status="modified", patch=diff)
    issues, vulns = RBACVerifier.verify([file_diff])
    assert not any("MISSING_AUTH" in issue.issue_type for issue in issues)
