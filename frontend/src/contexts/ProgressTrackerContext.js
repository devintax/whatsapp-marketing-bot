import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

// Create context
const ProgressTrackerContext = createContext();

// Custom hook to use the context
export const useProgressTracker = () => {
  const context = useContext(ProgressTrackerContext);
  if (!context) {
    throw new Error('useProgressTracker must be used within a ProgressTrackerProvider');
  }
  return context;
};

// Progress Tracker Provider
export const ProgressTrackerProvider = ({ children }) => {
  const [activeTrackers, setActiveTrackers] = useState(new Map());
  const [analytics, setAnalytics] = useState({
    totalCampaigns: 0,
    activeContacts: 0,
    messagesSent: 0,
    successRate: 0,
    dailyStats: [],
    realtimeMetrics: {
      messagesPerMinute: 0,
      averageDeliveryTime: 0,
      errorRate: 0
    }
  });

  // Start tracking a new campaign
  const startTracking = useCallback((campaignId, campaignData) => {
    const tracker = {
      id: campaignId,
      title: campaignData.title || `Campaign ${campaignId}`,
      messages: campaignData.messages || [],
      startTime: Date.now(),
      status: 'active',
      retryCount: 0,
      analytics: {
        totalMessages: campaignData.messages?.length || 0,
        sentCount: 0,
        failedCount: 0,
        pendingCount: campaignData.messages?.length || 0,
        successRate: 0
      }
    };

    setActiveTrackers(prev => new Map(prev.set(campaignId, tracker)));
    
    // Start polling for updates
    pollCampaignProgress(campaignId);
    
    // Track analytics event
    trackEvent('campaign_started', {
      campaignId,
      totalMessages: tracker.analytics.totalMessages,
      timestamp: new Date().toISOString()
    });

    return tracker;
  }, []);

  // Stop tracking a campaign
  const stopTracking = useCallback((campaignId, reason = 'completed') => {
    const tracker = activeTrackers.get(campaignId);
    if (tracker) {
      // Track completion analytics
      trackEvent('campaign_completed', {
        campaignId,
        duration: Date.now() - tracker.startTime,
        totalMessages: tracker.analytics.totalMessages,
        successRate: tracker.analytics.successRate,
        reason,
        timestamp: new Date().toISOString()
      });

      // Update global analytics
      updateGlobalAnalytics(tracker);
    }

    setActiveTrackers(prev => {
      const newMap = new Map(prev);
      newMap.delete(campaignId);
      return newMap;
    });
  }, [activeTrackers]);

  // Update message status
  const updateMessageStatus = useCallback((campaignId, messageId, status, metadata = {}) => {
    setActiveTrackers(prev => {
      const newMap = new Map(prev);
      const tracker = newMap.get(campaignId);
      
      if (tracker) {
        // Update message in tracker
        const updatedMessages = tracker.messages.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                status, 
                ...metadata,
                updatedAt: new Date().toISOString()
              }
            : msg
        );

        // Recalculate analytics
        const sentCount = updatedMessages.filter(m => m.status === 'sent').length;
        const failedCount = updatedMessages.filter(m => m.status === 'failed').length;
        const pendingCount = updatedMessages.filter(m => 
          m.status === 'pending' || m.status === 'sending'
        ).length;
        const successRate = tracker.analytics.totalMessages > 0 
          ? Math.round((sentCount / tracker.analytics.totalMessages) * 100) 
          : 0;

        const updatedTracker = {
          ...tracker,
          messages: updatedMessages,
          analytics: {
            ...tracker.analytics,
            sentCount,
            failedCount,
            pendingCount,
            successRate
          }
        };

        newMap.set(campaignId, updatedTracker);

        // Track individual message events
        trackEvent(`message_${status}`, {
          campaignId,
          messageId,
          recipient: metadata.recipient,
          timestamp: new Date().toISOString(),
          ...metadata
        });
      }
      
      return newMap;
    });
  }, []);

  // Retry failed messages
  const retryFailedMessages = useCallback(async (campaignId, messageId = null) => {
    const tracker = activeTrackers.get(campaignId);
    if (!tracker) return;

    try {
      const token = localStorage.getItem('token');
      const failedMessages = messageId 
        ? tracker.messages.filter(m => m.id === messageId)
        : tracker.messages.filter(m => m.status === 'failed');

      for (const message of failedMessages) {
        // Reset message status to pending
        updateMessageStatus(campaignId, message.id, 'pending', {
          retryCount: (message.retryCount || 0) + 1
        });

        // Send retry request to backend
        await axios.post(
          `${API_ENDPOINTS.WHATSAPP.SEND_MESSAGE}`,
          {
            campaignId,
            messageId: message.id,
            recipient: message.recipient,
            content: message.content,
            isRetry: true
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      }

      trackEvent('messages_retried', {
        campaignId,
        retryCount: failedMessages.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to retry messages:', error);
      trackEvent('retry_failed', {
        campaignId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }, [activeTrackers, updateMessageStatus]);

  // Poll campaign progress from backend
  const pollCampaignProgress = useCallback(async (campaignId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_ENDPOINTS.CAMPAIGNS.PROGRESS(campaignId)}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const { messages, status, analytics } = response.data;

      // Update tracker with latest data
      setActiveTrackers(prev => {
        const newMap = new Map(prev);
        const tracker = newMap.get(campaignId);
        
        if (tracker && status !== 'completed') {
          newMap.set(campaignId, {
            ...tracker,
            messages: messages || tracker.messages,
            analytics: analytics || tracker.analytics,
            lastUpdated: Date.now()
          });

          // Continue polling if still active
          setTimeout(() => pollCampaignProgress(campaignId), 2000);
        } else if (status === 'completed') {
          stopTracking(campaignId, 'completed');
        }
        
        return newMap;
      });

    } catch (error) {
      console.error('Failed to poll campaign progress:', error);
      // Retry polling after error
      setTimeout(() => pollCampaignProgress(campaignId), 5000);
    }
  }, [stopTracking]);

  // Track analytics events
  const trackEvent = useCallback((eventType, data) => {
    // Update real-time analytics
    setAnalytics(prev => {
      const newAnalytics = { ...prev };
      
      switch (eventType) {
        case 'message_sent':
          newAnalytics.messagesSent += 1;
          break;
        case 'campaign_started':
          newAnalytics.totalCampaigns += 1;
          break;
        case 'message_failed':
          // Update error rate
          break;
        default:
          break;
      }
      
      return newAnalytics;
    });

    // Send to analytics backend
    sendAnalyticsEvent(eventType, data);
  }, []);

  // Send analytics to backend
  const sendAnalyticsEvent = async (eventType, data) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_ENDPOINTS.ANALYTICS.TRACK_EVENT}`,
        {
          eventType,
          data,
          timestamp: new Date().toISOString(),
          sessionId: getSessionId()
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
    } catch (error) {
      // Silently fail analytics - don't interrupt user flow
      console.warn('Analytics tracking failed:', error.message);
    }
  };

  // Update global analytics from completed campaign
  const updateGlobalAnalytics = (completedTracker) => {
    setAnalytics(prev => ({
      ...prev,
      messagesSent: prev.messagesSent + completedTracker.analytics.sentCount,
      successRate: calculateOverallSuccessRate(prev, completedTracker),
      realtimeMetrics: {
        ...prev.realtimeMetrics,
        averageDeliveryTime: calculateAverageDeliveryTime(completedTracker)
      }
    }));
  };

  // Helper functions
  const calculateOverallSuccessRate = (currentAnalytics, newTracker) => {
    const totalMessages = currentAnalytics.messagesSent + newTracker.analytics.totalMessages;
    const totalSuccessful = currentAnalytics.messagesSent + newTracker.analytics.sentCount;
    return totalMessages > 0 ? Math.round((totalSuccessful / totalMessages) * 100) : 0;
  };

  const calculateAverageDeliveryTime = (tracker) => {
    const sentMessages = tracker.messages.filter(m => m.status === 'sent' && m.deliveredAt);
    if (sentMessages.length === 0) return 0;
    
    const totalTime = sentMessages.reduce((sum, msg) => {
      return sum + (new Date(msg.deliveredAt) - new Date(msg.sentAt));
    }, 0);
    
    return Math.round(totalTime / sentMessages.length / 1000);
  };

  const getSessionId = () => {
    let sessionId = sessionStorage.getItem('progressTracker_sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('progressTracker_sessionId', sessionId);
    }
    return sessionId;
  };

  // Fetch initial analytics on mount
  useEffect(() => {
    const fetchInitialAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_ENDPOINTS.ANALYTICS.DASHBOARD}?days=30`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setAnalytics(prev => ({
          ...prev,
          ...response.data,
          realtimeMetrics: {
            ...prev.realtimeMetrics,
            ...response.data.realtimeMetrics
          }
        }));
      } catch (error) {
        console.error('Failed to fetch initial analytics:', error);
      }
    };

    fetchInitialAnalytics();
  }, []);

  const value = {
    activeTrackers: Array.from(activeTrackers.values()),
    analytics,
    startTracking,
    stopTracking,
    updateMessageStatus,
    retryFailedMessages,
    trackEvent
  };

  return (
    <ProgressTrackerContext.Provider value={value}>
      {children}
    </ProgressTrackerContext.Provider>
  );
};

export default ProgressTrackerProvider;