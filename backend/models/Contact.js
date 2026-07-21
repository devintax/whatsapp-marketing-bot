const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    lowercase: true
  },
  tags: [{
    type: String
  }],
  notes: {
    type: String
  },
  customFields: {
    type: Map,
    of: String
  },
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContactGroup'
  }],
  // CRM Integration fields
  mauticId: {
    type: String,
    sparse: true
  },
  crmSource: {
    type: String,
    enum: ['manual', 'mautic', 'suitecrm', 'zoho', 'hubspot', 'google', 'csv-import']
  },
  lastSync: {
    type: Date
  },
  // Status and activity tracking
  isActive: {
    type: Boolean,
    default: true
  },
  lastMessageSent: Date,
  messageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

contactSchema.index({ user: 1, phone: 1 }, { unique: true });
contactSchema.index({ user: 1, mauticId: 1 }, { sparse: true });
contactSchema.index({ user: 1, crmSource: 1 });

// Clear any existing model to ensure fresh schema
if (mongoose.models.Contact) {
  delete mongoose.models.Contact;
}

module.exports = mongoose.model('Contact', contactSchema);