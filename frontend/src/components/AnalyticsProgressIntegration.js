import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  TrendingUp,
  Timeline,
  Speed,
  CheckCircle,
  Error,
  Refresh,
  Analytics
} from '@mui/icons-material';
import { API_ENDPOINTS } from '../config/api';

/**
 * 🔗 ANALYTICS PROGRESS INTEGRATION
 * 
 * Enhanced analytics integration that works with the floating progress tracker
 * to provide real-time metrics, performance insights, and campaign analytics.
 */
const AnalyticsProgressIntegration = ({ 
  campaignData, 
  progressData,
  isVisible = false 
}) => {
  const [analytics, setAnalytics] = useState({
    realTimeMetrics: {
      messagesPerMinute: 0,
      deliverySuccessRate: 0,
      averageResponseTime: 0,
      currentThroughput: 0
    },
    campaignMetrics: {
      totalCampaigns: 0,
      activeContacts: 0,
      messagesSent: 0,
      successRate: 0
    },
    performanceData: {
      retryFrequency: 0,
      timeToCompletion: 0,
      batchEfficiency: 0,
      errorPatterns: []
    },
    activityFeed: []
  });

  const [isPolling, setIsPolling] = useState(false);

  // Real-time analytics polling
  useEffect(() => {
    if (!campaignData?.campaignId || !isVisible) return;

    setIsPolling(true);
    
    const pollAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch real-time campaign analytics
        const analyticsResponse = await axios.get(
          `${API_ENDPOINTS.ANALYTICS.CAMPAIGNS}?campaignId=${campaignData.campaignId}&realTime=true`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Calculate real-time metrics
        const metrics = calculateRealTimeMetrics(analyticsResponse.data, progressData);
        
        setAnalytics(prev => ({
          ...prev,
          realTimeMetrics: metrics.realTime,
          campaignMetrics: metrics.campaign,
          performanceData: metrics.performance,
          activityFeed: metrics.activityFeed
        }));

        // Track analytics events
        trackAnalyticsEvents(metrics);

      } catch (error) {
        console.error('Analytics polling failed:', error);
      }
    };

    // Initial analytics fetch
    pollAnalytics();

    // Poll every 10 seconds (less frequent than progress tracker)
    const interval = setInterval(pollAnalytics, 10000);

    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [campaignData?.campaignId, isVisible, progressData]);

  // Calculate real-time metrics from progress and analytics data
  const calculateRealTimeMetrics = (analyticsData, progressData) => {
    const now = new Date();
    const campaignStart = new Date(campaignData.startTime || now);
    const elapsedMinutes = (now - campaignStart) / (1000 * 60);
    
    // Real-time calculations
    const messagesPerMinute = elapsedMinutes > 0 ? 
      Math.round((progressData?.sent || 0) / elapsedMinutes) : 0;
    
    const deliverySuccessRate = progressData?.total > 0 ? 
      Math.round(((progressData.sent || 0) / progressData.total) * 100) : 0;
    
    const retryFrequency = progressData?.failed > 0 ? 
      Math.round((progressData.failed / progressData.total) * 100) : 0;

    // Batch efficiency calculation
    const batchEfficiency = progressData?.batching ? 
      Math.round((progressData.batching.currentBatch / progressData.batching.totalBatches) * 100) : 100;

    return {
      realTime: {
        messagesPerMinute,
        deliverySuccessRate,
        averageResponseTime: analyticsData.averageResponseTime || 0,
        currentThroughput: messagesPerMinute
      },
      campaign: {
        totalCampaigns: analyticsData.totalCampaigns || 0,
        activeContacts: progressData?.total || 0,
        messagesSent: progressData?.sent || 0,
        successRate: deliverySuccessRate
      },
      performance: {
        retryFrequency,
        timeToCompletion: estimateTimeToCompletion(progressData),
        batchEfficiency,
        errorPatterns: analyticsData.errorPatterns || []
      },
      activityFeed: generateActivityFeed(progressData, analyticsData)
    };
  };

  // Estimate time to completion based on current progress
  const estimateTimeToCompletion = (progressData) => {
    if (!progressData?.batching || progressData.completed) return 0;
    
    const remainingBatches = progressData.batching.totalBatches - progressData.batching.currentBatch;
    const avgBatchTime = 35; // seconds per batch (based on 30s delay + processing)
    
    return Math.round((remainingBatches * avgBatchTime) / 60); // minutes
  };

  // Generate activity feed for real-time updates
  const generateActivityFeed = (progressData, analyticsData) => {
    const activities = [];
    
    if (progressData?.sent > 0) {
      activities.push({
        type: 'success',
        message: `${progressData.sent} messages sent successfully`,
        timestamp: new Date().toLocaleTimeString()
      });
    }
    
    if (progressData?.failed > 0) {
      activities.push({
        type: 'error',
        message: `${progressData.failed} messages failed to send`,
        timestamp: new Date().toLocaleTimeString()
      });
    }
    
    if (progressData?.batching && progressData.batching.currentBatch > 0) {
      activities.push({
        type: 'info',
        message: `Processing batch ${progressData.batching.currentBatch} of ${progressData.batching.totalBatches}`,
        timestamp: new Date().toLocaleTimeString()
      });
    }
    
    return activities.slice(0, 5); // Keep only latest 5 activities
  };

  // Track analytics events for campaign performance
  const trackAnalyticsEvents = (metrics) => {
    // Track key events for analytics dashboard
    const events = [];
    
    if (metrics.realTime.messagesPerMinute > 0) {
      events.push({
        type: 'message_throughput',
        value: metrics.realTime.messagesPerMinute,
        campaignId: campaignData.campaignId
      });
    }
    
    if (metrics.realTime.deliverySuccessRate > 0) {
      events.push({
        type: 'delivery_success_rate',
        value: metrics.realTime.deliverySuccessRate,
        campaignId: campaignData.campaignId
      });
    }
    
    if (progressData?.completed) {
      events.push({
        type: 'campaign_completed',
        campaignId: campaignData.campaignId,
        totalSent: progressData.sent,
        totalFailed: progressData.failed,
        successRate: metrics.realTime.deliverySuccessRate
      });
    }
    
    // Send events to analytics service (fire and forget)
    events.forEach(event => {
      trackAnalyticsEvent(event).catch(err => 
        console.warn('Analytics event tracking failed:', err)
      );
    });
  };

  // Track individual analytics event
  const trackAnalyticsEvent = async (event) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        API_ENDPOINTS.ANALYTICS.EVENTS,
        {
          ...event,
          timestamp: new Date().toISOString(),
          sessionId: campaignData.campaignId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      // Silently fail - analytics shouldn't break the campaign
      console.warn('Analytics event failed:', error);
    }
  };

  if (!isVisible || !progressData) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 20,
        right: 20,
        width: 400,
        zIndex: 1200,
        maxHeight: '80vh',
        overflow: 'auto'
      }}
    >
      <Card elevation={8} sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Analytics sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Campaign Analytics</Typography>
            {isPolling && (
              <Refresh 
                sx={{ 
                  ml: 'auto', 
                  animation: 'spin 2s linear infinite',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }} 
              />
            )}
          </Box>

          {/* Real-time Metrics */}
          <Typography variant="subtitle2" gutterBottom>Real-time Metrics</Typography>
          <Grid container spacing={1} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Paper sx={{ p: 1, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  {analytics.realTimeMetrics.messagesPerMinute}
                </Typography>
                <Typography variant="caption">msg/min</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6}>
              <Paper sx={{ p: 1, textAlign: 'center' }}>
                <Typography variant="h6" color="success.main">
                  {analytics.realTimeMetrics.deliverySuccessRate}%
                </Typography>
                <Typography variant="caption">success rate</Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Performance Indicators */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Performance</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                size="small" 
                icon={<Speed />} 
                label={`${analytics.performanceData.batchEfficiency}% efficient`}
                color={analytics.performanceData.batchEfficiency > 80 ? 'success' : 'warning'}
              />
              <Chip 
                size="small" 
                icon={<Timeline />} 
                label={`${analytics.performanceData.timeToCompletion}min remaining`}
                color="info"
              />
              {analytics.performanceData.retryFrequency > 0 && (
                <Chip 
                  size="small" 
                  icon={<Error />} 
                  label={`${analytics.performanceData.retryFrequency}% retry rate`}
                  color="error"
                />
              )}
            </Box>
          </Box>

          {/* Activity Feed */}
          {analytics.activityFeed.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>Recent Activity</Typography>
              <List dense>
                {analytics.activityFeed.map((activity, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {activity.type === 'success' && <CheckCircle color="success" />}
                      {activity.type === 'error' && <Error color="error" />}
                      {activity.type === 'info' && <TrendingUp color="info" />}
                    </ListItemIcon>
                    <ListItemText 
                      primary={activity.message}
                      secondary={activity.timestamp}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default AnalyticsProgressIntegration;