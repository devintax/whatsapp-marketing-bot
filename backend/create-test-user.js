const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createTestUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('./models/User');
    
    // Check if user exists
    let user = await User.findOne({ email: 'vgbewonyo@gmail.com' });
    
    if (!user) {
      // Create test user
      const hashedPassword = await bcrypt.hash('BIDOpc2017$!', 10);
      user = new User({
        name: 'Vincent Gbewonyo',
        email: 'vgbewonyo@gmail.com',
        password: hashedPassword,
        role: 'admin'
      });
      await user.save();
      console.log('✅ User created: vgbewonyo@gmail.com / BIDOpc2017$!');
    } else {
      console.log('✅ User already exists: vgbewonyo@gmail.com / BIDOpc2017$!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    process.exit(1);
  }
}

createTestUser();