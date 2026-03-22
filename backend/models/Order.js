// ═══════════════════════════════════════════════════════════════
// models/Order.js  — FIXED VERSION
// Changes:
//   1. Removed duplicate statusHistory field
//   2. Added seller field to orderItemSchema
//   3. Added cancellationFee, refundAmount, refundStatus fields
//   4. Added payoutEligible, trackingId, readyAt (for delivery)
// ═══════════════════════════════════════════════════════════════
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  seller:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // ← NEW: who owns this item
  name:     String,
  image:    String,
  price:    { type: Number, required: true },
  size:     String,
  color:    String,
  quantity: { type: Number, required: true, min: 1 },
});

const shippingAddressSchema = new mongoose.Schema({
  fullName:     String,
  phone:        String,
  addressLine1: String,
  addressLine2: String,
  city:         String,
  state:        String,
  pincode:      String,
  country:      { type: String, default: 'India' },
});

const statusHistorySchema = new mongoose.Schema({
  status:    { type: String },
  timestamp: { type: Date, default: Date.now },
  message:   { type: String, default: '' },
  note:      { type: String, default: '' },
});

const orderSchema = new mongoose.Schema({
  user:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderItems:      [orderItemSchema],
  shippingAddress: shippingAddressSchema,

  paymentMethod: {
    type:    String,
    enum:    ['Stripe', 'Razorpay', 'COD'],
    default: 'Razorpay',
  },
  paymentResult: {
    id:           String,
    status:       String,
    updateTime:   String,
    emailAddress: String,
  },

  subtotal:      { type: Number, required: true },
  shippingPrice: { type: Number, default: 0 },
  taxPrice:      { type: Number, default: 0 },
  totalPrice:    { type: Number, required: true },
  isPaid:        { type: Boolean, default: false },
  paidAt:        Date,

  orderStatus: {
    type:    String,
    enum:    ['Processing', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'],
    default: 'Processing',
  },

  // Cancellation & Refund
  cancellationFee: { type: Number, default: 0 },
  refundAmount:    { type: Number, default: 0 },
  refundStatus:    { type: String, enum: ['NA', 'Pending', 'Processed'], default: 'NA' },

  // Tracking
  trackingNumber:    String,
  trackingId:        { type: String, default: null },  // for Shiprocket AWB
  estimatedDelivery: Date,
  deliveredAt:       Date,
  readyAt:           Date,

  // Payout
  payoutEligible: { type: Boolean, default: false },

  // Single statusHistory (fixed duplicate)
  statusHistory: [statusHistorySchema],

}, { timestamps: true });

// Indexes for performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ 'orderItems.seller': 1, createdAt: -1 }); // ← seller queries fast
orderSchema.index({ orderStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);