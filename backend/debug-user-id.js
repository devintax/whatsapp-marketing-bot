const jwt = require('jsonwebtoken');

// Decode JWT token to see user ID
const loginData = {
  email: 'vkgbewonyo@gmail.com',
  password: 'BIDOpc2017$!'
};

// JWT secret from .env file
const JWT_SECRET = '3XmZ+g08XonofST37h5XKzwK9i7T4t5yW+4GLy1zXoS2XVW5+PPlzd0JIStRHBz6BxjYS8EeChcbEfiSewqiLA==';

console.log('🔍 Checking JWT token user ID...');

const axios = require('axios');

async function checkUserID() {
  try {
    // Login to get token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', loginData);
    const token = loginResponse.data.token;
    
    // Decode token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Decoded JWT token:', JSON.stringify(decoded, null, 2));
    
    // Also check the MongoDB for this user
    const mongoose = require('mongoose');
    await mongoose.connect('mongodb+srv://ubayclothings_db_user:tZ29wDhlC5DSsEqP@cluster0.ijeqwjt.mongodb.net/whatsapp_marketing_bot?retryWrites=true&w=majority&appName=Cluster0');
    
    const User = require('./models/User');
    const Contact = require('./models/Contact');
    
    const user = await User.findOne({ email: loginData.email });
    console.log('👤 User from database:', user ? user._id.toString() : 'Not found');
    
    if (user) {
      const contacts = await Contact.find({ user: user._id });
      console.log(`📞 Contacts for user ${user._id}:`, contacts.length);
      
      if (contacts.length > 0) {
        console.log('📋 Sample contact:', JSON.stringify(contacts[0], null, 2));
      }
    }
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUserID();