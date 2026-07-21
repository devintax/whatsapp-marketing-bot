import React, { useState, useEffect, useRef } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Badge,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  MessageOutlined,
  CheckCircleOutlined,
  ErrorOutlined,
  SendOutlined,
  TrendingUpOutlined,
  RefreshOutlined,
  PauseOutlined,
  PlayArrowOutlined
} from '@mui/icons-material';
import { io } from 'socket.io-client';
import axios from 'axios';
import { API_BASE_URL } from '../config/api'; // 🔧 FIX: Import API_BASE_URL

/**
 * 📊 REAL-TIME ANALYTICS DASHBOARD
 * 
 * Integrates with floating progress tracker to provide comprehensive
 * real-time campaign analytics with Socket.io live updates
 */
const RealTimeAnalyticsDashboard = ({ 
  campaignId, 
  userId: userIdProp, 
  isVisible = true,
  onProgressUpdate 
}) => {
  // State management
  const [analytics, setAnalytics] = useState({
    messageStats: {
      totalMessages: 0,
      sentMessages: 0,
      failedMessages: 0,
      pendingMessages: 0,
      deliveryRate: 0
    },
    campaignStats: {
      totalCampaigns: 0,
      activeCampaigns: 0,
      completedCampaigns: 0,
      draftCampaigns: 0
    },
    totalContacts: 0,
    lastUpdated: null
  });
  
  const [messageBreakdown, setMessageBreakdown] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [userId, setUserId] = useState(userIdProp);
  
  const refreshIntervalRef = useRef(null);

  // 🔑 CRITICAL FIX: Extract user ID from JWT token if not provided via props
  useEffect(() => {
    if (!userId) {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('🔍 RealTimeAnalyticsDashboard - JWT Payload:', payload);
          
          // Try multiple possible user ID fields
          const extractedUserId = payload.id || payload.userId || payload._id || payload.user?.id;
          
          if (extractedUserId) {
            console.log('✅ RealTimeAnalyticsDashboard - User ID extracted from JWT:', extractedUserId);
            setUserId(extractedUserId);
          } else {
            console.error('❌ RealTimeAnalyticsDashboard - No user ID found in JWT payload');
            console.error('   Available keys:', Object.keys(payload));
          }
        } catch (error) {
          console.error('❌ RealTimeAnalyticsDashboard - Failed to parse JWT token:', error);
        }
      } else {
        console.warn('⚠️ RealTimeAnalyticsDashboard - No authentication token found');
      }
    }
  }, [userId]);

  // Socket.io connection management
  useEffect(() => {
    if (!isVisible || !userId) {
      console.log('📊 RealTimeAnalyticsDashboard: Skipping Socket.io initialization');
      console.log('   isVisible:', isVisible);
      console.log('   userId:', userId);
      return;
    }

    // 🔧 FIX: Use API_BASE_URL for Socket.io connection (supports Cloudflare tunnel)
    const socketUrl = API_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    console.log('📊 RealTimeAnalyticsDashboard: Initializing Socket.io connection...');
    console.log('   userId:', userId);
    console.log('   Socket URL:', socketUrl);
    console.log('   API_BASE_URL:', API_BASE_URL);
    
    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      path: '/socket.io',
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket.io CONNECTED for real-time analytics');
      console.log('   Socket ID:', newSocket.id);
      setConnectionStatus('connected');
      
      // Join user room for personalized updates
      console.log('📡 Joining user room: user_' + userId);
      newSocket.emit('join_user_room', { userId });
    });

    newSocket.on('disconnect', () => {
      console.log('⚠️  Socket.io DISCONNECTED from analytics');
      setConnectionStatus('disconnected');
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket.io connection ERROR:', error);
    });

    // Real-time message status updates
    newSocket.on('message_status_update', (data) => {
      console.log('� Received message_status_update event:', data);
      
      // Update analytics state
      setAnalytics(prev => ({
        ...prev,
        messageStats: {
          ...prev.messageStats,
          ...data.messageStats
        },
        lastUpdated: new Date()
      }));

      // Update message breakdown
      if (data.breakdown) {
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
      // Handle dashboard-specific message updates
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

    setSocket(newSocket);
    console.log('✅ Socket.io event listeners registered');

    // Initial data fetch
    console.log('📊 Fetching initial dashboard data...');
    fetchDashboardData();

    // Setup periodic refresh fallback
    refreshIntervalRef.current = setInterval(fetchDashboardData, 30000); // 30 seconds
    console.log('⏰ Periodic refresh set to 30 seconds');

    return () => {
      console.log('🔌 Cleaning up Socket.io connection...');
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      newSocket.disconnect();
    };
  }, [isVisible, userId]);

  // Fetch dashboard data from API
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('⚠️  No authentication token found - skipping dashboard fetch');
        return;
      }

      console.log('📡 Fetching dashboard data from API...');
      console.log('   API_BASE_URL:', API_BASE_URL);

      // 🎯 FIX 1: Fetch real-time dashboard stats with proper URL
      const dashboardUrl = `${API_BASE_URL}/api/analytics/dashboard-realtime`;
      console.log('📊 Fetching dashboard stats from:', dashboardUrl);
      
      const dashboardResponse = await axios.get(dashboardUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Dashboard response:', dashboardResponse.data);

      if (dashboardResponse.data.success) {
        const dashboardData = dashboardResponse.data.data;
        console.log('📊 Setting analytics data:', dashboardData);
        
        // 🎯 FIX: Ensure proper data structure with defaults
        setAnalytics({
          messageStats: {
            totalMessages: dashboardData?.messageStats?.totalMessages || 0,
            sentMessages: dashboardData?.messageStats?.sentMessages || 0,
            failedMessages: dashboardData?.messageStats?.failedMessages || 0,
            pendingMessages: dashboardData?.messageStats?.pendingMessages || 0,
            deliveryRate: dashboardData?.messageStats?.deliveryRate || 0
          },
          campaignStats: {
            totalCampaigns: dashboardData?.campaignStats?.totalCampaigns || 0,
            activeCampaigns: dashboardData?.campaignStats?.activeCampaigns || 0,
            completedCampaigns: dashboardData?.campaignStats?.completedCampaigns || 0,
            draftCampaigns: dashboardData?.campaignStats?.draftCampaigns || 0
          },
          totalContacts: dashboardData?.totalContacts || 0,
          lastUpdated: new Date()
        });
      } else {
        console.warn('⚠️  Dashboard fetch successful but no data:', dashboardResponse.data);
      }

      // 🎯 FIX 2: Fetch message breakdown with proper URL
      const breakdownParams = campaignId ? { campaignId } : {};
      const breakdownUrl = `${API_BASE_URL}/api/analytics/message-breakdown`;
      console.log('📊 Fetching message breakdown from:', breakdownUrl, 'params:', breakdownParams);
      
      const breakdownResponse = await axios.get(breakdownUrl, {
        headers: { Authorization: `Bearer ${token}` },
        params: breakdownParams
      });

      console.log('✅ Message breakdown response:', breakdownResponse.data);

      if (breakdownResponse.data.success && breakdownResponse.data.data) {
        console.log('📊 Setting message breakdown:', breakdownResponse.data.data.length, 'items');
        setMessageBreakdown(breakdownResponse.data.data);
      }

      // 🎯 FIX 3: Fetch recent activity with proper URL
      const activityUrl = `${API_BASE_URL}/api/analytics/recent-activity`;
      console.log('📊 Fetching recent activity from:', activityUrl);
      
      const activityResponse = await axios.get(activityUrl, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 10 }
      });

      console.log('✅ Recent activity response:', activityResponse.data);

      if (activityResponse.data.success && activityResponse.data.data) {
        console.log('📊 Setting recent activity:', activityResponse.data.data.length, 'items');
        setRecentActivity(activityResponse.data.data);
      }

      setIsLoading(false);
      console.log('✅ Dashboard data fetch completed successfully');

    } catch (error) {
      console.error('❌ Failed to fetch dashboard data:', error);
      console.error('   Error details:', error.response?.data || error.message);
      setIsLoading(false);
    }
  };

  // Manual refresh
  const handleRefresh = () => {
    setIsLoading(true);
    fetchDashboardData();
  };

  if (!isVisible) return null;

  return (
    <Box sx={{ p: 2 }}>
      {/* Header with connection status */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
          📊 Real-Time Analytics Dashboard
        </Typography>
        
        <Box display="flex" alignItems="center" gap={1}>
          <Chip 
            icon={connectionStatus === 'connected' ? <TrendingUpOutlined /> : <PauseOutlined />}
            label={connectionStatus === 'connected' ? 'Live Updates' : 'Offline Mode'}
            color={connectionStatus === 'connected' ? 'success' : 'warning'}
            size="small"
          />
          
          <Button
            startIcon={isLoading ? <CircularProgress size={16} /> : <RefreshOutlined />}
            onClick={handleRefresh}
            disabled={isLoading}
            size="small"
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Quick Stats Cards */}
      <Grid container spacing={2} mb={3}>
        {/* Messages Overview */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Messages Sent
                  </Typography>
                  <Typography variant="h4" component="div">
                    {(analytics?.messageStats?.sentMessages || 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    {(analytics?.messageStats?.deliveryRate || 0).toFixed(1)}% success rate
                  </Typography>
                </Box>
                <CheckCircleOutlined sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Failed Messages */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Failed Messages
                  </Typography>
                  <Typography variant="h4" component="div" color="error.main">
                    {(analytics?.messageStats?.failedMessages || 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {(analytics?.messageStats?.totalMessages || 0) > 0 
                      ? (((analytics?.messageStats?.failedMessages || 0) / analytics.messageStats.totalMessages) * 100).toFixed(1)
                      : 0}% failure rate
                  </Typography>
                </Box>
                <ErrorOutlined sx={{ fontSize: 40, color: 'error.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Campaigns */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Active Campaigns
                  </Typography>
                  <Typography variant="h4" component="div">
                    {analytics?.campaignStats?.activeCampaigns || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    of {analytics?.campaignStats?.totalCampaigns || 0} total
                  </Typography>
                </Box>
                <SendOutlined sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Contacts */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Contacts
                  </Typography>
                  <Typography variant="h4" component="div">
                    {(analytics?.totalContacts || 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Available for campaigns
                  </Typography>
                </Box>
                <MessageOutlined sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Analytics */}
      <Grid container spacing={2}>
        {/* Message Status Breakdown */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Message Status Breakdown"
              subheader={`Last updated: ${analytics.lastUpdated ? new Date(analytics.lastUpdated).toLocaleTimeString() : 'Never'}`}
            />
            <CardContent>
              {messageBreakdown.length > 0 ? (
                <List dense>
                  {messageBreakdown.map((status, index) => (
                    <React.Fragment key={status._id || index}>
                      <ListItem>
                        <ListItemIcon>
                          {status._id === 'sent' && <CheckCircleOutlined color="success" />}
                          {status._id === 'failed' && <ErrorOutlined color="error" />}
                          {status._id === 'sending' && <SendOutlined color="primary" />}
                          {status._id === 'pending' && <PauseOutlined color="warning" />}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                                {status._id}
                              </Typography>
                              <Badge badgeContent={status.count} color="primary" max={999999}>
                                <Chip 
                                  label={`${status.uniqueContacts} contacts`}
                                  size="small"
                                  variant="outlined"
                                />
                              </Badge>
                            </Box>
                          }
                          secondary={
                            status.avgProcessingTime 
                              ? `Avg processing: ${Math.round(status.avgProcessingTime)}ms`
                              : null
                          }
                        />
                      </ListItem>
                      {index < messageBreakdown.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography color="textSecondary" align="center" py={2}>
                  No message data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Recent Activity"
              subheader="Latest message delivery events"
            />
            <CardContent>
              {recentActivity.length > 0 ? (
                <List dense>
                  {recentActivity.slice(0, 8).map((activity, index) => (
                    <React.Fragment key={activity.id || index}>
                      <ListItem>
                        <ListItemIcon>
                          {activity.status === 'sent' && <CheckCircleOutlined color="success" />}
                          {activity.status === 'failed' && <ErrorOutlined color="error" />}
                          {activity.status === 'sending' && <SendOutlined color="primary" />}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2">
                                {activity.phone} • {activity.campaignName}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {new Date(activity.timestamp).toLocaleTimeString()}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            activity.error 
                              ? <Typography variant="caption" color="error">{activity.error}</Typography>
                              : activity.processingTime 
                                ? `Batch ${activity.batchNumber} • ${activity.processingTime}ms`
                                : `Batch ${activity.batchNumber}`
                          }
                        />
                      </ListItem>
                      {index < Math.min(recentActivity.length - 1, 7) && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography color="textSecondary" align="center" py={2}>
                  No recent activity
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Connection Status Alert */}
      {connectionStatus === 'disconnected' && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Real-time updates are currently unavailable. Data will refresh automatically every 30 seconds.
        </Alert>
      )}
    </Box>
  );
};

export default RealTimeAnalyticsDashboard;