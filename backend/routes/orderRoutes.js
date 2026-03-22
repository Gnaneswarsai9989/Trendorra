const express = require('express');
const router  = express.Router();
const {
  createOrder, cancelOrder, getMyOrders,
  getOrder, getAllOrders, updateOrderStatus, confirmOrder,
  deleteAllOrders, resetRevenueData, deleteMyOrders,
} = require('../controllers/mainControllers');
const { protect, admin, seller } = require('../middleware/auth');

// ══════════════════════════════════════════════════════════════════
// STATIC routes MUST come BEFORE dynamic /:id routes
// ══════════════════════════════════════════════════════════════════

// ── Static GET ────────────────────────────────────────────────────
router.get('/my-orders',  protect,           getMyOrders);
router.get('/all',        protect, adminOrSeller, getAllOrders);   // ← BEFORE /:id

// ── Static admin routes ───────────────────────────────────────────
router.delete('/admin/delete-all-orders', protect, admin, deleteAllOrders);
router.put('/admin/reset-revenue',        protect, admin, resetRevenueData);

// ── Static seller routes ──────────────────────────────────────────
router.delete('/seller/my-orders', protect, seller, deleteMyOrders);

// ── Create order ──────────────────────────────────────────────────
router.post('/', protect, createOrder);

// ══════════════════════════════════════════════════════════════════
// DYNAMIC /:id routes — MUST BE LAST
// ══════════════════════════════════════════════════════════════════
router.get('/:id',         protect,               getOrder);
router.put('/:id/confirm', protect, adminOrSeller, confirmOrder);
router.put('/:id/status',  protect, adminOrSeller, updateOrderStatus);
router.put('/:id/cancel',  protect,               cancelOrder);

module.exports = router;

// ── Middleware ─────────────────────────────────────────────────────
function adminOrSeller(req, res, next) {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'seller'))
    return next();
  res.status(403).json({ success: false, message: 'Admin or Seller access required' });
}