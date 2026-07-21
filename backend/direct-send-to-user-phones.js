/**
 * DIRECT WHATSAPP SEND TO USER'S PHONE NUMBERS
 * Bypass campaign system, send directly to user's numbers
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
const USER_CREDENTIALS = {
    email: 'vkgbewonyo@gmail.com',
    password: 'BIDOpc2017$!'
};

// USER'S ACTUAL PHONE NUMBERS  
const USER_PHONE_NUMBERS = [
    '+14432072634',
    '+13028979466', 
    '+13479324435'
];

// Test message content
const TEST_MESSAGE = `🧪 DIRECT TEST MESSAGE FROM DIVINE FINANCIAL GROUP

Hi! This is a direct test message to verify WhatsApp delivery is working.

If you receive this message, the system is working correctly!

Time: ${new Date().toLocaleString()}
From: Divine Financial Group
Phone: +1 302 322 5515

This is a test message only.`;

async function directSendTest() {
    console.log('🚀 DIRECT WHATSAPP SEND TEST');
    console.log('='.repeat(60));
    console.log('📞 Target Numbers:', USER_PHONE_NUMBERS);
    console.log('');

    try {
        // Step 1: Authenticate
        console.log('🔐 Authenticating...');
        const authResponse = await axios.post(`${API_BASE}/auth/login`, USER_CREDENTIALS);
        
        if (!authResponse.data.token) {
            console.log('❌ Authentication failed - no token');
            return;
        }
        
        const token = authResponse.data.token;
        console.log('✅ Authentication successful');

        // Step 2: Initialize WhatsApp
        console.log('📱 Initializing WhatsApp...');
        try {
            const initResponse = await axios.post(`${API_BASE}/whatsapp/init`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('📱 WhatsApp init response:', initResponse.data.message);
        } catch (error) {
            console.log('⚠️ WhatsApp init failed, continuing anyway...');
        }

        // Wait for WhatsApp to be ready
        console.log('⏳ Waiting for WhatsApp to be ready...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Step 3: Check WhatsApp status
        const statusResponse = await axios.get(`${API_BASE}/whatsapp/status`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('📱 WhatsApp status:', statusResponse.data);

        if (statusResponse.data.status !== 'connected') {
            console.log('❌ WhatsApp not connected. Status:', statusResponse.data.status);
            console.log('💡 Make sure WhatsApp Web is connected on your phone.');
            return;
        }

        // Step 4: Send to each number individually
        console.log('📤 Sending messages to your phone numbers...');
        const results = [];

        for (let i = 0; i < USER_PHONE_NUMBERS.length; i++) {
            const phoneNumber = USER_PHONE_NUMBERS[i];
            console.log(`\n📱 Sending to ${phoneNumber} (${i + 1}/${USER_PHONE_NUMBERS.length})...`);
            
            try {
                const sendResponse = await axios.post(`${API_BASE}/whatsapp/send-message`, {
                    phone: phoneNumber,
                    message: TEST_MESSAGE
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                console.log(`✅ Message sent to ${phoneNumber}`);
                console.log(`   Message ID: ${sendResponse.data.messageId || 'N/A'}`);
                results.push({ phone: phoneNumber, status: 'sent', response: sendResponse.data });

                // Wait between sends to avoid rate limiting
                if (i < USER_PHONE_NUMBERS.length - 1) {
                    console.log('⏳ Waiting 3 seconds before next send...');
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
                
            } catch (error) {
                console.log(`❌ Failed to send to ${phoneNumber}:`, error.response?.data?.error || error.message);
                results.push({ phone: phoneNumber, status: 'failed', error: error.message });
            }
        }

        // Step 5: Summary
        console.log('\n🎯 SEND RESULTS SUMMARY');
        console.log('='.repeat(60));
        
        const successful = results.filter(r => r.status === 'sent');
        const failed = results.filter(r => r.status === 'failed');
        
        console.log(`✅ Successful sends: ${successful.length}/${results.length}`);
        console.log(`❌ Failed sends: ${failed.length}/${results.length}`);
        
        if (successful.length > 0) {
            console.log('\n📱 SUCCESSFUL SENDS:');
            successful.forEach(result => {
                console.log(`   ✅ ${result.phone} - Message ID: ${result.response.messageId || 'N/A'}`);
            });
        }
        
        if (failed.length > 0) {
            console.log('\n❌ FAILED SENDS:');
            failed.forEach(result => {
                console.log(`   ❌ ${result.phone} - Error: ${result.error}`);
            });
        }

        if (successful.length > 0) {
            console.log('\n💬 CHECK YOUR PHONES NOW!');
            console.log('You should receive test messages on:');
            successful.forEach(result => {
                console.log(`   📱 ${result.phone}`);
            });
        }

    } catch (error) {
        console.error('❌ Direct send test failed:', error.message);
        if (error.response?.data) {
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the test
directSendTest();