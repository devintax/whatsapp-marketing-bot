/**
 * 🔄 REAL-TIME ANALYTICS SERVICE
 * 
 * Integrates the floating progress tracker with the analytics dashboard
 * Provides WebSocket-based real-time updates for message status and campaign metrics
 */

const MessageLog = require('../models/MessageLog');
const Campaign = require('../models/Campaign');

class RealTimeAnalyticsService {
  static io = null;
  static connectedUsers = new Map(); // userId -> socket mapping
  static activeCampaigns = new Map(); // campaignId -> campaign data
  
  static async initialize(io) {
    this.io = io;
    console.log('🔄 Real-Time Analytics Service - initialize() called');
    console.log('   Socket.io instance:', io ? '✅ PROVIDED' : '❌ NULL');
    
    this.setupSocketHandlers();
    console.log('✅ Real-Time Analytics Service initialized successfully');
    console.log('   io.engine.clientsCount:', io.engine ? io.engine.clientsCount : 'N/A');
  }
  
  static setupSocketHandlers() {
    const self = this; // 🔧 FIX: Preserve class context
    
    this.io.on('connection', (socket) => {
      console.log(`📱 Client connected: ${socket.id}`);
      
      // Handle user joining room
      socket.on('join_user_room', async (data) => { // 🔧 FIX: Make async
        const { userId } = data;
        if (userId) {
          socket.userId = userId;
          socket.join(`user_${userId}`);
          self.connectedUsers.set(userId, socket);
          console.log(`✅ User joined room: user_${userId}`);
          
          // Send initial dashboard data
          try {
            await self.sendDashboardStats(userId); // 🔧 FIX: Use self and await
            await self.sendActiveCampaigns(userId); // 🔧 FIX: Use self and await
          } catch (error) {
            console.error('❌ Error sending initial dashboard data:', error);
          }
        }
      });
      
      // Handle campaign start events
      socket.on('campaign:start', async (data) => {
        const { campaignId, campaignName, totalRecipients, userId } = data;
        
        // Store active campaign
        this.activeCampaigns.set(campaignId, {
          id: campaignId,
          name: campaignName,
          totalRecipients,
          userId,
          startTime: new Date(),
          status: 'running',
          sent: 0,
          failed: 0,
          delivered: 0,
          read: 0
        });
        
        // Notify dashboard of new campaign
        this.broadcastToUser(userId, 'dashboard:campaign_started', {
          campaignId,
          campaignName,
          totalRecipients,
          startTime: new Date()
        });
        
        console.log(`🚀 Campaign started: ${campaignName} (${totalRecipients} recipients)`);
      });
      
      // Handle campaign completion
      socket.on('campaign:complete', async (data) => {
        const { campaignId } = data;
        const campaign = this.activeCampaigns.get(campaignId);
        
        if (campaign) {
          campaign.status = 'completed';
          campaign.endTime = new Date();
          campaign.duration = campaign.endTime - campaign.startTime;
          
          // Generate completion analytics
          const analytics = await this.generateCampaignSummary(campaignId);
          
          // Notify dashboard
          this.broadcastToUser(campaign.userId, 'dashboard:campaign_completed', {
            campaignId,
            campaignName: campaign.name,
            analytics,
            duration: campaign.duration
          });
          
          // Clean up after delay
          setTimeout(() => {
            this.activeCampaigns.delete(campaignId);
          }, 300000); // 5 minutes
          
          console.log(`✅ Campaign completed: ${campaign.name}`);
        }
      });
      
      // Handle message status updates
      socket.on('message:status', async (data) => {
        await this.handleMessageStatus(data);
      });
      
      // Handle dashboard requests
      socket.on('dashboard:request_stats', async (data) => {
        const { userId } = data;
        await this.sendDashboardStats(userId);
      });
      
      socket.on('dashboard:request_recent_activity', async (data) => {
        const { userId, limit = 10 } = data;
        await this.sendRecentActivity(userId, limit);
      });
      
      // Handle disconnection
      socket.on('disconnect', () => {
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
          console.log(`📱 User disconnected: ${socket.userId}`);
        }
      });
    });
  }
  
  /**
   * Handle individual message status updates
   * This method updates the database AND triggers real-time Socket.io events
   */
  static async handleMessageStatus(data) {
    const {
      campaignId,
      phone,
      status,
      error = null,
      processingTime = null,
      whatsappMessageId = null,
      batchInfo = {}
    } = data;
    
    try {
      console.log(`📊 handleMessageStatus() called: ${phone} → ${status}`);
      
      // Update or create message log
      const messageLog = await MessageLog.findOneAndUpdate(
        { campaignId, phone },
        {
          $set: {
            status,
            [`${status}At`]: new Date(),
            error,
            processingTime,
            whatsappMessageId,
            ...batchInfo,
            dashboardNotified: false
          },
          $inc: { retryCount: status.includes('retry') ? 1 : 0 }
        },
        { upsert: true, new: true }
      );
      
      // Update active campaign stats
      const campaign = this.activeCampaigns.get(campaignId);
      if (campaign) {
        campaign[status] = (campaign[status] || 0) + 1;
        
        // Calculate success rate
        const total = campaign.sent + campaign.failed;
        campaign.successRate = total > 0 ? Math.round((campaign.sent / total) * 100) : 0;
        
        // Update delivery rate
        if (campaign.delivered > 0) {
          campaign.deliveryRate = Math.round((campaign.delivered / campaign.sent) * 100);
        }
        
        // Update read rate
        if (campaign.read > 0) {
          campaign.readRate = Math.round((campaign.read / campaign.delivered) * 100);
        }
      }
      
      // 🎯 GET UPDATED DASHBOARD STATS FROM DATABASE
      const userId = messageLog.user.toString();
      console.log(`📊 Fetching updated dashboard stats for user: ${userId}`);
      
      const dashboardStats = await MessageLog.getDashboardStats(userId);
      console.log('📊 Dashboard stats:', JSON.stringify(dashboardStats, null, 2));
      
      // 🎯 BROADCAST COMPREHENSIVE UPDATE TO USER'S DASHBOARD
      this.broadcastToUser(userId, 'dashboard:message_update', {
        campaignId,
        phone,
        status,
        timestamp: new Date(),
        error,
        campaignStats: campaign ? {
          sent: campaign.sent,
          failed: campaign.failed,
          delivered: campaign.delivered,
          read: campaign.read,
          successRate: campaign.successRate,
          deliveryRate: campaign.deliveryRate,
          readRate: campaign.readRate
        } : null,
        // 🎯 INCLUDE FULL DASHBOARD STATS FOR IMMEDIATE UI UPDATE
        dashboardStats: dashboardStats
      });
      
      // 🎯 ALSO EMIT message_status_update WITH FULL STATS
      // This ensures compatibility with different frontend listeners
      this.broadcastToUser(userId, 'message_status_update', {
        campaignId,
        phone,
        status,
        timestamp: new Date(),
        error,
        messageStats: dashboardStats.messageStats, // Include full message stats
        campaignStats: dashboardStats.campaignStats,
        batchInfo: batchInfo
      });
      
      // Update dashboard stats in real-time
      await this.sendDashboardStats(userId);
      
      console.log(`✅ Message status updated and broadcasted: ${phone} → ${status}`);
      
    } catch (error) {
      console.error('❌ Error handling message status:', error);
      console.error(error.stack);
    }
  }
  
  /**
   * Emit message status update for real-time tracking (Simplified for tests)
   */
  static async emitMessageStatus(data) {
    const { userId, campaignId, status, batchNumber, progress } = data;
    
    console.log('📡 emitMessageStatus() called:');
    console.log('   userId:', userId);
    console.log('   campaignId:', campaignId);
    console.log('   status:', status);
    console.log('   batchNumber:', batchNumber);
    console.log('   io available:', this.io ? '✅ YES' : '❌ NO');
    
    if (this.io) {
      const roomName = `user_${userId}`;
      console.log(`   Emitting to room: ${roomName}`);
      
      this.io.to(roomName).emit('message_status_update', {
        campaignId,
        status,
        batchNumber,
        progress,
        timestamp: new Date()
      });
      console.log(`✅ Message status update emitted successfully`);
    } else {
      console.log('⚠️  WARNING: Cannot emit - Socket.io not initialized');
    }
  }
  
  /**
   * Emit campaign progress update (Simplified for tests)
   */
  static async emitCampaignProgress(data) {
    const { userId, campaignId, progress } = data;
    
    if (this.io) {
      this.io.to(`user_${userId}`).emit('campaign_progress', {
        campaignId,
        progress,
        timestamp: new Date()
      });
      console.log(`📡 Emitted campaign progress to user_${userId}:`, progress);
    }
  }
  
  /**
   * Emit dashboard stats update (Simplified for tests)
   */
  static async emitDashboardUpdate(data) {
    const { userId, stats } = data;
    
    if (this.io) {
      this.io.to(`user_${userId}`).emit('dashboard_stats_update', {
        ...stats,
        timestamp: new Date()
      });
      console.log(`📡 Emitted dashboard update to user_${userId}`);
    }
  }
  
  /**
   * Send real-time dashboard statistics
   */
  static async sendDashboardStats(userId) { // 🔧 FIX: Add static
    try {
      const stats = await MessageLog.getDashboardStats(userId);
      
      // Add active campaigns count
      const activeCampaignCount = Array.from(this.activeCampaigns.values())
        .filter(campaign => campaign.userId === userId && campaign.status === 'running').length;
      
      stats.activeCampaigns = activeCampaignCount;
      
      this.broadcastToUser(userId, 'dashboard:stats_update', stats);
      
    } catch (error) {
      console.error('❌ Error sending dashboard stats:', error);
    }
  }
  
  /**
   * Send recent activity feed
   */
  static async sendRecentActivity(userId, limit = 10) { // 🔧 FIX: Add static
    try {
      const recentLogs = await MessageLog.find({
        user: userId
      })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('campaignId', 'name type')
      .lean();
      
      const activities = recentLogs.map(log => ({
        id: log._id,
        campaignName: log.campaignId?.name || 'Unknown Campaign',
        phone: log.phone,
        contactName: log.contactName,
        status: log.status,
        timestamp: log.timestamp,
        error: log.error
      }));
      
      this.broadcastToUser(userId, 'dashboard:recent_activity', activities);
      
    } catch (error) {
      console.error('❌ Error sending recent activity:', error);
    }
  }
  
  /**
   * Send active campaigns to user
   */
  static async sendActiveCampaigns(userId) { // 🔧 FIX: Add static
    const userCampaigns = Array.from(this.activeCampaigns.values())
      .filter(campaign => campaign.userId === userId);
    
    this.broadcastToUser(userId, 'dashboard:active_campaigns', userCampaigns);
  }
  
  /**
   * Generate campaign summary analytics
   */
  static async generateCampaignSummary(campaignId) { // 🔧 FIX: Add static
    try {
      const analytics = await MessageLog.getCampaignAnalytics(campaignId);
      return analytics[0] || {};
    } catch (error) {
      console.error('❌ Error generating campaign summary:', error);
      return {};
    }
  }
  
  /**
   * Broadcast message to specific user
   */
  static broadcastToUser(userId, event, data) { // 🔧 FIX: Add static
    const socket = this.connectedUsers.get(userId);
    if (socket) {
      socket.emit(event, data);
    }
  }
  
  /**
   * Broadcast message to all connected users
   */
  static broadcastToAll(event, data) { // 🔧 FIX: Add static
    this.io.emit(event, data);
  }
  
  /**
   * Log message event (called from campaign sending logic)
   */
  static async logMessageEvent(data) { // 🔧 FIX: Add static
    const {
      campaignId,
      userId,
      phone,
      contactName = null,
      status,
      messageContent = null,
      error = null,
      batchInfo = {}
    } = data;
    
    try {
      // Create message log entry
      const messageLog = new MessageLog({
        campaignId,
        user: userId,
        phone,
        contactName,
        status,
        messageContent,
        messageLength: messageContent ? messageContent.length : 0,
        error,
        timestamp: new Date(),
        [`${status}At`]: new Date(),
        ...batchInfo
      });
      
      await messageLog.save();
      
      // Emit real-time update
      await this.handleMessageStatus({
        campaignId,
        phone,
        status,
        error,
        batchInfo
      });
      
      return messageLog;
      
    } catch (error) {
      console.error('❌ Error logging message event:', error);
      throw error;
    }
  }
  
  /**
   * Get Socket.io instance for external use
   */
  static getSocketInstance() { // 🔧 FIX: Add static
    return this.io;
  }
}

module.exports = RealTimeAnalyticsService;