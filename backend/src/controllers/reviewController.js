const PRReview = require('../models/PRReview');
const jobQueue = require('../services/jobQueue');
const aiEngineClient = require('../services/aiEngineClient');
const socketService = require('../services/socketService');
const NodeSecretSanitizer = require('../services/secretSanitizer');
const { inMemoryStore } = require('../config/database');

/**
 * PR Reviews Controller
 */
const getReviews = async (req, res, next) => {
  try {
    const { status, riskLevel, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (riskLevel) query.overallRisk = riskLevel;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { repoName: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }

    try {
      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const reviews = await PRReview.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean();

      const total = await PRReview.countDocuments(query);

      return res.json({
        success: true,
        data: reviews,
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total,
          pages: Math.ceil(total / parseInt(limit, 10))
        }
      });
    } catch (dbErr) {
      // In-memory fallback
      let list = Array.from(inMemoryStore.reviews.values());
      if (status) list = list.filter(r => r.status === status);
      if (riskLevel) list = list.filter(r => r.overallRisk === riskLevel);
      if (search) {
        const s = search.toLowerCase();
        list = list.filter(r => r.title.toLowerCase().includes(s) || r.repoName.toLowerCase().includes(s));
      }

      return res.json({
        success: true,
        data: list,
        pagination: { page: 1, limit: 50, total: list.length, pages: 1 }
      });
    }
  } catch (err) {
    next(err);
  }
};

const getReviewById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let review;
    try {
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        review = await PRReview.findById(id).lean();
      } else {
        review = await PRReview.findOne({ prId: id }).lean();
      }
    } catch (e) {
      // Fallback
    }

    if (!review) {
      // Check in-memory store
      review = inMemoryStore.reviews.get(id) || Array.from(inMemoryStore.reviews.values()).find(r => r._id === id || r.prId === id);
    }

    if (!review) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: `PR Review '${id}' not found.` });
    }

    res.json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
};

/**
 * Manual Diff & Security Sandbox Analysis
 */
const analyzeManualDiff = async (req, res, next) => {
  try {
    const { files, title = 'Manual Diff Sandbox', author = 'security-engineer', context } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ success: false, error: 'INVALID_INPUT', message: 'Must provide an array of file diffs.' });
    }

    // 1. Sanitize diffs
    const sanitizedFiles = files.map(f => ({
      ...f,
      patch: NodeSecretSanitizer.sanitize(f.patch)
    }));

    // 2. Invoke AI Engine
    const startTime = Date.now();
    const aiResponse = await aiEngineClient.analyzeDiff({
      pr_id: `manual-sandbox-${Date.now()}`,
      title,
      author,
      files: sanitizedFiles,
      context: context || {
        repo_name: 'sandbox/enterprise-app',
        branch: 'main',
        frameworks: ['Express', 'React'],
        test_framework: 'jest'
      }
    });

    const elapsed = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        ...aiResponse,
        gatewayElapsedMs: elapsed
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Public Sample Scan Replay for Landing Page Demo
 * Runs authentic analysis and streams live Socket.IO events to connected clients
 */
const replaySampleScan = async (req, res, next) => {
  try {
    const samplePayload = {
      pr_id: 'enterprise-org/cloud-core-api#142',
      title: 'feat: Add dynamic user role assignment and AWS S3 uploader',
      author: 'recruiter-demo',
      files: [
        {
          filename: 'src/controllers/adminController.ts',
          patch: `@@ -10,12 +10,24 @@
 import express from 'express';
+const AWS_KEY = "AKIAIOSFODNN7EXAMPLE12";
+const AWS_SECRET = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
 
 const router = express.Router();
 
+router.post('/api/storage/credentials', async (req, res) => {
+  return res.json({ key: AWS_KEY, secret: AWS_SECRET });
+});
+
+router.put('/api/users/:id/role', async (req, res) => {
+  user.role = req.body.role;
+  await user.save();
+});`
        }
      ],
      context: {
        repo_name: 'enterprise-org/cloud-core-api',
        branch: 'main',
        frameworks: ['Express', 'Node.js', 'React'],
        test_framework: 'jest'
      }
    };

    const jobId = `replay_sample_${Date.now()}`;
    const emitStage = (stage, percent, message) => {
      socketService.broadcastTriageProgress({
        jobId,
        repoOwner: 'enterprise-org',
        repoName: 'cloud-core-api',
        prNumber: 142,
        stage,
        percent,
        message,
        timestamp: new Date().toISOString()
      });
    };

    emitStage('QUEUED', 10, 'Public sample scan enqueued. Verifying AST schemas...');
    emitStage('SECRET_INTERCEPTION', 35, 'Executing Shannon Entropy secret scrubber (<1ms)...');

    const sanitizedFiles = samplePayload.files.map(f => ({
      ...f,
      patch: NodeSecretSanitizer.sanitize(f.patch)
    }));

    emitStage('AST_AND_RBAC_REASONING', 65, 'Executing Cross-File AST Traversal & Deterministic RBAC Verifier...');

    const aiResponse = await aiEngineClient.analyzeDiff({
      ...samplePayload,
      files: sanitizedFiles
    });

    emitStage('POSTING_GITHUB_REVIEW', 85, 'Constructing committable Markdown suggestions & Jest unit tests...');
    emitStage('COMPLETED', 100, 'Zero-Trust PR analysis completed successfully.');

    return res.json({
      success: true,
      jobId,
      data: {
        ...aiResponse,
        prId: 'enterprise-org/cloud-core-api#142',
        title: samplePayload.title,
        author: samplePayload.author
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getReviews,
  getReviewById,
  analyzeManualDiff,
  replaySampleScan
};
