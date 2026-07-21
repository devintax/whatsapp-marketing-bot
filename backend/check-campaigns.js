const mongoose = require('mongoose');
const Campaign = require('./models/Campaign');

mongoose.connect('mongodb://localhost:27017/whatsapp-bot', { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connection.once('open', async () => {
  try {
    const campaigns = await Campaign.find({}).limit(3);
    console.log('=== CAMPAIGNS DATA ===');
    campaigns.forEach((campaign, index) => {
      console.log(`\nCampaign ${index + 1}: ${campaign.name}`);
      console.log('aiPrompt:', campaign.aiPrompt);
      console.log('description:', campaign.description);
      console.log('design:', JSON.stringify(campaign.design, null, 2));
      
      // Test message extraction logic
      let message = campaign.aiPrompt || campaign.description || 'Hello from Divine Financial Group!';
      if (campaign.design && campaign.design.message_sequence && campaign.design.message_sequence.length > 0) {
        message = campaign.design.message_sequence[0].content;
      }
      console.log('EXTRACTED MESSAGE:', message);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
});