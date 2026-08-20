const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  eventType: {
    type: String,
    enum: [
      'WEBHOOK_INGESTED',
      'SECRET_INTERCEPTED',
      'AST_TRAVERSAL_COMPLETED',
      'RBAC_VERIFIED',
      'BLAST_RADIUS_COMPUTED',
      'GEMINI_INFERENCE',
      'GITHUB_CHECK_POSTED',
      'REMEDIATION_APPLIED',
      'CIRCUIT_BREAKER_TRIGGERED'
    ],
    required: true,
    index: true
  },
  actor: { type: String, default: 'CodeSentinel System' },
  repository: { type: String, default: 'unknown/repo', index: true },
  prNumber: { type: Number },
  status: { type: String, enum: ['SUCCESS', 'WARNING', 'FAILURE', 'INFO'], default: 'SUCCESS' },
  latencyMs: { type: Number, default: 0 },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now, index: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
