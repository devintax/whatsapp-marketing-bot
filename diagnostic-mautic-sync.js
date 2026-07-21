// Comprehensive Mautic Contact Sync Diagnostic
const mongoose = require('mongoose');
require('dotenv').config();

// Import required models and services
const User = require('./backend/models/User');
const MauticToken = require('./backend/models/MauticToken');
const CRMIntegration = require('./backend/models/CRMIntegration');

async function diagnosticMauticContactSync() {
    console.log('🔍 MAUTIC CONTACT SYNC DIAGNOSTIC\n');
    
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');
        
        // 1. Check for registered user
        console.log('1️⃣ CHECKING USER REGISTRATION:');
        const user = await User.findOne({ email: 'admin@dfgbusiness.com' });
        if (user) {
            console.log(`✅ User found: ${user.email} (ID: ${user._id})`);
        } else {
            console.log('❌ User not found: admin@dfgbusiness.com');
            console.log('🔧 SOLUTION: Register the user first');
            return;
        }
        
        // 2. Check for Mautic OAuth2 tokens
        console.log('\n2️⃣ CHECKING MAUTIC OAUTH2 TOKENS:');
        const mauticTokens = await MauticToken.findOne({ userId: user._id });
        if (mauticTokens) {
            console.log('✅ Mautic OAuth2 tokens found in database');
            console.log(`📊 Token details:`);
            console.log(`   - Access Token: ${mauticTokens.accessToken ? mauticTokens.accessToken.substring(0, 20) + '...' : 'None'}`);
            console.log(`   - Refresh Token: ${mauticTokens.refreshToken ? 'Present' : 'Missing'}`);
            console.log(`   - Expires At: ${mauticTokens.expiresAt ? new Date(mauticTokens.expiresAt) : 'Unknown'}`);
            console.log(`   - Is Expired: ${mauticTokens.isExpired()}`);
        } else {
            console.log('❌ No Mautic OAuth2 tokens found for this user');
            console.log('🔧 SOLUTION: Complete OAuth2 authorization flow first');
        }
        
        // 3. Check for CRM Integration record
        console.log('\n3️⃣ CHECKING CRM INTEGRATION RECORDS:');
        const crmIntegrations = await CRMIntegration.find({ userId: user._id, type: 'mautic' });
        if (crmIntegrations.length > 0) {
            console.log(`✅ Found ${crmIntegrations.length} Mautic CRM integration(s)`);
            
            crmIntegrations.forEach((integration, index) => {
                console.log(`\n📋 Integration ${index + 1}:`);
                console.log(`   - ID: ${integration._id}`);
                console.log(`   - Name: ${integration.name}`);
                console.log(`   - Status: ${integration.status}`);
                console.log(`   - Credentials:`);
                console.log(`     * Access Token: ${integration.credentials?.accessToken ? integration.credentials.accessToken.substring(0, 20) + '...' : 'Missing'}`);
                console.log(`     * Username: ${integration.credentials?.username || 'Not set'}`);
                console.log(`     * Password: ${integration.credentials?.password ? '***hidden***' : 'Not set'}`);
                console.log(`     * API URL: ${integration.credentials?.apiUrl || 'Not set'}`);
            });
        } else {
            console.log('❌ No CRM integration records found for Mautic');
            console.log('🔧 SOLUTION: Create a Mautic CRM integration record');
        }
        
        // 4. Analyze the token mismatch issue
        console.log('\n4️⃣ ANALYZING TOKEN STORAGE MISMATCH:');
        
        if (mauticTokens && crmIntegrations.length > 0) {
            const integration = crmIntegrations[0];
            const tokensMatch = integration.credentials?.accessToken === mauticTokens.accessToken;
            
            if (tokensMatch) {
                console.log('✅ OAuth2 tokens match between MauticToken and CRMIntegration');
            } else {
                console.log('❌ TOKEN MISMATCH DETECTED!');
                console.log('🔍 Root Cause: OAuth2 tokens are stored in MauticToken but not linked to CRMIntegration');
                console.log('💡 The sync function looks for tokens in CRMIntegration.credentials but they\'re stored separately');
            }
        }
        
        // 5. Check environment variables
        console.log('\n5️⃣ CHECKING MAUTIC CONFIGURATION:');
        const mauticConfig = {
            baseUrl: process.env.MAUTIC_BASE_URL,
            clientId: process.env.MAUTIC_CLIENT_ID,
            clientSecret: process.env.MAUTIC_CLIENT_SECRET ? '***hidden***' : undefined,
            redirectUri: process.env.MAUTIC_REDIRECT_URI,
            username: process.env.MAUTIC_USERNAME,
            password: process.env.MAUTIC_PASSWORD ? '***hidden***' : undefined
        };
        
        console.log('📋 Environment Configuration:');
        Object.entries(mauticConfig).forEach(([key, value]) => {
            console.log(`   ${key}: ${value || '❌ Not set'}`);
        });
        
        // 6. Provide specific solutions
        console.log('\n🎯 DIAGNOSTIC RESULTS & SOLUTIONS:\n');
        
        if (!mauticTokens && !crmIntegrations.length) {
            console.log('❌ ISSUE: No OAuth2 tokens AND no CRM integration');
            console.log('🔧 SOLUTION:');
            console.log('   1. Complete OAuth2 flow to get tokens');
            console.log('   2. Create CRM integration record');
            console.log('   3. Link tokens to integration');
        } else if (mauticTokens && !crmIntegrations.length) {
            console.log('❌ ISSUE: OAuth2 tokens exist but no CRM integration record');
            console.log('🔧 SOLUTION: Create CRM integration and link existing tokens');
        } else if (!mauticTokens && crmIntegrations.length) {
            console.log('❌ ISSUE: CRM integration exists but no OAuth2 tokens');
            console.log('🔧 SOLUTION: Complete OAuth2 flow to get tokens');
        } else if (mauticTokens && crmIntegrations.length) {
            const integration = crmIntegrations[0];
            if (!integration.credentials?.accessToken) {
                console.log('❌ ISSUE: Tokens exist separately but not linked to CRM integration');
                console.log('🔧 SOLUTION: Update CRM integration with OAuth2 tokens');
            } else {
                console.log('✅ GOOD: Both tokens and integration exist');
                console.log('🔍 Check token expiration and refresh logic');
            }
        }
        
    } catch (error) {
        console.error('❌ Diagnostic error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Database connection closed');
    }
}

// Run the diagnostic
diagnosticMauticContactSync().catch(console.error);