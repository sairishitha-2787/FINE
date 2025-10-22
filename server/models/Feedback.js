const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['bug_report', 'feature_request', 'general_feedback', 'insight_feedback', 'ui_feedback', 'performance_issue']
  },
  category: {
    type: String,
    enum: ['frontend', 'backend', 'ml_service', 'database', 'ui_ux', 'performance', 'security', 'other'],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed', 'duplicate'],
    default: 'open'
  },
  severity: {
    type: String,
    enum: ['minor', 'moderate', 'major', 'critical'],
    default: 'moderate'
  },
  environment: {
    browser: String,
    os: String,
    device: String,
    version: String,
    userAgent: String
  },
  reproductionSteps: [String],
  expectedBehavior: String,
  actualBehavior: String,
  screenshots: [String], // URLs to uploaded screenshots
  attachments: [String], // URLs to other attachments
  tags: [String],
  relatedInsightId: String,
  relatedTransactionId: String,
  assignedTo: String,
  resolution: {
    description: String,
    resolvedAt: Date,
    resolvedBy: String
  },
  votes: {
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 }
  },
  comments: [{
    userId: String,
    comment: String,
    createdAt: { type: Date, default: Date.now },
    isInternal: { type: Boolean, default: false }
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  isAnonymous: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'feedback'
});

// Indexes for efficient querying
feedbackSchema.index({ userId: 1, createdAt: -1 });
feedbackSchema.index({ type: 1, status: 1, createdAt: -1 });
feedbackSchema.index({ category: 1, priority: 1, createdAt: -1 });
feedbackSchema.index({ status: 1, priority: 1, createdAt: -1 });
feedbackSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });
feedbackSchema.index({ isPublic: 1, createdAt: -1 });

// Static method to get feedback by status
feedbackSchema.statics.getFeedbackByStatus = async function(status, limit = 20) {
  return this.find({ status: status })
    .sort({ priority: -1, createdAt: -1 })
    .limit(limit);
};

// Static method to get feedback statistics
feedbackSchema.statics.getFeedbackStats = async function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          type: "$type",
          status: "$status"
        },
        count: { $sum: 1 },
        avgPriority: { $avg: { $cond: [
          { $eq: ["$priority", "low"] }, 1,
          { $cond: [
            { $eq: ["$priority", "medium"] }, 2,
            { $cond: [
              { $eq: ["$priority", "high"] }, 3, 4
            ]}
          ]}
        ]}
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Method to add comment
feedbackSchema.methods.addComment = function(userId, comment, isInternal = false) {
  this.comments.push({
    userId: userId,
    comment: comment,
    isInternal: isInternal
  });
  return this.save();
};

// Method to update status
feedbackSchema.methods.updateStatus = function(status, resolvedBy = null) {
  this.status = status;
  if (status === 'resolved' && resolvedBy) {
    this.resolution = {
      resolvedAt: new Date(),
      resolvedBy: resolvedBy
    };
  }
  return this.save();
};

// Method to vote
feedbackSchema.methods.vote = function(isUpvote) {
  if (isUpvote) {
    this.votes.upvotes += 1;
  } else {
    this.votes.downvotes += 1;
  }
  return this.save();
};

module.exports = mongoose.model('Feedback', feedbackSchema);
