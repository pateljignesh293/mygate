const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
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
  amount: {
    type: Number,
    required: [true, 'Please provide payment amount'],
    min: 0
  },
  type: {
    type: String,
    enum: ['maintenance', 'fine', 'amenity_booking', 'other'],
    default: 'maintenance'
  },
  month: {
    type: String, // Format: "YYYY-MM"
    required: function() {
      return this.type === 'maintenance';
    }
  },
  year: {
    type: Number
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['online', 'cash', 'cheque', 'upi', 'card'],
    default: 'online'
  },
  razorpayOrderId: {
    type: String
  },
  razorpayPaymentId: {
    type: String
  },
  razorpaySignature: {
    type: String
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  receiptUrl: {
    type: String
  },
  paidAt: {
    type: Date
  },
  dueDate: {
    type: Date
  },
  lateFee: {
    type: Number,
    default: 0
  },
  fineAmount: {
    type: Number,
    default: 0
  },
  breakdown: [{
    item: String,
    amount: Number
  }],
  notes: {
    type: String
  },
  flatNo: {
    type: String,
    required: true
  },
  block: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
paymentSchema.index({ residentId: 1 });
paymentSchema.index({ societyId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ month: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ razorpayOrderId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
