import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Grid,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle,
  Error,
  HourglassEmpty,
  Refresh,
  TrendingUp,
  Send,
  Done,
  ErrorOutline
} from '@mui/icons-material';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

/**
 * 📊 CAMPAIGN ANALYTICS CARD - Real-time campaign performance tracking
 * 
 * Pure additive enhancement component for displaying campaign metrics.
 * Shows delivery rates, success metrics, and visual progress indicators.
 * 
 * @component
 * @param {Object} campaign - Campaign data with analytics
 * @param {Function} onRefresh - Optional callback when refresh is triggered
 */
export default function CampaignAnalyticsCard({ campaign, onRefresh }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (campaign) {
      loadAnalytics();
    }
  }, [campaign?._id]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Use campaign's built-in analytics first
      if (campaign.analytics) {
        setAnalytics(campaign.analytics);
        setLastUpdated(new Date());
      }
      
      // Optionally fetch fresh analytics from backend
      const token = localStorage.getItem('token');
      if (token && campaign._id) {
        try {
          const response = await axios.get(
            `${API_ENDPOINTS.CAMPAIGNS.BASE}/${campaign._id}/analytics`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (response.data.analytics) {
            setAnalytics(response.data.analytics);
            setLastUpdated(new Date());
          }
        } catch (error) {
          // Silently fail - use campaign's built-in analytics
          console.log('Using campaign built-in analytics');
        }
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAnalytics();
    if (onRefresh) onRefresh();
  };

  // Calculate metrics
  const sentCount = analytics?.sentCount || campaign?.deliveryStats?.sent || 0;
  const deliveredCount = analytics?.deliveredCount || 0;
  const readCount = analytics?.readCount || 0;
  const errorCount = analytics?.errorCount || campaign?.deliveryStats?.failed || 0;
  const totalCount = campaign?.deliveryStats?.total || campaign?.targetAudience?.totalCount || 0;

  // Calculate rates
  const deliveryRate = totalCount > 0 ? ((sentCount / totalCount) * 100).toFixed(1) : 0;
  const readRate = sentCount > 0 ? ((readCount / sentCount) * 100).toFixed(1) : 0;
  const errorRate = totalCount > 0 ? ((errorCount / totalCount) * 100).toFixed(1) : 0;

  // Determine status
  const getStatusColor = () => {
    if (errorRate > 20) return 'error';
    if (deliveryRate < 50) return 'warning';
    if (deliveryRate >= 80) return 'success';
    return 'info';
  };

  const getStatusLabel = () => {
    if (campaign?.status === 'completed') return 'Completed';
    if (campaign?.status === 'running') return 'In Progress';
    if (errorRate > 50) return 'High Errors';
    if (deliveryRate >= 80) return 'Performing Well';
    return 'Active';
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              {campaign?.name || 'Campaign Analytics'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                label={getStatusLabel()} 
                color={getStatusColor()} 
                size="small"
              />
              <Chip 
                label={campaign?.type || 'promotional'} 
                variant="outlined" 
                size="small"
              />
              {campaign?.scheduling?.scheduledDate && !campaign.scheduling.sendNow && (
                <Chip 
                  icon={<span>📅</span>}
                  label={`Scheduled: ${new Date(campaign.scheduling.scheduledDate).toLocaleDateString()}`}
                  color="warning"
                  variant="outlined"
                  size="small"
                />
              )}
            </Box>
          </Box>
          <Tooltip title="Refresh Analytics">
            <IconButton onClick={handleRefresh} disabled={loading} size="small">
              {loading ? <CircularProgress size={20} /> : <Refresh />}
            </IconButton>
          </Tooltip>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Key Metrics Grid */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Send sx={{ fontSize: 32, color: 'primary.main', mb: 0.5 }} />
              <Typography variant="h5" color="primary">
                {sentCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Sent
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Done sx={{ fontSize: 32, color: 'success.main', mb: 0.5 }} />
              <Typography variant="h5" color="success.main">
                {deliveredCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Delivered
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 32, color: 'info.main', mb: 0.5 }} />
              <Typography variant="h5" color="info.main">
                {readCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Read
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <ErrorOutline sx={{ fontSize: 32, color: 'error.main', mb: 0.5 }} />
              <Typography variant="h5" color="error.main">
                {errorCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Failed
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Progress Bars */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Delivery Rate
            </Typography>
            <Typography variant="body2" fontWeight="bold" color="primary">
              {deliveryRate}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={parseFloat(deliveryRate)} 
            color={getStatusColor()}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {sentCount > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Read Rate
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="info.main">
                {readRate}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={parseFloat(readRate)} 
              color="info"
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}

        {errorCount > 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Error Rate
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="error.main">
                {errorRate}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={parseFloat(errorRate)} 
              color="error"
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}

        {/* Footer */}
        {lastUpdated && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'right' }}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
