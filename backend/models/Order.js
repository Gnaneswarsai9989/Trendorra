const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  image: String,
  price: { type: Number, required: true },
  size: String,
  color: String,
  quantity: { type: Number, required: true, min: 1 },
});

const shippingAddressSchema = new mongoose.Schema({
  fullName: String,
  phone: String,
  addressLine1: String,
  addressLine2: String,
  city: String,
  state: String,
  pincode: String,
  country: { type: String, default: 'India' },
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderItems: [orderItemSchema],
  shippingAddress: shippingAddressSchema,
  paymentMethod: { type: String, enum: ['Stripe', 'Razorpay', 'COD'], default: 'Razorpay' },
  paymentResult: {
    id: String,
    status: String,
    updateTime: String,
    emailAddress: String,
  },
  subtotal: { type: Number, required: true },
  shippingPrice: { type: Number, default: 0 },
  taxPrice: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true },
  isPaid: { type: Boolean, default: false },
  paidAt: Date,
  orderStatus: {
    type: String,
    enum: ['Processing', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'],
    default: 'Processing',
  },
  trackingNumber: String,
  estimatedDelivery: Date,
  deliveredAt: Date,
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    message: String,
  }],

  trackingId:     { type: String,  default: null  },
  payoutEligible: { type: Boolean, default: false },
  readyAt:        { type: Date },
  statusHistory:  [{

    status:    { type: String },
    timestamp: { type: Date,   default: Date.now },
    note:      { type: String, default: '' },

  }],


}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);