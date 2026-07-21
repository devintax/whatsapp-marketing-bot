/**
 * 📊 MESSAGE LOG MODEL - Real-Time Analytics Support
 * 
 * Stores detailed message events for real-time dashboard analytics
 * Supports the floating progress tracker integration with comprehensive logging
 */

const mongoose = require('mongoose');

const messageLogSchema = new mongoose.Schema({
  // Core identification
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
    index: true // For fast queries
  },
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Contact information
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    default: null
  },
  
  phone: {
    type: String,
    required: true,
    index: true
  },
  
  contactName: {
    type: String,
    default: null
  },
  
  // Message status tracking
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed', 'retry_pending', 'retry_failed'],
    default: 'pending',
    index: true // For status aggregations
  },
  
  // Timing information
  timestamp: {
    type: Date,
    default: Date.now,
    index: true // For chronological queries
  },
  
  sentAt: {
    type: Date,
    default: null
  },
  
  deliveredAt: {
    type: Date,
    default: null
  },
  
  readAt: {
    type: Date,
    default: null
  },
  
  // Error handling
  error: {
    type: String,
    default: null
  },
  
  errorCode: {
    type: String,
    default: null
  },
  
  retryCount: {
    type: Number,
    default: 0
  },
  
  // Message details
  messageContent: {
    type: String,
    default: null
  },
  
  messageLength: {
    type: Number,
    default: 0
  },
  
  mediaUrl: {
    type: String,
    default: null
  },
  
  // Batch information for smart batching integration
  batchNumber: {
    type: Number,
    default: null
  },
  
  batchPosition: {
    type: Number,
    default: null
  },
  
  batchSize: {
    type: Number,
    default: null
  },
  
  // Timing analytics
  processingTime: {
    type: Number, // milliseconds
    default: null
  },
  
  messageDelay: {
    type: Number, // milliseconds used in batching
    default: null
  },
  
  // WhatsApp specific data
  whatsappMessageId: {
    type: String,
    default: null
  },
  
  chatId: {
    type: String,
    default: null
  },
  
  // Campaign metadata
  campaignType: {
    type: String,
    default: 'manual'
  },
  
  isAIGenerated: {
    type: Boolean,
    default: false
  },
  
  // Real-time analytics support
  dashboardNotified: {
    type: Boolean,
    default: false
  },
  
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'messagelogs'
});

// Compound indexes for efficient analytics queries
messageLogSchema.index({ campaignId: 1, status: 1 });
messageLogSchema.index({ user: 1, timestamp: -1 });
messageLogSchema.index({ campaignId: 1, timestamp: -1 });
messageLogSchema.index({ status: 1, timestamp: -1 });

// Virtual for delivery time calculation
messageLogSchema.virtual('deliveryTime').get(function() {
  if (this.sentAt && this.deliveredAt) {
    return this.deliveredAt.getTime() - this.sentAt.getTime();
  }
  return null;
});

// Virtual for read time calculation
messageLogSchema.virtual('readTime').get(function() {
  if (this.deliveredAt && this.readAt) {
    return this.readAt.getTime() - this.deliveredAt.getTime();
  }
  return null;
});

// Static method for campaign analytics
messageLogSchema.statics.getCampaignAnalytics = async function(campaignId) {
  const pipeline = [
    { $match: { campaignId: new mongoose.Types.ObjectId(campaignId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgProcessingTime: { $avg: '$processingTime' },
        phones: { $push: '$phone' }
      }
    },
    {
      $group: {
        _id: null,
        statusBreakdown: {
          $push: {
            status: '$_id',
            count: '$count',
            avgProcessingTime: '$avgProcessingTime',
            phones: '$phones'
          }
        },
        totalMessages: { $sum: '$count' }
      }
    }
  ];
  
  return await this.aggregate(pipeline);
};

// Static method for user analytics
messageLogSchema.statics.getUserAnalytics = async function(userId, dateRange = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dateRange);
  
  const pipeline = [
    { 
      $match: { 
        user: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate }
      } 
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          status: '$status'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        statuses: {
          $push: {
            status: '$_id.status',
            count: '$count'
          }
        },
        totalMessages: { $sum: '$count' }
      }
    },
    { $sort: { _id: 1 } }
  ];
  
  return await this.aggregate(pipeline);
};

// Static method for real-time dashboard stats
messageLogSchema.statics.getDashboardStats = async function(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const pipeline = [
    { 
      $match: { 
        user: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: today }
      } 
    },
    {
      $group: {
        _id: null,
        totalSent: {
          $sum: {
            $cond: [{ $eq: ['$status', 'sent'] }, 1, 0]
          }
        },
        totalDelivered: {
          $sum: {
            $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0]
          }
        },
        totalRead: {
          $sum: {
            $cond: [{ $eq: ['$status', 'read'] }, 1, 0]
          }
        },
        totalFailed: {
          $sum: {
            $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
          }
        },
        totalPending: {
          $sum: {
            $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
          }
        },
        totalMessages: { $sum: 1 },
        avgProcessingTime: { $avg: '$processingTime' },
        uniqueContacts: { $addToSet: '$phone' },
        uniqueCampaigns: { $addToSet: '$campaignId' }
      }
    },
    {
      $addFields: {
        successRate: {
          $cond: [
            { $gt: ['$totalMessages', 0] },
            { $multiply: [{ $divide: ['$totalSent', '$totalMessages'] }, 100] },
            0
          ]
        },
        deliveryRate: {
          $cond: [
            { $gt: ['$totalSent', 0] },
            { $multiply: [{ $divide: ['$totalDelivered', '$totalSent'] }, 100] },
            0
          ]
        },
        readRate: {
          $cond: [
            { $gt: ['$totalDelivered', 0] },
            { $multiply: [{ $divide: ['$totalRead', '$totalDelivered'] }, 100] },
            0
          ]
        },
        failureRate: {
          $cond: [
            { $gt: ['$totalMessages', 0] },
            { $multiply: [{ $divide: ['$totalFailed', '$totalMessages'] }, 100] },
            0
          ]
        },
        uniqueContactCount: { $size: '$uniqueContacts' },
        uniqueCampaignCount: { $size: '$uniqueCampaigns' }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  const rawStats = result[0] || {
    totalSent: 0,
    totalDelivered: 0,
    totalRead: 0,
    totalFailed: 0,
    totalPending: 0,
    totalMessages: 0,
    successRate: 0,
    deliveryRate: 0,
    readRate: 0,
    failureRate: 0,
    uniqueContactCount: 0,
    uniqueCampaignCount: 0,
    avgProcessingTime: 0
  };

  // 🔥 CRITICAL FIX: Wrap in nested structure for frontend compatibility
  return {
    messageStats: {
      totalMessages: rawStats.totalMessages,
      sentMessages: rawStats.totalSent,
      deliveredMessages: rawStats.totalDelivered,
      readMessages: rawStats.totalRead,
      failedMessages: rawStats.totalFailed,
      pendingMessages: rawStats.totalPending || 0,
      deliveryRate: Math.round(rawStats.deliveryRate * 10) / 10,
      readRate: Math.round(rawStats.readRate * 10) / 10,
      failureRate: Math.round(rawStats.failureRate * 10) / 10,
      avgProcessingTime: Math.round(rawStats.avgProcessingTime || 0)
    },
    campaignStats: {
      totalCampaigns: rawStats.uniqueCampaignCount || 0,
      activeCampaigns: rawStats.uniqueCampaignCount || 0
    },
    totalContacts: rawStats.uniqueContactCount
  };
};

module.exports = mongoose.model('MessageLog', messageLogSchema);