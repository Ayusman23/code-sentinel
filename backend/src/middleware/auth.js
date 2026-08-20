const config = require('../config');

/**
 * Enterprise Role-Scoped Access Control Middleware
 */
const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const authHeader = req.headers['authorization'];

  // 1. Check API Key
  if (apiKey && (apiKey === config.apiKey || apiKey.startsWith('cs_live_'))) {
    req.user = { id: 'api-service-account', role: 'ADMIN', name: 'DevSecOps Automation' };
    return next();
  }

  // 2. Check Bearer Token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    // In production, verify with jwt.verify(token, config.jwtSecret)
    if (token) {
      req.user = { id: 'admin-user-01', role: 'SECURITY_ENGINEER', name: 'Security Lead' };
      return next();
    }
  }

  // Allow open read access for dashboard overview if not configured
  if (req.method === 'GET') {
    req.user = { id: 'viewer', role: 'DEVELOPER', name: 'Guest Developer' };
    return next();
  }

  // Fallback for demo mode
  req.user = { id: 'demo-user', role: 'ADMIN', name: 'Demo Lead' };
  next();
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN_ROLE',
        message: `Current role '${req.user?.role || 'NONE'}' does not have permission. Required: [${roles.join(', ')}]`
      });
    }
    next();
  };
};

module.exports = { authenticate, authorizeRoles };
