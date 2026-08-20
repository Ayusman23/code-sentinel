import pytest
from app.models.schemas import FileDiff
from app.core.ast_engine import ASTContextEngine

def test_cross_file_signature_mutation():
    file1 = FileDiff(
        filename="src/services/payment.ts",
        patch="""
        -export function processPayment(amount, token)
        +export function processPayment(amount, token, currency, idempotencyKey)
        """
    )
    file2 = FileDiff(
        filename="src/controllers/checkout.ts",
        patch="""
        import { processPayment } from '../services/payment';
        const result = processPayment(total, userToken);
        """
    )
    
    result = ASTContextEngine.analyze_diffs([file1, file2])
    impacts = result["cross_file_impacts"]
    
    assert len(impacts) >= 1
    assert impacts[0].symbol == "processPayment"
    assert impacts[0].target_file == "src/controllers/checkout.ts"
    assert "INTERFACE_CONTRACT_MUTATION" == impacts[0].impact_type

def test_schema_controller_desync():
    model_file = FileDiff(
        filename="src/models/User.ts",
        patch="""
        const UserSchema = new Schema({
        +  organizationId: { type: String, required: true },
        +  mfaSecret: { type: String, required: true }
        });
        """
    )
    controller_file = FileDiff(
        filename="src/controllers/userController.ts",
        patch="""
        export async function createUser(req, res) {
          const user = new User({ email: req.body.email });
          await user.save();
        }
        """
    )

    result = ASTContextEngine.analyze_diffs([model_file, controller_file])
    impacts = result["cross_file_impacts"]
    assert any(i.impact_type == "SCHEMA_BREAK" for i in impacts)
