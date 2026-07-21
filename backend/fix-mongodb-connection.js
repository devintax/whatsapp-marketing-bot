const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
require('dotenv').config();

async function testConnections() {
    console.log('🔍 MongoDB Connection Diagnostics');
    console.log('================================\n');

    // Test 1: Current MongoDB URI from .env
    console.log('1. Testing current MongoDB URI from .env...');
    const currentUri = process.env.MONGODB_URI;
    console.log(`   URI: ${currentUri ? currentUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : 'NOT FOUND'}`);
    
    if (!currentUri) {
        console.log('   ❌ MONGODB_URI not found in environment variables');
        return;
    }

    try {
        console.log('   Testing with MongoClient...');
        const client = new MongoClient(currentUri);
        await client.connect();
        console.log('   ✅ MongoClient connection successful');
        
        const db = client.db();
        const collections = await db.listCollections().toArray();
        console.log(`   📊 Database has ${collections.length} collections:`, collections.map(c => c.name));
        
        await client.close();
    } catch (error) {
        console.log('   ❌ MongoClient failed:', error.message);
    }

    try {
        console.log('   Testing with Mongoose...');
        await mongoose.connect(currentUri);
        console.log('   ✅ Mongoose connection successful');
        
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`   📊 Database has ${collections.length} collections via Mongoose`);
        
        await mongoose.disconnect();
    } catch (error) {
        console.log('   ❌ Mongoose failed:', error.message);
    }

    // Test 2: Try alternative connection string format
    console.log('\n2. Testing alternative MongoDB Atlas connection...');
    const alternativeUri = currentUri.replace('cluster0.ijeqwjt.mongodb.net', 'whatsappmarketingbot.v3ovu.mongodb.net');
    console.log(`   Alternative URI: ${alternativeUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
    
    try {
        const client = new MongoClient(alternativeUri);
        await client.connect();
        console.log('   ✅ Alternative connection successful');
        await client.close();
    } catch (error) {
        console.log('   ❌ Alternative connection failed:', error.message);
    }

    // Test 3: Check if this is a network/DNS issue
    console.log('\n3. Network diagnostic...');
    try {
        const dns = require('dns').promises;
        const hostname = currentUri.match(/@([^/]+)/)?.[1];
        if (hostname) {
            console.log(`   Resolving DNS for: ${hostname}`);
            const addresses = await dns.lookup(hostname);
            console.log('   ✅ DNS resolution successful:', addresses);
        }
    } catch (error) {
        console.log('   ❌ DNS resolution failed:', error.message);
    }

    console.log('\n📋 RECOMMENDATIONS:');
    console.log('1. Verify MongoDB Atlas cluster is running');
    console.log('2. Check network/firewall restrictions');
    console.log('3. Confirm database user permissions');
    console.log('4. Consider switching to local MongoDB for development');
    
    // Generate a fix script
    console.log('\n🔧 Generating connection fix...');
    
    const fixScript = `
# Add to backend/.env (backup current first)
# Option 1: Use local MongoDB (recommended for development)
MONGODB_URI=mongodb://localhost:27017/whatsapp_marketing_bot

# Option 2: Update cluster hostname if needed
# MONGODB_URI=mongodb+srv://ubayclothings_db_user:tZ29wDhlC5DSsEqP@whatsappmarketingbot.v3ovu.mongodb.net/whatsapp_marketing_bot?retryWrites=true&w=majority

# Option 3: Add connection timeout options
# MONGODB_URI=mongodb+srv://ubayclothings_db_user:tZ29wDhlC5DSsEqP@cluster0.ijeqwjt.mongodb.net/whatsapp_marketing_bot?retryWrites=true&w=majority&connectTimeoutMS=10000&socketTimeoutMS=10000
`;

    require('fs').writeFileSync('mongodb-connection-fix.txt', fixScript);
    console.log('   📝 Fix options saved to mongodb-connection-fix.txt');
}

testConnections().catch(console.error);