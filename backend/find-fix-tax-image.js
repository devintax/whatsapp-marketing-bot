/**
 * FIND AND FIX TAX CAMPAIGN IMAGE REFERENCE
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

async function findAndFixTaxImage() {
    console.log('🔍 FINDING TAX CAMPAIGN IMAGE REFERENCE');
    console.log('='.repeat(50));
    
    try {
        // Connect to database
        await mongoose.connect('mongodb+srv://vkgbewonyo:BIDOpc2017$!@cluster0.v5dsm.mongodb.net/whatsapp_marketing_bot?retryWrites=true&w=majority', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        const Campaign = mongoose.model('Campaign');
        
        // Find the Tax Deadline Reminder campaign
        const taxCampaign = await Campaign.findOne({
            title: { $regex: /tax deadline reminder/i }
        });
        
        if (!taxCampaign) {
            console.log('❌ Tax campaign not found');
            return;
        }
        
        console.log('✅ Found tax campaign:');
        console.log('Title:', taxCampaign.title);
        console.log('Message:', taxCampaign.message);
        console.log('');
        
        // Check for uploaded media files
        const uploadsDir = path.join(__dirname, 'uploads', 'campaigns');
        const mediaFiles = fs.readdirSync(uploadsDir);
        
        console.log('📁 Available media files:');
        mediaFiles.forEach((file, i) => {
            const filePath = path.join(uploadsDir, file);
            const stats = fs.statSync(filePath);
            console.log(`   ${i + 1}. ${file} (${Math.round(stats.size / 1024)}KB)`);
        });
        
        // Use the most recent .jpg file (likely the tax image)
        const jpgFiles = mediaFiles.filter(f => f.endsWith('.jpg'));
        if (jpgFiles.length > 0) {
            const latestJpg = jpgFiles[jpgFiles.length - 1]; // Most recent
            console.log('');
            console.log(`🎯 Using latest JPG file: ${latestJpg}`);
            
            // Update the campaign message to use the correct filename
            const newMessage = taxCampaign.message.replace(
                /\[IMAGE:\s*[^\]]+\]/g, 
                `[IMAGE: campaigns/${latestJpg}]`
            );
            
            if (newMessage !== taxCampaign.message) {
                taxCampaign.message = newMessage;
                await taxCampaign.save();
                
                console.log('✅ Updated campaign message:');
                console.log(newMessage);
            } else {
                console.log('ℹ️ No image reference found to update');
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        mongoose.disconnect();
    }
}

// Run if called directly
if (require.main === module) {
    findAndFixTaxImage();
}

module.exports = findAndFixTaxImage;