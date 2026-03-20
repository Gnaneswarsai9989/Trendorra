// ═══════════════════════════════════════════════════════════════════
// FILE: backend/utils/shiprocket.js
// Complete Shiprocket integration — per-seller pickup addresses
// Prototype now → Real after deploy + webhook URL added
// ═══════════════════════════════════════════════════════════════════
const axios = require('axios');

const PROTOTYPE_MODE  = process.env.PROTOTYPE_MODE !== 'false';
const SHIPROCKET_BASE = 'https://apiv2.shiprocket.in/v1/external';

// ── Token cache (valid 10 days) ───────────────────────────────────
let _token     = null;
let _tokenTime = 0;

const getToken = async () => {
  if (_token && Date.now() - _tokenTime < 9 * 24 * 60 * 60 * 1000) return _token;
  const res  = await axios.post(`${SHIPROCKET_BASE}/auth/login`, {
    email:    process.env.SHIPROCKET_EMAIL,
    password: process.env.SHIPROCKET_PASSWORD,
  });
  _token     = res.data.token;
  _tokenTime = Date.now();
  console.log('🚀 Shiprocket token refreshed');
  return _token;
};

const srHeaders = async () => ({
  Authorization: `Bearer ${await getToken()}`,
  'Content-Type': 'application/json',
});

// ── Fake waybill for prototype ────────────────────────────────────
const generateFakeWaybill = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const rand  = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `SR${rand}`;
};

// ── Register seller pickup location on Shiprocket ─────────────────
// Each seller gets their own named pickup location (seller_<id>)
// Shiprocket will send courier to THAT seller's address for pickup
const ensurePickupLocation = async (seller) => {
  const headers      = await srHeaders();
  const locationName = `seller_${seller._id}`;
  const info         = seller.sellerInfo || {};
  const addr         = info.address      || {};

  // Check if already registered
  try {
    const res       = await axios.get(`${SHIPROCKET_BASE}/settings/company/pickup`, { headers });
    const locations = res.data?.data?.shipping_address || [];
    const found     = locations.find(l => l.pickup_location === locationName);
    if (found) {
      console.log(`📍 Pickup location exists: ${locationName}`);
      return locationName;
    }
  } catch (e) {
    console.warn('Could not check pickup locations:', e.message);
  }

  // Register new pickup location for this seller
  await axios.post(`${SHIPROCKET_BASE}/settings/company/addpickup`, {
    pickup_location: locationName,
    name:            seller.name   || info.businessName || 'Seller',
    email:           seller.email  || process.env.SHIPROCKET_EMAIL,
    phone:           seller.phone  || '9999999999',
    address:         addr.line     || 'Address',
    address_2:       '',
    city:            addr.city     || 'City',
    state:           addr.state    || 'State',
    country:         'India',
    pin_code:        addr.pincode  || '500001',
  }, { headers });

  console.log(`📍 Registered pickup location: ${locationName} (${addr.city}, ${addr.state})`);
  return locationName;
};

// ── Create shipment ───────────────────────────────────────────────
const createShipment = async (order, seller) => {
  if (PROTOTYPE_MODE) {
    console.log(`🟡 [PROTOTYPE] Fake shipment for order ${order._id}`);
    return {
      packages: [{ waybill: generateFakeWaybill(), status: 'Pickup Pending', remarks: 'Prototype' }],
      success: true,
    };
  }

  // Register seller's pickup address on Shiprocket if not already done
  const pickupLocation  = await ensurePickupLocation(seller);
  const shippingAddress = order.shippingAddress || {};
  const headers         = await srHeaders();

  // Step 1 — Create order on Shiprocket
  const orderPayload = {
    order_id:              order._id.toString(),
    order_date:            new Date(order.createdAt).toISOString().split('T')[0],
    pickup_location:       pickupLocation,
    billing_customer_name: shippingAddress.fullName     || order.user?.name || 'Customer',
    billing_last_name:     '',
    billing_address:       shippingAddress.addressLine1 || '',
    billing_address_2:     shippingAddress.addressLine2 || '',
    billing_city:          shippingAddress.city          || '',
    billing_pincode:       shippingAddress.pincode       || '',
    billing_state:         shippingAddress.state         || '',
    billing_country:       'India',
    billing_email:         order.user?.email             || '',
    billing_phone:         shippingAddress.phone || order.user?.phone || '9999999999',
    shipping_is_billing:   true,
    order_items: (order.orderItems || []).map(item => ({
      name:          item.name || 'Product',
      sku:           item.product?._id?.toString() || 'SKU001',
      units:         item.quantity  || 1,
      selling_price: item.price     || 0,
      discount:      0,
      tax:           0,
      hsn:           '',
    })),
    payment_method:      order.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
    shipping_charges:    0,
    giftwrap_charges:    0,
    transaction_charges: 0,
    total_discount:      0,
    sub_total:           order.totalPrice || 0,
    length:  15,  // cm — adjust per your products
    breadth: 12,
    height:  10,
    weight:  0.5, // kg
  };

  const orderRes   = await axios.post(`${SHIPROCKET_BASE}/orders/create/adhoc`, orderPayload, { headers });
  const shipmentId = orderRes.data?.shipment_id;
  if (!shipmentId) throw new Error(`Shiprocket order failed: ${JSON.stringify(orderRes.data)}`);

  // Step 2 — Assign AWB (auto courier selection)
  const awbRes = await axios.post(`${SHIPROCKET_BASE}/courier/assign/awb`, {
    shipment_id: shipmentId,
  }, { headers });
  const awb = awbRes.data?.response?.data?.awb_code;
  if (!awb) throw new Error(`AWB assignment failed: ${JSON.stringify(awbRes.data)}`);

  // Step 3 — Schedule pickup from seller's address
  await axios.post(`${SHIPROCKET_BASE}/courier/generate/pickup`, {
    shipment_id: [shipmentId],
  }, { headers });

  console.log(`✅ [SHIPROCKET] AWB: ${awb} | Pickup from: ${pickupLocation}`);
  return {
    packages: [{ waybill: awb, status: 'Pickup Pending', remarks: `AWB: ${awb}` }],
    success: true,
  };
};

// ── Track shipment ────────────────────────────────────────────────
const trackShipment = async (waybill, currentStatus) => {
  if (PROTOTYPE_MODE) {
    return {
      ShipmentData: [{
        Shipment: {
          Waybill:     waybill,
          Status:      currentStatus || 'In Transit',
          PickUpDate:  new Date().toISOString(),
          Destination: 'Customer City',
          Origin:      'Seller City',
          Scans: [
            { ScanDetail: { Instructions: 'Shipment picked up', Scan: 'Picked Up',        ScanDateTime: new Date(Date.now() - 2 * 3600000).toISOString() } },
            { ScanDetail: { Instructions: 'In transit to hub',  Scan: 'In Transit',       ScanDateTime: new Date(Date.now() - 1 * 3600000).toISOString() } },
            { ScanDetail: { Instructions: 'Out for delivery',   Scan: 'Out for Delivery', ScanDateTime: new Date().toISOString() } },
          ],
        },
      }],
    };
  }

  const headers  = await srHeaders();
  const res      = await axios.get(`${SHIPROCKET_BASE}/courier/track/awb/${waybill}`, { headers });
  const tracking = res.data?.tracking_data;

  return {
    ShipmentData: [{
      Shipment: {
        Waybill:     waybill,
        Status:      tracking?.shipment_status || currentStatus,
        PickUpDate:  tracking?.pickup_date     || '',
        Destination: tracking?.destination     || '',
        Origin:      tracking?.origin          || '',
        Scans: (tracking?.shipment_track_activities || []).map(a => ({
          ScanDetail: { Instructions: a.activity || '', Scan: a.activity || '', ScanDateTime: a.date || '' },
        })),
      },
    }],
  };
};

// ── Cancel shipment ───────────────────────────────────────────────
const cancelShipment = async (waybill) => {
  if (PROTOTYPE_MODE) {
    console.log(`🟡 [PROTOTYPE] Fake cancel: ${waybill}`);
    return { success: true };
  }
  const headers = await srHeaders();
  await axios.post(`${SHIPROCKET_BASE}/orders/cancel`, { awbs: [waybill] }, { headers });
  console.log(`❌ [SHIPROCKET] Cancelled: ${waybill}`);
  return { success: true };
};

// ── Map Shiprocket status → our order status ──────────────────────
const mapDelhiveryStatus = (status) => {
  if (!status) return null;
  const map = {
    'PICKUP PENDING':             'Confirmed',
    'PICKUP QUEUED':              'Confirmed',
    'PICKUP RESCHEDULED':         'Confirmed',
    'PICKUP GENERATED':           'Confirmed',
    'PICKUP SCHEDULED':           'Confirmed',
    'PICKUP ERROR':               'Confirmed',
    'PICKED UP':                  'Shipped',
    'IN TRANSIT':                 'Shipped',
    'REACHED AT HUB':             'Shipped',
    'REACHED AT DESTINATION HUB': 'Shipped',
    'MISROUTED':                  'Shipped',
    'OUT FOR DELIVERY':           'Out for Delivery',
    'DELIVERY RESCHEDULED':       'Out for Delivery',
    'DELIVERY ATTEMPTED':         'Out for Delivery',
    'DELIVERED':                  'Delivered',
    'UNDELIVERED':                'Out for Delivery',
    'RTO INITIATED':              'Cancelled',
    'RTO IN TRANSIT':             'Cancelled',
    'RTO DELIVERED':              'Cancelled',
    'LOST':                       'Cancelled',
    'CANCELLED':                  'Cancelled',
    'SHIPMENT CANCELLED':         'Cancelled',
  };
  return map[status.toUpperCase()] || null;
};

module.exports = { createShipment, trackShipment, cancelShipment, mapDelhiveryStatus, PROTOTYPE_MODE };