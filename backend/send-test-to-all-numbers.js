/**
 * SEND TEST CAMPAIGN TO ALL YOUR NUMBERS
 * Test that images now render as actual images instead of [IMAGE: filename] text
 */

const axios = require('axios');

async function sendTestToAllNumbers() {
    console.log('🧪 SENDING TEST CAMPAIGN WITH MEDIA FIX');
    console.log('='.repeat(50));
    console.log('📱 Target numbers: +14432072634, +13028979466, +13479324435');
    console.log('');
    
    try {
        // 1. Login
        console.log('🔐 Step 1: Login');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'vkgbewonyo@gmail.com',
            password: 'BIDOpc2017$!'
        });
        
        if (loginResponse.data.token) {
            console.log('✅ Login successful');
        } else {
            throw new Error('Login failed');
        }
        
        const token = loginResponse.data.token;
        
        // 2. Find campaigns with image references
        console.log('');
        console.log('🔍 Step 2: Find campaigns with image references');
        const campaignsResponse = await axios.get('http://localhost:5000/api/campaigns', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const campaignsWithImages = campaignsResponse.data.filter(c => 
            c.message && c.message.includes('[IMAGE:')
        );
        
        console.log(`✅ Found ${campaignsWithImages.length} campaigns with image references:`);
        campaignsWithImages.forEach((c, i) => {
            console.log(`   ${i + 1}. ${c.title}`);
            const imageRefs = c.message.match(/\[IMAGE:[^\]]+\]/g) || [];
            imageRefs.forEach(ref => console.log(`      - ${ref}`));
        });
        
        // 3. Send to all three numbers
        if (campaignsWithImages.length > 0) {
            const testCampaign = campaignsWithImages[0];
            console.log('');
            console.log(`📱 Step 3: Sending campaign: "${testCampaign.title}"`);
            console.log('📞 To numbers: +14432072634, +13028979466, +13479324435');
            
            const sendResponse = await axios.post(
                `http://localhost:5000/api/whatsapp/send-campaign/${testCampaign._id}`,
                {
                    recipients: ['+14432072634', '+13028979466', '+13479324435']
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            
            console.log('');
            console.log('📤 SEND RESULTS:');
            console.log('Status:', sendResponse.status);
            console.log('Success:', sendResponse.data.success);
            console.log('Message:', sendResponse.data.message);
            
            if (sendResponse.data.details) {
                console.log('Details:', JSON.stringify(sendResponse.data.details, null, 2));
            }
            
            if (sendResponse.data.success) {
                console.log('');
                console.log('🎉 SUCCESS! CAMPAIGN SENT WITH MEDIA FIX!');
                console.log('✅ Images should now show as actual images (not [IMAGE:] text)');
                console.log('📱 Check all three WhatsApp numbers for the message');
                console.log('🖼️ You should see actual image attachments with clean text');
                console.log('');
                console.log('Expected behavior:');
                console.log('- Before: [IMAGE: filename.jpg] as text');
                console.log('- After: Actual image + clean message text');
            } else {
                console.log('❌ Campaign send failed');
                console.log('Debug info:', sendResponse.data);
            }
        } else {
            console.log('⚠️ No campaigns with image references found');
            console.log('Let me check all campaigns:');
            campaignsResponse.data.forEach((c, i) => {
                console.log(`   ${i + 1}. ${c.title} - Message: ${c.message?.substring(0, 100)}...`);
            });
        }
        
    } catch (error) {
        console.error('❌ Test failed:');
        console.error('Error:', error.response?.data || error.message);
        if (error.response?.status) {
            console.error('Status:', error.response.status);
        }
    }
}

// Run test
sendTestToAllNumbers();

module.exports = sendTestToAllNumbers;