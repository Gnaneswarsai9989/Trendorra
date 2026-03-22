// ═══════════════════════════════════════════════════════════════════
// routes/deliveryRoutes.js
// PROTOTYPE MODE: simulate delivery steps manually
// REAL MODE: set PROTOTYPE_MODE=false → uses Shiprocket API
//
// STATUS FLOW:
// Processing → Confirmed → Shipped → Out for Delivery → Delivered
//
// HOW TO GO LIVE (after testing):
// 1. Set PROTOTYPE_MODE=false in .env
// 2. Set SHIPROCKET_EMAIL + SHIPROCKET_PASSWORD in .env
// 3. Set SHIPROCKET_WEBHOOK_TOKEN in .env
// 4. In Shiprocket dashboard → Webhooks → set URL to:
//    https://yourdomain.com/api/delivery/webhook
// ═══════════════════════════════════════════════════════════════════
const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');
const User    = require('../models/User');
const { protect, admin, seller } = require('../middleware/auth');

const PROTOTYPE_MODE = process.env.PROTOTYPE_MODE !== 'false';

const STATUS_FLOW = [
  'Processing',
  'Confirmed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
];

const getShiprocket = () => {
  if (PROTOTYPE_MODE) return null;
  try { return require('../utils/shiprocket'); }
  catch { return null; }
};

// ══════════════════════════════════════════════════════════════════
// 1. SELLER: Mark order ready for pickup — Processing → Confirmed
//    POST /api/delivery/ready/:orderId
// ══════════════════════════════════════════════════════════════════
router.post('/ready/:orderId', protect, sellerOrAdmin, async (req, res) => {
  try {
    const order      = await Order.findById(req.params.orderId).populate('user', 'name phone email');
    const sellerUser = await User.findById(req.user._id);

    if (!order)
      return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.orderStatus !== 'Processing')
      return res.status(400).json({ success: false, message: `Order is already ${order.orderStatus}` });

    let waybill = null;

    if (!PROTOTYPE_MODE) {
      try {
        const shiprocket = getShiprocket();
        if (shiprocket) {
          const result = await shiprocket.createShipment(order, sellerUser);
          waybill      = result?.packages?.[0]?.waybill || null;
          console.log(`📦 Shiprocket AWB: ${waybill}`);
        }
      } catch (err) {
        console.error('⚠️ Shiprocket error:', err.message);
      }
    } else {
      waybill = `PROTO${Date.now().toString().slice(-8)}`;
      console.log(`📦 [PROTOTYPE] Fake waybill: ${waybill}`);
    }

    order.orderStatus = 'Confirmed';
    order.trackingId  = waybill;
    order.readyAt     = new Date();
    order.statusHistory.push({
      status:    'Confirmed',
      timestamp: new Date(),
      message:   PROTOTYPE_MODE
        ? `[Prototype] Ready for pickup. Waybill: ${waybill}`
        : `Shiprocket pickup scheduled. AWB: ${waybill}`,
      updatedBy: req.user._id,
    });
    await order.save();

    res.json({
      success: true,
      message: PROTOTYPE_MODE
        ? `📦 [Prototype] Ready for pickup! Waybill: ${waybill}`
        : `📦 Pickup scheduled! AWB: ${waybill}`,
      waybill,
      order,
      mode: PROTOTYPE_MODE ? 'prototype' : 'live',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ══════════════════════════════════════════════════════════════════
// 2. PROTOTYPE: Simulate next delivery step
//    POST /api/delivery/simulate/:orderId
// ══════════════════════════════════════════════════════════════════
router.post('/simulate/:orderId', protect, sellerOrAdmin, async (req, res) => {
  if (!PROTOTYPE_MODE) {
    return res.status(403).json({
      success: false,
      message: 'Simulation is disabled in live mode. Shiprocket handles status updates via webhook.',
    });
  }

  try {
    const order = await Order.findById(req.params.orderId);
    if (!order)
      return res.status(404).json({ success: false, message: 'Order not found' });

    const currentIdx = STATUS_FLOW.indexOf(order.orderStatus);
    if (currentIdx === -1 || currentIdx >= STATUS_FLOW.length - 1) {
      return res.status(400).json({
        success: false,
        message: `Order is already at final status: ${order.orderStatus}`,
      });
    }

    const prevStatus = order.orderStatus;
    const nextStatus = STATUS_FLOW[currentIdx + 1];

    order.orderStatus = nextStatus;
    order.statusHistory.push({
      status:    nextStatus,
      timestamp: new Date(),
      message:   `[Prototype] Simulated: ${prevStatus} → ${nextStatus}`,
      updatedBy: req.user._id,
    });

    if (nextStatus === 'Delivered') {
      order.deliveredAt    = new Date();
      order.isPaid         = true;
      order.paymentStatus  = order.paymentMethod === 'COD' ? 'Paid' : order.paymentStatus;
      order.payoutEligible = true;
      console.log(`✅ [PROTOTYPE] Order ${order._id} delivered. Payout eligible.`);
    }

    await order.save();

    res.json({
      success:        true,
      message:        `[Prototype] ${prevStatus} → ${nextStatus}`,
      previousStatus: prevStatus,
      newStatus:      nextStatus,
      payoutEligible: order.payoutEligible,
      remainingSteps: STATUS_FLOW.slice(currentIdx + 2),
      order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ══════════════════════════════════════════════════════════════════
// 3. TRACK SHIPMENT — GET /api/delivery/track/:waybill
// ══════════════════════════════════════════════════════════════════
router.get('/track/:waybill', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ trackingId: req.params.waybill });

    if (PROTOTYPE_MODE) {
      return res.json({
        success: true,
        mode:    'prototype',
        waybill: req.params.waybill,
        currentStatus: order?.orderStatus || 'Unknown',
        statusHistory: order?.statusHistory || [],
        message: 'Prototype tracking — real tracking available after Shiprocket integration',
      });
    }

    const shiprocket = getShiprocket();
    if (shiprocket) {
      const data = await shiprocket.trackShipment(req.params.waybill, order?.orderStatus);
      return res.json({ success: true, data, currentStatus: order?.orderStatus });
    }

    res.json({ success: true, currentStatus: order?.orderStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ══════════════════════════════════════════════════════════════════
// 4. ADMIN: Cancel shipment — POST /api/delivery/cancel/:orderId
// ══════════════════════════════════════════════════════════════════
router.post('/cancel/:orderId', protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order)
      return res.status(404).json({ success: false, message: 'Order not found' });

    if (!PROTOTYPE_MODE && order.trackingId) {
      const shiprocket = getShiprocket();
      if (shiprocket) {
        await shiprocket.cancelShipment(order.trackingId).catch(e =>
          console.error('Cancel shipment error:', e.message)
        );
      }
    }

    for (const item of order.orderItems) {
      await require('../models/Product').findByIdAndUpdate(
        item.product, { $inc: { stock: item.quantity } }
      );
    }

    order.orderStatus    = 'Cancelled';
    order.payoutEligible = false;
    order.statusHistory.push({
      status: 'Cancelled', timestamp: new Date(),
      message: 'Cancelled by admin', updatedBy: req.user._id,
    });
    await order.save();

    res.json({ success: true, message: 'Order cancelled and shipment cancelled', order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ══════════════════════════════════════════════════════════════════
// 5. SHIPROCKET WEBHOOK — POST /api/delivery/webhook
// ══════════════════════════════════════════════════════════════════
router.post('/webhook', async (req, res) => {
  try {
    if (PROTOTYPE_MODE)
      return res.status(200).json({ success: true, message: 'Prototype mode — webhook ignored' });

    const token = process.env.SHIPROCKET_WEBHOOK_TOKEN;
    if (token) {
      const received = req.headers['x-api-key'] || req.headers['authorization'];
      if (received !== token) return res.status(200).json({ success: true });
    }

    const { awb, current_status } = req.body;
    if (!awb || !current_status) return res.status(200).json({ success: true });

    const order = await Order.findOne({ trackingId: awb });
    if (!order) return res.status(200).json({ success: true });

    const statusMap = {
      'pickup scheduled': 'Confirmed',
      'picked up':        'Shipped',
      'in transit':       'Shipped',
      'out for delivery': 'Out for Delivery',
      'delivered':        'Delivered',
      'undelivered':      'Out for Delivery',
      'rto initiated':    'Returned',
    };
    const newStatus = statusMap[current_status?.toLowerCase()];

    if (newStatus && order.orderStatus !== newStatus) {
      const prev        = order.orderStatus;
      order.orderStatus = newStatus;
      order.statusHistory.push({ status: newStatus, timestamp: new Date(), message: `Shiprocket: ${current_status}` });
      if (newStatus === 'Delivered') {
        order.deliveredAt    = new Date();
        order.isPaid         = true;
        order.paymentStatus  = order.paymentMethod === 'COD' ? 'Paid' : order.paymentStatus;
        order.payoutEligible = true;
      }
      await order.save();
      console.log(`📊 Webhook: Order ${order._id}: ${prev} → ${newStatus}`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(200).json({ success: true });
  }
});


// ══════════════════════════════════════════════════════════════════
// GET DELIVERY CHARGES FOR CUSTOMER
// GET /api/delivery/charges?customerPincode=500001&customerCity=Hyderabad&customerState=Telangana
// Called from checkout page to get zone-based delivery charge
// No auth required — public endpoint
// Returns: zone, charge, label, all zones for display
// ══════════════════════════════════════════════════════════════════
router.get('/charges', async (req, res) => {
  try {
    const { customerPincode, customerCity, customerState, productId } = req.query;

    // Zone definitions and charges
    const ZONES = {
      SAME_CITY:    { charge: 40,  label: 'Zone 1 — Same City',    days: '1-2 days'  },
      SAME_STATE:   { charge: 60,  label: 'Zone 2 — Same State',   days: '2-3 days'  },
      NEARBY_STATE: { charge: 80,  label: 'Zone 3 — Nearby State', days: '3-5 days'  },
      FAR_STATE:    { charge: 100, label: 'Zone 4 — Rest of India', days: '5-7 days'  },
    };

    const NEARBY_STATES = {
      'Maharashtra':    ['Gujarat','Goa','Madhya Pradesh','Karnataka','Telangana','Chhattisgarh'],
      'Delhi':          ['Haryana','Uttar Pradesh','Rajasthan','Punjab'],
      'Karnataka':      ['Kerala','Tamil Nadu','Andhra Pradesh','Telangana','Maharashtra','Goa'],
      'Tamil Nadu':     ['Kerala','Karnataka','Andhra Pradesh','Puducherry'],
      'Gujarat':        ['Maharashtra','Rajasthan','Madhya Pradesh'],
      'West Bengal':    ['Bihar','Jharkhand','Odisha','Sikkim','Assam'],
      'Telangana':      ['Andhra Pradesh','Maharashtra','Karnataka','Chhattisgarh','Odisha'],
      'Andhra Pradesh': ['Telangana','Karnataka','Tamil Nadu','Odisha'],
      'Rajasthan':      ['Gujarat','Madhya Pradesh','Uttar Pradesh','Haryana','Punjab','Delhi'],
      'Uttar Pradesh':  ['Delhi','Haryana','Rajasthan','Madhya Pradesh','Bihar','Jharkhand'],
      'Kerala':         ['Karnataka','Tamil Nadu'],
      'Punjab':         ['Haryana','Delhi','Himachal Pradesh','Rajasthan'],
      'Haryana':        ['Delhi','Punjab','Rajasthan','Uttar Pradesh'],
    };

    // Get seller address from product if productId provided
    let sellerCity  = '';
    let sellerState = '';
    let sellerPincode = '';

    if (productId) {
      try {
        const Product = require('../models/Product');
        const product = await Product.findById(productId).populate('createdBy', 'sellerInfo role');
        if (product?.createdBy?.role === 'seller') {
          sellerCity    = product.createdBy.sellerInfo?.address?.city    || '';
          sellerState   = product.createdBy.sellerInfo?.address?.state   || '';
          sellerPincode = product.createdBy.sellerInfo?.address?.pincode || '';
        }
      } catch (e) { /* ignore */ }
    }

    // Determine zone
    const uCity  = (customerCity  || '').trim().toLowerCase();
    const sCity  = sellerCity.trim().toLowerCase();
    const uState = (customerState || '').trim();
    const sState = sellerState.trim();

    let zoneName = 'FAR_STATE';

    if (sCity && uCity && uCity === sCity) {
      zoneName = 'SAME_CITY';
    } else if (sState && uState.toLowerCase() === sState.toLowerCase()) {
      zoneName = 'SAME_STATE';
    } else if (sState && (NEARBY_STATES[sState] || []).some(s => s.toLowerCase() === uState.toLowerCase())) {
      zoneName = 'NEARBY_STATE';
    }

    const zone = ZONES[zoneName];

    res.json({
      success: true,
      zone:    zoneName,
      charge:  zone.charge,
      label:   zone.label,
      days:    zone.days,
      // Return all zones for display in checkout
      allZones: Object.entries(ZONES).map(([key, val]) => ({
        key,
        ...val,
        active: key === zoneName,
      })),
      sellerCity,
      sellerState,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── Mode info ──────────────────────────────────────────────────────
router.get('/mode', async (req, res) => {
  const isPrototype = process.env.PROTOTYPE_MODE !== 'false';
  res.json({
    success:       true,
    mode:          isPrototype ? 'prototype' : 'live',
    isPrototype,
    shiprocketEmail: isPrototype ? null : (process.env.SHIPROCKET_EMAIL ? '✅ Configured' : '❌ Not set'),
    message:       isPrototype
      ? 'Prototype mode — set PROTOTYPE_MODE=false in .env to enable Shiprocket'
      : 'Live mode — Shiprocket API active',
    statusFlow: STATUS_FLOW,
  });
});


// ══════════════════════════════════════════════════════════════════
// CHECK PINCODE SERVICEABILITY
// GET /api/delivery/check-pincode?pincode=500001
// Called from checkout page when customer enters pincode
// No auth required — public endpoint
// ══════════════════════════════════════════════════════════════════
router.get('/check-pincode', async (req, res) => {
  try {
    const { pincode } = req.query;

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        success:       false,
        serviceable:   false,
        message:       'Enter a valid 6-digit pincode',
      });
    }

    // ── PROTOTYPE MODE: all pincodes serviceable ───────────────
    if (PROTOTYPE_MODE) {
      return res.json({
        success:     true,
        serviceable: true,
        message:     'Serviceable (prototype mode)',
        mode:        'prototype',
        charge:      null, // calculated zone-based in frontend
      });
    }

    // ── LIVE MODE: check Shiprocket serviceability ─────────────
    try {
      const deliveryService = require('../utils/deliveryService');

      // Use a dummy seller pincode if not provided
      // In real flow, seller pincode comes from sellerInfo
      const sellerPincode = req.query.sellerPincode || '500001'; // default Hyderabad

      const result = await deliveryService.getDeliveryCharge(
        { pincode },
        { pincode: sellerPincode }
      );

      if (result.notServiceable) {
        return res.json({
          success:     true,
          serviceable: false,
          message:     `Delivery not available to pincode ${pincode}. Please try a different address.`,
          pincode,
        });
      }

      return res.json({
        success:       true,
        serviceable:   true,
        message:       `Delivery available${result.courierName ? ` via ${result.courierName}` : ''}`,
        charge:        result.charge,
        courierName:   result.courierName  || null,
        estimatedDays: result.estimatedDays || null,
        zone:          result.zone,
        pincode,
      });

    } catch (err) {
      // If Shiprocket check fails — don't block customer
      console.error('Serviceability check error:', err.message);
      return res.json({
        success:     true,
        serviceable: true, // allow order — better to allow than block
        message:     'Delivery available',
        fallback:    true,
      });
    }

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

function sellerOrAdmin(req, res, next) {
  if (req.user && (req.user.role === 'seller' || req.user.role === 'admin'))
    return next();
  res.status(403).json({ success: false, message: 'Seller or Admin access required' });
}