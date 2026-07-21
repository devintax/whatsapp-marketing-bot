import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  People,
  Campaign,
  WhatsApp,
  Analytics as AnalyticsIcon,
  Schedule,
  CheckCircle,
  Error,
  Timeline,
  Dashboard
} from '@mui/icons-material';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import RealTimeAnalyticsDashboard from '../components/RealTimeAnalyticsDashboard'; // 📊 NEW: Real-time analytics

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('30');
  const [activeTab, setActiveTab] = useState(0); // 📊 NEW: Tab state for real-time vs historical
  const [currentUserId, setCurrentUserId] = useState(null); // 📊 NEW: User ID for real-time analytics

  useEffect(() => {
    // 🔑 Get user ID from token for real-time analytics
    const getUserId = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Parse JWT token to extract user ID
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('🔍 JWT Payload:', payload);
          
          // Try multiple possible user ID fields in JWT
          const userId = payload.id || payload.userId || payload._id || payload.user?.id;
          
          if (userId) {
            console.log('✅ User ID extracted from JWT:', userId);
            setCurrentUserId(userId);
          } else {
            console.warn('⚠️ No user ID found in JWT payload');
            console.warn('   Available keys:', Object.keys(payload));
            
            // 🎯 FALLBACK: Fetch user profile to get user ID
            try {
              const response = await axios.get(API_ENDPOINTS.AUTH.PROFILE || '/api/auth/profile', {
                headers: { Authorization: `Bearer ${token}` }
              });
              const fallbackUserId = response.data.user?._id || response.data.user?.id || response.data._id || response.data.id;
              if (fallbackUserId) {
                console.log('✅ User ID retrieved from profile API:', fallbackUserId);
                setCurrentUserId(fallbackUserId);
              } else {
                console.error('❌ Could not determine user ID from profile API');
              }
            } catch (apiError) {
              console.error('❌ Failed to fetch user profile:', apiError);
            }
          }
        } catch (error) {
          console.error('❌ Failed to parse user ID from token:', error);
        }
      } else {
        console.warn('⚠️ No authentication token found');
      }
    };
    
    getUserId();
    fetchAnalytics();
  }, [timeRange]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_ENDPOINTS.ANALYTICS.DASHBOARD}?days=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data.analytics || {});
    } catch (error) {
      setError('Failed to fetch analytics data');
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color = 'primary', subtitle }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" component="div" color={`${color}.main`}>
              {value || 0}
            </Typography>
            <Typography variant="h6" component="div" gutterBottom>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Icon sx={{ fontSize: 40, color: `${color}.main`, opacity: 0.7 }} />
        </Box>
      </CardContent>
    </Card>
  );

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'sent': return 'success';
      case 'delivered': return 'info';
      case 'read': return 'primary';
      case 'failed': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
            <AnalyticsIcon sx={{ mr: 2 }} />
            Analytics Dashboard
          </Typography>
          
          {/* Show time range selector only for historical analytics */}
          {activeTab === 1 && (
            <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                label="Time Range"
              >
                <MenuItem value="7">Last 7 days</MenuItem>
                <MenuItem value="30">Last 30 days</MenuItem>
                <MenuItem value="90">Last 90 days</MenuItem>
                <MenuItem value="365">Last year</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>

        {/* 📊 NEW: Tab navigation for Real-Time vs Historical Analytics */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="analytics tabs">
            <Tab 
              icon={<Dashboard />} 
              label="Real-Time Dashboard" 
              iconPosition="start"
              sx={{ textTransform: 'none', fontSize: '1rem' }}
            />
            <Tab 
              icon={<Timeline />} 
              label="Historical Analytics" 
              iconPosition="start"
              sx={{ textTransform: 'none', fontSize: '1rem' }}
            />
          </Tabs>
        </Box>

        {/* Tab Panel Content */}
        {activeTab === 0 && (
          <Box>
            {/* 📊 NEW: Real-Time Analytics Dashboard */}
            <RealTimeAnalyticsDashboard 
              userId={currentUserId}
              isVisible={activeTab === 0}
              onProgressUpdate={(progress) => {
                console.log('📊 Progress update received:', progress);
                // Handle progress updates if needed for floating tracker integration
              }}
            />
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            {/* Historical Analytics Content */}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Key Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Campaigns"
              value={analytics?.totalCampaigns}
              icon={Campaign}
              color="primary"
              subtitle="All campaigns created"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Contacts"
              value={analytics?.totalContacts}
              icon={People}
              color="secondary"
              subtitle="Contacts in database"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Messages Sent"
              value={analytics?.messagesSent}
              icon={WhatsApp}
              color="success"
              subtitle="WhatsApp messages"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Success Rate"
              value={`${analytics?.successRate || 0}%`}
              icon={TrendingUp}
              color="info"
              subtitle="Campaign success"
            />
          </Grid>
        </Grid>

        {/* Campaign Performance */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Campaign Performance
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Campaign Name</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Messages</TableCell>
                        <TableCell>Success Rate</TableCell>
                        <TableCell>Created</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analytics?.recentCampaigns?.map((campaign) => (
                        <TableRow key={campaign._id}>
                          <TableCell>{campaign.name}</TableCell>
                          <TableCell>
                            <Chip 
                              label={campaign.status || 'draft'} 
                              color={getStatusColor(campaign.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{campaign.messagesSent || 0}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <LinearProgress
                                variant="determinate"
                                value={campaign.successRate || 0}
                                sx={{ width: 100, mr: 1 }}
                              />
                              {campaign.successRate || 0}%
                            </Box>
                          </TableCell>
                          <TableCell>
                            {new Date(campaign.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      )) || (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            No campaigns found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Message Status Breakdown
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Delivered</Typography>
                    <Typography variant="body2">{analytics?.messageStatus?.delivered || 0}</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(analytics?.messageStatus?.delivered / analytics?.messagesSent) * 100 || 0}
                    color="success"
                    sx={{ mb: 2 }}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Read</Typography>
                    <Typography variant="body2">{analytics?.messageStatus?.read || 0}</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(analytics?.messageStatus?.read / analytics?.messagesSent) * 100 || 0}
                    color="primary"
                    sx={{ mb: 2 }}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Failed</Typography>
                    <Typography variant="body2">{analytics?.messageStatus?.failed || 0}</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(analytics?.messageStatus?.failed / analytics?.messagesSent) * 100 || 0}
                    color="error"
                    sx={{ mb: 2 }}
                  />
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Stats
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CheckCircle sx={{ color: 'success.main', mr: 1 }} />
                    <Box>
                      <Typography variant="body2">Active Campaigns</Typography>
                      <Typography variant="h6">{analytics?.activeCampaigns || 0}</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Schedule sx={{ color: 'warning.main', mr: 1 }} />
                    <Box>
                      <Typography variant="body2">Scheduled Campaigns</Typography>
                      <Typography variant="h6">{analytics?.scheduledCampaigns || 0}</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Error sx={{ color: 'error.main', mr: 1 }} />
                    <Box>
                      <Typography variant="body2">Failed Messages</Typography>
                      <Typography variant="h6">{analytics?.failedMessages || 0}</Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Contact Growth */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Contact Growth Trends
                </Typography>
                {analytics?.contactGrowth?.length > 0 ? (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Contact growth data visualization would go here
                    </Typography>
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Chart visualization coming soon! For now, you have {analytics?.totalContacts || 0} total contacts.
                    </Alert>
                  </Box>
                ) : (
                  <Alert severity="info">
                    No contact growth data available yet. Start adding contacts to see trends!
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {!analytics && !loading && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <AnalyticsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No analytics data available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start creating campaigns and contacts to see your analytics
            </Typography>
          </Box>
        )}
            </Box>
          )}
        
      </Box>
    </Container>
  );
}