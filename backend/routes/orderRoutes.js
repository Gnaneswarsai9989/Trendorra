// routes/orderRoutes.js — FIXED
// BUG: getAllOrders had `admin` middleware — sellers were blocked
// FIX: replaced with `adminOrSeller` middleware

const express = require('express');
const router  = express.Router();
const {
  createOrder,
  cancelOrder,
  getMyOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
  deleteAllOrders,
  deleteMyOrders,
  resetRevenueData,
} = require('../controllers/mainControllers');
const { protect, admin, seller } = require('../middleware/auth');

// ── Customer ──────────────────────────────────────────────────────
router.post('/',           protect,              createOrder);
router.get('/my-orders',   protect,              getMyOrders);
router.put('/:id/cancel',  protect,              cancelOrder);
router.get('/:id',         protect,              getOrder);

// ── ✅ FIX: Admin AND Seller can both call /all ───────────────────
// Old code: protect, admin  ← seller was BLOCKED here
// New code: protect, adminOrSeller
router.get('/all',         protect, adminOrSeller, getAllOrders);

// ── Admin only ────────────────────────────────────────────────────
router.put('/:id/status',  protect, admin,         updateOrderStatus);
router.delete('/admin/delete-all-orders', protect, admin, deleteAllOrders);
router.put('/admin/reset-revenue',        protect, admin, resetRevenueData);

// ── Seller only ───────────────────────────────────────────────────
router.delete('/seller/my-orders', protect, seller, deleteMyOrders);

module.exports = router;

// ── Middleware ─────────────────────────────────────────────────────
function adminOrSeller(req, res, next) {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'seller')) {
    return next();
  }
  res.status(403).json({ success: false, message: 'Admin or Seller access required' });
}