// 🎯 FIXED getDashboardStats() METHOD
// Replace in backend/models/MessageLog.js starting at line 264

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
            { $gt: ['$totalMessages', 0] },
            { $multiply: [{ $divide: ['$totalSent', '$totalMessages'] }, 100] },
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
  const stats = result[0] || {
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
  
  // 🎯 FIX: Return dashboard-compatible format with messageStats, campaignStats, totalContacts
  return {
    messageStats: {
      totalMessages: stats.totalMessages,
      sentMessages: stats.totalSent,
      deliveredMessages: stats.totalDelivered,
      readMessages: stats.totalRead,
      failedMessages: stats.totalFailed,
      pendingMessages: stats.totalPending,
      deliveryRate: Math.round(stats.deliveryRate * 10) / 10, // Round to 1 decimal
      readRate: Math.round(stats.readRate * 10) / 10,
      failureRate: Math.round(stats.failureRate * 10) / 10,
      avgProcessingTime: Math.round(stats.avgProcessingTime || 0)
    },
    campaignStats: {
      totalCampaigns: stats.uniqueCampaignCount,
      activeCampaigns: 0, // Will be updated by RealTimeAnalyticsService
      completedCampaigns: 0,
      draftCampaigns: 0
    },
    totalContacts: stats.uniqueContactCount
  };
};
