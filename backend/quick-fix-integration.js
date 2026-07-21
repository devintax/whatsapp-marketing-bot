// Quick fix script to ensure the problematic integration has credentials
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const CRMIntegration = require('./models/CRMIntegration');
  
  const integrationId = '68f4c592ee0de5bb2c9f567b';
  console.log(`Fixing integration ${integrationId}...`);
  
  const result = await CRMIntegration.findByIdAndUpdate(integrationId, {
    status: 'active',
    credentials: {
      apiUrl: 'https://dfgbusiness.com/mautic',
      username: 'admin@dfgbusiness.com',
      password: 'GISpcServer2017$!'
    }
  }, { new: true });
  
  if (result) {
    console.log('✅ Integration updated successfully');
    console.log('Credentials:', {
      apiUrl: result.credentials?.apiUrl,
      hasUsername: !!result.credentials?.username,
      hasPassword: !!result.credentials?.password
    });
  } else {
    console.log('❌ Integration not found');
  }
  
  await mongoose.disconnect();
}).catch(console.error);