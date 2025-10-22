const passport = require('passport');
const { query } = require('../config/database');
const logger = require('../utils/logger');

// JWT Authentication middleware
const authenticateJWT = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      logger.error('JWT Authentication error:', err);
      return res.status(500).json({
        success: false,
        message: 'Authentication error'
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided or token is invalid.'
      });
    }

    req.user = user;
    next();
  })(req, res, next);
};

// Optional JWT Authentication (doesn't fail if no token)
const optionalJWT = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      logger.error('Optional JWT Authentication error:', err);
    }
    
    if (user) {
      req.user = user;
    }
    
    next();
  })(req, res, next);
};

// Check if user has completed onboarding
const requireOnboarding = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const user = await query(
      'SELECT onboarding_completed FROM users WHERE id = ?',
      [req.user.id]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user[0].onboarding_completed) {
      return res.status(403).json({
        success: false,
        message: 'Onboarding not completed',
        requiresOnboarding: true
      });
    }

    next();
  } catch (error) {
    logger.error('Onboarding check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Check user role (for future admin features)
const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const user = await query(
        'SELECT role FROM users WHERE id = ?',
        [req.user.id]
      );

      if (user.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const userRole = user[0].role || 'user';
      
      if (!roles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      next();
    } catch (error) {
      logger.error('Role check error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  };
};

// Rate limiting for specific routes
const createRateLimit = (windowMs, max, message) => {
  const rateLimit = require('express-rate-limit');
  return rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

module.exports = {
  authenticateJWT,
  optionalJWT,
  requireOnboarding,
  requireRole,
  createRateLimit
};
