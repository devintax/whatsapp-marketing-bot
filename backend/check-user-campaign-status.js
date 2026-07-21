const mongoose = require('mongoose');
require('dotenv').config();

// Models
const Campaign = require('./models/Campaign');
const User = require('./models/User');

async function checkUserCampaignStatus() {
    try {
        console.log('[CHECK USER CAMPAIGN STATUS]');
        console.log('============================================================');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        // Find the user
        const user = await User.findOne({ email: 'vkgbewonyo@gmail.com' });
        if (!user) {
            console.log('❌ User not found');
            return;
        }
        
        console.log(`👤 User found: ${user.email} (ID: ${user._id})`);
        
        // Get most recent campaign by user
        const recentCampaign = await Campaign.findOne({ 
            userId: user._id 
        }).sort({ createdAt: -1 });
        
        if (!recentCampaign) {
            console.log('❌ No campaigns found for user');
            return;
        }
        
        console.log(`\n📋 Most Recent Campaign:`);
        console.log(`   Name: "${recentCampaign.name}"`);
        console.log(`   ID: ${recentCampaign._id}`);
        console.log(`   Status: ${recentCampaign.status}`);
        console.log(`   Type: ${recentCampaign.type}`);
        console.log(`   Created: ${recentCampaign.createdAt}`);
        console.log(`   Recipients: ${recentCampaign.recipients?.length || 0}`);
        console.log(`   Has Media: ${recentCampaign.mediaFiles?.length > 0 ? 'YES' : 'NO'}`);
        
        if (recentCampaign.recipients && recentCampaign.recipients.length > 0) {
            console.log(`\n📞 Recipients:`);
            recentCampaign.recipients.forEach((recipient, index) => {
                console.log(`   ${index + 1}. ${recipient}`);
            });
        }
        
        if (recentCampaign.mediaFiles && recentCampaign.mediaFiles.length > 0) {
            console.log(`\n📎 Media Files:`);
            recentCampaign.mediaFiles.forEach((media, index) => {
                console.log(`   ${index + 1}. ${media.originalname} (${media.mimetype})`);
                console.log(`      Size: ${media.size} bytes`);
                console.log(`      Path: ${media.filename}`);
            });
        }
        
        // Check if campaign has been sent
        if (recentCampaign.sentAt) {
            console.log(`\n✅ Campaign was sent at: ${recentCampaign.sentAt}`);
        } else {
            console.log(`\n⏳ Campaign has not been sent yet`);
        }
        
        console.log(`\n📝 Campaign Content:`);
        console.log(`   Message: ${recentCampaign.message?.substring(0, 200)}${recentCampaign.message?.length > 200 ? '...' : ''}`);
        
        if (recentCampaign.description) {
            console.log(`   Description: ${recentCampaign.description.substring(0, 100)}${recentCampaign.description.length > 100 ? '...' : ''}`);
        }
        
        // Check for sending logs or analytics
        console.log(`\n📊 Analytics/Logs:`);
        console.log(`   Delivery Count: ${recentCampaign.deliveryCount || 0}`);
        console.log(`   Failed Count: ${recentCampaign.failedCount || 0}`);
        
        if (recentCampaign.messageIds && recentCampaign.messageIds.length > 0) {
            console.log(`   Message IDs: ${recentCampaign.messageIds.length} found`);
            recentCampaign.messageIds.forEach((msgId, index) => {
                console.log(`      ${index + 1}. ${msgId}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

checkUserCampaignStatus();