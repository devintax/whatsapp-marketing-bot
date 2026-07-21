/**
 * FRESH TOKEN CAMPAIGN SEND TO USER PHONES
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
const USER_CREDENTIALS = {
    email: 'vkgbewonyo@gmail.com',
    password: 'BIDOpc2017$!'
};

const USER_PHONE_NUMBERS = [
    '+14432072634',
    '+13028979466', 
    '+13479324435'
];

async function sendWithFreshToken() {
    console.log('🚀 SENDING WITH FRESH TOKEN TO YOUR PHONES');
    console.log('='.repeat(60));
    
    try {
        // Get fresh token
        console.log('🔐 Getting fresh authentication token...');
        const authResponse = await axios.post(`${API_BASE}/auth/login`, USER_CREDENTIALS);
        const token = authResponse.data.token;
        console.log('✅ Got fresh token');

        // Check WhatsApp status
        console.log('📱 Checking WhatsApp status...');
        const statusResponse = await axios.get(`${API_BASE}/whatsapp/status`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('WhatsApp Status:', statusResponse.data.status);
        console.log('Connected Phone:', statusResponse.data.clientInfo?.phoneNumber);
        console.log('Can Send:', statusResponse.data.canSendMessages);
        
        if (!statusResponse.data.canSendMessages) {
            console.log('❌ WhatsApp not ready. Status:', statusResponse.data.status);
            return;
        }

        // Send campaign to user's phones
        console.log('📤 Sending campaign to YOUR phone numbers...');
        console.log('📞 Targets:', USER_PHONE_NUMBERS);
        
        const campaignPayload = {
            campaignId: '68ed0cfc1c0b164f38dc39f6',
            recipients: USER_PHONE_NUMBERS,
            message: "🧪 REAL TEST: This message should reach your actual phones!"
        };
        
        const sendResponse = await axios.post(`${API_BASE}/whatsapp/send-campaign`, campaignPayload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('\n🎉 SEND RESULTS:');
        console.log('Success:', sendResponse.data.success);
        console.log('Sent:', sendResponse.data.sent);
        console.log('Failed:', sendResponse.data.failed);
        console.log('Message:', sendResponse.data.message);
        
        if (sendResponse.data.details) {
            console.log('\n📋 Details:');
            sendResponse.data.details.forEach((detail, i) => {
                console.log(`   ${i+1}. ${detail.phone}: ${detail.status} (${detail.messageId || 'no ID'})`);
            });
        }
        
        if (sendResponse.data.sent > 0) {
            console.log('\n💬 CHECK YOUR PHONES NOW!');
            console.log('Messages sent to:');
            USER_PHONE_NUMBERS.forEach(phone => {
                console.log(`   📱 ${phone}`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response?.data) {
            console.error('Response:', error.response.data);
        }
    }
}

sendWithFreshToken();