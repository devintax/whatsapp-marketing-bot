/**
 * WORKING IMAGE CAMPAIGN SENDER
 * Use mediaFiles array instead of [IMAGE:] tags to send actual images
 */

const axios = require('axios');

async function sendWorkingImageCampaign() {
    console.log('🖼️ SENDING WORKING IMAGE CAMPAIGN');
    console.log('==================================');
    
    try {
        // 1. Login
        const login = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'vkgbewonyo@gmail.com',
            password: 'BIDOpc2017$!'
        });
        
        console.log('✅ Login successful');
        const token = login.data.token;
        
        // 2. Create campaign with mediaFiles array (no [IMAGE:] tags in content)
        const campaign = await axios.post('http://localhost:5000/api/campaigns', {
            title: 'Professional Business Campaign with Image',
            description: 'Working campaign with actual image attachment',
            name: 'Divine Financial Group - Tax Season',
            content: '🏦 Hello from Divine Financial Group!\n\n💼 Professional tax and financial services for the upcoming tax season.\n\n📞 Call us: +1 302 322 5515\n📧 Email: info@dfgbusiness.com\n🌐 Visit: https://dfgbusiness.com\n\n✅ You should see our tax preparation image attached to this message!',
            aiPrompt: 'Professional business message with image attachment',
            type: 'custom',
            status: 'approved',
            mediaFiles: [
                {
                    id: 'tax-image-1',
                    name: 'media-1760365810765-167230514.jpg',
                    type: 'image/jpeg',
                    size: 125000,
                    preview: 'http://localhost:5000/uploads/campaigns/media-1760365810765-167230514.jpg',
                    url: 'campaigns/media-1760365810765-167230514.jpg'
                }
            ]
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Campaign created with mediaFiles:', campaign.data.campaign._id);
        
        // 3. Send to all your numbers
        const send = await axios.post(
            `http://localhost:5000/api/whatsapp/send-campaign`,
            { 
                campaignId: campaign.data.campaign._id,
                recipients: ['+14432072634', '+13028979466', '+13479324435']
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log('📤 IMAGE CAMPAIGN RESULTS:', send.data);
        
        if (send.data.success) {
            console.log('🎉 BUSINESS CAMPAIGN WITH IMAGES SENT!');
            console.log('📱 Check all phones: +14432072634, +13028979466, +13479324435');
            console.log('🖼️ You should see the actual tax season image attached!');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        if (error.response?.data?.error) {
            console.error('📋 Full error details:', error.response.data.error);
        }
    }
}

sendWorkingImageCampaign();