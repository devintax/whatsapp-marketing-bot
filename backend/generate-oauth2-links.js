const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const MauticService = require('./services/mauticService');

async function generateOAuth2Links() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log('\n🔐 OAUTH2 AUTHORIZATION LINK GENERATOR');
        console.log('====================================');
        
        // Get all users who might need OAuth2 authorization
        const users = await User.find({}).select('_id email name').limit(10);
        console.log(`👥 Found ${users.length} users in system`);
        
        console.log('\n🔗 OAUTH2 AUTHORIZATION LINKS:');
        console.log('=' .repeat(50));
        
        for (const user of users) {
            try {
                console.log(`\n👤 User: ${user.email || user.name || 'Unknown'}`);
                console.log(`🆔 User ID: ${user._id}`);
                
                // Generate OAuth2 authorization URL for this user
                const { authUrl, state } = MauticService.getAuthorizationUrl(user._id.toString());
                
                console.log(`🔗 OAuth2 Authorization URL:`);
                console.log(`${authUrl}`);
                console.log(`🎫 State: ${state}`);
                console.log('─'.repeat(80));
                
            } catch (userError) {
                console.log(`❌ Error generating OAuth2 URL for user ${user._id}: ${userError.message}`);
            }
        }
        
        // Generate a generic OAuth2 URL (useful for new user registration flow)
        console.log('\n🌐 GENERIC OAUTH2 URL (for new users):');
        console.log('=' .repeat(50));
        
        const genericUserId = 'NEW_USER_PLACEHOLDER';
        const { authUrl: genericAuthUrl, state: genericState } = MauticService.getAuthorizationUrl(genericUserId);
        
        console.log(`🔗 Generic OAuth2 Authorization URL:`);
        console.log(`${genericAuthUrl}`);
        console.log(`🎫 State: ${genericState}`);
        
        console.log('\n📋 OAUTH2 SETUP INSTRUCTIONS:');
        console.log('=' .repeat(40));
        console.log('1. Copy one of the OAuth2 URLs above');
        console.log('2. Open it in your browser');
        console.log('3. Login to Mautic with your credentials');
        console.log('4. Authorize the WhatsApp Marketing Bot application');
        console.log('5. You\'ll be redirected back with authorization tokens');
        console.log('6. The system will automatically save your tokens');
        console.log('7. You can then sync contacts from your Mautic account');
        
        console.log('\n🔧 MAUTIC CONFIGURATION DETAILS:');
        console.log('=' .repeat(40));
        console.log(`Mautic URL: ${process.env.MAUTIC_BASE_URL}`);
        console.log(`Client ID: ${process.env.MAUTIC_CLIENT_ID}`);
        console.log(`Redirect URI: ${process.env.MAUTIC_REDIRECT_URI}`);
        console.log(`Scope: contacts:read contacts:write`);
        
        console.log('\n⚠️ IMPORTANT NOTES:');
        console.log('=' .repeat(20));
        console.log('• Each user needs their own OAuth2 authorization');
        console.log('• The OAuth2 URL contains a unique state parameter for security');
        console.log('• Authorization tokens expire and will be automatically refreshed');
        console.log('• Users must have access to the Mautic instance for authorization');
        console.log('• After authorization, contacts will sync automatically');
        
        // Show current OAuth2 status for existing users
        console.log('\n📊 CURRENT OAUTH2 STATUS:');
        console.log('=' .repeat(30));
        
        const MauticToken = require('./models/MauticToken');
        
        for (const user of users.slice(0, 5)) {
            const token = await MauticToken.findOne({ userId: user._id });
            const hasValidToken = token && token.expiresAt > new Date();
            
            console.log(`👤 ${user.email}: ${hasValidToken ? '🔑 Authorized' : '❌ Needs Authorization'}`);
            if (token && !hasValidToken) {
                console.log(`   ⏰ Token expired: ${token.expiresAt}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error generating OAuth2 links:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\n📡 Disconnected from MongoDB');
    }
}

generateOAuth2Links();