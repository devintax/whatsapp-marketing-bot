/**
 * SEND REAL WHATSAPP MESSAGES - ACTUAL DELIVERY
 * This will send REAL messages to your WhatsApp phone numbers
 */

const axios = require('axios');

async function sendRealWhatsAppMessages() {
    console.log('📱 SENDING REAL WHATSAPP MESSAGES');
    console.log('================================');
    console.log('🎯 Target Numbers:');
    console.log('   • +14432072634');
    console.log('   • +13028979466');
    console.log('   • +13479324435');
    console.log('');
    console.log('⚠️  THIS WILL SEND ACTUAL MESSAGES TO YOUR REAL WHATSAPP ACCOUNTS');
    console.log('');

    const baseURL = 'http://localhost:5000';
    
    try {
        // Step 1: Check server
        console.log('🔍 Step 1: Checking server...');
        const healthCheck = await axios.get(`${baseURL}/api/health`);
        console.log('✅ Server is running:', healthCheck.data.status);

        // Step 2: Login
        console.log('');
        console.log('🔐 Step 2: Authenticating...');
        const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
            email: 'vkgbewonyo@gmail.com',
            password: 'BIDOpc2017$!'
        });

        if (!loginResponse.data.token) {
            throw new Error('Authentication failed');
        }

        const token = loginResponse.data.token;
        console.log('✅ Login successful');
        console.log('👤 User:', loginResponse.data.user.email);

        // Step 3: Create manual campaign
        console.log('');
        console.log('📝 Step 3: Creating manual campaign...');
        const campaignData = {
            title: `Real Campaign Test - ${new Date().toLocaleString()}`,
            description: 'Real manual campaign with image for testing',
            name: `Real Test Campaign ${Date.now()}`,
            aiPrompt: 'Create a professional financial services message with image for testing the WhatsApp campaign system',
            message: `🏦 Hello from Divine Financial Group!

💼 This is a REAL test message from our WhatsApp marketing system.

[IMAGE: campaigns/media-1760365810765-167230514.jpg]

📞 Contact us at +1 302 322 5515 for professional financial services.

✅ If you can see an actual image above (not [IMAGE:] text), our system is working perfectly!

Thank you for testing our platform.

Best regards,
Divine Financial Group Team`,
            type: 'manual',
            status: 'approved'
        };

        const campaignResponse = await axios.post(`${baseURL}/api/campaigns`, campaignData, {
            headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!campaignResponse.data.success) {
            throw new Error(`Campaign creation failed: ${campaignResponse.data.message}`);
        }

        const campaignId = campaignResponse.data.campaign._id;
        console.log('✅ Campaign created successfully');
        console.log('🆔 Campaign ID:', campaignId);
        console.log('📋 Title:', campaignResponse.data.campaign.title);

        // Step 4: Send to your real WhatsApp numbers
        console.log('');
        console.log('📱 Step 4: Sending to your WhatsApp numbers...');
        console.log('🚀 SENDING REAL MESSAGES NOW...');

        const sendResponse = await axios.post(
            `${baseURL}/api/whatsapp/send-campaign/${campaignId}`,
            {
                recipients: ['+14432072634', '+13028979466', '+13479324435']
            },
            {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('');
        console.log('📤 REAL MESSAGE SEND RESULTS:');
        console.log('='.repeat(40));
        console.log('Success:', sendResponse.data.success);
        console.log('Message:', sendResponse.data.message);
        
        if (sendResponse.data.details) {
            console.log('Details:', JSON.stringify(sendResponse.data.details, null, 2));
        }

        if (sendResponse.data.success) {
            console.log('');
            console.log('🎉 SUCCESS! REAL MESSAGES SENT!');
            console.log('✅ Messages sent to all your WhatsApp numbers');
            console.log('');
            console.log('📱 CHECK YOUR WHATSAPP NOW ON:');
            console.log('   • +14432072634 ← Check this phone');
            console.log('   • +13028979466 ← Check this phone');
            console.log('   • +13479324435 ← Check this phone');
            console.log('');
            console.log('🔍 What you should see:');
            console.log('✅ Message from Divine Financial Group');
            console.log('✅ ACTUAL IMAGE displayed (not [IMAGE:] text)');
            console.log('✅ Professional business message');
            console.log('✅ Contact information: +1 302 322 5515');
        } else {
            console.log('');
            console.log('❌ REAL MESSAGE SEND FAILED');
            console.log('Reason:', sendResponse.data.message || 'Unknown error');
            
            // Check for WhatsApp connection issues
            if (sendResponse.data.message && sendResponse.data.message.toLowerCase().includes('whatsapp')) {
                console.log('');
                console.log('🔧 WHATSAPP CONNECTION TROUBLESHOOTING:');
                console.log('• WhatsApp Web may not be connected');
                console.log('• Check QR code scan on phone +1 302 522 6002');
                console.log('• Verify WhatsApp is active and online');
                console.log('• Check WhatsApp session in backend');
            }
        }

    } catch (error) {
        console.error('');
        console.error('❌ REAL MESSAGE SEND FAILED');
        console.error('Error:', error.message);
        
        if (error.response) {
            console.error('HTTP Status:', error.response.status);
            console.error('Response:', JSON.stringify(error.response.data, null, 2));
        }

        console.error('');
        console.error('🔍 Debug Information:');
        console.error('• Server URL:', baseURL);
        console.error('• Auth Email: vkgbewonyo@gmail.com');
        console.error('• Target Numbers: +14432072634, +13028979466, +13479324435');
        console.error('• Time:', new Date().toISOString());
    }

    console.log('');
    console.log('🏁 REAL MESSAGE SEND ATTEMPT COMPLETE');
    console.log('='.repeat(50));
}

// Execute immediately
sendRealWhatsAppMessages();

module.exports = sendRealWhatsAppMessages;