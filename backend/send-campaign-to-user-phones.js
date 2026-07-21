/**
 * USE WORKING CAMPAIGN SEND TO USER'S PHONES
 * Use the campaign endpoint that was working in previous tests
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// USER'S ACTUAL PHONE NUMBERS  
const USER_PHONE_NUMBERS = [
    '+14432072634',
    '+13028979466', 
    '+13479324435'
];

// Use working token from previous successful tests
const WORKING_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNjhlMzc5YmE0ZWI3ZmVjOWVkZTM5NTgxIiwiZW1haWwiOiJ2a2diZXdvbnlvQGdtYWlsLmNvbSIsInJvbGUiOiJ1c2VyIn0sImlhdCI6MTc2MDM2OTU4MiwiZXhwIjoxNzYwOTc0MzgyfQ.Daw7wHDXCOtNIwkRr5POcPVYY8gWNnB7uY78Z0w7_cU';

async function sendCampaignToUserPhones() {
    console.log('🚀 SENDING FIXED CAMPAIGN TO YOUR PHONE NUMBERS');
    console.log('='.repeat(60));
    console.log('📞 Your Numbers:', USER_PHONE_NUMBERS);
    console.log('');

    try {
        // Step 1: Check WhatsApp status
        console.log('📱 Checking WhatsApp status...');
        const statusResponse = await axios.get(`${API_BASE}/whatsapp/status`, {
            headers: { Authorization: `Bearer ${WORKING_TOKEN}` }
        });
        
        console.log('WhatsApp Status:', statusResponse.data.status);
        console.log('Can Send Messages:', statusResponse.data.canSendMessages);
        
        if (!statusResponse.data.canSendMessages) {
            console.log('❌ WhatsApp not ready for sending');
            return;
        }

        // Step 2: Send the fixed campaign directly using the working method
        console.log('📤 Sending Tax Deadline Reminder campaign to your phones...');
        
        const campaignSendPayload = {
            campaignId: '68ed0cfc1c0b164f38dc39f6', // Tax Deadline Reminder campaign ID
            recipients: USER_PHONE_NUMBERS,
            message: `⏰ Tax Deadline Approaching!

Hi Friend,

Don't wait until the last minute! The April 15th deadline is coming fast.

Divine Financial Group offers:
- Same-week appointments available
- Expert preparation (individuals & businesses)
- Maximum deductions guaranteed

🚀 Let's get your taxes done right!

Call now: (302) 322-5515
Or reply "SCHEDULE" to book your slot.

- DFG Team

[IMAGE: taxes1_compressed.jpg]`
        };
        
        console.log('📋 Sending to numbers:', campaignSendPayload.recipients);
        
        const sendResponse = await axios.post(`${API_BASE}/whatsapp/send-campaign`, campaignSendPayload, {
            headers: { Authorization: `Bearer ${WORKING_TOKEN}` }
        });

        console.log('\n🎉 CAMPAIGN SEND RESPONSE:');
        console.log('='.repeat(40));
        console.log('Success:', sendResponse.data.success);
        console.log('Message:', sendResponse.data.message);
        console.log('Sent:', sendResponse.data.sent);
        console.log('Failed:', sendResponse.data.failed);
        
        if (sendResponse.data.details) {
            console.log('\n📋 Detailed Results:');
            sendResponse.data.details.forEach((detail, index) => {
                console.log(`   ${index + 1}. ${detail.phone}: ${detail.status}`);
                if (detail.messageId) {
                    console.log(`      Message ID: ${detail.messageId}`);
                }
            });
        }
        
        if (sendResponse.data.errors && sendResponse.data.errors.length > 0) {
            console.log('\n❌ Errors:');
            sendResponse.data.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }
        
        if (sendResponse.data.sent > 0) {
            console.log('\n💬 CHECK YOUR PHONES NOW!');
            console.log('You should receive the Tax Deadline Reminder message on:');
            USER_PHONE_NUMBERS.forEach((phone, index) => {
                console.log(`   📱 ${phone}`);
            });
            
            console.log('\n📝 Message Content:');
            console.log('- Tax deadline reminder');
            console.log('- Divine Financial Group contact info');
            console.log('- Call to action to schedule appointment');
            console.log('- Image reference: [IMAGE: taxes1_compressed.jpg]');
        }

    } catch (error) {
        console.error('❌ Campaign send failed:', error.message);
        if (error.response?.data) {
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the test
sendCampaignToUserPhones();