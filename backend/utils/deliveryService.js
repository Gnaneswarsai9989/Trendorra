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
//   → Per-seller pickup address — auto registered on first order
//
// TO GO LIVE:
//   1. npm install axios (if not installed)
//   2. Add to .env:
//        PROTOTYPE_MODE=false
//        SHIPROCKET_EMAIL=your@email.com
//        SHIPROCKET_PASSWORD=yourpassword
//   3. Restart backend — done ✅
//
// FLOW (when seller clicks "Ready for Pickup"):
//   1. ensurePickupLocation(seller) → registers seller address in Shiprocket (auto)
//   2. createShipment(order, seller) → sends customer address + seller pickup to Shiprocket
//   3. Shiprocket assigns AWB → courier dispatched to seller location
//   4. Courier picks up from seller → delivers to customer
// ═══════════════════════════════════════════════════════════════════

const axios = require('axios');

const PROTOTYPE_MODE      = process.env.PROTOTYPE_MODE !== 'false';
const SHIPROCKET_BASE     = 'https://apiv2.shiprocket.in/v1/external';
const SHIPROCKET_EMAIL    = process.env.SHIPROCKET_EMAIL;
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;

// ── Token cache (valid 23 hours) ──────────────────────────────────
let _token     = null;
let _tokenTime = null;
const TOKEN_TTL = 23 * 60 * 60 * 1000;

async function getShiprocketToken() {
  if (_token && _tokenTime && (Date.now() - _tokenTime) < TOKEN_TTL) {
    return _token;
  }
  try {
    const res  = await axios.post(`${SHIPROCKET_BASE}/auth/login`, {
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

// ══════════════════════════════════════════════════════════════════
// ensurePickupLocation(seller, token)
//
// AUTO registers seller's address as a pickup location in Shiprocket.
// Called automatically inside createShipment — no manual setup needed.
//
// Each seller gets a unique name: seller_<mongoId>
// If already registered → reuses existing (no duplicate)
// Seller address comes from: seller.sellerInfo.address in your DB
// ══════════════════════════════════════════════════════════════════
async function ensurePickupLocation(seller, token) {
  const locationName = `seller_${seller._id}`;
  const info         = seller.sellerInfo  || {};
  const addr         = info.address       || {};

  // ── Step 1: Check if seller already registered in Shiprocket ──
  try {
    const res       = await axios.get(
      `${SHIPROCKET_BASE}/settings/company/pickup`,
      { headers: shiprocketHeaders(token) }
    );
    const locations = res.data?.data?.shipping_address || [];
    const found     = locations.find(l => l.pickup_location === locationName);
    if (found) {
      console.log(`📍 Pickup location already exists: ${locationName}`);
      return locationName;
    }
  } catch (e) {
    console.warn('⚠️ Could not check existing pickup locations:', e.message);
  }

  // ── Step 2: Register seller's address in Shiprocket ───────────
  try {
    await axios.post(
      `${SHIPROCKET_BASE}/settings/company/addpickup`,
      {
        pickup_location: locationName,
        name:            seller.name          || info.businessName || 'Seller',
        email:           seller.email         || SHIPROCKET_EMAIL,
        phone:           seller.phone         || '9999999999',
        address:         addr.line            || addr.addressLine1 || 'Address',
        address_2:       addr.line2           || addr.addressLine2 || '',
        city:            addr.city            || 'City',
        state:           addr.state           || 'State',
        country:         'India',
        pin_code:        addr.pincode         || '500001',
      },
      { headers: shiprocketHeaders(token) }
    );
    console.log(`📍 Registered new pickup location: ${locationName} | City: ${addr.city} | State: ${addr.state}`);
  } catch (e) {
    console.error('❌ Failed to register pickup location:', e.response?.data || e.message);
    throw new Error(`Could not register seller pickup address: ${e.message}`);
  }

  return locationName;
}

// ── Zone-based flat rates (prototype / fallback) ──────────────────
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

  if (!uState || !sState)                return 'FAR_STATE';
  if (uCity && sCity && uCity === sCity) return 'SAME_CITY';
  if (uState.toLowerCase() === sState.toLowerCase()) return 'SAME_STATE';

  const nearby = NEARBY_STATES[sState] || [];
  if (nearby.some(s => s.toLowerCase() === uState.toLowerCase())) return 'NEARBY_STATE';
  return 'FAR_STATE';
}

// ══════════════════════════════════════════════════════════════════
// 1. getDeliveryCharge(userAddress, sellerAddress)
//    Called during checkout to calculate delivery fee
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
        console.warn(`⚠️ Pincode ${userAddress?.pincode} not serviceable`);
        return {
          charge:         0,
          zone:           'NOT_SERVICEABLE',
          notServiceable: true,
          message:        `Delivery not available to pincode ${userAddress?.pincode}. Please try a different address.`,
        };
      }

      const cheapest = couriers.reduce((min, c) => (c.rate < min.rate ? c : min), couriers[0]);
      console.log(`📦 [Shiprocket] Charge: ₹${cheapest.rate} via ${cheapest.courier_name}`);
      return {
        charge:         Math.round(cheapest.rate),
        zone:           'SHIPROCKET_LIVE',
        notServiceable: false,
        courierName:    cheapest.courier_name,
        courierId:      cheapest.courier_company_id,
        estimatedDays:  cheapest.estimated_delivery_days,
      };

    } catch (err) {
      console.error('⚠️ Shiprocket serviceability failed — using zone fallback:', err.message);
      // Fall through to zone-based fallback below
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
//
// Called when seller clicks "Ready for Pickup"
//
// AUTOMATIC FLOW:
//   A) ensurePickupLocation → registers/reuses seller address in Shiprocket
//   B) Creates Shiprocket order with:
//        - pickup_location = seller's address (auto registered above)
//        - billing/shipping = customer's address from order
//   C) Assigns AWB (courier auto-selected)
//   D) Schedules pickup from seller's location
//
// Both seller address AND customer address go to Shiprocket automatically.
// No manual dashboard setup needed per seller.
// ══════════════════════════════════════════════════════════════════
exports.createShipment = async (order, sellerUser) => {

  // ── LIVE MODE ─────────────────────────────────────────────────
  if (!PROTOTYPE_MODE) {
    try {
      const token    = await getShiprocketToken();
      const shipping = order.shippingAddress || {};

      // ── A: Auto-register seller's pickup address in Shiprocket ─
      // This runs silently — no manual steps needed in the dashboard
      const pickupLocation = await ensurePickupLocation(sellerUser, token);

      console.log(`🚚 Creating shipment:`);
      console.log(`   📍 Pickup (Seller): ${pickupLocation} | ${sellerUser?.sellerInfo?.address?.city}, ${sellerUser?.sellerInfo?.address?.state}`);
      console.log(`   📦 Delivery (Customer): ${shipping.city}, ${shipping.state} - ${shipping.pincode}`);

      // ── B: Create Shiprocket order with seller pickup + customer delivery ──
      const orderPayload = {
        order_id:              order._id.toString(),
        order_date:            new Date(order.createdAt).toISOString().split('T')[0],

        // ✅ Seller's address — auto registered above
        pickup_location:       pickupLocation,

        // ✅ Customer's delivery address — from order.shippingAddress
        billing_customer_name: shipping.fullName     || order.user?.name || 'Customer',
        billing_last_name:     '',
        billing_address:       shipping.addressLine1 || '',
        billing_address_2:     shipping.addressLine2 || '',
        billing_city:          shipping.city         || '',
        billing_pincode:       shipping.pincode       || '',
        billing_state:         shipping.state         || '',
        billing_country:       'India',
        billing_email:         order.user?.email      || '',
        billing_phone:         shipping.phone || order.user?.phone || '9999999999',
        shipping_is_billing:   1,

        order_items: (order.orderItems || []).map(item => ({
          name:          item.name                        || 'Product',
          sku:           item.product?.toString()         || 'SKU001',
          units:         item.quantity                    || 1,
          selling_price: item.price                       || 0,
          discount:      0,
          tax:           0,
          hsn:           '',
        })),

        payment_method:      order.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
        sub_total:           order.subtotal || order.totalPrice || 0,
        shipping_charges:    0,
        giftwrap_charges:    0,
        transaction_charges: 0,
        total_discount:      0,

        // Package dimensions — adjust per your products
        length:  15,
        breadth: 12,
        height:  10,
        weight:  0.5,
      };

      const orderRes   = await axios.post(
        `${SHIPROCKET_BASE}/orders/create/adhoc`,
        orderPayload,
        { headers: shiprocketHeaders(token) }
      );

      const shipmentId = orderRes.data?.payload?.shipment_id || orderRes.data?.shipment_id;
      if (!shipmentId) throw new Error(`No shipment_id from Shiprocket: ${JSON.stringify(orderRes.data)}`);

      // ── C: Assign AWB (courier auto-selected by Shiprocket) ────
      const awbRes = await axios.post(
        `${SHIPROCKET_BASE}/courier/assign/awb`,
        { shipment_id: shipmentId },
        { headers: shiprocketHeaders(token) }
      );

      const waybill     = awbRes.data?.response?.data?.awb_code;
      const courierName = awbRes.data?.response?.data?.courier_name;
      const etaDays     = awbRes.data?.response?.data?.etd;

      if (!waybill) throw new Error(`AWB assignment failed: ${JSON.stringify(awbRes.data)}`);

      // ── D: Schedule pickup from seller's address ───────────────
      await axios.post(
        `${SHIPROCKET_BASE}/courier/generate/pickup`,
        { shipment_id: [shipmentId] },
        { headers: shiprocketHeaders(token) }
      );

      console.log(`✅ [Shiprocket] Shipment created!`);
      console.log(`   AWB: ${waybill} | Courier: ${courierName} | ETA: ${etaDays} days`);
      console.log(`   Courier will pick up from seller at: ${pickupLocation}`);

      return {
        waybill,
        shipmentId,
        courierPartner: courierName,
        estimatedDays:  etaDays || 5,
        pickupLocation,
        live:           true,
      };

    } catch (err) {
      console.error('❌ Shiprocket createShipment failed:', err.response?.data || err.message);
      throw new Error(err.response?.data?.message || 'Shiprocket shipment creation failed');
    }
  }

  // ── PROTOTYPE: Fake waybill ────────────────────────────────────
  const waybill = `PROTO${Date.now().toString().slice(-8)}`;
  console.log(`📦 [Prototype] Fake shipment. Waybill: ${waybill}`);
  console.log(`   Seller: ${sellerUser?.sellerInfo?.address?.city} | Customer: ${order.shippingAddress?.city}`);
  return {
    waybill,
    courierPartner: 'Prototype Courier',
    estimatedDays:  3,
    pickupLocation: `seller_${sellerUser?._id}`,
    live:           false,
  };
};

// ══════════════════════════════════════════════════════════════════
// 3. trackShipment(waybill, currentStatus)
// ══════════════════════════════════════════════════════════════════
exports.trackShipment = async (waybill, currentStatus) => {

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
        shipmentTrack:   data?.shipment_track?.[0]          || null,
        trackActivities: data?.shipment_track_activities    || [],
        etd:             data?.etd                          || null,
        live:            true,
      };
    } catch (err) {
      console.error('⚠️ Shiprocket tracking failed:', err.message);
      return { waybill, currentStatus, error: 'Tracking unavailable', live: false };
    }
  }

  return {
    waybill,
    currentStatus: currentStatus || 'Processing',
    prototype:     true,
    message:       'Prototype tracking — real tracking available after Shiprocket integration',
  };
};

// ══════════════════════════════════════════════════════════════════
// 4. cancelShipment(waybill)
// ══════════════════════════════════════════════════════════════════
exports.cancelShipment = async (waybill) => {

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

  console.log(`📦 [Prototype] Shipment ${waybill} cancelled`);
  return { success: true, live: false };
};

// ══════════════════════════════════════════════════════════════════
// 5. getDeliveryZoneInfo() — utility for frontend display
// ══════════════════════════════════════════════════════════════════
exports.getDeliveryZoneInfo = () => ({
  zones:    DELIVERY_CHARGES,
  mode:     PROTOTYPE_MODE ? 'prototype' : 'live',
  provider: PROTOTYPE_MODE ? 'Zone-based rates' : 'Shiprocket',
  message:  PROTOTYPE_MODE
    ? 'Set PROTOTYPE_MODE=false in .env to enable live Shiprocket rates'
    : 'Live rates from Shiprocket API',
});

exports.getZone = getZone;