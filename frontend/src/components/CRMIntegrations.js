import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Card,
  CardContent,
  CardActions,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Sync as SyncIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Settings as SettingsIcon,
  CloudSync as CloudSyncIcon,
  BusinessCenter as BusinessIcon,
  ContactPhone as ContactIcon,
  Link as LinkIcon,
  Unlink as UnlinkIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const CRMIntegrations = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [integrations, setIntegrations] = useState([]);
  const [selectedCRM, setSelectedCRM] = useState('');
  const [configDialog, setConfigDialog] = useState(false);
  const [syncDialog, setSyncDialog] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncResults, setSyncResults] = useState(null);

  const [configData, setConfigData] = useState({
    name: '',
    type: '',
    apiUrl: '',
    apiKey: '',
    clientId: '',
    clientSecret: '',
    settings: {}
  });

  const supportedCRMs = [
    {
      id: 'mautic',
      name: 'Mautic',
      description: 'Open-source marketing automation platform - Import contacts with phone numbers for WhatsApp campaigns',
      icon: '🚀',
      authType: 'oauth2', // Changed to OAuth2
      fields: [
        { key: 'apiUrl', label: 'Mautic URL', required: true, placeholder: 'https://dfgbusiness.com/mautic', defaultValue: 'https://dfgbusiness.com/mautic' },
        { key: 'clientId', label: 'Client ID', required: true, placeholder: 'OAuth2 Client ID from Mautic' },
        { key: 'clientSecret', label: 'Client Secret', required: true, type: 'password', placeholder: 'OAuth2 Client Secret from Mautic' }
      ],
      setupNotes: [
        'OAuth2 authentication provides secure access to your Mautic instance',
        'Automatically syncs contacts with phone numbers for WhatsApp campaigns',
        'Real-time webhook integration keeps contacts up-to-date',
        'Setup includes: 1) Create OAuth2 app in Mautic, 2) Configure credentials, 3) Authorize access'
      ],
      oauthUrl: API_ENDPOINTS.CRM.MAUTIC_AUTH // OAuth initiation endpoint
    },
    {
      id: 'suitecrm',
      name: 'SuiteCRM',
      description: 'Enterprise open-source CRM',
      icon: '📊',
      authType: 'api_key',
      fields: [
        { key: 'apiUrl', label: 'SuiteCRM URL', required: true, placeholder: 'https://your-suitecrm.com' },
        { key: 'apiKey', label: 'API Key', required: true, type: 'password' },
        { key: 'username', label: 'Username', required: true }
      ]
    },
    {
      id: 'zoho',
      name: 'Zoho CRM',
      description: 'Cloud-based CRM solution',
      icon: '⚡',
      authType: 'oauth2',
      fields: [
        { key: 'clientId', label: 'Client ID', required: true },
        { key: 'clientSecret', label: 'Client Secret', required: true, type: 'password' },
        { key: 'dataCenter', label: 'Data Center', required: true, options: ['com', 'eu', 'in', 'com.au', 'jp'] }
      ]
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      description: 'Inbound marketing and sales platform',
      icon: '🧲',
      authType: 'api_key',
      fields: [
        { key: 'apiKey', label: 'Private App Token', required: true, type: 'password' }
      ]
    },
    {
      id: 'google',
      name: 'Google Contacts',
      description: 'Google Workspace contacts',
      icon: '📧',
      authType: 'oauth2',
      fields: [
        { key: 'clientId', label: 'Client ID', required: true },
        { key: 'clientSecret', label: 'Client Secret', required: true, type: 'password' }
      ]
    }
  ];

  useEffect(() => {
    if (open) {
      fetchIntegrations();
    }
  }, [open]);

  // Check for OAuth return parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mauticSuccess = urlParams.get('mautic_success');
    const mauticError = urlParams.get('mautic_error');
    const message = urlParams.get('message');

    if (mauticSuccess === 'true') {
      setSuccess(decodeURIComponent(message || 'OAuth2 authorization successful!'));
      fetchIntegrations(); // Refresh to show updated status
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (mauticError === 'true') {
      setError(decodeURIComponent(message || 'OAuth2 authorization failed'));
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.CRM.LIST, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIntegrations(response.data.integrations || []);
    } catch (error) {
      console.error('Error fetching integrations:', error);
      setError('Failed to load CRM integrations');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIntegration = (crmType) => {
    const crm = supportedCRMs.find(c => c.id === crmType);
    setConfigData({
      name: `${crm.name} Integration`,
      type: crmType,
      apiUrl: '',
      apiKey: '',
      clientId: '',
      clientSecret: '',
      settings: {}
    });
    setSelectedCRM(crmType);
    setConfigDialog(true);
  };

  const handleEditIntegration = (integration) => {
    setConfigData(integration);
    setSelectedCRM(integration.type);
    setConfigDialog(true);
  };

  const handleSaveIntegration = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const endpoint = configData._id ? API_ENDPOINTS.CRM.UPDATE(configData._id) : API_ENDPOINTS.CRM.CREATE;
      const method = configData._id ? 'put' : 'post';
      
      const response = await axios[method](endpoint, configData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess(configData._id ? 'Integration updated successfully' : 'Integration added successfully');
        setConfigDialog(false);
        fetchIntegrations();
        onSuccess && onSuccess();
      } else {
        setError(response.data.message || 'Failed to save integration');
      }
    } catch (error) {
      console.error('Save integration error:', error);
      setError(error.response?.data?.message || 'Failed to save integration');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIntegration = async (integrationId) => {
    if (!window.confirm('Are you sure you want to delete this integration?')) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.delete(API_ENDPOINTS.CRM.DELETE(integrationId), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Integration deleted successfully');
      fetchIntegrations();
    } catch (error) {
      setError('Failed to delete integration');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (integration) => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await axios.post(API_ENDPOINTS.CRM.TEST(integration._id), {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess('Connection test successful');
      } else {
        setError(response.data.message || 'Connection test failed');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Connection test failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncContacts = async (integration) => {
    try {
      setLoading(true);
      setSyncProgress(0);
      setSyncResults(null);
      setSyncDialog(true);
      
      const token = localStorage.getItem('token');
      const response = await axios.post(API_ENDPOINTS.CRM.SYNC(integration._id), {}, {
        headers: { Authorization: `Bearer ${token}` },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setSyncProgress(percentCompleted);
        }
      });

      if (response.data.success) {
        setSyncResults(response.data.results);
        setSuccess('Contact sync completed successfully');
      } else {
        setError(response.data.message || 'Contact sync failed');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Contact sync failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth2Authorization = async (integration) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Get OAuth2 authorization URL from backend
      const response = await axios.get(API_ENDPOINTS.CRM.MAUTIC_AUTH, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.authUrl) {
        console.log('🚀 Opening OAuth2 authorization window...');
        
        // Open OAuth2 authorization URL in new window
        const authWindow = window.open(
          response.data.authUrl,
          'mautic-oauth',
          'width=600,height=600,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no'
        );
        
        if (!authWindow) {
          setError('Failed to open OAuth2 authorization window. Please disable popup blockers and try again.');
          return;
        }
        
        // Listen for OAuth2 callback with proper null checking
        const checkClosed = setInterval(() => {
          try {
            if (authWindow && authWindow.closed) {
              clearInterval(checkClosed);
              console.log('✅ OAuth2 authorization window closed');
              // Refresh integrations to check if OAuth2 was successful
              fetchIntegrations();
              setSuccess('OAuth2 authorization window closed. Checking authorization status...');
            }
          } catch (error) {
            // Handle case where authWindow becomes null or inaccessible
            console.warn('OAuth2 window check error:', error.message);
            clearInterval(checkClosed);
            fetchIntegrations();
            setSuccess('OAuth2 authorization completed. Checking status...');
          }
        }, 1000);
        
        // Set a timeout to stop checking after 5 minutes
        setTimeout(() => {
          if (checkClosed) {
            clearInterval(checkClosed);
            console.log('⏱️ OAuth2 window check timeout');
            fetchIntegrations();
          }
        }, 5 * 60 * 1000); // 5 minutes
        
      } else {
        setError('Failed to get OAuth2 authorization URL');
      }
    } catch (error) {
      console.error('OAuth2 authorization error:', error);
      setError(error.response?.data?.message || 'OAuth2 authorization failed');
    } finally {
      setLoading(false);
    }
  };

  // Alternative OAuth2 method using direct redirect (more reliable)
  const handleOAuth2AuthorizationRedirect = async (integration) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Get OAuth2 authorization URL from backend
      const response = await axios.get(API_ENDPOINTS.CRM.MAUTIC_AUTH, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.authUrl) {
        console.log('🚀 Redirecting to OAuth2 authorization...');
        // Store current page to return to after OAuth
        localStorage.setItem('oauth_return_page', window.location.pathname);
        // Direct redirect to OAuth URL
        window.location.href = response.data.authUrl;
      } else {
        setError('Failed to get OAuth2 authorization URL');
      }
    } catch (error) {
      console.error('OAuth2 authorization error:', error);
      setError(error.response?.data?.message || 'OAuth2 authorization failed');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'error': return 'error';
      case 'inactive': return 'default';
      default: return 'warning';
    }
  };

  const renderConfigFields = () => {
    const crm = supportedCRMs.find(c => c.id === selectedCRM);
    if (!crm) return null;

    return crm.fields.map((field) => (
      <Grid item xs={12} key={field.key}>
        {field.options ? (
          <FormControl fullWidth required={field.required}>
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={configData[field.key] || ''}
              onChange={(e) => setConfigData({
                ...configData,
                [field.key]: e.target.value
              })}
            >
              {field.options.map(option => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <TextField
            fullWidth
            label={field.label}
            type={field.type || 'text'}
            value={configData[field.key] || ''}
            onChange={(e) => setConfigData({
              ...configData,
              [field.key]: e.target.value
            })}
            required={field.required}
            placeholder={field.placeholder}
          />
        )}
      </Grid>
    ));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon color="primary" />
          <Typography variant="h6">CRM Integrations</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Available CRM Systems */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Available CRM Systems
            </Typography>
            <Grid container spacing={2}>
              {supportedCRMs.map((crm) => (
                <Grid item xs={12} key={crm.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Typography variant="h4">{crm.icon}</Typography>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6">{crm.name}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            {crm.description}
                          </Typography>
                          <Chip
                            label={crm.authType === 'oauth2' ? 'OAuth 2.0' : 'API Key'}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        </Box>
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button
                        startIcon={<AddIcon />}
                        onClick={() => handleAddIntegration(crm.id)}
                        size="small"
                      >
                        Add Integration
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Active Integrations */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Active Integrations
            </Typography>
            {integrations.length === 0 ? (
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <CloudSyncIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="textSecondary">
                    No CRM Integrations
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Add your first CRM integration to sync contacts
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <List>
                {integrations.map((integration) => {
                  const crm = supportedCRMs.find(c => c.id === integration.type);
                  return (
                    <Card key={integration._id} sx={{ mb: 2 }}>
                      <ListItem>
                        <ListItemIcon>
                          <Typography variant="h6">{crm?.icon}</Typography>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1" component="span">
                                {integration.name}
                              </Typography>
                              <Chip
                                label={integration.status}
                                color={getStatusColor(integration.status)}
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <React.Fragment>
                              <Typography variant="body2" color="textSecondary" component="span">
                                {crm?.name} • Last sync: {integration.lastSync ? 
                                  new Date(integration.lastSync).toLocaleDateString() : 'Never'
                                }
                              </Typography>
                              {integration.lastSyncResults && (
                                <Typography variant="caption" color="textSecondary" component="span" sx={{ display: 'block' }}>
                                  {integration.lastSyncResults.imported} contacts imported, {' '}
                                  {integration.lastSyncResults.updated} updated
                                </Typography>
                              )}
                            </React.Fragment>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleTestConnection(integration)}
                              title="Test Connection"
                            >
                              <LinkIcon />
                            </IconButton>
                            {integration.type === 'mautic' && integration.status !== 'active' && (
                              <IconButton
                                size="small"
                                onClick={() => handleOAuth2AuthorizationRedirect(integration)}
                                title="Authorize with OAuth2 (Direct Redirect)"
                                color="primary"
                              >
                                <CloudSyncIcon />
                              </IconButton>
                            )}
                            <IconButton
                              size="small"
                              onClick={() => handleSyncContacts(integration)}
                              title="Sync Contacts"
                              disabled={integration.status !== 'active'}
                            >
                              <SyncIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleEditIntegration(integration)}
                              title="Edit"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteIntegration(integration._id)}
                              title="Delete"
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </Card>
                  );
                })}
              </List>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      {/* Configuration Dialog */}
      <Dialog open={configDialog} onClose={() => setConfigDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Configure {supportedCRMs.find(c => c.id === selectedCRM)?.name}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Integration Name"
                value={configData.name}
                onChange={(e) => setConfigData({ ...configData, name: e.target.value })}
                required
              />
            </Grid>
            {renderConfigFields()}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSaveIntegration}
            variant="contained"
            disabled={loading || !configData.name}
          >
            {loading ? 'Saving...' : (configData._id ? 'Update' : 'Add')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sync Dialog */}
      <Dialog open={syncDialog} onClose={() => setSyncDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Contact Sync Progress</DialogTitle>
        <DialogContent>
          {loading && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" gutterBottom>
                Syncing contacts... {syncProgress}%
              </Typography>
              <LinearProgress variant="determinate" value={syncProgress} />
            </Box>
          )}

          {syncResults && (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                Contact sync completed successfully!
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="h4" color="primary">
                    {syncResults.imported}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Imported
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h4" color="success.main">
                    {syncResults.updated}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Updated
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h4" color="warning.main">
                    {syncResults.skipped}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Skipped
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h4" color="error.main">
                    {syncResults.failed}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Failed
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSyncDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default CRMIntegrations;