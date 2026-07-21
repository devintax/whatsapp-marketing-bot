/**
 * Mautic Contact Volume Analysis
 * Query Mautic system to analyze contact size and import limitations
 */

require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');

// Mautic API Configuration
const MAUTIC_CONFIG = {
    baseUrl: process.env.MAUTIC_BASE_URL || 'https://dfgbusiness.com/mautic',
    clientId: process.env.MAUTIC_CLIENT_ID,
    clientSecret: process.env.MAUTIC_CLIENT_SECRET,
    grantType: 'client_credentials'
};

// Import limitation thresholds
const IMPORT_LIMITS = {
    mongodb_free_tier: {
        max_documents: 100000, // Theoretical limit based on 512MB
        max_storage_mb: 512,
        recommended_contacts: 50000 // Conservative estimate
    },
    api_rate_limits: {
        mautic_requests_per_minute: 60, // Typical Mautic API limit
        batch_size: 100, // Recommended batch import size
        max_concurrent: 5 // Max concurrent API calls
    },
    performance_thresholds: {
        large_dataset: 1000,
        very_large_dataset: 5000,
        massive_dataset: 10000
    }
};

class MauticContactAnalyzer {
    constructor() {
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    async authenticate() {
        console.log('🔐 Authenticating with Mautic API...');
        
        try {
            const authUrl = `${MAUTIC_CONFIG.baseUrl}/oauth/v2/token`;
            const authData = {
                grant_type: MAUTIC_CONFIG.grantType,
                client_id: MAUTIC_CONFIG.clientId,
                client_secret: MAUTIC_CONFIG.clientSecret
            };

            console.log(`📡 POST ${authUrl}`);
            console.log(`🔑 Client ID: ${MAUTIC_CONFIG.clientId?.substring(0, 10)}...`);

            const response = await axios.post(authUrl, authData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 10000
            });

            this.accessToken = response.data.access_token;
            this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
            
            console.log('✅ Authentication successful');
            console.log(`⏰ Token expires in: ${response.data.expires_in} seconds`);
            
            return true;
        } catch (error) {
            console.error('❌ Authentication failed:', error.response?.data || error.message);
            return false;
        }
    }

    async getContactCount() {
        console.log('\n📊 Querying Mautic contact count...');
        
        try {
            const url = `${MAUTIC_CONFIG.baseUrl}/api/contacts?limit=1`;
            const response = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${this.accessToken}` },
                timeout: 15000
            });

            const totalContacts = response.data.total || 0;
            console.log(`✅ Total contacts in Mautic: ${totalContacts}`);
            
            return {
                total: totalContacts,
                success: true
            };
        } catch (error) {
            console.error('❌ Failed to get contact count:', error.response?.data || error.message);
            return {
                total: 0,
                success: false,
                error: error.message
            };
        }
    }

    async getContactSample(limit = 5) {
        console.log(`\n📋 Fetching contact sample (${limit} contacts)...`);
        
        try {
            const url = `${MAUTIC_CONFIG.baseUrl}/api/contacts?limit=${limit}`;
            const response = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${this.accessToken}` },
                timeout: 15000
            });

            const contacts = response.data.contacts || {};
            const contactArray = Object.values(contacts);
            
            console.log(`✅ Retrieved ${contactArray.length} sample contacts`);
            
            // Analyze contact structure and size
            if (contactArray.length > 0) {
                const sampleContact = contactArray[0];
                const contactJson = JSON.stringify(sampleContact);
                const contactSizeKB = (contactJson.length / 1024).toFixed(2);
                
                console.log('\n📐 Sample Contact Analysis:');
                console.log(`   Size: ${contactSizeKB} KB`);
                console.log(`   Fields: ${Object.keys(sampleContact).length}`);
                
                // Show sample fields
                console.log(`   Sample fields: ${Object.keys(sampleContact).slice(0, 10).join(', ')}`);
                
                return {
                    contacts: contactArray,
                    averageSizeKB: parseFloat(contactSizeKB),
                    fieldCount: Object.keys(sampleContact).length,
                    success: true
                };
            }
            
            return { contacts: [], success: true };
        } catch (error) {
            console.error('❌ Failed to get contact sample:', error.response?.data || error.message);
            return {
                contacts: [],
                success: false,
                error: error.message
            };
        }
    }

    async getContactsBySegment() {
        console.log('\n📊 Analyzing contacts by segments/lists...');
        
        try {
            // Get segments first
            const segmentsUrl = `${MAUTIC_CONFIG.baseUrl}/api/segments`;
            const segmentsResponse = await axios.get(segmentsUrl, {
                headers: { 'Authorization': `Bearer ${this.accessToken}` },
                timeout: 10000
            });

            const segments = segmentsResponse.data.lists || {};
            const segmentArray = Object.values(segments);
            
            console.log(`✅ Found ${segmentArray.length} segments/lists`);
            
            const segmentAnalysis = [];
            
            for (const segment of segmentArray.slice(0, 5)) { // Limit to first 5 segments
                const contactCount = segment.leadCount || 0;
                segmentAnalysis.push({
                    id: segment.id,
                    name: segment.name,
                    contactCount: contactCount,
                    description: segment.description || 'No description'
                });
                
                console.log(`   📋 ${segment.name}: ${contactCount} contacts`);
            }
            
            return {
                segments: segmentAnalysis,
                totalSegments: segmentArray.length,
                success: true
            };
        } catch (error) {
            console.error('❌ Failed to get segments:', error.response?.data || error.message);
            return {
                segments: [],
                success: false,
                error: error.message
            };
        }
    }

    analyzeImportLimitations(contactData) {
        console.log('\n🔍 IMPORT LIMITATION ANALYSIS');
        console.log('━'.repeat(50));
        
        const { total: mauticContactCount, averageSizeKB = 1 } = contactData;
        
        // Calculate storage requirements
        const estimatedStorageMB = (mauticContactCount * averageSizeKB) / 1024;
        const mongoDBUsagePercent = (estimatedStorageMB / IMPORT_LIMITS.mongodb_free_tier.max_storage_mb) * 100;
        
        console.log('📊 Storage Impact Analysis:');
        console.log(`   Mautic contacts: ${mauticContactCount}`);
        console.log(`   Average contact size: ${averageSizeKB} KB`);
        console.log(`   Estimated storage needed: ${estimatedStorageMB.toFixed(2)} MB`);
        console.log(`   MongoDB free tier usage: ${mongoDBUsagePercent.toFixed(1)}%`);
        
        // Performance analysis
        const importTimeEstimate = Math.ceil(mauticContactCount / IMPORT_LIMITS.api_rate_limits.batch_size) * 2; // 2 seconds per batch
        
        console.log('\n⏱️ Import Performance Analysis:');
        console.log(`   Estimated import time: ${importTimeEstimate} seconds (${(importTimeEstimate/60).toFixed(1)} minutes)`);
        console.log(`   Recommended batch size: ${IMPORT_LIMITS.api_rate_limits.batch_size} contacts`);
        console.log(`   Rate limit consideration: ${IMPORT_LIMITS.api_rate_limits.mautic_requests_per_minute} requests/minute`);
        
        // Risk assessment
        const risks = [];
        const recommendations = [];
        
        if (mongoDBUsagePercent > 80) {
            risks.push('🚨 CRITICAL: May exceed MongoDB free tier storage limit');
            recommendations.push('Consider upgrading to MongoDB M10 cluster ($9/month)');
        } else if (mongoDBUsagePercent > 50) {
            risks.push('⚠️ MODERATE: Will use significant MongoDB storage');
            recommendations.push('Monitor storage usage during import');
        } else {
            recommendations.push('✅ Storage usage is acceptable for free tier');
        }
        
        if (mauticContactCount > IMPORT_LIMITS.performance_thresholds.massive_dataset) {
            risks.push('🐌 PERFORMANCE: Very large dataset may cause slow imports');
            recommendations.push('Implement batch import with progress tracking');
        } else if (mauticContactCount > IMPORT_LIMITS.performance_thresholds.large_dataset) {
            risks.push('⚠️ PERFORMANCE: Large dataset requires careful import strategy');
            recommendations.push('Use batch imports of 100-200 contacts at a time');
        }
        
        if (importTimeEstimate > 300) { // 5 minutes
            risks.push('⏰ TIME: Import will take significant time');
            recommendations.push('Implement progress indicator and error recovery');
        }
        
        console.log('\n🚨 Risk Assessment:');
        if (risks.length === 0) {
            console.log('   ✅ No significant risks identified');
        } else {
            risks.forEach(risk => console.log(`   ${risk}`));
        }
        
        console.log('\n💡 Recommendations:');
        recommendations.forEach(rec => console.log(`   ${rec}`));
        
        // Final verdict
        console.log('\n🎯 IMPORT FEASIBILITY VERDICT:');
        if (mongoDBUsagePercent < 80 && mauticContactCount < IMPORT_LIMITS.performance_thresholds.massive_dataset) {
            console.log('✅ FEASIBLE: Import should work with current setup');
            console.log('   - MongoDB free tier can handle the data');
            console.log('   - Performance should be acceptable');
            console.log('   - No major limitations identified');
        } else if (mongoDBUsagePercent < 90) {
            console.log('⚠️ CHALLENGING: Import possible but requires care');
            console.log('   - Consider batch imports');
            console.log('   - Monitor resource usage');
            console.log('   - Have upgrade plan ready');
        } else {
            console.log('❌ PROBLEMATIC: Current setup may not handle full import');
            console.log('   - MongoDB upgrade recommended');
            console.log('   - Consider selective import');
            console.log('   - Implement data cleanup strategy');
        }
        
        return {
            estimatedStorageMB,
            mongoDBUsagePercent,
            importTimeEstimate,
            feasible: mongoDBUsagePercent < 80,
            risks,
            recommendations
        };
    }
}

// Main analysis function
async function analyzeMauticContacts() {
    console.log('🔍 MAUTIC CONTACT VOLUME ANALYSIS');
    console.log('═'.repeat(60));
    
    // Connect to MongoDB to compare current usage
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;
        const currentContacts = await db.collection('contacts').countDocuments();
        console.log(`📊 Current MongoDB contacts: ${currentContacts}`);
    } catch (error) {
        console.log('⚠️ Could not connect to MongoDB for comparison');
    }
    
    const analyzer = new MauticContactAnalyzer();
    
    // Step 1: Authenticate
    const authSuccess = await analyzer.authenticate();
    if (!authSuccess) {
        console.log('\n❌ Cannot proceed without Mautic authentication');
        console.log('🔧 Please check your Mautic OAuth credentials and redirect URI');
        return;
    }
    
    // Step 2: Get contact count
    const contactCountData = await analyzer.getContactCount();
    if (!contactCountData.success) {
        console.log('\n❌ Cannot proceed without contact count data');
        return;
    }
    
    // Step 3: Get contact sample for size analysis
    const sampleData = await analyzer.getContactSample(10);
    
    // Step 4: Get segment analysis
    const segmentData = await analyzer.getContactsBySegment();
    
    // Step 5: Analyze import limitations
    const analysisData = {
        total: contactCountData.total,
        averageSizeKB: sampleData.averageSizeKB || 1,
        fieldCount: sampleData.fieldCount || 10
    };
    
    const limitationAnalysis = analyzer.analyzeImportLimitations(analysisData);
    
    // Summary
    console.log('\n📋 SUMMARY REPORT');
    console.log('━'.repeat(50));
    console.log(`📊 Mautic Contacts: ${contactCountData.total}`);
    console.log(`💾 Estimated Storage: ${limitationAnalysis.estimatedStorageMB.toFixed(2)} MB`);
    console.log(`⏱️ Import Time: ${(limitationAnalysis.importTimeEstimate/60).toFixed(1)} minutes`);
    console.log(`🎯 Feasible: ${limitationAnalysis.feasible ? 'YES' : 'NEEDS PLANNING'}`);
    
    await mongoose.disconnect();
}

// Run the analysis
analyzeMauticContacts().catch(console.error);