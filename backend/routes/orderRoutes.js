const express = require('express');
const router = express.Router();
const {
  createOrder, cancelOrder, getMyOrders,
  getOrder, getAllOrders, updateOrderStatus, confirmOrder,
  deleteAllOrders, resetRevenueData, deleteMyOrders,
} = require('../controllers/mainControllers');
const {
  requestReturn, handleReturn, getAllReturns,
} = require('../controllers/returnController');
const { protect, admin, seller } = require('../middleware/auth');
const multer = require('multer');

// ── Multer: store images in memory for Cloudinary upload ──────────
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per image
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

// ══════════════════════════════════════════════════════════════════
// STATIC routes MUST come BEFORE dynamic /:id routes
// ══════════════════════════════════════════════════════════════════

// ── Static GET ────────────────────────────────────────────────────
router.get('/my-orders', protect, getMyOrders);
router.get('/all', protect, adminOrSeller, getAllOrders);   // ← BEFORE /:id

// ── Return requests list (admin/seller) ───────────────────────────
router.get('/returns/all', protect, adminOrSeller, getAllReturns);

// ── Static admin routes ───────────────────────────────────────────
router.delete('/admin/delete-all-orders', protect, admin, deleteAllOrders);
router.put('/admin/reset-revenue', protect, admin, resetRevenueData);

// ── Static seller routes ──────────────────────────────────────────
router.delete('/seller/my-orders', protect, seller, deleteMyOrders);

// ── Create order ──────────────────────────────────────────────────
router.post('/', protect, createOrder);

// ══════════════════════════════════════════════════════════════════
// DYNAMIC /:id routes — MUST BE LAST
// ══════════════════════════════════════════════════════════════════
router.get('/:id', protect, getOrder);
router.put('/:id/confirm', protect, adminOrSeller, confirmOrder);
router.put('/:id/status', protect, adminOrSeller, updateOrderStatus);
router.put('/:id/cancel', protect, cancelOrder);

// ── Return & Refund ───────────────────────────────────────────────
// Customer submits return request (with optional images)
router.post('/:id/return', protect, upload.array('images', 4), requestReturn);

// Seller or Admin approves / rejects the return
router.put('/:id/return', protect, adminOrSeller, handleReturn);

module.exports = router;

// ── Middleware helpers ─────────────────────────────────────────────
function adminOrSeller(req, res, next) {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'seller'))
    return next();
  res.status(403).json({ success: false, message: 'Admin or Seller access required' });
}