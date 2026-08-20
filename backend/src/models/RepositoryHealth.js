const mongoose = require('mongoose');

const RepositoryHealthSchema = new mongoose.Schema({
  repoOwner: { type: String, required: true },
  repoName: { type: String, required: true },
  fullName: { type: String, required: true, unique: true, index: true },
  healthScore: { type: Number, default: 85, min: 0, max: 100 },
  totalReviewsCount: { type: Number, default: 0 },
  criticalIssuesBlockedCount: { type: Number, default: 0 },
  secretsNeutralizedCount: { type: Number, default: 0 },
  averageBlastRadius: { type: Number, default: 28 },
  averageLatencyMs: { type: Number, default: 850 },
  lastScannedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('RepositoryHealth', RepositoryHealthSchema);
