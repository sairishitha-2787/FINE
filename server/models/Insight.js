const mongoose = require('mongoose');

const insightSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['spending_pattern', 'mood_correlation', 'budget_insight', 'goal_progress', 'behavioral_trigger', 'recommendation', 'forecast']
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['financial', 'emotional', 'behavioral', 'predictive', 'actionable'],
    required: true
  },
  data: {
    // Flexible data structure for different insight types
    spendingAmount: Number,
    moodScore: Number,
    category: String,
    timeframe: String,
    comparison: {
      previous: Number,
      average: Number,
      trend: String
    },
    patterns: [{
      pattern: String,
      frequency: Number,
      impact: String
    }],
    recommendations: [{
      action: String,
      impact: String,
      difficulty: String
    }]
  },
  visualizations: [{
    type: {
      type: String,
      enum: ['chart', 'graph', 'metric', 'trend']
    },
    data: mongoose.Schema.Types.Mixed,
    config: mongoose.Schema.Types.Mixed
  }],
  source: {
    type: String,
    enum: ['ml_analysis', 'rule_based', 'user_behavior', 'external_data'],
    default: 'ml_analysis'
  },
  tags: [String],
  isRead: {
    type: Boolean,
    default: false
  },
  isActionable: {
    type: Boolean,
    default: false
  },
  actionTaken: {
    type: Boolean,
    default: false
  },
  actionTakenAt: Date,
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 }
  },
  metadata: {
    modelVersion: String,
    processingTime: Number,
    dataPoints: Number,
    accuracy: Number
  }
}, {
  timestamps: true,
  collection: 'insights'
});

// Indexes for efficient querying
insightSchema.index({ userId: 1, createdAt: -1 });
insightSchema.index({ userId: 1, type: 1, createdAt: -1 });
insightSchema.index({ userId: 1, category: 1, createdAt: -1 });
insightSchema.index({ userId: 1, priority: 1, createdAt: -1 });
insightSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
insightSchema.index({ expiresAt: 1 });

// Static method to get insights by type
insightSchema.statics.getInsightsByType = async function (userId, type, limit = 10) {
  return this.find({
    userId: userId,
    type: type,
    expiresAt: { $gt: new Date() }
  })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get actionable insights
insightSchema.statics.getActionableInsights = async function (userId, limit = 5) {
  return this.find({
    userId: userId,
    isActionable: true,
    actionTaken: false,
    expiresAt: { $gt: new Date() }
  })
    .sort({ priority: -1, confidence: -1, createdAt: -1 })
    .limit(limit);
};

// Static method to get insights summary
insightSchema.statics.getInsightsSummary = async function (userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        userId: userId,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          type: "$type",
          category: "$category"
        },
        count: { $sum: 1 },
        avgConfidence: { $avg: "$confidence" },
        highPriorityCount: {
          $sum: {
            $cond: [{ $in: ["$priority", ["high", "urgent"]] }, 1, 0]
          }
        },
        actionableCount: {
          $sum: {
            $cond: ["$isActionable", 1, 0]
          }
        }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Method to mark as read
insightSchema.methods.markAsRead = function () {
  this.isRead = true;
  return this.save();
};

// Method to mark action as taken
insightSchema.methods.markActionTaken = function () {
  this.actionTaken = true;
  this.actionTakenAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Insight', insightSchema);
