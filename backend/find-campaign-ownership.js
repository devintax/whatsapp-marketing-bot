const mongoose = require('mongoose');
require('dotenv').config();

// Models
const Campaign = require('./models/Campaign');
const User = require('./models/User');

async function findCampaignOwnership() {
    try {
        console.log('[FIND CAMPAIGN OWNERSHIP]');
        console.log('============================================================');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        // Find the "Tax Deadline Reminder" campaign
        const targetCampaign = await Campaign.findOne({ 
            name: "Tax Deadline Reminder" 
        }).sort({ createdAt: -1 });
        
        if (!targetCampaign) {
            console.log('❌ "Tax Deadline Reminder" campaign not found');
            return;
        }
        
        console.log(`\n📋 Found Campaign:`);
        console.log(`   Name: "${targetCampaign.name}"`);
        console.log(`   ID: ${targetCampaign._id}`);
        console.log(`   User ID: ${targetCampaign.userId}`);
        console.log(`   Status: ${targetCampaign.status}`);
        console.log(`   Created: ${targetCampaign.createdAt}`);
        
        // Find the user who owns this campaign
        const campaignOwner = await User.findById(targetCampaign.userId);
        
        if (campaignOwner) {
            console.log(`\n👤 Campaign Owner:`);
            console.log(`   Email: ${campaignOwner.email}`);
            console.log(`   ID: ${campaignOwner._id}`);
            console.log(`   Created: ${campaignOwner.createdAt}`);
        } else {
            console.log(`\n❌ Campaign owner not found in database`);
        }
        
        // Check if there's a different user
        const correctUser = await User.findOne({ email: 'vkgbewonyo@gmail.com' });
        if (correctUser) {
            console.log(`\n🔍 Correct User Account:`);
            console.log(`   Email: ${correctUser.email}`);
            console.log(`   ID: ${correctUser._id}`);
            console.log(`   Created: ${correctUser.createdAt}`);
            
            // Check if IDs match
            if (correctUser._id.toString() === targetCampaign.userId.toString()) {
                console.log(`\n✅ User IDs MATCH - Campaign belongs to correct user`);
            } else {
                console.log(`\n❌ User IDs DON'T MATCH`);
                console.log(`   Campaign User ID: ${targetCampaign.userId}`);
                console.log(`   Correct User ID:  ${correctUser._id}`);
                
                // Fix the ownership
                console.log(`\n🔧 FIXING campaign ownership...`);
                await Campaign.updateOne(
                    { _id: targetCampaign._id },
                    { userId: correctUser._id }
                );
                console.log(`✅ Campaign ownership fixed!`);
            }
        }
        
        // Get all campaigns for both users
        console.log(`\n📊 All Campaigns Summary:`);
        const allCampaigns = await Campaign.find({}).sort({ createdAt: -1 }).limit(10);
        
        for (const campaign of allCampaigns) {
            const owner = await User.findById(campaign.userId);
            console.log(`   "${campaign.name}" - ${campaign.status} - Owner: ${owner ? owner.email : 'UNKNOWN'}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

findCampaignOwnership();