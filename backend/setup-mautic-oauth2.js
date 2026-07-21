// Fix Mautic OAuth2 Setup for admin@dfgbusiness.com
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function setupMauticOAuth2() {
    console.log('🔧 SETTING UP MAUTIC OAUTH2 FOR admin@dfgbusiness.com\n');
    
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');
        
        // 1. Verify user exists
        const user = await User.findOne({ email: 'admin@dfgbusiness.com' });
        if (!user) {
            console.log('❌ User not found. Please register first.');
            return;
        }
        
        console.log(`✅ User found: ${user.email} (ID: ${user._id})\n`);
        
        // 2. Generate OAuth2 authorization URL
        const MauticService = require('./services/mauticService');
        const mauticService = new MauticService();
        
        const { authUrl, state } = mauticService.getAuthorizationUrl(user._id.toString());
        
        console.log('🔗 MAUTIC OAUTH2 AUTHORIZATION REQUIRED:\n');
        console.log('To fix the contact sync issue, you need to complete OAuth2 authorization:\n');
        
        console.log('📋 STEP-BY-STEP INSTRUCTIONS:\n');
        console.log('1️⃣ **Copy this authorization URL:**');
        console.log(`   ${authUrl}\n`);
        
        console.log('2️⃣ **Open the URL in your browser:**');
        console.log('   - You will be redirected to Mautic login');
        console.log('   - Login with: admin@dfgbusiness.com / GISpcServer2017$!\n');
        
        console.log('3️⃣ **Authorize the application:**');
        console.log('   - Click "Authorize" when prompted');
        console.log('   - You will be redirected back to your app\n');
        
        console.log('4️⃣ **Verify the authorization:**');
        console.log('   - Check the browser URL for success/error parameters');
        console.log('   - Look for "mautic_success=true" in the URL\n');
        
        console.log('🎯 **After completing OAuth2:**');
        console.log('   - Tokens will be automatically stored');
        console.log('   - CRM integration record will be created');
        console.log('   - Contact sync will work immediately\n');
        
        console.log('⚠️ **IMPORTANT:**');
        console.log('   - The redirect URI must match exactly: https://connect.vemgootech.info/api/auth/mautic/callback');
        console.log('   - Make sure your backend server is running to handle the callback');
        console.log('   - If you get an error, check the Mautic OAuth2 app configuration\n');
        
        // 3. Alternative: Manual token setup (if OAuth2 fails)
        console.log('🔄 **ALTERNATIVE SOLUTION:**');
        console.log('If OAuth2 authorization fails, you can use Basic Auth as fallback:\n');
        
        console.log('Use the CRM integration form in the frontend to add Mautic with Basic Auth credentials.');
        console.log('Or run this command to create the integration manually:\n');
        
        const basicAuthIntegration = {
            userId: user._id,
            type: 'mautic',
            name: 'Mautic CRM',
            status: 'connected',
            credentials: {
                apiUrl: 'https://dfgbusiness.com/mautic',
                username: 'admin@dfgbusiness.com',
                password: 'GISpcServer2017$!'
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        console.log('Integration object:', JSON.stringify(basicAuthIntegration, null, 2));
        
        console.log('🚀 **RECOMMENDATION:**');
        console.log('Try OAuth2 first (more secure), fall back to Basic Auth if needed.\n');
        
    } catch (error) {
        console.error('❌ Setup error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Database connection closed');
    }
}

setupMauticOAuth2().catch(console.error);