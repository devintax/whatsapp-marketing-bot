import React, { useState, useEffect, useRef } from 'react';
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
  Collapse,
  Chip,
  Button,
  Tooltip,
  Fade,
  Alert
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon,
  Close as CloseIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';

// Floating animation
const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0px); }
`;

// Styled floating container
const FloatingContainer = styled(Card)(({ theme }) => ({
  position: 'fixed',
  bottom: 20,
  right: 20,
  width: 380,
  maxHeight: '70vh',
  overflowY: 'auto',
  zIndex: 9999,
  boxShadow: theme.shadows[10],
  animation: `${float} 3s ease-in-out infinite`,
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  borderRadius: 16,
  '&:hover': {
    animationPlayState: 'paused',
    transform: 'translateY(-2px)',
    transition: 'transform 0.2s ease'
  }
}));

// Progress bar with gradient
const StyledProgress = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: 'rgba(255,255,255,0.2)',
  '& .MuiLinearProgress-bar': {
    borderRadius: 4,
    background: 'linear-gradient(90deg, #4CAF50 0%, #8BC34A 100%)'
  }
}));

// Message status icons
const getStatusIcon = (status) => {
  switch (status) {
    case 'sent':
      return <CheckCircleIcon sx={{ color: '#4CAF50' }} />;
    case 'failed':
      return <ErrorIcon sx={{ color: '#f44336' }} />;
    case 'pending':
      return <ScheduleIcon sx={{ color: '#ff9800' }} />;
    case 'sending':
      return <SendIcon sx={{ color: '#2196f3' }} />;
    default:
      return <ScheduleIcon sx={{ color: '#ff9800' }} />;
  }
};

// Message status text
const getStatusText = (status) => {
  switch (status) {
    case 'sent': return 'Delivered';
    case 'failed': return 'Failed';
    case 'pending': return 'Queued';
    case 'sending': return 'Sending';
    default: return 'Unknown';
  }
};

const MessageProgressTracker = ({
  isVisible = false,
  campaignId = null,
  messages = [],
  onClose = () => {},
  onRetry = () => {},
  onViewAnalytics = () => {},
  autoClose = true,
  title = "Campaign Progress"
}) => {
  const [expanded, setExpanded] = useState(true);
  const [localMessages, setLocalMessages] = useState(messages);
  const [startTime, setStartTime] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalMessages: 0,
    sentCount: 0,
    failedCount: 0,
    pendingCount: 0,
    successRate: 0,
    avgDeliveryTime: 0
  });

  const intervalRef = useRef(null);

  // Calculate analytics
  useEffect(() => {
    const total = localMessages.length;
    const sent = localMessages.filter(m => m.status === 'sent').length;
    const failed = localMessages.filter(m => m.status === 'failed').length;
    const pending = localMessages.filter(m => m.status === 'pending' || m.status === 'sending').length;
    const successRate = total > 0 ? Math.round((sent / total) * 100) : 0;

    setAnalytics({
      totalMessages: total,
      sentCount: sent,
      failedCount: failed,
      pendingCount: pending,
      successRate,
      avgDeliveryTime: calculateAverageDeliveryTime()
    });

    // Auto-close when all messages are processed and successful
    if (autoClose && total > 0 && pending === 0 && failed === 0) {
      setTimeout(() => {
        onClose();
      }, 3000); // Close after 3 seconds of completion
    }
  }, [localMessages, autoClose, onClose]);

  // Update messages when prop changes
  useEffect(() => {
    setLocalMessages(messages);
    if (messages.length > 0 && !startTime) {
      setStartTime(Date.now());
    }
  }, [messages, startTime]);

  // Calculate average delivery time
  const calculateAverageDeliveryTime = () => {
    const sentMessages = localMessages.filter(m => m.status === 'sent' && m.deliveredAt);
    if (sentMessages.length === 0) return 0;
    
    const totalTime = sentMessages.reduce((sum, msg) => {
      return sum + (new Date(msg.deliveredAt) - new Date(msg.sentAt));
    }, 0);
    
    return Math.round(totalTime / sentMessages.length / 1000); // Convert to seconds
  };

  // Retry failed messages
  const handleRetryFailed = () => {
    const failedMessages = localMessages.filter(m => m.status === 'failed');
    failedMessages.forEach(msg => {
      onRetry(msg.id, msg.recipient);
    });
  };

  // Get progress percentage
  const getProgress = () => {
    if (analytics.totalMessages === 0) return 0;
    return Math.round(((analytics.sentCount + analytics.failedCount) / analytics.totalMessages) * 100);
  };

  // Format time duration
  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (!isVisible) return null;

  return (
    <Fade in={isVisible}>
      <FloatingContainer>
        <CardContent sx={{ p: 2 }}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" component="div" sx={{ 
              fontWeight: 'bold',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}>
              📤 {title}
            </Typography>
            <Box>
              <Tooltip title="View Analytics">
                <IconButton 
                  size="small" 
                  onClick={onViewAnalytics}
                  sx={{ color: 'white', mr: 1 }}
                >
                  <AnalyticsIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Minimize">
                <IconButton 
                  size="small" 
                  onClick={() => setExpanded(!expanded)}
                  sx={{ color: 'white', mr: 1 }}
                >
                  {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Close">
                <IconButton 
                  size="small" 
                  onClick={onClose}
                  sx={{ color: 'white' }}
                >
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Progress Summary */}
          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2">
                {analytics.sentCount}/{analytics.totalMessages} messages sent
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {getProgress()}%
              </Typography>
            </Box>
            <StyledProgress 
              variant="determinate" 
              value={getProgress()} 
            />
          </Box>

          {/* Analytics Chips */}
          <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
            <Chip 
              icon={<CheckCircleIcon />}
              label={`${analytics.sentCount} sent`}
              size="small"
              sx={{ 
                bgcolor: 'rgba(76, 175, 80, 0.8)',
                color: 'white',
                fontWeight: 'bold'
              }}
            />
            {analytics.failedCount > 0 && (
              <Chip 
                icon={<ErrorIcon />}
                label={`${analytics.failedCount} failed`}
                size="small"
                sx={{ 
                  bgcolor: 'rgba(244, 67, 54, 0.8)',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            )}
            {analytics.pendingCount > 0 && (
              <Chip 
                icon={<ScheduleIcon />}
                label={`${analytics.pendingCount} pending`}
                size="small"
                sx={{ 
                  bgcolor: 'rgba(255, 152, 0, 0.8)',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            )}
            <Chip 
              label={`${analytics.successRate}% success`}
              size="small"
              sx={{ 
                bgcolor: analytics.successRate >= 90 ? 'rgba(76, 175, 80, 0.8)' : 
                         analytics.successRate >= 70 ? 'rgba(255, 152, 0, 0.8)' : 
                         'rgba(244, 67, 54, 0.8)',
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          </Box>

          {/* Expandable Message List */}
          <Collapse in={expanded}>
            <Box>
              {/* Failed Messages Alert */}
              {analytics.failedCount > 0 && (
                <Alert 
                  severity="warning" 
                  sx={{ mb: 2, bgcolor: 'rgba(255, 152, 0, 0.1)', color: 'white' }}
                  action={
                    <Button 
                      color="inherit" 
                      size="small" 
                      onClick={handleRetryFailed}
                      startIcon={<RefreshIcon />}
                    >
                      Retry Failed
                    </Button>
                  }
                >
                  {analytics.failedCount} message(s) failed to deliver
                </Alert>
              )}

              {/* Message List */}
              <List dense sx={{ maxHeight: 200, overflowY: 'auto' }}>
                {localMessages.slice(0, 10).map((message, index) => (
                  <ListItem key={message.id || index}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {getStatusIcon(message.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          {message.recipient || message.phone || `Contact ${index + 1}`}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          {getStatusText(message.status)}
                          {message.status === 'sent' && message.deliveredAt && (
                            <> • {formatDuration(Math.round((new Date(message.deliveredAt) - new Date(message.sentAt)) / 1000))}</>
                          )}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
                {localMessages.length > 10 && (
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
                          +{localMessages.length - 10} more messages...
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
              </List>

              {/* Completion Status */}
              {analytics.pendingCount === 0 && analytics.totalMessages > 0 && (
                <Alert 
                  severity={analytics.failedCount === 0 ? "success" : "warning"}
                  sx={{ 
                    mt: 2, 
                    bgcolor: analytics.failedCount === 0 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 152, 0, 0.1)',
                    color: 'white'
                  }}
                >
                  {analytics.failedCount === 0 
                    ? `🎉 All ${analytics.totalMessages} messages delivered successfully!`
                    : `⚠️ Campaign completed with ${analytics.failedCount} failures`
                  }
                </Alert>
              )}
            </Box>
          </Collapse>
        </CardContent>
      </FloatingContainer>
    </Fade>
  );
};

export default MessageProgressTracker;