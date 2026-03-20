const express = require('express');
const router  = express.Router();
const {
  getProducts, getProduct, createProduct,
  updateProduct, deleteProduct, getFeaturedProducts,
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/auth');

// ── Public ──────────────────────────────────────────────────────────────────
router.get('/featured', getFeaturedProducts);
router.get('/',         getProducts);

// ── Seller: get only their own products ─────────────────────────────────────
// Must be BEFORE /:id so it doesn't get caught as an id param
router.get('/mine', protect, async (req, res) => {
  try {
    const Product = require('../models/Product');
    // Admin sees all products; seller sees only their own
    const query = req.user.role === 'admin'
      ? {}
      : { createdBy: req.user._id };
    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── Public: single product ───────────────────────────────────────────────────
router.get('/:id', getProduct);

// ── Admin + Seller: create & update ─────────────────────────────────────────
router.post('/',   protect, isSeller, createProduct);
router.put('/:id', protect, isSeller, isOwnerOrAdmin, updateProduct);

// ── Admin only: delete ───────────────────────────────────────────────────────
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;

// ── Middleware helpers ───────────────────────────────────────────────────────

// Allow admin or seller roles
function isSeller(req, res, next) {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'seller')) {
    return next();
  }
  res.status(403).json({ success: false, message: 'Not authorized as admin or seller' });
}

// Allow update only if admin OR the seller who created it
async function isOwnerOrAdmin(req, res, next) {
  try {
    if (req.user.role === 'admin') return next();
    const Product = require('../models/Product');
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.createdBy.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized to edit this product' });
    next();
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}