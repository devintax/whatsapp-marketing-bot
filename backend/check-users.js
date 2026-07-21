const mongoose = require('mongoose');
const User = require('./models/User');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp_marketing_bot');
    console.log('📝 Connected to MongoDB');

    const users = await User.find({});
    console.log('\n👥 Users in database:');
    users.forEach(user => {
      console.log(`- Email: ${user.email}, Role: ${user.role}`);
    });

    if (users.length === 0) {
      console.log('\n🆕 No users found, creating admin user...');
      const newUser = new User({
        email: 'admin@dfgbusiness.com',
        password: 'GISpcServer2017$!',
        role: 'admin'
      });
      await newUser.save();
      console.log('✅ Admin user created successfully');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUsers();