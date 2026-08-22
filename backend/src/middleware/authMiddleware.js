const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const { inMemoryStore } = require('../config/database');

const ROLE_PERMISSIONS = {
  ADMIN: ['TRIGGER_WEBHOOK', 'EXECUTE_SANDBOX', 'EXPORT_AUDIT', 'VIEW_ALL_REVIEWS', 'MANAGE_POLICIES', 'THREAT_MODEL', 'VIEW_REMEDIATIONS', 'COPY_PATCHES'],
  SECURITY_ENGINEER: ['EXECUTE_SANDBOX', 'EXPORT_AUDIT', 'VIEW_ALL_REVIEWS', 'THREAT_MODEL', 'VIEW_REMEDIATIONS', 'COPY_PATCHES'],
  DEVELOPER: ['VIEW_ALL_REVIEWS', 'VIEW_REMEDIATIONS', 'COPY_PATCHES']
};

/**
 * JWT Verification Middleware
 * Validates Bearer token from Authorization header and attaches user context to req.user
 */
const verifyJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authentication token is required to access this resource.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Find in MongoDB or fallback to inMemoryStore
    let user = await User.findById(decoded.userId).select('-password').catch(() => null);
    if (!user && decoded.email) {
      user = inMemoryStore.users.get(decoded.email);
    }

    if (!user) {
      // Use decoded token payload if user record lookup is not accessible
      user = {
        _id: decoded.userId,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
        department: decoded.department || 'Engineering'
      };
    }

    req.user = {
      userId: user._id?.toString() || decoded.userId,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      permissions: ROLE_PERMISSIONS[user.role] || []
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'TOKEN_EXPIRED',
        message: 'Your session has expired. Please sign in again.'
      });
    }
    return res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Cryptographic signature verification failed on provided session token.'
    });
  }
};

/**
 * Role-Based Access Control Guard
 * @param {string[]} allowedRoles Array of roles authorized to invoke route (e.g. ['ADMIN', 'SECURITY_ENGINEER'])
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `Insufficient clearance. Active role '${req.user.role}' is not authorized for this operation. Required: [${allowedRoles.join(', ')}]`
      });
    }

    next();
  };
};

/**
 * Permission-Based Access Control Guard
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication required.'
      });
    }

    const userPermissions = req.user.permissions || [];
    if (!userPermissions.includes(permission) && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `Permission denied. Required permission '${permission}' not granted for role '${req.user.role}'.`
      });
    }

    next();
  };
};

module.exports = {
  verifyJWT,
  requireRole,
  requirePermission,
  ROLE_PERMISSIONS
};
