const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
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
  vehicleNumber: {
    type: String,
    required: [true, 'Please provide vehicle number'],
    uppercase: true,
    trim: true
  },
  vehicleType: {
    type: String,
    enum: ['car', 'bike', 'scooter', 'bicycle', 'other'],
    required: true
  },
  brand: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    trim: true
  },
  flatNo: {
    type: String,
    required: true
  },
  block: {
    type: String
  },
  isRegistered: {
    type: Boolean,
    default: true
  },
  registrationProof: {
    type: String // URL to document
  },
  entryLogs: [{
    entryTime: { type: Date, required: true },
    exitTime: Date,
    entryGate: { type: String },
    exitGate: String,
    loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    purpose: String,
    notes: String
  }],
  lastEntryTime: {
    type: Date
  },
  lastExitTime: {
    type: Date
  },
  isInside: {
    type: Boolean,
    default: false
  },
  parkingSlot: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
vehicleSchema.index({ vehicleNumber: 1 });
vehicleSchema.index({ residentId: 1 });
vehicleSchema.index({ societyId: 1 });
vehicleSchema.index({ isInside: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);
