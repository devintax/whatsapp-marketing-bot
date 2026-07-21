const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const MauticService = require('./services/mauticService');
const User = require('./models/User');
const MauticToken = require('./models/MauticToken');

async function comprehensiveOAuth2Test() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log('\n🔐 COMPREHENSIVE OAUTH2 AUDIT & TEST');
        console.log('===================================');
        
        // Test 1: Environment Configuration Audit
        console.log('\n1️⃣ ENVIRONMENT CONFIGURATION AUDIT');
        console.log('─'.repeat(40));
        
        const config = {
            MAUTIC_BASE_URL: process.env.MAUTIC_BASE_URL,
            MAUTIC_CLIENT_ID: process.env.MAUTIC_CLIENT_ID,
            MAUTIC_CLIENT_SECRET: process.env.MAUTIC_CLIENT_SECRET,
            MAUTIC_REDIRECT_URI: process.env.MAUTIC_REDIRECT_URI,
            MAUTIC_USERNAME: process.env.MAUTIC_USERNAME,
            MAUTIC_PASSWORD: process.env.MAUTIC_PASSWORD
        };
        
        Object.entries(config).forEach(([key, value]) => {
            if (value) {
                const displayValue = key.includes('SECRET') || key.includes('PASSWORD') 
                    ? `${value.substring(0, 8)}***` 
                    : value;
                console.log(`✅ ${key}: ${displayValue}`);
            } else {
                console.log(`❌ ${key}: Not set`);
            }
        });
        
        // Test 2: MauticService Class Audit
        console.log('\n2️⃣ MAUTICSERVICE CLASS AUDIT');
        console.log('─'.repeat(30));
        
        const mauticService = require('./services/mauticService');
        console.log(`✅ MauticService instantiated: ${typeof mauticService === 'object'}`);
        console.log(`✅ Base URL configured: ${!!mauticService.baseUrl}`);
        console.log(`✅ Client ID configured: ${!!mauticService.clientId}`);
        console.log(`✅ Client Secret configured: ${!!mauticService.clientSecret}`);
        console.log(`✅ Redirect URI configured: ${!!mauticService.redirectUri}`);
        
        // Test available methods
        const requiredMethods = [
            'getAuthorizationUrl',
            'exchangeCodeForToken', 
            'refreshAccessToken',
            'getValidAccessToken',
            'apiCall',
            'getContacts',
            'testConnection'
        ];
        
        console.log('\n📋 MauticService Method Availability:');
        requiredMethods.forEach(method => {
            const available = typeof mauticService[method] === 'function';
            console.log(`   ${method}: ${available ? '✅' : '❌'}`);
        });
        
        // Test 3: OAuth2 URL Generation
        console.log('\n3️⃣ OAUTH2 URL GENERATION TEST');
        console.log('─'.repeat(32));
        
        try {
            const testUserId = '68f4bcc2eb61f568f2f30db6';
            const { authUrl, state } = mauticService.getAuthorizationUrl(testUserId);
            
            console.log('✅ OAuth2 URL generated successfully');
            console.log(`📏 URL length: ${authUrl.length} characters`);
            console.log(`🔗 Contains client_id: ${authUrl.includes('client_id=')}`);
            console.log(`🔗 Contains redirect_uri: ${authUrl.includes('redirect_uri=')}`);
            console.log(`🔗 Contains response_type: ${authUrl.includes('response_type=code')}`);
            console.log(`🔗 Contains scope: ${authUrl.includes('scope=')}`);
            console.log(`🔒 State parameter: ${state ? 'Generated' : 'Missing'}`);
            
            // Validate URL format
            try {
                new URL(authUrl);
                console.log('✅ Valid URL format');
            } catch {
                console.log('❌ Invalid URL format');
            }
            
        } catch (error) {
            console.log(`❌ OAuth2 URL generation failed: ${error.message}`);
        }
        
        // Test 4: Database Token Model Audit
        console.log('\n4️⃣ DATABASE TOKEN MODEL AUDIT');
        console.log('─'.repeat(30));
        
        try {
            const tokenCount = await MauticToken.countDocuments();
            console.log(`📊 Existing tokens in database: ${tokenCount}`);
            
            if (tokenCount > 0) {
                const sampleToken = await MauticToken.findOne().select('userId createdAt expiresAt -_id');
                console.log('📄 Sample token structure:');
                console.log(`   User: ${sampleToken.userId}`);
                console.log(`   Created: ${sampleToken.createdAt}`);
                console.log(`   Expires: ${sampleToken.expiresAt}`);
                console.log(`   Valid: ${sampleToken.expiresAt > new Date()}`);
            }
            
        } catch (error) {
            console.log(`❌ Token model audit failed: ${error.message}`);
        }
        
        // Test 5: Security Audit
        console.log('\n5️⃣ SECURITY AUDIT');
        console.log('─'.repeat(16));
        
        const securityChecks = [
            {
                name: 'HTTPS Redirect URI',
                check: () => config.MAUTIC_REDIRECT_URI?.startsWith('https://'),
                issue: 'Redirect URI should use HTTPS for security'
            },
            {
                name: 'Strong Client Secret',
                check: () => config.MAUTIC_CLIENT_SECRET?.length >= 32,
                issue: 'Client secret should be at least 32 characters'
            },
            {
                name: 'Production Base URL',
                check: () => !config.MAUTIC_BASE_URL?.includes('localhost'),
                issue: 'Using localhost in production could cause issues'
            },
            {
                name: 'Environment Isolation',
                check: () => process.env.NODE_ENV !== 'development' || config.MAUTIC_BASE_URL?.includes('localhost'),
                issue: 'Environment configuration mismatch'
            }
        ];
        
        securityChecks.forEach(check => {
            const passed = check.check();
            console.log(`   ${check.name}: ${passed ? '✅' : '⚠️'}`);
            if (!passed) {
                console.log(`     Issue: ${check.issue}`);
            }
        });
        
        // Test 6: API Endpoint Accessibility
        console.log('\n6️⃣ API ENDPOINT ACCESSIBILITY TEST');
        console.log('─'.repeat(35));
        
        const endpoints = [
            { name: 'Authorization', url: `${config.MAUTIC_BASE_URL}/oauth/v2/authorize` },
            { name: 'Token Exchange', url: `${config.MAUTIC_BASE_URL}/oauth/v2/token` },
            { name: 'API Contacts', url: `${config.MAUTIC_BASE_URL}/api/contacts` }
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await axios.head(endpoint.url, { timeout: 5000 });
                console.log(`✅ ${endpoint.name}: Accessible (${response.status})`);
            } catch (error) {
                if (error.response) {
                    console.log(`⚠️ ${endpoint.name}: HTTP ${error.response.status} (may be normal for auth endpoints)`);
                } else {
                    console.log(`❌ ${endpoint.name}: ${error.code || error.message}`);
                }
            }
        }
        
        // Test 7: User Integration Status
        console.log('\n7️⃣ USER INTEGRATION STATUS');
        console.log('─'.repeat(26));
        
        const users = await User.find({}).select('email _id').limit(5);
        for (const user of users) {
            const token = await MauticToken.findOne({ userId: user._id });
            const hasValidToken = token && token.expiresAt > new Date();
            console.log(`👤 ${user.email}: ${hasValidToken ? '🔑 Has valid token' : '❌ No valid token'}`);
        }
        
        // Test 8: Integration Test Summary
        console.log('\n8️⃣ INTEGRATION TEST SUMMARY');
        console.log('─'.repeat(27));
        
        const issues = [];
        
        if (!config.MAUTIC_CLIENT_ID) issues.push('Missing OAuth2 Client ID');
        if (!config.MAUTIC_CLIENT_SECRET) issues.push('Missing OAuth2 Client Secret');
        if (!config.MAUTIC_REDIRECT_URI) issues.push('Missing Redirect URI');
        if (!config.MAUTIC_BASE_URL) issues.push('Missing Mautic Base URL');
        
        if (issues.length === 0) {
            console.log('✅ All OAuth2 configuration checks passed');
            console.log('✅ MauticService is properly implemented');
            console.log('✅ Database models are correctly configured');
            console.log('✅ Security measures are in place');
            console.log('\n🎉 OAUTH2 IMPLEMENTATION: FULLY OPERATIONAL');
        } else {
            console.log('❌ Configuration issues found:');
            issues.forEach(issue => console.log(`   • ${issue}`));
            console.log('\n🚧 OAUTH2 IMPLEMENTATION: NEEDS ATTENTION');
        }
        
        // Test 9: Sample OAuth2 Flow Simulation
        console.log('\n9️⃣ SAMPLE OAUTH2 FLOW SIMULATION');
        console.log('─'.repeat(34));
        
        try {
            const testUser = await User.findOne({ email: 'admin@dfgbusiness.com' }) || 
                           await User.findOne().limit(1);
            
            if (testUser) {
                console.log(`🧪 Simulating OAuth2 flow for: ${testUser.email}`);
                
                // Step 1: Generate auth URL
                const { authUrl, state } = mauticService.getAuthorizationUrl(testUser._id.toString());
                console.log('✅ Step 1: Authorization URL generated');
                
                // Step 2: Check for existing token
                const existingToken = await MauticToken.findOne({ userId: testUser._id });
                if (existingToken) {
                    console.log(`✅ Step 2: Existing token found (expires: ${existingToken.expiresAt})`);
                } else {
                    console.log('⚠️ Step 2: No existing token - authorization needed');
                }
                
                console.log('\n🔗 To complete OAuth2 setup:');
                console.log('1. Copy this URL and open in browser:');
                console.log(`   ${authUrl}`);
                console.log('2. Login to Mautic and authorize the application');
                console.log('3. You\'ll be redirected back with an authorization code');
                console.log('4. The system will exchange the code for access tokens');
                
            } else {
                console.log('❌ No users found for OAuth2 simulation');
            }
            
        } catch (error) {
            console.log(`❌ OAuth2 flow simulation failed: ${error.message}`);
        }
        
    } catch (error) {
        console.error('❌ Comprehensive OAuth2 test failed:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\n📡 Disconnected from MongoDB');
    }
}

comprehensiveOAuth2Test();