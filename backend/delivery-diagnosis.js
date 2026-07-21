const axios = require('axios');

// Test Configuration with your credentials
const API_BASE = 'http://localhost:5000/api';
const TEST_USER = {
    email: 'vkgbewonyo@gmail.com',
    password: 'BIDOpc2017$!'
};
const TARGET_PHONES = ['+14432072634', '+13028979466', '+13479324435'];

class WhatsAppDeliveryDiagnosis {
    constructor() {
        this.authToken = null;
        this.campaignId = null;
    }

    log(message, data = null) {
        console.log(`[${new Date().toISOString()}] ${message}`);
        if (data && typeof data === 'object') {
            console.log(JSON.stringify(data, null, 2));
        } else if (data) {
            console.log(data);
        }
    }

    async authenticate() {
        this.log('🔐 Authenticating...');
        const response = await axios.post(`${API_BASE}/auth/login`, {
            email: TEST_USER.email,
            password: TEST_USER.password
        });
        this.authToken = response.data.token;
        this.log('✅ Authentication successful');
    }

    async checkWhatsAppConnection() {
        this.log('📱 Checking WhatsApp Web connection...');
        
        try {
            const response = await axios.get(`${API_BASE}/whatsapp/status`, {
                headers: { Authorization: `Bearer ${this.authToken}` }
            });
            
            this.log('WhatsApp Status:', response.data);
            
            // Check various status indicators
            const isConnected = response.data.status === 'CONNECTED' || 
                              response.data.status === 'connected' ||
                              response.data.connected === true;
            
            return { connected: isConnected, status: response.data };
        } catch (error) {
            this.log('❌ WhatsApp status check failed:', error.message);
            return { connected: false, error: error.message };
        }
    }

    async initializeWhatsAppWeb() {
        this.log('🚀 Initializing WhatsApp Web...');
        
        try {
            const response = await axios.post(`${API_BASE}/whatsapp/init`, {}, {
                headers: { Authorization: `Bearer ${this.authToken}` }
            });
            
            this.log('Initialization Response:', response.data);
            return response.data;
        } catch (error) {
            this.log('❌ WhatsApp initialization failed:', error.message);
            return { error: error.message };
        }
    }

    async createRealTestCampaign() {
        this.log('📝 Creating REAL delivery test campaign...');
        
        const campaignData = {
            name: 'REAL WhatsApp Delivery Test',
            type: 'custom',
            aiPrompt: '🚨 REAL DELIVERY TEST from Divine Financial Group! If you receive this message, manual campaigns are working. Time: ' + new Date().toLocaleTimeString() + ' 📱✅',
            recipients: TARGET_PHONES,
            status: 'draft'
        };

        try {
            const response = await axios.post(`${API_BASE}/campaigns`, campaignData, {
                headers: { Authorization: `Bearer ${this.authToken}` }
            });

            this.campaignId = response.data.campaign._id;
            this.log('✅ Test campaign created');
            this.log(`Campaign ID: ${this.campaignId}`);
            return response.data.campaign;
        } catch (error) {
            this.log('❌ Campaign creation failed:', error.message);
            return null;
        }
    }

    async testActualDelivery() {
        this.log('🚀 Testing ACTUAL WhatsApp message delivery...');
        
        try {
            const sendResponse = await axios.post(`${API_BASE}/whatsapp/send-campaign`, {
                campaignId: this.campaignId,
                recipients: TARGET_PHONES
            }, {
                headers: { Authorization: `Bearer ${this.authToken}` }
            });
            
            this.log('📤 Delivery Response:', sendResponse.data);
            
            return sendResponse.data;
        } catch (error) {
            this.log('❌ Delivery test failed:', error.message);
            if (error.response?.data) {
                this.log('Error details:', error.response.data);
            }
            return { error: error.message, response: error.response?.data };
        }
    }

    async runFullDiagnosis() {
        this.log('🔍 STARTING WHATSAPP DELIVERY DIAGNOSIS');
        this.log('=' .repeat(50));
        
        try {
            // Step 1: Authenticate
            await this.authenticate();
            
            // Step 2: Check WhatsApp connection
            const connectionCheck = await this.checkWhatsAppConnection();
            
            this.log('\n📊 CONNECTION ANALYSIS:');
            if (connectionCheck.connected) {
                this.log('✅ WhatsApp Web: CONNECTED');
                this.log('🎯 This means messages should deliver to real WhatsApp accounts');
            } else {
                this.log('❌ WhatsApp Web: NOT CONNECTED');
                this.log('🎯 This is why manual campaigns fail to deliver real messages!');
                this.log('\n🔧 FIXING THE CONNECTION:');
                
                // Try to initialize WhatsApp
                const initResult = await this.initializeWhatsAppWeb();
                if (initResult.qrCode || initResult.status === 'qr_ready') {
                    this.log('📱 QR Code generated! Next steps:');
                    this.log('   1. Open http://localhost:50472 in browser');
                    this.log('   2. Navigate to WhatsApp section');
                    this.log('   3. Scan QR code with your phone');
                    this.log('   4. Wait for "Connected" status');
                } else {
                    this.log('⚠️ Could not generate QR code:', initResult);
                }
            }
            
            // Step 3: Create test campaign
            this.log('\n📝 CREATING TEST CAMPAIGN:');
            const campaign = await this.createRealTestCampaign();
            
            // Step 4: Test delivery
            if (connectionCheck.connected && campaign) {
                this.log('\n🚀 TESTING REAL DELIVERY:');
                const deliveryResult = await this.testActualDelivery();
                
                if (deliveryResult.success) {
                    this.log('🎉 DELIVERY TEST COMPLETED!');
                    this.log('📱 CHECK YOUR WHATSAPP ACCOUNTS:');
                    TARGET_PHONES.forEach((phone, index) => {
                        this.log(`   📞 ${phone} - Look for test message`);
                    });
                    this.log('\n⏰ Messages should arrive within 30 seconds');
                } else if (deliveryResult.error) {
                    this.log('❌ DELIVERY FAILED:', deliveryResult.error);
                }
            } else if (!connectionCheck.connected) {
                this.log('\n⚠️ SKIPPING DELIVERY TEST - WhatsApp not connected');
            }
            
            // Final summary
            this.log('\n🎯 DIAGNOSIS RESULTS:');
            this.log('=' .repeat(40));
            this.log(`Backend Server: ✅ Running`);
            this.log(`Authentication: ✅ Working`);
            this.log(`Campaign Creation: ${campaign ? '✅ Working' : '❌ Failed'}`);
            this.log(`WhatsApp Connection: ${connectionCheck.connected ? '✅ Connected' : '❌ NOT Connected'}`);
            this.log(`Real Message Delivery: ${connectionCheck.connected ? '✅ Available' : '❌ BLOCKED'}`);
            
            if (!connectionCheck.connected) {
                this.log('\n🚨 ROOT CAUSE IDENTIFIED:');
                this.log('   Manual campaigns show success but don\'t deliver because');
                this.log('   WhatsApp Web is not connected to your phone!');
                this.log('\n💡 SOLUTION:');
                this.log('   1. Connect WhatsApp Web (scan QR code)');
                this.log('   2. Verify connection status shows "Connected"');
                this.log('   3. Then manual campaigns will deliver real messages');
            } else {
                this.log('\n✅ SYSTEM IS READY FOR REAL MESSAGE DELIVERY!');
            }
            
        } catch (error) {
            this.log('❌ Diagnosis failed:', error.message);
        }
    }
}

// Run the diagnosis
async function main() {
    const diagnosis = new WhatsAppDeliveryDiagnosis();
    await diagnosis.runFullDiagnosis();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = WhatsAppDeliveryDiagnosis;