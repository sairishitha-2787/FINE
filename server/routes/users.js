const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticateJWT, requireOnboarding } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticateJWT, async (req, res) => {
  try {
    const user = await query(
      `SELECT u.id, u.email, u.name, u.avatar_url, u.onboarding_completed, u.created_at, u.last_login_at,
              p.data_style, p.guidance_level, p.main_goal, p.app_personality, p.theme_preference, p.notification_enabled
       FROM users u
       LEFT JOIN user_preferences p ON u.id = p.user_id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: user[0]
      }
    });

  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('avatar_url').optional().isURL().withMessage('Invalid avatar URL')
], authenticateJWT, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, avatar_url } = req.body;
    const updateFields = [];
    const updateValues = [];

    if (name) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }

    if (avatar_url) {
      updateFields.push('avatar_url = ?');
      updateValues.push(avatar_url);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(req.user.id);

    await query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    logger.info(`User profile updated: ${req.user.id}`);

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/preferences
// @desc    Get user preferences
// @access  Private
router.get('/preferences', authenticateJWT, async (req, res) => {
  try {
    const preferences = await query(
      'SELECT * FROM user_preferences WHERE user_id = ?',
      [req.user.id]
    );

    if (preferences.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Preferences not found'
      });
    }

    res.json({
      success: true,
      data: {
        preferences: preferences[0]
      }
    });

  } catch (error) {
    logger.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', [
  body('data_style').optional().isIn(['visual', 'list']),
  body('guidance_level').optional().isIn(['copilot', 'fly_solo']),
  body('main_goal').optional().isIn(['spending', 'saving', 'budgeting', 'exploring']),
  body('app_personality').optional().isIn(['playful', 'direct']),
  body('theme_preference').optional().isIn(['light', 'dark', 'adaptive']),
  body('notification_enabled').optional().isBoolean()
], authenticateJWT, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      data_style,
      guidance_level,
      main_goal,
      app_personality,
      theme_preference,
      notification_enabled
    } = req.body;

    const updateFields = [];
    const updateValues = [];

    if (data_style !== undefined) {
      updateFields.push('data_style = ?');
      updateValues.push(data_style);
    }

    if (guidance_level !== undefined) {
      updateFields.push('guidance_level = ?');
      updateValues.push(guidance_level);
    }

    if (main_goal !== undefined) {
      updateFields.push('main_goal = ?');
      updateValues.push(main_goal);
    }

    if (app_personality !== undefined) {
      updateFields.push('app_personality = ?');
      updateValues.push(app_personality);
    }

    if (theme_preference !== undefined) {
      updateFields.push('theme_preference = ?');
      updateValues.push(theme_preference);
    }

    if (notification_enabled !== undefined) {
      updateFields.push('notification_enabled = ?');
      updateValues.push(notification_enabled);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No preferences to update'
      });
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(req.user.id);

    await query(
      `UPDATE user_preferences SET ${updateFields.join(', ')} WHERE user_id = ?`,
      updateValues
    );

    logger.info(`User preferences updated: ${req.user.id}`);

    res.json({
      success: true,
      message: 'Preferences updated successfully'
    });

  } catch (error) {
    logger.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/users/complete-onboarding
// @desc    Complete user onboarding
// @access  Private
router.post('/complete-onboarding', [
  body('data_style').isIn(['visual', 'list']),
  body('guidance_level').isIn(['copilot', 'fly_solo']),
  body('main_goal').isIn(['spending', 'saving', 'budgeting', 'exploring']),
  body('app_personality').isIn(['playful', 'direct'])
], authenticateJWT, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { data_style, guidance_level, main_goal, app_personality } = req.body;

    await transaction(async (conn) => {
      // Update user onboarding status
      await conn.execute(
        'UPDATE users SET onboarding_completed = TRUE, updated_at = NOW() WHERE id = ?',
        [req.user.id]
      );

      // Update or create preferences
      await conn.execute(
        `INSERT INTO user_preferences (user_id, data_style, guidance_level, main_goal, app_personality, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
         data_style = VALUES(data_style),
         guidance_level = VALUES(guidance_level),
         main_goal = VALUES(main_goal),
         app_personality = VALUES(app_personality),
         updated_at = NOW()`,
        [req.user.id, data_style, guidance_level, main_goal, app_personality]
      );

      // Award onboarding achievement
      await conn.execute(
        'INSERT INTO user_achievements (user_id, achievement_type, achievement_name, description, icon, points) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, 'onboarding', 'Welcome to FINE!', 'Completed the onboarding process', '🎉', 10]
      );
    });

    logger.info(`User onboarding completed: ${req.user.id}`);

    res.json({
      success: true,
      message: 'Onboarding completed successfully'
    });

  } catch (error) {
    logger.error('Complete onboarding error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/achievements
// @desc    Get user achievements
// @access  Private
router.get('/achievements', authenticateJWT, async (req, res) => {
  try {
    const achievements = await query(
      'SELECT * FROM user_achievements WHERE user_id = ? ORDER BY earned_at DESC',
      [req.user.id]
    );

    res.json({
      success: true,
      data: {
        achievements
      }
    });

  } catch (error) {
    logger.error('Get achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', authenticateJWT, requireOnboarding, async (req, res) => {
  try {
    const [transactionStats, budgetStats, goalStats, achievementStats] = await Promise.all([
      // Transaction statistics
      query(`
        SELECT 
          COUNT(*) as total_transactions,
          SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) as total_income,
          SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as total_expenses,
          AVG(CASE WHEN transaction_type = 'expense' THEN amount ELSE NULL END) as avg_expense
        FROM transactions 
        WHERE user_id = ?
      `, [req.user.id]),

      // Budget statistics
      query(`
        SELECT 
          COUNT(*) as total_budgets,
          SUM(amount) as total_budget_amount,
          SUM(spent) as total_spent,
          AVG(spent / amount * 100) as avg_budget_usage
        FROM budgets 
        WHERE user_id = ? AND is_active = TRUE
      `, [req.user.id]),

      // Goal statistics
      query(`
        SELECT 
          COUNT(*) as total_goals,
          COUNT(CASE WHEN is_completed = TRUE THEN 1 END) as completed_goals,
          SUM(target_amount) as total_target_amount,
          SUM(current_amount) as total_current_amount
        FROM financial_goals 
        WHERE user_id = ?
      `, [req.user.id]),

      // Achievement statistics
      query(`
        SELECT 
          COUNT(*) as total_achievements,
          SUM(points) as total_points
        FROM user_achievements 
        WHERE user_id = ?
      `, [req.user.id])
    ]);

    res.json({
      success: true,
      data: {
        transactions: transactionStats[0] || {},
        budgets: budgetStats[0] || {},
        goals: goalStats[0] || {},
        achievements: achievementStats[0] || {}
      }
    });

  } catch (error) {
    logger.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', authenticateJWT, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete account'
      });
    }

    // Verify password
    const user = await query(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.user.id]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, user[0].password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Soft delete user (deactivate account)
    await query(
      'UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = ?',
      [req.user.id]
    );

    logger.info(`User account deactivated: ${req.user.id}`);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    logger.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
