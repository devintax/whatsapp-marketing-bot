/**
 * DEBUG IMAGE PROCESSING
 * Test exactly what happens to messages with image tags
 */

const axios = require('axios');

async function debugImageProcessing() {
    console.log('🔍 DEBUGGING IMAGE TAG PROCESSING');
    console.log('=================================');
    
    try {
        // 1. Login
        const login = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'vkgbewonyo@gmail.com',
            password: 'BIDOpc2017$!'
        });
        
        console.log('✅ Login successful');
        const token = login.data.token;
        
        // 2. Create campaign with image tag but plenty of text
        const campaign = await axios.post('http://localhost:5000/api/campaigns', {
            title: 'Debug Image Processing',
            description: 'Test image tag processing with lots of text',
            name: 'Image Debug Campaign',
            content: '🏦 Hello from Divine Financial Group!\n\n💼 Professional tax and financial services.\n\nWe have great news for you about tax season!\n\n[IMAGE: campaigns/media-1760365810765-167230514.jpg]\n\nThe image above shows our latest tax preparation services.\n\n📞 Call us: +1 302 322 5515\n📧 Email: info@dfgbusiness.com\n🌐 Visit: https://dfgbusiness.com\n\n✅ Even after removing the [IMAGE:] tag, this message should have plenty of content!',
            aiPrompt: 'Professional business message with image tag processing test',
            type: 'custom',
            status: 'approved'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Campaign created:', campaign.data.campaign._id);
        console.log('📝 Original message length:', campaign.data.campaign.content?.length || 'undefined');
        
        // 3. Send to one phone with detailed error handling
        try {
            const send = await axios.post(
                `http://localhost:5000/api/whatsapp/send-campaign`,
                { 
                    campaignId: campaign.data.campaign._id,
                    recipients: ['+14432072634']
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            console.log('📤 IMAGE PROCESSING SUCCESS:', send.data);
            
        } catch (sendError) {
            console.error('❌ IMAGE PROCESSING ERROR:', sendError.response?.data || sendError.message);
            console.error('📋 Full error details:', JSON.stringify(sendError.response?.data, null, 2));
            
            // Check what the campaign content actually contains
            console.log('\n🔍 CHECKING CAMPAIGN CONTENT IN DATABASE...');
            const checkCampaign = await axios.get(
                `http://localhost:5000/api/campaigns/${campaign.data.campaign._id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('📋 Database content:', checkCampaign.data.content?.substring(0, 200) + '...');
        }
        
    } catch (error) {
        console.error('❌ General Error:', error.response?.data || error.message);
    }
}

debugImageProcessing();