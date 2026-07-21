/**
 * ONE BY ONE CAMPAIGN SENDER
 * Send to each phone individually to avoid loop issues
 */

const axios = require('axios');

async function sendOneByOne() {
    console.log('🎯 SENDING ONE BY ONE TO AVOID LOOP ISSUES');
    console.log('==========================================');
    
    const phones = ['+14432072634', '+13028979466', '+13479324435'];
    
    try {
        // 1. Login
        const login = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'vkgbewonyo@gmail.com',
            password: 'BIDOpc2017$!'
        });
        
        console.log('✅ Login successful');
        const token = login.data.token;
        
        // 2. Send to each phone individually
        for (let i = 0; i < phones.length; i++) {
            const phone = phones[i];
            console.log(`\n📱 Sending to ${phone} (${i + 1}/${phones.length})`);
            
            try {
                // Create a new campaign for each send (to avoid any state issues)
                const campaign = await axios.post('http://localhost:5000/api/campaigns', {
                    title: `Business Message ${i + 1}`,
                    description: 'Business message with image',
                    name: `Divine Financial Campaign ${i + 1}`,
                    content: '🏦 Hello from Divine Financial Group!\n\n💼 Professional financial services.\n\n[IMAGE: campaigns/media-1760365810765-167230514.jpg]\n\n📞 Call: +1 302 322 5515\n📧 info@dfgbusiness.com\n\n✅ You should see the actual image above!',
                    aiPrompt: 'Professional business message with image',
                    type: 'custom',
                    status: 'approved'
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                console.log(`✅ Campaign ${i + 1} created:`, campaign.data.campaign._id);
                
                // Send to this one phone
                const send = await axios.post(
                    `http://localhost:5000/api/whatsapp/send-campaign`,
                    { 
                        campaignId: campaign.data.campaign._id,
                        recipients: [phone]  // Only one recipient
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                console.log(`📤 Send result for ${phone}:`, send.data);
                
            } catch (phoneError) {
                console.error(`❌ Error sending to ${phone}:`, phoneError.response?.data || phoneError.message);
            }
            
            // Wait 2 seconds between sends
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        console.log('\n🎉 INDIVIDUAL SENDS COMPLETED!');
        console.log('📱 Check all phones for messages with images');
        
    } catch (error) {
        console.error('❌ General Error:', error.response?.data || error.message);
    }
}

sendOneByOne();