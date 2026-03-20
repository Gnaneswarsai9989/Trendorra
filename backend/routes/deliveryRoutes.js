// ═══════════════════════════════════════════════════════════════════
// FILE: backend/routes/deliveryRoutes.js
// Complete delivery system — prototype now, real after deploy
//
// HOW TO GO LIVE (after deploy):
// 1. Set PROTOTYPE_MODE=false in .env
// 2. Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in .env
// 3. Set SHIPROCKET_WEBHOOK_TOKEN=any_secret_string in .env
// 4. In Shiprocket dashboard → Settings → Webhooks:
//    URL:   https://yourdomain.com/api/delivery/webhook
//    Token: same value as SHIPROCKET_WEBHOOK_TOKEN
// 5. Restart backend → everything works automatically ✅
// ═══════════════════════════════════════════════════════════════════
const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');
const User    = require('../models/User');
const { protect, admin, seller } = require('../middleware/auth');
const {
  createShipment,
  trackShipment,
  cancelShipment,
  mapDelhiveryStatus,
  PROTOTYPE_MODE,
} = require('../utils/shiprocket');

const STATUS_FLOW = ['Processing', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'];

// ── 1. Seller: Mark order ready for pickup ────────────────────────
// POST /api/delivery/ready/:orderId
// Seller clicks this → Shiprocket schedules pickup from THEIR address
router.post('/ready/:orderId', protect, seller, async (req, res) => {
  try {
    const order      = await Order.findById(req.params.orderId)
                                  .populate('user', 'name phone email');
    const sellerUser = await User.findById(req.user._id);

    if (!order)
      return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.orderStatus !== 'Processing')
      return res.status(400).json({ success: false, message: `Order is already ${order.orderStatus}` });

    let waybill = null;
    try {
      const result = await createShipment(order, sellerUser);
      waybill      = result?.packages?.[0]?.waybill || null;
      console.log(`📦 Shipment: ${waybill} ${PROTOTYPE_MODE ? '[PROTOTYPE]' : '[SHIPROCKET LIVE]'}`);
    } catch (err) {
      console.error('⚠️ Shiprocket error:', err.message);
      // Don't block the seller — still mark as confirmed
    }

    order.orderStatus = 'Confirmed';
    order.trackingId  = waybill;
    order.readyAt     = new Date();
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status:    'Confirmed',
      timestamp: new Date(),
      note:      PROTOTYPE_MODE
        ? `Prototype waybill: ${waybill}`
        : `Shiprocket AWB: ${waybill} | Pickup from seller address`,
    });
    await order.save();

    res.json({
      success: true,
      message: PROTOTYPE_MODE
        ? `📦 [Prototype] Pickup scheduled! Waybill: ${waybill}`
        : `📦 Shiprocket pickup scheduled from your address! AWB: ${waybill}`,
      waybill,
      order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── 2. Track shipment ─────────────────────────────────────────────
// GET /api/delivery/track/:waybill
router.get('/track/:waybill', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ trackingId: req.params.waybill });
    const data  = await trackShipment(req.params.waybill, order?.orderStatus);
    res.json({ success: true, data, currentStatus: order?.orderStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── 3. Admin: Cancel shipment ─────────────────────────────────────
// POST /api/delivery/cancel/:orderId
router.post('/cancel/:orderId', protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.trackingId) {
      await cancelShipment(order.trackingId).catch(e => console.error('Cancel error:', e.message));
    }

    order.orderStatus    = 'Cancelled';
    order.payoutEligible = false;
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({ status: 'Cancelled', timestamp: new Date(), note: 'Cancelled by admin' });
    await order.save();

    res.json({ success: true, message: 'Order cancelled', order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── 4. PROTOTYPE: Simulate next delivery step ─────────────────────
// POST /api/delivery/simulate/:orderId
// This route is disabled in real mode automatically
router.post('/simulate/:orderId', protect, async (req, res) => {
  if (!PROTOTYPE_MODE) {
    return res.status(403).json({ success: false, message: 'Simulation disabled in live mode' });
  }
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const currentIndex = STATUS_FLOW.indexOf(order.orderStatus);
    if (currentIndex === -1 || currentIndex >= STATUS_FLOW.length - 1) {
      return res.status(400).json({ success: false, message: `Already at: ${order.orderStatus}` });
    }

    const nextStatus  = STATUS_FLOW[currentIndex + 1];
    order.orderStatus = nextStatus;
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status:    nextStatus,
      timestamp: new Date(),
      note:      `[PROTOTYPE] Simulated → ${nextStatus}`,
    });

    if (nextStatus === 'Delivered') {
      order.isDelivered    = true;
      order.deliveredAt    = new Date();
      order.payoutEligible = true;
      console.log(`✅ [PROTOTYPE] Order ${order._id} delivered. Payout ENABLED.`);
    }
    await order.save();

    res.json({
      success:        true,
      message:        `[Prototype] Status → ${nextStatus}`,
      previousStatus: STATUS_FLOW[currentIndex],
      newStatus:      nextStatus,
      payoutEligible: order.payoutEligible,
      order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── 5. Shiprocket Webhook ─────────────────────────────────────────
// POST /api/delivery/webhook
// Shiprocket calls this automatically when delivery status changes
// Set this URL in: Shiprocket → Settings → Webhooks
// Note: URL must NOT contain words "shiprocket", "sr", "kr" per their rules
router.post('/webhook', async (req, res) => {
  try {
    // Verify webhook token (Shiprocket sends it as x-api-key header)
    const webhookToken = process.env.SHIPROCKET_WEBHOOK_TOKEN;
    if (webhookToken) {
      const receivedToken = req.headers['x-api-key'] || req.headers['authorization'];
      if (receivedToken !== webhookToken) {
        console.warn('⚠️ Webhook: Invalid token received');
        return res.status(200).json({ success: true }); // Always 200 to avoid Shiprocket retries
      }
    }

    const body = req.body;

    // Shiprocket webhook payload
    const awb    = body.awb || body.waybill || body.tracking_id;
    const status = body.current_status || body.status;

    console.log(`🔔 Shiprocket webhook: AWB=${awb} | Status=${status}`);

    if (!awb || !status) {
      return res.status(200).json({ success: true, message: 'No actionable data' });
    }

    const order = await Order.findOne({ trackingId: awb });
    if (!order) {
      console.log(`⚠️ Webhook: No order found for AWB ${awb}`);
      return res.status(200).json({ success: true });
    }

    const newStatus = mapDelhiveryStatus(status);

    if (newStatus && order.orderStatus !== newStatus) {
      const previousStatus  = order.orderStatus;
      order.orderStatus     = newStatus;
      if (!order.statusHistory) order.statusHistory = [];
      order.statusHistory.push({
        status:    newStatus,
        timestamp: new Date(),
        note:      `Shiprocket: ${status}`,
      });

      if (newStatus === 'Delivered') {
        order.isDelivered    = true;
        order.deliveredAt    = new Date();
        order.payoutEligible = true;
        console.log(`✅ Order ${order._id} DELIVERED. Payout ENABLED.`);
      }

      await order.save();
      console.log(`📊 Order ${order._id}: ${previousStatus} → ${newStatus}`);
    }

    res.status(200).json({ success: true }); // Always 200 to Shiprocket
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(200).json({ success: true }); // Always 200 even on error
  }
});

module.exports = router;