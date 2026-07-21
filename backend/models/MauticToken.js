const mongoose = require('mongoose');

const mauticTokenSchema = new mongoose.Schema({
  type: { 
    type: String, 
    default: 'mautic', 
    unique: true 
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Number, // Timestamp in milliseconds
    required: true
  },
  scope: {
    type: String,
    default: 'contacts:read contacts:write'
  },
  lastUsed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient lookups
mauticTokenSchema.index({ userId: 1, type: 1 }, { unique: true });

// Method to check if token is expired
mauticTokenSchema.methods.isExpired = function() {
  return Date.now() >= this.expiresAt - 60000; // 1 minute buffer
};

// Method to check if token is valid
mauticTokenSchema.methods.isValid = function() {
  return this.accessToken && this.refreshToken && !this.isExpired();
};

module.exports = mongoose.model('MauticToken', mauticTokenSchema);