const axios = require('axios');

async function createTestIntegration() {
  try {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNjhmNGUzYThhYzhmOWQzZjJiZTI1MTNhIiwiZW1haWwiOiJhdXRvc3luY0B0ZXN0LmNvbSIsInJvbGUiOiJ1c2VyIn0sImlhdCI6MTc2MDg3OTUyOSwiZXhwIjoxNzYxNDg0MzI5fQ.3ErhfRwYBV_gS4q1TCHG5c3G557wSIWvCwS5UpTG30M';
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    const integrationData = {
      name: 'Test Mautic Auto-Sync',
      type: 'mautic',
      credentials: {
        apiUrl: 'https://dfgbusiness.com/mautic',
        clientId: 'test',
        clientSecret: 'test'
      }
    };
    
    const response = await axios.post('http://localhost:5000/api/crm', integrationData, { headers });
    console.log('✅ Integration created:', response.data);
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

createTestIntegration();