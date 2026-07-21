const mongoose = require('mongoose');
require('dotenv').config();

async function debugAndFixCredentials() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Import the CRMIntegration model
    const CRMIntegration = require('./models/CRMIntegration');
    
    console.log('\n🔍 Looking for CRM integrations...');
    const integrations = await CRMIntegration.find({});
    console.log(`📋 Found ${integrations.length} CRM integration(s)`);
    
    if (integrations.length === 0) {
      console.log('❌ No CRM integrations found. Creating one...');
      
      // Create a new Mautic integration with proper credentials
      const newIntegration = await CRMIntegration.create({
        user: new mongoose.Types.ObjectId('68f4bcc2eb61f568f2f30db6'), // User ID from logs
        name: 'Mautic CRM Integration',
        type: 'mautic',
        status: 'active',
        credentials: {
          apiUrl: 'https://dfgbusiness.com/mautic',
          username: 'admin@dfgbusiness.com',
          password: 'GISpcServer2017$!'
        },
        settings: {
          syncDirection: 'import',
          syncFrequency: 'manual'
        }
      });
      
      console.log(`✅ Created new integration with ID: ${newIntegration._id}`);
    } else {
      // Check and fix existing integrations
      for (const integration of integrations) {
        console.log(`\n🔍 Checking integration: ${integration._id}`);
        console.log(`📝 Name: ${integration.name}`);
        console.log(`🔧 Type: ${integration.type}`);
        console.log(`📊 Status: ${integration.status}`);
        
        const creds = integration.credentials || {};
        console.log(`🔑 Credentials check:`);
        console.log(`   - API URL: ${creds.apiUrl || 'Missing'}`);
        console.log(`   - Username: ${creds.username ? 'Present' : 'Missing'}`);
        console.log(`   - Password: ${creds.password ? 'Present' : 'Missing'}`);
        console.log(`   - Access Token: ${creds.accessToken ? 'Present' : 'Missing'}`);
        
        if (integration.type === 'mautic') {
          const hasOAuth = creds.accessToken;
          const hasBasicAuth = creds.username && creds.password;
          
          if (!hasOAuth && !hasBasicAuth) {
            console.log(`❌ Integration ${integration._id} is missing credentials`);
            console.log(`🔧 Adding Basic Auth credentials...`);
            
            await CRMIntegration.findByIdAndUpdate(integration._id, {
              status: 'active',
              credentials: {
                ...creds,
                apiUrl: 'https://dfgbusiness.com/mautic',
                username: 'admin@dfgbusiness.com',
                password: 'GISpcServer2017$!'
              }
            });
            
            console.log(`✅ Updated integration ${integration._id} with Basic Auth`);
          } else {
            console.log(`✅ Integration ${integration._id} has valid credentials`);
          }
        }
      }
    }
    
    // Final verification
    console.log('\n🔍 Final verification...');
    const finalIntegrations = await CRMIntegration.find({});
    
    for (const integration of finalIntegrations) {
      console.log(`\n📋 Integration: ${integration._id}`);
      console.log(`   - Type: ${integration.type}`);
      console.log(`   - Status: ${integration.status}`);
      console.log(`   - Ready for sync: ${
        integration.type === 'mautic' && 
        (integration.credentials?.accessToken || 
         (integration.credentials?.username && integration.credentials?.password))
        ? '✅ YES' : '❌ NO'
      }`);
    }
    
    await mongoose.disconnect();
    console.log('\n🔚 Done! Database connection closed.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugAndFixCredentials();