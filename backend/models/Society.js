const mongoose = require('mongoose');

const societySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide society name'],
    trim: true
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' }
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  blocks: [{
    name: { type: String, required: true },
    totalFlats: { type: Number, required: true }
  }],
  totalFlats: {
    type: Number,
    required: true
  },
  contactNumber: {
    type: String,
    required: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  logo: {
    type: String,
    default: ''
  },
  settings: {
    visitorApprovalRequired: { type: Boolean, default: true },
    deliveryApprovalRequired: { type: Boolean, default: true },
    allowGuestEntry: { type: Boolean, default: false },
    autoApproveResidents: { type: Boolean, default: false }
  },
  amenities: [{
    name: { type: String, required: true },
    description: String,
    capacity: Number,
    bookingRequired: { type: Boolean, default: false },
    hourlyRate: Number
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
societySchema.index({ name: 1 });
societySchema.index({ 'address.city': 1 });

module.exports = mongoose.model('Society', societySchema);
