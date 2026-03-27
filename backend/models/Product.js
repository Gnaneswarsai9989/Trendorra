const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Product name is required'], trim: true },
  description: { type: String, required: [true, 'Description is required'] },
  price: { type: Number, required: [true, 'Price is required'], min: 0 },
  discountPrice: { type: Number, default: 0 },
  images: [{ url: String, public_id: String }],
  videos: [{ url: String, public_id: String }],
  category: {
    type: String,
    required: true,
    enum: ['Men', 'Women', 'Streetwear', 'Accessories', 'Kids'],
  },
  subCategory: String,
  brand: { type: String, default: 'Trendora' },
  sizes: [{ type: String, enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'] }],
  colors: [{ name: String, hex: String }],
  stock: { type: Number, required: true, default: 0 },
  sku: { type: String, sparse: true },
  tags: [String],
  isFeatured: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  ratings: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  material: String,
  careInstructions: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });
productSchema.index({ category: 1, price: 1, ratings: -1 });

module.exports = mongoose.model('Product', productSchema);