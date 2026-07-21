// Quick fix to create a test user and get authentication working
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

async function setupTestUser() {
    console.log('🔧 Setting up test user for dashboard access...\n');
    
    // Test user credentials
    const testUser = {
        name: 'Test User',
        email: 'admin@test.com',
        password: 'password123'
    };
    
    try {
        // Try to register the test user
        console.log('1. Attempting to register test user...');
        try {
            const registerResponse = await axios.post(`${API_BASE_URL}/api/auth/register`, testUser);
            console.log('✅ User registered successfully:', registerResponse.data);
        } catch (registerError) {
            if (registerError.response?.data?.message?.includes('already exists')) {
                console.log('ℹ️  Test user already exists, proceeding to login...');
            } else {
                console.log('❌ Registration error:', registerError.response?.data || registerError.message);
                throw registerError;
            }
        }
        
        // Login to get token
        console.log('\n2. Logging in to get authentication token...');
        const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
            email: testUser.email,
            password: testUser.password
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful!');
        console.log('🔑 JWT Token:', token.substring(0, 20) + '...');
        
        // Test the token with protected endpoints
        console.log('\n3. Testing token with protected endpoints...');
        
        const headers = { Authorization: `Bearer ${token}` };
        
        // Test campaigns endpoint
        try {
            const campaignResponse = await axios.get(`${API_BASE_URL}/api/campaigns`, { headers });
            console.log('✅ Campaigns endpoint accessible:', campaignResponse.data.length || 0, 'campaigns');
        } catch (err) {
            console.log('📝 Campaigns endpoint response:', err.response?.status, err.response?.data?.message || 'Unknown error');
        }
        
        // Test contacts endpoint
        try {
            const contactsResponse = await axios.get(`${API_BASE_URL}/api/contacts`, { headers });
            console.log('✅ Contacts endpoint accessible:', contactsResponse.data.length || 0, 'contacts');
        } catch (err) {
            console.log('📝 Contacts endpoint response:', err.response?.status, err.response?.data?.message || 'Unknown error');
        }
        
        // Test WhatsApp status endpoint
        try {
            const whatsappResponse = await axios.get(`${API_BASE_URL}/api/whatsapp/status`, { headers });
            console.log('✅ WhatsApp status endpoint accessible:', whatsappResponse.data);
        } catch (err) {
            console.log('📝 WhatsApp status response:', err.response?.status, err.response?.data?.message || 'Unknown error');
        }
        
        console.log('\n🎯 SOLUTION:');
        console.log('To fix the frontend dashboard, you need to:');
        console.log('');
        console.log('1. 🔐 LOGIN TO THE FRONTEND:');
        console.log('   - Go to the login page in your frontend');
        console.log('   - Use credentials: admin@test.com / password123');
        console.log('   - This will store the JWT token in localStorage');
        console.log('');
        console.log('2. 📱 OR MANUALLY SET TOKEN IN BROWSER:');
        console.log('   - Open browser DevTools (F12)');
        console.log('   - Go to Console tab');
        console.log('   - Run: localStorage.setItem("token", "' + token + '")');
        console.log('   - Refresh the dashboard page');
        console.log('');
        console.log('3. ✅ DASHBOARD SHOULD NOW WORK:');
        console.log('   - All API calls will include the JWT token');
        console.log('   - Protected endpoints will return data instead of auth errors');
        
        return token;
        
    } catch (error) {
        console.error('❌ Setup failed:', error.response?.data || error.message);
        
        console.log('\n🔧 TROUBLESHOOTING:');
        console.log('1. Make sure the backend server is running on port 5000');
        console.log('2. Check if MongoDB connection is working');
        console.log('3. Verify the backend routes are properly loaded');
        
        throw error;
    }
}

// Run the setup
setupTestUser().catch(console.error);