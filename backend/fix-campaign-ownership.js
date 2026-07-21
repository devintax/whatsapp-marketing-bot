const mongoose = require('mongoose');
require('dotenv').config();

// Models
const Campaign = require('./models/Campaign');
const User = require('./models/User');

async function fixCampaignOwnership() {
    try {
        console.log('[FIX CAMPAIGN OWNERSHIP]');
        console.log('============================================================');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        // Find the correct user
        const user = await User.findOne({ email: 'vkgbewonyo@gmail.com' });
        if (!user) {
            console.log('❌ User not found');
            return;
        }
        
        console.log(`👤 Found user: ${user.email} (ID: ${user._id})`);
        
        // Find all campaigns with undefined userId
        const orphanedCampaigns = await Campaign.find({ 
            $or: [
                { userId: { $exists: false } },
                { userId: null },
                { userId: undefined }
            ]
        });
        
        console.log(`\n🔍 Found ${orphanedCampaigns.length} orphaned campaigns:`);
        
        for (const campaign of orphanedCampaigns) {
            console.log(`   - "${campaign.name}" (ID: ${campaign._id})`);
            console.log(`     Status: ${campaign.status}`);
            console.log(`     Created: ${campaign.createdAt}`);
            console.log(`     Current userId: ${campaign.userId}`);
        }
        
        if (orphanedCampaigns.length > 0) {
            console.log(`\n🔧 Fixing ownership for ${orphanedCampaigns.length} campaigns...`);
            
            const result = await Campaign.updateMany(
                { 
                    $or: [
                        { userId: { $exists: false } },
                        { userId: null },
                        { userId: undefined }
                    ] 
                },
                { userId: user._id }
            );
            
            console.log(`✅ Fixed ${result.modifiedCount} campaigns!`);
        }
        
        // Verify the fix
        const userCampaigns = await Campaign.find({ userId: user._id }).sort({ createdAt: -1 });
        console.log(`\n📊 User now has ${userCampaigns.length} campaigns:`);
        
        userCampaigns.forEach((campaign, index) => {
            console.log(`   ${index + 1}. "${campaign.name}" - ${campaign.status} - ${campaign.createdAt.toISOString()}`);
            if (campaign.mediaFiles && campaign.mediaFiles.length > 0) {
                console.log(`      📎 ${campaign.mediaFiles.length} media files`);
            }
        });
        
        // Show the most recent campaign details
        if (userCampaigns.length > 0) {
            const mostRecent = userCampaigns[0];
            console.log(`\n📋 Most Recent Campaign Details:`);
            console.log(`   Name: "${mostRecent.name}"`);
            console.log(`   ID: ${mostRecent._id}`);
            console.log(`   Status: ${mostRecent.status}`);
            console.log(`   Recipients: ${mostRecent.recipients?.length || 0}`);
            console.log(`   Message Preview: ${mostRecent.message?.substring(0, 100)}...`);
            
            if (mostRecent.recipients && mostRecent.recipients.length > 0) {
                console.log(`   📞 Recipients:`);
                mostRecent.recipients.forEach((recipient, index) => {
                    console.log(`      ${index + 1}. ${recipient}`);
                });
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

fixCampaignOwnership();