import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Preview as PreviewIcon,
  Campaign as CampaignIcon,
  AutoAwesome as AIIcon,
  AutoAwesome,
  Visibility as ViewIcon,
  WhatsApp as WhatsAppIcon,
  BarChart as AnalyticsIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import CampaignPreview from '../components/CampaignPreview';
import MediaUpload from '../components/MediaUpload';
import CampaignProgressTracker from '../components/CampaignProgressTracker';
import CampaignAnalyticsCard from '../components/CampaignAnalyticsCard';

export default function Campaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentCampaign, setCurrentCampaign] = useState(null);
  
  // AI Generation states
  const [openAIDialog, setOpenAIDialog] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [openPreview, setOpenPreview] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  
  // 🚀 PROGRESS TRACKER STATE
  const [showProgress, setShowProgress] = useState(false);
  const [progressData, setProgressData] = useState(null);
  
  // 📱 WHATSAPP CONNECTION STATE
  const [whatsappStatus, setWhatsappStatus] = useState('disconnected');
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null); // QR code image data
  const [qrLoading, setQrLoading] = useState(false); // QR code loading state
  
  // 📊 ANALYTICS STATE - NEW ENHANCEMENT
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsCampaign, setAnalyticsCampaign] = useState(null);
  
  // 👤 USER PROFILE STATE - NEW FOR MULTI-TENANCY
  const [userProfile, setUserProfile] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'promotional',
    targetAudienceString: '', // For the form input
    aiPrompt: '',  // This is required by backend
    businessContext: '',
    tone: 'professional',
    keyMessages: [],
    mediaFiles: [] // Add media files support
  });

  // AI Generation form data
  const [aiFormData, setAiFormData] = useState({
    businessName: '',
    campaignType: 'promotional',
    prompt: '',
    tone: 'professional',
    targetAudience: '',
    aiProvider: 'groq'
  });

  const campaignTypes = ['promotional', 'informational', 'seasonal', 'event', 'follow-up'];
  const toneOptions = ['professional', 'casual', 'friendly', 'urgent', 'educational'];

  useEffect(() => {
    fetchCampaigns();
    checkWhatsAppStatus(); // Check WhatsApp connection on page load
    fetchUserProfile(); // Fetch user profile for business name
  }, []);

  const checkWhatsAppStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.WHATSAPP.STATUS, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('📱 WhatsApp Status:', response.data);
      setWhatsappStatus(response.data.status || 'disconnected');
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
      setWhatsappStatus('disconnected');
    }
  };

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.PROFILE.GET, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success && response.data.profile) {
        setUserProfile(response.data.profile);
        console.log('👤 User Profile:', response.data.profile);
        
        // Pre-populate AI form with business data if available
        if (response.data.profile.businessProfile?.businessName) {
          setAiFormData(prev => ({
            ...prev,
            businessName: response.data.profile.businessProfile.businessName
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchQRCode = async () => {
    try {
      setQrLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.WHATSAPP.QR, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('📱 QR Code Response:', response.data);
      
      if (response.data.qrCode) {
        setQrCodeData(response.data.qrCode);
        console.log('✅ QR Code received and set');
      } else {
        console.log('⏳ QR Code not ready yet, status:', response.data.status);
      }
      
      // Update status as well
      if (response.data.status) {
        setWhatsappStatus(response.data.status);
      }
    } catch (error) {
      console.error('Error fetching QR code:', error);
    } finally {
      setQrLoading(false);
    }
  };

  const handleWhatsAppInit = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(API_ENDPOINTS.WHATSAPP.INIT, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSuccess('🎉 WhatsApp initialization started! Generating QR code...');
        setShowWhatsAppDialog(true);
        setQrCodeData(null); // Reset QR code
        
        // Start fetching QR code immediately
        setTimeout(() => fetchQRCode(), 1000);
        
        // Poll for QR code and status updates
        const pollInterval = setInterval(async () => {
          await fetchQRCode();
          await checkWhatsAppStatus();
          
          // Stop polling if connected
          if (whatsappStatus === 'ready') {
            clearInterval(pollInterval);
            setShowWhatsAppDialog(false);
            setSuccess('✅ WhatsApp connected successfully! You can now send campaigns.');
            setQrCodeData(null); // Clear QR code on success
          }
        }, 3000); // Poll every 3 seconds
        
        // Clear interval after 2 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          if (whatsappStatus !== 'ready') {
            setError('⏱️ QR code expired. Please try connecting again.');
            setShowWhatsAppDialog(false);
          }
        }, 120000);
      } else {
        setError('Failed to initialize WhatsApp: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      setError('Failed to initialize WhatsApp: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.CAMPAIGNS.LIST, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCampaigns(response.data.campaigns || []);
    } catch (error) {
      setError('Failed to fetch campaigns');
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  // AI Campaign Generation Functions
  const handleAIGenerate = async () => {
    try {
      setAiGenerating(true);
      setActiveStep(1); // Step 1: AI Generation
      setError(''); // Clear any previous errors
      
      const token = localStorage.getItem('token');

      console.log('🤖 Starting AI Campaign Generation...');
      console.log('📝 AI Form Data:', aiFormData);

      // Step 1: Generate campaign design
      const response = await axios.post(API_ENDPOINTS.AI.GENERATE_DESIGN, {
        prompt: aiFormData.prompt,
        businessName: aiFormData.businessName,
        campaignType: aiFormData.campaignType,
        tone: aiFormData.tone,
        targetAudience: { tags: [aiFormData.targetAudience] },
        aiProvider: aiFormData.aiProvider
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ AI Generation Response:', response.data);

      if (response.data.success) {
        // Step 2: Fetch available contacts for targeting
        console.log('📞 Fetching available contacts...');
        
        const contactsResponse = await axios.get(API_ENDPOINTS.CONTACTS.LIST, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 1000 } // Get all contacts for campaign targeting
        });

        const contactsData = contactsResponse.data;
        const availableContacts = contactsData.contacts || [];
        
        console.log('📞 Available contacts:', availableContacts.length);

        // Step 3: Enhance preview data with contacts and campaign structure
        const enhancedPreviewData = {
          // Core campaign data
          name: response.data.preview.design.campaign_title,
          description: 'AI Generated Campaign',
          type: aiFormData.campaignType,
          
          // Campaign content - get from first message in sequence
          content: response.data.preview.design.message_sequence && response.data.preview.design.message_sequence.length > 0
            ? response.data.preview.design.message_sequence.map(msg => msg.content).join('\n\n')
            : 'AI Generated Content',
          
          // AI-specific data
          isAIGenerated: true,
          design: response.data.preview.design,
          preview: response.data.preview,
          
          // Target audience data
          targetAudience: {
            tags: [aiFormData.targetAudience],
            totalCount: availableContacts.length
          },
          
          // 🎯 FIX: Add targetContacts for CampaignPreview component
          targetContacts: availableContacts.slice(0, 10), // Show first 10 contacts in preview
          
          // Additional metadata
          aiFormData: aiFormData, // Store for approval process
          generatedAt: new Date().toISOString()
        };

        console.log('🎯 Enhanced Preview Data:', enhancedPreviewData);

        // Step 4: Progress to preview step and show preview
        setPreviewData(enhancedPreviewData);
        setActiveStep(2); // Step 2: Preview & Approve
        setOpenAIDialog(false); // Close AI dialog
        setOpenPreview(true); // Open preview dialog
        
        setSuccess(`✅ AI Campaign Generated! Found ${availableContacts.length} contacts for targeting.`);
      } else {
        setError('Failed to generate campaign design: ' + (response.data.message || 'Unknown error'));
        setActiveStep(0); // Reset to step 0
      }
    } catch (error) {
      console.error('❌ AI Generation Error:', error);
      setError('AI generation failed: ' + (error.response?.data?.details || error.message));
      setActiveStep(0); // Reset to step 0
    } finally {
      setAiGenerating(false);
    }
  };

  const handleApproveCampaign = async (campaignName, previewData) => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      
      console.log('✅ Approving Campaign:', campaignName);
      console.log('📊 Preview Data:', previewData);
      
      // Get contacts for targeting
      const contactsResponse = await axios.get(API_ENDPOINTS.CONTACTS.LIST, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 1000 }
      });
      
      const availableContacts = contactsResponse.data?.contacts || [];
      
      // Prepare campaign approval data
      const approvalData = {
        name: campaignName,
        designData: previewData.design,
        targetAudience: {
          contacts: availableContacts.map(contact => ({
            id: contact._id,
            name: contact.name,
            phone: contact.phone
          })),
          groups: [],
          tags: previewData.aiFormData ? [previewData.aiFormData.targetAudience] : [],
          totalCount: availableContacts.length
        }
      };
      
      console.log('📤 Sending approval data:', approvalData);
      
      const response = await axios.post(API_ENDPOINTS.AI.APPROVE_CAMPAIGN, approvalData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSuccess(`🎉 Campaign "${campaignName}" approved and saved successfully! Found ${availableContacts.length} contacts for targeting.`);
        setOpenPreview(false);
        setPreviewData(null);
        setActiveStep(0);
        
        // Reset AI form
        resetAIForm();
        
        // Refresh campaigns list to show the new approved campaign
        fetchCampaigns();
      } else {
        setError('Failed to approve campaign: ' + (response.data.message || 'Unknown error'));
      }
      
    } catch (error) {
      console.error('❌ Campaign Approval Error:', error);
      setError('Failed to approve campaign: ' + (error.response?.data?.details || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEditPreview = (previewData) => {
    try {
      console.log('✏️ Editing Preview Campaign:', previewData);
      
      // Close preview and open edit dialog with generated content
      setOpenPreview(false);
      
      // Extract content from AI-generated campaign
      const content = previewData.content || 
                     (previewData.design?.message_sequence && previewData.design.message_sequence.length > 0
                       ? previewData.design.message_sequence.map(msg => msg.content).join('\n\n')
                       : '');
      
      // Populate form with AI-generated data
      setFormData({
        name: previewData.name || previewData.design?.campaign_title || 'AI Generated Campaign',
        description: 'AI Generated Campaign - Click to edit',
        type: previewData.type || previewData.aiFormData?.campaignType || 'promotional',
        targetAudienceString: previewData.aiFormData?.targetAudience || '',
        aiPrompt: content, // The actual campaign content goes here
        businessContext: previewData.aiFormData?.businessName || '',
        tone: previewData.aiFormData?.tone || 'professional',
        keyMessages: [],
        mediaFiles: []
      });
      
      setCurrentCampaign(null); // This is a new campaign
      setOpenDialog(true); // Open the manual edit dialog
      
    } catch (error) {
      console.error('❌ Error editing preview:', error);
      setError('Failed to edit campaign preview');
    }
  };

  const resetAIForm = () => {
    setAiFormData({
      businessName: '',
      campaignType: 'promotional',
      prompt: '',
      tone: 'professional',
      targetAudience: '',
      aiProvider: 'groq'
    });
    setActiveStep(0);
    setPreviewData(null);
  };

  const handleSendCampaign = async (campaign) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // First, get all contacts
      const contactsResponse = await axios.get(API_ENDPOINTS.CONTACTS.LIST, {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          limit: 1000 // Request up to 1000 contacts for campaign sending
        }
      });

      // Extract contacts array from response object
      const contactsData = contactsResponse.data;
      let contacts = contactsData.contacts || [];
      
      if (!contacts || contacts.length === 0) {
        setError('No contacts available to send campaign to. Please add contacts first.');
        return;
      }

      // 🏷️ FILTER BY TAGS if campaign has targetTags
      if (campaign.targetTags && Array.isArray(campaign.targetTags) && campaign.targetTags.length > 0) {
        const beforeFilterCount = contacts.length;
        contacts = contacts.filter(contact => {
          // Check if contact has any of the target tags
          if (!contact.tags || !Array.isArray(contact.tags)) {
            return false;
          }
          return contact.tags.some(tag => campaign.targetTags.includes(tag));
        });
        
        console.log(`🏷️ Tag Filtering: ${beforeFilterCount} total → ${contacts.length} matching tags:`, campaign.targetTags);
        
        if (contacts.length === 0) {
          setError(`No contacts found with tags: ${campaign.targetTags.join(', ')}. Please check your contact tags.`);
          setLoading(false);
          return;
        }
      }

      // Prepare the message content from the campaign
      // Use user's business name instead of hardcoded value
      const businessName = userProfile?.businessProfile?.businessName || userProfile?.name || 'Your Business';
      let message = `Hello from ${businessName}!`; // Dynamic business name
      
      // Priority 1: Use AI-generated content if available
      if (campaign.generatedContent && campaign.generatedContent.text && campaign.generatedContent.text.trim()) {
        message = campaign.generatedContent.text;
      }
      // Priority 2: Use campaign content (manual campaigns)
      else if (campaign.content && campaign.content.trim() && campaign.content !== campaign.name) {
        message = campaign.content;
      }
      // Priority 3: Use campaign message field if available
      else if (campaign.message && campaign.message.trim() && campaign.message !== campaign.name) {
        message = campaign.message;
      }
      // Priority 4: Use campaign description (if it's actually the message content)
      else if (campaign.description && campaign.description.trim() && campaign.description !== campaign.name) {
        message = campaign.description;
      }
      // Priority 5: Use design message if available
      else if (campaign.design && campaign.design.message_sequence && campaign.design.message_sequence.length > 0) {
        const designMessage = campaign.design.message_sequence[0].content;
        if (designMessage && designMessage.trim()) {
          message = designMessage;
        }
      }
      // Priority 6: Fallback to aiPrompt (this should NOT be the message content)
      else if (campaign.aiPrompt && campaign.aiPrompt.trim() && campaign.aiPrompt !== campaign.name) {
        console.warn('⚠️ Using aiPrompt as message content - this may not be the intended behavior');
        message = campaign.aiPrompt;
      }

      // Debug: Log what message we're sending
      console.log('=== CAMPAIGN SEND DEBUG ===');
      console.log('Campaign Name:', campaign.name);
      console.log('Campaign aiPrompt:', campaign.aiPrompt);
      console.log('Campaign description:', campaign.description);
      console.log('Campaign design:', campaign.design);
      console.log('FINAL MESSAGE TO SEND:', message);
      console.log('Message length:', message.length);
      console.log('===========================');

      // Extract phone numbers from contacts
      const recipients = contacts
        .filter(contact => contact.phone)
        .map(contact => contact.phone);

      if (recipients.length === 0) {
        setError('No valid phone numbers found in contacts.');
        return;
      }

      // Send the campaign
      const sendResponse = await axios.post(API_ENDPOINTS.WHATSAPP.SEND_CAMPAIGN, {
        campaignId: campaign._id,
        recipients: recipients,
        message: message
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Send response:', sendResponse.data);
      
      // 🚀 ENHANCED PROGRESS TRACKER LOGIC
      console.log('🔍 Progress Tracker Debug (Campaigns.js):');
      console.log('   success:', sendResponse.data.success);
      console.log('   campaignId:', sendResponse.data.campaignId);
      console.log('   initialProgress:', sendResponse.data.initialProgress);

      if (sendResponse.data.success) {
        console.log('✅ Campaign sent successfully - Showing progress tracker...');
        setProgressData({
          campaignId: sendResponse.data.campaignId || campaign._id,
          initialProgress: sendResponse.data.initialProgress,
          campaignName: campaign.name,
          totalRecipients: recipients.length
        });
        setShowProgress(true);
        setSuccess(`Campaign "${campaign.name}" started! 🚀 Sending to ${recipients.length} recipients${sendResponse.data.batching ? ` in ${sendResponse.data.batching.totalBatches} batches` : ''}`);
      } else {
        console.log('❌ Campaign send failed - Showing progress tracker with error status...');
        
        // 🎯 ALWAYS SHOW PROGRESS TRACKER FOR DEBUGGING
        setProgressData({
          campaignId: sendResponse.data.campaignId || campaign._id || `failed_${Date.now()}`,
          initialProgress: sendResponse.data.initialProgress || {
            sent: 0,
            failed: recipients.length,
            total: recipients.length,
            completed: true,
            error: 'Campaign send failed'
          },
          campaignName: campaign.name,
          totalRecipients: recipients.length,
          hasError: true,
          errorMessage: sendResponse.data.message || 'Campaign sending failed'
        });
        setShowProgress(true);
        
        // Show specific error for WhatsApp not connected
        if (sendResponse.data.message && sendResponse.data.message.includes('WhatsApp client not initialized')) {
          setError('⚠️ WhatsApp is not connected. Please initialize WhatsApp connection first, then try sending the campaign.');
        } else {
          setError(`Campaign send failed: ${sendResponse.data.message || 'Unknown error'}`);
        }
      }

    } catch (error) {
      console.error('Send campaign error:', error);
      
      // 🎯 SHOW PROGRESS TRACKER EVEN FOR API ERRORS
      console.log('💥 API Error - Showing progress tracker with error status...');
      setProgressData({
        campaignId: campaign._id || `error_${Date.now()}`,
        initialProgress: {
          sent: 0,
          failed: recipients.length,
          total: recipients.length,
          completed: true,
          error: 'API Error'
        },
        campaignName: campaign.name,
        totalRecipients: recipients.length,
        hasError: true,
        errorMessage: error.response?.data?.message || error.message
      });
      setShowProgress(true);
      
      // Provide specific error messages
      const errorMessage = error.response?.data?.message || error.message;
      if (errorMessage.includes('WhatsApp client not initialized')) {
        setError('❌ WhatsApp Connection Required: Please connect to WhatsApp first using the QR code, then try sending your campaign.');
      } else {
        setError('Failed to send campaign: ' + errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // 🚀 PROGRESS TRACKER HANDLERS
  const handleCloseProgress = () => {
    setShowProgress(false);
    setProgressData(null);
  };

  const handleRetryFailed = async (failedMessages) => {
    try {
      const token = localStorage.getItem('token');
      const recipients = failedMessages.map(msg => msg.phone);
      
      // Use user's business name for retry message
      const businessName = userProfile?.businessProfile?.businessName || userProfile?.name || 'Your Business';
      
      const retryResponse = await axios.post(API_ENDPOINTS.WHATSAPP.SEND_CAMPAIGN, {
        recipients: recipients,
        message: `Retry message from ${businessName}`,
        campaignId: progressData.campaignId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (retryResponse.data.success) {
        setSuccess(`Retrying ${recipients.length} failed messages...`);
      }
    } catch (error) {
      setError('Failed to retry messages: ' + error.message);
    }
  };

  // Navigate to the new CampaignCreate page for manual campaign creation
  const handleManualCreateCampaign = () => {
    navigate('/campaigns/create');
  };

  const handleCreateCampaign = () => {
    setCurrentCampaign(null);
    setFormData({
      name: '',
      description: '',
      type: 'promotional',
      targetAudienceString: '',
      aiPrompt: '',
      businessContext: '',
      tone: 'professional',
      keyMessages: [],
      mediaFiles: [] // Ensure mediaFiles is always initialized
    });
    setOpenDialog(true);
  };

  const handleEditCampaign = (campaign) => {
    setCurrentCampaign(campaign);
    setFormData({
      name: campaign.name || '',
      description: campaign.description || '',
      type: campaign.type || 'promotional',
      targetAudienceString: campaign.targetAudience?.tags?.join(', ') || '',
      aiPrompt: campaign.aiPrompt || '',
      businessContext: campaign.businessContext || '',
      tone: campaign.tone || 'professional',
      keyMessages: campaign.keyMessages || []
    });
    setOpenDialog(true);
  };

  const handleDeleteCampaign = async (campaignId) => {
    console.log('🗑️ handleDeleteCampaign called with ID:', campaignId);
    
    if (!window.confirm('Are you sure you want to delete this campaign?')) {
      console.log('❌ User cancelled deletion');
      return;
    }
    
    try {
      console.log('🔄 Attempting to delete campaign...');
      const token = localStorage.getItem('token');
      console.log('🔐 Token available:', !!token);
      
      const deleteUrl = API_ENDPOINTS.CAMPAIGNS.DELETE(campaignId);
      console.log('📡 DELETE URL:', deleteUrl);
      
      const response = await axios.delete(deleteUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Delete response:', response.status, response.data);
      setSuccess('Campaign deleted successfully');
      fetchCampaigns();
    } catch (error) {
      console.error('❌ Delete error:', error);
      console.error('❌ Error response:', error.response?.data);
      setError('Failed to delete campaign');
    }
  };

  const handleSaveCampaign = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // ✅ FIX 1: Validate aiPrompt has minimum 10 characters (backend requirement)
      if (!formData.aiPrompt || formData.aiPrompt.trim().length < 10) {
        setError('AI Prompt is required and must be at least 10 characters long');
        return;
      }
      
      // ✅ FIX 2: Validate required fields
      if (!formData.name || formData.name.trim().length === 0) {
        setError('Campaign name is required');
        return;
      }
      
      // ✅ FIX 3: Process mediaFiles correctly for backend compatibility
      const processedMediaFiles = (formData.mediaFiles || []).map(mediaFile => {
        // Ensure backend gets the correct structure
        return {
          id: mediaFile.id || Date.now() + '_' + Math.random().toString(36),
          name: mediaFile.name,
          type: mediaFile.type,
          size: mediaFile.size,
          preview: mediaFile.preview,
          status: mediaFile.status || 'ready',
          file: mediaFile.file || mediaFile.path  // Backend expects 'file' property
        };
      });
      
      // Transform formData to match backend schema
      const campaignData = {
        ...formData,
        targetAudience: {
          contacts: [],
          groups: [],
          tags: formData.targetAudienceString ? [formData.targetAudienceString] : [],
          totalCount: 0
        },
        mediaFiles: processedMediaFiles
      };
      delete campaignData.targetAudienceString;
      
      console.log('📤 Sending campaign data:', JSON.stringify(campaignData, null, 2));
      
      let response;
      if (currentCampaign) {
        // Update existing campaign
        response = await axios.put(API_ENDPOINTS.CAMPAIGNS.UPDATE(currentCampaign._id), campaignData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Create new campaign
        response = await axios.post(API_ENDPOINTS.CAMPAIGNS.CREATE, campaignData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      // ✅ FIX 4: Properly check for successful response
      if (response.data.success || response.data.campaign) {
        setSuccess(currentCampaign ? 'Campaign updated successfully' : 'Campaign created successfully');
        setError(''); // Clear any previous errors
        setOpenDialog(false);
        fetchCampaigns();
      } else {
        setError('Failed to save campaign: Invalid response from server');
      }
      
    } catch (error) {
      console.error('❌ Campaign save error:', error);
      console.error('❌ Response data:', error.response?.data);
      
      // ✅ FIX 5: Show detailed error messages from backend
      let errorMessage = 'Failed to save campaign';
      
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        // Show validation errors
        const validationErrors = error.response.data.errors.map(err => 
          `${err.field}: ${err.message}`
        ).join(', ');
        errorMessage = `Validation Error: ${validationErrors}`;
      } else if (error.response?.data?.message) {
        errorMessage = `Error: ${error.response.data.message}`;
      } else if (error.response?.status === 400) {
        errorMessage = 'Validation Error: Please check your campaign data and try again';
      } else {
        errorMessage = `Failed to save campaign: ${error.message}`;
      }
      
      setError(errorMessage);
      setSuccess(''); // Clear any previous success messages
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAICampaign = async (campaignId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const campaign = campaigns.find(c => c._id === campaignId);
      
      const aiRequest = {
        businessType: campaign.businessContext || 'General Business',
        targetAudience: campaign.targetAudience || 'General Audience',
        campaignGoal: campaign.description || 'Marketing Campaign',
        tone: campaign.tone || 'professional',
        keyMessages: campaign.keyMessages || []
      };

      const response = await axios.post(API_ENDPOINTS.AI.GENERATE_CAMPAIGN, aiRequest, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess('AI campaign content generated successfully!');
        fetchCampaigns(); // Refresh to show updated content
      }
    } catch (error) {
      setError('Failed to generate AI campaign content');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewCampaign = async (campaign) => {
    try {
      setLoading(true);
      
      // Create preview data from existing campaign
      const previewData = {
        design: {
          campaign_title: campaign.name,
          message_sequence: [{
            content: campaign.generatedContent?.text || 
                    campaign.content || 
                    campaign.message || 
                    campaign.aiPrompt || 
                    'No content available'
          }],
          visual_elements: campaign.design?.visual_elements || {
            theme: 'professional',
            colors: ['#1976d2', '#ffffff'],
            typography: 'modern'
          }
        },
        metrics: campaign.analytics || {
          estimated_reach: campaign.targetAudience?.totalCount || 0,
          engagement_score: 85,
          delivery_rate: 95
        }
      };
      
      setPreviewData(previewData);
      setOpenPreview(true);
    } catch (error) {
      setError('Failed to preview campaign');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'completed': return 'info';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
            <CampaignIcon sx={{ mr: 2 }} />
            Campaign Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant={whatsappStatus === 'ready' ? 'contained' : 'outlined'}
              startIcon={<WhatsAppIcon />}
              onClick={handleWhatsAppInit}
              size="large"
              color={whatsappStatus === 'ready' ? 'success' : 'warning'}
              sx={{ 
                borderColor: whatsappStatus === 'ready' ? '#25D366' : '#ff9800',
                color: whatsappStatus === 'ready' ? 'white' : '#ff9800',
                '&:hover': {
                  borderColor: whatsappStatus === 'ready' ? '#25D366' : '#ff9800',
                  background: whatsappStatus === 'ready' ? '#25D366' : 'rgba(255, 152, 0, 0.04)'
                }
              }}
            >
              {whatsappStatus === 'ready' ? 'WhatsApp Connected' : 'Connect WhatsApp'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<AIIcon />}
              onClick={() => setOpenAIDialog(true)}
              size="large"
              sx={{ 
                borderColor: '#5B4FB5',
                color: '#5B4FB5',
                '&:hover': {
                  borderColor: '#5B4FB5',
                  background: 'rgba(91, 79, 181, 0.04)'
                }
              }}
            >
              AI Generate Campaign
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleManualCreateCampaign}
              size="large"
            >
              Manual Create
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {loading && !openDialog ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {campaigns.map((campaign) => (
              <Grid item xs={12} md={6} lg={4} key={campaign._id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {campaign.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {campaign.description}
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Chip 
                        label={campaign.status || 'draft'} 
                        color={getStatusColor(campaign.status)}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Chip label={campaign.type} variant="outlined" size="small" sx={{ mr: 1 }} />
                      {/* 📅 SCHEDULING INDICATOR - NEW ENHANCEMENT */}
                      {campaign.scheduling && !campaign.scheduling.sendNow && campaign.scheduling.scheduledDate && (
                        <Chip 
                          icon={<span>📅</span>}
                          label={`Scheduled: ${new Date(campaign.scheduling.scheduledDate).toLocaleDateString()}`} 
                          color="warning"
                          variant="outlined"
                          size="small"
                        />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Target: {campaign.targetAudience?.totalCount 
                        ? `${campaign.targetAudience.totalCount} contacts`
                        : 'Not specified'}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Tooltip title="View Analytics">
                      <IconButton 
                        color="success"
                        onClick={() => {
                          console.log('📊 View Analytics clicked for campaign:', campaign);
                          setAnalyticsCampaign(campaign);
                          setShowAnalytics(true);
                        }}
                      >
                        <AnalyticsIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Campaign">
                      <IconButton onClick={() => handleEditCampaign(campaign)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Generate AI Content">
                      <IconButton onClick={() => handleGenerateAICampaign(campaign._id)}>
                        <AutoAwesome />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View Preview">
                      <IconButton 
                        color="info"
                        onClick={() => {
                          console.log('🎯 View Preview clicked for campaign:', campaign);
                          console.log('🔍 Campaign data:', JSON.stringify(campaign, null, 2));
                          
                          try {
                            // Handle both AI-generated and manual campaigns
                            if (campaign.generatedContent?.jsonStructure) {
                              // AI-generated campaign preview
                              console.log('📝 Using AI-generated content');
                              
                              // 🎯 Create preview data compatible with CampaignPreview component
                              const campaignPreviewData = {
                                name: campaign.name,
                                description: campaign.description,
                                type: campaign.type,
                                content: campaign.generatedContent.text || 'AI Generated Content',
                                aiPrompt: campaign.generatedContent.text || campaign.aiPrompt,
                                targetAudience: campaign.targetAudience,
                                mediaFiles: campaign.mediaFiles || [],
                                // Add AI-specific fields
                                isPreview: true,
                                isAIGenerated: true,
                                originalCampaign: campaign,
                                generatedContent: campaign.generatedContent
                              };
                              
                              console.log('🎯 Setting AI campaign preview data:', campaignPreviewData);
                              setPreviewData(campaignPreviewData);
                            } else {
                              // Manual campaign preview - create compatible structure
                              console.log('📝 Using manual campaign content');
                              
                              // 🎯 FIX: Use proper content priority - aiPrompt has the full campaign content!
                              const content = campaign.aiPrompt || // The full campaign content is here!
                                            campaign.content || 
                                            campaign.description || 
                                            'No content available';
                              
                              console.log('📝 Content to preview:', content.substring(0, 100) + '...');
                              console.log('📏 Full content length:', content.length);
                              
                              // 🎯 Create preview data compatible with CampaignPreview component
                              const campaignPreviewData = {
                                name: campaign.name,
                                description: campaign.description,
                                type: campaign.type,
                                content: content, // This is the full content to display
                                aiPrompt: content, // For compatibility
                                targetAudience: campaign.targetAudience,
                                mediaFiles: campaign.mediaFiles || [],
                                // Add preview-specific fields
                                isPreview: true,
                                originalCampaign: campaign
                              };
                              
                              console.log('🎯 Setting campaign preview data:', campaignPreviewData);
                              setPreviewData(campaignPreviewData);
                            }
                            console.log('✅ Opening preview dialog...');
                            setOpenPreview(true);
                          } catch (error) {
                            console.error('❌ Error in View Preview:', error);
                          }
                        }}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Send Campaign">
                      <IconButton 
                        color="primary"
                        onClick={() => handleSendCampaign(campaign)}
                      >
                        <SendIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Campaign">
                      <IconButton 
                        color="error" 
                        onClick={() => {
                          console.log('🗑️ Delete Campaign clicked for ID:', campaign._id);
                          console.log('🔍 Campaign to delete:', campaign);
                          handleDeleteCampaign(campaign._id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {campaigns.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CampaignIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No campaigns yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first marketing campaign to get started
            </Typography>
            <Button variant="contained" onClick={handleManualCreateCampaign}>
              Create First Campaign
            </Button>
          </Box>
        )}

        {/* Create/Edit Campaign Dialog */}

        {/* AI Campaign Generation Dialog */}
        <Dialog 
          open={openAIDialog} 
          onClose={() => setOpenAIDialog(false)} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #5B4FB5 0%, #7B6CB8 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center'
          }}>
            <AIIcon sx={{ mr: 1 }} />
            AI Campaign Generator
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 3 }}>
              <Step>
                <StepLabel>Campaign Details</StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {activeStep === 0 
                      ? "✍️ Fill in your business details and campaign goals below" 
                      : "✅ Campaign details completed"}
                  </Typography>
                </StepContent>
              </Step>
              <Step>
                <StepLabel>{aiGenerating ? 'AI Generating...' : 'AI Generation'}</StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {activeStep === 1 && aiGenerating 
                      ? "🤖 AI is creating your campaign design and finding contacts..." 
                      : activeStep > 1 
                        ? "✅ AI campaign generated successfully"
                        : "🤖 AI will create your campaign design"}
                  </Typography>
                </StepContent>
              </Step>
              <Step>
                <StepLabel>Preview & Approve</StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {activeStep === 2 
                      ? "👀 Review your campaign in the preview window, then approve to save" 
                      : "👀 Review and approve your generated campaign"}
                  </Typography>
                </StepContent>
              </Step>
            </Stepper>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Business Name"
                  value={aiFormData.businessName}
                  onChange={(e) => setAiFormData({ ...aiFormData, businessName: e.target.value })}
                  placeholder="Your Business Name"
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Campaign Type</InputLabel>
                  <Select
                    value={aiFormData.campaignType}
                    onChange={(e) => setAiFormData({ ...aiFormData, campaignType: e.target.value })}
                    label="Campaign Type"
                  >
                    <MenuItem value="promotional">Promotional</MenuItem>
                    <MenuItem value="announcement">Announcement</MenuItem>
                    <MenuItem value="seasonal">Seasonal</MenuItem>
                    <MenuItem value="reminder">Reminder</MenuItem>
                    <MenuItem value="event">Event</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Target Audience"
                  value={aiFormData.targetAudience}
                  onChange={(e) => setAiFormData({ ...aiFormData, targetAudience: e.target.value })}
                  placeholder="e.g., Existing customers, New prospects"
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Tone</InputLabel>
                  <Select
                    value={aiFormData.tone}
                    onChange={(e) => setAiFormData({ ...aiFormData, tone: e.target.value })}
                    label="Tone"
                  >
                    <MenuItem value="professional">Professional</MenuItem>
                    <MenuItem value="casual">Casual</MenuItem>
                    <MenuItem value="friendly">Friendly</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                    <MenuItem value="educational">Educational</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>AI Provider</InputLabel>
                  <Select
                    value={aiFormData.aiProvider}
                    onChange={(e) => setAiFormData({ ...aiFormData, aiProvider: e.target.value })}
                    label="AI Provider"
                  >
                    <MenuItem value="groq">Groq (Fast & Free)</MenuItem>
                    <MenuItem value="openai">OpenAI (Requires API Key)</MenuItem>
                    <MenuItem value="gemini">Google Gemini (Requires API Key)</MenuItem>
                    <MenuItem value="claude">Claude (Requires API Key)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Campaign Description"
                  value={aiFormData.prompt}
                  onChange={(e) => setAiFormData({ ...aiFormData, prompt: e.target.value })}
                  placeholder="Describe what you want your campaign to achieve. Include details about your products/services, special offers, call-to-actions, etc."
                  multiline
                  rows={4}
                  helperText="Be specific! The more detail you provide, the better your AI-generated campaign will be."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setOpenAIDialog(false);
                resetAIForm();
              }}
              disabled={aiGenerating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAIGenerate} 
              variant="contained"
              disabled={aiGenerating || !aiFormData.businessName || !aiFormData.prompt}
              startIcon={aiGenerating ? <CircularProgress size={20} /> : <AIIcon />}
              sx={{ 
                background: 'linear-gradient(135deg, #5B4FB5 0%, #7B6CB8 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4A3FA0 0%, #6A5BA3 100%)'
                }
              }}
            >
              {aiGenerating ? 'Generating...' : 'Generate Campaign'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* WhatsApp Connection Dialog - ENHANCED WITH QR CODE DISPLAY */}
        <Dialog 
          open={showWhatsAppDialog} 
          onClose={() => setShowWhatsAppDialog(false)} 
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center'
          }}>
            <WhatsAppIcon sx={{ mr: 1 }} />
            Connect WhatsApp
          </DialogTitle>
          <DialogContent sx={{ pt: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              {whatsappStatus === 'ready' ? '✅ Connected!' : '🔗 Connecting to WhatsApp Web...'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {whatsappStatus === 'ready' 
                ? 'Your WhatsApp is now connected and ready to send campaigns!'
                : 'Please scan the QR code with your WhatsApp mobile app to connect.'}
            </Typography>
            
            {/* QR CODE DISPLAY BOX */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              minHeight: '300px',
              border: qrCodeData ? '2px solid #25D366' : '2px dashed #25D366',
              borderRadius: 2,
              mb: 2,
              p: 2,
              backgroundColor: qrCodeData ? '#ffffff' : 'transparent'
            }}>
              {qrLoading ? (
                <Box sx={{ textAlign: 'center' }}>
                  <CircularProgress sx={{ color: '#25D366', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Generating QR Code...
                  </Typography>
                </Box>
              ) : qrCodeData ? (
                <Box sx={{ textAlign: 'center' }}>
                  <img 
                    src={qrCodeData} 
                    alt="WhatsApp QR Code" 
                    style={{ 
                      maxWidth: '100%', 
                      height: 'auto',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      padding: '10px',
                      backgroundColor: '#ffffff'
                    }} 
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    📱 Open WhatsApp on your phone → Settings → Linked Devices → Scan QR Code
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center' }}>
                  <WhatsAppIcon sx={{ fontSize: 64, color: '#25D366', mb: 2, opacity: 0.3 }} />
                  <Typography variant="body2" color="text.secondary">
                    {whatsappStatus === 'ready' 
                      ? '✅ Already Connected!' 
                      : '⏳ Waiting for QR code...'}
                  </Typography>
                </Box>
              )}
            </Box>
            
            {/* CONNECTION STATUS */}
            <Box sx={{ 
              p: 2, 
              backgroundColor: whatsappStatus === 'ready' ? '#d4edda' : '#fff3cd',
              borderRadius: 1,
              mb: 2
            }}>
              <Typography variant="body2" sx={{ 
                color: whatsappStatus === 'ready' ? '#155724' : '#856404',
                fontWeight: 'bold'
              }}>
                Status: {whatsappStatus === 'ready' ? '✅ Connected & Ready' : '🔄 Waiting for Connection...'}
              </Typography>
            </Box>

            {/* INSTRUCTIONS */}
            {!qrCodeData && whatsappStatus !== 'ready' && (
              <Alert severity="info" sx={{ textAlign: 'left' }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  How to connect:
                </Typography>
                <Typography variant="body2" component="div">
                  1. Open WhatsApp on your phone<br />
                  2. Tap Menu (⋮) or Settings<br />
                  3. Tap "Linked Devices"<br />
                  4. Tap "Link a Device"<br />
                  5. Scan the QR code above
                </Typography>
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setShowWhatsAppDialog(false);
                setQrCodeData(null); // Clear QR code when closing
              }}
            >
              Close
            </Button>
            {!qrCodeData && whatsappStatus !== 'ready' && (
              <Button 
                onClick={fetchQRCode} 
                variant="outlined"
                startIcon={qrLoading ? <CircularProgress size={16} /> : <WhatsAppIcon />}
                disabled={qrLoading}
              >
                {qrLoading ? 'Loading...' : 'Retry QR Code'}
              </Button>
            )}
            <Button 
              onClick={checkWhatsAppStatus} 
              variant="outlined"
              startIcon={<WhatsAppIcon />}
              color={whatsappStatus === 'ready' ? 'success' : 'primary'}
            >
              Check Status
            </Button>
          </DialogActions>
        </Dialog>

        {/* Campaign Preview Dialog */}
        <CampaignPreview
          open={openPreview}
          onClose={() => setOpenPreview(false)}
          campaign={previewData}
          onApprove={handleApproveCampaign}
          onEdit={handleEditPreview}
          loading={aiGenerating}
        />

        {/* Manual Campaign Creation Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {currentCampaign ? 'Edit Campaign' : 'Create New Campaign'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Campaign Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Campaign Type</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    {campaignTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Tone</InputLabel>
                  <Select
                    value={formData.tone}
                    onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                  >
                    {toneOptions.map((tone) => (
                      <MenuItem key={tone} value={tone}>
                        {tone.charAt(0).toUpperCase() + tone.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Target Audience"
                  value={formData.targetAudienceString}
                  onChange={(e) => setFormData({ ...formData, targetAudienceString: e.target.value })}
                  placeholder="e.g., Young professionals, Small business owners..."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="AI Prompt (Required)"
                  value={formData.aiPrompt}
                  onChange={(e) => setFormData({ ...formData, aiPrompt: e.target.value })}
                  placeholder="Describe what kind of campaign content you want AI to generate..."
                  multiline
                  rows={3}
                  required
                  error={Boolean(formData.aiPrompt && formData.aiPrompt.trim().length > 0 && formData.aiPrompt.trim().length < 10)}
                  helperText={
                    formData.aiPrompt && formData.aiPrompt.trim().length > 0 && formData.aiPrompt.trim().length < 10
                      ? `AI Prompt must be at least 10 characters (current: ${formData.aiPrompt.trim().length})`
                      : "This prompt will guide the AI in generating your campaign content (minimum 10 characters)"
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Business Context"
                  value={formData.businessContext}
                  onChange={(e) => setFormData({ ...formData, businessContext: e.target.value })}
                  placeholder="e.g., E-commerce, Technology, Healthcare..."
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Media Files (Optional)
                </Typography>
                <MediaUpload
                  onFilesUploaded={(files) => {
                    console.log('📎 Media files uploaded:', files);
                    setFormData({ ...formData, mediaFiles: files });
                  }}
                  maxFiles={3}
                  acceptedTypes={['image/*', 'application/pdf']}
                  disabled={loading}
                />
                {formData.mediaFiles && formData.mediaFiles.length > 0 && (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    {formData.mediaFiles.length} file(s) selected. These will be included in your campaign.
                    <br />
                    Files: {formData.mediaFiles.map(f => f.name).join(', ')}
                  </Alert>
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleSaveCampaign} 
              variant="contained"
              disabled={
                loading || 
                !formData.name || 
                !formData.aiPrompt || 
                formData.aiPrompt.trim().length < 10
              }
            >
              {loading ? <CircularProgress size={20} /> : (currentCampaign ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* 🚀 FLOATING CAMPAIGN PROGRESS TRACKER */}
        {showProgress && progressData && (
          <CampaignProgressTracker
            campaignData={progressData}
            onClose={handleCloseProgress}
            onRetryFailed={handleRetryFailed}
          />
        )}

        {/* 📊 CAMPAIGN ANALYTICS DIALOG - NEW ENHANCEMENT */}
        <Dialog 
          open={showAnalytics} 
          onClose={() => setShowAnalytics(false)} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center'
          }}>
            <AnalyticsIcon sx={{ mr: 1 }} />
            Campaign Analytics - {analyticsCampaign?.name}
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {analyticsCampaign && (
              <CampaignAnalyticsCard 
                campaign={analyticsCampaign}
                onRefresh={() => {
                  // Refresh campaigns list to get updated analytics
                  fetchCampaigns();
                }}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setShowAnalytics(false)}
              variant="outlined"
            >
              Close
            </Button>
            <Button 
              onClick={() => {
                fetchCampaigns();
              }}
              variant="contained"
              color="success"
              startIcon={<AnalyticsIcon />}
            >
              Refresh Data
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}