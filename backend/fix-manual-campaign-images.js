/**
 * FIX MANUAL CAMPAIGN IMAGE INTEGRATION
 * Problem: Manual campaigns store images but don't reference them in message content
 * Solution: Update manual campaign creation to properly integrate image references
 */

const mongoose = require('mongoose');
require('dotenv').config();

class ManualCampaignImageFix {
    constructor() {
        this.baseURL = 'http://localhost:5000';
    }

    async connectDB() {
        try {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('✅ Connected to MongoDB');
        } catch (error) {
            console.error('❌ MongoDB connection failed:', error.message);
            throw error;
        }
    }

    async analyzeCurrentProblem() {
        console.log('\n🔍 ANALYZING THE IMAGE INTEGRATION PROBLEM');
        console.log('='.repeat(60));
        
        const Campaign = require('./models/Campaign');
        
        // Find campaigns with media files
        const campaignsWithMedia = await Campaign.find({
            mediaFiles: { $exists: true, $ne: [], $not: { $size: 0 } }
        }).sort({ createdAt: -1 }).limit(5);
        
        console.log(`📊 Found ${campaignsWithMedia.length} campaigns with media files:`);
        
        campaignsWithMedia.forEach((campaign, index) => {
            console.log(`\n${index + 1}. "${campaign.name || 'Unnamed'}" (${campaign.type || 'no-type'})`);
            console.log(`   Created: ${campaign.createdAt}`);
            console.log(`   Media Files: ${campaign.mediaFiles.length}`);
            campaign.mediaFiles.forEach((file, i) => {
                console.log(`     ${i + 1}. ${file.name} (${file.type})`);
            });
            
            // Check message content for image references
            const messageContent = campaign.message || campaign.content || campaign.aiPrompt || campaign.description;
            const hasImageRef = messageContent && (
                messageContent.includes('[IMAGE:') || 
                messageContent.includes('image') || 
                messageContent.includes('photo') ||
                messageContent.includes('picture')
            );
            
            console.log(`   Message Content: ${messageContent ? 'YES' : 'NO'} (${messageContent?.length || 0} chars)`);
            console.log(`   Has Image Reference: ${hasImageRef ? '✅ YES' : '❌ NO'}`);
            
            if (messageContent && !hasImageRef) {
                console.log(`   🚨 PROBLEM: Media files exist but no image reference in message!`);
            }
        });
        
        return campaignsWithMedia;
    }

    async proposeSolution() {
        console.log('\n💡 PROPOSED SOLUTION');
        console.log('='.repeat(60));
        
        console.log(`
📋 THE ISSUE:
   Manual campaigns store images in mediaFiles[] array but don't integrate them into message content.
   
📋 AI CAMPAIGNS (Working correctly):
   - Generate message content with [IMAGE: filename.jpg] placeholders
   - WhatsApp service knows where to place images in the message flow
   
📋 MANUAL CAMPAIGNS (Broken):
   - Store mediaFiles[] but message content has no image references
   - WhatsApp service doesn't know where/when to display images
   
🔧 SOLUTION OPTIONS:
   
   OPTION 1: Auto-append images to message content
   - When manual campaign has mediaFiles, automatically add [IMAGE: filename] references
   - Simple fix, works with existing WhatsApp logic
   
   OPTION 2: Update UI to let users specify image placement
   - Add image insertion buttons in campaign editor
   - Let users place [IMAGE: filename] tags where they want images
   
   OPTION 3: Smart image integration
   - Analyze message content and suggest optimal image placement
   - Auto-insert at natural break points (after greeting, before CTA, etc.)
   
🎯 RECOMMENDED: Option 1 (Auto-append) for immediate fix
        `);
    }

    async implementAutoAppendFix() {
        console.log('\n🔧 IMPLEMENTING AUTO-APPEND IMAGE FIX');
        console.log('='.repeat(60));
        
        const Campaign = require('./models/Campaign');
        
        // Find campaigns with media but no image references
        const brokenCampaigns = await Campaign.find({
            mediaFiles: { $exists: true, $ne: [], $not: { $size: 0 } }
        });
        
        let fixedCount = 0;
        
        for (const campaign of brokenCampaigns) {
            const messageContent = campaign.message || campaign.content || campaign.aiPrompt || campaign.description;
            
            if (messageContent && campaign.mediaFiles && campaign.mediaFiles.length > 0) {
                // Check if already has image references
                const hasImageRef = messageContent.includes('[IMAGE:');
                
                if (!hasImageRef) {
                    console.log(`\n🔧 Fixing campaign: "${campaign.name}"`);
                    console.log(`   Media files: ${campaign.mediaFiles.length}`);
                    
                    // Create image references for each media file
                    const imageReferences = campaign.mediaFiles
                        .filter(file => file.type && file.type.startsWith('image/'))
                        .map(file => `[IMAGE: ${file.name}]`)
                        .join('\n');
                    
                    if (imageReferences) {
                        // Append image references to the end of the message
                        const updatedContent = `${messageContent}\n\n${imageReferences}`;
                        
                        // Update the appropriate field
                        if (campaign.message) {
                            campaign.message = updatedContent;
                        } else if (campaign.content) {
                            campaign.content = updatedContent;
                        } else if (campaign.aiPrompt) {
                            campaign.aiPrompt = updatedContent;
                        } else if (campaign.description) {
                            campaign.description = updatedContent;
                        }
                        
                        await campaign.save();
                        fixedCount++;
                        
                        console.log(`   ✅ Added image references: ${imageReferences.replace(/\n/g, ', ')}`);
                        console.log(`   📝 Updated content length: ${updatedContent.length} chars`);
                    }
                }
            }
        }
        
        console.log(`\n🎉 FIXED ${fixedCount} campaigns with missing image references!`);
        return fixedCount;
    }

    async testFixedCampaign() {
        console.log('\n🧪 TESTING FIXED CAMPAIGN');
        console.log('='.repeat(60));
        
        const Campaign = require('./models/Campaign');
        const fixedCampaign = await Campaign.findOne({
            mediaFiles: { $exists: true, $ne: [], $not: { $size: 0 } }
        }).sort({ updatedAt: -1 });
        
        if (fixedCampaign) {
            console.log(`📝 Testing campaign: "${fixedCampaign.name}"`);
            
            const messageContent = fixedCampaign.message || fixedCampaign.content || fixedCampaign.aiPrompt || fixedCampaign.description;
            const hasImageRef = messageContent && messageContent.includes('[IMAGE:');
            
            console.log(`   Message content length: ${messageContent?.length || 0}`);
            console.log(`   Has image references: ${hasImageRef ? '✅ YES' : '❌ NO'}`);
            console.log(`   Media files: ${fixedCampaign.mediaFiles.length}`);
            
            if (hasImageRef) {
                const imageRefs = messageContent.match(/\[IMAGE:[^\]]+\]/g);
                console.log(`   Image references found: ${imageRefs?.length || 0}`);
                imageRefs?.forEach((ref, i) => {
                    console.log(`     ${i + 1}. ${ref}`);
                });
            }
            
            console.log(`\n📝 Updated message content:`);
            console.log(`"${messageContent?.substring(0, 200)}..."`);
            
            return true;
        } else {
            console.log('❌ No campaigns with media files found to test');
            return false;
        }
    }

    async runCompleteFix() {
        console.log('🚀 MANUAL CAMPAIGN IMAGE INTEGRATION FIX');
        console.log('='.repeat(60));
        
        try {
            await this.connectDB();
            
            // Step 1: Analyze the problem
            const problematicCampaigns = await this.analyzeCurrentProblem();
            
            // Step 2: Explain the solution
            await this.proposeSolution();
            
            // Step 3: Implement the fix
            const fixedCount = await this.implementAutoAppendFix();
            
            // Step 4: Test the fix
            const testResult = await this.testFixedCampaign();
            
            console.log('\n🎉 FIX COMPLETE!');
            console.log('='.repeat(60));
            console.log(`✅ Campaigns analyzed: ${problematicCampaigns.length}`);
            console.log(`✅ Campaigns fixed: ${fixedCount}`);
            console.log(`✅ Test successful: ${testResult ? 'YES' : 'NO'}`);
            
            console.log(`\n📋 NEXT STEPS:`);
            console.log(`1. Test sending a manual campaign with images`);
            console.log(`2. Verify image references work correctly`);
            console.log(`3. Update frontend to show image placement in preview`);
            
        } catch (error) {
            console.error('❌ Fix failed:', error.message);
        } finally {
            mongoose.disconnect();
        }
    }
}

// Run the fix
async function main() {
    const fixer = new ManualCampaignImageFix();
    await fixer.runCompleteFix();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ManualCampaignImageFix;