const axios = require('axios');

async function quickSend() {
  console.log('🚀 QUICK SEND TO YOUR PHONES');
  
  try {
    // Auth
    const auth = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'vkgbewonyo@gmail.com',
      password: 'BIDOpc2017$!'
    });
    
    console.log('✅ Authenticated as:', auth.data.user.email);
    const token = auth.data.token;
    
    // Send campaign
    const send = await axios.post('http://localhost:5000/api/whatsapp/send-campaign', {
      campaignId: '68ed0cfc1c0b164f38dc39f6',
      recipients: ['+14432072634', '+13028979466', '+13479324435'],
      message: '🧪 TEST: Message from Divine Financial Group - check if this reaches your phones!'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Send result:', send.data);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Response:', error.response?.data);
  }
}

quickSend();