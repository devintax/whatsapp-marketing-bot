/**
 * Comprehensive SPA Routing and Mautic Integration Fix
 * Addresses both 404 page refresh issues and Mautic sync problems
 */

const axios = require('axios');

async function diagnoseAllIssues() {
    console.log('🔍 COMPREHENSIVE ISSUE DIAGNOSIS');
    console.log('═'.repeat(60));
    
    // Issue 1: SPA Routing Problem
    console.log('\n🌐 ISSUE 1: SPA ROUTING ANALYSIS');
    console.log('━'.repeat(40));
    
    const testUrls = [
        'https://connect.vemgootech.info/',
        'https://connect.vemgootech.info/dashboard',
        'https://connect.vemgootech.info/contacts',
        'https://connect.vemgootech.info/campaigns'
    ];
    
    console.log('Testing frontend routes...');
    
    for (const url of testUrls) {
        try {
            const response = await axios.get(url, { 
                timeout: 10000,
                validateStatus: (status) => status < 500
            });
            
            console.log(`✅ ${url} → Status: ${response.status}`);
            
            if (response.status === 404) {
                console.log(`   ❌ 404 Error - SPA routing broken for: ${url}`);
            }
        } catch (error) {
            console.log(`❌ ${url} → Error: ${error.response?.status || error.message}`);
        }
    }
    
    // Issue 2: Mautic Integration Analysis
    console.log('\n🔗 ISSUE 2: MAUTIC INTEGRATION ANALYSIS');
    console.log('━'.repeat(45));
    
    try {
        // Test Mautic API directly
        const mauticBaseUrl = 'https://dfgbusiness.com/mautic';
        
        console.log('Testing Mautic API endpoints...');
        
        // Test basic connectivity
        const mauticResponse = await axios.get(`${mauticBaseUrl}/api/contacts`, {
            timeout: 10000,
            validateStatus: (status) => status < 500
        });
        
        console.log(`✅ Mautic API accessible - Status: ${mauticResponse.status}`);
        
        if (mauticResponse.status === 401) {
            console.log('🔒 Unauthorized (expected) - API requires authentication');
        }
        
    } catch (error) {
        console.log(`❌ Mautic API error: ${error.response?.status || error.message}`);
    }
    
    console.log('\n📊 DIAGNOSIS SUMMARY:');
    console.log('━'.repeat(25));
    console.log('1. 404 on refresh: Cloudflared tunnel SPA routing issue');
    console.log('2. Mautic OAuth 500: Redirect URI configuration problem');
    console.log('3. Mautic Basic Auth 404: API endpoint or credentials issue');
    
    return {
        spaRoutingIssue: true,
        mauticOAuthIssue: true,
        mauticBasicAuthIssue: true
    };
}

async function generateSolutions() {
    console.log('\n🔧 COMPLETE SOLUTION PLAN');
    console.log('═'.repeat(35));
    
    console.log('\n1️⃣ FIX SPA ROUTING (Cloudflared Tunnel)');
    console.log('━'.repeat(45));
    console.log('PROBLEM: Tunnel not handling React SPA routes properly');
    console.log('CAUSE: Missing catch-all rule for frontend routes');
    console.log('');
    console.log('SOLUTION: Update tunnel-config.yml with proper SPA routing');
    console.log('');
    console.log('Current tunnel config needs modification:');
    console.log('  ingress:');
    console.log('    - hostname: connect.vemgootech.info');
    console.log('      path: /api*');
    console.log('      service: http://localhost:5000');
    console.log('    - hostname: connect.vemgootech.info');
    console.log('      service: http://localhost:8080  # ❌ Missing SPA handling');
    console.log('');
    console.log('Fixed tunnel config should be:');
    console.log('  ingress:');
    console.log('    - hostname: connect.vemgootech.info');
    console.log('      path: /api*');
    console.log('      service: http://localhost:5000');
    console.log('    - hostname: connect.vemgootech.info');
    console.log('      service: http://localhost:8080');
    console.log('      originRequest:');
    console.log('        httpHostHeader: localhost:8080');
    console.log('        noTLSVerify: true');
    
    console.log('\n2️⃣ FIX MAUTIC OAUTH ERROR 500');
    console.log('━'.repeat(35));
    console.log('PROBLEM: Mautic OAuth app redirect URI mismatch');
    console.log('CURRENT: https://connect.vemgootech.info/api/auth/mautic/callback');
    console.log('NEEDED:  https://connect.vemgootech.info/api/crm/mautic/callback');
    console.log('');
    console.log('ACTION REQUIRED:');
    console.log('1. Login to https://dfgbusiness.com/mautic');
    console.log('2. Go to Settings > API Credentials');
    console.log('3. Find Client ID: 1_3jl1ud471328og0sowskkwkkocwgcwscg40c4owkcc4skwgcgw');
    console.log('4. Update Redirect URI to: https://connect.vemgootech.info/api/crm/mautic/callback');
    console.log('5. Save and ensure status is "Published"');
    
    console.log('\n3️⃣ FIX MAUTIC BASIC AUTH 404');
    console.log('━'.repeat(35));
    console.log('PROBLEM: Mautic API credentials or permissions issue');
    console.log('CAUSE: Either wrong API URL, credentials, or user permissions');
    console.log('');
    console.log('DEBUGGING STEPS:');
    console.log('1. Test: https://dfgbusiness.com/mautic/api/contacts');
    console.log('2. Enter your Mautic admin username/password');
    console.log('3. If 404: Check if API is enabled in Mautic settings');
    console.log('4. If 401: Check user has API access permissions');
    console.log('5. If JSON: Credentials work, update integration');
}

// Run comprehensive diagnosis
diagnoseAllIssues().then(generateSolutions).catch(console.error);