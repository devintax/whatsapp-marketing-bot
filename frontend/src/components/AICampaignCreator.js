import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  Campaign as CampaignIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Preview as PreviewIcon,
  Send as SendIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import MediaUpload from './MediaUpload';

const AICampaignCreator = ({ open, onClose, onSuccess }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedCampaign, setGeneratedCampaign] = useState(null);
  const [businessData, setBusinessData] = useState([]);
  const [availableTags, setAvailableTags] = useState([]); // 🏷️ Available contact tags
  const [contactStats, setContactStats] = useState({}); // 🏷️ Contact count per tag
  
  const [formData, setFormData] = useState({
    // Step 1: Business Context
    businessName: '',
    businessType: '',
    selectedBusinessData: '',
    
    // Step 2: Campaign Details
    campaignName: '',
    campaignType: 'promotional',
    targetTags: [], // 🏷️ Changed from targetAudience to targetTags
    campaignGoal: '',
    
    // Step 3: AI Configuration
    aiProvider: 'groq',
    tone: 'professional',
    customPrompt: '',
    keyMessages: [],
    mediaFiles: [], // Add media files support
    
    // Step 4: Generated Content
    generatedContent: null
  });

  const [newKeyMessage, setNewKeyMessage] = useState('');

  const campaignTypes = [
    { value: 'promotional', label: 'Promotional Campaign' },
    { value: 'informational', label: 'Informational Campaign' },
    { value: 'seasonal', label: 'Seasonal Campaign' },
    { value: 'event', label: 'Event Campaign' },
    { value: 'follow-up', label: 'Follow-up Campaign' },
    { value: 'welcome', label: 'Welcome Series' },
    { value: 'retention', label: 'Customer Retention' }
  ];

  const businessTypes = [
    'Retail', 'Restaurant', 'Healthcare', 'Education', 'Real Estate',
    'Finance', 'Technology', 'Fitness', 'Beauty', 'Automotive',
    'Legal', 'Consulting', 'E-commerce', 'Manufacturing', 'Other'
  ];

  const toneOptions = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual & Friendly' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'educational', label: 'Educational' },
    { value: 'humorous', label: 'Humorous' },
    { value: 'inspiring', label: 'Inspiring' }
  ];

  const aiProviders = [
    { value: 'groq', label: 'Groq (Fast & Reliable)' },
    { value: 'openai', label: 'OpenAI (GPT-4)' },
    { value: 'gemini', label: 'Google Gemini' },
    { value: 'claude', label: 'Claude (Anthropic)' }
  ];

  useEffect(() => {
    if (open) {
      fetchBusinessData();
      fetchContactTags();
      resetForm();
    }
  }, [open]);

  const fetchBusinessData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.BUSINESS_DATA.LIST, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBusinessData(response.data.businessData || []);
    } catch (error) {
      console.error('Error fetching business data:', error);
    }
  };

  const fetchContactTags = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.CONTACTS.LIST, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const contacts = response.data.contacts || [];
      
      // Extract unique tags and count contacts per tag
      const tagCounts = {};
      contacts.forEach(contact => {
        if (contact.tags && Array.isArray(contact.tags)) {
          contact.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });
      
      setAvailableTags(Object.keys(tagCounts).sort());
      setContactStats(tagCounts);
    } catch (error) {
      console.error('Error fetching contact tags:', error);
    }
  };

  const resetForm = () => {
    setActiveStep(0);
    setGeneratedCampaign(null);
    setError('');
    setFormData({
      businessName: '',
      businessType: '',
      selectedBusinessData: '',
      campaignName: '',
      campaignType: 'promotional',
      targetTags: [],
      campaignGoal: '',
      aiProvider: 'groq',
      tone: 'professional',
      customPrompt: '',
      keyMessages: [],
      mediaFiles: [],
      generatedContent: null
    });
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
    setError('');
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setError('');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addKeyMessage = () => {
    if (newKeyMessage.trim()) {
      setFormData(prev => ({
        ...prev,
        keyMessages: [...prev.keyMessages, newKeyMessage.trim()]
      }));
      setNewKeyMessage('');
    }
  };

  const removeKeyMessage = (index) => {
    setFormData(prev => ({
      ...prev,
      keyMessages: prev.keyMessages.filter((_, i) => i !== index)
    }));
  };

  const generateAICampaign = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      
      // Build the AI request payload with smart targetAudience handling
      const targetAudienceText = formData.targetTags.length > 0 
        ? formData.targetTags.join(', ')
        : 'General audience for ' + formData.businessType;
      
      const aiRequest = {
        businessName: formData.businessName,
        businessType: formData.businessType,
        businessDataId: formData.selectedBusinessData,
        campaignType: formData.campaignType,
        targetTags: formData.targetTags,
        targetAudience: targetAudienceText, // Smart fallback for AI context
        campaignGoal: formData.campaignGoal,
        tone: formData.tone,
        keyMessages: formData.keyMessages,
        customPrompt: formData.customPrompt,
        aiProvider: formData.aiProvider
      };

      console.log('🤖 Generating AI campaign with:', aiRequest);

      const response = await axios.post(API_ENDPOINTS.AI.GENERATE_CAMPAIGN, aiRequest, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const generated = response.data.campaign;
        setGeneratedCampaign(generated);
        setFormData(prev => ({
          ...prev,
          generatedContent: generated
        }));
        handleNext(); // Move to preview step
      } else {
        setError(response.data.message || 'Failed to generate campaign');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      setError(error.response?.data?.message || 'Failed to generate AI campaign content');
    } finally {
      setLoading(false);
    }
  };

  const saveCampaign = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Smart targetAudience handling - fallback for campaigns without tags
      const targetAudienceText = formData.targetTags.length > 0 
        ? formData.targetTags.join(', ')
        : 'General audience for ' + formData.businessType;
      
      // Use the AI generated campaign data
      const campaignData = {
        name: generatedCampaign?.name || formData.campaignName || 'AI Generated Campaign',
        message: generatedCampaign?.content || formData.customPrompt,
        content: generatedCampaign?.content || formData.customPrompt,
        description: formData.campaignGoal,
        type: formData.campaignType,
        targetTags: formData.targetTags, // 🏷️ Save selected tags (may be empty array)
        targetAudience: targetAudienceText, // Smart fallback for display/context
        businessContext: formData.businessType,
        tone: formData.tone,
        keyMessages: formData.keyMessages,
        aiProvider: formData.aiProvider,
        aiPrompt: formData.customPrompt || `AI Campaign for ${formData.businessName} - ${formData.campaignType}`,
        isAiGenerated: true,
        generatedContent: {
          text: generatedCampaign?.content || formData.customPrompt,
          html: generatedCampaign?.content || formData.customPrompt,
          jsonStructure: generatedCampaign
        },
        status: 'draft'
      };

      console.log('💾 Saving campaign:', campaignData);

      const response = await axios.post(API_ENDPOINTS.CAMPAIGNS.CREATE, campaignData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        console.log('✅ Campaign saved successfully:', response.data.campaign);
        onSuccess && onSuccess();
        onClose();
      } else {
        setError(response.data.message || 'Failed to save campaign');
      }
    } catch (error) {
      console.error('Save campaign error:', error);
      setError(error.response?.data?.message || 'Failed to save campaign');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      label: 'Business Context',
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Business Name"
              value={formData.businessName}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Business Type</InputLabel>
              <Select
                value={formData.businessType}
                onChange={(e) => handleInputChange('businessType', e.target.value)}
              >
                {businessTypes.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Use Business Data (Optional)</InputLabel>
              <Select
                value={formData.selectedBusinessData}
                onChange={(e) => handleInputChange('selectedBusinessData', e.target.value)}
              >
                <MenuItem value="">None</MenuItem>
                {businessData.map(data => (
                  <MenuItem key={data._id} value={data._id}>
                    {data.businessName} - {data.dataType}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      )
    },
    {
      label: 'Campaign Details',
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Campaign Name"
              value={formData.campaignName}
              onChange={(e) => handleInputChange('campaignName', e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Campaign Type</InputLabel>
              <Select
                value={formData.campaignType}
                onChange={(e) => handleInputChange('campaignType', e.target.value)}
              >
                {campaignTypes.map(type => (
                  <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Target Tags (Optional)</InputLabel>
              <Select
                multiple
                value={formData.targetTags}
                onChange={(e) => handleInputChange('targetTags', e.target.value)}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((tag) => (
                      <Chip 
                        key={tag} 
                        label={`${tag} (${contactStats[tag] || 0})`} 
                        size="small"
                        color="primary"
                      />
                    ))}
                  </Box>
                )}
              >
                {availableTags.length > 0 ? (
                  availableTags.map((tag) => (
                    <MenuItem key={tag} value={tag}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span>{tag}</span>
                        <Chip 
                          label={`${contactStats[tag] || 0} contacts`} 
                          size="small" 
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>
                    <em>No tags found. Campaign will send to all contacts.</em>
                  </MenuItem>
                )}
              </Select>
              {formData.targetTags.length > 0 ? (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  ✅ Will send to {formData.targetTags.reduce((sum, tag) => sum + (contactStats[tag] || 0), 0)} contacts
                </Typography>
              ) : (
                <Typography variant="caption" color="warning.main" sx={{ mt: 1 }}>
                  ⚠️ No tags selected - campaign will send to ALL contacts
                </Typography>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Campaign Goal"
              value={formData.campaignGoal}
              onChange={(e) => handleInputChange('campaignGoal', e.target.value)}
              placeholder="What do you want to achieve with this campaign?"
              required
            />
          </Grid>
        </Grid>
      )
    },
    {
      label: 'AI Configuration',
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>AI Provider</InputLabel>
              <Select
                value={formData.aiProvider}
                onChange={(e) => handleInputChange('aiProvider', e.target.value)}
              >
                {aiProviders.map(provider => (
                  <MenuItem key={provider.value} value={provider.value}>{provider.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Tone</InputLabel>
              <Select
                value={formData.tone}
                onChange={(e) => handleInputChange('tone', e.target.value)}
              >
                {toneOptions.map(tone => (
                  <MenuItem key={tone.value} value={tone.value}>{tone.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Custom Prompt (Optional)"
              value={formData.customPrompt}
              onChange={(e) => handleInputChange('customPrompt', e.target.value)}
              placeholder="Add specific instructions for the AI..."
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Key Messages</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Add key message"
                value={newKeyMessage}
                onChange={(e) => setNewKeyMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addKeyMessage()}
              />
              <Button onClick={addKeyMessage} startIcon={<AddIcon />}>Add</Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.keyMessages.map((message, index) => (
                <Chip
                  key={index}
                  label={message}
                  onDelete={() => removeKeyMessage(index)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Media Files (Optional)</Typography>
            <MediaUpload
              onFilesUploaded={(files) => handleInputChange('mediaFiles', files)}
              maxFiles={3}
              acceptedTypes={['image/*', 'application/pdf']}
              disabled={loading}
            />
            {formData.mediaFiles.length > 0 && (
              <Alert severity="info" sx={{ mt: 1 }}>
                {formData.mediaFiles.length} file(s) will be included in your AI-generated campaign.
              </Alert>
            )}
          </Grid>
        </Grid>
      )
    },
    {
      label: 'AI Generation',
      content: (
        <Box>
          {!generatedCampaign ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <AIIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Ready to Generate AI Campaign
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  Click the button below to generate your WhatsApp marketing campaign using AI
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  onClick={generateAICampaign}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <AIIcon />}
                >
                  {loading ? 'Generating...' : 'Generate AI Campaign'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Box>
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="h6">🎉 AI Campaign Generated Successfully!</Typography>
                Your campaign content has been created and is ready for review.
              </Alert>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Generated Campaign Content:</Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Campaign Name:</strong> {generatedCampaign.name || formData.campaignName}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Description:</strong> {generatedCampaign.description}
                </Typography>
                {generatedCampaign.content && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      <strong>Message Content:</strong>
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                        {generatedCampaign.content}
                      </Typography>
                    </Paper>
                  </Box>
                )}
                {generatedCampaign.suggestions && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      <strong>AI Suggestions:</strong>
                    </Typography>
                    <List dense>
                      {generatedCampaign.suggestions.map((suggestion, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <CheckIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText primary={suggestion} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Paper>
            </Box>
          )}
        </Box>
      )
    }
  ];

  const isStepValid = (step) => {
    switch (step) {
      case 0:
        return formData.businessName && formData.businessType;
      case 1:
        // Tags are now OPTIONAL - users can create campaigns without them
        return formData.campaignName && formData.campaignGoal;
      case 2:
        return true; // AI configuration is optional
      case 3:
        return generatedCampaign !== null;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AIIcon color="primary" />
          <Typography variant="h6">AI Campaign Creator</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={index}>
              <StepLabel>
                <Typography variant="subtitle1">{step.label}</Typography>
              </StepLabel>
              <StepContent>
                <Box sx={{ py: 2 }}>
                  {step.content}
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    onClick={index === steps.length - 1 ? saveCampaign : handleNext}
                    disabled={!isStepValid(index) || loading}
                    sx={{ mr: 1 }}
                  >
                    {index === steps.length - 1 ? 'Save Campaign' : 'Continue'}
                  </Button>
                  {index > 0 && (
                    <Button onClick={handleBack} disabled={loading}>
                      Back
                    </Button>
                  )}
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AICampaignCreator;