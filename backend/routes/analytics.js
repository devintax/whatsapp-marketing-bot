const express = require('express');
const Campaign = require('../models/Campaign');
const Contact = require('../models/Contact');
const BusinessData = require('../models/BusinessData');
const MessageAnalytics = require('../models/MessageAnalytics');
const MessageLog = require('../models/MessageLog'); // 📊 NEW: Real-time analytics support
const auth = require('../middleware/auth');

const router = express.Router();

// 📊 NEW: Real-time dashboard statistics endpoint
router.get('/dashboard-realtime', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get real-time dashboard stats from MessageLog
    const realtimeStats = await MessageLog.getDashboardStats(userId);
    
    // Get campaign statistics
    const campaignStats = await Campaign.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalCampaigns: { $sum: 1 },
          activeCampaigns: {
            $sum: {
              $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
            }
          },
          completedCampaigns: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          },
          draftCampaigns: {
            $sum: {
              $cond: [{ $eq: ['$status', 'draft'] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    // Get total contacts
    const totalContacts = await Contact.countDocuments({ user: userId });
    
    // Combine all stats for real-time dashboard
    const dashboardData = {
      messageStats: realtimeStats,
      campaignStats: campaignStats[0] || {
        totalCampaigns: 0,
        activeCampaigns: 0,
        completedCampaigns: 0,
        draftCampaigns: 0
      },
      totalContacts,
      lastUpdated: new Date()
    };
    
    res.json({
      success: true,
      data: dashboardData
    });
    
  } catch (error) {
    console.error('❌ Real-time dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch real-time dashboard statistics',
      error: error.message
    });
  }
});

// 📊 NEW: Message status breakdown for floating tracker integration
router.get('/message-breakdown', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { campaignId, dateRange = 7 } = req.query;
    
    let matchQuery = { user: userId };
    
    // Filter by campaign if specified
    if (campaignId) {
      matchQuery.campaignId = campaignId;
    }
    
    // Filter by date range
    if (dateRange) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));
      matchQuery.timestamp = { $gte: startDate };
    }
    
    const breakdown = await MessageLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          phones: { $addToSet: '$phone' },
          avgProcessingTime: { $avg: '$processingTime' },
          errors: {
            $push: {
              $cond: [
                { $ne: ['$error', null] },
                { phone: '$phone', error: '$error', timestamp: '$timestamp' },
                null
              ]
            }
          }
        }
      },
      {
        $addFields: {
          uniqueContacts: { $size: '$phones' },
          errors: {
            $filter: {
              input: '$errors',
              cond: { $ne: ['$$this', null] }
            }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      success: true,
      data: breakdown
    });
    
  } catch (error) {
    console.error('❌ Message breakdown error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch message breakdown',
      error: error.message
    });
  }
});

// 📊 NEW: Recent activity feed for dashboard
router.get('/recent-activity', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;
    
    const activities = await MessageLog.find({
      user: userId
    })
    .populate('campaignId', 'name type')
    .sort({ timestamp: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset))
    .lean();
    
    const formattedActivities = activities.map(activity => ({
      id: activity._id,
      campaignId: activity.campaignId?._id,
      campaignName: activity.campaignId?.name || 'Unknown Campaign',
      campaignType: activity.campaignId?.type || 'unknown',
      phone: activity.phone,
      contactName: activity.contactName,
      status: activity.status,
      timestamp: activity.timestamp,
      error: activity.error,
      processingTime: activity.processingTime,
      batchNumber: activity.batchNumber,
      retryCount: activity.retryCount
    }));
    
    res.json({
      success: true,
      data: formattedActivities,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: activities.length === parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('❌ Recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activity',
      error: error.message
    });
  }
});

// Get real-time dashboard statistics
router.get('/stats', auth, async (req, res) => {
  try {
    console.log('📊 Fetching real-time analytics stats for user:', req.user.id);
    
    const userId = req.user.id;
    
    // Get current timestamp for real-time data
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Real message analytics from MessageAnalytics collection
    const messageStats = await MessageAnalytics.aggregate([
      { $match: { user: userId } },
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
          sentToday: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'sent'] },
                    { $gte: ['$sentAt', today] }
                  ]
                },
                1,
                0
              ]
            }
          },
          sentThisWeek: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'sent'] },
                    { $gte: ['$sentAt', thisWeek] }
                  ]
                },
                1,
                0
              ]
            }
          },
          sentThisMonth: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'sent'] },
                    { $gte: ['$sentAt', thisMonth] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Real-time campaign statistics
    const campaignStats = await Campaign.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: {
              $cond: [
                { $in: ['$status', ['running', 'scheduled']] },
                1,
                0
              ]
            }
          },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          },
          draft: {
            $sum: {
              $cond: [{ $eq: ['$status', 'draft'] }, 1, 0]
            }
          },
          totalMessagesSent: { $sum: '$analytics.sentCount' },
          totalMessagesDelivered: { $sum: '$analytics.deliveredCount' },
          totalMessagesRead: { $sum: '$analytics.readCount' },
          totalReplies: { $sum: '$analytics.replyCount' }
        }
      }
    ]);
    
    // Contact statistics
    const contactStats = await Contact.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ['$isActive', true] }, 1, 0]
            }
          },
          newToday: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', today] },
                1,
                0
              ]
            }
          },
          newThisWeek: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', thisWeek] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);
    
    // Business data statistics
    const businessDataCount = await BusinessData.countDocuments({ user: userId });
    
    // Recent campaign activity
    const recentCampaigns = await Campaign.find({ user: userId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('name status analytics createdAt updatedAt');
    
    const stats = campaignStats[0] || {
      total: 0,
      active: 0,
      completed: 0,
      draft: 0,
      totalMessagesSent: 0,
      totalMessagesDelivered: 0,
      totalMessagesRead: 0,
      totalReplies: 0
    };
    
    const contacts = contactStats[0] || {
      total: 0,
      active: 0,
      newToday: 0,
      newThisWeek: 0
    };
    
    // Get real message analytics data
    const realMessageStats = messageStats[0] || {
      totalSent: 0,
      totalDelivered: 0,
      totalRead: 0,
      totalFailed: 0,
      sentToday: 0,
      sentThisWeek: 0,
      sentThisMonth: 0
    };
    
    // Calculate success rates using real data
    const deliveryRate = realMessageStats.totalSent > 0 
      ? Math.round((realMessageStats.totalDelivered / realMessageStats.totalSent) * 100)
      : 0;
    
    const readRate = realMessageStats.totalDelivered > 0 
      ? Math.round((realMessageStats.totalRead / realMessageStats.totalDelivered) * 100)
      : 0;
    
    const successRate = realMessageStats.totalSent > 0 
      ? Math.round(((realMessageStats.totalSent - realMessageStats.totalFailed) / realMessageStats.totalSent) * 100)
      : 0;
    
    console.log('✅ Analytics stats compiled successfully');
    
    res.json({
      success: true,
      data: {
        campaigns: {
          total: stats.total,
          active: stats.active,
          completed: stats.completed,
          draft: stats.draft
        },
        messages: {
          // Use real message analytics data
          sent: realMessageStats.totalSent,
          delivered: realMessageStats.totalDelivered,
          read: realMessageStats.totalRead,
          failed: realMessageStats.totalFailed,
          sentToday: realMessageStats.sentToday,
          sentThisWeek: realMessageStats.sentThisWeek,
          sentThisMonth: realMessageStats.sentThisMonth,
          deliveryRate,
          readRate,
          successRate,
          // Legacy fields for backward compatibility
          replies: stats.totalReplies || 0,
          replyRate: stats.totalReplies > 0 ? Math.round((stats.totalReplies / realMessageStats.totalRead) * 100) : 0
        },
        contacts: {
          total: contacts.total,
          active: contacts.active,
          newToday: contacts.newToday,
          newThisWeek: contacts.newThisWeek,
          growthRate: contacts.total > 0 && contacts.newThisWeek > 0 
            ? Math.round((contacts.newThisWeek / contacts.total) * 100)
            : 0
        },
        businessData: {
          total: businessDataCount
        },
        recentActivity: recentCampaigns,
        lastUpdated: now.toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching analytics stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics stats',
      error: error.message
    });
  }
});

// Get message status breakdown
router.get('/message-status', auth, async (req, res) => {
  try {
    console.log('📊 Fetching message status breakdown for user:', req.user.id);
    
    const userId = req.user.id;
    
    const messageBreakdown = await Campaign.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          pending: { $sum: '$analytics.pendingCount' },
          sent: { $sum: '$analytics.sentCount' },
          delivered: { $sum: '$analytics.deliveredCount' },
          read: { $sum: '$analytics.readCount' },
          failed: { $sum: '$analytics.failedCount' },
          replied: { $sum: '$analytics.replyCount' }
        }
      }
    ]);
    
    const breakdown = messageBreakdown[0] || {
      pending: 0,
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
      replied: 0
    };
    
    const total = breakdown.sent + breakdown.pending + breakdown.failed;
    
    res.json({
      success: true,
      data: {
        breakdown,
        total,
        percentages: total > 0 ? {
          pending: Math.round((breakdown.pending / total) * 100),
          sent: Math.round((breakdown.sent / total) * 100),
          delivered: Math.round((breakdown.delivered / total) * 100),
          read: Math.round((breakdown.read / total) * 100),
          failed: Math.round((breakdown.failed / total) * 100),
          replied: Math.round((breakdown.replied / total) * 100)
        } : {
          pending: 0,
          sent: 0,
          delivered: 0,
          read: 0,
          failed: 0,
          replied: 0
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching message status breakdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch message status breakdown',
      error: error.message
    });
  }
});

// Get campaign performance over time
router.get('/performance', auth, async (req, res) => {
  try {
    console.log('📊 Fetching campaign performance data for user:', req.user.id);
    
    const userId = req.user.id;
    const { period = '30' } = req.query; // Default to 30 days
    
    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);
    
    const performanceData = await Campaign.aggregate([
      { 
        $match: { 
          user: userId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          campaignsCreated: { $sum: 1 },
          messagesSent: { $sum: '$analytics.sentCount' },
          messagesDelivered: { $sum: '$analytics.deliveredCount' },
          messagesRead: { $sum: '$analytics.readCount' },
          replies: { $sum: '$analytics.replyCount' }
        }
      },
      { 
        $sort: { 
          '_id.year': 1, 
          '_id.month': 1, 
          '_id.day': 1 
        } 
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          },
          campaignsCreated: 1,
          messagesSent: 1,
          messagesDelivered: 1,
          messagesRead: 1,
          replies: 1,
          deliveryRate: {
            $cond: [
              { $gt: ['$messagesSent', 0] },
              { $multiply: [{ $divide: ['$messagesDelivered', '$messagesSent'] }, 100] },
              0
            ]
          },
          readRate: {
            $cond: [
              { $gt: ['$messagesDelivered', 0] },
              { $multiply: [{ $divide: ['$messagesRead', '$messagesDelivered'] }, 100] },
              0
            ]
          }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: performanceData,
      period: `${daysAgo} days`
    });
    
  } catch (error) {
    console.error('❌ Error fetching performance data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance data',
      error: error.message
    });
  }
});

// Get top performing campaigns
router.get('/top-campaigns', auth, async (req, res) => {
  try {
    console.log('📊 Fetching top performing campaigns for user:', req.user.id);
    
    const userId = req.user.id;
    const { limit = 10, sortBy = 'readRate' } = req.query;
    
    let sortField = {};
    switch (sortBy) {
      case 'deliveryRate':
        sortField = { 'calculated.deliveryRate': -1 };
        break;
      case 'readRate':
        sortField = { 'calculated.readRate': -1 };
        break;
      case 'replyRate':
        sortField = { 'calculated.replyRate': -1 };
        break;
      case 'messagesSent':
        sortField = { 'analytics.sentCount': -1 };
        break;
      default:
        sortField = { 'calculated.readRate': -1 };
    }
    
    const topCampaigns = await Campaign.aggregate([
      { $match: { user: userId, status: { $ne: 'draft' } } },
      {
        $addFields: {
          calculated: {
            deliveryRate: {
              $cond: [
                { $gt: ['$analytics.sentCount', 0] },
                { $multiply: [{ $divide: ['$analytics.deliveredCount', '$analytics.sentCount'] }, 100] },
                0
              ]
            },
            readRate: {
              $cond: [
                { $gt: ['$analytics.deliveredCount', 0] },
                { $multiply: [{ $divide: ['$analytics.readCount', '$analytics.deliveredCount'] }, 100] },
                0
              ]
            },
            replyRate: {
              $cond: [
                { $gt: ['$analytics.readCount', 0] },
                { $multiply: [{ $divide: ['$analytics.replyCount', '$analytics.readCount'] }, 100] },
                0
              ]
            }
          }
        }
      },
      { $sort: sortField },
      { $limit: parseInt(limit) },
      {
        $project: {
          name: 1,
          status: 1,
          createdAt: 1,
          analytics: 1,
          calculated: 1
        }
      }
    ]);
    
    res.json({
      success: true,
      data: topCampaigns,
      sortedBy: sortBy,
      limit: parseInt(limit)
    });
    
  } catch (error) {
    console.error('❌ Error fetching top campaigns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top campaigns',
      error: error.message
    });
  }
});

// Get dashboard analytics
router.get('/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Campaign statistics
    const totalCampaigns = await Campaign.countDocuments({ user: userId });
    const activeCampaigns = await Campaign.countDocuments({ 
      user: userId, 
      status: { $in: ['running', 'scheduled'] }
    });
    const completedCampaigns = await Campaign.countDocuments({ 
      user: userId, 
      status: 'completed' 
    });

    // Contact statistics
    const totalContacts = await Contact.countDocuments({ 
      user: userId, 
      isActive: true 
    });

    // Message statistics
    const messageStats = await Campaign.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalSent: { $sum: '$analytics.sentCount' },
          totalDelivered: { $sum: '$analytics.deliveredCount' },
          totalRead: { $sum: '$analytics.readCount' },
          totalReplies: { $sum: '$analytics.replyCount' }
        }
      }
    ]);

    // Campaign performance over time
    const campaignPerformance = await Campaign.aggregate([
      { $match: { user: userId, status: 'completed' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          campaigns: { $sum: 1 },
          messagesSent: { $sum: '$analytics.sentCount' },
          deliveryRate: { 
            $avg: { 
              $divide: ['$analytics.deliveredCount', '$analytics.sentCount'] 
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Top performing campaigns
    const topCampaigns = await Campaign.find({ user: userId })
      .sort({ 'analytics.readCount': -1 })
      .limit(5)
      .select('name analytics createdAt');

    res.json({
      analytics: {
        totalCampaigns,
        activeCampaigns,
        completedCampaigns,
        totalContacts,
        messagesSent: messageStats[0]?.totalSent || 0,
        messagesDelivered: messageStats[0]?.totalDelivered || 0,
        messagesRead: messageStats[0]?.totalRead || 0,
        totalReplies: messageStats[0]?.totalReplies || 0,
        deliveryRate: messageStats[0]?.totalSent > 0 ? 
          Math.round((messageStats[0]?.totalDelivered / messageStats[0]?.totalSent) * 100) : 0,
        readRate: messageStats[0]?.totalSent > 0 ? 
          Math.round((messageStats[0]?.totalRead / messageStats[0]?.totalSent) * 100) : 0
      },
      campaignPerformance,
      topCampaigns
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Get campaign analytics
router.get('/campaigns/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Calculate delivery rates
    const deliveryRate = campaign.analytics.sentCount > 0 
      ? (campaign.analytics.deliveredCount / campaign.analytics.sentCount) * 100 
      : 0;
    
    const readRate = campaign.analytics.deliveredCount > 0 
      ? (campaign.analytics.readCount / campaign.analytics.deliveredCount) * 100 
      : 0;
    
    const replyRate = campaign.analytics.readCount > 0 
      ? (campaign.analytics.replyCount / campaign.analytics.readCount) * 100 
      : 0;

    res.json({
      campaign: {
        id: campaign._id,
        name: campaign.name,
        status: campaign.status,
        createdAt: campaign.createdAt
      },
      analytics: {
        ...campaign.analytics,
        rates: {
          delivery: Math.round(deliveryRate * 100) / 100,
          read: Math.round(readRate * 100) / 100,
          reply: Math.round(replyRate * 100) / 100
        }
      }
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Get contact engagement analytics
router.get('/contacts/engagement', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Most engaged contacts
    const topContacts = await Contact.find({ user: userId, isActive: true })
      .sort({ messageCount: -1 })
      .limit(10)
      .select('name phone messageCount lastMessageSent');

    // Contact distribution by tags
    const tagDistribution = await Contact.aggregate([
      { $match: { user: userId, isActive: true } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Contact activity timeline
    const activityTimeline = await Contact.aggregate([
      { $match: { user: userId, isActive: true, lastMessageSent: { $exists: true } } },
      {
        $group: {
          _id: {
            year: { $year: '$lastMessageSent' },
            month: { $month: '$lastMessageSent' },
            day: { $dayOfMonth: '$lastMessageSent' }
          },
          contactCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      { $limit: 30 }
    ]);

    res.json({
      topContacts,
      tagDistribution,
      activityTimeline
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Export analytics data
router.get('/export', auth, async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    const userId = req.user.id;
    
    let data = {};
    const dateFilter = {};
    
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (type === 'campaigns' || type === 'all') {
      data.campaigns = await Campaign.find({
        user: userId,
        ...dateFilter
      }).select('name status analytics createdAt updatedAt');
    }

    if (type === 'contacts' || type === 'all') {
      data.contacts = await Contact.find({
        user: userId,
        isActive: true,
        ...dateFilter
      }).select('name phone email tags messageCount lastMessageSent createdAt');
    }

    res.json(data);

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;