const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code:          { type: String, required: true, unique: true, uppercase: true, trim: true },
  description:   { type: String, default: '' },
  discountType:  { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  discountValue: { type: Number, required: true },
  minOrderValue: { type: Number, default: 0 },
  maxDiscount:   { type: Number, default: null }, // max cap for percentage
  usageLimit:    { type: Number, default: null },  // null = unlimited
  usedCount:     { type: Number, default: 0 },
  validFrom:     { type: Date, default: Date.now },
  validTill:     { type: Date, required: true },
  isActive:      { type: Boolean, default: true },
  usedBy:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);