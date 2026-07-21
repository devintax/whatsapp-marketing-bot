import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Container
} from '@mui/material';
import {
  Campaign,
  Contacts,
  Analytics,
  WhatsApp,
  Add,
  TrendingUp,
  People,
  Message,
  Schedule,
  AutoAwesome
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import AICampaignCreator from '../components/AICampaignCreator';

const StatCard = ({ title, value, icon, color = 'primary' }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
        </Box>
        <Box sx={{ color: `${color}.main` }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openAICreator, setOpenAICreator] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState({
    status: 'disconnected',
    label: 'Setup Required',
    color: 'warning'
  });

  useEffect(() => {
    fetchDashboardData();
    checkWhatsAppStatus();
    
    // Auto-refresh WhatsApp status every 30 seconds
    const interval = setInterval(checkWhatsAppStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const checkWhatsAppStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.WHATSAPP.STATUS, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const status = response.data.status;
      let statusInfo = {
        status: status,
        label: 'Setup Required',
        color: 'warning'
      };

      switch (status) {
        case 'connected':
          statusInfo = {
            status: 'connected',
            label: 'Connected',
            color: 'success'
          };
          break;
        case 'authenticated':
          statusInfo = {
            status: 'authenticated',
            label: 'Authenticated',
            color: 'success'
          };
          break;
        case 'qr_ready':
          statusInfo = {
            status: 'qr_ready',
            label: 'Scan QR Code',
            color: 'info'
          };
          break;
        case 'initializing':
          statusInfo = {
            status: 'initializing',
            label: 'Initializing...',
            color: 'info'
          };
          break;
        case 'restoring':
          statusInfo = {
            status: 'restoring',
            label: 'Restoring Session...',
            color: 'info'
          };
          break;
        case 'disconnected':
        default:
          statusInfo = {
            status: 'disconnected',
            label: 'Setup Required',
            color: 'warning'
          };
          break;
      }

      setWhatsappStatus(statusInfo);
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
      setWhatsappStatus({
        status: 'error',
        label: 'Check Settings',
        color: 'error'
      });
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch multiple endpoints
      const [campaignsRes, contactsRes, analyticsRes] = await Promise.all([
        axios.get(API_ENDPOINTS.CAMPAIGNS.LIST, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(API_ENDPOINTS.CONTACTS.LIST, {
          headers: { Authorization: `Bearer ${token}` },
          params: { 
            limit: 1000 // Request up to 1000 contacts for dashboard statistics
          }
        }),
        axios.get(`${API_ENDPOINTS.ANALYTICS.DASHBOARD}?days=30`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setDashboardData({
        campaigns: campaignsRes.data.campaigns || [],
        contacts: contactsRes.data.contacts || [],
        contactStats: {
          total: contactsRes.data.total || 0,
          totalPages: contactsRes.data.totalPages || 0
        },
        analytics: analyticsRes.data.analytics || {}
      });
    } catch (error) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAICampaignSuccess = () => {
    // Refresh dashboard data to show new campaign
    fetchDashboardData();
    // Optionally navigate to campaigns page
    navigate('/campaigns');
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const stats = [
    {
      title: 'Total Campaigns',
      value: dashboardData?.campaigns?.length || 0,
      icon: <Campaign fontSize="large" />,
      color: 'primary'
    },
    {
      title: 'Active Contacts',
      value: dashboardData?.contacts?.length || 0,
      icon: <People fontSize="large" />,
      color: 'success'
    },
    {
      title: 'Messages Sent',
      value: dashboardData?.analytics?.messagesSent || 0,
      icon: <Message fontSize="large" />,
      color: 'info'
    },
    {
      title: 'Success Rate',
      value: `${dashboardData?.analytics?.successRate || 0}%`,
      icon: <TrendingUp fontSize="large" />,
      color: 'warning'
    }
  ];

  return (
    <Container maxWidth="lg">
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Box sx={{ py: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" component="h1">
            Dashboard Overview
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<AutoAwesome />}
              onClick={() => setOpenAICreator(true)}
              color="primary"
            >
              Create AI Campaign
            </Button>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => navigate('/campaigns/create')}
            >
              Manual Campaign
            </Button>
          </Box>
      </Box>

        <Grid container spacing={3}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <StatCard {...stat} />
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3} sx={{ mt: 3 }}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Campaigns
              </Typography>
              {dashboardData?.campaigns?.length > 0 ? (
                <List>
                  {dashboardData.campaigns.slice(0, 5).map((campaign) => (
                    <ListItem key={campaign._id} divider>
                      <ListItemAvatar>
                        <Avatar>
                          <Campaign />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={campaign.name}
                        secondary={`${campaign.type} • ${new Date(campaign.createdAt).toLocaleDateString()}`}
                      />
                      <Chip 
                        label={campaign.status || 'draft'} 
                        color={campaign.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Campaign sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography color="textSecondary" gutterBottom>
                    No campaigns yet
                  </Typography>
                  <Button 
                    variant="contained" 
                    onClick={() => navigate('/campaigns')}
                    sx={{ mt: 2 }}
                  >
                    Create Your First Campaign
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<AutoAwesome />}
                  onClick={() => setOpenAICreator(true)}
                >
                  Create AI Campaign
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Add />}
                  onClick={() => navigate('/campaigns')}
                >
                  Manual Campaign
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<People />}
                  onClick={() => navigate('/contacts')}
                >
                  Manage Contacts
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Analytics />}
                  onClick={() => navigate('/analytics')}
                >
                  View Analytics
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<WhatsApp />}
                  onClick={() => navigate('/settings')}
                >
                  WhatsApp Settings
                </Button>
              </Box>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                System Status
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Database</Typography>
                  <Chip label="Connected" color="success" size="small" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">AI Service</Typography>
                  <Chip label="Ready" color="success" size="small" />
                </Box>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    mb: 1,
                    cursor: whatsappStatus.status !== 'connected' ? 'pointer' : 'default',
                    p: 1,
                    borderRadius: 1,
                    '&:hover': whatsappStatus.status !== 'connected' ? {
                      backgroundColor: 'action.hover'
                    } : {}
                  }}
                  onClick={() => {
                    if (whatsappStatus.status !== 'connected') {
                      navigate('/settings');
                    }
                  }}
                  title={whatsappStatus.status !== 'connected' ? 'Click to configure WhatsApp' : 'WhatsApp is connected'}
                >
                  <Typography variant="body2">WhatsApp</Typography>
                  <Chip 
                    label={whatsappStatus.label} 
                    color={whatsappStatus.color} 
                    size="small" 
                  />
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* AI Campaign Creator Dialog */}
      <AICampaignCreator
        open={openAICreator}
        onClose={() => setOpenAICreator(false)}
        onSuccess={handleAICampaignSuccess}
      />
    </Container>
  );
}