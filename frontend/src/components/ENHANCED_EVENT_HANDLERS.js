// 🎯 REAL-TIME ANALYTICS - ENHANCED EVENT HANDLER SNIPPET
// Replace the event handlers in RealTimeAnalyticsDashboard.js (lines ~112-173)

    // Real-time message status updates
    newSocket.on('message_status_update', (data) => {
      console.log('📨 Received message_status_update event:', data);
      
      // 🎯 ENHANCED: Handle full stats payload from backend
      if (data.messageStats) {
        // Full stats update from backend
        console.log('   ✅ Full messageStats received:', data.messageStats);
        setAnalytics(prev => ({
          ...prev,
          messageStats: data.messageStats,
          campaignStats: data.campaignStats || prev.campaignStats,
          lastUpdated: new Date()
        }));
      } else if (data.status) {
        // Incremental update (fallback for compatibility)
        console.log('   ⚡ Incremental update for status:', data.status);
        setAnalytics(prev => {
          const newStats = { ...prev.messageStats };
          
          // Increment the appropriate counter
          if (data.status === 'sent') {
            newStats.sentMessages = (newStats.sentMessages || 0) + 1;
          } else if (data.status === 'failed') {
            newStats.failedMessages = (newStats.failedMessages || 0) + 1;
          } else if (data.status === 'pending') {
            newStats.pendingMessages = (newStats.pendingMessages || 0) + 1;
          }
          
          // Recalculate delivery rate
          const total = newStats.sentMessages + newStats.failedMessages;
          newStats.deliveryRate = total > 0 
            ? Math.round((newStats.sentMessages / total) * 100) 
            : 0;
          newStats.totalMessages = total;
          
          return {
            ...prev,
            messageStats: newStats,
            lastUpdated: new Date()
          };
        });
      }

      // Update message breakdown if provided
      if (data.breakdown) {
        console.log('   📊 Updating message breakdown');
        setMessageBreakdown(data.breakdown);
      }

      // Notify parent component of progress update
      if (onProgressUpdate && data.progress) {
        onProgressUpdate(data.progress);
      }
    });

    // Campaign progress updates
    newSocket.on('campaign_progress', (data) => {
      console.log('📨 Received campaign_progress event:', data);
      
      if (onProgressUpdate) {
        onProgressUpdate(data);
      }
    });

    // Dashboard stats updates
    newSocket.on('dashboard_stats_update', (data) => {
      console.log('📨 Received dashboard_stats_update event:', data);
      setAnalytics(prev => ({
        ...prev,
        ...data,
        lastUpdated: new Date()
      }));
    });
    
    // Additional event listeners for backend compatibility
    newSocket.on('dashboard:message_update', (data) => {
      console.log('📨 Received dashboard:message_update event:', data);
      
      // 🎯 ENHANCED: Use dashboardStats if available
      if (data.dashboardStats) {
        console.log('   ✅ Dashboard stats from event:', data.dashboardStats);
        setAnalytics(prev => ({
          ...prev,
          messageStats: data.dashboardStats.messageStats || prev.messageStats,
          campaignStats: data.dashboardStats.campaignStats || prev.campaignStats,
          totalContacts: data.dashboardStats.totalContacts || prev.totalContacts,
          lastUpdated: new Date()
        }));
      }
      
      // Update recent activity with this message
      if (data.phone && data.status) {
        setRecentActivity(prev => {
          const newActivity = {
            id: Date.now(),
            phone: data.phone,
            status: data.status,
            timestamp: data.timestamp || new Date(),
            error: data.error,
            campaignId: data.campaignId
          };
          
          // Add to front of list and limit to 10 most recent
          return [newActivity, ...prev].slice(0, 10);
        });
      }
    });
    
    newSocket.on('dashboard:stats_update', (data) => {
      console.log('📨 Received dashboard:stats_update event:', data);
      setAnalytics(prev => ({
        ...prev,
        ...data,
        lastUpdated: new Date()
      }));
    });
    
    newSocket.on('dashboard:recent_activity', (data) => {
      console.log('📨 Received dashboard:recent_activity event:', data);
      setRecentActivity(data);
    });
