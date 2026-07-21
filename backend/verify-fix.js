const mongoose = require('mongoose');
require('dotenv').config();

async function verifyFix() {
  try {
    console.log('🔍 Verifying Fix Results\n');

    await mongoose.connect(process.env.MONGODB_URI);
    const Contact = require('./models/Contact');
    
    const userContacts = await Contact.countDocuments({ user: '68f4bcc2eb61f568f2f30db6' });
    const nullContacts = await Contact.countDocuments({ user: null });
    const totalContacts = await Contact.countDocuments();
    
    console.log('📊 Database Status After Fix:');
    console.log(`   Total contacts: ${totalContacts}`);
    console.log(`   User 68f4bcc2eb61f568f2f30db6 contacts: ${userContacts}`);
    console.log(`   Null user contacts: ${nullContacts}`);
    
    if (nullContacts === 0) {
      console.log('\n✅ Fix was successful - no more null user contacts!');
      console.log('🎯 The sync should now work without duplicate key errors.');
    } else {
      console.log('\n⚠️ There are still some null user contacts remaining.');
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

verifyFix();