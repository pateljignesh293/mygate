const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  residentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide complaint title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide complaint description']
  },
  category: {
    type: String,
    enum: ['maintenance', 'security', 'cleaning', 'amenities', 'billing', 'noise', 'parking', 'other'],
    required: true,
    default: 'other'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed', 'rejected'],
    default: 'open'
  },
  images: [{
    url: String,
    name: String
  }],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: {
    type: Date
  },
  resolvedAt: {
    type: Date
  },
  resolution: {
    type: String
  },
  resolutionImages: [{
    url: String,
    name: String
  }],
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: {
    type: String
  },
  flatNo: {
    type: String,
    required: true
  },
  block: {
    type: String
  },
  location: {
    type: String // Specific location within society
  },
  updates: [{
    message: { type: String, required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedAt: { type: Date, default: Date.now },
    attachments: [{
      url: String,
      name: String
    }]
  }],
  isPublic: {
    type: Boolean,
    default: false // If true, visible to all residents
  }
}, {
  timestamps: true
});

// Indexes
complaintSchema.index({ residentId: 1 });
complaintSchema.index({ societyId: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ createdAt: -1 });
complaintSchema.index({ assignedTo: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
