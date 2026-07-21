/**
 * FINAL WORKING CAMPAIGN SENDER
 * Send proper business campaign with image to all phones
 */

const axios = require('axios');

async function sendFinalCampaign() {
    console.log('🚀 SENDING FINAL WORKING CAMPAIGN');
    console.log('================================');
    
    try {
        // 1. Login
        const login = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'vkgbewonyo@gmail.com',
            password: 'BIDOpc2017$!'
        });
        
        console.log('✅ Login successful');
        const token = login.data.token;
        
        // 2. Create campaign with image
        const campaign = await axios.post('http://localhost:5000/api/campaigns', {
            title: 'Final Business Campaign with Image',
            description: 'Professional business message with actual image attachment',
            name: 'Divine Financial Group Tax Campaign',
            content: '🏦 Hello from Divine Financial Group!\n\n💼 Professional tax and financial services.\n\n[IMAGE: campaigns/media-1760365810765-167230514.jpg]\n\n📞 Call us: +1 302 322 5515\n📧 Email: info@dfgbusiness.com\n🌐 Visit: https://dfgbusiness.com\n\n✅ Image should display above (not as [IMAGE:] text)!',
            aiPrompt: 'Create professional business message with image for tax season campaign',
            type: 'custom',
            status: 'approved'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Campaign created:', campaign.data.campaign._id);
        
        // 3. Send to all your numbers
        const send = await axios.post(
            `http://localhost:5000/api/whatsapp/send-campaign`,
            { 
                campaignId: campaign.data.campaign._id,
                recipients: ['+14432072634', '+13028979466', '+13479324435']
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log('📤 FINAL CAMPAIGN RESULTS:', send.data);
        
        if (send.data.success) {
            console.log('🎉 FINAL BUSINESS CAMPAIGN SENT!');
            console.log('📱 Check all phones: +14432072634, +13028979466, +13479324435');
            console.log('🖼️ You should see the actual tax season image (not [IMAGE:] text)');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

sendFinalCampaign();