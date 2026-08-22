const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../config');
const { inMemoryStore } = require('../config/database');
const { ROLE_PERMISSIONS } = require('../middleware/authMiddleware');
const { DEMO_USERS } = require('../config/seedData');

// Generate JWT token helper
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id || user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department
    },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
};

/**
 * Standard Email / Password Login
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'Email and password are required.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = null;

    // 1. If MongoDB is connected, search in database
    if (mongoose.connection.readyState === 1) {
      user = await User.findOne({ email: normalizedEmail }).catch(() => null);
    }

    // 2. Fallback to inMemoryStore
    if (!user) {
      user = inMemoryStore.users.get(normalizedEmail);
    }

    // 3. Fallback to seeded demo list
    if (!user) {
      const demoMatch = DEMO_USERS.find(u => u.email.toLowerCase() === normalizedEmail);
      if (demoMatch && password === demoMatch.password) {
        const hashedPassword = await bcrypt.hash(demoMatch.password, 10);
        user = {
          _id: `user_${demoMatch.role.toLowerCase()}_fallback`,
          email: demoMatch.email,
          password: hashedPassword,
          name: demoMatch.name,
          role: demoMatch.role,
          department: demoMatch.department,
          isDemo: true
        };
      }
    }

    if (!user) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'No account found with this email address.'
      });
    }

    // Verify Password
    let isMatch = false;
    if (typeof user.comparePassword === 'function') {
      isMatch = await user.comparePassword(password);
    } else {
      isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch && password === 'demo1234' && user.isDemo) {
        isMatch = true;
      }
    }

    if (!isMatch) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid password. Please check your credentials.'
      });
    }

    const token = generateToken(user);
    const permissions = ROLE_PERMISSIONS[user.role] || [];

    return res.json({
      status: 'AUTHENTICATED',
      token,
      user: {
        id: user._id || user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        isDemo: Boolean(user.isDemo),
        permissions
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 1-Click Quick Demo Login (Admin, Security Engineer, Developer)
 */
exports.demoLogin = async (req, res, next) => {
  try {
    const { role } = req.body;
    const targetRole = (role || 'ADMIN').toUpperCase();

    const demoTemplate = DEMO_USERS.find(u => u.role === targetRole) || DEMO_USERS[0];
    let user = null;

    if (mongoose.connection.readyState === 1) {
      user = await User.findOne({ email: demoTemplate.email }).catch(() => null);
    }

    if (!user) {
      user = inMemoryStore.users.get(demoTemplate.email);
    }

    if (!user) {
      user = {
        _id: `user_${demoTemplate.role.toLowerCase()}_direct`,
        email: demoTemplate.email,
        name: demoTemplate.name,
        role: demoTemplate.role,
        department: demoTemplate.department,
        isDemo: true
      };
    }

    const token = generateToken(user);
    const permissions = ROLE_PERMISSIONS[user.role] || [];

    return res.json({
      status: 'AUTHENTICATED',
      token,
      user: {
        id: user._id || user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        isDemo: true,
        permissions
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validate and return current session profile
 */
exports.getMe = async (req, res) => {
  return res.json({
    status: 'VALID',
    user: req.user
  });
};
