/**
 * 🚀 SMART CAMPAIGN BATCHING SYSTEM
 * 
 * Implements intelligent batching for WhatsApp campaigns to prevent rate limiting
 * and ensure compliance with WhatsApp policies when sending to large contact lists.
 * 
 * Features:
 * - Configurable batch sizes and delays
 * - Rate limiting detection and adaptive timing
 * - Campaign progress tracking and resumption
 * - WhatsApp policy compliance
 * - Error categorization and recovery
 * 
 * Usage: Replace the current send-campaign loop with smart batching logic
 */

const mongoose = require('mongoose');
const MessageAnalytics = require('./models/MessageAnalytics');
const MessageLog = require('./models/MessageLog'); // 📊 NEW: Real-time analytics logging
const Campaign = require('./models/Campaign');

class SmartCampaignBatcher {
  constructor(config = {}) {
    // Configurable batching parameters
    this.config = {
      // Batch size - start conservative for WhatsApp compliance
      batchSize: config.batchSize || 10,
      
      // Delay between individual messages in a batch (milliseconds)
      messageDelay: config.messageDelay || 3000, // 3 seconds
      
      // Delay between batches (milliseconds)
      batchDelay: config.batchDelay || 30000, // 30 seconds
      
      // Maximum messages per minute (WhatsApp limit is ~20-25)
      maxMessagesPerMinute: config.maxMessagesPerMinute || 15,
      
      // Adaptive timing - increase delays if rate limiting detected
      adaptiveTiming: config.adaptiveTiming !== false,
      
      // Maximum retries for failed messages
      maxRetries: config.maxRetries || 2,
      
      // Progress callback function
      onProgress: config.onProgress || null,
      
      // Error callback function
      onError: config.onError || null
    };
    
    // Runtime state
    this.state = {
      currentBatch: 0,
      totalBatches: 0,
      sentCount: 0,
      failedCount: 0,
      rateLimitDetected: false,
      lastBatchTime: null,
      campaignStartTime: null,
      paused: false,
      stopped: false
    };
    
    // Rate limiting detection
    this.rateLimitHistory = [];
    this.adaptiveDelayMultiplier = 1;
  }

  /**
   * Process a campaign with smart batching
   */
  async processCampaign(campaignData) {
    const {
      userId,
      campaignId,
      phoneNumbers,
      finalMessage,
      client,
      shouldSendMedia,
      primaryMediaUrl,
      campaign,
      contactMap = new Map()  // 🎯 NEW: Contact details for personalization
    } = campaignData;

    console.log(`🚀 SMART CAMPAIGN BATCHING: Processing ${phoneNumbers.length} recipients`);
    console.log(`📊 Batch configuration: ${this.config.batchSize} per batch, ${this.config.batchDelay}ms between batches`);
    console.log(`👤 Personalization: ${contactMap.size} contacts with names`);

    // Initialize state
    this.state.totalBatches = Math.ceil(phoneNumbers.length / this.config.batchSize);
    this.state.campaignStartTime = new Date();
    this.state.currentBatch = 0;
    this.state.sentCount = 0;
    this.state.failedCount = 0;

    const results = {
      sent: 0,
      failed: 0,
      errors: [],
      details: [],
      messageIds: [],
      batches: [],
      timing: {
        startTime: this.state.campaignStartTime,
        endTime: null,
        totalDuration: null,
        averageMessageTime: null
      }
    };

    console.log(`📦 Will process ${this.state.totalBatches} batches`);

    // Create batches
    const batches = this.createBatches(phoneNumbers);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      if (this.state.stopped) {
        console.log(`🛑 Campaign stopped at batch ${batchIndex + 1}/${batches.length}`);
        break;
      }

      this.state.currentBatch = batchIndex + 1;
      const batch = batches[batchIndex];
      
      console.log(`\n📦 Processing batch ${this.state.currentBatch}/${this.state.totalBatches} (${batch.length} recipients)`);

      // Calculate timing for this batch
      const batchTiming = this.calculateBatchTiming();
      
      const batchResult = await this.processBatch({
        batch,
        batchIndex,
        userId,
        campaignId,
        finalMessage,
        client,
        shouldSendMedia,
        primaryMediaUrl,
        campaign,
        timing: batchTiming,
        contactMap  // 🎯 Pass contact details for personalization
      });

      // Merge batch results
      results.sent += batchResult.sent;
      results.failed += batchResult.failed;
      results.errors.push(...batchResult.errors);
      results.details.push(...batchResult.details);
      results.messageIds.push(...batchResult.messageIds);
      results.batches.push(batchResult.batchInfo);

      // Update state
      this.state.sentCount = results.sent;
      this.state.failedCount = results.failed;
      this.state.lastBatchTime = new Date();

      // Progress callback
      if (this.config.onProgress) {
        this.config.onProgress({
          currentBatch: this.state.currentBatch,
          totalBatches: this.state.totalBatches,
          sent: results.sent,
          failed: results.failed,
          progress: (this.state.currentBatch / this.state.totalBatches) * 100
        });
      }

      // Check for critical errors that should stop the campaign
      if (batchResult.shouldStopCampaign) {
        console.log(`🛑 Critical error detected, stopping campaign`);
        this.state.stopped = true;
        
        results.errors.push({
          type: 'CAMPAIGN_STOPPED',
          message: `Campaign stopped due to critical error in batch ${this.state.currentBatch}`,
          remainingBatches: batches.length - batchIndex - 1,
          remainingRecipients: batches.slice(batchIndex + 1).reduce((sum, b) => sum + b.length, 0)
        });
        
        break;
      }

      // Inter-batch delay (skip for last batch)
      if (batchIndex < batches.length - 1) {
        // 🎲 Check if we should insert a random pause (pattern breaking)
        if (this.shouldInsertRandomPause(batchIndex)) {
          const pauseDuration = this.getRandomPauseDuration();
          console.log(`\n🎲 RANDOM PAUSE: Inserting ${Math.round(pauseDuration / 1000)}s pattern-breaking pause...`);
          console.log(`   (Every ${this.config.pauseFrequency} batches for anti-detection)`);
          await this.delay(pauseDuration);
        }
        
        // 🎲 Standard inter-batch delay with randomization
        const baseBatchDelay = this.calculateBatchDelay();
        const randomizedBatchDelay = this.getRandomizedDelay(baseBatchDelay);
        
        console.log(`⏳ Waiting ${Math.round(randomizedBatchDelay / 1000)}s before next batch (base: ${Math.round(baseBatchDelay / 1000)}s)...`);
        await this.delay(randomizedBatchDelay);
      }
    }

    // Finalize results
    results.timing.endTime = new Date();
    results.timing.totalDuration = results.timing.endTime - results.timing.startTime;
    results.timing.averageMessageTime = results.sent > 0 ? results.timing.totalDuration / results.sent : 0;

    console.log(`\n📊 CAMPAIGN COMPLETE:`);
    console.log(`   ✅ Sent: ${results.sent}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    console.log(`   ⏱️ Duration: ${Math.round(results.timing.totalDuration / 1000)}s`);
    console.log(`   📈 Avg per message: ${Math.round(results.timing.averageMessageTime)}ms`);

    return results;
  }

  /**
   * Create batches from phone numbers array with randomization
   */
  createBatches(phoneNumbers) {
    const batches = [];
    let currentIndex = 0;
    
    // 🎲 Randomize batch sizes if enabled
    if (this.config.randomizeBatchSize && this.config.batchSizeVariance > 0) {
      console.log(`🎲 Creating randomized batches (base: ${this.config.batchSize} ± ${this.config.batchSizeVariance})`);
      
      while (currentIndex < phoneNumbers.length) {
        // Calculate random batch size with variance
        const variance = Math.floor(Math.random() * (this.config.batchSizeVariance * 2 + 1)) - this.config.batchSizeVariance;
        const batchSize = Math.max(1, this.config.batchSize + variance);
        const remainingContacts = phoneNumbers.length - currentIndex;
        const actualBatchSize = Math.min(batchSize, remainingContacts);
        
        batches.push(phoneNumbers.slice(currentIndex, currentIndex + actualBatchSize));
        currentIndex += actualBatchSize;
      }
      
      console.log(`   📦 Created ${batches.length} batches with randomized sizes (${batches.map(b => b.length).join(', ')})`);
    } else {
      // Standard fixed batch sizes
      for (let i = 0; i < phoneNumbers.length; i += this.config.batchSize) {
        batches.push(phoneNumbers.slice(i, i + this.config.batchSize));
      }
      console.log(`   📦 Created ${batches.length} batches with fixed size ${this.config.batchSize}`);
    }
    
    return batches;
  }

  /**
   * Process a single batch of messages
   */
  async processBatch(batchData) {
    const {
      batch,
      batchIndex,
      userId,
      campaignId,
      finalMessage,
      client,
      shouldSendMedia,
      primaryMediaUrl,
      campaign,
      timing,
      contactMap = new Map()  // 🎯 Contact details for personalization
    } = batchData;

    const batchResults = {
      sent: 0,
      failed: 0,
      errors: [],
      details: [],
      messageIds: [],
      shouldStopCampaign: false,
      batchInfo: {
        batchNumber: batchIndex + 1,
        size: batch.length,
        startTime: new Date(),
        endTime: null,
        duration: null,
        averageMessageTime: null
      }
    };

    console.log(`📦 Batch ${batchIndex + 1}: Starting ${batch.length} messages`);

    for (let i = 0; i < batch.length; i++) {
      if (this.state.stopped) break;

      const phone = batch[i];
      const messageStartTime = new Date();

      try {
        // Pre-send validation
        await this.validateClientBeforeSend(client, userId);

        // Format phone number
        let phoneNumber = phone.replace(/\D/g, '');
        if (!phoneNumber.startsWith('1') && phoneNumber.length === 10) {
          phoneNumber = '1' + phoneNumber;
        }
        const chatId = `${phoneNumber}@c.us`;

        console.log(`📱 Batch ${batchIndex + 1}[${i + 1}/${batch.length}]: Sending to ${chatId}`);

        // 🎯 PERSONALIZATION INJECTION (CRITICAL FOR ANTI-BAN!)
        // Look up contact details for this phone number
        const normalizedPhone = phoneNumber;
        const contactInfo = contactMap.get(phone) || contactMap.get(normalizedPhone);
        
        let recipientName = null;
        let recipientFirstName = null;
        
        if (contactInfo && contactInfo.name) {
          recipientName = contactInfo.name;
          recipientFirstName = contactInfo.firstName || contactInfo.name.split(' ')[0];
          console.log(`👤 Personalizing for: ${recipientName} (${phone})`);
        } else {
          console.warn(`⚠️ No name found for ${phone} - using generic greeting (ban risk!)`);
        }

        // 🎯 WHATSAPP-SPECIFIC MESSAGE FORMATTING
        // WhatsApp has limitations with formatting - we need to use WhatsApp-compatible methods
        let formattedMessage = finalMessage;
        
        // 🎯 STEP 0: PERSONALIZE THE MESSAGE (Before any formatting!)
        // This is THE MOST IMPORTANT anti-ban feature!
        if (recipientFirstName) {
          // Replace common placeholders with actual name
          formattedMessage = formattedMessage
            .replace(/\{firstName\}/gi, recipientFirstName)
            .replace(/\{name\}/gi, recipientName)
            .replace(/\{first_name\}/gi, recipientFirstName)
            .replace(/\{full_name\}/gi, recipientName);
          
          // If no placeholders found, intelligently inject name at the start
          if (!formattedMessage.includes(recipientFirstName)) {
            // Check if message starts with a greeting
            const greetingPattern = /^(hi|hello|hey|dear|greetings)/i;
            if (greetingPattern.test(formattedMessage.trim())) {
              // Insert name after greeting: "Hello" → "Hello Vincent"
              formattedMessage = formattedMessage.trim().replace(
                greetingPattern, 
                (match) => `${match} ${recipientFirstName}`
              );
            } else {
              // No greeting found, add one at the start
              formattedMessage = `Hi ${recipientFirstName}! 👋\n\n${formattedMessage}`;
            }
            console.log(`✅ Personalized greeting injected: "Hi ${recipientFirstName}!"`);
          } else {
            console.log(`✅ Message already contains "${recipientFirstName}" (personalized)`);
          }
        } else {
          // NO NAME AVAILABLE - Add generic but friendly greeting
          console.warn(`⚠️ CRITICAL: No personalization possible for ${phone}`);
          console.warn(`⚠️ This increases WhatsApp ban risk significantly!`);
          
          // Try to make it less spammy by adding a friendly greeting
          if (!/^(hi|hello|hey|dear|greetings)/i.test(formattedMessage.trim())) {
            formattedMessage = `Hello there! 👋\n\n${formattedMessage}`;
            console.log(`⚡ Added generic greeting to reduce spam appearance`);
          }
        }
        
        // Step 1: Normalize line breaks to ensure consistency
        formattedMessage = formattedMessage
          .replace(/\r\n/g, '\n')     // Windows line endings to Unix
          .replace(/\r/g, '\n');      // Old Mac line endings to Unix
        
        // Step 2: WhatsApp-Optimized Spacing Preservation
        // WhatsApp collapses multiple spaces, so we use special characters for structure
        formattedMessage = formattedMessage
          .replace(/━━━━━━━━━━━━━━━━━━━━━/g, '▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔')  // Different Unicode divider
          .replace(/    /g, '\u2003\u2003')   // Em spaces for 4-space indents
          .replace(/   /g, '\u2003')          // Em space for 3-space indents  
          .replace(/  /g, '\u2002')           // En space for 2-space indents
          .replace(/\n\n\n+/g, '\n\n')        // Max 2 line breaks
          .replace(/\t/g, '\u2003');          // Replace tabs with em space
        
        // Step 3: Preserve emoji spacing and structure
        // Ensure emojis maintain proper spacing in WhatsApp
        formattedMessage = formattedMessage
          .replace(/(🏡|🌟|📋|✨|🎁|🔐|📞|📍|✉️|🌐|📱|💬|🎯|⭐|💼|📧|📊)/g, '\n$1 ') // Line break + emoji + space
          .replace(/(\*[^*]+\*)/g, '*$1*')    // Ensure bold formatting
          .replace(/\s{3,}/g, '\u2003')       // Replace 3+ spaces with em space
          .replace(/\n /g, '\n')              // Remove leading spaces after line breaks
          .replace(/\n\u2003/g, '\n\u2003');  // Keep intentional indentation
        
        // Step 4: Professional section separators for WhatsApp
        formattedMessage = formattedMessage
          .replace(/▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔\n([^\n])/g, '▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔\n\n$1')  // Space after dividers
          .replace(/([^\n])\n▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔/g, '$1\n\n▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔')  // Space before dividers
          .replace(/\n{3,}/g, '\n\n')         // Ensure maximum of 2 consecutive line breaks
          .trim()                             // Remove leading/trailing whitespace
          .replace(/\n\s+\n/g, '\n\n')        // Clean up whitespace-only lines
          .replace(/\s+$/gm, '');             // Remove trailing spaces from each line
        
        // Step 5: WhatsApp message length optimization
        if (formattedMessage.length > 4000) {
          formattedMessage = formattedMessage.substring(0, 4000).trim() + '\n\n📄 [Message continues...]';
          console.log(`⚠️ Message truncated for WhatsApp compatibility`);
        }
        
        console.log(`� WHATSAPP-OPTIMIZED FORMATTING:`);
        console.log(`   Original length: ${finalMessage.length} chars`);
        console.log(`   Formatted length: ${formattedMessage.length} chars`);
        console.log(`   Line breaks: ${(formattedMessage.match(/\n/g) || []).length}`);
        console.log(`   Em spaces: ${(formattedMessage.match(/\u2003/g) || []).length}`);
        console.log(`   En spaces: ${(formattedMessage.match(/\u2002/g) || []).length}`);
        console.log(`   Unicode dividers: ${(formattedMessage.match(/▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔/g) || []).length}`);
        console.log(`   Structure preserved: YES`);
        console.log(`   WhatsApp compatible: YES`);
        
        // Step 6: Validate message integrity
        if (!formattedMessage || formattedMessage.length < 10) {
          console.warn(`⚠️ Formatted message too short, using original`);
          formattedMessage = finalMessage;
        }

        // Create analytics record with formatted message
        const safeMessageContent = formattedMessage && formattedMessage.trim() && formattedMessage.trim().length > 0 
          ? formattedMessage.trim() 
          : "Professional message from Divine Financial Group";

        const messageAnalytics = new MessageAnalytics({
          user: userId,
          campaign: campaignId,
          messageId: `batch_${batchIndex + 1}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          recipientPhone: phoneNumber,
          messageContent: safeMessageContent,
          messageType: shouldSendMedia ? 'media' : 'text',
          status: 'pending',
          mediaUrl: primaryMediaUrl,
          campaignType: campaign?.type || 'bulk_send',
          metadata: {
            chatId: chatId,
            batchNumber: batchIndex + 1,
            batchPosition: i + 1,
            batchSize: batch.length,
            messageDelay: timing.messageDelay,
            batchDelay: timing.batchDelay,
            originalMessageLength: finalMessage?.length || 0,
            formattedMessageLength: formattedMessage?.length || 0,
            personalized: recipientName ? true : false,  // 🎯 Track personalization
            recipientName: recipientName  // 🎯 Store recipient name
          }
        });
        
        console.log(`📝 FORMATTED MESSAGE DEBUG:`);
        console.log(`   Original length: ${finalMessage.length}`);
        console.log(`   Formatted length: ${formattedMessage.length}`);
        console.log(`   Personalized: ${recipientName ? 'YES ✅' : 'NO ⚠️'}`);
        console.log(`   Recipient: ${recipientName || 'Unknown'}`);
        console.log(`   Line breaks: ${(formattedMessage.match(/\n/g) || []).length}`);
        console.log(`   First 200 chars: "${formattedMessage.substring(0, 200)}..."`);
        
        // 📊 Log message start event for real-time analytics
        await this.logMessageEvent({
          userId,
          campaignId,
          phone,
          contactName: recipientName, // 🎯 Include actual contact name
          status: 'pending', // Using valid enum value
          batchNumber: batchIndex + 1,
          messageStartTime
        });
        
        // Send message with appropriate type
        if (shouldSendMedia && primaryMediaUrl) {
          const sentMessage = await client.sendMessage(chatId, { 
            media: primaryMediaUrl, 
            caption: formattedMessage 
          });
          messageAnalytics.metadata.whatsappMessageId = sentMessage.id?.id;
        } else {
          const sentMessage = await client.sendMessage(chatId, formattedMessage);
          messageAnalytics.metadata.whatsappMessageId = sentMessage.id?.id;
        }

        // Update analytics with success
        messageAnalytics.status = 'sent';
        messageAnalytics.metadata.sendDuration = new Date() - messageStartTime;
        await messageAnalytics.save();

        // 📊 Log successful message delivery for real-time analytics
        await this.logMessageEvent({
          userId,
          campaignId,
          phone,
          contactName: recipientName,  // 🎯 Include actual contact name
          status: 'sent',
          batchNumber: batchIndex + 1,
          processingTime: new Date() - messageStartTime,
          messageId: messageAnalytics.messageId
        });

        // Update batch results
        batchResults.sent++;
        batchResults.messageIds.push(messageAnalytics.messageId);
        batchResults.details.push({
          phone: phone,
          status: 'sent',
          chatId: chatId,
          messageId: messageAnalytics.messageId,
          batchNumber: batchIndex + 1,
          batchPosition: i + 1,
          personalized: recipientName ? true : false  // 🎯 Track personalization
        });

        console.log(`✅ Batch ${batchIndex + 1}[${i + 1}/${batch.length}]: Sent to ${recipientName || phone}`);
        if (recipientName) {
          console.log(`   👤 Personalized message sent to: ${recipientName}`);
        }

        // 🎲 RANDOMIZED inter-message delay (skip for last message in batch)
        if (i < batch.length - 1) {
          const randomDelay = this.getRandomizedDelay(timing.messageDelay, 0.3); // ±30% variance
          console.log(`⏳ Random delay: ${randomDelay}ms (base: ${timing.messageDelay}ms)`);
          await this.delay(randomDelay);
        }

      } catch (error) {
        console.error(`❌ Batch ${batchIndex + 1}[${i + 1}/${batch.length}]: Failed to send to ${phone}:`, error.message);

        // Enhanced error categorization
        const errorInfo = this.categorizeError(error);
        
        // 📊 Log failed message for real-time analytics
        await this.logMessageEvent({
          userId,
          campaignId,
          phone,
          contactName: null,
          status: 'failed',
          batchNumber: batchIndex + 1,
          error: error.message,
          errorType: errorInfo.type,
          processingTime: new Date() - messageStartTime
        });
        
        // Create failed analytics record
        const failedAnalytics = new MessageAnalytics({
          user: userId,
          campaign: campaignId,
          messageId: `failed_batch_${batchIndex + 1}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          recipientPhone: phone.replace(/\D/g, ''),
          messageContent: finalMessage || 'Unknown message content',
          messageType: shouldSendMedia ? 'media' : 'text',
          status: 'failed',
          failureReason: error.message,
          mediaUrl: primaryMediaUrl,
          campaignType: campaign?.type || 'bulk_send',
          metadata: {
            chatId: `${phone.replace(/\D/g, '')}@c.us`,
            batchNumber: batchIndex + 1,
            batchPosition: i + 1,
            errorType: errorInfo.type,
            recoveryAction: errorInfo.recoveryAction,
            shouldStopCampaign: errorInfo.shouldStopCampaign,
            sendDuration: new Date() - messageStartTime
          }
        });

        await failedAnalytics.save();

        // Update batch results
        batchResults.failed++;
        batchResults.messageIds.push(failedAnalytics.messageId);
        batchResults.errors.push({
          phone: phone,
          error: error.message,
          errorType: errorInfo.type
        });
        batchResults.details.push({
          phone: phone,
          status: 'failed',
          error: error.message,
          errorType: errorInfo.type,
          recoveryAction: errorInfo.recoveryAction,
          messageId: failedAnalytics.messageId,
          batchNumber: batchIndex + 1,
          batchPosition: i + 1
        });

        // Handle rate limiting
        if (errorInfo.type === 'RATE_LIMIT') {
          this.handleRateLimiting();
        }

        // Check if we should stop the campaign
        if (errorInfo.shouldStopCampaign) {
          console.error(`🛑 Critical error in batch ${batchIndex + 1}, stopping campaign`);
          batchResults.shouldStopCampaign = true;
          break;
        }

        // Add delay after failed message too
        if (i < batch.length - 1) {
          await this.delay(timing.messageDelay);
        }
      }
    }

    // Finalize batch info
    batchResults.batchInfo.endTime = new Date();
    batchResults.batchInfo.duration = batchResults.batchInfo.endTime - batchResults.batchInfo.startTime;
    batchResults.batchInfo.averageMessageTime = batch.length > 0 ? batchResults.batchInfo.duration / batch.length : 0;

    console.log(`📦 Batch ${batchIndex + 1} complete: ${batchResults.sent} sent, ${batchResults.failed} failed in ${Math.round(batchResults.batchInfo.duration / 1000)}s`);

    return batchResults;
  }

  /**
   * Validate WhatsApp client before sending
   */
  async validateClientBeforeSend(client, userId) {
    if (!client) {
      throw new Error('CLIENT_INVALID: WhatsApp client not available');
    }

    if (typeof client.sendMessage !== 'function') {
      throw new Error('CLIENT_INVALID: sendMessage method not available');
    }

    try {
      const clientState = await client.getState();
      if (clientState !== 'CONNECTED') {
        throw new Error(`CLIENT_STATE_INVALID: Client state is ${clientState}, expected CONNECTED`);
      }
    } catch (stateError) {
      throw new Error(`CLIENT_VALIDATION_FAILED: ${stateError.message}`);
    }
  }

  /**
   * Categorize errors for appropriate handling
   */
  categorizeError(error) {
    const errorMessage = error.message || '';

    if (errorMessage.includes('getChat') || errorMessage.includes('Cannot read properties of undefined')) {
      return {
        type: 'GETCHAT_ERROR',
        recoveryAction: 'WhatsApp client lost connection. Please reconnect and retry.',
        shouldStopCampaign: true
      };
    }

    if (errorMessage.includes('CLIENT_INVALID') || errorMessage.includes('CLIENT_VALIDATION_FAILED')) {
      return {
        type: 'CLIENT_CORRUPTION',
        recoveryAction: 'WhatsApp client is corrupted. Please reinitialize.',
        shouldStopCampaign: true
      };
    }

    if (errorMessage.includes('Rate limit') || errorMessage.includes('too many') || errorMessage.includes('429')) {
      return {
        type: 'RATE_LIMIT',
        recoveryAction: 'Rate limit detected. Increasing delays automatically.',
        shouldStopCampaign: false
      };
    }

    if (errorMessage.includes('Invalid number') || errorMessage.includes('not found')) {
      return {
        type: 'INVALID_NUMBER',
        recoveryAction: 'Phone number is invalid or not on WhatsApp',
        shouldStopCampaign: false
      };
    }

    return {
      type: 'UNKNOWN_ERROR',
      recoveryAction: 'Unknown error occurred. Check logs for details.',
      shouldStopCampaign: false
    };
  }

  /**
   * Handle rate limiting by adjusting timing
   */
  handleRateLimiting() {
    this.state.rateLimitDetected = true;
    this.rateLimitHistory.push(new Date());

    // Remove old entries (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    this.rateLimitHistory = this.rateLimitHistory.filter(time => time > oneHourAgo);

    // Increase adaptive delay multiplier
    if (this.config.adaptiveTiming) {
      this.adaptiveDelayMultiplier = Math.min(this.adaptiveDelayMultiplier * 1.5, 5); // Max 5x delay
      console.log(`⚠️ Rate limiting detected. Adaptive delay multiplier increased to ${this.adaptiveDelayMultiplier}x`);
    }
  }

  /**
   * Calculate timing for current batch
   */
  calculateBatchTiming() {
    const baseMessageDelay = this.config.messageDelay;
    const baseBatchDelay = this.config.batchDelay;

    // Apply adaptive multiplier if rate limiting was detected
    const messageDelay = Math.round(baseMessageDelay * this.adaptiveDelayMultiplier);
    const batchDelay = Math.round(baseBatchDelay * this.adaptiveDelayMultiplier);

    return {
      messageDelay,
      batchDelay,
      adaptiveMultiplier: this.adaptiveDelayMultiplier
    };
  }

  /**
   * Calculate delay between batches
   */
  calculateBatchDelay() {
    const timing = this.calculateBatchTiming();
    return timing.batchDelay;
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current campaign progress
   */
  getProgress() {
    return {
      currentBatch: this.state.currentBatch,
      totalBatches: this.state.totalBatches,
      sent: this.state.sentCount,
      failed: this.state.failedCount,
      progress: this.state.totalBatches > 0 ? (this.state.currentBatch / this.state.totalBatches) * 100 : 0,
      rateLimitDetected: this.state.rateLimitDetected,
      adaptiveDelayMultiplier: this.adaptiveDelayMultiplier,
      paused: this.state.paused,
      stopped: this.state.stopped
    };
  }

  /**
   * Pause campaign (can be resumed)
   */
  pause() {
    this.state.paused = true;
    console.log(`⏸️ Campaign paused at batch ${this.state.currentBatch}/${this.state.totalBatches}`);
  }

  /**
   * Resume paused campaign
   */
  resume() {
    this.state.paused = false;
    console.log(`▶️ Campaign resumed at batch ${this.state.currentBatch}/${this.state.totalBatches}`);
  }

  /**
   * Stop campaign completely
   */
  stop() {
    this.state.stopped = true;
    console.log(`🛑 Campaign stopped at batch ${this.state.currentBatch}/${this.state.totalBatches}`);
  }

  /**
   * 🎲 Calculate randomized message delay
   * Adds human-like variance to delays to avoid detection
   */
  getRandomizedDelay(baseDelay) {
    if (!this.config.randomizeDelay || !this.config.delayVariance) {
      return baseDelay;
    }
    
    // Calculate variance range (e.g., ±30%)
    const variance = baseDelay * this.config.delayVariance;
    const minDelay = baseDelay - variance;
    const maxDelay = baseDelay + variance;
    
    // Random delay within range
    const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
    
    return Math.max(1000, randomDelay); // Minimum 1 second
  }

  /**
   * 🕐 Check if we should insert a random pause
   * Pattern-breaking pauses make behavior more human-like
   */
  shouldInsertRandomPause(batchIndex) {
    if (!this.config.insertRandomPauses || !this.config.pauseFrequency) {
      return false;
    }
    
    // Insert pause every N batches (not on first batch)
    return batchIndex > 0 && (batchIndex + 1) % this.config.pauseFrequency === 0;
  }

  /**
   * ⏸️ Get random pause duration
   * Returns a randomized duration for pattern-breaking pauses
   */
  getRandomPauseDuration() {
    const baseDuration = this.config.randomPauseDuration || 300000; // Default 5 min
    
    // Add ±40% variance to pause duration
    const variance = baseDuration * 0.4;
    const minPause = baseDuration - variance;
    const maxPause = baseDuration + variance;
    
    return Math.floor(Math.random() * (maxPause - minPause + 1)) + minPause;
  }

  /**
   * 📊 Log message events for real-time analytics
   * 
   * This method saves the message log to MongoDB and triggers real-time
   * Socket.io events to update the dashboard immediately.
   */
  async logMessageEvent(eventData) {
    console.log('📊 SmartCampaignBatcher.logMessageEvent() called:');
    console.log('   phone:', eventData.phone);
    console.log('   status:', eventData.status);
    console.log('   campaignId:', eventData.campaignId);
    console.log('   userId:', eventData.userId);
    
    try {
      // 1️⃣ Save to MessageLog database
      const messageLog = new MessageLog({
        user: eventData.userId,
        campaignId: eventData.campaignId,
        phone: eventData.phone,
        contactName: eventData.contactName,
        status: eventData.status,
        batchNumber: eventData.batchNumber,
        retryCount: eventData.retryCount || 0,
        processingTime: eventData.processingTime,
        error: eventData.error,
        errorType: eventData.errorType,
        messageId: eventData.messageId,
        timestamp: new Date()
      });

      await messageLog.save();
      console.log('✅ MessageLog saved to database');
      
      // 2️⃣ Trigger real-time analytics update via RealTimeAnalyticsService
      // This updates dashboard stats AND emits Socket.io events
      try {
        console.log('📡 Triggering real-time analytics update...');
        const RealTimeAnalyticsService = require('./services/realTimeAnalyticsService');
        
        // 🎯 FIX: Use handleMessageStatus() instead of emitMessageStatus()
        // This ensures both DB stats are calculated AND Socket.io events are emitted
        await RealTimeAnalyticsService.handleMessageStatus({
          campaignId: eventData.campaignId,
          phone: eventData.phone,
          status: eventData.status,
          error: eventData.error,
          processingTime: eventData.processingTime,
          batchInfo: {
            batchNumber: eventData.batchNumber
          }
        });
        console.log('✅ Real-time analytics update completed (DB + Socket.io)');
        
      } catch (socketError) {
        console.log('⚠️  Real-time analytics update failed:', socketError.message);
        console.error(socketError.stack);
        // Continue execution - message is already logged to DB
      }

    } catch (error) {
      console.error('❌ Failed to log message event:', error);
      console.error(error.stack);
    }
  }
}

module.exports = SmartCampaignBatcher;