const express = require('express');
const { body, validationResult } = require('express-validator');
const Insight = require('../models/Insight');
const { authenticateJWT, requireOnboarding } = require('../middleware/auth');
const axios = require('axios');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/insights
// @desc    Get user insights with filtering
// @access  Private
router.get('/', authenticateJWT, requireOnboarding, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      category,
      priority,
      isRead,
      isActionable,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const filter = { userId: req.user.id.toString() };

    if (type) {
      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }

    if (isActionable !== undefined) {
      filter.isActionable = isActionable === 'true';
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj = { [sort]: sortOrder };

    const insights = await Insight.find(filter)
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-__v');

    const total = await Insight.countDocuments(filter);

    res.json({
      success: true,
      data: {
        insights,
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
    logger.error('Get insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/insights/actionable
// @desc    Get actionable insights
// @access  Private
router.get('/actionable', authenticateJWT, requireOnboarding, async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const insights = await Insight.getActionableInsights(req.user.id.toString(), parseInt(limit));

    res.json({
      success: true,
      data: {
        insights
      }
    });

  } catch (error) {
    logger.error('Get actionable insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/insights/summary
// @desc    Get insights summary for dashboard
// @access  Private
router.get('/summary', authenticateJWT, requireOnboarding, async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const [summary, recentInsights] = await Promise.all([
      Insight.getInsightsSummary(req.user.id.toString(), parseInt(days)),
      Insight.find({
        userId: req.user.id.toString(),
        expiresAt: { $gt: new Date() }
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title type category priority confidence isRead isActionable createdAt')
    ]);

    // Calculate summary statistics
    const totalInsights = summary.reduce((acc, item) => acc + item.count, 0);
    const highPriorityCount = summary.reduce((acc, item) => acc + item.highPriorityCount, 0);
    const actionableCount = summary.reduce((acc, item) => acc + item.actionableCount, 0);
    const avgConfidence = summary.length > 0 
      ? summary.reduce((acc, item) => acc + item.avgConfidence, 0) / summary.length 
      : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalInsights,
          highPriorityCount,
          actionableCount,
          avgConfidence: Math.round(avgConfidence * 100) / 100
        },
        breakdown: summary,
        recentInsights
      }
    });

  } catch (error) {
    logger.error('Get insights summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/insights/:id
// @desc    Get single insight
// @access  Private
router.get('/:id', authenticateJWT, requireOnboarding, async (req, res) => {
  try {
    const { id } = req.params;

    const insight = await Insight.findOne({
      _id: id,
      userId: req.user.id.toString()
    });

    if (!insight) {
      return res.status(404).json({
        success: false,
        message: 'Insight not found'
      });
    }

    res.json({
      success: true,
      data: {
        insight
      }
    });

  } catch (error) {
    logger.error('Get insight error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/insights/:id/read
// @desc    Mark insight as read
// @access  Private
router.put('/:id/read', authenticateJWT, requireOnboarding, async (req, res) => {
  try {
    const { id } = req.params;

    const insight = await Insight.findOneAndUpdate(
      { _id: id, userId: req.user.id.toString() },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!insight) {
      return res.status(404).json({
        success: false,
        message: 'Insight not found'
      });
    }

    logger.info(`Insight marked as read: ${id} for user ${req.user.id}`);

    res.json({
      success: true,
      message: 'Insight marked as read'
    });

  } catch (error) {
    logger.error('Mark insight as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/insights/:id/action-taken
// @desc    Mark action as taken for insight
// @access  Private
router.put('/:id/action-taken', authenticateJWT, requireOnboarding, async (req, res) => {
  try {
    const { id } = req.params;

    const insight = await Insight.findOneAndUpdate(
      { _id: id, userId: req.user.id.toString() },
      { 
        $set: { 
          actionTaken: true,
          actionTakenAt: new Date()
        } 
      },
      { new: true }
    );

    if (!insight) {
      return res.status(404).json({
        success: false,
        message: 'Insight not found'
      });
    }

    logger.info(`Action taken for insight: ${id} for user ${req.user.id}`);

    res.json({
      success: true,
      message: 'Action marked as taken'
    });

  } catch (error) {
    logger.error('Mark action taken error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/insights/generate
// @desc    Trigger ML insight generation
// @access  Private
router.post('/generate', authenticateJWT, requireOnboarding, async (req, res) => {
  try {
    const { type = 'comprehensive' } = req.body;

    // Call ML service to generate insights
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8001';
    
    const response = await axios.post(`${mlServiceUrl}/api/insights/generate`, {
      userId: req.user.id.toString(),
      type: type
    }, {
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      logger.info(`Insights generated for user ${req.user.id}: ${response.data.insights.length} insights`);
      
      res.json({
        success: true,
        message: 'Insights generated successfully',
        data: {
          insights: response.data.insights,
          processingTime: response.data.processingTime
        }
      });
    } else {
      throw new Error(response.data.message || 'Failed to generate insights');
    }

  } catch (error) {
    logger.error('Generate insights error:', error);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({
        success: false,
        message: 'ML service is currently unavailable. Please try again later.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to generate insights. Please try again later.'
    });
  }
});

// @route   GET /api/insights/types
// @desc    Get available insight types
// @access  Private
router.get('/types', authenticateJWT, async (req, res) => {
  try {
    const insightTypes = [
      {
        type: 'spending_pattern',
        name: 'Spending Patterns',
        description: 'Analysis of your spending habits and trends',
        icon: '📊',
        category: 'financial'
      },
      {
        type: 'mood_correlation',
        name: 'Mood Correlations',
        description: 'How your emotions relate to your financial decisions',
        icon: '😊',
        category: 'emotional'
      },
      {
        type: 'budget_insight',
        name: 'Budget Insights',
        description: 'Recommendations for better budget management',
        icon: '💰',
        category: 'financial'
      },
      {
        type: 'goal_progress',
        name: 'Goal Progress',
        description: 'Updates on your financial goal achievements',
        icon: '🎯',
        category: 'financial'
      },
      {
        type: 'behavioral_trigger',
        name: 'Behavioral Triggers',
        description: 'Identification of spending triggers and patterns',
        icon: '🧠',
        category: 'behavioral'
      },
      {
        type: 'recommendation',
        name: 'Recommendations',
        description: 'Personalized financial recommendations',
        icon: '💡',
        category: 'actionable'
      },
      {
        type: 'forecast',
        name: 'Forecasts',
        description: 'Predictions about your future financial trends',
        icon: '🔮',
        category: 'predictive'
      }
    ];

    res.json({
      success: true,
      data: {
        insightTypes
      }
    });

  } catch (error) {
    logger.error('Get insight types error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/insights/:id
// @desc    Delete insight
// @access  Private
router.delete('/:id', authenticateJWT, requireOnboarding, async (req, res) => {
  try {
    const { id } = req.params;

    const insight = await Insight.findOneAndDelete({
      _id: id,
      userId: req.user.id.toString()
    });

    if (!insight) {
      return res.status(404).json({
        success: false,
        message: 'Insight not found'
      });
    }

    logger.info(`Insight deleted: ${id} for user ${req.user.id}`);

    res.json({
      success: true,
      message: 'Insight deleted successfully'
    });

  } catch (error) {
    logger.error('Delete insight error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
