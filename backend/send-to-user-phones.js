/**
 * REAL CAMPAIGN SEND TO USER'S ACTUAL PHONE NUMBERS
 * Send to: +14432072634, +13028979466, +13479324435
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

class RealCampaignSender {
    constructor() {
        this.token = null;
    }

    log(message, data = null) {
        console.log(`[${new Date().toISOString()}] ${message}`);
        if (data) {
            console.log(JSON.stringify(data, null, 2));
        }
    }

    async authenticate() {
        try {
            this.log('🔐 Authenticating...');
            const response = await axios.post(`${API_BASE}/auth/login`, USER_CREDENTIALS);
            
            if (response.data.token) {
                this.token = response.data.token;
                this.log('✅ Authentication successful');
                return true;
            } else {
                this.log('❌ Authentication failed - no token received');
                return false;
            }
        } catch (error) {
            this.log('❌ Authentication failed', { error: error.message });
            return false;
        }
    }

    async checkWhatsAppStatus() {
        try {
            this.log('📱 Checking WhatsApp status...');
            const response = await axios.get(`${API_BASE}/whatsapp/status`, {
                headers: { Authorization: `Bearer ${this.token}` }
            });
            
            this.log('📱 WhatsApp Status:', response.data);
            
            if (response.data.status !== 'connected') {
                this.log('⚠️ WhatsApp not connected, attempting to initialize...');
                await this.initializeWhatsApp();
            }
            
            return response.data.status === 'connected';
        } catch (error) {
            this.log('❌ WhatsApp status check failed', { error: error.message });
            return false;
        }
    }

    async initializeWhatsApp() {
        try {
            this.log('🔄 Initializing WhatsApp...');
            const response = await axios.post(`${API_BASE}/whatsapp/init`, {}, {
                headers: { Authorization: `Bearer ${this.token}` }
            });
            
            this.log('📱 WhatsApp initialization response:', response.data);
            
            // Wait for connection
            this.log('⏳ Waiting for WhatsApp to connect...');
            await new Promise(resolve => setTimeout(resolve, 15000));
            
            return true;
        } catch (error) {
            this.log('❌ WhatsApp initialization failed', { error: error.message });
            return false;
        }
    }

    async getFixedCampaign() {
        try {
            this.log('📋 Getting the fixed Tax Deadline Reminder campaign...');
            const response = await axios.get(`${API_BASE}/campaigns`, {
                headers: { Authorization: `Bearer ${this.token}` }
            });
            
            const campaigns = response.data.campaigns || [];
            const taxCampaign = campaigns.find(c => c.name === 'Tax Deadline Reminder');
            
            if (taxCampaign) {
                this.log('✅ Found Tax Deadline Reminder campaign', {
                    id: taxCampaign._id,
                    name: taxCampaign.name,
                    hasMedia: taxCampaign.mediaFiles?.length > 0,
                    status: taxCampaign.status
                });
                return taxCampaign;
            } else {
                this.log('❌ Tax Deadline Reminder campaign not found');
                this.log('Available campaigns:', campaigns.map(c => c.name));
                return null;
            }
        } catch (error) {
            this.log('❌ Failed to get campaigns', { error: error.message });
            return null;
        }
    }

    async sendCampaignToUserNumbers(campaign) {
        try {
            this.log('📤 Sending campaign to USER\'S ACTUAL PHONE NUMBERS...');
            this.log('📞 Target numbers:', USER_PHONE_NUMBERS);
            
            const sendPayload = {
                campaignId: campaign._id,
                recipients: USER_PHONE_NUMBERS,
                message: "Real campaign test - you should receive this message!"
            };
            
            this.log('📋 Send payload:', sendPayload);
            
            const response = await axios.post(`${API_BASE}/whatsapp/send-campaign`, sendPayload, {
                headers: { Authorization: `Bearer ${this.token}` }
            });
            
            this.log('✅ CAMPAIGN SEND RESPONSE:', response.data);
            
            if (response.data.success) {
                this.log('🎉 CAMPAIGN SENT SUCCESSFULLY!');
                this.log(`📊 Results: ${response.data.sent} sent, ${response.data.failed} failed`);
                
                if (response.data.details) {
                    this.log('📋 Send details:');
                    response.data.details.forEach((detail, index) => {
                        this.log(`   ${index + 1}. ${detail.phone}: ${detail.status} (${detail.messageId || 'no ID'})`);
                    });
                }
                
                return true;
            } else {
                this.log('❌ Campaign send failed:', response.data.message);
                return false;
            }
            
        } catch (error) {
            this.log('❌ Campaign send error', { 
                error: error.message,
                response: error.response?.data 
            });
            return false;
        }
    }

    async runRealSend() {
        this.log('🚀 SENDING REAL CAMPAIGN TO USER\'S PHONE NUMBERS');
        this.log('='.repeat(60));
        this.log('📞 Target Numbers:', USER_PHONE_NUMBERS);
        
        try {
            // Step 1: Authenticate
            const authenticated = await this.authenticate();
            if (!authenticated) return;
            
            // Step 2: Check/Initialize WhatsApp
            const whatsappReady = await this.checkWhatsAppStatus();
            if (!whatsappReady) {
                this.log('❌ WhatsApp not ready for sending');
                return;
            }
            
            // Step 3: Get the fixed campaign
            const campaign = await this.getFixedCampaign();
            if (!campaign) return;
            
            // Step 4: Send to user's actual numbers
            const sent = await this.sendCampaignToUserNumbers(campaign);
            
            this.log('\n🎯 FINAL RESULTS');
            this.log('='.repeat(60));
            this.log(`✅ Campaign sent: ${sent ? 'YES' : 'NO'}`);
            this.log(`📞 Target numbers: ${USER_PHONE_NUMBERS.join(', ')}`);
            this.log(`📝 Campaign: "${campaign?.name}"`);
            
            if (sent) {
                this.log('\n💬 CHECK YOUR PHONES NOW!');
                this.log('You should receive messages on all 3 numbers:');
                USER_PHONE_NUMBERS.forEach((num, i) => {
                    this.log(`   ${i + 1}. ${num}`);
                });
            }
            
        } catch (error) {
            this.log('❌ Real send failed', { error: error.message });
        }
    }
}

// Run the real send
async function main() {
    const sender = new RealCampaignSender();
    await sender.runRealSend();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = RealCampaignSender;