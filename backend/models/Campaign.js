const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  content: String, // Manual campaign message content
  type: {
    type: String,
    enum: ['promotional', 'announcement', 'reminder', 'custom'],
    default: 'promotional'
  },
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'scheduled', 'running', 'completed', 'cancelled'],
    default: 'draft'
  },
  aiPrompt: {
    type: String,
    required: true
  },
  generatedContent: {
    text: String,
    html: String,
    jsonStructure: {
      type: mongoose.Schema.Types.Mixed
    },
    mediaUrls: [{
      type: String,
      url: String
    }]
  },
  design: {
    type: mongoose.Schema.Types.Mixed
  },
  mediaFiles: [new mongoose.Schema({
    id: String,
    name: String,
    type: String,
    size: Number,
    preview: String,
    status: String,
    file: mongoose.Schema.Types.Mixed
  }, { _id: false })],
  targetTags: [{
    type: String
  }], // 🏷️ Top-level array of tag names for easy filtering
  targetAudience: {
    contacts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact'
    }],
    groups: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ContactGroup'
    }],
    tags: [String],
    totalCount: {
      type: Number,
      default: 0
    }
  },
  scheduling: {
    sendNow: {
      type: Boolean,
      default: false
    },
    scheduledDate: Date,
    timezone: String
  },
  analytics: {
    sentCount: {
      type: Number,
      default: 0
    },
    deliveredCount: {
      type: Number,
      default: 0
    },
    readCount: {
      type: Number,
      default: 0
    },
    replyCount: {
      type: Number,
      default: 0
    },
    errorCount: {
      type: Number,
      default: 0
    }
  },
  deliveryStats: {
    sent: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  results: [{
    recipient: String,
    status: String,
    timestamp: Date,
    error: String
  }],
  sentAt: {
    type: Date
  },
  approvals: [{
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected']
    },
    feedback: String,
    date: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Campaign', campaignSchema);