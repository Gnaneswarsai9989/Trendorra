// ═══════════════════════════════════════════════════════════════════
// FILE: backend/utils/shiprocket.js
//
// WHAT THIS FILE DOES:
//   1. ensurePickupLocation(seller)
//      → Auto-registers seller's address in Shiprocket as a pickup point
//      → Uses seller.sellerInfo.address (city, state, pincode, line)
//      → Each seller gets unique name: "seller_<mongoId>"
//      → If already registered → reuses (no duplicate)
//
//   2. createShipment(order, seller)
//      → Registers seller pickup (step 1 above, automatic)
//      → Creates order in Shiprocket with CUSTOMER address for delivery
//      → Assigns AWB (courier auto-selected)
//      → Schedules pickup from SELLER's address
//
//   3. trackShipment(waybill, currentStatus)
//   4. cancelShipment(waybill)
//   5. mapDelhiveryStatus(status) → maps Shiprocket → your order status
//
// ADDRESSES FLOW:
//   Seller address  → pickup_location (where courier picks up FROM)
//   Customer address → billing/shipping (where courier delivers TO)
//
// PROTOTYPE_MODE=true  → fake waybills, no real API calls
// PROTOTYPE_MODE=false → real Shiprocket API, real courier dispatch
// ═══════════════════════════════════════════════════════════════════

const axios = require('axios');

const PROTOTYPE_MODE  = process.env.PROTOTYPE_MODE !== 'false';
const SHIPROCKET_BASE = 'https://apiv2.shiprocket.in/v1/external';

// ── Token cache (valid 10 days) ────────────────────────────────────
let _token     = null;
let _tokenTime = 0;

const getToken = async () => {
  if (_token && Date.now() - _tokenTime < 9 * 24 * 60 * 60 * 1000) return _token;
  try {
    const res  = await axios.post(`${SHIPROCKET_BASE}/auth/login`, {
      email:    process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    });
    _token     = res.data.token;
    _tokenTime = Date.now();
    console.log('✅ Shiprocket token refreshed');
    return _token;
  } catch (err) {
    console.error('❌ Shiprocket login failed:', err.response?.data?.message || err.message);
    throw new Error('Shiprocket authentication failed');
  }
};

const srHeaders = async () => ({
  Authorization: `Bearer ${await getToken()}`,
  'Content-Type': 'application/json',
});

// ── Fake waybill for prototype ─────────────────────────────────────
const generateFakeWaybill = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const rand  = Array.from({ length: 10 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  return `SR${rand}`;
};

// ══════════════════════════════════════════════════════════════════
// ensurePickupLocation(seller)
//
// AUTO registers seller's address in Shiprocket as a pickup location.
// Called inside createShipment — zero manual steps needed.
//
// Seller data source:
//   seller.sellerInfo.address.line     → street address
//   seller.sellerInfo.address.city     → city
//   seller.sellerInfo.address.state    → state
//   seller.sellerInfo.address.pincode  → pincode
//   seller.name, seller.email, seller.phone
// ══════════════════════════════════════════════════════════════════
const ensurePickupLocation = async (seller) => {
  const headers      = await srHeaders();
  const locationName = `seller_${seller._id}`;
  const info         = seller.sellerInfo || {};
  const addr         = info.address      || {};

  // Always push the latest seller address to Shiprocket (create or update).
  // Shiprocket's addpickup endpoint acts as an upsert on pickup_location name.
  try {
    await axios.post(
      `${SHIPROCKET_BASE}/settings/company/addpickup`,
      {
        pickup_location: locationName,
        name:            seller.name         || info.businessName  || 'Seller',
        email:           seller.email        || process.env.SHIPROCKET_EMAIL,
        phone:           seller.phone        || '9999999999',
        address:         addr.line           || addr.addressLine1  || 'Address',
        address_2:       addr.line2          || '',
        city:            addr.city           || 'City',
        state:           addr.state          || 'State',
        country:         'India',
        pin_code:        addr.pincode        || '500001',
      },
      { headers }
    );
    console.log(`📍 ✅ Pickup synced: ${locationName} | ${addr.city}, ${addr.state} - ${addr.pincode}`);
  } catch (e) {
    // If it's a duplicate error (already exists with same data), Shiprocket returns 422 — safe to ignore
    const errData = e.response?.data;
    const isDuplicate = e.response?.status === 422 ||
      JSON.stringify(errData || '').toLowerCase().includes('already exist');
    if (!isDuplicate) {
      console.error('❌ Failed to sync pickup location:', errData || e.message);
      throw new Error(`Could not register seller pickup address: ${e.message}`);
    }
    console.log(`📍 Pickup location unchanged (already up to date): ${locationName}`);
  }

  return locationName;
};


// ══════════════════════════════════════════════════════════════════
// createShipment(order, seller)
//
// Called by deliveryRoutes when seller clicks "Ready for Pickup"
//
// FLOW:
//   A) Registers seller address as pickup_location in Shiprocket
//   B) Creates order: pickup = seller address, delivery = customer address
//   C) Assigns AWB (courier auto-selected by Shiprocket)
//   D) Schedules pickup from seller's address
//   E) Returns waybill AWB for tracking
// ══════════════════════════════════════════════════════════════════
const createShipment = async (order, seller) => {

  // ── PROTOTYPE: return fake waybill ────────────────────────────
  if (PROTOTYPE_MODE) {
    const fakeWaybill = generateFakeWaybill();
    console.log(`🟡 [PROTOTYPE] Fake shipment for order ${order._id}`);
    console.log(`   Seller pickup: ${seller?.sellerInfo?.address?.city}, ${seller?.sellerInfo?.address?.state}`);
    console.log(`   Customer delivery: ${order.shippingAddress?.city}, ${order.shippingAddress?.state}`);
    return {
      packages: [{ waybill: fakeWaybill, status: 'Pickup Pending', remarks: 'Prototype' }],
      success: true,
    };
  }

  // ── LIVE: Real Shiprocket API ─────────────────────────────────
  const shippingAddress = order.shippingAddress || {};
  const headers         = await srHeaders();

  // A) Auto-register seller's pickup address
  const pickupLocation = await ensurePickupLocation(seller);

  console.log(`🚚 Creating Shiprocket shipment for order ${order._id}`);
  console.log(`   📍 Pickup from seller: ${pickupLocation} | ${seller?.sellerInfo?.address?.city}, ${seller?.sellerInfo?.address?.state}`);
  console.log(`   📦 Deliver to customer: ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pincode}`);

  // B) Create Shiprocket order
  const orderPayload = {
    order_id:              order._id.toString(),
    order_date:            new Date(order.createdAt).toISOString().split('T')[0],

    // ✅ Seller's registered address → where courier picks up FROM
    pickup_location:       pickupLocation,

    // ✅ Customer's address → where courier delivers TO
    billing_customer_name: shippingAddress.fullName     || order.user?.name  || 'Customer',
    billing_last_name:     '',
    billing_address:       shippingAddress.addressLine1 || '',
    billing_address_2:     shippingAddress.addressLine2 || '',
    billing_city:          shippingAddress.city          || '',
    billing_pincode:       shippingAddress.pincode        || '',
    billing_state:         shippingAddress.state          || '',
    billing_country:       'India',
    billing_email:         order.user?.email              || '',
    billing_phone:         shippingAddress.phone || order.user?.phone || '9999999999',
    shipping_is_billing:   true,

    // Order items
    order_items: (order.orderItems || []).map(item => ({
      name:          item.name                        || 'Product',
      sku:           item.product?._id?.toString()   || item.product?.toString() || 'SKU001',
      units:         item.quantity                   || 1,
      selling_price: item.price                      || 0,
      discount:      0,
      tax:           0,
      hsn:           '',
    })),

    payment_method:      order.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
    shipping_charges:    0,
    giftwrap_charges:    0,
    transaction_charges: 0,
    total_discount:      0,
    sub_total:           order.subtotal || order.totalPrice || 0,

    // Package dimensions — adjust for your products
    length:  15,   // cm
    breadth: 12,   // cm
    height:  10,   // cm
    weight:  0.5,  // kg
  };

  const orderRes   = await axios.post(
    `${SHIPROCKET_BASE}/orders/create/adhoc`,
    orderPayload,
    { headers }
  );
  const shipmentId = orderRes.data?.shipment_id || orderRes.data?.payload?.shipment_id;
  if (!shipmentId) throw new Error(`Shiprocket order failed: ${JSON.stringify(orderRes.data)}`);

  // C) Assign AWB — Shiprocket auto-selects cheapest courier
  const awbRes = await axios.post(
    `${SHIPROCKET_BASE}/courier/assign/awb`,
    { shipment_id: shipmentId },
    { headers }
  );
  const awb         = awbRes.data?.response?.data?.awb_code;
  const courierName = awbRes.data?.response?.data?.courier_name;
  const etaDays     = awbRes.data?.response?.data?.etd;
  if (!awb) throw new Error(`AWB assignment failed: ${JSON.stringify(awbRes.data)}`);

  // D) Schedule pickup from seller's address
  await axios.post(
    `${SHIPROCKET_BASE}/courier/generate/pickup`,
    { shipment_id: [shipmentId] },
    { headers }
  );

  console.log(`✅ [SHIPROCKET] Shipment created!`);
  console.log(`   AWB: ${awb} | Courier: ${courierName} | ETA: ${etaDays} days`);
  console.log(`   Courier will pick up from seller: ${pickupLocation}`);

  return {
    packages: [{ waybill: awb, status: 'Pickup Pending', remarks: `AWB: ${awb}` }],
    shipmentId,
    courierName,
    etaDays,
    pickupLocation,
    success: true,
  };
};

// ══════════════════════════════════════════════════════════════════
// trackShipment(waybill, currentStatus)
// ══════════════════════════════════════════════════════════════════
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
            { ScanDetail: { Instructions: 'Shipment picked up',  Scan: 'Picked Up',        ScanDateTime: new Date(Date.now() - 2*3600000).toISOString() } },
            { ScanDetail: { Instructions: 'In transit to hub',   Scan: 'In Transit',        ScanDateTime: new Date(Date.now() - 1*3600000).toISOString() } },
            { ScanDetail: { Instructions: 'Out for delivery',    Scan: 'Out for Delivery',  ScanDateTime: new Date().toISOString() } },
          ],
        },
      }],
    };
  }

  const headers  = await srHeaders();
  const res      = await axios.get(
    `${SHIPROCKET_BASE}/courier/track/awb/${waybill}`,
    { headers }
  );
  const tracking = res.data?.tracking_data;
  return {
    ShipmentData: [{
      Shipment: {
        Waybill:     waybill,
        Status:      tracking?.shipment_status  || currentStatus,
        PickUpDate:  tracking?.pickup_date       || '',
        Destination: tracking?.destination       || '',
        Origin:      tracking?.origin            || '',
        Scans: (tracking?.shipment_track_activities || []).map(a => ({
          ScanDetail: { Instructions: a.activity || '', Scan: a.activity || '', ScanDateTime: a.date || '' },
        })),
      },
    }],
  };
};

// ══════════════════════════════════════════════════════════════════
// cancelShipment(waybill)
// ══════════════════════════════════════════════════════════════════
const cancelShipment = async (waybill) => {
  if (PROTOTYPE_MODE) {
    console.log(`🟡 [PROTOTYPE] Fake cancel: ${waybill}`);
    return { success: true };
  }
  try {
    const headers = await srHeaders();
    await axios.post(
      `${SHIPROCKET_BASE}/orders/cancel`,
      { awbs: [waybill] },
      { headers }
    );
    console.log(`❌ [SHIPROCKET] Cancelled: ${waybill}`);
    return { success: true };
  } catch (err) {
    console.error('⚠️ Cancel failed:', err.response?.data || err.message);
    return { success: false, error: err.message };
  }
};

// ══════════════════════════════════════════════════════════════════
// mapDelhiveryStatus — maps Shiprocket status → your order status
// Used in webhook handler
// ══════════════════════════════════════════════════════════════════
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

module.exports = {
  createShipment,
  trackShipment,
  cancelShipment,
  mapDelhiveryStatus,
  PROTOTYPE_MODE,
};