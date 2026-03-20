const express = require('express');
const router = express.Router();
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

router.post('/',              protect,        createOrder);
router.get('/my-orders',      protect,        getMyOrders);
router.get('/all',            protect, admin, getAllOrders);

// ── Seller: delete only their own orders ──
router.delete('/seller/my-orders', protect, seller, deleteMyOrders);

router.get('/:id',            protect,        getOrder);
router.put('/:id/status',     protect, admin, updateOrderStatus);
router.put('/:id/cancel',     protect,        cancelOrder);

// ── Admin reset routes ──
router.delete('/admin/delete-all-orders', protect, admin, deleteAllOrders);
router.put('/admin/reset-revenue',        protect, admin, resetRevenueData);

module.exports = router;