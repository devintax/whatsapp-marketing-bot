const express = require('express');
const mongoose = require('mongoose');

const fixRoute = express.Router();

fixRoute.get('/fix-integration', async (req, res) => {
  try {
    console.log('🔧 Fixing integration credentials...');
    
    const integrationId = '68f4c592ee0de5bb2c9f567b';
    
    // Use direct MongoDB update
    const result = await mongoose.connection.db.collection('crmintegrations').updateOne(
      { _id: new mongoose.Types.ObjectId(integrationId) },
      {
        $set: {
          'credentials.username': 'admin@dfgbusiness.com',
          'credentials.password': 'GISpcServer2017$!',
          'credentials.apiUrl': 'https://dfgbusiness.com/mautic',
          status: 'active'
        }
      }
    );
    
    console.log('Update result:', result);
    
    // Verify the fix
    const updated = await mongoose.connection.db.collection('crmintegrations').findOne(
      { _id: new mongoose.Types.ObjectId(integrationId) }
    );
    
    res.json({
      success: true,
      updated: result.modifiedCount > 0,
      credentials: {
        hasUsername: !!updated?.credentials?.username,
        hasPassword: !!updated?.credentials?.password,
        apiUrl: updated?.credentials?.apiUrl
      }
    });
    
  } catch (error) {
    console.error('❌ Fix error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = fixRoute;