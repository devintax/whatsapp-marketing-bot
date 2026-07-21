const mongoose = require('mongoose');

const messageAnalyticsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: false
  },
  messageId: {
    type: String,
    required: true
  },
  recipientPhone: {
    type: String,
    required: true
  },
  recipientName: {
    type: String
  },
  messageContent: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'media', 'document'],
    default: 'text'
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed', 'pending'],
    default: 'pending'
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  deliveredAt: {
    type: Date
  },
  readAt: {
    type: Date
  },
  failureReason: {
    type: String
  },
  mediaUrl: {
    type: String
  },
  campaignType: {
    type: String
  },
  metadata: {
    chatId: String,
    whatsappMessageId: String,
    userAgent: String,
    ipAddress: String
  }
}, {
  timestamps: true
});

// Indexes for performance
messageAnalyticsSchema.index({ user: 1, sentAt: -1 });
messageAnalyticsSchema.index({ campaign: 1 });
messageAnalyticsSchema.index({ status: 1 });
messageAnalyticsSchema.index({ recipientPhone: 1 });
messageAnalyticsSchema.index({ sentAt: -1 });

// Virtual for response time calculation
messageAnalyticsSchema.virtual('responseTime').get(function() {
  if (this.readAt && this.sentAt) {
    return this.readAt.getTime() - this.sentAt.getTime();
  }
  return null;
});

module.exports = mongoose.model('MessageAnalytics', messageAnalyticsSchema);