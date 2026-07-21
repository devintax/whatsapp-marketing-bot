const axios = require('axios');

async function checkQRStatus() {
    try {
        // Authenticate
        const authResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'vkgbewonyo@gmail.com',
            password: 'BIDOpc2017$!'
        });
        
        const token = authResponse.data.token;
        
        // Check QR status
        const qrResponse = await axios.get('http://localhost:5000/api/whatsapp/qr', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('📱 WhatsApp QR Status:', qrResponse.data);
        
        if (qrResponse.data.qr) {
            console.log('✅ QR Code is ready for scanning!');
            console.log('🎯 Next steps:');
            console.log('   1. Open frontend at http://localhost:50472');
            console.log('   2. Navigate to WhatsApp section');
            console.log('   3. You should see the QR code');
            console.log('   4. Scan with your WhatsApp mobile app');
            console.log('   5. Wait for connection confirmation');
        } else {
            console.log('⏳ QR Code not yet ready, trying status check...');
            
            const statusResponse = await axios.get('http://localhost:5000/api/whatsapp/status', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log('WhatsApp Status:', statusResponse.data);
        }
        
    } catch (error) {
        console.log('❌ Error:', error.response?.data || error.message);
    }
}

checkQRStatus();