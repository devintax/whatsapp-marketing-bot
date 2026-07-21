const mongoose = require('mongoose');
require('dotenv').config();

async function consolidateAndFixIntegrations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const CRMIntegration = require('./models/CRMIntegration');
    
    // Find all integrations for this user
    const userId = '68f4bcc2eb61f568f2f30db6';
    const integrations = await CRMIntegration.find({ user: userId });
    console.log(`Found ${integrations.length} integrations for user ${userId}`);
    
    for (const integration of integrations) {
      console.log(`\nIntegration ${integration._id}:`);
      console.log(`- Type: ${integration.type}`);
      console.log(`- Status: ${integration.status}`);
      console.log(`- Name: ${integration.name}`);
      
      const creds = integration.credentials || {};
      console.log(`- Credentials:`, {
        apiUrl: creds.apiUrl || 'Missing',
        username: creds.username ? 'Present' : 'Missing',
        password: creds.password ? 'Present' : 'Missing',
        accessToken: creds.accessToken ? 'Present' : 'Missing'
      });
      
      // If this is a Mautic integration without proper credentials, fix it
      if (integration.type === 'mautic') {
        const hasValidCreds = creds.accessToken || (creds.username && creds.password);
        
        if (!hasValidCreds) {
          console.log(`❌ Integration ${integration._id} missing credentials - FIXING`);
          
          await CRMIntegration.findByIdAndUpdate(integration._id, {
            status: 'active',
            credentials: {
              apiUrl: 'https://dfgbusiness.com/mautic',
              username: 'admin@dfgbusiness.com',
              password: 'GISpcServer2017$!'
            }
          });
          
          console.log(`✅ Fixed integration ${integration._id}`);
        } else {
          console.log(`✅ Integration ${integration._id} has valid credentials`);
        }
      }
    }
    
    // Show final state
    console.log('\n📋 Final state:');
    const finalIntegrations = await CRMIntegration.find({ user: userId });
    for (const integration of finalIntegrations) {
      const creds = integration.credentials || {};
      const hasValidCreds = creds.accessToken || (creds.username && creds.password);
      console.log(`${integration._id}: ${integration.type} - ${hasValidCreds ? '✅ READY' : '❌ MISSING CREDS'}`);
    }
    
    await mongoose.disconnect();
    console.log('\n🔚 Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

consolidateAndFixIntegrations();