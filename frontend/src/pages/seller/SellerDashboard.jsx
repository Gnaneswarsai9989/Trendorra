import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productAPI, orderAPI, authAPI, deliveryAPI, settingsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FiPackage, FiShoppingBag, FiDollarSign, FiTrendingUp,
  FiPlus, FiEdit2, FiTrash2, FiLogOut, FiUser,
  FiArrowRight, FiAlertCircle, FiPercent, FiTruck, FiSave,
  FiBarChart2, FiX, FiCheck, FiRefreshCw, FiAlertTriangle,
  FiArrowLeft, FiFileText, FiShield, FiCheckCircle, FiPlay,
  FiChevronDown, FiChevronUp, FiMapPin, FiPhone, FiCalendar,
  FiCreditCard, FiTag, FiRotateCcw, FiImage,
} from 'react-icons/fi';

const BG = '#0a0a0a';
const CARD = '#111111';
const BORDER = 'rgba(255,255,255,0.08)';
const GOLD = '#C9A84C';

// ── Module-level slab cache ────────────────────────────────────────
let _commRate = 0;
let _fixedSlabs = [];

const getFeeForPrice = (price, slabs) => {
  if (!slabs || slabs.length === 0) return 0;
  const sorted = [...slabs].sort((a, b) => {
    if (a.upTo === null) return 1;
    if (b.upTo === null) return -1;
    return a.upTo - b.upTo;
  });
  for (const s of sorted) {
    if (s.upTo === null || price <= s.upTo) return Number(s.fee) || 0;
  }
  return 0;
};

const calcEarnings = (price, deliveryCharge = 0) => {
  const p = Number(price) || 0;
  const dc = Number(deliveryCharge) || 0;
  const productVal = Math.max(0, p - dc);
  const commission = Math.round(productVal * (_commRate / 100));
  const fixed = getFeeForPrice(p, _fixedSlabs);
  return {
    commission, fixed, deliveryCharge: dc, productVal,
    total_deduction: commission + fixed,
    earnings: Math.max(0, productVal - commission - fixed),
  };
};

const DELIVERY_ZONES = [
  { zone: 'Zone 1', label: 'Same City', charge: 40, icon: '🏙️', days: '1–2 days' },
  { zone: 'Zone 2', label: 'Same State', charge: 60, icon: '🗺️', days: '2–3 days' },
  { zone: 'Zone 3', label: 'Nearby State', charge: 80, icon: '🚚', days: '3–5 days' },
  { zone: 'Zone 4', label: 'Far State', charge: 100, icon: '✈️', days: '5–7 days' },
];

const ORDER_STATUSES = ['Processing', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

const sStyle = (s) => ({
  Processing: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  Confirmed: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  Shipped: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  'Out for Delivery': { color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
  Delivered: { color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  Cancelled: { color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
}[s] || { color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)' });

const NAV = [
  { id: 'overview', label: 'Overview', icon: FiTrendingUp },
  { id: 'products', label: 'My Products', icon: FiPackage },
  { id: 'orders', label: 'My Orders', icon: FiShoppingBag },
  { id: 'returns', label: 'Returns', icon: FiRotateCcw },
  { id: 'tracking', label: 'Delivery', icon: FiTruck },
  { id: 'analytics', label: 'Analytics', icon: FiBarChart2 },
  { id: 'commission', label: 'Commission', icon: FiPercent },
  { id: 'profile', label: 'My Profile', icon: FiUser },
];

// ── Legal Documents ───────────────────────────────────────────────
const LEGAL_DOCS = {
  seller_agreement: {
    title: 'Seller Agreement & Terms of Service',
    icon: '📋',
    lastUpdated: 'January 2025',
    sections: [
      {
        heading: '1. Eligibility & Registration',
        body: `To sell on Trendorra, you must be at least 18 years old, possess a valid government-issued ID, and operate a legitimate business or individual seller activity. By registering as a seller, you confirm that all information provided — including your name, business name, GSTIN, address, and bank details — is accurate, current, and complete. Trendorra reserves the right to suspend or terminate accounts where false information is detected.`,
      },
      {
        heading: '2. Seller Responsibilities',
        body: `You are solely responsible for the accuracy of your product listings, including descriptions, images, pricing, and stock levels. Products must comply with all applicable Indian laws and must not infringe on third-party intellectual property. You agree to fulfil orders promptly, maintain a minimum fulfilment rate of 95%, and keep your pickup address updated to avoid delivery failures.`,
      },
      {
        heading: '3. Prohibited Items',
        body: `The following are strictly prohibited on Trendorra: counterfeit or replica goods, weapons and hazardous materials, narcotics or prescription-only drugs, items that violate copyright or trademark law, and any product banned under the laws of India. Listing prohibited items will result in immediate account suspension and may be reported to authorities.`,
      },
      {
        heading: '4. Order Fulfilment & SLA',
        body: `Sellers must confirm orders within 12 hours of placement and mark items "Ready for Pickup" within 24 hours of confirmation. Failure to meet fulfilment timelines may result in automatic order cancellation, negative seller ratings, or temporary account restrictions. Trendorra logistics partners will attempt pickup twice; undelivered pickups after two attempts are returned to the seller at no additional cost.`,
      },
      {
        heading: '5. Intellectual Property',
        body: `By uploading product images and descriptions to Trendorra, you grant Trendorra a non-exclusive, royalty-free licence to display, reproduce, and promote that content on the platform and in marketing materials. You retain ownership of your content but warrant that you have the right to grant this licence.`,
      },
      {
        heading: '6. Termination',
        body: `Either party may terminate this agreement with 7 days' written notice to trendorashoppingsai@gmail.com. Trendorra may terminate immediately for breach of these terms, fraudulent activity, or repeated policy violations. Upon termination, all pending payouts due to the seller will be processed within 15 working days after deducting any outstanding charges.`,
      },
      {
        heading: '7. Governing Law',
        body: `This Agreement is governed by and construed in accordance with the laws of India. Any disputes arising shall be subject to the exclusive jurisdiction of the courts located in Andhra Pradesh, India.`,
      },
    ],
  },
  commission_policy: {
    title: 'Commission & Fee Policy',
    icon: '💰',
    lastUpdated: 'January 2025',
    sections: [
      {
        heading: '1. Current Commission Structure',
        body: `Trendorra currently operates in startup mode with zero platform commission and zero fixed fees per order. This means sellers retain 100% of their product value after delivery charges. This promotional structure is subject to change with 30 days' prior written notice sent to the seller's registered email.`,
      },
      {
        heading: '2. How Earnings Are Calculated',
        body: `Your net earnings per order = Sale Price − Delivery Charge − Platform Commission − Fixed Fee Per Order. The delivery charge is collected from the customer and passed entirely to the logistics partner — it does not form part of your earnings or commission base. Commission (if applicable) is calculated only on the product value (Sale Price minus Delivery Charge).`,
      },
      {
        heading: '3. Delivery Charges',
        body: `Delivery charges are zone-based and collected from the buyer at checkout:\n• Zone 1 (Same City): ₹40 | 1–2 days\n• Zone 2 (Same State): ₹60 | 2–3 days\n• Zone 3 (Nearby State): ₹80 | 3–5 days\n• Zone 4 (Far State): ₹100 | 5–7 days\nSellers who enable "Free Delivery" absorb these charges from their product earnings.`,
      },
      {
        heading: '4. Future Rate Changes',
        body: `When Trendorra introduces commission rates, sellers will be notified at least 30 days in advance via email and in-dashboard notification. Existing orders placed before the effective date of any rate change will be settled at the rate applicable at the time of order placement.`,
      },
      {
        heading: '5. Disputed Deductions',
        body: `If you believe a commission or fee has been incorrectly applied, you must raise a dispute within 7 days of the payout settlement date by emailing trendorashoppingsai@gmail.com with your order ID and a description of the discrepancy. Trendorra will review and respond within 5 working days.`,
      },
      {
        heading: '6. GST on Platform Fees',
        body: `When commission fees are active, GST at 18% will be applicable on the platform commission as per Indian tax regulations. Trendorra will issue a monthly Tax Invoice / Commission Statement to sellers by the 5th of each month for the previous month's activity.`,
      },
    ],
  },
  return_policy: {
    title: 'Return & Refund Policy for Sellers',
    icon: '🔄',
    lastUpdated: 'January 2025',
    sections: [
      {
        heading: '1. Return Window',
        body: `Buyers may initiate a return request within 7 days of delivery for most product categories. Categories with a 3-day return window include perishables, personalised items, and innerwear/lingerie. Electronics carry a 10-day return window. Sellers are notified immediately via email and dashboard when a return is initiated by a buyer.`,
      },
      {
        heading: '2. Valid Return Reasons',
        body: `Returns are accepted for the following reasons: item not as described, wrong item delivered, item arrived damaged or defective, and item did not match the size/colour selected. Returns for "change of mind" are accepted only if the seller has opted into Trendorra's Easy Return programme in their seller settings.`,
      },
      {
        heading: "3. Seller's Obligation on Returns",
        body: `When a return is approved by Trendorra's team, the seller must accept the returned item. The logistics partner will collect the return from the buyer and deliver it to your registered pickup address within 5–7 working days. You must inspect the returned item within 48 hours of receipt and raise any dispute regarding item condition through the dashboard.`,
      },
      {
        heading: '4. Refund Processing',
        body: `Once a return is accepted, the buyer's refund is processed by Trendorra within 5–7 working days. The corresponding amount will be deducted from your next payout cycle. If the item is returned damaged by the buyer (i.e., not in the original condition), you may raise a dispute and Trendorra will assess compensation on a case-by-case basis.`,
      },
      {
        heading: '5. Non-Returnable Items',
        body: `The following items cannot be returned unless defective: digital downloads, gift cards, customised/personalised products, hazardous materials, and items explicitly marked "non-returnable" in the listing at the time of purchase. Sellers must accurately mark such items during listing to avoid disputes.`,
      },
      {
        heading: '6. Seller-Initiated Cancellations',
        body: `If a seller is unable to fulfil an order (e.g., item out of stock after order placement), the seller must cancel the order within 12 hours and notify trendorashoppingsai@gmail.com. Repeated seller-initiated cancellations (more than 5% of orders in a month) may result in account review and potential suspension.`,
      },
    ],
  },
  payout_policy: {
    title: 'Payment & Payout Policy',
    icon: '🏦',
    lastUpdated: 'January 2025',
    sections: [
      {
        heading: '1. Payout Schedule',
        body: `Seller payouts are processed on a 7-day settlement cycle. The settlement period begins on the day of successful delivery confirmation. Funds become eligible for payout 7 days after delivery to allow for the return window. Payouts are transferred to your registered bank account every Monday for all eligible settlements from the previous week.`,
      },
      {
        heading: '2. Minimum Payout Threshold',
        body: `A minimum balance of ₹500 must accumulate before a payout is triggered. If your eligible balance is below ₹500 at the end of a settlement cycle, it is carried forward to the next cycle. There is no maximum payout limit — any amount above ₹500 is processed in full each cycle.`,
      },
      {
        heading: '3. Bank Account Requirements',
        body: `Payouts are made exclusively via NEFT/IMPS to Indian bank accounts. Your bank account must be in your name or your registered business name. Trendorra does not support international bank transfers or UPI-only accounts. Ensure your IFSC code and account number in your seller profile are accurate — Trendorra is not liable for failed transfers due to incorrect bank details provided by the seller.`,
      },
      {
        heading: '4. Payout Deductions',
        body: `The following may be deducted from your payout: platform commission and fixed fees (if applicable), refund amounts for approved returns, and penalties for policy violations where applicable. A detailed breakdown of each payout — showing gross amount, deductions, and net credited amount — is available in your seller dashboard under "My Profile → Payout History".`,
      },
      {
        heading: '5. Payout Holds',
        body: `Trendorra may place a temporary hold on payouts in the following situations: suspected fraudulent activity, unresolved buyer disputes, chargeback investigations, or account under review. You will be notified via email if a hold is applied. Held amounts are released within 15 working days once the issue is resolved.`,
      },
      {
        heading: '6. TDS Deductions',
        body: `As per Section 194-O of the Income Tax Act, 1961, Trendorra is required to deduct TDS at 1% on gross sales value for sellers with PAN linked to their account, and at 5% for sellers without PAN. TDS certificates (Form 26AS) will be available quarterly. It is the seller's responsibility to file their income tax returns accurately. For GST-registered sellers, monthly GSTR-1 data will be shared on request.`,
      },
      {
        heading: '7. Dispute & Escalation',
        body: `For any payout discrepancy, email trendorashoppingsai@gmail.com with subject line "Payout Dispute — [Your Seller ID]" within 30 days of the payout date. Include your bank statement showing the credited amount and the payout ID from your dashboard. Trendorra will acknowledge within 2 working days and resolve within 10 working days.`,
      },
    ],
  },
};

// ── Rich Order Detail Modal (Admin-style) ─────────────────────────
function OrderDetailModal({ open, order, onClose, onConfirm, onMarkReady, onSimulate, confirmingOrder, markingReady, simulatingOrder }) {
  if (!open || !order) return null;

  const dc = order.deliveryCharge || order.shippingPrice || 0;
  const { commission, fixed, productVal, earnings } = calcEarnings(order.totalPrice || 0, dc);
  const s = sStyle(order.orderStatus);
  const isCOD = order.paymentMethod === 'COD';
  const addr = order.shippingAddress || {};
  const isProcessing = order.orderStatus === 'Processing';
  const isConfirmed = order.orderStatus === 'Confirmed';
  const canReady = isProcessing || isConfirmed;
  const isCancelled = order.orderStatus === 'Cancelled';

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div style={{
        backgroundColor: '#111', border: `1px solid ${BORDER}`,
        borderRadius: '16px', maxWidth: '720px', width: '100%',
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
      }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 26px', borderBottom: `1px solid ${BORDER}`,
          background: 'linear-gradient(135deg, #0d0d0d 0%, #131313 100%)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `${GOLD}15`, border: `1px solid ${GOLD}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiShoppingBag size={16} style={{ color: GOLD }} />
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 3px' }}>Order Details</p>
              <p style={{ color: GOLD, fontFamily: 'Cinzel, serif', fontSize: '17px', margin: 0, letterSpacing: '0.06em', fontWeight: '700' }}>
                #{order._id.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontSize: '11px', padding: '5px 14px', borderRadius: '20px',
              color: s.color, backgroundColor: s.bg,
              fontWeight: '700', border: `1px solid ${s.color}30`,
              letterSpacing: '0.05em',
            }}>
              {order.orderStatus}
            </span>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`,
              color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '6px',
              borderRadius: '6px', display: 'flex', alignItems: 'center',
            }}>
              <FiX size={16} />
            </button>
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '22px 26px' }}>

          {/* ── 4-col Meta Grid ── */}
          <div className="modal-meta-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '20px' }}>
            {[
              {
                icon: FiCalendar, label: 'Order Date',
                value: new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                iconColor: '#a78bfa',
              },
              {
                icon: FiCreditCard, label: 'Payment',
                value: isCOD ? '💵 COD' : '✅ Prepaid',
                iconColor: isCOD ? '#fbbf24' : '#4ade80',
                highlight: isCOD,
              },
              {
                icon: FiTag, label: 'Items',
                value: `${order.orderItems?.length || 0} item${(order.orderItems?.length || 0) !== 1 ? 's' : ''}`,
                iconColor: '#60a5fa',
              },
              {
                icon: FiDollarSign, label: 'Sale Price',
                value: `₹${(order.totalPrice || 0).toLocaleString()}`,
                iconColor: GOLD,
              },
            ].map(({ icon: Icon, label, value, iconColor, highlight }) => (
              <div key={label} style={{
                backgroundColor: '#0d0d0d', border: `1px solid ${BORDER}`,
                borderRadius: '10px', padding: '14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
                  <Icon size={12} style={{ color: iconColor }} />
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>{label}</p>
                </div>
                <p style={{ color: highlight ? '#fbbf24' : '#fff', fontSize: '13px', fontWeight: '600', margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* ── Tracking ID ── */}
          {order.trackingId && (
            <div style={{
              backgroundColor: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)',
              borderRadius: '10px', padding: '13px 16px', marginBottom: '18px',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(96,165,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FiTruck size={14} style={{ color: '#60a5fa' }} />
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 3px' }}>Tracking / AWB Number</p>
                <p style={{ color: '#60a5fa', fontSize: '14px', fontWeight: '700', margin: 0, fontFamily: 'monospace', letterSpacing: '2px' }}>{order.trackingId}</p>
              </div>
            </div>
          )}

          {/* ── Two-column layout: items + address ── */}
          <div className="modal-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>

            {/* Items Ordered */}
            <div>
              <p style={{ color: GOLD, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 10px', fontWeight: '600' }}>
                Items Ordered
              </p>
              <div style={{ backgroundColor: '#0d0d0d', border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
                {(order.orderItems || []).map((item, i) => {
                  const imgSrc = item.image || item.product?.images?.[0]?.url || item.product?.images?.[0];
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '12px 14px',
                      borderBottom: i < (order.orderItems.length - 1) ? `1px solid ${BORDER}` : 'none',
                    }}>
                      {imgSrc ? (
                        <img src={imgSrc} alt="" style={{ width: '38px', height: '48px', objectFit: 'cover', borderRadius: '5px', backgroundColor: '#1a1a1a', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '38px', height: '48px', borderRadius: '5px', backgroundColor: '#1a1a1a', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FiPackage size={13} style={{ color: 'rgba(255,255,255,0.2)' }} />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: '#fff', fontSize: '12px', fontWeight: '500', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name || item.product?.name || '—'}
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '0 0 2px' }}>
                          Qty: {item.quantity} × ₹{(item.price || 0).toLocaleString()}
                        </p>
                        {item.size && (
                          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', margin: 0 }}>
                            Size: {item.size}
                          </p>
                        )}
                        {item.color && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>Color:</span>
                            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: item.color, border: '1px solid rgba(255,255,255,0.2)' }}></span>
                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', textTransform: 'capitalize' }}>{item.color}</span>
                          </div>
                        )}
                      </div>
                      <p style={{ color: '#fff', fontSize: '12px', fontWeight: '700', margin: 0, flexShrink: 0 }}>
                        ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shipping Address */}
            <div>
              <p style={{ color: GOLD, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 10px', fontWeight: '600' }}>
                Deliver To
              </p>
              <div style={{ backgroundColor: '#0d0d0d', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '16px', height: 'calc(100% - 28px)', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: `${GOLD}15`, border: `1px solid ${GOLD}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FiUser size={13} style={{ color: GOLD }} />
                  </div>
                  <div>
                    <p style={{ color: '#fff', fontSize: '13px', fontWeight: '600', margin: '0 0 2px' }}>{addr.fullName || order.user?.name || '—'}</p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0 }}>{order.user?.email || '—'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <FiMapPin size={12} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', lineHeight: '1.7', margin: 0 }}>
                    {addr.addressLine1 || '—'}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}<br />
                    {[addr.city, addr.state].filter(Boolean).join(', ')}{addr.pincode ? ` — ${addr.pincode}` : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <FiPhone size={12} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: 0 }}>
                    {addr.phone || order.user?.phone || '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Earnings Breakdown ── */}
          <p style={{ color: GOLD, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 10px', fontWeight: '600' }}>Earnings Breakdown</p>
          <div style={{ backgroundColor: '#0d0d0d', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '16px', marginBottom: '18px' }}>
            <div className="modal-earnings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0', marginBottom: '0' }}>
              {[
                { label: 'Sale Price', value: `₹${(order.totalPrice || 0).toLocaleString()}`, color: '#fff', sub: 'Total paid by buyer' },
                { label: '− Delivery', value: `₹${dc}`, color: '#60a5fa', sub: 'Goes to courier' },
                { label: '= Product Value', value: `₹${productVal.toLocaleString()}`, color: 'rgba(255,255,255,0.6)', sub: 'Commission base' },
                { label: '− Commission', value: commission > 0 ? `₹${commission}` : '₹0', color: commission > 0 ? '#f87171' : 'rgba(255,255,255,0.2)', sub: `${_commRate}% rate` },
                { label: '− Fixed Fee', value: fixed > 0 ? `₹${fixed}` : '₹0', color: fixed > 0 ? '#fbbf24' : 'rgba(255,255,255,0.2)', sub: 'Slab charge' },
              ].map(({ label, value, color, sub }, i, arr) => (
                <div key={label} style={{
                  padding: '12px 14px',
                  borderRight: i < arr.length - 1 ? `1px solid ${BORDER}` : 'none',
                }}>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>{label}</p>
                  <p style={{ color, fontSize: '14px', fontWeight: '700', margin: '0 0 3px' }}>{value}</p>
                  <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', margin: 0 }}>{sub}</p>
                </div>
              ))}
            </div>
            <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: '0', padding: '14px 14px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: GOLD, fontSize: '13px', fontWeight: '700', margin: '0 0 2px' }}>🎉 Your Net Earnings</p>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', margin: 0 }}>After all deductions</p>
              </div>
              <p style={{ color: isCancelled ? '#f87171' : '#4ade80', fontSize: '26px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>
                {isCancelled ? '—' : `₹${earnings.toLocaleString()}`}
              </p>
            </div>
          </div>

          {/* ── Status History ── */}
          {order.statusHistory?.length > 0 && (
            <>
              <p style={{ color: GOLD, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 10px', fontWeight: '600' }}>Status History</p>
              <div style={{ backgroundColor: '#0d0d0d', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '16px', marginBottom: '18px' }}>
                <div style={{ position: 'relative', paddingLeft: '20px' }}>
                  <div style={{ position: 'absolute', left: '5px', top: '8px', bottom: '8px', width: '2px', backgroundColor: BORDER }} />
                  {[...order.statusHistory].reverse().map((h, i) => {
                    const hs = sStyle(h.status);
                    return (
                      <div key={i} style={{ position: 'relative', paddingBottom: i < order.statusHistory.length - 1 ? '16px' : 0 }}>
                        <div style={{ position: 'absolute', left: '-17px', top: '3px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: hs.color, border: '2px solid #0d0d0d', boxShadow: `0 0 6px ${hs.color}60` }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <p style={{ color: hs.color, fontSize: '12px', fontWeight: '600', margin: '0 0 2px' }}>{h.status}</p>
                            {h.message && <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: 0 }}>{h.message}</p>}
                          </div>
                          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', margin: 0, flexShrink: 0, marginLeft: '12px' }}>
                            {new Date(h.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ── Action Buttons ── */}
          {!isCancelled && (
            <>
              <p style={{ color: GOLD, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 10px', fontWeight: '600' }}>Quick Actions</p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                {isProcessing && (
                  <button onClick={() => { onConfirm(order._id); }} disabled={confirmingOrder === order._id}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', backgroundColor: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: '8px', color: '#60a5fa', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                    {confirmingOrder === order._id ? <FiRefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <FiCheckCircle size={12} />}
                    Confirm Order
                  </button>
                )}
                {canReady && (
                  <button onClick={() => { onMarkReady(order._id); }} disabled={markingReady === order._id}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', backgroundColor: `${GOLD}15`, border: `1px solid ${GOLD}35`, borderRadius: '8px', color: GOLD, fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                    {markingReady === order._id ? <FiRefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <FiTruck size={12} />}
                    Ready for Pickup
                  </button>
                )}
                {order.trackingId && !['Delivered', 'Cancelled'].includes(order.orderStatus) && (
                  <button onClick={() => { onSimulate(order._id); }} disabled={simulatingOrder === order._id}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', backgroundColor: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '8px', color: '#a78bfa', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                    {simulatingOrder === order._id ? <FiRefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <FiPlay size={12} />}
                    Simulate Next Step
                  </button>
                )}
                <button
                  onClick={() => window.open(deliveryAPI.getLabel(order._id), '_blank')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', backgroundColor: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '6px', color: '#4ade80', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  <FiFileText size={12} /> 📄 Download Bill
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: '16px 26px', borderTop: `1px solid ${BORDER}`, backgroundColor: '#0d0d0d', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', margin: 0 }}>
            Order placed {new Date(order.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
          <button onClick={onClose} style={{ padding: '9px 28px', backgroundColor: GOLD, border: 'none', borderRadius: '6px', color: '#000', fontSize: '13px', fontWeight: '700', cursor: 'pointer', letterSpacing: '0.03em' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function LegalModal({ open, docKey, onClose }) {
  const [expanded, setExpanded] = useState(null);
  useEffect(() => { if (open) setExpanded(0); }, [open, docKey]);
  if (!open || !docKey) return null;
  const doc = LEGAL_DOCS[docKey];
  if (!doc) return null;
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ backgroundColor: '#111', border: `1px solid ${BORDER}`, borderRadius: '14px', maxWidth: '640px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '22px 24px 16px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '26px' }}>{doc.icon}</span>
            <div>
              <p style={{ color: GOLD, fontFamily: 'Cinzel, serif', fontSize: '13px', letterSpacing: '0.05em', margin: '0 0 4px' }}>{doc.title}</p>
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', margin: 0 }}>Last updated: {doc.lastUpdated} · Trendorra Platform</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: '4px', flexShrink: 0 }}><FiX size={18} /></button>
        </div>
        <div style={{ overflowY: 'auto', padding: '16px 24px', flex: 1 }}>
          {doc.sections.map((section, i) => (
            <div key={i} style={{ borderBottom: `1px solid ${BORDER}`, marginBottom: '2px' }}>
              <button onClick={() => setExpanded(expanded === i ? null : i)}
                style={{ width: '100%', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', cursor: 'pointer', gap: '12px' }}>
                <span style={{ color: expanded === i ? GOLD : 'rgba(255,255,255,0.75)', fontSize: '12px', fontWeight: '600', textAlign: 'left', lineHeight: '1.4', transition: 'color 0.15s' }}>{section.heading}</span>
                <span style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>{expanded === i ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}</span>
              </button>
              {expanded === i && (
                <div style={{ paddingBottom: '14px' }}>
                  {section.body.split('\n').map((line, j) => (
                    <p key={j} style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', lineHeight: '1.75', margin: j === 0 ? '0 0 6px' : '6px 0 0' }}>{line}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div style={{ marginTop: '18px', padding: '12px 14px', backgroundColor: `${GOLD}08`, border: `1px solid ${GOLD}20`, borderRadius: '8px' }}>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', lineHeight: '1.6', margin: 0 }}>
              For questions about this policy, contact us at{' '}
              <a href="mailto:trendorashoppingsai@gmail.com" style={{ color: GOLD, textDecoration: 'none' }}>trendorashoppingsai@gmail.com</a>.
              Trendorra reserves the right to update these policies at any time with notice to registered sellers.
            </p>
          </div>
        </div>
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${BORDER}`, backgroundColor: '#0d0d0d', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', margin: 0 }}>{doc.sections.length} sections · Effective immediately</p>
          <button onClick={onClose} style={{ padding: '9px 24px', backgroundColor: GOLD, border: 'none', borderRadius: '6px', color: '#000', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>I Understand</button>
        </div>
      </div>
    </div>
  );
}

function SellerFooter({ onOpenLegal }) {
  return (
    <div style={{ borderTop: `1px solid ${BORDER}`, backgroundColor: '#050505', padding: '16px 24px', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <span style={{ color: GOLD, fontFamily: 'Cinzel, serif', fontSize: '12px', letterSpacing: '0.2em' }}>TRENDORRA</span>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {[
            { key: 'seller_agreement', label: 'Seller Agreement' },
            { key: 'commission_policy', label: 'Commission Policy' },
            { key: 'return_policy', label: 'Return Policy' },
            { key: 'payout_policy', label: 'Payout Policy' },
          ].map(({ key, label }, i, arr) => (
            <span key={key} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button onClick={() => onOpenLegal(key)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '11px', cursor: 'pointer', padding: '2px 4px' }}
                onMouseOver={e => e.currentTarget.style.color = GOLD}
                onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
                {label}
              </button>
              {i < arr.length - 1 && <span style={{ color: 'rgba(255,255,255,0.1)' }}>·</span>}
            </span>
          ))}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', margin: 0 }}>© {new Date().getFullYear()} Trendorra</p>
      </div>
    </div>
  );
}

function DangerModal({ open, onClose, onConfirm, loading, title, subtitle, lines }) {
  const [typed, setTyped] = useState('');
  useEffect(() => { if (!open) setTyped(''); }, [open]);
  if (!open) return null;
  const ready = typed === 'DELETE' && !loading;
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(248,113,113,0.4)', borderRadius: '14px', padding: '28px', maxWidth: '440px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FiAlertTriangle size={18} style={{ color: '#f87171' }} />
          </div>
          <div>
            <p style={{ color: '#f87171', fontFamily: 'Cinzel, serif', fontSize: '14px', margin: '0 0 2px' }}>{title}</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0 }}>{subtitle}</p>
          </div>
        </div>
        <div style={{ backgroundColor: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
          {lines.map((l, i) => <p key={i} style={{ color: i === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.45)', fontSize: '12px', lineHeight: '1.7', marginTop: i > 0 ? '6px' : 0 }}>{l}</p>)}
          <p style={{ color: '#f87171', fontSize: '11px', fontWeight: '600', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(248,113,113,0.2)' }}>🚫 Cannot be undone.</p>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', marginBottom: '7px' }}>Type <strong style={{ color: '#f87171' }}>DELETE</strong> to confirm</p>
        <input autoFocus type="text" value={typed} onChange={e => setTyped(e.target.value)} placeholder="Type DELETE here…"
          style={{ width: '100%', backgroundColor: '#0d0d0d', border: `1px solid ${typed === 'DELETE' ? '#f87171' : 'rgba(255,255,255,0.1)'}`, borderRadius: '6px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box', marginBottom: '14px' }} />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'rgba(255,255,255,0.45)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => ready && onConfirm()} disabled={!ready}
            style={{ flex: 1, padding: '10px', backgroundColor: ready ? '#f87171' : 'rgba(248,113,113,0.1)', border: `1px solid ${ready ? '#f87171' : 'rgba(248,113,113,0.2)'}`, borderRadius: '6px', color: ready ? '#fff' : 'rgba(248,113,113,0.4)', fontSize: '13px', fontWeight: '700', cursor: ready ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            {loading ? <><FiRefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> Deleting…</> : <><FiTrash2 size={12} /> Delete Forever</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditModal({ open, onClose, user, onSave }) {
  const [form, setForm] = useState({ name: '', phone: '', businessName: '', gstin: '', addressLine: '', city: '', state: '', pincode: '', bankName: '', accountName: '', bankAccount: '', ifsc: '', freeDelivery: false });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (open && user) setForm({
      name: user.name || '', phone: user.phone || '',
      businessName: user.sellerInfo?.businessName || '', gstin: user.sellerInfo?.gstin || '',
      addressLine: user.sellerInfo?.address?.line || '', city: user.sellerInfo?.address?.city || '',
      state: user.sellerInfo?.address?.state || '', pincode: user.sellerInfo?.address?.pincode || '',
      bankName: user.sellerInfo?.bank?.bankName || '', accountName: user.sellerInfo?.bank?.name || '',
      bankAccount: user.sellerInfo?.bank?.account || '', ifsc: user.sellerInfo?.bank?.ifsc || '',
      freeDelivery: user.sellerInfo?.freeDelivery || false,
    });
  }, [open, user]);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  if (!open) return null;
  const handleSave = async () => { setSaving(true); try { await onSave(form); onClose(); } finally { setSaving(false); } };
  const inp = { width: '100%', boxSizing: 'border-box', backgroundColor: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'inherit', marginBottom: '12px' };
  const lbl = { display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' };
  const sec = { color: GOLD, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '18px 0 10px', fontWeight: '600' };
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ backgroundColor: '#1a1a1a', border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '28px', maxWidth: '540px', width: '100%', maxHeight: '88vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: GOLD, fontFamily: 'Cinzel, serif', fontSize: '15px', letterSpacing: '0.1em', margin: 0 }}>Edit Profile</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><FiX size={18} /></button>
        </div>
        <p style={sec}>Account</p>
        <label style={lbl}>Full Name</label><input style={inp} value={form.name} onChange={e => set('name', e.target.value)} onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        <label style={lbl}>Phone</label><input style={inp} value={form.phone} onChange={e => set('phone', e.target.value)} onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        <p style={sec}>Business</p>
        <label style={lbl}>Business Name</label><input style={inp} value={form.businessName} onChange={e => set('businessName', e.target.value)} onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        <label style={lbl}>GSTIN</label><input style={inp} value={form.gstin} onChange={e => set('gstin', e.target.value)} onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        <p style={sec}>Pickup Address</p>
        <label style={lbl}>Street</label><input style={inp} value={form.addressLine} onChange={e => set('addressLine', e.target.value)} onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div><label style={lbl}>City</label><input style={inp} value={form.city} onChange={e => set('city', e.target.value)} onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} /></div>
          <div><label style={lbl}>Pincode</label><input style={inp} value={form.pincode} onChange={e => set('pincode', e.target.value)} onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} /></div>
        </div>
        <label style={lbl}>State</label><input style={inp} value={form.state} onChange={e => set('state', e.target.value)} onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        <p style={sec}>Bank Account</p>
        <label style={lbl}>Account Holder</label><input style={inp} value={form.accountName} onChange={e => set('accountName', e.target.value)} onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        <label style={lbl}>Bank Name</label><input style={inp} value={form.bankName} onChange={e => set('bankName', e.target.value)} onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        <label style={lbl}>Account Number</label><input style={inp} value={form.bankAccount} onChange={e => set('bankAccount', e.target.value)} onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        <label style={lbl}>IFSC</label><input style={inp} value={form.ifsc} onChange={e => set('ifsc', e.target.value.toUpperCase())} onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', backgroundColor: 'transparent', border: `1px solid ${BORDER}`, borderRadius: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '11px', backgroundColor: saving ? `${GOLD}80` : GOLD, border: 'none', borderRadius: '6px', color: '#000', fontSize: '13px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {saving ? 'Saving…' : <><FiSave size={13} /> Save</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function NoReturnsToggle({ enabled, onToggle }) {
  const [loading, setLoading] = useState(false);
  const handleClick = async () => { setLoading(true); await onToggle(!enabled).finally(() => setLoading(false)); };
  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${enabled ? 'rgba(248,113,113,0.3)' : BORDER}`, borderRadius: '10px', padding: '18px 20px', marginBottom: '12px' }}>
      <p style={{ color: GOLD, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 14px', fontWeight: '600' }}>Return Policy</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <p style={{ color: '#fff', fontSize: '14px', fontWeight: '600', margin: '0 0 4px' }}>
            {enabled ? '🔴 No Returns Enabled' : '✅ Standard Returns Active'}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', lineHeight: '1.6', margin: 0, maxWidth: '380px' }}>
            {enabled
              ? 'Customers cannot return orders from your store. This is shown on all your product pages.'
              : 'You can enable no-returns — your admin has approved this. Customers will see a "No Returns" notice on your products.'}
          </p>
        </div>
        <button onClick={handleClick} disabled={loading}
          style={{ padding: '9px 18px', backgroundColor: enabled ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${enabled ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`, borderRadius: '8px', color: enabled ? '#4ade80' : '#f87171', fontSize: '13px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
          {loading && <FiRefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />}
          {enabled ? 'Switch to Standard Returns' : 'Enable No Returns'}
        </button>
      </div>
    </div>
  );
}

function CommissionCalc({ commissionRate = 0, fixedCharge = 0 }) {
  const [price, setPrice] = useState('1000');
  const p = Number(price) || 0;
  const productVal = p;
  const commission = Math.round(productVal * (commissionRate / 100));
  const fixed = Number(fixedCharge) || 0;
  const earnings = Math.max(0, productVal - commission - fixed);
  const total_deduction = commission + fixed;
  return (
    <div style={{ backgroundColor: '#0d0d0d', border: `1px solid ${GOLD}30`, borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
      <p style={{ color: GOLD, fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '14px' }}>💰 Earnings Calculator</p>
      {commissionRate === 0 && fixedCharge === 0 ? (
        <div style={{ backgroundColor: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '6px', padding: '8px 12px', marginBottom: '14px' }}>
          <p style={{ color: '#4ade80', fontSize: '12px', margin: 0 }}>🎉 Zero charges — You keep 100% of product value!</p>
        </div>
      ) : (
        <div style={{ backgroundColor: `${GOLD}08`, border: `1px solid ${GOLD}20`, borderRadius: '6px', padding: '8px 12px', marginBottom: '14px' }}>
          <p style={{ color: GOLD, fontSize: '12px', margin: 0 }}>Current rates: {commissionRate}% commission + ₹{fixedCharge} fixed per order</p>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', flexShrink: 0 }}>Price ₹</span>
        <input type="number" value={price} onChange={e => setPrice(e.target.value)}
          style={{ flex: 1, backgroundColor: '#1a1a1a', border: `1px solid ${GOLD}40`, borderRadius: '6px', padding: '8px 14px', color: '#fff', fontSize: '16px', fontWeight: '600', outline: 'none' }} />
      </div>
      {p > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { label: 'Selling Price', value: `₹${p.toLocaleString()}`, color: '#fff' },
            { label: `Commission ${commissionRate}%`, value: commission > 0 ? `- ₹${commission}` : '₹0', color: commission > 0 ? '#f87171' : 'rgba(255,255,255,0.3)' },
            { label: 'Fixed Fee', value: fixed > 0 ? `- ₹${fixed}` : '₹0', color: fixed > 0 ? '#fbbf24' : 'rgba(255,255,255,0.3)' },
            { label: 'Total Deducted', value: total_deduction > 0 ? `- ₹${total_deduction}` : '₹0', color: total_deduction > 0 ? '#fb923c' : 'rgba(255,255,255,0.3)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ backgroundColor: '#1a1a1a', borderRadius: '8px', padding: '12px 14px' }}>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: '0 0 4px' }}>{label}</p>
              <p style={{ color, fontSize: '16px', fontWeight: '600', margin: 0 }}>{value}</p>
            </div>
          ))}
          <div style={{ gridColumn: '1 / -1', backgroundColor: `${GOLD}15`, border: `1px solid ${GOLD}40`, borderRadius: '8px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ color: GOLD, fontSize: '14px', margin: 0, fontWeight: '600' }}>🎉 You Receive</p>
            <p style={{ color: GOLD, fontSize: '24px', fontWeight: '700', margin: 0 }}>₹{earnings.toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Seller Return Action Modal ─────────────────────────────────────
function ReturnActionModal({ open, order, action, onClose, onConfirm, loading: actLoading }) {
  const [note, setNote] = useState('');
  useEffect(() => { if (open) setNote(''); }, [open]);
  if (!open || !order) return null;
  const isApprove = action === 'approve';
  const refund = order.totalPrice || 0;
  const orderId = order._id.slice(-8).toUpperCase();
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ backgroundColor: '#1a1a1a', border: `1px solid ${isApprove ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`, borderRadius: '14px', padding: '28px', maxWidth: '460px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: isApprove ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${isApprove ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {isApprove ? <FiCheck size={20} style={{ color: '#4ade80' }} /> : <FiX size={20} style={{ color: '#f87171' }} />}
          </div>
          <div>
            <h3 style={{ color: isApprove ? '#4ade80' : '#f87171', fontSize: '15px', fontFamily: 'Cinzel, serif', margin: '0 0 3px' }}>
              {isApprove ? 'Approve Return' : 'Reject Return'}
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', margin: 0 }}>Order #{orderId}</p>
          </div>
        </div>
        {isApprove && (
          <div style={{ backgroundColor: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>Refund to Customer</p>
            <p style={{ color: '#4ade80', fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>₹{refund.toLocaleString('en-IN')}</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', margin: 0 }}>Processed within 5–7 business days</p>
          </div>
        )}
        <div style={{ marginBottom: '20px' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>
            {isApprove ? 'Message to Customer (Optional)' : 'Reason for Rejection (Required)'}
          </p>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
            placeholder={isApprove ? 'e.g. Return pickup will be arranged...' : 'e.g. Item shows signs of use...'}
            style={{ width: '100%', backgroundColor: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = GOLD}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => onConfirm(action, note)} disabled={actLoading || (!isApprove && !note.trim())}
            style={{ flex: 2, padding: '11px', backgroundColor: actLoading ? 'rgba(201,168,76,0.3)' : GOLD, border: 'none', borderRadius: '6px', color: '#000', fontSize: '13px', fontWeight: '700', cursor: actLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
            {actLoading
              ? <><FiRefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</>
              : isApprove ? <><FiCheck size={13} /> Approve & Notify</> : <><FiX size={13} /> Reject & Notify</>
            }
          </button>
        </div>
        {!isApprove && !note.trim() && (
          <p style={{ color: '#f87171', fontSize: '11px', margin: '8px 0 0', textAlign: 'center' }}>Please provide a reason for rejection</p>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────
export default function SellerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [returnsLoading, setReturnsLoading] = useState(false);
  const [returnFilter, setReturnFilter] = useState('Pending');
  const [returnActModal, setReturnActModal] = useState({ open: false, order: null, action: null });
  const [returnActLoad, setReturnActLoad] = useState(false);
  const [returnImgView, setReturnImgView] = useState(null);
  const [reversingPickup, setReversingPickup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [legalDoc, setLegalDoc] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [showResetOrders, setShowResetOrders] = useState(false);
  const [showResetRevenue, setShowResetRevenue] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [markingReady, setMarkingReady] = useState(null);
  const [confirmingOrder, setConfirmingOrder] = useState(null);
  const [simulatingOrder, setSimulatingOrder] = useState(null);

  const [platformSettings, setPlatformSettings] = useState({ commissionRate: 0, fixedSlabs: [] });

  // Mobile sidebar toggle
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'seller') { navigate('/login'); return; }
    setCurrentUser(user);
    loadData();
    settingsAPI.get()
      .then(res => {
        const s = res?.settings || res || {};
        const rate = s.commissionRate ?? 0;
        const slabs = s.fixedSlabs?.length ? s.fixedSlabs : [];
        _commRate = rate;
        _fixedSlabs = slabs;
        setPlatformSettings({ commissionRate: rate, fixedSlabs: slabs });
      })
      .catch(() => { });
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, orderRes] = await Promise.all([
        productAPI.getMine().catch(() => ({ products: [] })),
        orderAPI.getMyOrders().catch(() => ({ orders: [] })),
      ]);
      setProducts(prodRes.products || []);
      setOrders(orderRes.orders || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadReturns = async () => {
    setReturnsLoading(true);
    try {
      const res = await orderAPI.getReturns({ status: returnFilter || undefined, limit: 100 });
      setReturns(res.orders || []);
    } catch (e) { toast.error(e?.message || 'Failed to load returns'); }
    finally { setReturnsLoading(false); }
  };

  useEffect(() => { if (activeTab === 'returns') loadReturns(); }, [activeTab, returnFilter]);

  const u = currentUser || user;

  const validOrders = orders.filter(o => o.orderStatus !== 'Cancelled');
  const grossRevenue = validOrders.reduce((s, o) => s + (o.totalPrice || 0), 0);
  const totalDelivery = validOrders.reduce((s, o) => s + (o.deliveryCharge || 0), 0);
  const netEarnings = validOrders.reduce((s, o) => s + calcEarnings(o.totalPrice || 0, o.deliveryCharge || 0).earnings, 0);
  const totalCommission = validOrders.reduce((s, o) => s + calcEarnings(o.totalPrice || 0, o.deliveryCharge || 0).commission, 0);
  const totalFixed = validOrders.reduce((s, o) => s + calcEarnings(o.totalPrice || 0, o.deliveryCharge || 0).fixed, 0);

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try { await productAPI.delete(id); toast.success('Deleted'); loadData(); }
    catch { toast.error('Failed'); }
  };

  const handleSaveProfile = async (form) => {
    try {
      await authAPI.updateProfile({ name: form.name, phone: form.phone });
      await authAPI.updateSellerInfo({
        businessName: form.businessName, gstin: form.gstin, freeDelivery: form.freeDelivery,
        address: { line: form.addressLine, city: form.city, state: form.state, pincode: form.pincode },
        bank: { name: form.accountName, bankName: form.bankName, account: form.bankAccount, ifsc: form.ifsc },
      });
      const res = await authAPI.getMe();
      setCurrentUser(res.user);
      toast.success('Profile updated!');
    } catch (e) { toast.error(e?.message || 'Update failed'); throw e; }
  };

  const handleMarkReady = async (orderId) => {
    setMarkingReady(orderId);
    try {
      const res = await deliveryAPI.markReady(orderId);
      toast.success(res.waybill ? `📦 Pickup scheduled! AWB: ${res.waybill}` : '✅ Ready for pickup');
      loadData();
      if (selectedOrder?._id === orderId) {
        const updated = await orderAPI.getMyOrders().catch(() => ({ orders: [] }));
        const fresh = (updated.orders || []).find(o => o._id === orderId);
        if (fresh) setSelectedOrder(fresh);
      }
    } catch (e) { toast.error(e?.message || 'Failed'); }
    finally { setMarkingReady(null); }
  };

  const handleConfirmOrder = async (orderId) => {
    setConfirmingOrder(orderId);
    try {
      await orderAPI.confirm(orderId);
      toast.success('✅ Order confirmed!');
      loadData();
      if (selectedOrder?._id === orderId) {
        const updated = await orderAPI.getMyOrders().catch(() => ({ orders: [] }));
        const fresh = (updated.orders || []).find(o => o._id === orderId);
        if (fresh) setSelectedOrder(fresh);
      }
    } catch (e) { toast.error(e?.message || 'Failed'); }
    finally { setConfirmingOrder(null); }
  };

  const handleSimulate = async (orderId) => {
    setSimulatingOrder(orderId);
    try {
      const res = await deliveryAPI.simulate(orderId);
      toast.success(`📦 ${res.newStatus}${res.payoutEligible ? ' · 💰 Payout unlocked!' : ''}`);
      loadData();
      if (selectedOrder?._id === orderId) {
        const updated = await orderAPI.getMyOrders().catch(() => ({ orders: [] }));
        const fresh = (updated.orders || []).find(o => o._id === orderId);
        if (fresh) setSelectedOrder(fresh);
      }
    } catch (e) { toast.error(e?.message || 'Simulation failed'); }
    finally { setSimulatingOrder(null); }
  };

  const handleResetOrders = async () => {
    setResetLoading(true);
    try { await orderAPI.deleteMyOrders(); setOrders([]); setShowResetOrders(false); toast.success('All orders deleted'); }
    catch (e) { toast.error(e?.message || 'Failed'); }
    finally { setResetLoading(false); }
  };

  const handleResetRevenue = async () => {
    setResetLoading(true);
    try { setOrders(prev => prev.map(o => ({ ...o, totalPrice: 0 }))); setShowResetRevenue(false); toast.success('Revenue reset'); }
    catch { } finally { setResetLoading(false); }
  };

  const handleReturnAction = async (action, note) => {
    if (!returnActModal.order) return;
    setReturnActLoad(true);
    try {
      const res = await orderAPI.handleReturn(returnActModal.order._id, action, note);
      toast.success(res.message || (action === 'approve' ? 'Return approved!' : 'Return rejected'));
      setReturnActModal({ open: false, order: null, action: null });
      loadReturns();
    } catch (e) { toast.error(e?.message || 'Action failed'); }
    finally { setReturnActLoad(false); }
  };

  const handleReversePickup = async (orderId) => {
    setReversingPickup(orderId);
    try {
      const res = await deliveryAPI.reversePickup(orderId);
      toast.success(res.message || `Reverse pickup scheduled! AWB: ${res.reverseAwb}`);
      loadReturns();
    } catch (e) { toast.error(e?.message || 'Reverse pickup failed'); }
    finally { setReversingPickup(null); }
  };

  const thS = { color: 'rgba(255,255,255,0.35)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 14px', textAlign: 'left', borderBottom: `1px solid ${BORDER}`, backgroundColor: '#0d0d0d', whiteSpace: 'nowrap' };
  const tdS = { padding: '11px 14px', borderBottom: `1px solid ${BORDER}`, verticalAlign: 'middle' };

  // Close mobile sidebar when tab changes
  const handleTabChange = (id) => {
    setActiveTab(id);
    setMobileSidebarOpen(false);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: BG, display: 'flex', flexDirection: 'column' }}>

      {/* ── Modals ── */}
      <LegalModal open={!!legalDoc} docKey={legalDoc} onClose={() => setLegalDoc(null)} />
      <OrderDetailModal
        open={!!selectedOrder}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onConfirm={handleConfirmOrder}
        onMarkReady={handleMarkReady}
        onSimulate={handleSimulate}
        confirmingOrder={confirmingOrder}
        markingReady={markingReady}
        simulatingOrder={simulatingOrder}
      />
      <ReturnActionModal
        open={returnActModal.open}
        order={returnActModal.order}
        action={returnActModal.action}
        onClose={() => setReturnActModal({ open: false, order: null, action: null })}
        onConfirm={handleReturnAction}
        loading={returnActLoad}
      />
      <DangerModal open={showResetOrders} onClose={() => setShowResetOrders(false)} onConfirm={handleResetOrders} loading={resetLoading}
        title="Delete All Orders" subtitle="My Orders" lines={['⚠️ Permanently deletes ALL your orders from DB.', 'Cannot be recovered.']} />
      <DangerModal open={showResetRevenue} onClose={() => setShowResetRevenue(false)} onConfirm={handleResetRevenue} loading={resetLoading}
        title="Reset Revenue" subtitle="Analytics" lines={['⚠️ Resets all revenue to zero.', 'Cannot be undone.']} />
      <EditModal open={editOpen} onClose={() => setEditOpen(false)} user={u} onSave={handleSaveProfile} />

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 998, backgroundColor: 'rgba(0,0,0,0.7)' }}
        />
      )}

      {/* ── Top bar ── */}
      <div style={{ backgroundColor: '#050505', borderBottom: `1px solid ${BORDER}`, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Hamburger for mobile */}
          <button
            onClick={() => setMobileSidebarOpen(o => !o)}
            className="mobile-hamburger"
            style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '6px 8px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'none', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect y="2" width="16" height="1.5" rx="1" fill="currentColor" />
              <rect y="7" width="16" height="1.5" rx="1" fill="currentColor" />
              <rect y="12" width="16" height="1.5" rx="1" fill="currentColor" />
            </svg>
          </button>
          <span style={{ color: GOLD, fontFamily: 'Cinzel, serif', fontSize: '14px', letterSpacing: '0.18em' }}>TRENDORRA</span>
          <span className="topbar-divider" style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
          <span className="topbar-label" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Seller Panel</span>
        </div>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '12px', textDecoration: 'none', padding: '6px 10px', border: `1px solid ${BORDER}`, borderRadius: '6px' }}
          onMouseOver={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}>
          <FiArrowLeft size={13} /> <span className="back-label">Back to Trendorra</span>
        </Link>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* ── Mobile hamburger visibility ── */
        @media (max-width: 768px) {
          .mobile-hamburger { display: flex !important; }
          .topbar-divider { display: none !important; }
          .topbar-label { display: none !important; }
          .back-label { display: none !important; }
        }

        /* ── Layout ── */
        @media (max-width: 768px) {
          .seller-layout { flex-direction: column !important; overflow-y: auto !important; }

          /* Sidebar becomes a slide-in drawer */
          .seller-sidebar {
            position: fixed !important;
            left: 0 !important; top: 52px !important;
            height: calc(100vh - 52px) !important;
            width: 240px !important;
            z-index: 999 !important;
            transform: translateX(-100%) !important;
            transition: transform 0.25s ease !important;
            border-right: 1px solid rgba(255,255,255,0.12) !important;
            border-bottom: none !important;
            overflow-y: auto !important;
          }
          .seller-sidebar.open { transform: translateX(0) !important; }

          .seller-content { padding: 14px !important; }

          /* Stats grids */
          .seller-stats-4 { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
          .seller-stats-3 { grid-template-columns: 1fr !important; gap: 8px !important; }
          .seller-analytics-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }

          /* Tables — horizontal scroll */
          .seller-table-wrap { overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }

          /* Profile grid */
          .seller-profile-grid { grid-template-columns: 1fr !important; }

          /* Delivery zones */
          .delivery-zones-grid { grid-template-columns: 1fr 1fr !important; }

          /* Commission table */
          .commission-wrap { max-width: 100% !important; }

          /* Header actions wrap */
          .page-header-inner { flex-wrap: wrap !important; gap: 8px !important; }
          .page-header-actions { display: flex !important; flex-wrap: wrap !important; gap: 6px !important; }

          /* Returns filter pills scroll */
          .returns-filter-bar { overflow-x: auto !important; padding-bottom: 4px !important; flex-wrap: nowrap !important; }

          /* Order status pills */
          .order-status-bar { overflow-x: auto !important; flex-wrap: nowrap !important; padding-bottom: 4px !important; }

          /* Quick action cards */
          .quick-actions-grid { grid-template-columns: 1fr !important; }
        }

        /* Modal responsive tweaks */
        @media (max-width: 600px) {
          .modal-meta-grid { grid-template-columns: 1fr 1fr !important; }
          .modal-two-col { grid-template-columns: 1fr !important; }
          .modal-earnings-grid { grid-template-columns: 1fr 1fr !important; }
          .modal-earnings-grid > div { border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.08) !important; }
        }

        /* Small phones */
        @media (max-width: 400px) {
          .seller-stats-4 { grid-template-columns: 1fr !important; }
          .delivery-zones-grid { grid-template-columns: 1fr !important; }
          .seller-analytics-grid { grid-template-columns: 1fr !important; }
        }

        /* Returns card — mobile card layout */
        @media (max-width: 768px) {
          .seller-returns-table thead { display: none !important; }
          .seller-returns-table tr {
            display: block !important;
            border: 1px solid rgba(255,255,255,0.08) !important;
            border-radius: 10px !important;
            margin-bottom: 10px !important;
            padding: 10px 0 !important;
            background: #111 !important;
          }
          .seller-returns-table td {
            display: block !important;
            border: none !important;
            padding: 4px 14px !important;
          }
        }

        /* Scrollbar for mobile tables */
        .seller-table-wrap::-webkit-scrollbar { height: 4px; }
        .seller-table-wrap::-webkit-scrollbar-track { background: #111; }
        .seller-table-wrap::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.3); border-radius: 2px; }
      `}</style>

      <div className="seller-layout" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Sidebar ── */}
        <div className={`seller-sidebar${mobileSidebarOpen ? ' open' : ''}`} style={{ width: '200px', flexShrink: 0, backgroundColor: '#0d0d0d', borderRight: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', position: 'sticky', top: '52px' }}>
          <div style={{ padding: '14px', borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: `${GOLD}25`, border: `1px solid ${GOLD}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: GOLD, fontSize: '14px', fontWeight: '700' }}>{u?.name?.charAt(0).toUpperCase()}</span>
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ color: '#fff', fontSize: '12px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 0 2px' }}>{u?.name}</p>
                <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '20px', color: u?.sellerInfo?.status === 'approved' ? '#4ade80' : '#fbbf24', backgroundColor: u?.sellerInfo?.status === 'approved' ? 'rgba(74,222,128,0.1)' : 'rgba(251,191,36,0.1)' }}>
                  {(u?.sellerInfo?.status || 'PENDING').toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          <nav style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
            {NAV.map(({ id, label, icon: Icon }) => {
              const pendingCount = id === 'returns' ? returns.filter(o => o.returnRequest?.status === 'Pending').length : 0;
              return (
                <button key={id} onClick={() => handleTabChange(id)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 10px', borderRadius: '6px', marginBottom: '3px', backgroundColor: activeTab === id ? `${GOLD}15` : 'transparent', border: `1px solid ${activeTab === id ? `${GOLD}30` : 'transparent'}`, color: activeTab === id ? GOLD : 'rgba(255,255,255,0.4)', fontSize: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '9px' }}><Icon size={14} /> {label}</span>
                  {id === 'returns' && (pendingCount > 0 || activeTab === 'returns') && (
                    <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '20px', backgroundColor: pendingCount > 0 ? 'rgba(251,191,36,0.2)' : 'transparent', color: pendingCount > 0 ? '#fbbf24' : 'transparent', fontWeight: '700' }}>
                      {pendingCount > 0 ? pendingCount : ''}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          <div style={{ padding: '10px', borderTop: `1px solid ${BORDER}` }}>
            <button onClick={() => { setEditOpen(true); setMobileSidebarOpen(false); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 10px', borderRadius: '6px', marginBottom: '4px', backgroundColor: `${GOLD}10`, border: `1px solid ${GOLD}25`, color: GOLD, fontSize: '12px', cursor: 'pointer' }}>
              <FiEdit2 size={13} /> Edit Profile
            </button>
            <button onClick={() => { logout(); navigate('/login'); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 10px', borderRadius: '6px', backgroundColor: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '12px', cursor: 'pointer' }}
              onMouseOver={e => e.currentTarget.style.color = '#f87171'}
              onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
              <FiLogOut size={13} /> Sign Out
            </button>
          </div>
        </div>

        {/* ── Main Content ── */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* Sticky header */}
          <div className="page-header-inner" style={{ padding: '12px 20px', borderBottom: `1px solid ${BORDER}`, backgroundColor: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '2px' }}>
                {NAV.find(n => n.id === activeTab)?.label}
              </p>
              <h2 style={{ color: '#fff', fontFamily: 'Cinzel, serif', fontSize: '14px', letterSpacing: '0.06em', margin: 0 }}>
                {activeTab === 'overview' ? `Welcome back, ${u?.name?.split(' ')[0]}` :
                  activeTab === 'products' ? 'My Products' :
                    activeTab === 'orders' ? 'My Orders' :
                      activeTab === 'returns' ? 'Return Requests' :
                        activeTab === 'tracking' ? 'Delivery & Tracking' :
                          activeTab === 'analytics' ? 'Analytics' :
                            activeTab === 'commission' ? 'Commission & Fees' : 'My Profile'}
              </h2>
            </div>
            <div className="page-header-actions" style={{ display: 'flex', gap: '8px' }}>
              {(activeTab === 'orders' || activeTab === 'overview') && (
                <button onClick={() => setShowResetOrders(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 10px', backgroundColor: 'transparent', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '5px', color: '#f87171', fontSize: '11px', cursor: 'pointer' }}>
                  <FiTrash2 size={11} /> <span className="back-label">Reset Orders</span>
                </button>
              )}
              {(activeTab === 'analytics' || activeTab === 'overview') && (
                <button onClick={() => setShowResetRevenue(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 10px', backgroundColor: 'transparent', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '5px', color: '#f87171', fontSize: '11px', cursor: 'pointer' }}>
                  <FiTrash2 size={11} /> <span className="back-label">Reset Revenue</span>
                </button>
              )}
              {activeTab === 'products' && (
                <Link to="/seller/products/new" style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: GOLD, border: 'none', borderRadius: '6px', padding: '8px 12px', color: '#000', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>
                  <FiPlus size={13} /> <span className="back-label">Add Product</span>
                </Link>
              )}
            </div>
          </div>

          <div className="seller-content" style={{ padding: '20px 24px', flex: 1 }}>

            {/* ══ OVERVIEW ══ */}
            {activeTab === 'overview' && (
              <>
                {u?.sellerInfo?.status !== 'approved' && (
                  <div style={{ backgroundColor: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '10px', padding: '14px 18px', marginBottom: '22px', display: 'flex', gap: '12px' }}>
                    <FiAlertCircle size={18} style={{ color: '#fbbf24', flexShrink: 0, marginTop: '1px' }} />
                    <div>
                      <p style={{ color: '#fbbf24', fontSize: '13px', fontWeight: '600', margin: '0 0 4px' }}>Account Pending Approval</p>
                      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', lineHeight: '1.6', margin: 0 }}>Your seller account is under review. Usually 24–48 hours.</p>
                    </div>
                  </div>
                )}
                {platformSettings.commissionRate === 0 && platformSettings.fixedCharge === 0 && (
                  <div style={{ backgroundColor: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '10px', padding: '10px 16px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px' }}>🎉</span>
                    <p style={{ color: '#4ade80', fontSize: '12px', margin: 0 }}>
                      <strong>Zero charges active!</strong> You keep 100% of product value. Platform is in startup mode.
                    </p>
                  </div>
                )}
                <div className="seller-stats-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '22px' }}>
                  {[
                    { label: 'Net Earnings', value: `₹${netEarnings.toLocaleString()}`, icon: FiDollarSign, color: '#4ade80', sub: 'After all deductions' },
                    { label: 'Total Orders', value: orders.length, icon: FiShoppingBag, color: '#60a5fa', sub: 'All time' },
                    { label: 'My Products', value: products.length, icon: FiPackage, color: GOLD, sub: 'Listed' },
                    { label: 'Pending', value: orders.filter(o => o.orderStatus === 'Processing').length, icon: FiAlertCircle, color: '#fbbf24', sub: 'Need action' },
                  ].map(({ label, value, icon: Icon, color, sub }) => (
                    <div key={label} style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '16px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}><Icon size={15} style={{ color }} /></div>
                      <p style={{ color: '#fff', fontSize: '20px', fontWeight: '700', margin: '0 0 2px' }}>{value}</p>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 1px' }}>{label}</p>
                      <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', margin: 0 }}>{sub}</p>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', backgroundColor: color, opacity: 0.4 }} />
                    </div>
                  ))}
                </div>
                <div className="quick-actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '22px' }}>
                  {[
                    { label: 'Add New Product', icon: FiPlus, id: 'products', color: GOLD },
                    { label: 'View Orders', icon: FiShoppingBag, id: 'orders', color: '#60a5fa' },
                    { label: 'Delivery Tracking', icon: FiTruck, id: 'tracking', color: '#4ade80' },
                  ].map(({ label, icon: Icon, id, color }) => (
                    <button key={id} onClick={() => handleTabChange(id)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', cursor: 'pointer', transition: 'border-color 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.borderColor = color}
                      onMouseOut={e => e.currentTarget.style.borderColor = BORDER}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '6px', backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={14} style={{ color }} /></div>
                        <span style={{ color: '#fff', fontSize: '13px', fontWeight: '500' }}>{label}</span>
                      </div>
                      <FiArrowRight size={14} style={{ color: 'rgba(255,255,255,0.2)' }} />
                    </button>
                  ))}
                </div>

                {/* Recent Orders */}
                <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ padding: '13px 18px', borderBottom: `1px solid ${BORDER}`, backgroundColor: '#0d0d0d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>Recent Orders</p>
                    <button onClick={() => handleTabChange('orders')} style={{ color: GOLD, fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer' }}>View All</button>
                  </div>
                  {orders.length === 0 ? (
                    <div style={{ padding: '36px', textAlign: 'center' }}>
                      <FiShoppingBag size={28} style={{ color: 'rgba(255,255,255,0.1)', display: 'block', margin: '0 auto 10px' }} />
                      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>No orders yet. Add products to start selling!</p>
                    </div>
                  ) : orders.slice(0, 5).map(order => {
                    const { earnings } = calcEarnings(order.totalPrice || 0, order.deliveryCharge || 0);
                    const s = sStyle(order.orderStatus);
                    return (
                      <div key={order._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: `1px solid ${BORDER}`, cursor: 'pointer' }}
                        onClick={() => setSelectedOrder(order)}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <div>
                          <p style={{ color: GOLD, fontSize: '12px', fontWeight: '500', margin: '0 0 2px', textDecoration: 'underline', textDecorationStyle: 'dotted' }}>#{order._id.slice(-8).toUpperCase()}</p>
                          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0 }}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ color: '#fff', fontSize: '12px', margin: '0 0 1px' }}>₹{(order.totalPrice || 0).toLocaleString()}</p>
                            <p style={{ color: '#4ade80', fontSize: '11px', margin: 0 }}>₹{earnings.toLocaleString()}</p>
                          </div>
                          <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '20px', color: s.color, backgroundColor: s.bg, whiteSpace: 'nowrap' }}>{order.orderStatus}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ══ PRODUCTS ══ */}
            {activeTab === 'products' && (
              <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
                {loading ? (
                  <div style={{ padding: '48px', textAlign: 'center' }}><p style={{ color: 'rgba(255,255,255,0.2)' }}>Loading…</p></div>
                ) : products.length === 0 ? (
                  <div style={{ padding: '48px', textAlign: 'center' }}>
                    <FiPackage size={36} style={{ color: 'rgba(255,255,255,0.1)', display: 'block', margin: '0 auto 14px' }} />
                    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '14px', marginBottom: '18px' }}>No products yet.</p>
                    <Link to="/seller/products/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', backgroundColor: GOLD, padding: '10px 22px', borderRadius: '6px', color: '#000', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}>
                      <FiPlus size={14} /> Add First Product
                    </Link>
                  </div>
                ) : (
                  <div className="seller-table-wrap">
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                      <thead><tr>
                        {['Product', 'Category', 'Price', 'Commission', 'Fixed Fee', 'You Earn', 'Stock', 'Actions'].map(h => (
                          <th key={h} style={thS}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {products.map(p => {
                          const { commission, fixed, earnings } = calcEarnings(p.price || 0, 0);
                          const imgSrc = p.images?.[0]?.url || p.images?.[0] || p.image;
                          return (
                            <tr key={p._id}
                              onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                              onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                              <td style={tdS}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <img src={imgSrc} alt="" style={{ width: '36px', height: '44px', objectFit: 'cover', borderRadius: '4px', backgroundColor: '#0d0d0d', flexShrink: 0 }} />
                                  <p style={{ color: '#fff', fontSize: '12px', fontWeight: '500', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{p.name}</p>
                                </div>
                              </td>
                              <td style={tdS}><span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px' }}>{p.category}</span></td>
                              <td style={tdS}><span style={{ color: '#fff', fontSize: '13px', fontWeight: '500' }}>₹{p.price?.toLocaleString()}</span></td>
                              <td style={tdS}><span style={{ color: commission > 0 ? '#f87171' : 'rgba(255,255,255,0.3)', fontSize: '12px' }}>{commission > 0 ? `-₹${commission}` : '₹0'}</span></td>
                              <td style={tdS}><span style={{ color: fixed > 0 ? '#fbbf24' : 'rgba(255,255,255,0.3)', fontSize: '12px' }}>{fixed > 0 ? `-₹${fixed}` : '₹0'}</span></td>
                              <td style={tdS}><span style={{ color: '#4ade80', fontSize: '13px', fontWeight: '700' }}>₹{earnings.toLocaleString()}</span></td>
                              <td style={tdS}><span style={{ color: p.stock > 0 ? '#4ade80' : '#f87171', fontSize: '11px' }}>{p.stock > 0 ? p.stock : 'Out'}</span></td>
                              <td style={tdS}>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  <Link to={`/seller/products/${p._id}/edit`} style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', textDecoration: 'none' }}><FiEdit2 size={11} /> Edit</Link>
                                  <button onClick={() => handleDeleteProduct(p._id)} style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer' }}><FiTrash2 size={11} /> Del</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ══ ORDERS ══ */}
            {activeTab === 'orders' && (
              <>
                <div className="order-status-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                  {ORDER_STATUSES.map(status => {
                    const count = orders.filter(o => o.orderStatus === status).length;
                    const s = sStyle(status);
                    return (
                      <div key={status} style={{ padding: '5px 12px', borderRadius: '20px', backgroundColor: s.bg, border: `1px solid ${s.color}30`, flexShrink: 0 }}>
                        <span style={{ color: s.color, fontSize: '11px', fontWeight: '500', whiteSpace: 'nowrap' }}>{status}: <strong>{count}</strong></span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
                  {orders.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center' }}>
                      <FiShoppingBag size={36} style={{ color: 'rgba(255,255,255,0.1)', display: 'block', margin: '0 auto 12px' }} />
                      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '14px' }}>No orders yet.</p>
                    </div>
                  ) : (
                    <div className="seller-table-wrap">
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                        <thead><tr>
                          {['Order ID', 'Date', 'Sale Price', '−Delivery', 'Product Val', '−Commission', '−Fixed', 'You Earn', 'Status', 'Action'].map(h => (
                            <th key={h} style={thS}>{h}</th>
                          ))}
                        </tr></thead>
                        <tbody>
                          {orders.map(order => {
                            const dc = order.deliveryCharge || order.shippingPrice || 0;
                            const { commission, fixed, productVal, earnings } = calcEarnings(order.totalPrice || 0, dc);
                            const s = sStyle(order.orderStatus);
                            const isProcessing = order.orderStatus === 'Processing';
                            const isConfirmed = order.orderStatus === 'Confirmed';
                            const canReady = isProcessing || isConfirmed;
                            return (
                              <tr key={order._id}
                                onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                <td style={tdS}>
                                  <button
                                    onClick={() => setSelectedOrder(order)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                    title="View order details"
                                  >
                                    <span style={{ color: GOLD, fontSize: '12px', fontWeight: '600', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px' }}>
                                      #{order._id.slice(-8).toUpperCase()}
                                    </span>
                                  </button>
                                </td>
                                <td style={tdS}><span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span></td>
                                <td style={tdS}><span style={{ color: '#fff', fontSize: '13px', fontWeight: '600' }}>₹{(order.totalPrice || 0).toLocaleString()}</span></td>
                                <td style={tdS}><span style={{ color: '#60a5fa', fontSize: '11px' }}>−₹{dc}</span></td>
                                <td style={tdS}><span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px' }}>₹{productVal.toLocaleString()}</span></td>
                                <td style={tdS}><span style={{ color: commission > 0 ? '#f87171' : 'rgba(255,255,255,0.3)', fontSize: '12px' }}>{commission > 0 ? `−₹${commission}` : '₹0'}</span></td>
                                <td style={tdS}><span style={{ color: fixed > 0 ? '#fbbf24' : 'rgba(255,255,255,0.3)', fontSize: '12px' }}>{fixed > 0 ? `−₹${fixed}` : '₹0'}</span></td>
                                <td style={tdS}><span style={{ color: order.orderStatus === 'Cancelled' ? '#f87171' : '#4ade80', fontSize: '13px', fontWeight: '700' }}>{order.orderStatus === 'Cancelled' ? '—' : `₹${earnings.toLocaleString()}`}</span></td>
                                <td style={tdS}><span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '20px', color: s.color, backgroundColor: s.bg, whiteSpace: 'nowrap' }}>{order.orderStatus}</span></td>
                                <td style={tdS}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    {isProcessing && (
                                      <button onClick={() => handleConfirmOrder(order._id)} disabled={confirmingOrder === order._id}
                                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', backgroundColor: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: '5px', color: '#60a5fa', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                        {confirmingOrder === order._id ? <FiRefreshCw size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <FiCheckCircle size={10} />}
                                        {confirmingOrder === order._id ? '…' : 'Confirm'}
                                      </button>
                                    )}
                                    {canReady && (
                                      <button onClick={() => handleMarkReady(order._id)} disabled={markingReady === order._id}
                                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', backgroundColor: `${GOLD}18`, border: `1px solid ${GOLD}35`, borderRadius: '5px', color: GOLD, fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                        {markingReady === order._id ? <FiRefreshCw size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <FiTruck size={10} />}
                                        {markingReady === order._id ? '…' : 'Ready'}
                                      </button>
                                    )}
                                    {order.trackingId && !['Delivered', 'Cancelled'].includes(order.orderStatus) && (
                                      <button onClick={() => handleSimulate(order._id)} disabled={simulatingOrder === order._id}
                                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', backgroundColor: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '5px', color: '#a78bfa', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                        {simulatingOrder === order._id ? <FiRefreshCw size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <FiPlay size={10} />}
                                        Simulate
                                      </button>
                                    )}
                                    {!['Cancelled'].includes(order.orderStatus) && (
                                      <button
                                        onClick={() => window.open(`http://localhost:5000/api/delivery/label/${order._id}`, '_blank')}
                                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', backgroundColor: 'rgba(74,222,128,0.10)', border: '1px solid rgba(74,222,128,0.30)', borderRadius: '5px', color: '#4ade80', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                        <FiFileText size={10} /> Bill
                                      </button>
                                    )}
                                    {!canReady && !order.trackingId && <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '11px' }}>—</span>}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ══ RETURNS ══ */}
            {activeTab === 'returns' && (
              <>
                <div className="returns-filter-bar" style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  {[
                    { key: '', label: `All (${returns.length})`, color: GOLD },
                    { key: 'Pending', label: `Pending (${returns.filter(o => o.returnRequest?.status === 'Pending').length})`, color: '#fbbf24' },
                    { key: 'Approved', label: `Approved (${returns.filter(o => o.returnRequest?.status === 'Approved').length})`, color: '#4ade80' },
                    { key: 'Rejected', label: `Rejected (${returns.filter(o => o.returnRequest?.status === 'Rejected').length})`, color: '#f87171' },
                  ].map(tab => (
                    <button key={tab.key} onClick={() => setReturnFilter(tab.key)}
                      style={{ padding: '7px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: returnFilter === tab.key ? '700' : '400', cursor: 'pointer', transition: 'all 0.15s', backgroundColor: returnFilter === tab.key ? tab.color : 'transparent', color: returnFilter === tab.key ? '#000' : 'rgba(255,255,255,0.45)', border: `1px solid ${returnFilter === tab.key ? tab.color : BORDER}`, flexShrink: 0 }}>
                      {tab.label}
                    </button>
                  ))}
                  <button onClick={loadReturns} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 13px', backgroundColor: 'transparent', border: `1px solid ${BORDER}`, borderRadius: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '12px', cursor: 'pointer', flexShrink: 0 }}>
                    <FiRefreshCw size={12} /> Refresh
                  </button>
                </div>

                <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
                  {returnsLoading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>Loading returns...</div>
                  ) : returns.length === 0 ? (
                    <div style={{ padding: '64px', textAlign: 'center' }}>
                      <FiRotateCcw size={36} style={{ color: 'rgba(255,255,255,0.08)', display: 'block', margin: '0 auto 14px' }} />
                      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '14px' }}>No return requests{returnFilter ? ` with status "${returnFilter}"` : ''}.</p>
                    </div>
                  ) : (
                    <div className="seller-table-wrap">
                      <table className="seller-returns-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                        <thead>
                          <tr>
                            {['Order', 'Customer', 'Reason', 'Evidence', 'Requested', 'Status', 'Actions'].map(h => (
                              <th key={h} style={thS}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {returns.map(order => {
                            const rr = order.returnRequest;
                            const isPending = rr?.status === 'Pending';
                            const isApproved = rr?.status === 'Approved';
                            const orderId = order._id.slice(-8).toUpperCase();
                            const statusColor = { Pending: '#fbbf24', Approved: '#4ade80', Rejected: '#f87171' }[rr?.status] || 'rgba(255,255,255,0.4)';
                            const statusBg = { Pending: 'rgba(251,191,36,0.1)', Approved: 'rgba(74,222,128,0.1)', Rejected: 'rgba(248,113,113,0.1)' }[rr?.status] || 'rgba(255,255,255,0.05)';
                            return (
                              <tr key={order._id}
                                onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                <td style={tdS}>
                                  <p style={{ color: GOLD, fontSize: '12px', fontWeight: '600', margin: '0 0 2px' }}>#{orderId}</p>
                                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0 }}>₹{order.totalPrice?.toLocaleString('en-IN')}</p>
                                </td>
                                <td style={tdS}>
                                  <p style={{ color: '#fff', fontSize: '12px', margin: '0 0 2px' }}>{order.user?.name || '—'}</p>
                                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0 }}>{order.user?.email || '—'}</p>
                                </td>
                                <td style={tdS}>
                                  <p style={{ color: '#fff', fontSize: '12px', margin: '0 0 3px' }}>{rr?.reasonLabel || rr?.reason || '—'}</p>
                                  {rr?.note && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rr.note}</p>}
                                  {rr?.upiId && <p style={{ color: GOLD, fontSize: '11px', margin: '3px 0 0', fontWeight: '500' }}>UPI: {rr.upiId}</p>}
                                </td>
                                <td style={tdS}>
                                  {rr?.images?.length > 0 ? (
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                      {rr.images.map((img, i) => (
                                        <img key={i} src={img.url} alt="" onClick={() => setReturnImgView(img.url)}
                                          style={{ width: '32px', height: '40px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: `1px solid ${BORDER}`, transition: 'transform 0.15s' }}
                                          title="Click to view full size"
                                          onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.15)'; e.currentTarget.style.zIndex = '5'; }}
                                          onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.zIndex = '1'; }}
                                        />
                                      ))}
                                    </div>
                                  ) : (
                                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <FiImage size={11} /> None
                                    </span>
                                  )}
                                </td>
                                <td style={tdS}>
                                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
                                    {rr?.requestedAt ? new Date(rr.requestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                  </span>
                                </td>
                                <td style={tdS}>
                                  <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '20px', color: statusColor, backgroundColor: statusBg, border: `1px solid ${statusColor}40`, fontWeight: '600' }}>
                                    {rr?.status || '—'}
                                  </span>
                                  {isApproved && rr?.reverseAwb && (
                                    <p style={{ color: '#60a5fa', fontSize: '10px', margin: '4px 0 0' }}>AWB: {rr.reverseAwb}</p>
                                  )}
                                </td>
                                <td style={tdS}>
                                  {isPending ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                      <button onClick={() => setReturnActModal({ open: true, order, action: 'approve' })}
                                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', backgroundColor: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '6px', color: '#4ade80', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                        <FiCheck size={10} /> Approve
                                      </button>
                                      <button onClick={() => setReturnActModal({ open: true, order, action: 'reject' })}
                                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', backgroundColor: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '6px', color: '#f87171', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                        <FiX size={10} /> Reject
                                      </button>
                                    </div>
                                  ) : isApproved ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                      <span style={{ color: '#4ade80', fontSize: '11px', fontWeight: '600' }}>✓ Approved</span>
                                      {!rr?.reversePickupScheduled ? (
                                        <button onClick={() => handleReversePickup(order._id)} disabled={reversingPickup === order._id}
                                          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', backgroundColor: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: '6px', color: '#60a5fa', fontSize: '11px', fontWeight: '600', cursor: reversingPickup === order._id ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                                          {reversingPickup === order._id ? <FiRefreshCw size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <FiTruck size={10} />}
                                          {reversingPickup === order._id ? '...' : 'Schedule Pickup'}
                                        </button>
                                      ) : (
                                        <span style={{ color: '#60a5fa', fontSize: '10px' }}>🔄 Pickup Scheduled</span>
                                      )}
                                    </div>
                                  ) : (
                                    <span style={{ color: '#f87171', fontSize: '11px' }}>✕ Rejected</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ══ DELIVERY ══ */}
            {activeTab === 'tracking' && (
              <div style={{ maxWidth: '700px' }}>
                <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
                  <div style={{ padding: '13px 18px', borderBottom: `1px solid ${BORDER}`, backgroundColor: '#0d0d0d' }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>Active Shipments</p>
                  </div>
                  {orders.filter(o => o.trackingId && !['Delivered', 'Cancelled'].includes(o.orderStatus)).length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center' }}>
                      <FiTruck size={28} style={{ color: 'rgba(255,255,255,0.1)', display: 'block', margin: '0 auto 10px' }} />
                      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>No active shipments. Mark orders "Ready for Pickup" to start.</p>
                    </div>
                  ) : orders.filter(o => o.trackingId && !['Delivered', 'Cancelled'].includes(o.orderStatus)).map(order => {
                    const s = sStyle(order.orderStatus);
                    return (
                      <div key={order._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid ${BORDER}`, cursor: 'pointer' }}
                        onClick={() => setSelectedOrder(order)}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <div>
                          <p style={{ color: GOLD, fontSize: '13px', fontWeight: '500', margin: '0 0 3px', textDecoration: 'underline', textDecorationStyle: 'dotted' }}>#{order._id.slice(-8).toUpperCase()}</p>
                          <p style={{ color: '#60a5fa', fontSize: '11px', margin: 0 }}>Tracking: {order.trackingId}</p>
                        </div>
                        <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', color: s.color, backgroundColor: s.bg }}>{order.orderStatus}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
                  <div style={{ padding: '13px 18px', borderBottom: `1px solid ${BORDER}`, backgroundColor: '#0d0d0d' }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>Delivery Zone Charges</p>
                  </div>
                  <div style={{ padding: '16px' }}>
                    <div className="delivery-zones-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px' }}>
                      {DELIVERY_ZONES.map(({ zone, label, charge, icon, days }) => (
                        <div key={zone} style={{ backgroundColor: '#0d0d0d', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '18px' }}>{icon}</span>
                            <p style={{ color: GOLD, fontSize: '11px', fontWeight: '600', margin: 0 }}>{zone} — {label}</p>
                          </div>
                          <p style={{ color: '#4ade80', fontSize: '20px', fontWeight: '700', margin: '0 0 2px' }}>₹{charge}</p>
                          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', margin: 0 }}>{days}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══ ANALYTICS ══ */}
            {activeTab === 'analytics' && (
              <>
                <div className="seller-analytics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '20px' }}>
                  {[
                    { label: 'Gross Revenue', value: `₹${grossRevenue.toLocaleString()}`, color: '#fff', icon: FiDollarSign },
                    { label: 'Net Earnings', value: `₹${netEarnings.toLocaleString()}`, color: '#4ade80', icon: FiTrendingUp },
                    { label: 'Total Orders', value: orders.length, color: '#60a5fa', icon: FiShoppingBag },
                    { label: 'Delivered', value: orders.filter(o => o.orderStatus === 'Delivered').length, color: '#4ade80', icon: FiCheck },
                    { label: 'Commission Paid', value: `₹${totalCommission.toLocaleString()}`, color: '#f87171', icon: FiPercent },
                    { label: 'Fixed Fees Paid', value: `₹${totalFixed.toLocaleString()}`, color: '#fbbf24', icon: FiAlertCircle },
                  ].map(({ label, value, color, icon: Icon }) => (
                    <div key={label} style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={16} style={{ color }} />
                      </div>
                      <div>
                        <p style={{ color: '#fff', fontSize: '18px', fontWeight: '700', margin: '0 0 3px' }}>{value}</p>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{label}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '20px' }}>
                  <p style={{ color: GOLD, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 16px' }}>Revenue Breakdown</p>
                  {[
                    { label: 'Gross Revenue (Total Paid by Customers)', value: `₹${grossRevenue.toLocaleString()}`, color: '#fff' },
                    { label: '– Delivery Charges (Goes to Courier)', value: `₹${totalDelivery.toLocaleString()}`, color: '#60a5fa' },
                    { label: '= Product Value (Commission Base)', value: `₹${(grossRevenue - totalDelivery).toLocaleString()}`, color: 'rgba(255,255,255,0.5)' },
                    { label: `– Commission ${platformSettings.commissionRate}%`, value: `₹${totalCommission.toLocaleString()}`, color: totalCommission > 0 ? '#f87171' : 'rgba(255,255,255,0.3)' },
                    { label: `– Fixed Fees (tiered slabs)`, value: `₹${totalFixed.toLocaleString()}`, color: totalFixed > 0 ? '#fbbf24' : 'rgba(255,255,255,0.3)' },
                    { label: '= Your Net Earnings', value: `₹${netEarnings.toLocaleString()}`, color: '#4ade80', bold: true },
                  ].map(({ label, value, color, bold }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${BORDER}`, gap: '12px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', flex: 1 }}>{label}</span>
                      <span style={{ color, fontSize: bold ? '15px' : '13px', fontWeight: bold ? '700' : '500', flexShrink: 0 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ══ COMMISSION ══ */}
            {activeTab === 'commission' && (
              <div className="commission-wrap" style={{ maxWidth: '700px' }}>
                <CommissionCalc commissionRate={platformSettings.commissionRate} fixedSlabs={platformSettings.fixedSlabs} />
                <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
                  <div style={{ padding: '13px 18px', borderBottom: `1px solid ${BORDER}`, backgroundColor: '#0d0d0d' }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>Fixed Fee Slabs (set by platform)</p>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>
                      {['Price Slab', 'Fixed Fee'].map(h => <th key={h} style={thS}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {(platformSettings.fixedSlabs?.length ? platformSettings.fixedSlabs : [
                        { label: 'Up to ₹500', fee: 0 }, { label: '₹501–₹1,000', fee: 0 },
                        { label: '₹1,001–₹5,000', fee: 0 }, { label: '₹5,001–₹10,000', fee: 0 },
                        { label: '₹10,001–₹20,000', fee: 0 }, { label: 'Above ₹20,000', fee: 0 },
                      ]).map((slab, i) => (
                        <tr key={i}
                          onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                          onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <td style={tdS}><span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>{slab.label}</span></td>
                          <td style={tdS}>
                            <span style={{ color: Number(slab.fee) > 0 ? '#fbbf24' : '#4ade80', fontSize: '13px', fontWeight: '600' }}>
                              {Number(slab.fee) > 0 ? `₹${slab.fee}` : 'Free'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ padding: '13px 18px', borderBottom: `1px solid ${BORDER}`, backgroundColor: '#0d0d0d' }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>Example Earnings Table</p>
                  </div>
                  <div className="seller-table-wrap">
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
                      <thead><tr>
                        {['Sale Price', 'Commission', 'Fixed Fee (Slab)', 'You Earn'].map(h => <th key={h} style={thS}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {[500, 1000, 2000, 5000, 10000, 50000].map(price => {
                          const { commission, fixed, earnings } = calcEarnings(price, 0);
                          return (
                            <tr key={price}
                              onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                              onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                              <td style={tdS}><span style={{ color: '#fff', fontWeight: '500' }}>₹{price.toLocaleString()}</span></td>
                              <td style={tdS}><span style={{ color: commission > 0 ? '#f87171' : 'rgba(255,255,255,0.3)' }}>{commission > 0 ? `₹${commission}` : '₹0'}</span></td>
                              <td style={tdS}><span style={{ color: fixed > 0 ? '#fbbf24' : 'rgba(255,255,255,0.3)' }}>{fixed > 0 ? `₹${fixed}` : '₹0'}</span></td>
                              <td style={tdS}><span style={{ color: '#4ade80', fontWeight: '700' }}>₹{earnings.toLocaleString()}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ══ PROFILE ══ */}
            {activeTab === 'profile' && (
              <div style={{ maxWidth: '580px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
                  <button onClick={() => setEditOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '7px', backgroundColor: GOLD, border: 'none', borderRadius: '6px', padding: '9px 16px', color: '#000', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                    <FiEdit2 size={13} /> Edit Profile
                  </button>
                </div>
                {[
                  { title: 'Account', rows: [{ label: 'Name', value: u?.name }, { label: 'Email', value: u?.email }, { label: 'Phone', value: u?.phone || '—' }, { label: 'Status', value: u?.sellerInfo?.status || 'pending', highlight: true }] },
                  { title: 'Business', rows: [{ label: 'Business Name', value: u?.sellerInfo?.businessName || '—', highlight: true }, { label: 'GSTIN', value: u?.sellerInfo?.gstin || 'Not provided' }] },
                  { title: 'Pickup Address', rows: [{ label: 'Street', value: u?.sellerInfo?.address?.line || '—' }, { label: 'City', value: u?.sellerInfo?.address?.city || '—' }, { label: 'State', value: u?.sellerInfo?.address?.state || '—' }, { label: 'Pincode', value: u?.sellerInfo?.address?.pincode || '—' }] },
                  { title: 'Bank Account', rows: [{ label: 'Account Holder', value: u?.sellerInfo?.bank?.name || '—' }, { label: 'Bank', value: u?.sellerInfo?.bank?.bankName || '—' }, { label: 'Account No.', value: u?.sellerInfo?.bank?.account ? `****${u.sellerInfo.bank.account.slice(-4)}` : '—' }, { label: 'IFSC', value: u?.sellerInfo?.bank?.ifsc || '—', highlight: true }] },
                ].map(({ title, rows }) => (
                  <div key={title} style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '20px', marginBottom: '12px' }}>
                    <p style={{ color: GOLD, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 12px', fontWeight: '600' }}>{title}</p>
                    {rows.map(({ label, value, highlight }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${BORDER}`, gap: '12px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', flexShrink: 0 }}>{label}</span>
                        <span style={{ color: highlight ? GOLD : '#fff', fontSize: '13px', fontWeight: highlight ? '600' : '400', textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
                      </div>
                    ))}
                  </div>
                ))}
                {u?.sellerInfo?.noReturnsApproved && (
                  <NoReturnsToggle
                    enabled={u.sellerInfo.noReturnsEnabled}
                    onToggle={async (val) => {
                      try {
                        const { sellerAPI } = await import('../../services/api');
                        await sellerAPI.toggleNoReturns(val);
                        toast.success(val ? '🔴 No-returns policy enabled' : '✅ Standard returns restored');
                        loadData();
                        const { authAPI } = await import('../../services/api');
                        const me = await authAPI.getMe();
                        setCurrentUser(me.user);
                      } catch (e) { toast.error(e?.message || 'Failed to update'); }
                    }}
                  />
                )}
                {u?.sellerInfo?.payoutHistory?.length > 0 && (
                  <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '20px' }}>
                    <p style={{ color: GOLD, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 12px', fontWeight: '600' }}>Payout History</p>
                    {u.sellerInfo.payoutHistory.map((p, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${BORDER}` }}>
                        <div>
                          <p style={{ color: '#4ade80', fontSize: '15px', fontWeight: '600', margin: '0 0 2px' }}>₹{Number(p.amount).toLocaleString()}</p>
                          {p.note && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0 }}>{p.note}</p>}
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: 0 }}>{new Date(p.processedAt).toLocaleDateString('en-IN')}</p>
                      </div>
                    ))}
                    <div style={{ marginTop: '12px', padding: '12px 14px', backgroundColor: `${GOLD}08`, border: `1px solid ${GOLD}20`, borderRadius: '8px' }}>
                      <p style={{ color: GOLD, fontSize: '13px', fontWeight: '600', margin: 0 }}>Total Received: ₹{(u.sellerInfo.totalPaidOut || 0).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          <SellerFooter onOpenLegal={setLegalDoc} />
        </div>
      </div>

      {/* Return Image Lightbox */}
      {returnImgView && (
        <div onClick={() => setReturnImgView(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <img src={returnImgView} alt="Return evidence"
            style={{ maxWidth: '88vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: '10px', boxShadow: '0 8px 60px rgba(0,0,0,0.8)' }} />
          <button onClick={() => setReturnImgView(null)}
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '42px', height: '42px', color: '#fff', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ✕
          </button>
          <p style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.4)', fontSize: '12px', whiteSpace: 'nowrap' }}>Click anywhere to close</p>
        </div>
      )}
    </div>
  );
}