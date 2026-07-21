import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Chip,
  Collapse,
  Divider,
  Button,
  Grid,
  Paper
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Schedule,
  Send,
  Close,
  ExpandMore,
  ExpandLess,
  Refresh,
  Analytics,
  TrendingUp,
  Speed
} from '@mui/icons-material';
import { API_ENDPOINTS } from '../config/api';
import AnalyticsProgressIntegration from './AnalyticsProgressIntegration';

/**
 * 🚀 FLOATING CAMPAIGN PROGRESS TRACKER
 * 
 * Real-time progress tracking for WhatsApp campaign sending with smart batching.
 * Shows detailed progress, error handling, and completion status.
 */
const CampaignProgressTracker = ({ 
  campaignData, 
  onClose, 
  onRetryFailed 
}) => {
  const [expanded, setExpanded] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [progress, setProgress] = useState({
    sent: 0,
    failed: 0,
    total: 0,
    currentBatch: 0,
    totalBatches: 0,
    status: 'preparing', // preparing, sending, completed, error
    details: [],
    batching: null,
    performance: null
  });

  // Analytics integration state
  const [analyticsData, setAnalyticsData] = useState({
    messagesPerMinute: 0,
    successRate: 0,
    estimatedCompletion: null,
    campaignMetrics: null
  });

  // Status polling for real-time updates with analytics integration
  useEffect(() => {
    if (!campaignData?.campaignId) return;

    const pollProgress = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch progress data
        const progressResponse = await axios.get(`${API_ENDPOINTS.WHATSAPP.CAMPAIGN_PROGRESS}/${campaignData.campaignId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (progressResponse.data) {
          const newProgress = {
            ...progressResponse.data,
            status: progressResponse.data.completed ? 'completed' : 'sending'
          };
          
          setProgress(prev => ({ ...prev, ...newProgress }));
          
          // Calculate analytics metrics
          const analytics = calculateAnalyticsMetrics(newProgress, campaignData);
          setAnalyticsData(analytics);
          
          // Track analytics events
          await trackProgressAnalytics(newProgress, analytics);
        }
      } catch (error) {
        console.error('Failed to poll campaign progress:', error);
      }
    };

    // Initial data from campaign start
    if (campaignData.initialProgress) {
      const initialProgress = {
        ...campaignData.initialProgress,
        status: 'sending'
      };
      setProgress(prev => ({ ...prev, ...initialProgress }));
      
      const initialAnalytics = calculateAnalyticsMetrics(initialProgress, campaignData);
      setAnalyticsData(initialAnalytics);
    }

    // Poll every 5 seconds for updates
    const interval = setInterval(pollProgress, 5000);

    return () => clearInterval(interval);
  }, [campaignData]);

  // Calculate real-time analytics metrics
  const calculateAnalyticsMetrics = (progressData, campaignData) => {
    const startTime = new Date(campaignData.startTime || Date.now());
    const currentTime = new Date();
    const elapsedMinutes = (currentTime - startTime) / (1000 * 60);
    
    const messagesPerMinute = elapsedMinutes > 0 ? 
      Math.round((progressData.sent || 0) / elapsedMinutes) : 0;
    
    const successRate = progressData.total > 0 ? 
      Math.round(((progressData.sent || 0) / progressData.total) * 100) : 0;
    
    // Estimate completion time based on current progress
    const estimatedCompletion = progressData.batching && !progressData.completed ? 
      estimateCompletionTime(progressData, elapsedMinutes) : null;
    
    return {
      messagesPerMinute,
      successRate,
      estimatedCompletion,
      elapsedMinutes: Math.round(elapsedMinutes),
      throughput: messagesPerMinute,
      errorRate: progressData.total > 0 ? Math.round(((progressData.failed || 0) / progressData.total) * 100) : 0
    };
  };

  // Estimate completion time based on current batching progress
  const estimateCompletionTime = (progressData, elapsedMinutes) => {
    if (!progressData.batching) return null;
    
    const { currentBatch, totalBatches } = progressData.batching;
    const completedBatches = currentBatch;
    const remainingBatches = totalBatches - completedBatches;
    
    if (completedBatches === 0) return null;
    
    const avgBatchTime = elapsedMinutes / completedBatches;
    const estimatedMinutesRemaining = Math.round(remainingBatches * avgBatchTime);
    
    return estimatedMinutesRemaining;
  };

  // Track analytics events for campaign performance
  const trackProgressAnalytics = async (progressData, analytics) => {
    try {
      const events = [];
      
      // Track throughput events
      if (analytics.messagesPerMinute > 0) {
        events.push({
          type: 'message_throughput',
          value: analytics.messagesPerMinute,
          timestamp: new Date().toISOString()
        });
      }
      
      // Track success rate events
      if (progressData.sent > 0) {
        events.push({
          type: 'delivery_success',
          sent: progressData.sent,
          failed: progressData.failed,
          successRate: analytics.successRate,
          timestamp: new Date().toISOString()
        });
      }
      
      // Track batch completion events
      if (progressData.batching && progressData.batching.currentBatch > 0) {
        events.push({
          type: 'batch_progress',
          currentBatch: progressData.batching.currentBatch,
          totalBatches: progressData.batching.totalBatches,
          timestamp: new Date().toISOString()
        });
      }
      
      // Track completion event
      if (progressData.completed) {
        events.push({
          type: 'campaign_completed',
          totalSent: progressData.sent,
          totalFailed: progressData.failed,
          finalSuccessRate: analytics.successRate,
          totalDuration: analytics.elapsedMinutes,
          avgThroughput: analytics.messagesPerMinute,
          timestamp: new Date().toISOString()
        });
      }
      
      // Send events to analytics (fire and forget)
      events.forEach(event => {
        sendAnalyticsEvent({
          ...event,
          campaignId: campaignData.campaignId,
          campaignName: campaignData.campaignName
        }).catch(console.warn);
      });
      
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  };

  // Send analytics event to backend
  const sendAnalyticsEvent = async (event) => {
    try {
      // TODO: Implement analytics endpoint in backend
      console.log('📊 Analytics event (disabled):', event);
      return; // Temporarily disabled to prevent 404 errors
      
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_ENDPOINTS.ANALYTICS.CAMPAIGNS}/events`,
        event,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      // Silently fail analytics to not disrupt campaign
      console.warn('Analytics event failed:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent': return <CheckCircle sx={{ color: 'success.main' }} />;
      case 'failed': return <Error sx={{ color: 'error.main' }} />;
      case 'pending': return <Schedule sx={{ color: 'warning.main' }} />;
      default: return <Send sx={{ color: 'info.main' }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'success';
      case 'failed': return 'error';
      case 'pending': return 'warning';
      default: return 'info';
    }
  };

  const progressPercentage = progress.total > 0 
    ? Math.round(((progress.sent + progress.failed) / progress.total) * 100)
    : 0;

  const successRate = progress.total > 0 
    ? Math.round((progress.sent / progress.total) * 100)
    : 0;

  const estimatedTimeRemaining = () => {
    if (!progress.batching || progress.status === 'completed') return null;
    
    const remainingBatches = progress.totalBatches - progress.currentBatch;
    const avgBatchTime = 33; // seconds (estimate)
    const remainingSeconds = remainingBatches * avgBatchTime;
    
    if (remainingSeconds < 60) {
      return `${remainingSeconds}s remaining`;
    } else {
      const minutes = Math.round(remainingSeconds / 60);
      return `~${minutes}m remaining`;
    }
  };

  const getFailedMessages = () => {
    return progress.details.filter(detail => detail.status === 'failed');
  };

  const handleRetryFailed = () => {
    const failedMessages = getFailedMessages();
    if (onRetryFailed && failedMessages.length > 0) {
      onRetryFailed(failedMessages);
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 380,
        maxHeight: expanded ? '80vh' : 'auto',
        zIndex: 1300,
        boxShadow: 3,
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      <Card>
        <CardContent sx={{ p: 2 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Send color="primary" />
              <Typography variant="h6" component="div">
                Campaign Progress
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton 
                size="small" 
                onClick={() => setShowAnalytics(!showAnalytics)}
                aria-label="Toggle Analytics"
                color={showAnalytics ? "primary" : "default"}
              >
                <Analytics />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={() => setExpanded(!expanded)}
                aria-label={expanded ? "Collapse" : "Expand"}
              >
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
              <IconButton 
                size="small" 
                onClick={onClose}
                aria-label="Close"
              >
                <Close />
              </IconButton>
            </Box>
          </Box>

          {/* Progress Summary */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {progress.status === 'completed' ? 'Campaign Completed!' : 'Sending messages...'}
            </Typography>
            
            <LinearProgress 
              variant="determinate" 
              value={progressPercentage} 
              sx={{ height: 8, borderRadius: 4, mb: 1 }}
              color={progress.status === 'completed' ? 'success' : 'primary'}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2">
                {progress.sent + progress.failed}/{progress.total} messages
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {progressPercentage}%
              </Typography>
            </Box>

            {/* Status Chips */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
              <Chip 
                size="small" 
                icon={<CheckCircle />} 
                label={`${progress.sent} sent`}
                color="success"
                variant="outlined"
              />
              {progress.failed > 0 && (
                <Chip 
                  size="small" 
                  icon={<Error />} 
                  label={`${progress.failed} failed`}
                  color="error"
                  variant="outlined"
                />
              )}
              {analyticsData.messagesPerMinute > 0 && (
                <Chip 
                  size="small" 
                  icon={<Speed />} 
                  label={`${analyticsData.messagesPerMinute}/min`}
                  color="info"
                  variant="outlined"
                />
              )}
            </Box>

            {/* Enhanced Analytics Display */}
            {(analyticsData.messagesPerMinute > 0 || analyticsData.estimatedCompletion) && (
              <Box sx={{ mb: 1 }}>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 0.5, textAlign: 'center', backgroundColor: 'primary.50' }}>
                      <Typography variant="caption" color="primary">
                        {analyticsData.messagesPerMinute} msg/min
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 0.5, textAlign: 'center', backgroundColor: 'success.50' }}>
                      <Typography variant="caption" color="success.main">
                        {analyticsData.successRate}% success
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
                {analyticsData.estimatedCompletion && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    ⏱️ ~{analyticsData.estimatedCompletion}min remaining
                  </Typography>
                )}
              </Box>
            )}

            {/* Batching Info */}
            {progress.batching && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Batch {progress.currentBatch}/{progress.totalBatches} • {estimatedTimeRemaining()}
                </Typography>
              </Box>
            )}

            {/* Success Rate */}
            {progress.total > 0 && (
              <Typography variant="caption" color="text.secondary">
                Success Rate: {successRate}%
              </Typography>
            )}
          </Box>

          <Collapse in={expanded}>
            <Divider sx={{ mb: 2 }} />

            {/* Performance Metrics */}
            {progress.performance && progress.status === 'completed' && (
              <Box sx={{ mb: 2, p: 1, backgroundColor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  📊 Campaign completed in {Math.round(progress.performance.totalDuration / 60)} minutes
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  📈 Average: {progress.performance.messagesPerMinute} messages/minute
                </Typography>
              </Box>
            )}

            {/* Recent Activity */}
            <Typography variant="subtitle2" gutterBottom>
              Recent Activity
            </Typography>
            
            <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
              {progress.details.slice(-10).reverse().map((detail, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {getStatusIcon(detail.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2">
                        {detail.status === 'sent' ? 'Sent to' : 
                         detail.status === 'failed' ? 'Failed to' : 'Sending to'} {detail.phone}
                      </Typography>
                    }
                    secondary={
                      detail.status === 'failed' && detail.error ? (
                        <Typography variant="caption" color="error">
                          {detail.error}
                        </Typography>
                      ) : (
                        detail.batchNumber && (
                          <Typography variant="caption" color="text.secondary">
                            Batch {detail.batchNumber}
                          </Typography>
                        )
                      )
                    }
                  />
                </ListItem>
              ))}
              
              {progress.details.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary={
                      <Typography variant="body2" color="text.secondary" align="center">
                        Preparing to send...
                      </Typography>
                    }
                  />
                </ListItem>
              )}
            </List>

            {/* Retry Failed Button */}
            {progress.failed > 0 && progress.status === 'completed' && (
              <Box sx={{ mt: 2 }}>
                <IconButton
                  size="small"
                  onClick={handleRetryFailed}
                  color="primary"
                  sx={{ mr: 1 }}
                >
                  <Refresh />
                </IconButton>
                <Typography variant="caption" color="text.secondary">
                  Retry {progress.failed} failed messages
                </Typography>
              </Box>
            )}
          </Collapse>
        </CardContent>
      </Card>

      {/* Enhanced Analytics Integration Component */}
      <AnalyticsProgressIntegration 
        campaignData={campaignData}
        progressData={progress}
        isVisible={showAnalytics}
      />
    </Box>
  );
};

export default CampaignProgressTracker;