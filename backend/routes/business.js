const express = require('express');
const BusinessData = require('../models/BusinessData');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow text files, CSV, JSON
    const allowedTypes = /\.(txt|csv|json|pdf|doc|docx)$/i;
    if (allowedTypes.test(file.originalname)) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only text, CSV, JSON, PDF, and DOC files are allowed.'));
    }
  }
});

const router = express.Router();

// Get all business data for user
router.get('/', auth, async (req, res) => {
  try {
    const { dataType, page = 1, limit = 20 } = req.query;
    const query = { user: req.user.id };
    
    if (dataType) {
      query.dataType = dataType;
    }

    const businessData = await BusinessData.find(query)
      .sort({ 'metadata.priority': -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await BusinessData.countDocuments(query);

    res.json({
      data: businessData,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Create new business data
router.post('/', [
  auth,
  body('title').trim().isLength({ min: 1 }),
  body('content').trim().isLength({ min: 10 }),
  body('dataType').isIn(['service', 'product', 'promotion', 'company_info', 'faq', 'template'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const businessData = new BusinessData({
      ...req.body,
      user: req.user.id
    });

    await businessData.save();
    res.status(201).json(businessData);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Update business data
router.put('/:id', auth, async (req, res) => {
  try {
    const businessData = await BusinessData.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!businessData) {
      return res.status(404).json({ message: 'Business data not found' });
    }

    const updatedData = await BusinessData.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.json(updatedData);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Delete business data
router.delete('/:id', auth, async (req, res) => {
  try {
    const businessData = await BusinessData.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!businessData) {
      return res.status(404).json({ message: 'Business data not found' });
    }

    await BusinessData.findByIdAndDelete(req.params.id);
    res.json({ message: 'Business data deleted successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Get business data by type
router.get('/type/:type', auth, async (req, res) => {
  try {
    const { type } = req.params;
    const businessData = await BusinessData.find({
      user: req.user.id,
      dataType: type,
      'metadata.isActive': true
    }).sort({ 'metadata.priority': -1 });

    res.json(businessData);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Bulk import business data
router.post('/bulk-import', auth, async (req, res) => {
  try {
    const { dataItems } = req.body;
    const results = {
      imported: 0,
      errors: []
    };

    for (const item of dataItems) {
      try {
        const businessData = new BusinessData({
          ...item,
          user: req.user.id
        });

        await businessData.save();
        results.imported++;
      } catch (error) {
        results.errors.push({
          item,
          error: error.message
        });
      }
    }

    res.json(results);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Search business data
router.get('/search', auth, async (req, res) => {
  try {
    const { q, dataType } = req.query;
    const query = { 
      user: req.user.id,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } },
        { 'aiTrainingData.keywords': { $in: [new RegExp(q, 'i')] } }
      ]
    };

    if (dataType) {
      query.dataType = dataType;
    }

    const results = await BusinessData.find(query)
      .sort({ 'metadata.priority': -1 })
      .limit(20);

    res.json(results);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// File upload endpoint
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { dataType = 'company_info', title } = req.body;
    const fs = require('fs');
    
    // Read file content
    let content = '';
    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    if (fileExtension === '.txt' || fileExtension === '.csv') {
      content = fs.readFileSync(filePath, 'utf8');
    } else if (fileExtension === '.json') {
      const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      content = JSON.stringify(jsonData, null, 2);
    } else {
      content = `File uploaded: ${req.file.originalname} (${fileExtension} files require manual processing)`;
    }

    // Create business data from uploaded file
    const businessData = new BusinessData({
      title: title || `Uploaded: ${req.file.originalname}`,
      content: content,
      dataType: dataType,
      user: req.user.id,
      metadata: {
        category: 'uploaded_file',
        tags: ['upload', fileExtension.replace('.', '')],
        priority: 1,
        isActive: true,
        originalFileName: req.file.originalname,
        filePath: filePath
      },
      aiTrainingData: {
        keywords: [],
        context: `Uploaded file: ${req.file.originalname}`,
        useCase: 'data_import'
      }
    });

    await businessData.save();

    // Clean up uploaded file after processing
    fs.unlinkSync(filePath);

    res.status(201).json({
      success: true,
      message: 'File uploaded and processed successfully',
      businessData: businessData
    });

  } catch (error) {
    console.error('File upload error:', error);
    // Clean up file if error occurs
    if (req.file && req.file.path) {
      const fs = require('fs');
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }
    res.status(500).json({ 
      error: 'Failed to process uploaded file',
      details: error.message 
    });
  }
});

// Bulk training endpoint
router.post('/bulk-train', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const allBusinessData = await BusinessData.find({ user: userId });
    
    if (allBusinessData.length === 0) {
      return res.status(400).json({ 
        error: 'No business data available for training. Add some business information first.' 
      });
    }

    // Mark all data as training in progress
    await BusinessData.updateMany(
      { user: userId },
      {
        $set: {
          'aiTrainingData.trainingStatus': 'in_progress',
          'aiTrainingData.lastTrainingAttempt': new Date()
        }
      }
    );

    res.json({
      success: true,
      message: `Started training on ${allBusinessData.length} business data entries`,
      trainedDataCount: allBusinessData.length
    });

  } catch (error) {
    console.error('Bulk training error:', error);
    res.status(500).json({ 
      error: 'Failed to start bulk training',
      details: error.message 
    });
  }
});

module.exports = router;