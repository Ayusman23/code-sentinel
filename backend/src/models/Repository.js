const mongoose = require('mongoose');

/**
 * Strictly Typed Repository Schema
 * Manages GitHub App installation context, branch protections, and rolling health profiles.
 */
const RepositorySchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Repository full name is required (owner/repo)'],
    unique: true,
    index: true,
    trim: true
  },
  owner: {
    type: String,
    required: [true, 'Repository owner is required'],
    index: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Repository name is required'],
    trim: true
  },
  installationId: {
    type: Number,
    index: true,
    default: null
  },
  defaultBranch: {
    type: String,
    default: 'main'
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  healthScore: {
    type: Number,
    default: 85,
    min: 0,
    max: 100
  },
  totalReviewsCount: {
    type: Number,
    default: 0
  },
  criticalIssuesBlockedCount: {
    type: Number,
    default: 0
  },
  secretsNeutralizedCount: {
    type: Number,
    default: 0
  },
  averageBlastRadius: {
    type: Number,
    default: 20
  },
  averageLatencyMs: {
    type: Number,
    default: 350
  },
  lastScannedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  strict: true
});

RepositorySchema.index({ owner: 1, name: 1 });

module.exports = mongoose.model('Repository', RepositorySchema);
