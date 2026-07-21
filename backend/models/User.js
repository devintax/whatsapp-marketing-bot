const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  
  // Personal Information
  firstName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  profilePicture: {
    type: String,
    default: ''
  },
  
  // Business Profile (Enhanced)
  businessProfile: {
    businessName: {
      type: String,
      default: function() {
        return this.name || this.email.split('@')[0];
      }
    },
    industry: {
      type: String,
      default: 'other',
      enum: ['finance', 'retail', 'healthcare', 'education', 'technology', 'real_estate', 'consulting', 'marketing', 'other']
    },
    description: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      default: ''
    },
    website: {
      type: String,
      default: ''
    },
    address: {
      type: String,
      default: ''
    },
    logo: {
      type: String,
      default: ''
    }
  },
  
  // User Preferences
  preferences: {
    timezone: {
      type: String,
      default: 'America/New_York'
    },
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'es', 'fr', 'de', 'pt']
    },
    dateFormat: {
      type: String,
      default: 'MM/DD/YYYY',
      enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']
    },
    timeFormat: {
      type: String,
      default: '12h',
      enum: ['12h', '24h']
    }
  },
  
  // Notification Settings
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    whatsapp: {
      type: Boolean,
      default: false
    },
    campaignUpdates: {
      type: Boolean,
      default: true
    },
    contactImports: {
      type: Boolean,
      default: true
    },
    weeklyReports: {
      type: Boolean,
      default: true
    }
  },
  
  // AI Preferences
  aiPreferences: {
    preferredProvider: {
      type: String,
      default: 'groq',
      enum: ['openai', 'groq', 'gemini', 'claude']
    },
    defaultTone: {
      type: String,
      default: 'professional',
      enum: ['professional', 'friendly', 'casual', 'formal', 'persuasive']
    },
    autoTrainContext: {
      type: Boolean,
      default: true
    }
  },
  
  // Security & Account Info
  lastLogin: {
    type: Date
  },
  lastPasswordChange: {
    type: Date,
    default: Date.now
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  accountLocked: {
    type: Boolean,
    default: false
  },
  
  // Subscription Info (for future use)
  subscription: {
    plan: {
      type: String,
      default: 'free',
      enum: ['free', 'basic', 'pro', 'enterprise']
    },
    status: {
      type: String,
      default: 'active',
      enum: ['active', 'trial', 'suspended', 'cancelled']
    },
    contactLimit: {
      type: Number,
      default: 100
    },
    campaignLimit: {
      type: Number,
      default: 10
    }
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`.trim();
  }
  return this.name || this.email.split('@')[0];
});

// Virtual for display name (used in UI)
userSchema.virtual('displayName').get(function() {
  return this.businessProfile?.businessName || this.fullName;
});

// Method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  this.loginAttempts = 0;
  return this.save();
};

// Method to increment login attempts
userSchema.methods.incrementLoginAttempts = function() {
  this.loginAttempts += 1;
  if (this.loginAttempts >= 5) {
    this.accountLocked = true;
  }
  return this.save();
};

// Ensure virtuals are included in JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);