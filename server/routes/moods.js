const express = require('express');
const { body, validationResult } = require('express-validator');
const MoodLog = require('../models/MoodLog');
const { authenticateJWT, requireOnboarding } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @route   POST /api/moods
// @desc    Log a mood entry
// @access  Private
router.post('/', [
  body('mood').isIn(['happy', 'neutral', 'stressed', 'anxious', 'excited', 'sad', 'angry', 'calm', 'worried', 'content']),
  body('intensity').isInt({ min: 1, max: 10 }).withMessage('Intensity must be between 1 and 10'),
  body('context').optional().isIn(['before_transaction', 'after_transaction', 'general', 'budget_review', 'goal_check']),
  body('transactionId').optional().isMongoId(),
  body('notes').optional().trim().isLength({ max: 500 }),
  body('triggers').optional().isArray(),
  body('location').optional().isObject(),
  body('metadata').optional().isObject()
], authenticateJWT, requireOnboarding, async (req, res) => {
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
      mood,
      intensity,
      context = 'general',
      transactionId,
      notes,
      triggers = [],
      location,
      metadata = {}
    } = req.body;

    // Add device info and metadata
    const deviceInfo = {
      platform: req.headers['user-agent'] || 'unknown',
      userAgent: req.headers['user-agent'],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    const enhancedMetadata = {
      ...metadata,
      timeOfDay: new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening',
      dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' })
    };

    const moodLog = new MoodLog({
      userId: req.user.id.toString(),
      mood,
      intensity,
      context,
      transactionId,
      notes,
      triggers,
      location,
      deviceInfo,
      metadata: enhancedMetadata
    });

    await moodLog.save();

    logger.info(`Mood logged: ${mood} (${intensity}/10) for user ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: 'Mood logged successfully',
      data: {
        moodLog: {
          id: moodLog._id,
          mood: moodLog.mood,
          intensity: moodLog.intensity,
          context: moodLog.context,
          moodScore: moodLog.moodScore,
          createdAt: moodLog.createdAt
        }
      }
    });

  } catch (error) {
    logger.error('Log mood error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/moods
// @desc    Get user mood logs with filtering
// @access  Private
router.get('/', authenticateJWT, requireOnboarding, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      mood,
      context,
      startDate,
      endDate,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const filter = { userId: req.user.id.toString() };

    if (mood) {
      filter.mood = mood;
    }

    if (context) {
      filter.context = context;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj = { [sort]: sortOrder };

    const moodLogs = await MoodLog.find(filter)
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-__v');

    const total = await MoodLog.countDocuments(filter);

    res.json({
      success: true,
      data: {
        moodLogs,
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
    logger.error('Get mood logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/moods/trends
// @desc    Get mood trends and patterns
// @access  Private
router.get('/trends', authenticateJWT, requireOnboarding, async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const [trends, patterns] = await Promise.all([
      MoodLog.getMoodTrends(req.user.id.toString(), parseInt(days)),
      MoodLog.getMoodPatterns(req.user.id.toString(), parseInt(days))
    ]);

    // Calculate mood statistics
    const moodStats = await MoodLog.aggregate([
      {
        $match: {
          userId: req.user.id.toString(),
          createdAt: { $gte: new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: '$mood',
          count: { $sum: 1 },
          avgIntensity: { $avg: '$intensity' },
          avgMoodScore: { $avg: '$moodScore' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Calculate weekly mood scores
    const weeklyScores = await MoodLog.aggregate([
      {
        $match: {
          userId: req.user.id.toString(),
          createdAt: { $gte: new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            week: { $week: '$createdAt' }
          },
          avgMoodScore: { $avg: '$moodScore' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.week': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        trends,
        patterns,
        moodStats,
        weeklyScores
      }
    });

  } catch (error) {
    logger.error('Get mood trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/moods/summary
// @desc    Get mood summary for dashboard
// @access  Private
router.get('/summary', authenticateJWT, requireOnboarding, async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const summary = await MoodLog.aggregate([
      {
        $match: {
          userId: req.user.id.toString(),
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalLogs: { $sum: 1 },
          avgMoodScore: { $avg: '$moodScore' },
          dominantMood: {
            $first: {
              $arrayElemAt: [
                {
                  $map: {
                    input: {
                      $objectToArray: {
                        $reduce: {
                          input: '$mood',
                          initialValue: {},
                          in: {
                            $mergeObjects: [
                              '$$value',
                              { $arrayToObject: [[{ k: '$$this', v: 1 }]] }
                            ]
                          }
                        }
                      }
                    },
                    as: 'mood',
                    in: '$$mood.k'
                  }
                },
                0
              ]
            }
          },
          moodDistribution: {
            $push: {
              mood: '$mood',
              intensity: '$intensity',
              moodScore: '$moodScore'
            }
          }
        }
      }
    ]);

    // Calculate mood distribution
    const moodDistribution = {};
    if (summary.length > 0 && summary[0].moodDistribution) {
      summary[0].moodDistribution.forEach(entry => {
        if (!moodDistribution[entry.mood]) {
          moodDistribution[entry.mood] = { count: 0, totalIntensity: 0, totalScore: 0 };
        }
        moodDistribution[entry.mood].count++;
        moodDistribution[entry.mood].totalIntensity += entry.intensity;
        moodDistribution[entry.mood].totalScore += entry.moodScore;
      });

      // Calculate averages
      Object.keys(moodDistribution).forEach(mood => {
        moodDistribution[mood].avgIntensity = moodDistribution[mood].totalIntensity / moodDistribution[mood].count;
        moodDistribution[mood].avgScore = moodDistribution[mood].totalScore / moodDistribution[mood].count;
      });
    }

    // Get recent mood logs
    const recentMoods = await MoodLog.find({
      userId: req.user.id.toString(),
      createdAt: { $gte: startDate }
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('mood intensity context createdAt moodScore');

    res.json({
      success: true,
      data: {
        summary: summary[0] || {
          totalLogs: 0,
          avgMoodScore: 0,
          dominantMood: 'neutral'
        },
        moodDistribution,
        recentMoods
      }
    });

  } catch (error) {
    logger.error('Get mood summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/moods/:id
// @desc    Update mood log
// @access  Private
router.put('/:id', [
  body('mood').optional().isIn(['happy', 'neutral', 'stressed', 'anxious', 'excited', 'sad', 'angry', 'calm', 'worried', 'content']),
  body('intensity').optional().isInt({ min: 1, max: 10 }),
  body('context').optional().isIn(['before_transaction', 'after_transaction', 'general', 'budget_review', 'goal_check']),
  body('notes').optional().trim().isLength({ max: 500 }),
  body('triggers').optional().isArray()
], authenticateJWT, requireOnboarding, async (req, res) => {
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
    const updateData = req.body;

    const moodLog = await MoodLog.findOneAndUpdate(
      { _id: id, userId: req.user.id.toString() },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!moodLog) {
      return res.status(404).json({
        success: false,
        message: 'Mood log not found'
      });
    }

    logger.info(`Mood log updated: ${id} for user ${req.user.id}`);

    res.json({
      success: true,
      message: 'Mood log updated successfully',
      data: {
        moodLog: {
          id: moodLog._id,
          mood: moodLog.mood,
          intensity: moodLog.intensity,
          context: moodLog.context,
          moodScore: moodLog.moodScore,
          updatedAt: moodLog.updatedAt
        }
      }
    });

  } catch (error) {
    logger.error('Update mood log error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/moods/:id
// @desc    Delete mood log
// @access  Private
router.delete('/:id', authenticateJWT, requireOnboarding, async (req, res) => {
  try {
    const { id } = req.params;

    const moodLog = await MoodLog.findOneAndDelete({
      _id: id,
      userId: req.user.id.toString()
    });

    if (!moodLog) {
      return res.status(404).json({
        success: false,
        message: 'Mood log not found'
      });
    }

    logger.info(`Mood log deleted: ${id} for user ${req.user.id}`);

    res.json({
      success: true,
      message: 'Mood log deleted successfully'
    });

  } catch (error) {
    logger.error('Delete mood log error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
