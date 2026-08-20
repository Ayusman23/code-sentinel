const mongoose = require('mongoose');

const VulnerabilitySchema = new mongoose.Schema({
  id: { type: String, required: true },
  ruleId: { type: String, required: true },
  title: { type: String, required: true },
  severity: { type: String, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'], required: true },
  cweId: { type: String, default: 'CWE-693' },
  owaspCategory: { type: String, default: 'A01:2021-Broken Access Control' },
  file: { type: String, required: true },
  lineStart: { type: Number, required: true },
  lineEnd: { type: Number, required: true },
  description: { type: String, required: true },
  impact: { type: String, required: true },
  confidence: { type: Number, default: 0.95 }
}, { _id: false });

const RBACIssueSchema = new mongoose.Schema({
  route: { type: String, required: true },
  method: { type: String, required: true },
  file: { type: String, required: true },
  line: { type: Number, required: true },
  issueType: { type: String, required: true },
  description: { type: String, required: true },
  severity: { type: String, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], default: 'HIGH' },
  remediationAdvice: { type: String, required: true }
}, { _id: false });

const CrossFileImpactSchema = new mongoose.Schema({
  sourceFile: { type: String, required: true },
  targetFile: { type: String, required: true },
  impactType: { type: String, required: true },
  symbol: { type: String, required: true },
  description: { type: String, required: true },
  severity: { type: String, default: 'HIGH' }
}, { _id: false });

const SecretInterceptionSchema = new mongoose.Schema({
  ruleId: { type: String, required: true },
  secretType: { type: String, required: true },
  file: { type: String, required: true },
  line: { type: Number, required: true },
  rawMatchedHash: { type: String, required: true },
  entropyScore: { type: Number, required: true },
  isLiveRisk: { type: Boolean, default: true },
  redactedPreview: { type: String, required: true }
}, { _id: false });

const RemediationSchema = new mongoose.Schema({
  id: { type: String, required: true },
  vulnerabilityId: { type: String },
  file: { type: String, required: true },
  lineStart: { type: Number, required: true },
  lineEnd: { type: Number, required: true },
  originalCode: { type: String, default: '' },
  suggestedCode: { type: String, required: true },
  githubMarkdownSuggestion: { type: String, required: true },
  explanation: { type: String, required: true },
  testVerificationSnippet: { type: String, default: '' }
}, { _id: false });

const PRReviewSchema = new mongoose.Schema({
  prId: { type: String, required: true, index: true },
  repoOwner: { type: String, required: true, index: true },
  repoName: { type: String, required: true, index: true },
  prNumber: { type: Number, required: true, index: true },
  title: { type: String, required: true },
  author: { type: String, default: 'developer' },
  baseBranch: { type: String, default: 'main' },
  headBranch: { type: String, default: 'feature' },
  headSha: { type: String, default: '' },
  
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
    overallScore: { type: Number, default: 0 },
    riskLevel: { type: String, default: 'LOW' },
    affectedComponents: [{ type: String }],
    breakdown: {
      dependencyDepthScore: { type: Number, default: 0 },
      apiSurfaceScore: { type: Number, default: 0 },
      dataMutationScore: { type: Number, default: 0 },
      rbacExposureScore: { type: Number, default: 0 },
      cyclomaticDelta: { type: Number, default: 0 }
    },
    summary: { type: String, default: '' }
  },

  filesAnalyzedCount: { type: Number, default: 0 },
  secretsIntercepted: [SecretInterceptionSchema],
  vulnerabilities: [VulnerabilitySchema],
  rbacIssues: [RBACIssueSchema],
  crossFileImpacts: [CrossFileImpactSchema],
  remediations: [RemediationSchema],
  
  noiseSuppressionStats: {
    totalRulesEvaluated: { type: Number, default: 0 },
    suppressedStylisticAlerts: { type: Number, default: 0 },
    retainedHighSignalFindings: { type: Number, default: 0 },
    signalRatioPercentage: { type: Number, default: 100 }
  },

  executiveSummary: { type: String, default: '' },
  executionTimeMs: { type: Number, default: 0 },
  aiEngineUsed: { type: String, default: 'CodeSentinel Hybrid Engine' },
  githubCheckRunId: { type: String, default: '' },
  commentsPostedCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

PRReviewSchema.index({ repoOwner: 1, repoName: 1, prNumber: 1 });

module.exports = mongoose.model('PRReview', PRReviewSchema);
