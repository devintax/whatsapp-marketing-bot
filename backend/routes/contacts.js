const express = require('express');
const router = express.Router();
// Mautic sync API endpoint (manual trigger)
const { fetchAccessToken, syncMauticContactsWithToken } = require('../services/mauticContactSync');
// POST /api/contacts/sync-mautic
router.post('/sync-mautic', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Missing Mautic OAuth2 authorization code.' });
    const accessToken = await fetchAccessToken(code);
    const imported = await syncMauticContactsWithToken(accessToken);
    res.json({ success: true, imported });
  } catch (err) {
    console.error('Mautic sync error:', err.response ? err.response.data : err.message);
    res.status(500).json({ error: 'Mautic sync failed', details: err.response ? err.response.data : err.message });
  }
});
const Contact = require('../models/Contact');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { validatePhoneNumber, normalizePhoneNumber } = require('../utils/phoneValidator');
const multer = require('multer');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// Get all contacts for user
router.get('/', auth, async (req, res) => {
  try {
    const { search, tags, page = 1, limit = 1000 } = req.query; // Increased default limit to 1000
    
    // Convert user ID string to ObjectId for proper database query
    const mongoose = require('mongoose');
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const query = { user: userId, isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (tags) {
      query.tags = { $in: tags.split(',') };
    }

    // Parse limit with a reasonable maximum
    const parsedLimit = Math.min(parseInt(limit) || 1000, 2000); // Max 2000 contacts per request

    const contacts = await Contact.find(query)
      .sort({ name: 1 })
      .limit(parsedLimit)
      .skip((page - 1) * parsedLimit);

    const total = await Contact.countDocuments(query);

    res.json({
      contacts,
      totalPages: Math.ceil(total / parsedLimit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Contact fetch error:', error.message);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// Create new contact
router.post('/', [
  auth,
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required')
    .custom((value) => {
      const validation = validatePhoneNumber(value);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      return true;
    })
], async (req, res) => {
  try {
    console.log('🔥 POST /api/contacts - Request received');
    console.log('📝 Request body:', req.body);
    console.log('👤 req.user:', req.user);
    console.log('🔑 req.user.id:', req.user?.id);
    console.log('🎯 req.user.id type:', typeof req.user?.id);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array(),
        details: errors.array().map(err => `${err.param}: ${err.msg}`).join(', ')
      });
    }

    // Normalize phone number before saving
    const normalizedPhone = normalizePhoneNumber(req.body.phone);
    console.log('📞 Original phone:', req.body.phone);
    console.log('📞 Normalized phone:', normalizedPhone);

    // Convert user ID string to ObjectId for proper database operation
    const mongoose = require('mongoose');
    const userId = new mongoose.Types.ObjectId(req.user.id);
    console.log('🔄 Converted userId to ObjectId:', userId);

    // Check if contact already exists (use normalized phone for comparison)
    const existingContact = await Contact.findOne({
      user: userId,
      phone: normalizedPhone
    });

    if (existingContact) {
      console.log('🚫 Contact already exists:', existingContact._id);
      return res.status(400).json({ 
        message: 'Contact with this phone number already exists',
        existingContact: {
          name: existingContact.name,
          phone: existingContact.phone
        }
      });
    }

    // Filter out undefined values to prevent them from overriding required fields
    const cleanedBody = Object.fromEntries(
      Object.entries(req.body).filter(([key, value]) => value !== undefined && value !== null)
    );
    
    const contactData = {
      ...cleanedBody,
      phone: normalizedPhone, // Use normalized phone
      user: userId,
      crmSource: 'manual' // Mark as manually created
    };
    
    console.log('💾 Creating contact with data:', contactData);
    console.log('🧹 Cleaned body (undefined filtered):', cleanedBody);
    
    const contact = new Contact(contactData);

    const savedContact = await contact.save();
    console.log('✅ Contact created successfully:', savedContact._id);
    console.log('📊 Saved contact user field:', savedContact.user);
    
    res.status(201).json({ success: true, contact: savedContact });
  } catch (error) {
    console.error('❌ Contact creation error:', error.message);
    console.error('Error details:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message,
      details: error.code === 11000 ? 'Contact with this phone number already exists' : 'Internal server error'
    });
  }
});

// Bulk import contacts
router.post('/bulk-import', auth, async (req, res) => {
  try {
    const { contacts } = req.body;
    const results = {
      imported: 0,
      skipped: 0,
      errors: []
    };

    // Convert user ID string to ObjectId for proper database operation
    const mongoose = require('mongoose');
    const userId = new mongoose.Types.ObjectId(req.user.id);

    for (const contactData of contacts) {
      try {
        // Check if contact already exists
        const existingContact = await Contact.findOne({
          user: userId,
          phone: contactData.phone
        });

        if (existingContact) {
          results.skipped++;
          continue;
        }

        // Filter out undefined values to prevent them from overriding required fields
        const cleanedContactData = Object.fromEntries(
          Object.entries(contactData).filter(([key, value]) => value !== undefined && value !== null)
        );

        const contact = new Contact({
          ...cleanedContactData,
          user: userId
        });

        await contact.save();
        results.imported++;
      } catch (error) {
        results.errors.push({
          contact: contactData,
          error: error.message
        });
      }
    }

    res.json(results);
  } catch (error) {
    console.error('❌ Bulk import error:', error.message);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// Update contact
router.put('/:id', auth, async (req, res) => {
  try {
    // Convert user ID string to ObjectId for proper database query
    const mongoose = require('mongoose');
    const userId = new mongoose.Types.ObjectId(req.user.id);
    
    const contact = await Contact.findOne({
      _id: req.params.id,
      user: userId
    });

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    const updatedContact = await Contact.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.json(updatedContact);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Delete contact
router.delete('/:id', auth, async (req, res) => {
  try {
    // Convert user ID string to ObjectId for proper database query
    const mongoose = require('mongoose');
    const userId = new mongoose.Types.ObjectId(req.user.id);
    
    const contact = await Contact.findOne({
      _id: req.params.id,
      user: userId
    });

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    await Contact.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Get contact statistics
router.get('/stats', auth, async (req, res) => {
  try {
    // Convert user ID string to ObjectId for proper database query
    const mongoose = require('mongoose');
    const userId = new mongoose.Types.ObjectId(req.user.id);
    
    const totalContacts = await Contact.countDocuments({
      user: userId,
      isActive: true
    });

    const tagStats = await Contact.aggregate([
      { $match: { user: userId, isActive: true } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      totalContacts,
      tagStats
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
    }
  }
});

// Preview import file
router.post('/preview-import', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    let data = [];

    try {
      if (fileExt === '.csv') {
        // Parse CSV file
        data = await new Promise((resolve, reject) => {
          const results = [];
          fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => results.push(row))
            .on('end', () => resolve(results))
            .on('error', reject);
        });
      } else if (fileExt === '.xlsx' || fileExt === '.xls') {
        // Parse Excel file
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = xlsx.utils.sheet_to_json(worksheet);
      }

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      // Return preview (first 10 rows)
      res.json({
        success: true,
        preview: data.slice(0, 10),
        totalRows: data.length
      });

    } catch (parseError) {
      console.error('File parsing error:', parseError);
      // Clean up file on error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      res.status(400).json({
        success: false,
        message: 'Failed to parse file. Please check the file format.'
      });
    }

  } catch (error) {
    console.error('Preview import error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to preview import file'
    });
  }
});

// Import contacts from file
router.post('/import', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { columnMapping, settings } = req.body;
    const mapping = JSON.parse(columnMapping);
    const importSettings = JSON.parse(settings);
    
    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    let data = [];

    try {
      if (fileExt === '.csv') {
        // Parse CSV file
        data = await new Promise((resolve, reject) => {
          const results = [];
          fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => results.push(row))
            .on('end', () => resolve(results))
            .on('error', reject);
        });
      } else if (fileExt === '.xlsx' || fileExt === '.xls') {
        // Parse Excel file
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = xlsx.utils.sheet_to_json(worksheet);
      }

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      // Process import
      const results = {
        total: data.length,
        imported: 0,
        skipped: 0,
        failed: 0,
        errors: []
      };

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        try {
          // Map columns to contact fields
          const contactData = {
            user: req.user.id,
            name: row[mapping.name] || '',
            phone: row[mapping.phone] || '',
            email: row[mapping.email] || '',
            company: row[mapping.company] || '',
            notes: row[mapping.notes] || '',
            tags: row[mapping.tags] ? row[mapping.tags].split(',').map(tag => tag.trim()) : []
          };

          // Validate required fields
          if (!contactData.name || !contactData.phone) {
            results.failed++;
            results.errors.push({
              row: i + 1,
              message: 'Missing required fields (name or phone)',
              data: contactData
            });
            continue;
          }

          // Validate phone number format if enabled
          if (importSettings.validatePhones) {
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            if (!phoneRegex.test(contactData.phone.replace(/\D/g, ''))) {
              results.failed++;
              results.errors.push({
                row: i + 1,
                message: 'Invalid phone number format',
                data: contactData
              });
              continue;
            }
          }

          // Check for duplicates if enabled
          if (importSettings.skipDuplicates) {
            const existingContact = await Contact.findOne({
              user: req.user.id,
              phone: contactData.phone,
              isActive: true
            });

            if (existingContact) {
              if (importSettings.updateExisting) {
                // Update existing contact
                await Contact.findByIdAndUpdate(existingContact._id, contactData);
                results.imported++;
              } else {
                results.skipped++;
              }
              continue;
            }
          }

          // Create new contact
          await Contact.create(contactData);
          results.imported++;

        } catch (contactError) {
          console.error(`Error processing row ${i + 1}:`, contactError);
          results.failed++;
          results.errors.push({
            row: i + 1,
            message: contactError.message,
            data: row
          });
        }
      }

      res.json({
        success: true,
        results
      });

    } catch (parseError) {
      console.error('File parsing error:', parseError);
      // Clean up file on error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      res.status(400).json({
        success: false,
        message: 'Failed to parse file. Please check the file format.'
      });
    }

  } catch (error) {
    console.error('Import contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import contacts'
    });
  }
});

module.exports = router;