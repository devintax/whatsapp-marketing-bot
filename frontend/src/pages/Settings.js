import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Settings as SettingsIcon,
  WhatsApp,
  Security,
  Notifications,
  Storage,
  Api,
  Refresh,
  Check,
  Error as ErrorIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

export default function Settings() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [whatsappStatus, setWhatsappStatus] = useState('disconnected');
  const [whatsappMode, setWhatsappMode] = useState('unknown'); // 'real', 'demo', or 'unknown'
  const [openQRDialog, setOpenQRDialog] = useState(false);
  const [qrCode, setQRCode] = useState('');
  
  const [settings, setSettings] = useState({
    // WhatsApp Settings
    whatsappConnected: false,
    autoResponse: false,
    messageDelay: 2,
    
    // Notification Settings
    emailNotifications: true,
    campaignAlerts: true,
    errorAlerts: true,
    
    // AI Settings
    defaultTone: 'professional',
    maxRetries: 3,
    aiProvider: 'openai',
    
    // Security Settings
    twoFactorAuth: false,
    sessionTimeout: 60,
    ipWhitelist: ''
  });

  useEffect(() => {
    fetchSettings();
    checkWhatsAppStatus();
  }, []);

  // Auto-refresh QR code when dialog opens
  useEffect(() => {
    if (openQRDialog && whatsappStatus === 'qr_ready') {
      pollForQRCode();
    }
  }, [openQRDialog]);

  // Auto-close dialog when connected
  useEffect(() => {
    if (whatsappStatus === 'connected' && openQRDialog) {
      setTimeout(() => {
        setOpenQRDialog(false);
        setSuccess('WhatsApp connected successfully!');
      }, 2000); // Give user time to see success message
    }
  }, [whatsappStatus, openQRDialog]);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.AUTH.PROFILE, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // In a real app, you'd have a settings endpoint
      console.log('User profile loaded');
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const checkWhatsAppStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.WHATSAPP.STATUS, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWhatsappStatus(response.data.status || 'disconnected');
      
      // Log detailed status for debugging
      console.log('WhatsApp Status:', response.data);
      
      if (response.data.clientInfo) {
        console.log('Client Info:', response.data.clientInfo);
      }
      
      if (response.data.canSendMessages) {
        console.log('✅ WhatsApp is ready to send messages!');
      } else {
        console.log('❌ WhatsApp is not ready to send messages');
      }
      
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
    }
  };

  const handleConnectWhatsApp = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      // Initialize WhatsApp client
      const response = await axios.post(API_ENDPOINTS.WHATSAPP.INIT, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setWhatsappStatus(response.data.status);
      if (response.data.mode) {
        setWhatsappMode(response.data.mode);
      }
      
      // Start polling for QR code
      if (response.data.status === 'initializing') {
        pollForQRCode();
      }
      
    } catch (error) {
      setError('Failed to connect WhatsApp');
      console.error('WhatsApp connection error:', error);
    } finally {
      setLoading(false);
    }
  };

  const pollForQRCode = async () => {
    const maxAttempts = 30; // 90 seconds maximum (30 * 3 seconds)
    let attempts = 0;
    
    const poll = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(API_ENDPOINTS.WHATSAPP.STATUS, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        });
        
        setWhatsappStatus(response.data.status);
        
        if (response.data.qrCode && response.data.status === 'qr_ready') {
          setQRCode(response.data.qrCode);
          setOpenQRDialog(true);
          setSuccess('QR Code ready! Please scan with your WhatsApp mobile app.');
          return; // Stop polling
        }
        
        if (response.data.status === 'connected' || response.data.status === 'authenticated') {
          setSuccess('WhatsApp connected successfully!');
          setOpenQRDialog(false);
          return; // Stop polling
        }
        
        if (response.data.status === 'auth_failed' || response.data.status === 'error') {
          setError('WhatsApp authentication failed. Please try again.');
          setLoading(false);
          return; // Stop polling
        }
        
        // Continue polling if still initializing
        attempts++;
        if (attempts < maxAttempts && 
            (response.data.status === 'initializing' || 
             response.data.status === 'qr_ready' || 
             response.data.status === 'restoring')) {
          setTimeout(poll, 3000); // Poll every 3 seconds instead of 1 second
        } else if (attempts >= maxAttempts) {
          setError('WhatsApp initialization timeout. Please try again.');
          setLoading(false);
        }
        
      } catch (error) {
        console.error('Error polling WhatsApp status:', error);
        
        // If it's a rate limiting error, wait longer before retrying
        if (error.response?.status === 429) {
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 10000); // Wait 10 seconds if rate limited
          } else {
            setError('Too many requests. Please wait a moment and try again.');
            setLoading(false);
          }
        } else {
          setError('Error checking WhatsApp status: ' + (error.response?.data?.message || error.message));
          setLoading(false);
        }
      }
    };
    
    poll();
  };

  const handleDisconnectWhatsApp = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(API_ENDPOINTS.WHATSAPP.DISCONNECT, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('WhatsApp disconnected successfully');
      setWhatsappStatus('disconnected');
      setOpenQRDialog(false);
      setQRCode('');
    } catch (error) {
      setError('Failed to disconnect WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateScan = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(API_ENDPOINTS.WHATSAPP.SIMULATE_SCAN, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setWhatsappStatus('authenticated');
      setSuccess('QR code scan simulated! Connecting...');
      
      // Poll for connection status
      setTimeout(() => {
        checkWhatsAppStatus();
      }, 3000);
      
    } catch (error) {
      setError('Failed to simulate QR scan');
    } finally {
      setLoading(false);
    }
  };

  const handleTestMessage = async () => {
    try {
      setLoading(true);
      const phone = prompt('Enter phone number to test (with country code, e.g., +1234567890):');
      if (!phone) return;
      
      const token = localStorage.getItem('token');
      const response = await axios.post(API_ENDPOINTS.WHATSAPP.SEND_MESSAGE, {
        phone: phone.replace(/\D/g, ''), // Remove non-digits
        message: `Test message from WhatsApp Bot - ${new Date().toLocaleString()}`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess(`Test message sent successfully to ${phone}!`);
    } catch (error) {
      setError(`Failed to send test message: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      // In a real app, you'd save settings to backend
      setSuccess('Settings saved successfully');
    } catch (error) {
      setError('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return <Check sx={{ color: 'success.main' }} />;
      case 'connecting':
        return <CircularProgress size={20} />;
      case 'error':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      default:
        return <ErrorIcon sx={{ color: 'text.secondary' }} />;
    }
  };

  const WhatsAppSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              WhatsApp Connection
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {getStatusIcon(whatsappStatus)}
              <Typography variant="body1" sx={{ ml: 1 }}>
                Status: {whatsappStatus.charAt(0).toUpperCase() + whatsappStatus.slice(1).replace('_', ' ')}
              </Typography>
              <Chip 
                label={whatsappStatus.replace('_', ' ')} 
                color={whatsappStatus === 'connected' ? 'success' : 
                       whatsappStatus === 'qr_ready' ? 'warning' : 
                       whatsappStatus === 'auth_failed' ? 'error' : 'default'}
                sx={{ ml: 2 }}
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {whatsappStatus === 'connected' ? 
                'Your WhatsApp is connected and ready to send messages.' :
                whatsappStatus === 'qr_ready' ?
                `QR code is ready. ${whatsappMode === 'demo' ? '(Demo mode - for testing only)' : 'Please scan it with your WhatsApp mobile app.'}` :
                whatsappStatus === 'initializing' ?
                `Initializing WhatsApp client... ${whatsappMode === 'demo' ? '(Demo mode)' : '(Attempting real connection)'}` :
                whatsappStatus === 'auth_failed' ?
                'Authentication failed. Please try connecting again.' :
                'WhatsApp is not connected. Click the button below to connect.'
              }
              {whatsappMode === 'demo' && (
                <><br /><strong>Note:</strong> Demo mode is active. Install Chrome/Chromium for real WhatsApp integration.</>
              )}
            </Typography>
            
            {whatsappStatus === 'connected' ? (
              <Box>
                <Button 
                  variant="outlined" 
                  color="error"
                  onClick={handleDisconnectWhatsApp}
                  disabled={loading}
                  sx={{ mr: 1 }}
                >
                  Disconnect WhatsApp
                </Button>
                <Button 
                  variant="contained" 
                  color="success"
                  onClick={handleTestMessage}
                  disabled={loading}
                >
                  Send Test Message
                </Button>
              </Box>
            ) : (
              <Box>
                <Button 
                  variant="contained" 
                  startIcon={<WhatsApp />}
                  onClick={handleConnectWhatsApp}
                  disabled={loading || whatsappStatus === 'initializing' || whatsappStatus === 'restoring'}
                >
                  {loading ? 'Connecting...' : 
                   whatsappStatus === 'qr_ready' ? 'Show QR Code' : 
                   whatsappStatus === 'restoring' ? 'Restoring Session...' :
                   'Connect WhatsApp'}
                </Button>
                
                {whatsappStatus === 'restoring' && (
                  <Button 
                    variant="outlined" 
                    color="warning"
                    onClick={handleDisconnectWhatsApp}
                    disabled={loading}
                    sx={{ ml: 1 }}
                  >
                    Reset Connection
                  </Button>
                )}
              </Box>
            )}
            
            {whatsappStatus === 'qr_ready' && (
              <Button 
                variant="outlined" 
                startIcon={<Refresh />}
                onClick={() => setOpenQRDialog(true)}
                sx={{ ml: 1 }}
              >
                Show QR Code
              </Button>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Message Settings
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.autoResponse}
                      onChange={(e) => handleSettingChange('autoResponse', e.target.checked)}
                    />
                  }
                  label="Auto-response for incoming messages"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Message Delay (seconds)"
                  type="number"
                  value={settings.messageDelay}
                  onChange={(e) => handleSettingChange('messageDelay', parseInt(e.target.value))}
                  helperText="Delay between sending messages to avoid spam detection"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const NotificationSettings = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Notification Preferences
        </Typography>
        <List>
          <ListItem>
            <ListItemText
              primary="Email Notifications"
              secondary="Receive email updates about campaigns and system status"
            />
            <ListItemSecondaryAction>
              <Switch
                checked={settings.emailNotifications}
                onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
              />
            </ListItemSecondaryAction>
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary="Campaign Alerts"
              secondary="Get notified when campaigns start, complete, or fail"
            />
            <ListItemSecondaryAction>
              <Switch
                checked={settings.campaignAlerts}
                onChange={(e) => handleSettingChange('campaignAlerts', e.target.checked)}
              />
            </ListItemSecondaryAction>
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary="Error Alerts"
              secondary="Receive immediate notifications for system errors"
            />
            <ListItemSecondaryAction>
              <Switch
                checked={settings.errorAlerts}
                onChange={(e) => handleSettingChange('errorAlerts', e.target.checked)}
              />
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </CardContent>
    </Card>
  );

  const AISettings = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          AI Configuration
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Default Tone"
              value={settings.defaultTone}
              onChange={(e) => handleSettingChange('defaultTone', e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="friendly">Friendly</option>
              <option value="urgent">Urgent</option>
              <option value="educational">Educational</option>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="AI Provider"
              value={settings.aiProvider}
              onChange={(e) => handleSettingChange('aiProvider', e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="openai">OpenAI (GPT-4)</option>
              <option value="groq">Groq</option>
              <option value="gemini">Google Gemini</option>
              <option value="claude">Claude</option>
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Max Retries"
              type="number"
              value={settings.maxRetries}
              onChange={(e) => handleSettingChange('maxRetries', parseInt(e.target.value))}
              helperText="Number of retry attempts for failed AI requests"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const SecuritySettings = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Security Settings
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.twoFactorAuth}
                  onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
                />
              }
              label="Two-Factor Authentication"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Session Timeout (minutes)"
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
              helperText="Automatically log out after period of inactivity"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="IP Whitelist"
              value={settings.ipWhitelist}
              onChange={(e) => handleSettingChange('ipWhitelist', e.target.value)}
              placeholder="192.168.1.1, 10.0.0.1"
              helperText="Comma-separated list of allowed IP addresses (leave empty for no restrictions)"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <SettingsIcon sx={{ mr: 2 }} />
          Settings & Configuration
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab icon={<WhatsApp />} label="WhatsApp" />
            <Tab icon={<Notifications />} label="Notifications" />
            <Tab icon={<Api />} label="AI Settings" />
            <Tab icon={<Security />} label="Security" />
          </Tabs>
        </Box>

        <Box sx={{ mb: 3 }}>
          {activeTab === 0 && <WhatsAppSettings />}
          {activeTab === 1 && <NotificationSettings />}
          {activeTab === 2 && <AISettings />}
          {activeTab === 3 && <SecuritySettings />}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={handleSaveSettings}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>

        {/* QR Code Dialog */}
        <Dialog open={openQRDialog} onClose={() => setOpenQRDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <WhatsApp sx={{ mr: 1 }} />
              Connect WhatsApp
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              Scan this QR code with your WhatsApp mobile app to connect:
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {getStatusIcon(whatsappStatus)}
              <Typography variant="body2" sx={{ ml: 1 }}>
                Status: {whatsappStatus.replace('_', ' ').charAt(0).toUpperCase() + whatsappStatus.replace('_', ' ').slice(1)}
              </Typography>
            </Box>
            
            {qrCode ? (
              <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                <img src={qrCode} alt="WhatsApp QR Code" style={{ maxWidth: '300px', width: '100%' }} />
                <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                  QR Code expires in a few minutes. Click refresh if needed.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', p: 4, border: '1px dashed #ddd', borderRadius: 1 }}>
                <CircularProgress size={40} />
                <Typography variant="body2" sx={{ mt: 2 }}>
                  {whatsappStatus === 'initializing' ? 'Initializing WhatsApp client...' :
                   whatsappStatus === 'qr_ready' ? 'Generating QR code...' :
                   'Preparing connection...'}
                </Typography>
              </Box>
            )}
            
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Instructions:</Typography>
              1. Open WhatsApp on your phone<br />
              2. Go to Settings → Linked Devices<br />
              3. Tap "Link a Device"<br />
              4. Scan this QR code with your camera<br />
              <br />
              <Typography variant="subtitle2" color="warning.main">
                ⚠️ Demo Mode Active: This QR code is for interface testing only.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                For real WhatsApp integration, ensure Chrome/Chromium browser is installed on your system.
                The app will automatically detect and use real WhatsApp Web when possible.
              </Typography>
            </Alert>
            
            {whatsappStatus === 'connected' && (
              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Success!</Typography>
                WhatsApp has been connected successfully. You can now close this dialog.
              </Alert>
            )}
            
            {whatsappStatus === 'auth_failed' && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Authentication Failed</Typography>
                The QR code scan failed or expired. Please try again.
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenQRDialog(false)}>
              Close
            </Button>
            <Button 
              onClick={handleConnectWhatsApp} 
              startIcon={<Refresh />}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh QR Code'}
            </Button>
            {whatsappStatus === 'qr_ready' && (
              <Button 
                variant="outlined"
                color="warning"
                onClick={handleSimulateScan}
                disabled={loading}
              >
                Simulate Scan (Demo)
              </Button>
            )}
            {whatsappStatus === 'connected' && (
              <Button 
                variant="contained" 
                color="success"
                onClick={() => setOpenQRDialog(false)}
              >
                Done
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}