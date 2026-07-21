/**
 * CAMPAIGN DEBUG TEST - Find the exact issue
 */

const axios = require('axios');

async function debugCampaignSend() {
    console.log('🔍 DEBUGGING CAMPAIGN SEND ISSUE');
    console.log('=================================');
    
    try {
        // 1. Login
        const login = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'vkgbewonyo@gmail.com',
            password: 'BIDOpc2017$!'
        });
        
        console.log('✅ Login successful');
        const token = login.data.token;
        
        // 2. Create a simple campaign with minimal data
        const campaign = await axios.post('http://localhost:5000/api/campaigns', {
            title: 'Debug Test Campaign',
            description: 'Debug test',
            name: 'Debug Campaign',
            content: '🏦 Hello from Divine Financial Group!\n\n💼 This is a campaign test message.\n\n📞 Call +1 302 322 5515\n\n✅ Campaign message working!',
            aiPrompt: 'Create a simple business message for debugging campaign sending system',
            type: 'custom',
            status: 'approved'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Campaign created:', campaign.data.campaign._id);
        
        // 3. Send with detailed error handling
        try {
            const send = await axios.post(
                `http://localhost:5000/api/whatsapp/send-campaign`,
                { 
                    campaignId: campaign.data.campaign._id,
                    recipients: ['+14432072634']  // Just one number for testing
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            console.log('📤 SEND SUCCESS:', send.data);
            
        } catch (sendError) {
            console.error('❌ SEND ERROR:', sendError.response?.data || sendError.message);
            console.error('📋 Full send error:', JSON.stringify(sendError.response?.data, null, 2));
        }
        
    } catch (error) {
        console.error('❌ General Error:', error.response?.data || error.message);
    }
}

debugCampaignSend();