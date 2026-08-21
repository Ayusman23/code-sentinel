const mongoose = require('mongoose');
const SecurityVulnerabilitySchema = require('./SecurityVulnerability');

const RBACIssueSchema = new mongoose.Schema({
  route: { type: String, required: true, trim: true },
  method: { type: String, required: true, uppercase: true, trim: true },
  file: { type: String, required: true, trim: true },
  line: { type: Number, required: true, min: 1 },
  issueType: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  severity: { type: String, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], default: 'HIGH' },
  remediationAdvice: { type: String, required: true }
}, { _id: false, strict: true });

const CrossFileImpactSchema = new mongoose.Schema({
  sourceFile: { type: String, required: true, trim: true },
  targetFile: { type: String, required: true, trim: true },
  impactType: { type: String, required: true, trim: true },
  symbol: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  severity: { type: String, default: 'HIGH' }
}, { _id: false, strict: true });

const SecretInterceptionSchema = new mongoose.Schema({
  ruleId: { type: String, required: true, trim: true },
  secretType: { type: String, required: true, trim: true },
  file: { type: String, required: true, trim: true },
  line: { type: Number, required: true, min: 1 },
  rawMatchedHash: { type: String, required: true, trim: true },
  entropyScore: { type: Number, required: true },
  isLiveRisk: { type: Boolean, default: true },
  redactedPreview: { type: String, required: true, trim: true }
}, { _id: false, strict: true });

const RemediationSchema = new mongoose.Schema({
  id: { type: String, required: true, trim: true },
  vulnerabilityId: { type: String, trim: true },
  file: { type: String, required: true, trim: true },
  lineStart: { type: Number, required: true, min: 1 },
  lineEnd: { type: Number, required: true, min: 1 },
  originalCode: { type: String, default: '' },
  suggestedCode: { type: String, required: true },
  githubMarkdownSuggestion: { type: String, required: true },
  explanation: { type: String, required: true },
  testVerificationSnippet: { type: String, default: '' }
}, { _id: false, strict: true });

const PRReviewSchema = new mongoose.Schema({
  prId: { type: String, required: true, index: true, trim: true },
  deliveryId: { type: String, index: true, sparse: true, trim: true },
  repoOwner: { type: String, required: true, index: true, trim: true },
  repoName: { type: String, required: true, index: true, trim: true },
  prNumber: { type: Number, required: true, index: true, min: 1 },
  title: { type: String, required: true, trim: true },
  author: { type: String, default: 'developer', trim: true },
  baseBranch: { type: String, default: 'main', trim: true },
  headBranch: { type: String, default: 'feature', trim: true },
  headSha: { type: String, default: '', trim: true },
  
  status: {
    type: String,
    enum: ['QUEUED', 'ANALYZING', 'COMPLETED', 'FAILED'],
    default: 'QUEUED',
    index: true
  },
  
  overallRisk: {
    type: String,
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'CLEAN'],
    default: 'LOW',
    index: true
  },
  
  blastRadius: {
    overallScore: { type: Number, default: 0, min: 0, max: 100 },
    riskLevel: { type: String, default: 'LOW' },
    affectedComponents: [{ type: String, trim: true }],
    breakdown: {
      dependencyDepthScore: { type: Number, default: 0, min: 0, max: 100 },
      apiSurfaceScore: { type: Number, default: 0, min: 0, max: 100 },
      dataMutationScore: { type: Number, default: 0, min: 0, max: 100 },
      rbacExposureScore: { type: Number, default: 0, min: 0, max: 100 },
      cyclomaticDelta: { type: Number, default: 0 }
    },
    summary: { type: String, default: '' }
  },

  filesAnalyzedCount: { type: Number, default: 0, min: 0 },
  filteredOutFilesCount: { type: Number, default: 0, min: 0 },
  secretsIntercepted: [SecretInterceptionSchema],
  vulnerabilities: [SecurityVulnerabilitySchema],
  rbacIssues: [RBACIssueSchema],
  crossFileImpacts: [CrossFileImpactSchema],
  remediations: [RemediationSchema],
  
  noiseSuppressionStats: {
    totalRulesEvaluated: { type: Number, default: 0 },
    suppressedStylisticAlerts: { type: Number, default: 0 },
    retainedHighSignalFindings: { type: Number, default: 0 },
    signalRatioPercentage: { type: Number, default: 100, min: 0, max: 100 }
  },

  executiveSummary: { type: String, default: '' },
  executionTimeMs: { type: Number, default: 0, min: 0 },
  aiEngineUsed: { type: String, default: 'CodeSentinel Hybrid Engine' },
  githubCheckRunId: { type: String, default: '' },
  commentsPostedCount: { type: Number, default: 0, min: 0 },
  errorMessage: { type: String, default: null }
}, {
  timestamps: true,
  strict: true
});

PRReviewSchema.index({ repoOwner: 1, repoName: 1, prNumber: 1 });
PRReviewSchema.index({ createdAt: -1 });

module.exports = mongoose.model('PRReview', PRReviewSchema);
