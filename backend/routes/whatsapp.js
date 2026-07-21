const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const auth = require('../middleware/auth');
const MessageAnalytics = require('../models/MessageAnalytics');
const Campaign = require('../models/Campaign');
const SmartCampaignBatcher = require('../smart-campaign-batching');
const { publicMediaUrl } = require('../utils/mediaUrl');

const router = express.Router();

// Store WhatsApp clients per user
const whatsappClients = new Map();
// Store QR codes per user
const qrCodes = new Map();
// Store connection status per user
const connectionStatus = new Map();

// Initialize WhatsApp client for user
router.post('/init', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (whatsappClients.has(userId)) {
      const client = whatsappClients.get(userId);
      const status = connectionStatus.get(userId) || 'disconnected';
      return res.json({ 
        message: 'WhatsApp client already initialized',
        status: status,
        qrCode: qrCodes.get(userId)
      });
    }

    // Check if there's a saved session status
    let savedStatus = null;
    try {
      const fs = require('fs');
      const sessionFile = `./whatsapp_sessions/session_status_${userId}.json`;
      if (fs.existsSync(sessionFile)) {
        savedStatus = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
        console.log(`📂 Found saved session status for user ${userId}:`, savedStatus.status);
      }
    } catch (error) {
      console.log('Could not read saved session status:', error.message);
    }

    console.log(`🚀 Starting WhatsApp client initialization for user ${userId}...`);

    // Try to initialize real WhatsApp client first
    try {
      const client = new Client({
        authStrategy: new LocalAuth({
          clientId: `user_${userId}`,
          dataPath: './whatsapp_sessions'  // Persist sessions
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-extensions',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
          ],
          timeout: 60000 // Increase to 60 seconds
        }
      });

      // Set initial status based on saved session
      connectionStatus.set(userId, savedStatus?.status === 'connected' ? 'restoring' : 'initializing');

      client.on('qr', async (qr) => {
        try {
          console.log(`🔄 Real WhatsApp QR code generated for user ${userId} - Length: ${qr.length}`);
          const qrCodeData = await qrcode.toDataURL(qr, {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M'
          });
          qrCodes.set(userId, qrCodeData);
          connectionStatus.set(userId, 'qr_ready');
          console.log(`✅ Real WhatsApp QR code ready for scanning by user ${userId}`);
        } catch (error) {
          console.error('Error generating QR code:', error);
          connectionStatus.set(userId, 'error');
        }
      });

      client.on('ready', () => {
        console.log(`🎉 WhatsApp client READY for user ${userId} - Can now send real messages!`);
        connectionStatus.set(userId, 'connected');
        qrCodes.delete(userId);
        
        // Save connection status to avoid re-auth
        try {
          const fs = require('fs');
          const sessionFile = `./whatsapp_sessions/session_status_${userId}.json`;
          fs.writeFileSync(sessionFile, JSON.stringify({
            userId: userId,
            status: 'connected',
            timestamp: new Date().toISOString()
          }));
        } catch (error) {
          console.log('Could not save session status:', error.message);
        }
      });

      client.on('authenticated', () => {
        console.log(`🔐 WhatsApp client AUTHENTICATED for user ${userId}`);
        connectionStatus.set(userId, 'authenticated');
        
        // Save auth status
        try {
          const fs = require('fs');
          const sessionFile = `./whatsapp_sessions/session_status_${userId}.json`;
          fs.writeFileSync(sessionFile, JSON.stringify({
            userId: userId,
            status: 'authenticated',
            timestamp: new Date().toISOString()
          }));
        } catch (error) {
          console.log('Could not save auth status:', error.message);
        }
      });

      client.on('auth_failure', (msg) => {
        console.error(`❌ WhatsApp auth FAILURE for user ${userId}:`, msg);
        connectionStatus.set(userId, 'auth_failed');
        qrCodes.delete(userId);
      });

      client.on('disconnected', (reason) => {
        console.log(`🔌 WhatsApp client DISCONNECTED for user ${userId}:`, reason);
        connectionStatus.set(userId, 'disconnected');
        whatsappClients.delete(userId);
        qrCodes.delete(userId);
      });

      // Add loading screen event
      client.on('loading_screen', (percent, message) => {
        console.log(`📱 Loading screen for user ${userId}: ${percent}% - ${message}`);
      });

      // Add change state event
      client.on('change_state', (state) => {
        console.log(`🔄 State changed for user ${userId}: ${state}`);
        if (state === 'CONNECTED') {
          connectionStatus.set(userId, 'connected');
        }
      });

      whatsappClients.set(userId, client);
      
      console.log(`🚀 Starting WhatsApp client initialization for user ${userId}...`);
      
      // Set a timeout for restoring sessions - if it takes too long, force a new QR code
      if (savedStatus?.status === 'connected') {
        console.log(`⏰ Setting 60-second timeout for session restoration for user ${userId}`);
        setTimeout(async () => {
          const currentStatus = connectionStatus.get(userId);
          if (currentStatus === 'restoring') {
            console.log(`⚠️ Session restoration timeout for user ${userId} - session may be expired`);
            console.log(`🔄 Forcing session reset and new QR code...`);
            
            // Destroy client and clear session to force fresh start
            try {
              if (whatsappClients.has(userId)) {
                const client = whatsappClients.get(userId);
                await client.destroy();
                whatsappClients.delete(userId);
              }
              connectionStatus.set(userId, 'disconnected');
              qrCodes.delete(userId);
              console.log(`✅ Session cleared for user ${userId}, ready for fresh initialization`);
            } catch (error) {
              console.log(`⚠️ Error clearing session for user ${userId}:`, error.message);
              connectionStatus.set(userId, 'disconnected');
            }
          }
        }, 60000); // 60 seconds timeout
      }
      
      // Wrap initialization in try-catch to handle session file lock errors
      try {
        await client.initialize();
      } catch (initError) {
        if (initError.message && initError.message.includes('EBUSY')) {
          console.log(`⚠️ Session files locked for user ${userId}, clearing and retrying...`);
          
          // Clear the client and session
          whatsappClients.delete(userId);
          connectionStatus.set(userId, 'disconnected');
          qrCodes.delete(userId);
          
          throw new Error('Session files are locked. Please try connecting again in a few seconds.');
        }
        throw initError;
      }

      res.json({ 
        message: 'Real WhatsApp client initializing...',
        status: savedStatus?.status === 'connected' ? 'restoring' : 'initializing',
        mode: 'real',
        note: savedStatus?.status === 'connected' 
          ? 'Restoring previous WhatsApp session. This may take up to 60 seconds...' 
          : 'Initializing real WhatsApp Web.js client. This will generate a scannable QR code.'
      });

    } catch (realError) {
      console.log(`Real WhatsApp failed for user ${userId}, switching to demo mode:`, realError.message);
      
      // Fall back to demo mode
      console.log(`Switching to demo mode for user ${userId}`);
      connectionStatus.set(userId, 'initializing');
      
      // Simulate QR code generation after a short delay
      setTimeout(async () => {
        try {
          // Generate a WhatsApp-format demonstration QR code
          const timestamp = Date.now();
          const randomRef = Math.random().toString(36).substring(2, 15);
          const randomSecret = Math.random().toString(36).substring(2, 15);
          
          // WhatsApp QR format simulation
          const whatsappQRText = `2@${randomRef},${randomSecret},${timestamp}==`;
          
          const qrCodeDataURL = await qrcode.toDataURL(whatsappQRText, {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M'
          });
          qrCodes.set(userId, qrCodeDataURL);
          connectionStatus.set(userId, 'qr_ready');
          console.log(`WhatsApp-format demo QR code generated for user ${userId}`);
        } catch (qrError) {
          console.error('Error generating demo QR code:', qrError);
          connectionStatus.set(userId, 'error');
        }
      }, 2000);

      res.json({ 
        message: 'WhatsApp client initializing in demo mode...',
        status: 'initializing',
        mode: 'demo',
        note: 'Real WhatsApp integration requires Chrome/Chromium. Using demo mode for testing.'
      });
    }

  } catch (error) {
    console.error('WhatsApp initialization error:', error.message);
    connectionStatus.set(req.user.id, 'error');
    res.status(500).json({ 
      error: 'Failed to initialize WhatsApp client',
      details: error.message
    });
  }
});

// Get QR code for authentication
router.get('/qr', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const qrCode = qrCodes.get(userId);
    const status = connectionStatus.get(userId) || 'disconnected';

    res.json({ 
      qrCode: qrCode || null,
      status: status,
      hasClient: whatsappClients.has(userId)
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Failed to get QR code' });
  }
});

// Get connection status
// ⚠️ DEPRECATED - Using enhanced status endpoint below (line 1170)
// This old endpoint had a bug: didn't check if client was actually ready
/*
router.get('/status', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const status = connectionStatus.get(userId) || 'disconnected';
    const hasClient = whatsappClients.has(userId);
    const hasQR = qrCodes.has(userId);
    const client = whatsappClients.get(userId);
    
    let clientInfo = null;
    if (client) {
      try {
        // First check if client is properly initialized
        const info = await client.getState();
        
        // Only try to get detailed info if client has info property and is connected
        if (client.info && client.info.wid && info === 'CONNECTED') {
          try {
            const contactId = client.info.wid.user + '@c.us';
            const contact = await client.getContact(contactId);
            clientInfo = {
              state: info,
              isReady: true,
              phoneNumber: client.info.wid.user,
              name: contact ? contact.name || contact.pushname : null
            };
          } catch (contactError) {
            // If contact fetch fails, still provide basic info
            clientInfo = {
              state: info,
              isReady: true,
              phoneNumber: client.info.wid.user,
              name: null,
              warning: 'Could not fetch contact details'
            };
          }
        } else {
          // Client exists but not fully ready
          clientInfo = {
            state: info,
            isReady: false,
            phoneNumber: null,
            name: null
          };
        }
      } catch (infoError) {
        console.log('Could not get client info:', infoError.message);
        clientInfo = { 
          error: 'Could not retrieve client information',
          isReady: false,
          state: 'UNKNOWN'
        };
      }
    }

    res.json({ 
      status: status,
      hasClient: hasClient,
      hasQR: hasQR,
      qrCode: hasQR ? qrCodes.get(userId) : null,
      clientInfo: clientInfo,
      canSendMessages: status === 'connected' && hasClient && clientInfo && clientInfo.isReady === true
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Failed to get status' });
  }
});
*/

// Disconnect WhatsApp client
router.post('/disconnect', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const client = whatsappClients.get(userId);

    if (client) {
      await client.destroy();
      whatsappClients.delete(userId);
    }
    
    connectionStatus.set(userId, 'disconnected');
    qrCodes.delete(userId);

    res.json({ message: 'WhatsApp client disconnected successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Failed to disconnect WhatsApp client' });
  }
});

// Simulate QR code scan (for demo purposes)
router.post('/simulate-scan', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const currentStatus = connectionStatus.get(userId);
    
    if (currentStatus === 'qr_ready') {
      // Simulate successful scan and connection
      connectionStatus.set(userId, 'authenticated');
      qrCodes.delete(userId);
      
      // After a short delay, mark as connected
      setTimeout(() => {
        connectionStatus.set(userId, 'connected');
        console.log(`Demo: User ${userId} WhatsApp connected successfully`);
      }, 3000);
      
      res.json({ 
        message: 'QR code scan simulated successfully',
        status: 'authenticated'
      });
    } else {
      res.status(400).json({ 
        error: 'No QR code available to scan',
        currentStatus: currentStatus
      });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Failed to simulate QR scan' });
  }
});

// Send message to single contact
router.post('/send-message', auth, async (req, res) => {
  try {
    const { phone, message, mediaUrl } = req.body;
    const userId = req.user.id;
    const client = whatsappClients.get(userId);
    const status = connectionStatus.get(userId);

    if (!client) {
      return res.status(400).json({ 
        error: 'WhatsApp client not initialized',
        status: status || 'disconnected'
      });
    }

    if (status !== 'connected') {
      return res.status(400).json({ 
        error: 'WhatsApp client not connected',
        status: status,
        message: 'Please ensure WhatsApp is properly connected before sending messages'
      });
    }

    // Format phone number correctly
    let phoneNumber = phone.replace(/\D/g, ''); // Remove non-digits
    if (!phoneNumber.startsWith('1') && phoneNumber.length === 10) {
      phoneNumber = '1' + phoneNumber; // Add country code for US numbers
    }
    const chatId = `${phoneNumber}@c.us`;
    
    console.log(`📤 Sending WhatsApp message to ${chatId} for user ${userId}`);

    // Create analytics record before sending
    const messageAnalytics = new MessageAnalytics({
      user: userId,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      recipientPhone: phoneNumber,
      messageContent: message,
      messageType: mediaUrl ? 'media' : 'text',
      status: 'pending',
      mediaUrl: mediaUrl,
      metadata: {
        chatId: chatId,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip || req.connection.remoteAddress
      }
    });

    try {
      if (mediaUrl) {
        const sentMessage = await client.sendMessage(chatId, { media: mediaUrl, caption: message });
        console.log(`✅ Media message sent successfully to ${chatId}`);
        
        // Update analytics with success
        messageAnalytics.status = 'sent';
        messageAnalytics.metadata.whatsappMessageId = sentMessage.id?.id;
        await messageAnalytics.save();
      } else {
        const sentMessage = await client.sendMessage(chatId, message);
        console.log(`✅ Text message sent successfully to ${chatId}`);
        
        // Update analytics with success
        messageAnalytics.status = 'sent';
        messageAnalytics.metadata.whatsappMessageId = sentMessage.id?.id;
        await messageAnalytics.save();
      }

      res.json({ 
        message: 'Message sent successfully',
        to: phoneNumber,
        type: mediaUrl ? 'media' : 'text',
        messageId: messageAnalytics.messageId
      });
    } catch (sendError) {
      console.error(`❌ Failed to send message to ${chatId}:`, sendError);
      
      // Update analytics with failure
      messageAnalytics.status = 'failed';
      messageAnalytics.failureReason = sendError.message;
      await messageAnalytics.save();
      
      res.status(500).json({ 
        error: 'Failed to send message',
        details: sendError.message,
        to: phoneNumber
      });
    }

  } catch (error) {
    console.error('Send message error:', error.message);
    res.status(500).json({ error: 'Failed to send message', details: error.message });
  }
});

// Send bulk messages (campaign)
router.post('/send-campaign', auth, async (req, res) => {
  try {
    const { campaignId, contacts, recipients, message, mediaUrl } = req.body;
    const userId = req.user.id;
    const client = whatsappClients.get(userId);
    const status = connectionStatus.get(userId);

    // Debug: Log what we received
    console.log('=== BACKEND SEND-CAMPAIGN DEBUG ===');
    console.log('Received campaignId:', campaignId);
    console.log('Received message:', message);
    console.log('Received recipients:', recipients);
    console.log('===================================');

    // 🔧 COMPREHENSIVE CLIENT VALIDATION FIX
    if (!client) {
      return res.status(400).json({ 
        message: 'WhatsApp client not initialized',
        status: status || 'disconnected',
        help: 'Please initialize WhatsApp client first using /api/whatsapp/init'
      });
    }

    // 🔧 CRITICAL FIX: Validate client object integrity
    try {
      // Test if client has required methods
      if (typeof client.sendMessage !== 'function') {
        console.error(`❌ CRITICAL: Client exists but sendMessage is not a function. Client type: ${typeof client}`);
        console.error(`❌ Client methods:`, Object.getOwnPropertyNames(client));
        
        // Clear corrupted client and reinitialize
        whatsappClients.delete(userId);
        connectionStatus.set(userId, 'corrupted');
        
        return res.status(500).json({ 
          message: 'WhatsApp client is corrupted - client object exists but methods are missing',
          status: 'corrupted',
          help: 'Please reinitialize WhatsApp client using /api/whatsapp/init',
          error: 'Client validation failed - missing sendMessage method'
        });
      }

      // Test client state
      const clientState = await client.getState().catch(err => {
        console.error(`❌ Client getState failed:`, err.message);
        return 'UNKNOWN';
      });
      
      console.log(`🔍 Client state validation: ${clientState}`);
      
      if (clientState === 'UNKNOWN' || !clientState) {
        console.error(`❌ CRITICAL: Client getState returned invalid state: ${clientState}`);
        
        // Clear corrupted client
        whatsappClients.delete(userId);
        connectionStatus.set(userId, 'state_error');
        
        return res.status(500).json({ 
          message: 'WhatsApp client state is invalid',
          status: 'state_error',
          help: 'Client appears corrupted. Please reinitialize using /api/whatsapp/init',
          error: `Client getState returned: ${clientState}`
        });
      }

    } catch (clientValidationError) {
      console.error(`❌ CRITICAL CLIENT VALIDATION ERROR:`, clientValidationError);
      
      // Clear corrupted client
      whatsappClients.delete(userId);
      connectionStatus.set(userId, 'validation_failed');
      
      return res.status(500).json({ 
        message: 'WhatsApp client validation failed',
        status: 'validation_failed',
        help: 'Client object is corrupted. Please reinitialize using /api/whatsapp/init',
        error: clientValidationError.message,
        errorType: 'CLIENT_VALIDATION_FAILED'
      });
    }

    if (status !== 'connected') {
      return res.status(400).json({ 
        message: 'WhatsApp client not connected',
        status: status,
        help: 'Please ensure WhatsApp is properly connected before sending messages. Current status: ' + status
      });
    }

    // Handle both contact objects and phone number arrays
    let phoneNumbers = [];
    
    if (recipients && Array.isArray(recipients)) {
      // Frontend sends recipients as array of phone numbers
      phoneNumbers = recipients;
    } else if (contacts && Array.isArray(contacts)) {
      // Legacy format: array of contact objects
      phoneNumbers = contacts.map(contact => contact.phone || contact);
    } else {
      return res.status(400).json({ 
        message: 'No recipients provided. Please provide either contacts or recipients array.' 
      });
    }

    console.log(`📤 Sending campaign to ${phoneNumbers.length} recipients for user ${userId}`);

    // 🎯 PERSONALIZATION: Fetch contact names from database
    // This is CRITICAL for WhatsApp anti-ban compliance!
    const Contact = require('../models/Contact');
    const contactMap = new Map(); // phone → { name, email, ... }
    
    try {
      console.log(`👥 Fetching contact details for personalization...`);
      
      // Normalize phone numbers for lookup (remove formatting)
      const normalizedPhones = phoneNumbers.map(p => p.replace(/\D/g, ''));
      
      // Query database for all contacts matching these phone numbers
      const contactRecords = await Contact.find({
        user: userId,
        phone: { $in: phoneNumbers } // Match any of the phone numbers
      }).select('name phone email');
      
      console.log(`✅ Found ${contactRecords.length} contacts in database`);
      
      // Build map: phone → contact details
      contactRecords.forEach(contact => {
        const normalizedPhone = contact.phone.replace(/\D/g, '');
        contactMap.set(contact.phone, {
          name: contact.name,
          firstName: contact.name.split(' ')[0], // Extract first name
          email: contact.email
        });
        // Also add normalized version for matching
        contactMap.set(normalizedPhone, {
          name: contact.name,
          firstName: contact.name.split(' ')[0],
          email: contact.email
        });
      });
      
      console.log(`📊 Personalization stats:`);
      console.log(`   Total recipients: ${phoneNumbers.length}`);
      console.log(`   With names: ${contactRecords.length}`);
      console.log(`   Anonymous: ${phoneNumbers.length - contactRecords.length}`);
      
      if (contactRecords.length === 0) {
        console.warn(`⚠️ WARNING: No contact names found! Messages will be generic.`);
        console.warn(`⚠️ This increases WhatsApp ban risk! Add contact names to improve compliance.`);
      } else if (contactRecords.length < phoneNumbers.length) {
        console.warn(`⚠️ WARNING: ${phoneNumbers.length - contactRecords.length} recipients have no names.`);
        console.warn(`⚠️ Consider adding names for better WhatsApp compliance.`);
      } else {
        console.log(`✅ 100% personalization achieved! This greatly reduces ban risk.`);
      }
      
    } catch (contactError) {
      console.error(`❌ Failed to fetch contact details:`, contactError.message);
      console.warn(`⚠️ Continuing without personalization (higher ban risk)`);
    }

    // Update campaign analytics if campaignId provided
    let campaign = null;
    let campaignMediaFiles = [];
    let finalMessage = message; // Default to passed message
    
    if (campaignId) {
      console.log(`🔍 DEBUG: Looking up campaign ${campaignId} for user ${userId}`);
      try {
        campaign = await Campaign.findOne({ _id: campaignId, user: userId });
        if (campaign) {
          console.log(`🔍 DEBUG: Campaign found - content length: ${campaign.content?.length}, message length: ${campaign.message?.length}`);
          // 🔧 FIX: Use campaign content if available, fallback to passed message
          if (campaign.content && campaign.content.trim()) {
            finalMessage = campaign.content.trim();
            console.log(`📝 Using campaign content from database: "${finalMessage.substring(0, 50)}..."`);
            console.log(`🔍 DEBUG: finalMessage set to campaign.content, length: ${finalMessage.length}`);
          } else if (campaign.message && campaign.message.trim()) {
            finalMessage = campaign.message.trim();
            console.log(`📝 Using campaign message from database: "${finalMessage.substring(0, 50)}..."`);
            console.log(`🔍 DEBUG: finalMessage set to campaign.message, length: ${finalMessage.length}`);
          } else if (campaign.generatedContent && campaign.generatedContent.text) {
            finalMessage = campaign.generatedContent.text.trim();
            console.log(`📝 Using AI-generated content from database: "${finalMessage.substring(0, 50)}..."`);
            console.log(`🔍 DEBUG: finalMessage set to generatedContent, length: ${finalMessage.length}`);
          } else {
            console.log(`⚠️ No content found in campaign, using passed message: "${finalMessage}"`);
          }
        } else {
          console.log(`❌ Campaign not found for ID ${campaignId} and user ${userId}`);
        }
          
        if (campaign && campaign.mediaFiles && campaign.mediaFiles.length > 0) {
          campaignMediaFiles = campaign.mediaFiles;
          console.log(`📎 Campaign has ${campaignMediaFiles.length} media files:`, campaignMediaFiles.map(f => f.name));
        }
      } catch (error) {
        console.log('Could not find campaign:', error.message);
      }
    }

    // 🔧 COMPREHENSIVE MESSAGE CLEANING FIX
    if (finalMessage) {
      // Step 1: Convert to string and handle different data types
      finalMessage = String(finalMessage);
      
      // Step 2: Remove control characters, BOM, and invalid Unicode
      finalMessage = finalMessage
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
        .replace(/[\uFEFF\uFFFE\uFFFF]/g, '') // Remove BOM and invalid Unicode
        .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove additional control chars
        .trim();
      
      // Step 3: Handle special characters that might cause issues
      finalMessage = finalMessage
        .replace(/[""]/g, '"') // Normalize quotes
        .replace(/['']/g, "'") // Normalize apostrophes
        .replace(/…/g, '...') // Replace ellipsis
        .replace(/–/g, '-') // Replace en-dash
        .replace(/—/g, '--') // Replace em-dash
        .normalize('NFKC'); // Normalize Unicode
      
      // Step 4: Ensure message length is reasonable
      if (finalMessage.length > 4096) {
        finalMessage = finalMessage.substring(0, 4096) + '...';
        console.log(`⚠️ Message was too long, truncated to 4096 characters`);
      }
      
      // Step 5: Final validation - ensure message is not empty
      if (!finalMessage || finalMessage.length === 0) {
        finalMessage = "Hello! We have an important message for you from Divine Financial Group.";
        console.log(`⚠️ Message was empty after cleaning, using fallback message`);
      }
      
      console.log(`✅ Final cleaned message: "${finalMessage.substring(0, 100)}..."`);
      console.log(`📊 Message length: ${finalMessage.length} characters`);
      console.log(`🔍 DEBUG FULL MESSAGE: "${finalMessage}"`);
    } else {
      finalMessage = "Hello! We have an important message for you from Divine Financial Group.";
      console.log(`⚠️ No message content available, using fallback message`);
    }

    // 🎯 ENABLE MEDIA SENDING: Process [IMAGE: filename] tags to send actual images
    console.log(`🎯 MEDIA SENDING ENABLED - Processing image references`);
    const shouldSendMedia = true; // Enable media sending
    let primaryMediaUrl = null;
    
    // Process [IMAGE: filename] references in message text
    const imageTagRegex = /\[IMAGE:\s*([^\]]+)\]/g;
    const imageMatches = finalMessage.match(imageTagRegex);
    
    if (imageMatches) {
      console.log(`🖼️ Found ${imageMatches.length} image references in message:`);
      imageMatches.forEach(match => console.log(`   ${match}`));
      
      // Extract filename from first image tag
      const firstImageMatch = imageMatches[0].match(/\[IMAGE:\s*([^\]]+)\]/);
      if (firstImageMatch && firstImageMatch[1]) {
        const filename = firstImageMatch[1].trim();
        // Look for this file in uploads directory
        primaryMediaUrl = publicMediaUrl(filename);
        console.log(`📎 Setting primary media URL from image tag: ${primaryMediaUrl}`);
        
        // Remove the image tag from the message text for cleaner display
        finalMessage = finalMessage.replace(imageTagRegex, '').trim();
        console.log(`📝 Cleaned message text (removed image tags)`);
        console.log(`🔍 DEBUG MESSAGE AFTER IMAGE TAG REMOVAL: "${finalMessage}" (length: ${finalMessage.length})`);
        
        // 🔧 FIX: Ensure message is not empty after removing image tags
        if (!finalMessage || finalMessage.length === 0) {
          finalMessage = "Hello! We have an important message for you from Divine Financial Group.";
          console.log(`⚠️ Message was empty after removing image tags, using fallback message`);
        }
      }
    }
    
    // Log media files if they exist (for debugging)
    if (campaignMediaFiles.length > 0) {
      console.log(`📎 Campaign has ${campaignMediaFiles.length} media files:`);
      campaignMediaFiles.forEach((media, i) => {
        console.log(`   ${i + 1}. ${media.name} (${media.type}) - Size: ${media.size}`);
        console.log(`      Preview: ${media.preview}`);
        console.log(`      File: ${media.file}`);
      });
    }
    
    // Future media handling code (disabled for now)
    /*
    // Handle campaign media files
    if (!primaryMediaUrl && campaignMediaFiles.length > 0) {
      const mediaFile = campaignMediaFiles[0];
      
      // Check if it's a blob URL (frontend upload) or server path
      if (mediaFile.preview && mediaFile.preview.startsWith('blob:')) {
        console.log(`⚠️ Found blob URL in campaign media, cannot send: ${mediaFile.preview}`);
        console.log(`📝 Media upload needed. Use the /api/campaigns/upload-media endpoint first.`);
        primaryMediaUrl = null;
      } else if (mediaFile.preview && mediaFile.preview.startsWith('/uploads/')) {
        // Convert relative path to full URL
        primaryMediaUrl = `http://localhost:5000${mediaFile.preview}`;
        console.log(`📎 Using server media file: ${primaryMediaUrl}`);
      } else if (mediaFile.file) {
        // Use file path directly
        primaryMediaUrl = mediaFile.file;
        console.log(`📎 Using local file path: ${primaryMediaUrl}`);
      }
    }
    */
    
    if (shouldSendMedia && primaryMediaUrl) {
      console.log(`📎 Media will be included in campaign messages. URL: ${primaryMediaUrl}`);
    } else {
      console.log(`📝 Sending text-only campaign messages`);
      if (campaignMediaFiles.length > 0) {
        console.log(`⚠️ Campaign has media files but they cannot be sent (blob URLs or invalid paths)`);
      }
    }

    // 🚀 ULTRA-SAFE SMART CAMPAIGN BATCHING SYSTEM
    // 🛡️ ANTI-BAN PROTECTION: Randomized timing + human-like patterns
    // WhatsApp's REAL enforcement is much stricter than documented limits
    
    let batchConfig = {
      batchSize: 5,            // VERY conservative - max 5 per batch
      messageDelay: 8000,      // 8 seconds base delay between messages
      batchDelay: 120000,      // 2 minutes between batches (120 seconds)
      maxMessagesPerMinute: 6, // Ultra-safe: 6 msgs/min = 360/hour
      adaptiveTiming: true,    // Automatically adjust if rate limiting detected
      maxRetries: 2,
      
      // 🎲 RANDOMIZATION for human-like behavior
      randomizeDelay: true,           // Add random variance to delays
      delayVariance: 0.3,              // ±30% variance on delays
      randomizeBatchSize: true,        // Vary batch sizes
      batchSizeVariance: 2,            // ±2 contacts per batch
      
      // 🕐 TIME-BASED SAFETY
      respectBusinessHours: true,      // Slow down outside business hours
      pauseAtNight: false,             // Don't pause (set true to stop 10PM-8AM)
      
      // 📊 PATTERN BREAKING
      insertRandomPauses: true,        // Random longer pauses every N batches
      pauseFrequency: 5,               // Extra pause every 5 batches
      randomPauseDuration: 300000,     // 5 min random pause (180-420s range)
      
      // Progress callback to log status
      onProgress: (progress) => {
        console.log(`📊 Campaign Progress: ${progress.currentBatch}/${progress.totalBatches} batches (${Math.round(progress.progress)}%) - Sent: ${progress.sent}, Failed: ${progress.failed}`);
      },
      
      // Error callback for critical issues
      onError: (error) => {
        console.error(`🚨 Campaign Error:`, error);
      }
    };
    
    // 🎯 ULTRA-SAFE CAMPAIGN SIZE CONFIGURATIONS
    // Based on REAL WhatsApp enforcement (not published limits)
    // Goal: NEVER get banned, even if it takes longer
    
    if (phoneNumbers.length > 5000) {
      // 🐌 MASSIVE campaigns (5K+) - EXTREMELY conservative
      batchConfig.batchSize = 3;          // Only 3 per batch
      batchConfig.messageDelay = 15000;   // 15 seconds between messages
      batchConfig.batchDelay = 300000;    // 5 minutes between batches
      batchConfig.maxMessagesPerMinute = 4;
      batchConfig.randomPauseDuration = 600000; // 10 min pauses
      batchConfig.pauseFrequency = 3;     // Pause every 3 batches
      console.log(`� MASSIVE campaign (${phoneNumbers.length} recipients) - ULTRA-SAFE mode`);
      console.log(`   ⚠️ Anti-ban protection: MAXIMUM`);
      console.log(`   ⏱️ Estimated: ${Math.round((phoneNumbers.length * 15 + Math.ceil(phoneNumbers.length / 3) * 300 + Math.floor(Math.ceil(phoneNumbers.length / 3) / 3) * 600) / 3600)}h (slow but SAFE)`);
      console.log(`   🛡️ Random delays: ±30%, Batch size variance: ±2`);
    } else if (phoneNumbers.length > 2000) {
      // 🚶 Very large campaigns (2K-5K) - Extra conservative
      batchConfig.batchSize = 4;          // 4 per batch
      batchConfig.messageDelay = 12000;   // 12 seconds between messages
      batchConfig.batchDelay = 240000;    // 4 minutes between batches
      batchConfig.maxMessagesPerMinute = 5;
      batchConfig.randomPauseDuration = 480000; // 8 min pauses
      batchConfig.pauseFrequency = 4;     // Pause every 4 batches
      console.log(`� VERY LARGE campaign (${phoneNumbers.length} recipients) - Extra conservative`);
      console.log(`   ⚠️ Anti-ban protection: HIGH`);
      console.log(`   ⏱️ Estimated: ${Math.round((phoneNumbers.length * 12 + Math.ceil(phoneNumbers.length / 4) * 240) / 3600)}h`);
      console.log(`   🛡️ Random delays: ±30%, Batch size variance: ±2`);
    } else if (phoneNumbers.length > 1000) {
      // 🚶‍♂️ Large campaigns (1K-2K) - Conservative
      batchConfig.batchSize = 5;          // 5 per batch
      batchConfig.messageDelay = 10000;   // 10 seconds between messages
      batchConfig.batchDelay = 180000;    // 3 minutes between batches
      batchConfig.maxMessagesPerMinute = 6;
      batchConfig.randomPauseDuration = 360000; // 6 min pauses
      batchConfig.pauseFrequency = 5;     // Pause every 5 batches
      console.log(`🚶‍♂️ LARGE campaign (${phoneNumbers.length} recipients) - Conservative mode`);
      console.log(`   ⚠️ Anti-ban protection: MEDIUM-HIGH`);
      console.log(`   ⏱️ Estimated: ${Math.round((phoneNumbers.length * 10 + Math.ceil(phoneNumbers.length / 5) * 180) / 3600)}h`);
      console.log(`   🛡️ Random delays: ±30%, Batch size variance: ±2`);
    } else if (phoneNumbers.length > 500) {
      // 🏃 Medium-large campaigns (500-1K) - Balanced safety
      batchConfig.batchSize = 6;          // 6 per batch
      batchConfig.messageDelay = 8000;    // 8 seconds between messages
      batchConfig.batchDelay = 120000;    // 2 minutes between batches
      batchConfig.maxMessagesPerMinute = 7;
      batchConfig.randomPauseDuration = 300000; // 5 min pauses
      batchConfig.pauseFrequency = 6;     // Pause every 6 batches
      console.log(`🏃 MEDIUM-LARGE campaign (${phoneNumbers.length} recipients) - Balanced mode`);
      console.log(`   ⚠️ Anti-ban protection: MEDIUM`);
      console.log(`   ⏱️ Estimated: ${Math.round((phoneNumbers.length * 8 + Math.ceil(phoneNumbers.length / 6) * 120) / 60)}m`);
      console.log(`   🛡️ Random delays: ±30%, Batch size variance: ±2`);
    } else if (phoneNumbers.length > 100) {
      // 🏃‍♀️ Medium campaigns (100-500) - Standard safe mode
      batchConfig.batchSize = 7;          // 7 per batch
      batchConfig.messageDelay = 6000;    // 6 seconds between messages
      batchConfig.batchDelay = 90000;     // 90 seconds between batches
      batchConfig.maxMessagesPerMinute = 8;
      batchConfig.randomPauseDuration = 240000; // 4 min pauses
      batchConfig.pauseFrequency = 7;     // Pause every 7 batches
      console.log(`🏃‍♀️ MEDIUM campaign (${phoneNumbers.length} recipients) - Standard safe mode`);
      console.log(`   ⚠️ Anti-ban protection: MEDIUM`);
      console.log(`   ⏱️ Estimated: ${Math.round((phoneNumbers.length * 6 + Math.ceil(phoneNumbers.length / 7) * 90) / 60)}m`);
      console.log(`   🛡️ Random delays: ±30%, Batch size variance: ±2`);
    } else if (phoneNumbers.length > 50) {
      // 🏃‍♂️ Small campaigns (50-100) - Faster but still safe
      batchConfig.batchSize = 8;          // 8 per batch
      batchConfig.messageDelay = 5000;    // 5 seconds between messages
      batchConfig.batchDelay = 60000;     // 60 seconds between batches
      batchConfig.maxMessagesPerMinute = 10;
      batchConfig.randomPauseDuration = 180000; // 3 min pauses
      batchConfig.pauseFrequency = 8;     // Pause every 8 batches
      console.log(`🏃‍♂️ SMALL campaign (${phoneNumbers.length} recipients) - Fast safe mode`);
      console.log(`   ⚠️ Anti-ban protection: LOW-MEDIUM`);
      console.log(`   ⏱️ Estimated: ${Math.round((phoneNumbers.length * 5 + Math.ceil(phoneNumbers.length / 8) * 60) / 60)}m`);
      console.log(`   🛡️ Random delays: ±30%, Batch size variance: ±2`);
    } else if (phoneNumbers.length > 20) {
      // 💨 Tiny campaigns (20-50) - Quick but randomized
      batchConfig.batchSize = 10;         // 10 per batch
      batchConfig.messageDelay = 4000;    // 4 seconds between messages
      batchConfig.batchDelay = 45000;     // 45 seconds between batches
      batchConfig.maxMessagesPerMinute = 12;
      batchConfig.insertRandomPauses = false; // Skip extra pauses for small campaigns
      console.log(`� TINY campaign (${phoneNumbers.length} recipients) - Quick mode`);
      console.log(`   ⚠️ Anti-ban protection: LOW`);
      console.log(`   ⏱️ Estimated: ${Math.round((phoneNumbers.length * 4 + Math.ceil(phoneNumbers.length / 10) * 45) / 60)}m`);
      console.log(`   🛡️ Random delays: ±30%`);
    } else {
      // ⚡ Very small campaigns (<20) - Minimal batching with delays
      batchConfig.batchSize = phoneNumbers.length;
      batchConfig.messageDelay = 3000;    // Still 3 seconds minimum
      batchConfig.batchDelay = 0;
      batchConfig.maxMessagesPerMinute = 15;
      batchConfig.insertRandomPauses = false;
      batchConfig.randomizeBatchSize = false; // No need for tiny lists
      console.log(`⚡ MICRO campaign (${phoneNumbers.length} recipients) - Minimal batching`);
      console.log(`   ⚠️ Anti-ban protection: MINIMAL`);
      console.log(`   ⏱️ Estimated: ${Math.round(phoneNumbers.length * 3 / 60)}m`);
    }
    
    console.log(`🚀 SMART BATCHING CONFIG:`);
    console.log(`   📦 Batch size: ${batchConfig.batchSize}`);
    console.log(`   ⏱️ Message delay: ${batchConfig.messageDelay}ms`);
    console.log(`   ⏳ Batch delay: ${batchConfig.batchDelay}ms`);
    console.log(`   🎯 Max messages/minute: ${batchConfig.maxMessagesPerMinute}`);
    
    // Create batcher instance
    const batcher = new SmartCampaignBatcher(batchConfig);
    
    // Prepare campaign data for batcher
    const campaignData = {
      userId,
      campaignId,
      phoneNumbers,
      finalMessage,
      client,
      shouldSendMedia,
      primaryMediaUrl,
      campaign,
      contactMap  // 🎯 NEW: Pass contact details for personalization
    };
    
    // Process campaign with smart batching
    console.log(`🚀 Starting smart batched campaign for ${phoneNumbers.length} recipients`);
    console.log(`📝 Message personalization: ${contactMap.size > 0 ? 'ENABLED ✅' : 'DISABLED ⚠️'}`);
    const batchResults = await batcher.processCampaign(campaignData);
    
    // Merge batch results into expected format
    const results = {
      sent: batchResults.sent,
      failed: batchResults.failed,
      errors: batchResults.errors,
      details: batchResults.details,
      messageIds: batchResults.messageIds,
      
      // Additional batching info
      batching: {
        totalBatches: batchResults.batches.length,
        batchSize: batchConfig.batchSize,
        timing: batchResults.timing,
        batches: batchResults.batches
      }
    };

    console.log(`📊 Smart Campaign Complete:`);
    console.log(`   ✅ Sent: ${results.sent} messages`);
    console.log(`   ❌ Failed: ${results.failed} messages`);
    console.log(`   📦 Batches: ${results.batching.totalBatches}`);
    console.log(`   ⏱️ Duration: ${Math.round(results.batching.timing.totalDuration / 1000)}s`);
    console.log(`   📈 Avg/message: ${Math.round(results.batching.timing.averageMessageTime)}ms`);

    // Enhanced response with batching information
    res.json({
      success: results.sent > 0,
      message: `Smart campaign sent to ${results.sent} of ${phoneNumbers.length} recipients in ${results.batching.totalBatches} batches`,
      sent: results.sent,
      failed: results.failed,
      total: phoneNumbers.length,
      errors: results.errors,
      details: results.details,
      messageIds: results.messageIds,
      
      // Campaign tracking ID for progress monitoring
      campaignId: campaignId,
      
      // Initial progress data for frontend tracker
      initialProgress: {
        sent: results.sent,
        failed: results.failed,
        total: phoneNumbers.length,
        currentBatch: results.batching.totalBatches,
        totalBatches: results.batching.totalBatches,
        completed: true, // Campaign is completed when this response is sent
        details: results.details.slice(-10) // Last 10 for initial display
      },
      
      // Batching information for frontend
      batching: {
        enabled: true,
        totalBatches: results.batching.totalBatches,
        batchSize: batchConfig.batchSize,
        messageDelay: batchConfig.messageDelay,
        batchDelay: batchConfig.batchDelay,
        timing: results.batching.timing,
        batchDetails: results.batching.batches.map(batch => ({
          batchNumber: batch.batchNumber,
          size: batch.size,
          duration: Math.round(batch.duration / 1000),
          averageMessageTime: Math.round(batch.averageMessageTime)
        }))
      },
      
      // Performance metrics
      performance: {
        totalDuration: Math.round(results.batching.timing.totalDuration / 1000),
        averageMessageTime: Math.round(results.batching.timing.averageMessageTime),
        messagesPerMinute: results.sent > 0 ? Math.round((results.sent * 60000) / results.batching.timing.totalDuration) : 0,
        successRate: Math.round((results.sent / phoneNumbers.length) * 100)
      }
    });
  } catch (error) {
    console.error('Campaign sending error:', error);
    res.status(500).json({ 
      message: 'Server error during campaign sending',
      error: error.message 
    });
  }
});

// Get campaign progress - NEW ENDPOINT for real-time tracking
router.get('/campaign-progress/:campaignId', auth, async (req, res) => {
  try {
    const { campaignId } = req.params;
    const userId = req.user.id;

    // Get recent analytics for this campaign
    const analytics = await MessageAnalytics.find({
      user: userId,
      campaign: campaignId
    }).sort({ createdAt: -1 }).limit(100);

    if (analytics.length === 0) {
      return res.json({
        sent: 0,
        failed: 0,
        total: 0,
        currentBatch: 0,
        totalBatches: 0,
        completed: false,
        details: []
      });
    }

    // Calculate progress statistics
    const sent = analytics.filter(a => a.status === 'sent').length;
    const failed = analytics.filter(a => a.status === 'failed').length;
    const pending = analytics.filter(a => a.status === 'pending').length;
    const total = analytics.length;

    // Extract batch information if available
    const batchInfo = analytics
      .filter(a => a.metadata?.batchNumber)
      .map(a => a.metadata.batchNumber);
    
    const currentBatch = batchInfo.length > 0 ? Math.max(...batchInfo) : 0;
    const totalBatches = analytics.length > 0 && analytics[0].metadata?.totalBatches 
      ? analytics[0].metadata.totalBatches 
      : Math.ceil(total / 8); // Estimate if not available

    // Recent activity details (last 20 items)
    const details = analytics.slice(0, 20).map(a => ({
      phone: a.recipientPhone,
      status: a.status,
      error: a.failureReason,
      batchNumber: a.metadata?.batchNumber,
      timestamp: a.createdAt
    }));

    // Check if campaign is completed (no pending messages)
    const completed = pending === 0 && (sent + failed) === total;

    // Performance metrics if completed
    let performance = null;
    if (completed && analytics.length > 0) {
      const firstMessage = analytics[analytics.length - 1];
      const lastMessage = analytics[0];
      const duration = new Date(lastMessage.createdAt) - new Date(firstMessage.createdAt);
      
      performance = {
        totalDuration: duration,
        messagesPerMinute: duration > 0 ? Math.round((sent * 60000) / duration) : 0,
        successRate: Math.round((sent / total) * 100)
      };
    }

    res.json({
      sent,
      failed,
      pending,
      total,
      currentBatch,
      totalBatches,
      completed,
      details,
      performance,
      batching: {
        enabled: true,
        batchSize: 8, // Current smart batching size for large campaigns
        currentBatch,
        totalBatches
      }
    });

  } catch (error) {
    console.error('Error getting campaign progress:', error);
    res.status(500).json({ 
      message: 'Failed to get campaign progress',
      error: error.message 
    });
  }
});

// Get WhatsApp client status - Enhanced with diagnostic info
router.get('/status', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const client = whatsappClients.get(userId);
    const status = connectionStatus.get(userId) || 'disconnected';
    const qrCode = qrCodes.get(userId);

    if (!client) {
      return res.json({ 
        status: 'disconnected',
        hasClient: false,
        hasQR: false,
        qrCode: null,
        clientInfo: null,
        canSendMessages: false
      });
    }

    // 🔧 ENHANCED STATUS CHECK with client validation
    let clientInfo = null;
    let clientState = 'unknown';
    let canSendMessages = false;
    
    try {
      // Validate client integrity
      if (typeof client.getState === 'function') {
        clientState = await client.getState();
        canSendMessages = (clientState === 'CONNECTED');
        
        if (typeof client.info === 'function') {
          try {
            clientInfo = await client.info();
          } catch (infoError) {
            console.log('Client info not available:', infoError.message);
            clientInfo = { state: clientState, isReady: canSendMessages, phoneNumber: null, name: null };
          }
        } else {
          clientInfo = { state: clientState, isReady: canSendMessages, phoneNumber: null, name: null };
        }
      } else {
        console.error('❌ Client exists but getState method missing - client corrupted');
        clientState = 'corrupted';
        canSendMessages = false;
      }
    } catch (stateError) {
      console.error('❌ Error checking client state:', stateError.message);
      clientState = 'error';
      canSendMessages = false;
      clientInfo = { error: stateError.message };
    }

    res.json({ 
      status: status,
      hasClient: true,
      hasQR: !!qrCode,
      qrCode: qrCode,
      clientInfo: clientInfo,
      canSendMessages: canSendMessages,
      diagnostics: {
        clientType: typeof client,
        hasGetState: typeof client.getState === 'function',
        hasSendMessage: typeof client.sendMessage === 'function',
        hasInfo: typeof client.info === 'function',
        clientState: clientState
      }
    });
  } catch (error) {
    console.error('Status check error:', error.message);
    res.status(500).json({ 
      error: 'Server error during status check',
      message: error.message 
    });
  }
});

// Disconnect WhatsApp client
router.post('/disconnect', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const client = whatsappClients.get(userId);

    if (client) {
      await client.destroy();
      whatsappClients.delete(userId);
    }

    res.json({ message: 'WhatsApp client disconnected' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Clear session data
router.post('/clear-session', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const fs = require('fs');
    const path = require('path');
    
    // Disconnect client if exists
    const client = whatsappClients.get(userId);
    if (client) {
      try {
        await client.destroy();
      } catch (e) {
        console.log('Error destroying client:', e.message);
      }
      whatsappClients.delete(userId);
    }
    
    // Clear in-memory data
    qrCodes.delete(userId);
    connectionStatus.delete(userId);
    
    // Clear session files
    const sessionDir = `./whatsapp_sessions/session-user_${userId}`;
    const sessionFile = `./whatsapp_sessions/session_status_${userId}.json`;
    
    try {
      if (fs.existsSync(sessionFile)) {
        fs.unlinkSync(sessionFile);
        console.log(`🗑️ Deleted session status file for user ${userId}`);
      }
      
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
        console.log(`🗑️ Deleted session directory for user ${userId}`);
      }
    } catch (fsError) {
      console.log('Error clearing session files:', fsError.message);
    }
    
    res.json({ 
      message: 'Session data cleared successfully',
      clearedItems: {
        client: client ? 'destroyed' : 'not found',
        qrCode: 'cleared',
        status: 'cleared',
        sessionFiles: 'cleared'
      }
    });
  } catch (error) {
    console.error('Clear session error:', error.message);
    res.status(500).json({ 
      error: 'Failed to clear session data',
      details: error.message 
    });
  }
});

module.exports = router;
