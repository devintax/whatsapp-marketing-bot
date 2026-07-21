const express = require('express');
const Campaign = require('../models/Campaign');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { publicMediaUrl, toLegacyUploadPath, uploadRoot } = require('../utils/mediaUrl');

// Configure multer for media file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(uploadRoot(), 'campaigns');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'), false);
    }
  }
});

const router = express.Router();

// Upload media files for campaigns
router.post('/upload-media', auth, upload.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const mediaFile = {
      id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
      preview: publicMediaUrl(`campaigns/${req.file.filename}`),
      legacyPreview: toLegacyUploadPath(`campaigns/${req.file.filename}`),
      status: 'ready',
      file: req.file.path
    };

    res.json({ 
      message: 'Media file uploaded successfully',
      mediaFile: mediaFile
    });
  } catch (error) {
    console.error('Media upload error:', error);
    res.status(500).json({ message: 'Failed to upload media file', error: error.message });
  }
});

// Get all campaigns for user
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { user: req.user.id };
    
    if (status) {
      query.status = status;
    }

    const campaigns = await Campaign.find(query)
      .populate('targetAudience.contacts', 'name phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Campaign.countDocuments(query);

    res.json({
      campaigns,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Test validation endpoint to debug campaign creation issues - NO AUTH FOR TESTING
router.post('/test-validation', [
  body('name').trim().isLength({ min: 1 }),
  body('aiPrompt').trim().isLength({ min: 10 }),
  body('mediaFiles').optional().isArray()
], async (req, res) => {
  console.log('🧪 TEST VALIDATION ENDPOINT - Request Body:', JSON.stringify(req.body, null, 2));
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Validation Errors:', errors.array());
    return res.status(400).json({ 
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
      received: req.body
    });
  }
  
  // Check individual field requirements
  const checks = {
    hasName: !!req.body.name && req.body.name.trim().length > 0,
    hasAiPrompt: !!req.body.aiPrompt && req.body.aiPrompt.trim().length >= 10,
    hasMediaFiles: Array.isArray(req.body.mediaFiles),
    mediaFilesCount: req.body.mediaFiles ? req.body.mediaFiles.length : 0,
    hasTargetAudience: !!req.body.targetAudience,
    targetAudienceStructure: req.body.targetAudience ? Object.keys(req.body.targetAudience) : []
  };
  
  console.log('✅ Field validation checks:', checks);
  
  return res.json({ 
    success: true, 
    message: 'Validation passed!',
    checks: checks,
    received: req.body 
  });
});

// Create new campaign - FIXED VALIDATION & DATA HANDLING
router.post('/', [
  auth,
  body('name').trim().isLength({ min: 1 }).withMessage('Campaign name is required'),
  body('aiPrompt').trim().isLength({ min: 10 }).withMessage('AI Prompt must be at least 10 characters'),
  // REMOVED: body('mediaFiles').optional().isArray().withMessage('Media files must be an array')
  // We'll handle mediaFiles validation in our custom parsing code since it can come as a string
], async (req, res) => {
  try {
    console.log('\n📝 ============ Campaign Creation Request ============');
    console.log('User ID:', req.user?.id);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Campaign name:', req.body.name);
    console.log('AI Prompt length:', req.body.aiPrompt?.length);
    console.log('Target audience:', req.body.targetAudience);
    console.log('Media files RAW data:', req.body.mediaFiles);
    console.log('Media files type:', typeof req.body.mediaFiles);
    console.log('Media files is array:', Array.isArray(req.body.mediaFiles));
    
    // Debug: Log the entire request body
    console.log('FULL REQUEST BODY:');
    console.log(JSON.stringify(req.body, null, 2));
    
    console.log('Raw req.body.mediaFiles:');
    console.log('Type:', typeof req.body.mediaFiles);
    console.log('Value:', req.body.mediaFiles);
    
    if (req.body.mediaFiles) {
      console.log('Length:', req.body.mediaFiles.length);
      console.log('Constructor:', req.body.mediaFiles.constructor.name);
    }
    
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    // Transform frontend data to match schema
    const campaignData = { ...req.body };
    
    // 🔧 FIX: Handle content field for manual campaigns
    if (campaignData.aiPrompt && !campaignData.content) {
      // Frontend sends content as aiPrompt, but we need it in content field for manual campaigns
      campaignData.content = campaignData.aiPrompt;
      console.log('✅ Mapped aiPrompt to content field:', campaignData.content.substring(0, 50) + '...');
    }
    
    // Fix targetAudience.contacts format if needed
    if (campaignData.targetAudience && campaignData.targetAudience.contacts) {
      console.log('🔧 Original targetAudience.contacts:', campaignData.targetAudience.contacts);
      
      // Ensure contacts are just ObjectId strings
      campaignData.targetAudience.contacts = campaignData.targetAudience.contacts.map(item => {
        if (typeof item === 'object' && item.contact) {
          return item.contact; // Extract ObjectId from {contact: "id", phone: "phone"}
        }
        return item; // Already in correct format
      });
      
      console.log('✅ Transformed targetAudience.contacts:', campaignData.targetAudience.contacts);
    }

    // 🔧 COMPREHENSIVE FIX: Handle all mediaFiles format issues
    console.log('🔧 DEBUGGING: Raw mediaFiles processing...');
    console.log('Original mediaFiles type:', typeof campaignData.mediaFiles);
    console.log('Original mediaFiles value:', campaignData.mediaFiles);
    console.log('Is array?', Array.isArray(campaignData.mediaFiles));
    
    if (campaignData.mediaFiles !== undefined && campaignData.mediaFiles !== null) {
      // Handle different possible formats of mediaFiles
      let processedMediaFiles = [];
      
      if (typeof campaignData.mediaFiles === 'string') {
        console.log('📝 MediaFiles received as STRING - attempting to parse...');
        try {
          const parsed = JSON.parse(campaignData.mediaFiles);
          if (Array.isArray(parsed)) {
            processedMediaFiles = parsed;
            console.log('✅ Successfully parsed stringified array');
          } else {
            console.log('⚠️ Parsed value is not an array:', parsed);
            processedMediaFiles = [];
          }
        } catch (error) {
          console.error('❌ Failed to parse mediaFiles string:', error.message);
          console.error('Raw string value:', campaignData.mediaFiles);
          processedMediaFiles = [];
        }
      } else if (Array.isArray(campaignData.mediaFiles)) {
        console.log('📝 MediaFiles received as ARRAY - processing directly...');
        processedMediaFiles = campaignData.mediaFiles;
      } else {
        console.log('⚠️ MediaFiles is neither string nor array, setting to empty array');
        console.log('Actual type:', typeof campaignData.mediaFiles);
        console.log('Actual value:', campaignData.mediaFiles);
        processedMediaFiles = [];
      }
      
      // Clean and validate each media file object
      campaignData.mediaFiles = processedMediaFiles.map((file, index) => {
        console.log(`🔧 Processing mediaFile ${index}:`, file);
        
        // Ensure file is an object
        if (typeof file !== 'object' || file === null) {
          console.log(`⚠️ MediaFile ${index} is not an object, skipping`);
          return null;
        }
        
        const cleanFile = {
          id: file.id || `generated_${Date.now()}_${index}`,
          name: file.name || 'unknown',
          type: file.type || 'application/octet-stream',
          size: typeof file.size === 'number' ? file.size : 0,
          preview: file.preview || '',
          status: file.status || 'ready',
          file: file.file || file.path || ''
        };
        
        console.log(`✅ Cleaned mediaFile ${index}:`, cleanFile);
        return cleanFile;
      }).filter(file => file !== null); // Remove any null entries
      
      console.log('✅ Final processed mediaFiles:', campaignData.mediaFiles);
      console.log('✅ Final mediaFiles count:', campaignData.mediaFiles.length);
    } else {
      console.log('📝 No mediaFiles provided, setting to empty array');
      campaignData.mediaFiles = [];
    }

    // 🔧 FIX: Map aiPrompt to content field for manual campaigns
    if (campaignData.aiPrompt && !campaignData.content) {
      campaignData.content = campaignData.aiPrompt;
      console.log('🔧 Mapped aiPrompt to content field for manual campaign');
      console.log('   Content preview:', campaignData.content.substring(0, 50) + '...');
    }

    // Create campaign
    console.log('🔧 ============ FINAL DATA BEFORE MONGOOSE SAVE ============');
    console.log('Campaign data type:', typeof campaignData);
    console.log('MediaFiles final type:', typeof campaignData.mediaFiles);
    console.log('MediaFiles final isArray:', Array.isArray(campaignData.mediaFiles));
    console.log('MediaFiles final value:', JSON.stringify(campaignData.mediaFiles, null, 2));
    console.log('Target Tags:', campaignData.targetTags); // 🏷️ Log target tags
    console.log('Full campaign data:', JSON.stringify(campaignData, null, 2));
    console.log('=========================================================');
    
    const campaign = new Campaign({
      ...campaignData,
      user: req.user.id,
      targetTags: campaignData.targetTags || [] // 🏷️ Ensure targetTags is saved
    });

    console.log('🔧 ============ CAMPAIGN OBJECT BEFORE SAVE ============');
    console.log('Campaign mediaFiles:', JSON.stringify(campaign.mediaFiles, null, 2));
    console.log('Campaign mediaFiles type:', typeof campaign.mediaFiles);
    console.log('Campaign mediaFiles isArray:', Array.isArray(campaign.mediaFiles));
    console.log('Campaign mediaFiles length:', campaign.mediaFiles?.length);
    if (campaign.mediaFiles && campaign.mediaFiles.length > 0) {
      console.log('First mediaFiles element type:', typeof campaign.mediaFiles[0]);
      console.log('First mediaFiles element value:', campaign.mediaFiles[0]);
      console.log('First mediaFiles element isObject:', typeof campaign.mediaFiles[0] === 'object');
    }
    
    // TEST: Create a minimal campaign with just required fields to isolate the mediaFiles issue
    console.log('🧪 TESTING: Creating minimal campaign object for debugging...');
    const testCampaign = {
      user: req.user.id,
      name: campaignData.name,
      aiPrompt: campaignData.aiPrompt,
      mediaFiles: campaignData.mediaFiles
    };
    console.log('Test campaign mediaFiles:', JSON.stringify(testCampaign.mediaFiles, null, 2));
    console.log('====================================================');

    await campaign.save();
    
    console.log('✅ Campaign created successfully:', campaign._id);
    console.log('===================================================\n');
    
    res.status(201).json({ 
      success: true, 
      campaign 
    });
    
  } catch (error) {
    console.error('\n🚨 ============ Campaign Creation Error ============');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      console.error('Validation Error Details:');
      Object.keys(error.errors).forEach(key => {
        console.error(`  Field: ${key}`);
        console.error(`  Error: ${error.errors[key].message}`);
        console.error(`  Value: ${error.errors[key].value}`);
      });
      
      return res.status(400).json({ 
        success: false,
        message: 'Validation Error', 
        errors: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message,
          value: error.errors[key].value
        }))
      });
    }
    
    console.error('Stack:', error.stack);
    console.error('===================================================\n');
    
    res.status(500).json({ 
      success: false,
      message: 'Server error during campaign creation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get campaign by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('targetAudience.contacts', 'name phone email')
      .populate('user', 'name email businessProfile');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Check ownership
    if (campaign.user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(campaign);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Update campaign
router.put('/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Check ownership
    if (campaign.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedCampaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.json(updatedCampaign);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Delete campaign
router.delete('/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Check ownership
    if (campaign.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Campaign.findByIdAndDelete(req.params.id);
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Approve/Reject campaign
router.post('/:id/approval', auth, async (req, res) => {
  try {
    const { status, feedback } = req.body;
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    campaign.approvals.push({
      approver: req.user.id,
      status,
      feedback,
      date: new Date()
    });

    if (status === 'approved') {
      campaign.status = 'approved';
    } else if (status === 'rejected') {
      campaign.status = 'draft';
    }

    await campaign.save();
    res.json(campaign);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
