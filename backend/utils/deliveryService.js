// ═══════════════════════════════════════════════════════════════════
// utils/deliveryService.js
//
// PROTOTYPE MODE (PROTOTYPE_MODE=true or not set):
//   → Zone-based flat delivery charges
//   → Fake waybill numbers
//   → Manual status simulation
//
// LIVE MODE (PROTOTYPE_MODE=false):
//   → Real Shiprocket API for rates, shipment, tracking
//   → Auto status updates via webhook
//   → Nothing in controller changes — only this file
//
// TO GO LIVE:
//   1. npm install axios (if not installed)
//   2. Add to .env:
//        PROTOTYPE_MODE=false
//        SHIPROCKET_EMAIL=your@email.com
//        SHIPROCKET_PASSWORD=yourpassword
//        SHIPROCKET_CHANNEL_ID=your_channel_id  (from Shiprocket dashboard)
//   3. Restart backend — done ✅
// ═══════════════════════════════════════════════════════════════════

const axios = require('axios');

const PROTOTYPE_MODE     = process.env.PROTOTYPE_MODE !== 'false';
const SHIPROCKET_BASE    = 'https://apiv2.shiprocket.in/v1/external';
const SHIPROCKET_EMAIL   = process.env.SHIPROCKET_EMAIL;
const SHIPROCKET_PASSWORD= process.env.SHIPROCKET_PASSWORD;

// ── Token cache (valid 24 hours) ───────────────────────────────────
let _token     = null;
let _tokenTime = null;
const TOKEN_TTL = 23 * 60 * 60 * 1000; // 23 hours

async function getShiprocketToken() {
  // Return cached token if still valid
  if (_token && _tokenTime && (Date.now() - _tokenTime) < TOKEN_TTL) {
    return _token;
  }
  try {
    const res = await axios.post(`${SHIPROCKET_BASE}/auth/login`, {
      email:    SHIPROCKET_EMAIL,
      password: SHIPROCKET_PASSWORD,
    });
    _token     = res.data.token;
    _tokenTime = Date.now();
    console.log('✅ Shiprocket token refreshed');
    return _token;
  } catch (err) {
    console.error('❌ Shiprocket login failed:', err.response?.data?.message || err.message);
    throw new Error('Shiprocket authentication failed');
  }
}

function shiprocketHeaders(token) {
  return {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

// ── Zone-based flat rates (prototype only) ─────────────────────────
const DELIVERY_CHARGES = {
  SAME_CITY:    40,
  SAME_STATE:   60,
  NEARBY_STATE: 80,
  FAR_STATE:    100,
};

const NEARBY_STATES = {
  'Maharashtra':    ['Gujarat', 'Goa', 'Madhya Pradesh', 'Karnataka', 'Telangana', 'Chhattisgarh'],
  'Delhi':          ['Haryana', 'Uttar Pradesh', 'Rajasthan', 'Punjab'],
  'Karnataka':      ['Kerala', 'Tamil Nadu', 'Andhra Pradesh', 'Telangana', 'Maharashtra', 'Goa'],
  'Tamil Nadu':     ['Kerala', 'Karnataka', 'Andhra Pradesh', 'Puducherry'],
  'Gujarat':        ['Maharashtra', 'Rajasthan', 'Madhya Pradesh'],
  'West Bengal':    ['Bihar', 'Jharkhand', 'Odisha', 'Sikkim', 'Assam'],
  'Telangana':      ['Andhra Pradesh', 'Maharashtra', 'Karnataka', 'Chhattisgarh', 'Odisha'],
  'Andhra Pradesh': ['Telangana', 'Karnataka', 'Tamil Nadu', 'Odisha'],
  'Rajasthan':      ['Gujarat', 'Madhya Pradesh', 'Uttar Pradesh', 'Haryana', 'Punjab', 'Delhi'],
  'Uttar Pradesh':  ['Delhi', 'Haryana', 'Rajasthan', 'Madhya Pradesh', 'Bihar', 'Jharkhand'],
  'Kerala':         ['Karnataka', 'Tamil Nadu'],
  'Punjab':         ['Haryana', 'Delhi', 'Himachal Pradesh', 'Rajasthan'],
  'Haryana':        ['Delhi', 'Punjab', 'Rajasthan', 'Uttar Pradesh'],
};

function getZone(userAddress, sellerAddress) {
  const uCity  = (userAddress?.city   || '').trim().toLowerCase();
  const sCity  = (sellerAddress?.city || '').trim().toLowerCase();
  const uState = (userAddress?.state  || '').trim();
  const sState = (sellerAddress?.state|| '').trim();

  if (!uState || !sState)               return 'FAR_STATE';
  if (uCity && sCity && uCity === sCity) return 'SAME_CITY';
  if (uState.toLowerCase() === sState.toLowerCase()) return 'SAME_STATE';

  const nearby = NEARBY_STATES[sState] || [];
  if (nearby.some(s => s.toLowerCase() === uState.toLowerCase())) return 'NEARBY_STATE';
  return 'FAR_STATE';
}

// ══════════════════════════════════════════════════════════════════
// 1. getDeliveryCharge(userAddress, sellerAddress)
//    Called during order creation to calculate delivery fee
// ══════════════════════════════════════════════════════════════════
exports.getDeliveryCharge = async (userAddress, sellerAddress) => {

  // ── LIVE MODE: Shiprocket serviceability check ─────────────────
  if (!PROTOTYPE_MODE) {
    try {
      const token = await getShiprocketToken();
      const res   = await axios.get(`${SHIPROCKET_BASE}/courier/serviceability/`, {
        headers: shiprocketHeaders(token),
        params: {
          pickup_postcode:   sellerAddress?.pincode || '',
          delivery_postcode: userAddress?.pincode   || '',
          cod:               0,
          weight:            0.5,
        },
      });
      const couriers = res.data?.data?.available_courier_companies || [];

      if (couriers.length === 0) {
        // ── NOT SERVICEABLE by Shiprocket ─────────────────────────
        console.warn(`⚠️ Pincode ${userAddress?.pincode} not serviceable by Shiprocket`);
        return {
          charge:         0,
          zone:           'NOT_SERVICEABLE',
          notServiceable: true,
          message:        `Sorry, delivery is not available to pincode ${userAddress?.pincode} at this time. Please try a different address or contact support.`,
        };
      }

      // Pick cheapest available courier
      const cheapest = couriers.reduce((min, c) =>
        (c.rate < min.rate ? c : min), couriers[0]
      );
      console.log(`📦 [Shiprocket] Charge: ₹${cheapest.rate} via ${cheapest.courier_name}`);
      return {
        charge:        Math.round(cheapest.rate),
        zone:          'SHIPROCKET_LIVE',
        notServiceable: false,
        courierName:   cheapest.courier_name,
        courierId:     cheapest.courier_company_id,
        estimatedDays: cheapest.estimated_delivery_days,
      };

    } catch (err) {
      console.error('⚠️ Shiprocket serviceability failed, using zone fallback:', err.message);
      // Fall through to zone-based fallback
    }
  }

  // ── PROTOTYPE or fallback ──────────────────────────────────────
  const zone   = getZone(userAddress, sellerAddress);
  const charge = DELIVERY_CHARGES[zone];
  console.log(`📦 [${PROTOTYPE_MODE ? 'Prototype' : 'Fallback'}] Zone: ${zone} | ₹${charge}`);
  return { charge, zone, notServiceable: false };
};

// ══════════════════════════════════════════════════════════════════
// 2. createShipment(order, sellerUser)
//    Called when seller marks order "Ready for Pickup"
// ══════════════════════════════════════════════════════════════════
exports.createShipment = async (order, sellerUser) => {

  // ── LIVE MODE: Create real Shiprocket order + assign AWB ───────
  if (!PROTOTYPE_MODE) {
    try {
      const token      = await getShiprocketToken();
      const shipping   = order.shippingAddress;
      const sellerAddr = sellerUser?.sellerInfo?.address || {};

      // Step 1: Create Shiprocket order
      const orderPayload = {
        order_id:           order._id.toString(),
        order_date:         new Date(order.createdAt).toISOString().split('T')[0],
        pickup_location:    'Primary', // set in Shiprocket dashboard
        billing_customer_name: shipping.fullName,
        billing_last_name:  '',
        billing_address:    shipping.addressLine1,
        billing_address_2:  shipping.addressLine2 || '',
        billing_city:       shipping.city,
        billing_pincode:    shipping.pincode,
        billing_state:      shipping.state,
        billing_country:    'India',
        billing_email:      order.user?.email || '',
        billing_phone:      shipping.phone,
        shipping_is_billing: 1,
        order_items: order.orderItems.map(item => ({
          name:         item.name,
          sku:          item.product?.toString() || 'SKU',
          units:        item.quantity,
          selling_price:item.price,
          discount:     0,
          tax:          0,
          hsn:          '',
        })),
        payment_method:    order.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
        sub_total:         order.subtotal,
        length:            15,
        breadth:           12,
        height:            10,
        weight:            0.5,
      };

      const orderRes = await axios.post(
        `${SHIPROCKET_BASE}/orders/create/adhoc`,
        orderPayload,
        { headers: shiprocketHeaders(token) }
      );

      const shipmentId = orderRes.data?.payload?.shipment_id;
      if (!shipmentId) throw new Error('No shipment_id returned from Shiprocket');

      // Step 2: Assign AWB (courier)
      const awbRes = await axios.post(
        `${SHIPROCKET_BASE}/courier/assign/awb`,
        { shipment_id: shipmentId },
        { headers: shiprocketHeaders(token) }
      );

      const waybill      = awbRes.data?.response?.data?.awb_code;
      const courierName  = awbRes.data?.response?.data?.courier_name;
      const etaDays      = awbRes.data?.response?.data?.etd;

      // Step 3: Schedule pickup
      await axios.post(
        `${SHIPROCKET_BASE}/courier/generate/pickup`,
        { shipment_id: [shipmentId] },
        { headers: shiprocketHeaders(token) }
      );

      console.log(`✅ [Shiprocket] AWB: ${waybill} | Courier: ${courierName}`);
      return {
        waybill,
        shipmentId,
        courierPartner: courierName,
        estimatedDays:  etaDays || 5,
        live: true,
      };

    } catch (err) {
      console.error('❌ Shiprocket createShipment failed:', err.response?.data || err.message);
      throw new Error(err.response?.data?.message || 'Shiprocket shipment creation failed');
    }
  }

  // ── PROTOTYPE: Fake waybill ────────────────────────────────────
  const waybill = `PROTO${Date.now().toString().slice(-8)}`;
  console.log(`📦 [Prototype] Shipment created. Waybill: ${waybill}`);
  return { waybill, courierPartner: 'Prototype Courier', estimatedDays: 3, live: false };
};

// ══════════════════════════════════════════════════════════════════
// 3. trackShipment(waybill, currentStatus)
//    Called to get live tracking info
// ══════════════════════════════════════════════════════════════════
exports.trackShipment = async (waybill, currentStatus) => {

  // ── LIVE MODE: Real Shiprocket tracking ────────────────────────
  if (!PROTOTYPE_MODE) {
    try {
      const token = await getShiprocketToken();
      const res   = await axios.get(
        `${SHIPROCKET_BASE}/courier/track/awb/${waybill}`,
        { headers: shiprocketHeaders(token) }
      );
      const data = res.data?.tracking_data;
      return {
        waybill,
        currentStatus:   data?.track_status === 1 ? 'Delivered' : currentStatus,
        shipmentStatus:  data?.shipment_status,
        shipmentTrack:   data?.shipment_track?.[0] || null,
        trackActivities: data?.shipment_track_activities || [],
        etd:             data?.etd || null,
        live:            true,
      };
    } catch (err) {
      console.error('⚠️ Shiprocket tracking failed:', err.message);
      return { waybill, currentStatus, error: 'Tracking unavailable', live: false };
    }
  }

  // ── PROTOTYPE ──────────────────────────────────────────────────
  return {
    waybill,
    currentStatus: currentStatus || 'Processing',
    prototype:     true,
    message:       'Prototype tracking — real tracking available after Shiprocket integration',
  };
};

// ══════════════════════════════════════════════════════════════════
// 4. cancelShipment(waybill)
//    Called when order is cancelled after shipment created
// ══════════════════════════════════════════════════════════════════
exports.cancelShipment = async (waybill) => {

  // ── LIVE MODE: Cancel via Shiprocket ──────────────────────────
  if (!PROTOTYPE_MODE) {
    try {
      const token = await getShiprocketToken();
      await axios.post(
        `${SHIPROCKET_BASE}/orders/cancel`,
        { ids: [waybill] },
        { headers: shiprocketHeaders(token) }
      );
      console.log(`✅ [Shiprocket] Shipment ${waybill} cancelled`);
      return { success: true, live: true };
    } catch (err) {
      console.error('⚠️ Shiprocket cancel failed:', err.message);
      return { success: false, error: err.message };
    }
  }

  // ── PROTOTYPE ──────────────────────────────────────────────────
  console.log(`📦 [Prototype] Shipment ${waybill} cancelled`);
  return { success: true, live: false };
};

// ══════════════════════════════════════════════════════════════════
// 5. getDeliveryZoneInfo() — utility for frontend display
// ══════════════════════════════════════════════════════════════════
exports.getDeliveryZoneInfo = () => ({
  zones:       DELIVERY_CHARGES,
  mode:        PROTOTYPE_MODE ? 'prototype' : 'live',
  provider:    PROTOTYPE_MODE ? 'Zone-based flat rates' : 'Shiprocket',
  message:     PROTOTYPE_MODE
    ? 'Set PROTOTYPE_MODE=false in .env to enable live Shiprocket rates'
    : 'Live rates from Shiprocket API',
});

exports.getZone = getZone;