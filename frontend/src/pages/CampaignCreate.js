import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Grid,
  Alert,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  FormControlLabel,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Preview,
  Send,
  Add,
  Delete,
  Image,
  AttachFile,
  People,
  Campaign as CampaignIcon,
  AutoAwesome,
  LibraryBooks
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_ENDPOINTS } from '../config/api';
import CampaignTemplatesLibrary from '../components/CampaignTemplatesLibrary';
import { useProgressTracker } from '../contexts/ProgressTrackerContext';
import MediaUpload from '../components/MediaUpload';
import CampaignPreview from '../components/CampaignPreview';
import CampaignProgressTracker from '../components/CampaignProgressTracker';

const steps = [
  'Campaign Details',
  'Content & Media',
  'Target Audience', 
  'Review & Send'
];

export default function CampaignCreate() {
  const navigate = useNavigate();
  const { startTracking, updateMessageStatus } = useProgressTracker();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]); // 🏷️ Filtered contacts by tag
  const [selectedTagFilter, setSelectedTagFilter] = useState('all'); // 🏷️ Tag filter state
  const [availableTags, setAvailableTags] = useState([]); // 🏷️ All unique tags
  const [previewOpen, setPreviewOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false); // 📚 Templates library state
  
  // 🚀 PROGRESS TRACKER STATE
  const [showProgress, setShowProgress] = useState(false);
  const [progressData, setProgressData] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'promotional',
    content: '',
    mediaFiles: [],
    targetContacts: [],
    schedule: {
      sendNow: true,
      scheduledDate: '',
      scheduledTime: ''
    },
    settings: {
      enableDeliveryReports: true,
      enableReadReceipts: true,
      enableAutoResponses: false
    }
  });

  const campaignTypes = [
    { value: 'promotional', label: 'Promotional' },
    { value: 'informational', label: 'Informational' },
    { value: 'seasonal', label: 'Seasonal' },
    { value: 'event', label: 'Event' },
    { value: 'follow-up', label: 'Follow-up' },
    { value: 'announcement', label: 'Announcement' }
  ];

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.CONTACTS.LIST, {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          limit: 1000 // Request up to 1000 contacts for campaign creation
        }
      });
      const loadedContacts = response.data.contacts || [];
      setContacts(loadedContacts);
      setFilteredContacts(loadedContacts); // 🏷️ Initially show all contacts
      
      // 🏷️ Extract unique tags from all contacts
      const tagsSet = new Set();
      loadedContacts.forEach(contact => {
        if (contact.tags && Array.isArray(contact.tags)) {
          contact.tags.forEach(tag => tagsSet.add(tag));
        }
      });
      setAvailableTags(Array.from(tagsSet).sort());
      
      console.log(`Loaded ${loadedContacts.length} contacts with ${tagsSet.size} unique tags`);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load contacts');
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const validateStep = (step) => {
    switch (step) {
      case 0: // Campaign Details
        if (!formData.name.trim()) {
          toast.error('Campaign name is required');
          return false;
        }
        if (!formData.description.trim()) {
          toast.error('Campaign description is required');
          return false;
        }
        return true;
      
      case 1: // Content & Media
        if (!formData.content.trim()) {
          toast.error('Campaign content is required');
          return false;
        }
        return true;
      
      case 2: // Target Audience
        if (formData.targetContacts.length === 0) {
          toast.error('Please select at least one contact');
          return false;
        }
        return true;
      
      default:
        return true;
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContactToggle = (contact) => {
    setFormData(prev => ({
      ...prev,
      targetContacts: prev.targetContacts.find(c => c._id === contact._id)
        ? prev.targetContacts.filter(c => c._id !== contact._id)
        : [...prev.targetContacts, contact]
    }));
  };

  const handleSelectAllContacts = () => {
    setFormData(prev => ({
      ...prev,
      targetContacts: prev.targetContacts.length === filteredContacts.length ? [] : [...filteredContacts]
    }));
  };

  // 🏷️ TAG FILTER HANDLER - Filter contacts by selected tag
  const handleTagFilterChange = (tag) => {
    setSelectedTagFilter(tag);
    
    if (tag === 'all') {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(contact => 
        contact.tags && contact.tags.includes(tag)
      );
      setFilteredContacts(filtered);
    }
    
    console.log(`Tag filter: ${tag} - Showing ${tag === 'all' ? contacts.length : filteredContacts.length} contacts`);
  };

  const handleMediaUpload = (uploadedFiles) => {
    setFormData(prev => ({
      ...prev,
      mediaFiles: [...prev.mediaFiles, ...uploadedFiles]
    }));
    toast.success(`${uploadedFiles.length} file(s) uploaded successfully`);
  };

  // 📚 TEMPLATE SELECTION HANDLER - Pure additive enhancement
  const handleSelectTemplate = (template) => {
    setFormData(prev => ({
      ...prev,
      content: template.content,
      type: template.category === 'promotional' ? 'promotional' : 
            template.category === 'event' ? 'event' :
            template.category === 'seasonal' ? 'seasonal' :
            template.category === 'announcement' ? 'announcement' :
            template.category === 'reminder' ? 'informational' :
            'promotional', // Default fallback
      description: template.description
    }));
    toast.success(`Template "${template.name}" applied successfully!`);
    setTemplatesOpen(false);
  };

  const removeMediaFile = (index) => {
    setFormData(prev => ({
      ...prev,
      mediaFiles: prev.mediaFiles.filter((_, i) => i !== index)
    }));
  };

  const handlePreview = () => {
    if (validateStep(activeStep)) {
      setPreviewOpen(true);
    }
  };

  const handleSaveDraft = async (skipNavigation = false, skipSuccessToast = false) => {
    try {
      setLoading(true);
      
      // Comprehensive validation before sending
      if (!formData.name || !formData.name.trim()) {
        toast.error('Campaign name is required');
        return false;
      }
      
      if (!formData.content || formData.content.trim().length < 10) {
        toast.error('Campaign content must be at least 10 characters');
        return false;
      }
      
      const token = localStorage.getItem('token');
      
      // Process mediaFiles to ensure compatibility with backend
      const processedMediaFiles = formData.mediaFiles.map(mediaFile => ({
        id: mediaFile.id,
        name: mediaFile.name,
        type: mediaFile.type,
        size: mediaFile.size,
        file: mediaFile.file || mediaFile.path,
        preview: mediaFile.preview,
        status: 'ready'
      }));
      
      // 📅 PREPARE SCHEDULING DATA - NEW ENHANCEMENT
      let schedulingData = {
        sendNow: formData.schedule.sendNow
      };
      
      // If scheduled, add date/time and convert to ISO format
      if (!formData.schedule.sendNow && formData.schedule.scheduledDate && formData.schedule.scheduledTime) {
        const scheduledDateTime = new Date(`${formData.schedule.scheduledDate}T${formData.schedule.scheduledTime}`);
        schedulingData.scheduledDate = scheduledDateTime.toISOString();
        schedulingData.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      }

      // Prepare campaign data in exact backend format
      const campaignData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        aiPrompt: formData.content.trim(), // Backend requires this field
        targetAudience: {
          contacts: formData.targetContacts.map(c => c._id), // Send just ObjectId strings
          totalCount: formData.targetContacts.length
        },
        status: 'draft',
        mediaFiles: processedMediaFiles,
        scheduling: schedulingData // 📅 Add scheduling data
      };

      console.log('📤 Sending campaign data to backend:', JSON.stringify({
        name: campaignData.name,
        aiPromptLength: campaignData.aiPrompt.length,
        targetContactsCount: campaignData.targetAudience.contacts.length,
        mediaFilesCount: campaignData.mediaFiles.length
      }, null, 2));

      const response = await axios.post(API_ENDPOINTS.CAMPAIGNS.CREATE, campaignData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Campaign save response:', response.data);

      // Check for successful response
      if (response.data.success || response.data.campaign) {
        if (!skipSuccessToast) {
          toast.success('Campaign saved as draft successfully!');
        }
        if (!skipNavigation) {
          navigate('/campaigns');
        }
        return true; // Return success
      } else {
        toast.error('Failed to save campaign: Invalid response from server');
        return false; // Return failure
      }
    } catch (error) {
      console.error('❌ Error saving campaign:', error);
      console.error('❌ Error response status:', error.response?.status);
      console.error('❌ Error response data:', error.response?.data);
      
      // Extract detailed error message
      let errorMsg = 'Unknown error';
      if (error.response?.data?.errors) {
        // express-validator format
        errorMsg = error.response.data.errors
          .map(e => `${e.field || e.param}: ${e.message || e.msg}`)
          .join(', ');
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else {
        errorMsg = error.message;
      }
      
      toast.error(`Failed to save campaign: ${errorMsg}`);
      return false; // Return failure
    } finally {
      setLoading(false);
    }
  };

  const handleSendCampaign = async () => {
    try {
      setLoading(true);
      
      // Step 1: Check WhatsApp connection
      const token = localStorage.getItem('token');
      
      console.log('🔍 Checking WhatsApp status...');
      const statusResponse = await axios.get(API_ENDPOINTS.WHATSAPP.STATUS, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!statusResponse.data.canSendMessages) {
        toast.error('WhatsApp bot is not connected. Please connect in Settings first.');
        const shouldGoToSettings = window.confirm(
          'WhatsApp is not connected. Would you like to go to Settings to connect it now?'
        );
        if (shouldGoToSettings) {
          navigate('/settings');
        }
        return;
      }
      
      // Step 2: Save the campaign
      console.log('💾 Saving campaign before sending...');
      const saveResult = await handleSaveDraft(true, true); // Skip navigation and toast
      
      if (!saveResult) {
        toast.error('Cannot send campaign - failed to save');
        return;
      }
      
      // Step 3: Prepare recipients
      const recipients = formData.targetContacts
        .filter(c => c.phone) // Only contacts with phone numbers
        .map(c => c.phone);
      
      if (recipients.length === 0) {
        toast.error('No recipients with valid phone numbers found');
        return;
      }
      
      console.log('📱 Recipients:', recipients);
      
      // Step 4: Prepare media files for sending
      const mediaToSend = formData.mediaFiles.map(file => {
        console.log('📎 Preparing media:', file.name);
        return {
          type: file.type.startsWith('image/') ? 'image' : 
                file.type.startsWith('video/') ? 'video' : 'document',
          mimetype: file.type,
          filename: file.name,
          path: file.file, // Server path from upload
          size: file.size
        };
      });
      
      console.log(`📤 Sending campaign to ${recipients.length} recipients with ${mediaToSend.length} media files...`);
      
      // Step 5: Send via WhatsApp
      const sendResponse = await axios.post(
        API_ENDPOINTS.WHATSAPP.SEND_CAMPAIGN,
        {
          recipients: recipients,
          message: formData.content,
          mediaFiles: mediaToSend
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 60000 // 60 second timeout for large sends
        }
      );
      
      console.log('✅ Send response:', sendResponse.data);
      
      // 🚀 START PROGRESS TRACKING WITH NEW SYSTEM
      if (sendResponse.data.success && sendResponse.data.campaignId) {
        console.log('✅ Starting progress tracking for campaign:', sendResponse.data.campaignId);
        
        // Prepare message list for progress tracker
        const messages = recipients.map((recipient, index) => ({
          id: `msg_${sendResponse.data.campaignId}_${index}`,
          recipient: recipient.phone || recipient,
          phone: recipient.phone || recipient,
          name: recipient.name || `Contact ${index + 1}`,
          content: formData.content,
          status: 'pending',
          sentAt: new Date().toISOString()
        }));
        
        // Start tracking with the new system
        startTracking(sendResponse.data.campaignId, {
          title: formData.name || `Campaign ${sendResponse.data.campaignId}`,
          messages: messages,
          totalRecipients: recipients.length
        });
        
        console.log(`🎯 Progress tracker started for ${messages.length} messages`);
      } else {
        console.log('❌ Cannot start progress tracking - no campaignId or failed response');
      }
      
      const { sent, failed, total } = sendResponse.data;
      
      toast.success(
        `🚀 Campaign launched! Sending to ${total} recipients. Check the progress tracker in the bottom-right corner.`,
        { duration: 6000 }
      );
      
      // Navigate to campaigns page but keep progress tracker visible
      navigate('/campaigns');
      
    } catch (error) {
      console.error('❌ Error sending campaign:', error);
      console.error('❌ Error response:', error.response?.data);
      
      const errorMsg = error.response?.data?.message || error.message;
      toast.error(`Failed to send campaign: ${errorMsg}`);
      
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Campaign Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  helperText="Give your campaign a descriptive name"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Campaign Type</InputLabel>
                  <Select
                    value={formData.type}
                    label="Campaign Type"
                    onChange={(e) => handleInputChange('type', e.target.value)}
                  >
                    {campaignTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Campaign Description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  multiline
                  rows={3}
                  required
                  helperText="Describe the purpose and goals of this campaign"
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {/* 📚 TEMPLATES BUTTON - Pure additive enhancement */}
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    startIcon={<LibraryBooks />}
                    onClick={() => setTemplatesOpen(true)}
                    color="secondary"
                  >
                    Browse Templates
                  </Button>
                </Box>
                <TextField
                  fullWidth
                  label="Campaign Content"
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  multiline
                  rows={6}
                  required
                  helperText="Write the message that will be sent to your contacts, or browse templates for inspiration"
                  placeholder="Hello! We have an exciting announcement to share with you..."
                />
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <AttachFile sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Media Attachments
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Upload images, PDFs, or documents to make your campaign more engaging
                    </Typography>
                    
                    <MediaUpload
                      onFilesUploaded={handleMediaUpload}
                      maxFiles={5}
                      acceptedTypes={['image/*', 'application/pdf', '.doc', '.docx']}
                    />
                    
                    {formData.mediaFiles.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Uploaded Files ({formData.mediaFiles.length})
                        </Typography>
                        <List dense>
                          {formData.mediaFiles.map((file, index) => (
                            <ListItem key={index}>
                              <Image sx={{ mr: 2, color: 'primary.main' }} />
                              <ListItemText 
                                primary={file.name} 
                                secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                              />
                              <ListItemSecondaryAction>
                                <IconButton 
                                  edge="end" 
                                  onClick={() => removeMediaFile(index)}
                                  size="small"
                                >
                                  <Delete />
                                </IconButton>
                              </ListItemSecondaryAction>
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    <People sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Select Target Audience
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleSelectAllContacts}
                  >
                    {formData.targetContacts.length === filteredContacts.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Choose which contacts will receive this campaign
                </Typography>
                
                {/* 🏷️ TAG FILTER DROPDOWN */}
                {availableTags.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Filter by Tag</InputLabel>
                      <Select
                        value={selectedTagFilter}
                        onChange={(e) => handleTagFilterChange(e.target.value)}
                        label="Filter by Tag"
                      >
                        <MenuItem value="all">
                          <em>All Contacts ({contacts.length})</em>
                        </MenuItem>
                        {availableTags.map(tag => {
                          const count = contacts.filter(c => c.tags && c.tags.includes(tag)).length;
                          return (
                            <MenuItem key={tag} value={tag}>
                              {tag} ({count})
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  </Box>
                )}
                
                <Box sx={{ mb: 2 }}>
                  <Chip 
                    label={`${formData.targetContacts.length} of ${filteredContacts.length} contacts selected`}
                    color="primary"
                    variant="outlined"
                  />
                  {selectedTagFilter !== 'all' && (
                    <Chip 
                      label={`Filtered by: ${selectedTagFilter}`}
                      color="secondary"
                      size="small"
                      sx={{ ml: 1 }}
                      onDelete={() => handleTagFilterChange('all')}
                    />
                  )}
                </Box>
                
                {filteredContacts.length === 0 ? (
                  <Alert severity="warning">
                    {selectedTagFilter !== 'all' 
                      ? `No contacts found with tag "${selectedTagFilter}"` 
                      : 'No contacts available. Please add contacts first.'}
                  </Alert>
                ) : (
                  <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                    <List>
                      {filteredContacts.map((contact) => (
                        <ListItem key={contact._id} dense>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={formData.targetContacts.find(c => c._id === contact._id) !== undefined}
                                onChange={() => handleContactToggle(contact)}
                              />
                            }
                            label={
                              <Box>
                                <Typography variant="body1">{contact.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {contact.phone} {contact.email && `• ${contact.email}`}
                                </Typography>
                                {/* 🏷️ Display contact tags */}
                                {contact.tags && contact.tags.length > 0 && (
                                  <Box sx={{ mt: 0.5 }}>
                                    {contact.tags.map(tag => (
                                      <Chip 
                                        key={tag} 
                                        label={tag} 
                                        size="small" 
                                        sx={{ mr: 0.5, mb: 0.5 }} 
                                      />
                                    ))}
                                  </Box>
                                )}
                              </Box>
                            }
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

      case 3:
        return (
          <Box sx={{ mt: 2 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Campaign Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Campaign Name:</Typography>
                    <Typography variant="body1" gutterBottom>{formData.name}</Typography>
                    
                    <Typography variant="subtitle2">Type:</Typography>
                    <Typography variant="body1" gutterBottom>
                      {campaignTypes.find(t => t.value === formData.type)?.label}
                    </Typography>
                    
                    <Typography variant="subtitle2">Target Audience:</Typography>
                    <Typography variant="body1" gutterBottom>
                      {formData.targetContacts.length} contacts
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Media Files:</Typography>
                    <Typography variant="body1" gutterBottom>
                      {formData.mediaFiles.length} files attached
                    </Typography>
                    
                    <Typography variant="subtitle2">Content Preview:</Typography>
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: 'grey.100', 
                      borderRadius: 1, 
                      maxHeight: 150, 
                      overflow: 'auto' 
                    }}>
                      <Typography variant="body2">
                        {formData.content.substring(0, 200)}
                        {formData.content.length > 200 && '...'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* 📅 SCHEDULING OPTIONS - NEW ENHANCEMENT */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  📅 Schedule Campaign
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                  Choose when to send your campaign
                </Typography>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.schedule.sendNow}
                      onChange={(e) => setFormData({
                        ...formData,
                        schedule: {
                          ...formData.schedule,
                          sendNow: e.target.checked,
                          scheduledDate: e.target.checked ? '' : formData.schedule.scheduledDate,
                          scheduledTime: e.target.checked ? '' : formData.schedule.scheduledTime
                        }
                      })}
                    />
                  }
                  label="Send immediately"
                />

                {!formData.schedule.sendNow && (
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Scheduled Date"
                        value={formData.schedule.scheduledDate}
                        onChange={(e) => setFormData({
                          ...formData,
                          schedule: {
                            ...formData.schedule,
                            scheduledDate: e.target.value
                          }
                        })}
                        InputLabelProps={{ shrink: true }}
                        inputProps={{
                          min: new Date().toISOString().split('T')[0] // Prevent past dates
                        }}
                        helperText="Select the date to send the campaign"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="time"
                        label="Scheduled Time"
                        value={formData.schedule.scheduledTime}
                        onChange={(e) => setFormData({
                          ...formData,
                          schedule: {
                            ...formData.schedule,
                            scheduledTime: e.target.value
                          }
                        })}
                        InputLabelProps={{ shrink: true }}
                        helperText="Select the time to send the campaign"
                      />
                    </Grid>
                    {formData.schedule.scheduledDate && formData.schedule.scheduledTime && (
                      <Grid item xs={12}>
                        <Alert severity="info" sx={{ mt: 1 }}>
                          ⏰ Campaign scheduled for: {new Date(`${formData.schedule.scheduledDate}T${formData.schedule.scheduledTime}`).toLocaleString()}
                        </Alert>
                      </Grid>
                    )}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton onClick={() => navigate('/campaigns')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="h1">
              Create Campaign
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Design and send professional WhatsApp marketing campaigns
            </Typography>
          </Box>
        </Box>

        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
              <StepContent>
                {renderStepContent(index)}
                <Box sx={{ mt: 3, mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      onClick={index === steps.length - 1 ? handleSendCampaign : handleNext}
                      disabled={loading || (index === steps.length - 1 && !formData.schedule.sendNow && (!formData.schedule.scheduledDate || !formData.schedule.scheduledTime))}
                      startIcon={index === steps.length - 1 ? <Send /> : null}
                    >
                      {loading ? <CircularProgress size={20} /> : null}
                      {index === steps.length - 1 
                        ? (formData.schedule.sendNow ? 'Send Now' : 'Schedule Campaign')
                        : 'Continue'}
                    </Button>
                    
                    {index === steps.length - 1 && (
                      <Button
                        variant="outlined"
                        onClick={handleSaveDraft}
                        disabled={loading}
                        startIcon={<Save />}
                      >
                        Save Draft
                      </Button>
                    )}
                    
                    <Button
                      variant="outlined"
                      onClick={handlePreview}
                      startIcon={<Preview />}
                    >
                      Preview
                    </Button>
                    
                    {index > 0 && (
                      <Button onClick={handleBack} disabled={loading}>
                        Back
                      </Button>
                    )}
                  </Box>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Campaign Preview Dialog */}
      <CampaignPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        campaign={{
          name: formData.name,
          type: formData.type,
          content: formData.content,
          mediaFiles: formData.mediaFiles,
          targetContacts: formData.targetContacts
        }}
      />

      {/* � CAMPAIGN TEMPLATES LIBRARY - Pure additive enhancement */}
      <CampaignTemplatesLibrary
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* �🚀 FLOATING CAMPAIGN PROGRESS TRACKER */}
      {showProgress && progressData && (
        <CampaignProgressTracker
          campaignData={progressData}
          onClose={handleCloseProgress}
          onRetryFailed={handleRetryFailed}
        />
      )}
    </Container>
  );
}