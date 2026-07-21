const mongoose = require('mongoose');

const businessDataSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dataType: {
    type: String,
    enum: ['service', 'product', 'promotion', 'company_info', 'faq', 'template'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  metadata: {
    category: String,
    tags: [String],
    priority: {
      type: Number,
      default: 1
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  aiTrainingData: {
    keywords: [String],
    context: String,
    useCase: String
  }
}, {
  timestamps: true
});

businessDataSchema.index({ user: 1, dataType: 1 });
businessDataSchema.index({ 'aiTrainingData.keywords': 1 });

module.exports = mongoose.model('BusinessData', businessDataSchema);