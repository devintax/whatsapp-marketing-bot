const express = require('express');
const router = express.Router();
const BusinessData = require('../models/BusinessData');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/business-data';
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
    const allowedTypes = ['.csv', '.xlsx', '.xls', '.json', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV, Excel, JSON, and TXT files are allowed.'), false);
    }
  }
});

// GET /api/business-data - Get all business data
router.get('/', auth, async (req, res) => {
  try {
    console.log('📊 Fetching business data for user:', req.user.id);
    
    const businessData = await BusinessData.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${businessData.length} business data entries`);
    
    res.json({
      success: true,
      data: businessData,
      count: businessData.length
    });
  } catch (error) {
    console.error('❌ Error fetching business data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch business data',
      error: error.message
    });
  }
});

// POST /api/business-data - Create new business data entry
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    console.log('📝 Creating new business data entry');
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);
    
    const { type, description, content } = req.body;
    
    // Validate required fields
    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Business data type is required'
      });
    }
    
    const businessDataEntry = {
      user: req.user.id,
      dataType: type, // Map to correct field name
      title: description || 'Business Data Entry', // Map to correct field name
      content: content || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add file information if file was uploaded
    if (req.file) {
      businessDataEntry.metadata = {
        ...businessDataEntry.metadata,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      };
    }
    
    const newBusinessData = new BusinessData(businessDataEntry);
    await newBusinessData.save();
    
    console.log('✅ Business data entry created successfully:', newBusinessData._id);
    
    res.status(201).json({
      success: true,
      message: 'Business data created successfully',
      data: newBusinessData
    });
  } catch (error) {
    console.error('❌ Error creating business data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create business data',
      error: error.message
    });
  }
});

// PUT /api/business-data/:id - Update business data entry
router.put('/:id', auth, upload.single('file'), async (req, res) => {
  try {
    console.log('📝 Updating business data entry:', req.params.id);
    
    const { type, description, content } = req.body;
    
    // Find existing business data entry
    const businessData = await BusinessData.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!businessData) {
      return res.status(404).json({
        success: false,
        message: 'Business data entry not found'
      });
    }
    
    // Update fields
    if (type) businessData.dataType = type; // Map to correct field name
    if (description !== undefined) businessData.title = description; // Map to correct field name
    if (content !== undefined) businessData.content = content;
    businessData.updatedAt = new Date();
    
    // Handle file update
    if (req.file) {
      // Delete old file if it exists
      if (businessData.metadata?.filePath && fs.existsSync(businessData.metadata.filePath)) {
        fs.unlinkSync(businessData.metadata.filePath);
      }
      
      // Update with new file
      businessData.metadata = {
        ...businessData.metadata,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      };
    }
    
    await businessData.save();
    
    console.log('✅ Business data entry updated successfully');
    
    res.json({
      success: true,
      message: 'Business data updated successfully',
      data: businessData
    });
  } catch (error) {
    console.error('❌ Error updating business data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update business data',
      error: error.message
    });
  }
});

// DELETE /api/business-data/:id - Delete business data entry
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('🗑️ Deleting business data entry:', req.params.id);
    
    const businessData = await BusinessData.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!businessData) {
      return res.status(404).json({
        success: false,
        message: 'Business data entry not found'
      });
    }
    
    // Delete associated file if it exists
    if (businessData.metadata?.filePath && fs.existsSync(businessData.metadata.filePath)) {
      fs.unlinkSync(businessData.metadata.filePath);
      console.log('🗑️ Deleted associated file:', businessData.metadata.filePath);
    }
    
    await BusinessData.findByIdAndDelete(req.params.id);
    
    console.log('✅ Business data entry deleted successfully');
    
    res.json({
      success: true,
      message: 'Business data deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting business data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete business data',
      error: error.message
    });
  }
});

// GET /api/business-data/sample/contacts - Download sample contacts CSV
router.get('/sample/contacts', auth, (req, res) => {
  try {
    console.log('📥 Generating sample contacts CSV');
    
    const sampleData = [
      ['Name', 'Phone', 'Email', 'Company', 'Tags'],
      ['John Doe', '+1234567890', 'john@example.com', 'ABC Corp', 'lead,potential'],
      ['Jane Smith', '+1987654321', 'jane@example.com', 'XYZ Inc', 'customer,vip'],
      ['Bob Johnson', '+1122334455', 'bob@example.com', 'Tech Solutions', 'prospect'],
      ['Alice Brown', '+1555666777', 'alice@example.com', 'Creative Agency', 'lead,interested']
    ];
    
    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sample_contacts.csv"');
    res.send(csvContent);
    
    console.log('✅ Sample contacts CSV sent successfully');
  } catch (error) {
    console.error('❌ Error generating sample CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate sample CSV',
      error: error.message
    });
  }
});

// GET /api/business-data/sample/products - Download sample products CSV
router.get('/sample/products', auth, (req, res) => {
  try {
    console.log('📥 Generating sample products CSV');
    
    const sampleData = [
      ['Product Name', 'Description', 'Price', 'Category', 'SKU'],
      ['Premium Widget', 'High-quality widget for professional use', '$299.99', 'Electronics', 'PW-001'],
      ['Basic Widget', 'Standard widget for everyday use', '$99.99', 'Electronics', 'BW-001'],
      ['Widget Pro Max', 'Advanced widget with premium features', '$499.99', 'Electronics', 'WPM-001'],
      ['Widget Starter', 'Entry-level widget for beginners', '$49.99', 'Electronics', 'WS-001']
    ];
    
    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sample_products.csv"');
    res.send(csvContent);
    
    console.log('✅ Sample products CSV sent successfully');
  } catch (error) {
    console.error('❌ Error generating sample CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate sample CSV',
      error: error.message
    });
  }
});

// GET /api/business-data/sample/customers - Download sample customers CSV
router.get('/sample/customers', auth, (req, res) => {
  try {
    console.log('📥 Generating sample customers CSV');
    
    const sampleData = [
      ['Customer Name', 'Phone', 'Email', 'Purchase History', 'Last Purchase Date', 'Total Spent'],
      ['John Customer', '+1234567890', 'john.c@example.com', 'Widget Pro, Basic Widget', '2024-01-15', '$399.98'],
      ['Jane Buyer', '+1987654321', 'jane.b@example.com', 'Premium Widget, Widget Starter', '2024-01-20', '$349.98'],
      ['Bob Purchaser', '+1122334455', 'bob.p@example.com', 'Widget Pro Max', '2024-01-10', '$499.99'],
      ['Alice Client', '+1555666777', 'alice.c@example.com', 'Basic Widget, Widget Starter', '2024-01-25', '$149.98']
    ];
    
    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sample_customers.csv"');
    res.send(csvContent);
    
    console.log('✅ Sample customers CSV sent successfully');
  } catch (error) {
    console.error('❌ Error generating sample CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate sample CSV',
      error: error.message
    });
  }
});

// GET /api/business-data/types - Get available business data types
router.get('/types', auth, (req, res) => {
  try {
    const types = [
      { 
        value: 'company_info', 
        label: 'Company Information',
        description: 'Basic company details, mission, values, and history'
      },
      { 
        value: 'products_services', 
        label: 'Products & Services',
        description: 'Product catalogs, service descriptions, and pricing'
      },
      { 
        value: 'customer_data', 
        label: 'Customer Data',
        description: 'Customer profiles, purchase history, and preferences'
      },
      { 
        value: 'market_research', 
        label: 'Market Research',
        description: 'Industry insights, competitor analysis, and market trends'
      },
      { 
        value: 'campaign_templates', 
        label: 'Campaign Templates',
        description: 'Successful campaign examples and messaging templates'
      },
      { 
        value: 'brand_guidelines', 
        label: 'Brand Guidelines',
        description: 'Brand voice, tone, messaging style, and visual guidelines'
      }
    ];
    
    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    console.error('❌ Error fetching business data types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch business data types',
      error: error.message
    });
  }
});

module.exports = router;