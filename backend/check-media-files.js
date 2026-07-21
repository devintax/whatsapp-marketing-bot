/**
 * ENABLE MEDIA SENDING WITH IMAGE TAG PROCESSING
 * Fix the issue where [IMAGE: filename] shows as text instead of actual image
 */

const fs = require('fs');
const path = require('path');

// First, let's check what image files are actually available
const uploadsDir = path.join(__dirname, '..', 'uploads', 'campaigns');
console.log('🔍 CHECKING AVAILABLE MEDIA FILES');
console.log('='.repeat(60));
console.log('Uploads directory:', uploadsDir);

if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    console.log(`📁 Found ${files.length} files in uploads/campaigns:`);
    
    files.forEach((file, index) => {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        console.log(`   ${index + 1}. ${file}`);
        console.log(`      Size: ${stats.size} bytes`);
        console.log(`      Modified: ${stats.mtime}`);
        console.log(`      Full path: ${filePath}`);
        console.log('');
    });
} else {
    console.log('❌ Uploads directory does not exist');
}

// Now let's check the campaign's media files in the database
const mongoose = require('mongoose');
require('dotenv').config();

async function checkCampaignMedia() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const Campaign = require('./models/Campaign');
        
        console.log('🔍 CHECKING CAMPAIGN MEDIA FILES IN DATABASE');
        console.log('='.repeat(60));
        
        const campaign = await Campaign.findById('68ed0cfc1c0b164f38dc39f6');
        
        if (campaign) {
            console.log(`📋 Campaign: "${campaign.name}"`);
            console.log(`📎 Media files in database: ${campaign.mediaFiles?.length || 0}`);
            
            if (campaign.mediaFiles && campaign.mediaFiles.length > 0) {
                campaign.mediaFiles.forEach((media, index) => {
                    console.log(`\n   ${index + 1}. ${media.name}`);
                    console.log(`      Type: ${media.type}`);
                    console.log(`      Size: ${media.size} bytes`);
                    console.log(`      Preview URL: ${media.preview}`);
                    console.log(`      File path: ${media.file}`);
                    
                    // Check if the actual file exists
                    if (media.file) {
                        const fullPath = path.resolve(media.file);
                        const exists = fs.existsSync(fullPath);
                        console.log(`      File exists: ${exists ? '✅ YES' : '❌ NO'}`);
                        
                        if (exists) {
                            const stats = fs.statSync(fullPath);
                            console.log(`      Actual size: ${stats.size} bytes`);
                        }
                    }
                });
            }
            
            // Check message content for image references
            const messageContent = campaign.message || campaign.content || campaign.aiPrompt || campaign.description;
            console.log(`\n📝 Message content length: ${messageContent?.length || 0}`);
            
            if (messageContent && messageContent.includes('[IMAGE:')) {
                const imageRefs = messageContent.match(/\[IMAGE:[^\]]+\]/g);
                console.log(`🏷️ Image references found: ${imageRefs?.length || 0}`);
                imageRefs?.forEach((ref, i) => {
                    console.log(`   ${i + 1}. ${ref}`);
                    
                    // Extract filename from reference
                    const filename = ref.match(/\[IMAGE:\s*([^\]]+)\]/)?.[1]?.trim();
                    if (filename) {
                        console.log(`      Filename: "${filename}"`);
                        
                        // Look for matching media file
                        const matchingMedia = campaign.mediaFiles?.find(m => 
                            m.name === filename || m.file?.includes(filename)
                        );
                        
                        if (matchingMedia) {
                            console.log(`      ✅ Matching media file found: ${matchingMedia.file}`);
                        } else {
                            console.log(`      ❌ No matching media file found`);
                        }
                    }
                });
            } else {
                console.log(`❌ No image references found in message`);
            }
        }
        
        console.log('\n💡 RECOMMENDED FIX:');
        console.log('1. Re-enable media sending in WhatsApp route');
        console.log('2. Process [IMAGE: filename] tags to send actual images');
        console.log('3. Remove image reference text after sending image');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        mongoose.disconnect();
    }
}

checkCampaignMedia();