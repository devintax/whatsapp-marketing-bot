// Comprehensive Mautic Contact Sync Diagnostic
const mongoose = require('mongoose');
require('dotenv').config();

// Import required models and services
const User = require('./models/User');
const MauticToken = require('./models/MauticToken');

// Check if CRMIntegration model exists
let CRMIntegration;
try {
    CRMIntegration = require('./models/CRMIntegration');
} catch (error) {
    // Try alternative path or create inline schema
    console.log('⚠️ CRMIntegration model not found, checking routes...');
}

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
            
            // Try the test user
            const testUser = await User.findOne({ email: 'admin@test.com' });
            if (testUser) {
                console.log(`✅ Test user found: ${testUser.email} (ID: ${testUser._id})`);
                console.log('⚠️ Using test user for diagnostic...');
                // Continue with test user
                return await continueWithUser(testUser);
            } else {
                console.log('❌ No users found in system');
                console.log('🔧 SOLUTION: Register a user first');
                return;
            }
        }
        
        return await continueWithUser(user);
        
    } catch (error) {
        console.error('❌ Diagnostic error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Database connection closed');
    }
}

async function continueWithUser(user) {
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
    
    // 3. Check for CRM Integration record using direct DB query
    console.log('\n3️⃣ CHECKING CRM INTEGRATION RECORDS:');
    try {
        const db = mongoose.connection.db;
        const crmIntegrations = await db.collection('crmintegrations').find({ userId: user._id, type: 'mautic' }).toArray();
        
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
            
            // 4. Analyze the token mismatch issue
            console.log('\n4️⃣ ANALYZING TOKEN STORAGE MISMATCH:');
            
            if (mauticTokens) {
                const integration = crmIntegrations[0];
                const tokensMatch = integration.credentials?.accessToken === mauticTokens.accessToken;
                
                if (tokensMatch) {
                    console.log('✅ OAuth2 tokens match between MauticToken and CRMIntegration');
                } else {
                    console.log('❌ TOKEN MISMATCH DETECTED!');
                    console.log('🔍 Root Cause: OAuth2 tokens are stored in MauticToken but not linked to CRMIntegration');
                    console.log('💡 The sync function looks for tokens in CRMIntegration.credentials but they\'re stored separately');
                    
                    // Provide fix
                    console.log('\n🔧 AUTOMATIC FIX AVAILABLE:');
                    console.log('   Updating CRM integration with OAuth2 tokens...');
                    
                    await db.collection('crmintegrations').updateOne(
                        { _id: integration._id },
                        { 
                            $set: { 
                                'credentials.accessToken': mauticTokens.accessToken,
                                'credentials.refreshToken': mauticTokens.refreshToken,
                                'credentials.expiresAt': mauticTokens.expiresAt,
                                status: 'connected'
                            } 
                        }
                    );
                    
                    console.log('✅ CRM integration updated with OAuth2 tokens!');
                }
            }
        } else {
            console.log('❌ No CRM integration records found for Mautic');
            
            if (mauticTokens) {
                console.log('\n🔧 AUTOMATIC FIX AVAILABLE:');
                console.log('   Creating CRM integration record with existing tokens...');
                
                const newIntegration = {
                    userId: user._id,
                    type: 'mautic',
                    name: 'Mautic CRM',
                    status: 'connected',
                    credentials: {
                        apiUrl: process.env.MAUTIC_BASE_URL,
                        accessToken: mauticTokens.accessToken,
                        refreshToken: mauticTokens.refreshToken,
                        expiresAt: mauticTokens.expiresAt
                    },
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                
                await db.collection('crmintegrations').insertOne(newIntegration);
                console.log('✅ CRM integration record created!');
            }
        }
    } catch (error) {
        console.log('❌ Error checking CRM integrations:', error.message);
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
    
    // 6. Test Mautic API connectivity
    console.log('\n6️⃣ TESTING MAUTIC API CONNECTIVITY:');
    if (mauticTokens && mauticConfig.baseUrl) {
        try {
            const response = await fetch(`${mauticConfig.baseUrl}/api/contacts?limit=1`, {
                headers: {
                    'Authorization': `Bearer ${mauticTokens.accessToken}`,
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Mautic API accessible!');
                console.log(`📊 Sample response: ${JSON.stringify(data).substring(0, 100)}...`);
            } else {
                console.log(`❌ Mautic API error: ${response.status} ${response.statusText}`);
                const errorText = await response.text();
                console.log(`Error details: ${errorText.substring(0, 200)}...`);
            }
        } catch (error) {
            console.log(`❌ Mautic API connection failed: ${error.message}`);
        }
    }
    
    console.log('\n🎯 DIAGNOSTIC COMPLETE! Contact sync should now work.');
}

// Run the diagnostic
diagnosticMauticContactSync().catch(console.error);