import React, { useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Grid,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import { PlayArrow, Stop, Refresh } from '@mui/icons-material';
import { useProgressTracker } from '../contexts/ProgressTrackerContext';
import toast from 'react-hot-toast';

const ProgressTrackerDemo = () => {
  const { startTracking, updateMessageStatus, stopTracking, activeTrackers } = useProgressTracker();
  const [demoConfig, setDemoConfig] = useState({
    messageCount: 5,
    failureRate: 20, // percentage
    sendInterval: 2000 // milliseconds between message sends
  });

  // Demo campaign data
  const generateDemoMessages = (count) => {
    return Array.from({ length: count }, (_, index) => ({
      id: `demo_msg_${Date.now()}_${index}`,
      recipient: `+1555000${String(index + 1).padStart(4, '0')}`,
      phone: `+1555000${String(index + 1).padStart(4, '0')}`,
      name: `Demo Contact ${index + 1}`,
      content: `Demo message ${index + 1} - Testing progress tracker`,
      status: 'pending',
      sentAt: new Date().toISOString()
    }));
  };

  // Start demo campaign with simulated progress
  const startDemo = () => {
    const campaignId = `demo_${Date.now()}`;
    const messages = generateDemoMessages(demoConfig.messageCount);
    
    // Start tracking
    const tracker = startTracking(campaignId, {
      title: `Demo Campaign (${demoConfig.messageCount} messages)`,
      messages: messages
    });

    toast.success(`🚀 Demo campaign started! Watch the progress tracker.`);

    // Simulate message sending with realistic delays
    simulateMessageSending(campaignId, messages);
  };

  // Simulate realistic message sending process
  const simulateMessageSending = (campaignId, messages) => {
    let currentIndex = 0;
    
    const sendNextMessage = () => {
      if (currentIndex >= messages.length) {
        toast.success('✅ Demo campaign completed!');
        return;
      }

      const message = messages[currentIndex];
      
      // Simulate sending status
      updateMessageStatus(campaignId, message.id, 'sending', {
        sentAt: new Date().toISOString()
      });

      // Simulate delivery after a short delay
      setTimeout(() => {
        // Randomly determine if message should fail based on failure rate
        const shouldFail = Math.random() * 100 < demoConfig.failureRate;
        
        if (shouldFail) {
          updateMessageStatus(campaignId, message.id, 'failed', {
            error: `Demo failure ${Math.floor(Math.random() * 3) + 1}: ${
              ['Network timeout', 'Invalid number', 'Rate limit exceeded'][Math.floor(Math.random() * 3)]
            }`,
            failedAt: new Date().toISOString()
          });
        } else {
          updateMessageStatus(campaignId, message.id, 'sent', {
            deliveredAt: new Date().toISOString()
          });
        }

        currentIndex++;
        
        // Schedule next message
        if (currentIndex < messages.length) {
          setTimeout(sendNextMessage, demoConfig.sendInterval);
        }
      }, Math.random() * 1000 + 500); // Random delivery delay 0.5-1.5s
    };

    // Start sending
    sendNextMessage();
  };

  // Stop all active demo trackers
  const stopAllDemos = () => {
    activeTrackers.forEach(tracker => {
      if (tracker.id.startsWith('demo_')) {
        stopTracking(tracker.id, 'user_stopped');
      }
    });
    toast.success('All demo campaigns stopped');
  };

  // Start a quick demo with predefined settings
  const quickDemo = (preset) => {
    const presets = {
      small: { messageCount: 3, failureRate: 0, sendInterval: 1500 },
      medium: { messageCount: 8, failureRate: 25, sendInterval: 2000 },
      large: { messageCount: 15, failureRate: 40, sendInterval: 1000 }
    };
    
    setDemoConfig(presets[preset]);
    
    // Start immediately with preset
    setTimeout(() => {
      const campaignId = `demo_${preset}_${Date.now()}`;
      const messages = generateDemoMessages(presets[preset].messageCount);
      
      startTracking(campaignId, {
        title: `${preset.charAt(0).toUpperCase() + preset.slice(1)} Demo Campaign`,
        messages: messages
      });

      simulateMessageSending(campaignId, messages);
    }, 100);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        📊 Progress Tracker Demo
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          This demo simulates WhatsApp campaign sending to test the floating progress tracker. 
          The tracker will appear in the bottom-right corner showing real-time progress.
        </Typography>
      </Alert>

      {/* Quick Demo Buttons */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🚀 Quick Demo Campaigns
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Button
                fullWidth
                variant="contained"
                color="success"
                onClick={() => quickDemo('small')}
                startIcon={<PlayArrow />}
              >
                Small Campaign
                <br />
                <small>3 messages, 0% failures</small>
              </Button>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={() => quickDemo('medium')}
                startIcon={<PlayArrow />}
              >
                Medium Campaign
                <br />
                <small>8 messages, 25% failures</small>
              </Button>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                fullWidth
                variant="contained"
                color="warning"
                onClick={() => quickDemo('large')}
                startIcon={<PlayArrow />}
              >
                Large Campaign
                <br />
                <small>15 messages, 40% failures</small>
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Custom Demo Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ⚙️ Custom Demo Configuration
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Message Count"
                type="number"
                value={demoConfig.messageCount}
                onChange={(e) => setDemoConfig(prev => ({
                  ...prev,
                  messageCount: parseInt(e.target.value) || 1
                }))}
                inputProps={{ min: 1, max: 50 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Failure Rate (%)"
                type="number"
                value={demoConfig.failureRate}
                onChange={(e) => setDemoConfig(prev => ({
                  ...prev,
                  failureRate: parseInt(e.target.value) || 0
                }))}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Send Interval (ms)"
                type="number"
                value={demoConfig.sendInterval}
                onChange={(e) => setDemoConfig(prev => ({
                  ...prev,
                  sendInterval: parseInt(e.target.value) || 1000
                }))}
                inputProps={{ min: 500, max: 10000 }}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={startDemo}
              startIcon={<PlayArrow />}
              disabled={activeTrackers.some(t => t.id.startsWith('demo_'))}
            >
              Start Custom Demo
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={stopAllDemos}
              startIcon={<Stop />}
              disabled={!activeTrackers.some(t => t.id.startsWith('demo_'))}
            >
              Stop All Demos
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Active Trackers Info */}
      {activeTrackers.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📈 Active Progress Trackers ({activeTrackers.length})
            </Typography>
            {activeTrackers.map(tracker => (
              <Alert key={tracker.id} severity="info" sx={{ mb: 1 }}>
                <Typography variant="body2">
                  <strong>{tracker.title}</strong> - 
                  {tracker.analytics.sentCount}/{tracker.analytics.totalMessages} sent
                  ({tracker.analytics.successRate}% success rate)
                  {tracker.analytics.failedCount > 0 && (
                    <span style={{ color: 'red' }}> • {tracker.analytics.failedCount} failed</span>
                  )}
                </Typography>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      <Box sx={{ mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          💡 <strong>How to use:</strong> Click any demo button above to start a simulated campaign. 
          The floating progress tracker will appear in the bottom-right corner showing real-time message sending progress.
          You can start multiple campaigns simultaneously to test the stacking behavior.
        </Typography>
      </Box>
    </Container>
  );
};

export default ProgressTrackerDemo;