const express = require('express');
const crypto = require('crypto');
const Contact = require('../models/Contact');

const router = express.Router();

// Webhook handler for Mautic contact updates
router.post('/mautic-contact', async (req, res) => {
  try {
    console.log('📨 Received Mautic webhook:', {
      headers: req.headers,
      body: req.body
    });

    // Verify webhook signature if secret is provided
    const webhookSecret = process.env.MAUTIC_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers['x-mautic-signature'] || req.headers['mautic-signature'];
      if (signature) {
        const computedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(JSON.stringify(req.body))
          .digest('hex');
        
        if (signature !== computedSignature) {
          console.log('❌ Invalid webhook signature');
          return res.status(401).json({ error: 'Invalid signature' });
        }
        console.log('✅ Webhook signature verified');
      }
    }

    const webhookData = req.body;
    
    // Handle different Mautic webhook events
    if (webhookData['mautic.contact_post_save']) {
      await handleContactUpdate(webhookData['mautic.contact_post_save']);
    } else if (webhookData['mautic.contact_post_delete']) {
      await handleContactDelete(webhookData['mautic.contact_post_delete']);
    } else if (webhookData.contact) {
      // Alternative webhook format
      await handleContactUpdate([{ contact: webhookData.contact }]);
    }

    res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({ 
      error: 'Webhook processing failed',
      details: error.message 
    });
  }
});

async function handleContactUpdate(contacts) {
  console.log(`📝 Processing ${contacts.length} contact updates from Mautic`);

  for (const contactData of contacts) {
    try {
      const mauticContact = contactData.contact || contactData;
      
      // Extract contact information
      const contactInfo = {
        mauticId: mauticContact.id?.toString(),
        email: mauticContact.email || mauticContact.fields?.email?.value,
        firstName: mauticContact.firstname || mauticContact.fields?.firstname?.value || '',
        lastName: mauticContact.lastname || mauticContact.fields?.lastname?.value || '',
        phone: mauticContact.mobile || mauticContact.phone || mauticContact.fields?.mobile?.value || mauticContact.fields?.phone?.value,
        tags: extractTags(mauticContact),
        lastActive: mauticContact.last_active || new Date(),
        source: 'mautic_webhook'
      };

      // Skip if no email or phone (required fields)
      if (!contactInfo.email && !contactInfo.phone) {
        console.log('⚠️ Skipping contact - no email or phone:', mauticContact.id);
        continue;
      }

      // Find all users who have Mautic integrations to sync this contact
      const mongoose = require('mongoose');
      const crmIntegrationSchema = require('../routes/crm');
      
      // Get CRM model (it should be defined in crm.js)
      let CRMIntegration;
      try {
        CRMIntegration = mongoose.model('CRMIntegration');
      } catch (error) {
        // Model doesn't exist yet, skip this part for now
        console.log('⚠️ CRMIntegration model not found, creating contact for default user');
        // Just create for a default user ID (you may need to adjust this)
        const defaultUserId = new mongoose.Types.ObjectId(); // This is just a placeholder
        await updateContactForUser(contactInfo, defaultUserId);
        continue;
      }
      
      const mauticIntegrations = await CRMIntegration.find({
        type: 'mautic',
        status: 'active'
      }).populate('user');

      for (const integration of mauticIntegrations) {
        // Update or create contact for each user with Mautic integration
        await updateContactForUser(contactInfo, integration.user._id);
      }

    } catch (contactError) {
      console.error('❌ Error processing contact:', contactError);
    }
  }
}

async function handleContactDelete(contacts) {
  console.log(`🗑️ Processing ${contacts.length} contact deletions from Mautic`);

  for (const contactData of contacts) {
    try {
      const mauticContact = contactData.contact || contactData;
      const mauticId = mauticContact.id?.toString();

      if (!mauticId) continue;

      // Find and remove contacts with this Mautic ID
      const deleteResult = await Contact.deleteMany({
        mauticId: mauticId
      });

      console.log(`🗑️ Deleted ${deleteResult.deletedCount} contacts with Mautic ID: ${mauticId}`);

    } catch (deleteError) {
      console.error('❌ Error deleting contact:', deleteError);
    }
  }
}

async function updateContactForUser(contactInfo, userId) {
  try {
    // Try to find existing contact by Mautic ID or email
    let existingContact = await Contact.findOne({
      user: userId,
      $or: [
        { mauticId: contactInfo.mauticId },
        { email: contactInfo.email }
      ]
    });

    if (existingContact) {
      // Update existing contact
      existingContact.firstName = contactInfo.firstName || existingContact.firstName;
      existingContact.lastName = contactInfo.lastName || existingContact.lastName;
      existingContact.phone = contactInfo.phone || existingContact.phone;
      existingContact.email = contactInfo.email || existingContact.email;
      existingContact.mauticId = contactInfo.mauticId;
      existingContact.tags = [...new Set([...existingContact.tags, ...contactInfo.tags])];
      existingContact.lastActive = contactInfo.lastActive;
      existingContact.updatedAt = new Date();

      await existingContact.save();
      console.log(`✅ Updated contact: ${existingContact.email || existingContact.phone}`);
    } else {
      // Create new contact
      const newContact = new Contact({
        user: userId,
        firstName: contactInfo.firstName,
        lastName: contactInfo.lastName,
        phone: contactInfo.phone,
        email: contactInfo.email,
        mauticId: contactInfo.mauticId,
        tags: contactInfo.tags,
        lastActive: contactInfo.lastActive,
        source: contactInfo.source,
        name: `${contactInfo.firstName} ${contactInfo.lastName}`.trim() || contactInfo.email || contactInfo.phone
      });

      await newContact.save();
      console.log(`✅ Created new contact: ${newContact.email || newContact.phone}`);
    }
  } catch (error) {
    console.error('❌ Error updating contact for user:', error);
  }
}

function extractTags(mauticContact) {
  const tags = [];
  
  // Extract tags from different possible fields
  if (mauticContact.tags) {
    if (Array.isArray(mauticContact.tags)) {
      tags.push(...mauticContact.tags.map(tag => typeof tag === 'string' ? tag : tag.tag));
    } else if (typeof mauticContact.tags === 'object') {
      tags.push(...Object.values(mauticContact.tags).map(tag => tag.tag || tag));
    }
  }

  // Extract from custom fields that might contain tags
  if (mauticContact.fields) {
    for (const [key, field] of Object.entries(mauticContact.fields)) {
      if (key.toLowerCase().includes('tag') || key.toLowerCase().includes('category')) {
        if (field.value) {
          tags.push(field.value);
        }
      }
    }
  }

  // Add source tag
  tags.push('mautic');

  return [...new Set(tags)]; // Remove duplicates
}

// Test webhook endpoint for development
router.post('/test', (req, res) => {
  console.log('🧪 Test webhook received:', req.body);
  res.json({ 
    success: true, 
    message: 'Test webhook received',
    timestamp: new Date().toISOString()
  });
});

// Get webhook status/info
router.get('/status', (req, res) => {
  res.json({
    webhookUrl: `${process.env.API_BASE_URL || 'https://api.vemgootech.info'}/webhook/mautic-contact`,
    secret: process.env.MAUTIC_WEBHOOK_SECRET ? 'Configured' : 'Not configured',
    mauticUrl: process.env.MAUTIC_BASE_URL,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;