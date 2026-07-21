
// AUTOMATIC CRM INTEGRATION FIX SCRIPT
const mongoose = require('mongoose');

async function fixCRMIntegration() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://vemgoo:wms123@whatsappmarketingbot.v3ovu.mongodb.net/whatsapp_marketing_bot');
  
  const CRMIntegration = mongoose.model('CRMIntegration', new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    type: String,
    name: String,
    credentials: mongoose.Schema.Types.Mixed,
    status: String,
    settings: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }));

  // Delete existing integrations
  await CRMIntegration.deleteMany({});
  console.log('✅ Cleared existing CRM integrations');

  // Create new Mautic integration with correct settings
  const newIntegration = new CRMIntegration({
    userId: new mongoose.Types.ObjectId('68f414cbf6ad6398e4e159f9'), // Support user ID
    type: 'mautic',
    name: 'Mautic CRM - DFG Business',
    credentials: {
      apiUrl: 'https://dfgbusiness.com/mautic',
      clientId: 'YOUR_ACTUAL_CLIENT_ID_FROM_MAUTIC',
      clientSecret: 'YOUR_ACTUAL_CLIENT_SECRET_FROM_MAUTIC',
      redirectUri: 'https://connect.vemgootech.info/api/auth/mautic/callback',
      scopes: 'contacts:read contacts:write campaigns:read'
    },
    status: 'pending_auth',
    settings: {
      syncEnabled: true,
      syncInterval: 3600000,
      webhookUrl: 'https://api.vemgootech.info/webhook/mautic-contact'
    }
  });

  await newIntegration.save();
  console.log('✅ Created new Mautic integration record');
  console.log('📝 Integration ID:', newIntegration._id);
  
  await mongoose.disconnect();
}

fixCRMIntegration().catch(console.error);
