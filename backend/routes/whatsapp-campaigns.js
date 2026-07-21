const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Campaign = require('../models/Campaign');
const path = require('path');
const fs = require('fs');

// Get WhatsApp status
router.get('/status', auth, async (req, res) => {
  try {
    const whatsappClient = req.app.locals.whatsappClient;
    
    console.log('📱 Checking WhatsApp status...');
    
    if (!whatsappClient) {
      console.log('❌ No WhatsApp client found');
      return res.json({
        status: 'disconnected',
        hasClient: false,
        canSendMessages: false,
        message: 'WhatsApp client not initialized'
      });
    }
    
    const state = await whatsappClient.getState();
    const info = whatsappClient.info;
    
    console.log('✅ WhatsApp state:', state);
    
    res.json({
      status: state,
      hasClient: true,
      canSendMessages: state === 'CONNECTED',
      clientInfo: info,
      message: state === 'CONNECTED' ? 'Ready to send messages' : 'Not connected'
    });
  } catch (error) {
    console.error('❌ WhatsApp status error:', error);
    res.json({
      status: 'error',
      hasClient: false,
      canSendMessages: false,
      error: error.message
    });
  }
});

// Send campaign messages WITH MEDIA SUPPORT
router.post('/send-campaign', auth, async (req, res) => {
  try {
    const { campaignId, recipients, message, mediaFiles } = req.body;
    const whatsappClient = req.app.locals.whatsappClient;
    
    console.log('📱 ============ WhatsApp Send Campaign ============');
    console.log('📱 Campaign ID:', campaignId);
    console.log('📱 Recipients:', recipients?.length);
    console.log('📱 Message length:', message?.length);
    console.log('📱 Media files:', mediaFiles?.length);
    
    // Validate WhatsApp client
    if (!whatsappClient) {
      console.error('❌ WhatsApp client not initialized');
      return res.status(503).json({
        success: false,
        message: 'WhatsApp client not initialized. Please restart the server and scan QR code.'
      });
    }
    
    // Check connection state
    const state = await whatsappClient.getState();
    console.log('📱 WhatsApp connection state:', state);
    
    if (state !== 'CONNECTED') {
      console.error('❌ WhatsApp not connected. Current state:', state);
      return res.status(503).json({
        success: false,
        message: `WhatsApp is not connected (current state: ${state}). Please scan QR code in Settings.`
      });
    }
    
    // Validate input
    if (!recipients || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No recipients provided'
      });
    }
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }
    
    // Import MessageMedia from whatsapp-web.js
    const { MessageMedia } = require('whatsapp-web.js');
    
    // Send messages to all recipients
    const results = [];
    let sentCount = 0;
    let failedCount = 0;
    
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      
      try {
        console.log(`\n📤 [${i + 1}/${recipients.length}] Sending to: ${recipient}`);
        
        // Format phone number
        let formattedNumber = recipient.replace(/[^\d]/g, '');
        
        // Add country code if missing (US +1 if 10 digits)
        if (formattedNumber.length === 10) {
          formattedNumber = '1' + formattedNumber;
        }
        
        formattedNumber = formattedNumber + '@c.us';
        console.log(`   Formatted: ${formattedNumber}`);
        
        // Send with media if available
        if (mediaFiles && mediaFiles.length > 0) {
          console.log(`   📎 Sending ${mediaFiles.length} media file(s)...`);
          
          for (let j = 0; j < mediaFiles.length; j++) {
            const media = mediaFiles[j];
            
            try {
              console.log(`   📂 Processing media ${j + 1}/${mediaFiles.length}: ${media.filename}`);
              
              // Resolve full file path
              const fullPath = path.resolve(media.path);
              console.log(`   📍 Full path: ${fullPath}`);
              
              // Check if file exists
              if (!fs.existsSync(fullPath)) {
                console.error(`   ❌ File not found: ${fullPath}`);
                throw new Error(`Media file not found: ${media.filename}`);
              }
              
              // Get file stats
              const stats = fs.statSync(fullPath);
              console.log(`   📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
              
              // Check file size (WhatsApp limit is 16MB for images, 64MB for documents)
              const maxSize = media.type === 'image' ? 16 * 1024 * 1024 : 64 * 1024 * 1024;
              if (stats.size > maxSize) {
                throw new Error(`File ${media.filename} is too large (${(stats.size / 1024 / 1024).toFixed(2)}MB). Max: ${maxSize / 1024 / 1024}MB`);
              }
              
              // Read file and create MessageMedia
              const fileData = fs.readFileSync(fullPath, { encoding: 'base64' });
              const messageMedia = new MessageMedia(
                media.mimetype,
                fileData,
                media.filename
              );
              
              console.log(`   ✅ MessageMedia created: ${media.filename}`);
              
              // Send media with caption
              await whatsappClient.sendMessage(formattedNumber, messageMedia, {
                caption: message
              });
              
              console.log(`   ✅ Media sent successfully: ${media.filename}`);
              
            } catch (mediaError) {
              console.error(`   ❌ Error sending media file:`, mediaError.message);
              throw mediaError; // Propagate error to main catch block
            }
          }
          
        } else {
          // Send text only
          console.log('   📝 Sending text message only...');
          await whatsappClient.sendMessage(formattedNumber, message);
          console.log('   ✅ Text message sent');
        }
        
        results.push({
          recipient,
          status: 'sent',
          timestamp: new Date()
        });
        sentCount++;
        
        console.log(`✅ Successfully sent to ${recipient} (${sentCount}/${recipients.length})`);
        
        // Add delay between messages (2-4 seconds to avoid spam detection)
        if (i < recipients.length - 1) {
          const delay = 2000 + Math.random() * 2000;
          console.log(`⏳ Waiting ${(delay / 1000).toFixed(1)}s before next message...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
      } catch (error) {
        console.error(`❌ Failed to send to ${recipient}:`, error.message);
        results.push({
          recipient,
          status: 'failed',
          error: error.message,
          timestamp: new Date()
        });
        failedCount++;
      }
    }
    
    console.log('\n📊 ============ Campaign Send Summary ============');
    console.log(`✅ Sent: ${sentCount}`);
    console.log(`❌ Failed: ${failedCount}`);
    console.log(`📊 Total: ${recipients.length}`);
    console.log('===============================================\n');
    
    // Update campaign status in database
    if (campaignId) {
      try {
        const updateData = {
          status: sentCount > 0 ? 'sent' : 'failed',
          sentAt: new Date(),
          deliveryStats: {
            sent: sentCount,
            failed: failedCount,
            total: recipients.length
          },
          results: results
        };
        
        await Campaign.findByIdAndUpdate(campaignId, updateData);
        console.log(`✅ Campaign ${campaignId} updated in database`);
      } catch (dbError) {
        console.error('❌ Error updating campaign in DB:', dbError.message);
      }
    }
    
    res.json({
      success: true,
      message: `Campaign sent to ${sentCount} of ${recipients.length} recipients`,
      deliveryStats: {
        sent: sentCount,
        failed: failedCount,
        total: recipients.length
      },
      results
    });
    
  } catch (error) {
    console.error('❌ ============ Send Campaign Error ============');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('===============================================');
    
    res.status(500).json({
      success: false,
      message: 'Failed to send campaign',
      error: error.message
    });
  }
});

module.exports = router;