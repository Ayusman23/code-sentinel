const jobQueue = require('../services/jobQueue');

/**
 * Sub-Second Event-Driven GitHub Webhook Controller
 */
const handleGitHubWebhook = async (req, res) => {
  const event = req.headers['x-github-event'] || req.gitHubEvent || 'pull_request';
  const deliveryId = req.headers['x-github-delivery'] || req.deliveryId || `del_${Date.now()}`;
  const payload = req.body;

  console.log(`[Webhook] Ingested GitHub Event '${event}' (Delivery ID: ${deliveryId})`);

  // Handle ping event
  if (event === 'ping') {
    return res.status(200).json({
      message: 'GitHub webhook ping acknowledged. CodeSentinel gateway is operational.',
      zen: payload.zen
    });
  }

  // Only process pull_request events
  if (event !== 'pull_request') {
    return res.status(200).json({
      message: `Event '${event}' acknowledged but ignored. CodeSentinel actively reviews 'pull_request' events.`
    });
  }

  const action = payload.action;
  const validActions = ['opened', 'synchronize', 'reopened', 'review_requested'];

  if (!validActions.includes(action)) {
    return res.status(200).json({
      message: `PR Action '${action}' ignored. Triage monitors: [${validActions.join(', ')}]`
    });
  }

  const pr = payload.pull_request;
  const repo = payload.repository;

  if (!pr || !repo) {
    return res.status(400).json({
      error: 'MALFORMED_PAYLOAD',
      message: 'Missing pull_request or repository payload object.'
    });
  }

  // Construct job payload
  const jobPayload = {
    repoOwner: repo.owner.login || repo.owner.name,
    repoName: repo.name,
    prNumber: pr.number,
    title: pr.title,
    author: pr.user?.login || 'developer',
    baseBranch: pr.base?.ref || 'main',
    headBranch: pr.head?.ref || 'feature',
    headSha: pr.head?.sha || '',
    files: payload.mock_files || [], // Support for simulator mock files
    context: {
      repo_name: repo.full_name,
      branch: pr.base?.ref || 'main',
      frameworks: ['Express', 'Node.js', 'React'],
      test_framework: 'jest'
    }
  };

  // Enqueue job asynchronously
  const job = jobQueue.enqueuePRReview(jobPayload);

  // Return non-blocking 202 Accepted in sub-50ms
  return res.status(202).json({
    status: 'ACCEPTED',
    message: `PR #${pr.number} for ${repo.full_name} accepted for asynchronous AI DevSecOps review.`,
    jobId: job.jobId,
    enqueuedAt: job.enqueuedAt,
    deliveryId
  });
};

module.exports = { handleGitHubWebhook };
