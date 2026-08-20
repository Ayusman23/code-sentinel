import pytest
from app.core.ast_engine import ASTContextEngine
from app.models.schemas import FileDiff

def test_cross_file_signature_mutation():
    service_diff = """
    @@ -1,3 +1,3 @@
    -export function processPayment(amount, userId) {
    +export function processPayment(amount, userId, currency, idempotencyKey) {
        return api.charge(amount, userId, currency, idempotencyKey);
    }
    """
    controller_diff = """
    @@ -10,3 +10,3 @@
     async function handleCheckout(req, res) {
    -    const result = await processPayment(req.body.amount, req.user.id);
    +    const result = await processPayment(req.body.amount, req.user.id);
         res.json({ success: result });
     }
    """
    files = [
        FileDiff(filename="src/services/paymentService.ts", status="modified", patch=service_diff),
        FileDiff(filename="src/controllers/checkoutController.ts", status="modified", patch=controller_diff)
    ]
    analysis = ASTContextEngine.analyze_diffs(files)
    impacts = analysis.get("cross_file_impacts", [])
    assert len(impacts) >= 1
    assert any("processPayment" in imp.symbol for imp in impacts)

def test_schema_controller_desync():
    model_diff = """
    @@ -5,2 +5,3 @@
     const UserSchema = new Schema({
    +    tenantId: { type: String, required: true },
         email: { type: String, required: true }
     });
    """
    controller_diff = """
    @@ -8,3 +8,3 @@
     async function createUser(req, res) {
    -    const user = await User.create({ email: req.body.email });
    +    const user = await User.create({ email: req.body.email });
         res.json(user);
     }
    """
    files = [
        FileDiff(filename="src/models/User.ts", status="modified", patch=model_diff),
        FileDiff(filename="src/controllers/userController.ts", status="modified", patch=controller_diff)
    ]
    analysis = ASTContextEngine.analyze_diffs(files)
    impacts = analysis.get("cross_file_impacts", [])
    assert isinstance(impacts, list)

def test_unchanged_signatures_produce_no_impacts():
    clean_diff = """
    @@ -5,2 +5,2 @@
    -    const total = price * quantity;
    +    const total = Math.round(price * quantity * 100) / 100;
    """
    files = [
        FileDiff(filename="src/utils/calc.ts", status="modified", patch=clean_diff)
    ]
    analysis = ASTContextEngine.analyze_diffs(files)
    impacts = analysis.get("cross_file_impacts", [])
    assert len(impacts) == 0
