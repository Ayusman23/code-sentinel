const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../config');
const { inMemoryStore } = require('../config/database');
const { ROLE_PERMISSIONS } = require('../middleware/authMiddleware');
const { DEMO_USERS } = require('../config/seedData');

// Email regex pattern for validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        error: 'INVALID_EMAIL',
        message: 'Please provide a valid email address.'
      });
    }

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
        avatar: user.avatar,
        authProvider: user.authProvider || 'local',
        isDemo: Boolean(user.isDemo),
        permissions
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Standard User Registration / Signup with Email & Password
 */
exports.register = async (req, res, next) => {
  try {
    const { email, password, name, role = 'DEVELOPER', department = 'Platform Engineering' } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'Name, email, and password are required for registration.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        error: 'INVALID_EMAIL',
        message: 'Please provide a valid corporate or personal email address (e.g. alex@company.com).'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'WEAK_PASSWORD',
        message: 'Password must be at least 6 characters in length.'
      });
    }

    const validRoles = ['ADMIN', 'SECURITY_ENGINEER', 'DEVELOPER'];
    const assignedRole = validRoles.includes(role?.toUpperCase()) ? role.toUpperCase() : 'DEVELOPER';

    // Check if user already exists
    let existingUser = null;
    if (mongoose.connection.readyState === 1) {
      existingUser = await User.findOne({ email: normalizedEmail }).catch(() => null);
    }
    if (!existingUser) {
      existingUser = inMemoryStore.users.get(normalizedEmail);
    }

    if (existingUser) {
      return res.status(409).json({
        error: 'USER_EXISTS',
        message: 'An account with this email address already exists. Please sign in.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    let newUser = {
      _id: userId,
      id: userId,
      email: normalizedEmail,
      password: hashedPassword,
      name: name.trim(),
      role: assignedRole,
      department: department.trim(),
      authProvider: 'local',
      isDemo: false,
      createdAt: new Date()
    };

    // Save to MongoDB if available
    if (mongoose.connection.readyState === 1) {
      try {
        const created = await User.create(newUser);
        newUser._id = created._id;
      } catch (err) {
        // Fallback
      }
    }

    // Save to inMemoryStore
    inMemoryStore.users.set(normalizedEmail, newUser);

    const token = generateToken(newUser);
    const permissions = ROLE_PERMISSIONS[newUser.role] || [];

    return res.status(201).json({
      status: 'REGISTERED',
      token,
      user: {
        id: newUser._id || newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        department: newUser.department,
        authProvider: 'local',
        isDemo: false,
        permissions
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Google Social Authentication (Login or Signup through Google)
 */
exports.googleAuth = async (req, res, next) => {
  try {
    const { email, name, googleId, avatar, role = 'SECURITY_ENGINEER', department = 'AppSec Engineering' } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'Email is required from Google authentication.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        error: 'INVALID_EMAIL',
        message: 'Invalid email address received from Google profile.'
      });
    }

    const resolvedName = name ? name.trim() : normalizedEmail.split('@')[0];
    const validRoles = ['ADMIN', 'SECURITY_ENGINEER', 'DEVELOPER'];
    const targetRole = validRoles.includes(role?.toUpperCase()) ? role.toUpperCase() : 'SECURITY_ENGINEER';

    // Search if user exists
    let user = null;
    if (mongoose.connection.readyState === 1) {
      user = await User.findOne({ email: normalizedEmail }).catch(() => null);
    }
    if (!user) {
      user = inMemoryStore.users.get(normalizedEmail);
    }

    if (!user) {
      // Create new user through Google
      const userId = `user_google_${Date.now()}`;
      user = {
        _id: userId,
        id: userId,
        email: normalizedEmail,
        name: resolvedName,
        role: targetRole,
        department: department.trim(),
        authProvider: 'google',
        googleId: googleId || `gid_${Date.now()}`,
        avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${normalizedEmail}`,
        isDemo: false,
        createdAt: new Date()
      };

      if (mongoose.connection.readyState === 1) {
        try {
          const created = await User.create(user);
          user._id = created._id;
        } catch (err) {
          // Fallback
        }
      }

      inMemoryStore.users.set(normalizedEmail, user);
    } else {
      // User already exists, update Google metadata if applicable
      if (avatar && !user.avatar) user.avatar = avatar;
      if (googleId && !user.googleId) user.googleId = googleId;
      if (mongoose.connection.readyState === 1 && typeof user.save === 'function') {
        await user.save().catch(() => null);
      }
      inMemoryStore.users.set(normalizedEmail, user);
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
        avatar: user.avatar,
        authProvider: 'google',
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
