/**
 * QUICK TEST SEND
 */

const axios = require('axios');

async function quickTest() {
    console.log('🧪 QUICK MEDIA TEST');
    
    try {
        // Test server
        const health = await axios.get('http://localhost:5000/api/health');
        console.log('✅ Server is running:', health.data);
        
        // Login
        const login = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'vkgbewonyo@gmail.com',
            password: 'BIDOpc2017$!'
        });
        console.log('✅ Login successful');
        
        // Get campaigns
        const campaigns = await axios.get('http://localhost:5000/api/campaigns', {
            headers: { Authorization: `Bearer ${login.data.token}` }
        });
        
        const withImages = campaigns.data.filter(c => c.message && c.message.includes('[IMAGE:'));
        console.log(`✅ Found ${withImages.length} campaigns with images`);
        
        if (withImages.length > 0) {
            const campaign = withImages[0];
            console.log(`📱 Sending: ${campaign.title}`);
            
            const result = await axios.post(
                `http://localhost:5000/api/whatsapp/send-campaign/${campaign._id}`,
                { recipients: ['+14432072634', '+13028979466', '+13479324435'] },
                { headers: { Authorization: `Bearer ${login.data.token}` } }
            );
            
            console.log('📤 Result:', result.data);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

quickTest();