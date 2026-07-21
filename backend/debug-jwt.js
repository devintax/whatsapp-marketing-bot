const jwt = require('jsonwebtoken');
const axios = require('axios');

async function debugJWT() {
  try {
    console.log('🔍 Debugging JWT Token...');
    
    // Login
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'vkgbewonyo@gmail.com',
      password: 'BIDOpc2017$!'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Decode JWT without verification to see contents
    const decoded = jwt.decode(token);
    console.log('🔓 JWT Token Contents:', JSON.stringify(decoded, null, 2));
    
    // Also verify with server's secret
    const JWT_SECRET = process.env.JWT_SECRET || '3XmZ+g08XonofST37h5XKzwK9i7T4t5yW+4GLy1zXoS2XVW5+PPlzd0JIStRHBz6BxjYS8EeChcbEfiSewqiLA==';
    const verified = jwt.verify(token, JWT_SECRET);
    console.log('✅ JWT Token Verified:', JSON.stringify(verified, null, 2));
    
    // Expected user ID from database
    console.log('📊 Expected User ID: 68e37bea4eb7fec9ede39581');
    console.log('🔍 JWT User ID:', verified.user?.id || verified.user?._id || verified.id || 'NOT FOUND');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugJWT();