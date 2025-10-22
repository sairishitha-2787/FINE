const mongoose = require('mongoose');

const moodLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  mood: {
    type: String,
    required: true,
    enum: ['happy', 'neutral', 'stressed', 'anxious', 'excited', 'sad', 'angry', 'calm', 'worried', 'content']
  },
  intensity: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  context: {
    type: String,
    enum: ['before_transaction', 'after_transaction', 'general', 'budget_review', 'goal_check']
  },
  transactionId: {
    type: String,
    index: true
  },
  notes: {
    type: String,
    maxlength: 500
  },
  triggers: [{
    type: String,
    enum: ['spending', 'saving', 'budget_alert', 'goal_progress', 'insight', 'reminder']
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  deviceInfo: {
    platform: String,
    userAgent: String,
    timezone: String
  },
  metadata: {
    weather: String,
    timeOfDay: String,
    dayOfWeek: String
  }
}, {
  timestamps: true,
  collection: 'moodlogs'
});

// Indexes for efficient querying
moodLogSchema.index({ userId: 1, createdAt: -1 });
moodLogSchema.index({ userId: 1, mood: 1, createdAt: -1 });
moodLogSchema.index({ userId: 1, context: 1, createdAt: -1 });
moodLogSchema.index({ createdAt: -1 });

// Virtual for mood score calculation
moodLogSchema.virtual('moodScore').get(function() {
  const moodScores = {
    'happy': 9,
    'excited': 8,
    'content': 7,
    'calm': 6,
    'neutral': 5,
    'worried': 4,
    'sad': 3,
    'anxious': 2,
    'stressed': 2,
    'angry': 1
  };
  
  return (moodScores[this.mood] || 5) * (this.intensity / 10);
});

// Static method to get mood trends
moodLogSchema.statics.getMoodTrends = async function(userId, days = 30) {
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
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          mood: "$mood"
        },
        avgIntensity: { $avg: "$intensity" },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { "_id.date": 1 }
    }
  ]);
};

// Static method to get mood patterns
moodLogSchema.statics.getMoodPatterns = async function(userId, days = 90) {
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
          context: "$context",
          mood: "$mood"
        },
        count: { $sum: 1 },
        avgIntensity: { $avg: "$intensity" }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

module.exports = mongoose.model('MoodLog', moodLogSchema);
