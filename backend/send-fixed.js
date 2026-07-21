/**
 * FIXED REAL MESSAGE SENDER
 */

const axios = require('axios');

async function sendFixed() {
    console.log('🚀 SENDING REAL WHATSAPP MESSAGES (FIXED)');
    console.log('==========================================');
    
    try {
        // 1. Login
        const login = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'vkgbewonyo@gmail.com',
            password: 'BIDOpc2017$!'
        });
        
        console.log('✅ Login successful');
        const token = login.data.token;
        
        // 2. Create campaign with ALL required fields
        const campaign = await axios.post('http://localhost:5000/api/campaigns', {
            title: `Real WhatsApp Test ${Date.now()}`,
            description: 'Real test campaign',
            name: `Test Campaign ${Date.now()}`,  // Required field
            content: '🏦 Hello from Divine Financial Group!\n\n💼 Testing our WhatsApp system.\n\n[IMAGE: campaigns/media-1760365810765-167230514.jpg]\n\n📞 Call +1 302 322 5515\n\n✅ If you see an actual image (not [IMAGE:] text), it works!',  // Put message in content field
            aiPrompt: 'Create a professional business message with image for testing WhatsApp delivery system',  // Required field (min 10 chars)
            type: 'custom',  // Valid enum value: promotional, announcement, reminder, custom
            status: 'approved'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Campaign created:', campaign.data.campaign._id);
        
        // 3. Send to your numbers
        const send = await axios.post(
            `http://localhost:5000/api/whatsapp/send-campaign`,
            { 
                campaignId: campaign.data.campaign._id,
                recipients: ['+14432072634', '+13028979466', '+13479324435'] 
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log('📤 SEND RESULTS:', send.data);
        
        if (send.data.success) {
            console.log('🎉 REAL MESSAGES SENT TO YOUR WHATSAPP!');
            console.log('📱 Check phones: +14432072634, +13028979466, +13479324435');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

sendFixed();