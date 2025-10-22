const express = require('express');
const { body, validationResult } = require('express-validator');
const Feedback = require('../models/Feedback');
const { authenticateJWT } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @route   POST /api/feedback
// @desc    Submit feedback
// @access  Private
router.post('/', [
  body('type').isIn(['bug_report', 'feature_request', 'general_feedback', 'insight_feedback', 'ui_feedback', 'performance_issue']),
  body('category').isIn(['frontend', 'backend', 'ml_service', 'database', 'ui_ux', 'performance', 'security', 'other']),
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('severity').optional().isIn(['minor', 'moderate', 'major', 'critical']),
  body('reproductionSteps').optional().isArray(),
  body('expectedBehavior').optional().trim().isLength({ max: 1000 }),
  body('actualBehavior').optional().trim().isLength({ max: 1000 }),
  body('relatedInsightId').optional().isMongoId(),
  body('relatedTransactionId').optional().isInt({ min: 1 }),
  body('isPublic').optional().isBoolean(),
  body('isAnonymous').optional().isBoolean()
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
      type,
      category,
      title,
      description,
      priority = 'medium',
      severity = 'moderate',
      reproductionSteps = [],
      expectedBehavior,
      actualBehavior,
      relatedInsightId,
      relatedTransactionId,
      isPublic = false,
      isAnonymous = false
    } = req.body;

    // Get environment information
    const environment = {
      browser: req.headers['user-agent'] || 'unknown',
      os: req.headers['user-agent'] || 'unknown',
      device: req.headers['user-agent'] || 'unknown',
      version: '1.0.0',
      userAgent: req.headers['user-agent']
    };

    const feedback = new Feedback({
      userId: req.user.id.toString(),
      type,
      category,
      title,
      description,
      priority,
      severity,
      environment,
      reproductionSteps,
      expectedBehavior,
      actualBehavior,
      relatedInsightId,
      relatedTransactionId,
      isPublic,
      isAnonymous
    });

    await feedback.save();

    logger.info(`Feedback submitted: ${feedback._id} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        feedback: {
          id: feedback._id,
          type: feedback.type,
          category: feedback.category,
          title: feedback.title,
          priority: feedback.priority,
          status: feedback.status,
          createdAt: feedback.createdAt
        }
      }
    });

  } catch (error) {
    logger.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/feedback
// @desc    Get user's feedback submissions
// @access  Private
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      status,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const filter = { userId: req.user.id.toString() };

    if (type) {
      filter.type = type;
    }

    if (status) {
      filter.status = status;
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj = { [sort]: sortOrder };

    const feedback = await Feedback.find(filter)
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-__v');

    const total = await Feedback.countDocuments(filter);

    res.json({
      success: true,
      data: {
        feedback,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: parseInt(limit),
          has_next: page < Math.ceil(total / limit),
          has_prev: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/feedback/:id
// @desc    Get single feedback item
// @access  Private
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findOne({
      _id: id,
      userId: req.user.id.toString()
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      data: {
        feedback
      }
    });

  } catch (error) {
    logger.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/feedback/:id/comments
// @desc    Add comment to feedback
// @access  Private
router.post('/:id/comments', [
  body('comment').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment must be between 1 and 1000 characters')
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

    const { id } = req.params;
    const { comment } = req.body;

    const feedback = await Feedback.findOne({
      _id: id,
      userId: req.user.id.toString()
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    await feedback.addComment(req.user.id.toString(), comment);

    logger.info(`Comment added to feedback: ${id} by user ${req.user.id}`);

    res.json({
      success: true,
      message: 'Comment added successfully'
    });

  } catch (error) {
    logger.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/feedback/:id/vote
// @desc    Vote on feedback (upvote/downvote)
// @access  Private
router.post('/:id/vote', [
  body('isUpvote').isBoolean().withMessage('isUpvote must be a boolean')
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

    const { id } = req.params;
    const { isUpvote } = req.body;

    const feedback = await Feedback.findOne({
      _id: id,
      isPublic: true
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found or not public'
      });
    }

    await feedback.vote(isUpvote);

    logger.info(`Vote cast on feedback: ${id} by user ${req.user.id} (${isUpvote ? 'upvote' : 'downvote'})`);

    res.json({
      success: true,
      message: 'Vote cast successfully',
      data: {
        upvotes: feedback.votes.upvotes,
        downvotes: feedback.votes.downvotes
      }
    });

  } catch (error) {
    logger.error('Vote on feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/feedback/public
// @desc    Get public feedback (for community features)
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      category,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const filter = { isPublic: true };

    if (type) {
      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj = { [sort]: sortOrder };

    const feedback = await Feedback.find(filter)
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('title description type category priority status votes createdAt comments')
      .populate('userId', 'name avatar_url');

    const total = await Feedback.countDocuments(filter);

    res.json({
      success: true,
      data: {
        feedback,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: parseInt(limit),
          has_next: page < Math.ceil(total / limit),
          has_prev: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Get public feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/feedback/stats
// @desc    Get feedback statistics (admin only)
// @access  Private
router.get('/stats', authenticateJWT, async (req, res) => {
  try {
    // Check if user is admin (you might want to implement proper role checking)
    const user = await require('../config/database').query(
      'SELECT role FROM users WHERE id = ?',
      [req.user.id]
    );

    if (user.length === 0 || user[0].role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { days = 30 } = req.query;

    const stats = await Feedback.getFeedbackStats(parseInt(days));

    res.json({
      success: true,
      data: {
        stats
      }
    });

  } catch (error) {
    logger.error('Get feedback stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
