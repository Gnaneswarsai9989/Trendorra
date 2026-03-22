import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userAPI, orderAPI, deliveryAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiShoppingBag, FiDollarSign, FiCheck, FiX,
  FiRefreshCw, FiEye, FiCopy, FiTrendingUp, FiPlay, FiLock,
  FiTrash2, FiAlertTriangle, FiClock, FiPackage, FiTruck,
} from 'react-icons/fi';

const BG     = '#0a0a0a';
const CARD   = '#1a1a1a';
const BORDER = 'rgba(255,255,255,0.08)';
const GOLD   = '#C9A84C';

// ── Commission ────────────────────────────────────────────────────
const COMMISSION_RATE = 0.10;
const FIXED_FEE = (p) => {
  if (p <= 500)    return 20;
  if (p <= 1000)   return 30;
  if (p <= 5000)   return 40;
  if (p <= 10000)  return 80;
  if (p <= 50000)  return 120;
  if (p <= 100000) return 150;
  return 200;
};
const calcEarnings = (price, deliveryCharge = 0) => {
  const p          = Number(price) || 0;
  const dc         = Number(deliveryCharge) || 0;
  const productVal = p - dc; // product value only (exclude delivery from commission base)
  const commission = Math.round(productVal * COMMISSION_RATE);
  const fixed      = FIXED_FEE(productVal);
  return {
    commission,
    fixed,
    deliveryCharge: dc,
    earnings: Math.max(0, productVal - commission - fixed),
  };
};

const PAYOUT_LOCK_DAYS = 7; // days after delivery before payout is unlocked

const sellerStatusStyle = {
  pending:   { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
  approved:  { color: '#4ade80', bg: 'rgba(74,222,128,0.12)'  },
  suspended: { color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
};
const orderStatusStyle = (s) => ({
  Processing:         { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
  Confirmed:          { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  Shipped:            { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  'Out for Delivery': { color: '#fb923c', bg: 'rgba(251,146,60,0.12)'  },
  Delivered:          { color: '#4ade80', bg: 'rgba(74,222,128,0.12)'  },
  Cancelled:          { color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
}[s] || { color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.05)' });

const thStyle = {
  color: 'rgba(255,255,255,0.35)', fontSize: '10px', letterSpacing: '0.12em',
  textTransform: 'uppercase', padding: '10px 13px', textAlign: 'left',
  borderBottom: `1px solid ${BORDER}`, backgroundColor: '#050505', whiteSpace: 'nowrap',
};
const tdStyle = { padding: '10px 13px', borderBottom: `1px solid ${BORDER}`, verticalAlign: 'middle' };

// ── Helper: days since date ────────────────────────────────────────
const daysSince = (date) => date ? Math.floor((Date.now() - new Date(date)) / (1000*60*60*24)) : null;

// ── Copy Button ───────────────────────────────────────────────────
function CopyBtn({ value, label }) {
  return (
    <button onClick={() => { navigator.clipboard.writeText(value); toast.success(`${label} copied!`); }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '2px', marginLeft: '4px' }}
      onMouseOver={e => e.currentTarget.style.color = GOLD}
      onMouseOut={e  => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
      <FiCopy size={11} />
    </button>
  );
}

function InfoRow({ label, value, highlight, copy }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${BORDER}` }}>
      <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', flexShrink: 0, marginRight: '10px' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ color: highlight ? GOLD : '#fff', fontSize: '13px', fontWeight: highlight ? '600' : '400', wordBreak: 'break-all' }}>{value || '—'}</span>
        {copy && value && <CopyBtn value={value} label={label} />}
      </div>
    </div>
  );
}

// ── Mini stat tile ─────────────────────────────────────────────────
function Tile({ label, value, color, sub }) {
  return (
    <div style={{ backgroundColor: '#0d0d0d', borderRadius: '8px', padding: '12px 14px', border: `1px solid ${color}22` }}>
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>{label}</p>
      <p style={{ color, fontSize: '17px', fontWeight: '700', margin: 0 }}>{value}</p>
      {sub && <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', margin: '2px 0 0' }}>{sub}</p>}
    </div>
  );
}

// ── Danger Modal (reusable) ───────────────────────────────────────
function DangerModal({ open, onClose, onConfirm, loading, title, subtitle, lines, confirmWord = 'DELETE', accentColor = '#f87171' }) {
  const [typed, setTyped] = useState('');
  useEffect(() => { if (!open) setTyped(''); }, [open]);
  if (!open) return null;
  const ready = typed === confirmWord && !loading;
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 10001, backgroundColor: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ backgroundColor: '#1a1a1a', border: `1px solid ${accentColor}44`, borderRadius: '14px', padding: '28px', maxWidth: '440px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: `${accentColor}15`, border: `1px solid ${accentColor}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FiAlertTriangle size={20} style={{ color: accentColor }} />
          </div>
          <div>
            <p style={{ color: accentColor, fontFamily: 'Cinzel, serif', fontSize: '14px', letterSpacing: '0.1em', margin: '0 0 2px' }}>{title}</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0 }}>{subtitle}</p>
          </div>
        </div>
        <div style={{ backgroundColor: `${accentColor}0a`, border: `1px solid ${accentColor}22`, borderRadius: '8px', padding: '14px', marginBottom: '18px' }}>
          {lines.map((l, i) => <p key={i} style={{ color: i === 0 ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.4)', fontSize: i === 0 ? '13px' : '12px', lineHeight: '1.7', marginTop: i > 0 ? '7px' : 0 }}>{l}</p>)}
          <p style={{ color: accentColor, fontSize: '11px', fontWeight: '600', marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${accentColor}20` }}>
            🚫 This action cannot be undone.
          </p>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', marginBottom: '7px' }}>
          Type <strong style={{ color: accentColor }}>{confirmWord}</strong> to confirm
        </p>
        <input autoFocus type="text" value={typed} onChange={e => setTyped(e.target.value)}
          placeholder={`Type ${confirmWord} here…`}
          style={{ width: '100%', backgroundColor: '#0d0d0d', border: `1px solid ${typed === confirmWord ? accentColor : 'rgba(255,255,255,0.1)'}`, borderRadius: '6px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box', marginBottom: '16px' }} />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => ready && onConfirm()} disabled={!ready}
            style={{ flex: 1, padding: '10px', backgroundColor: ready ? accentColor : `${accentColor}15`, border: `1px solid ${ready ? accentColor : `${accentColor}22`}`, borderRadius: '6px', color: ready ? '#fff' : `${accentColor}44`, fontSize: '13px', fontWeight: '700', cursor: ready ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            {loading ? <><FiRefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</> : <><FiTrash2 size={12} /> Confirm</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Payout Timeline bar ────────────────────────────────────────────
function PayoutTimeline({ order }) {
  const deliveredAt = order.deliveredAt;
  if (!deliveredAt) return null;
  const days    = daysSince(deliveredAt);
  const locked  = days < PAYOUT_LOCK_DAYS;
  const pct     = Math.min(100, Math.round((days / PAYOUT_LOCK_DAYS) * 100));
  const daysLeft = Math.max(0, PAYOUT_LOCK_DAYS - days);

  return (
    <div style={{ marginTop: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ color: locked ? '#fbbf24' : '#4ade80', fontSize: '10px', fontWeight: '600' }}>
          {locked ? `🔒 Unlocks in ${daysLeft}d` : '🔓 Payout Ready'}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px' }}>{days}d ago</span>
      </div>
      <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: locked ? '#fbbf24' : '#4ade80', borderRadius: '2px', transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

// ── Seller Detail Modal ───────────────────────────────────────────
function SellerModal({ seller, orders, onClose, onStatusChange, onPayout, onSimulate, simulating, onResetPayout, deliveryMode }) {
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting,      setResetting]      = useState(false);

  const now = Date.now();

  // Per order calculations including delivery charge
  const enriched = orders.map(o => {
    const dc      = o.deliveryCharge || o.shippingPrice || 0;
    const calc    = calcEarnings(o.totalPrice || 0, dc);
    const isDelivered = o.orderStatus === 'Delivered';
    const daysAfterDelivery = o.deliveredAt ? daysSince(o.deliveredAt) : null;
    const payoutUnlocked = isDelivered && daysAfterDelivery !== null && daysAfterDelivery >= PAYOUT_LOCK_DAYS;
    return { ...o, calc, isDelivered, daysAfterDelivery, payoutUnlocked };
  });

  const validOrders     = enriched.filter(o => o.orderStatus !== 'Cancelled');
  const deliveredOrders = enriched.filter(o => o.isDelivered);
  const unlockedOrders  = enriched.filter(o => o.payoutUnlocked);

  const grossRevenue      = validOrders.reduce((s, o) => s + (o.totalPrice || 0), 0);
  const totalDelivery     = validOrders.reduce((s, o) => s + o.calc.deliveryCharge, 0);
  const totalCommission   = validOrders.reduce((s, o) => s + o.calc.commission, 0);
  const totalFixed        = validOrders.reduce((s, o) => s + o.calc.fixed, 0);
  const totalEarnings     = validOrders.reduce((s, o) => s + o.calc.earnings, 0);
  const deliveredEarnings = deliveredOrders.reduce((s, o) => s + o.calc.earnings, 0);
  const unlockedEarnings  = unlockedOrders.reduce((s, o) => s + o.calc.earnings, 0);
  const totalPaidOut      = seller.sellerInfo?.totalPaidOut || 0;
  const pendingPayout     = Math.max(0, unlockedEarnings - totalPaidOut);
  const lockedAmount      = Math.max(0, deliveredEarnings - unlockedEarnings);
  const canPayout         = pendingPayout > 0;

  const handleResetPayout = async () => {
    setResetting(true);
    try {
      await onResetPayout(seller._id);
      setShowResetModal(false);
    } finally { setResetting(false); }
  };

  return (
    <>
      {showResetModal && (
        <DangerModal
          open={showResetModal}
          onClose={() => setShowResetModal(false)}
          onConfirm={handleResetPayout}
          loading={resetting}
          title="Reset Payout History"
          subtitle={`${seller.sellerInfo?.businessName || seller.name}`}
          accentColor="#f87171"
          lines={[
            `This will clear all payout history for ${seller.name} and reset their total paid amount to ₹0.`,
            'All previous payout records will be permanently deleted.',
          ]}
        />
      )}

      <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div style={{ backgroundColor: '#141414', border: `1px solid rgba(201,168,76,0.2)`, borderRadius: '16px', padding: '28px', maxWidth: '780px', width: '100%', maxHeight: '92vh', overflowY: 'auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: `${GOLD}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: GOLD, fontWeight: '700', fontSize: '16px' }}>{seller.name?.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ color: GOLD, fontFamily: 'Cinzel, serif', fontSize: '16px', letterSpacing: '0.1em', margin: 0 }}>
                    {seller.sellerInfo?.businessName || seller.name}
                  </h3>
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', color: sellerStatusStyle[seller.sellerInfo?.status || 'pending'].color, backgroundColor: sellerStatusStyle[seller.sellerInfo?.status || 'pending'].bg }}>
                    {seller.sellerInfo?.status || 'pending'}
                  </span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '2px 0 0' }}>{seller.email} · {seller.phone || 'No phone'}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={() => setShowResetModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', backgroundColor: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '6px', color: '#f87171', fontSize: '11px', cursor: 'pointer' }}>
                <FiTrash2 size={11} /> Reset Payout
              </button>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '22px', lineHeight: 1 }}>×</button>
            </div>
          </div>

          {/* ── Revenue Summary ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '16px' }}>
            <Tile label="Gross Revenue"    value={`₹${grossRevenue.toLocaleString()}`}     color="#fff"     sub={`${validOrders.length} orders`} />
            <Tile label="Delivery Charges" value={`₹${totalDelivery.toLocaleString()}`}    color="#60a5fa"  sub="Collected from customer" />
            <Tile label="Commission (10%)" value={`−₹${totalCommission.toLocaleString()}`} color="#f87171"  sub="Platform fee" />
            <Tile label="Fixed Fees"       value={`−₹${totalFixed.toLocaleString()}`}      color="#fbbf24"  sub="Per-order fee" />
          </div>

          {/* ── Payout Status Section ── */}
          <div style={{ backgroundColor: `${GOLD}08`, border: `1px solid ${GOLD}25`, borderRadius: '12px', padding: '18px', marginBottom: '18px' }}>
            <p style={{ color: GOLD, fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 14px', fontWeight: '600' }}>
              Payout Status — {PAYOUT_LOCK_DAYS}-Day Lock Policy
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '14px' }}>
              <Tile label="Total Net Earnings"  value={`₹${totalEarnings.toLocaleString()}`}    color="#4ade80" sub="All valid orders" />
              <Tile label={`🔓 Unlocked (${PAYOUT_LOCK_DAYS}d+)`} value={`₹${unlockedEarnings.toLocaleString()}`} color="#4ade80" sub={`${unlockedOrders.length} orders`} />
              <Tile label="🔒 Locked (<7d)"    value={`₹${lockedAmount.toLocaleString()}`}     color="#fbbf24" sub="Awaiting 7-day period" />
              <Tile label="Already Paid Out"    value={`₹${totalPaidOut.toLocaleString()}`}     color="#60a5fa" sub="Transferred" />
            </div>

            {/* Pending payout box */}
            <div style={{ backgroundColor: canPayout ? `${GOLD}12` : 'rgba(255,255,255,0.04)', border: `1px solid ${canPayout ? `${GOLD}35` : BORDER}`, borderRadius: '8px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 3px' }}>
                  {canPayout ? '⚠️ Pending Payout' : lockedAmount > 0 ? '🔒 Payout Locked' : '✅ Fully Paid Up'}
                </p>
                <p style={{ color: canPayout ? GOLD : lockedAmount > 0 ? '#fbbf24' : '#4ade80', fontSize: '26px', fontWeight: '700', margin: 0 }}>
                  ₹{pendingPayout.toLocaleString()}
                </p>
                {lockedAmount > 0 && !canPayout && (
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '3px 0 0' }}>
                    ₹{lockedAmount.toLocaleString()} more unlocks after {PAYOUT_LOCK_DAYS}-day period
                  </p>
                )}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.7', textAlign: 'right' }}>
                Formula per order:<br />
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>(Total − Delivery) × 90% − Fixed Fee</span><br />
                e.g. ₹1,000 sale · ₹60 delivery:<br />
                <span style={{ color: '#4ade80', fontWeight: '600' }}>(₹940 × 90%) − ₹30 = ₹816</span>
              </div>
            </div>
          </div>

          {/* ── Orders Table ── */}
          {orders.length > 0 && (
            <div style={{ backgroundColor: '#0d0d0d', border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden', marginBottom: '18px' }}>
              <div style={{ padding: '10px 16px', borderBottom: `1px solid ${BORDER}`, backgroundColor: '#050505', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>
                  Orders & Payout Breakdown ({orders.length})
                </p>
                <span style={{ color: deliveryMode === 'live' ? '#4ade80' : '#fbbf24', fontSize: '10px', padding: '2px 8px', backgroundColor: deliveryMode === 'live' ? 'rgba(74,222,128,0.1)' : 'rgba(251,191,36,0.1)', borderRadius: '10px' }}>
                  {deliveryMode === 'live' ? '🟢 Shiprocket Live' : '🟡 Prototype'}
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '750px' }}>
                  <thead>
                    <tr>
                      {['Order', 'Total', '−Delivery', 'Product Val', '−10% Comm', '−Fixed', 'Earns', 'Status', 'Payout Lock', 'Action'].map(h => (
                        <th key={h} style={{ ...thStyle, fontSize: '9px', padding: '9px 11px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {enriched.map(order => {
                      const { commission, fixed, deliveryCharge: dc, earnings } = order.calc;
                      const productVal = (order.totalPrice || 0) - dc;
                      const cancelled  = order.orderStatus === 'Cancelled';
                      const delivered  = order.isDelivered;
                      const unlocked   = order.payoutUnlocked;
                      const days       = order.daysAfterDelivery;
                      const s          = orderStatusStyle(order.orderStatus);
                      const canSim     = !cancelled && !delivered && deliveryMode !== 'live';

                      return (
                        <tr key={order._id} style={{ opacity: cancelled ? 0.45 : 1 }}>
                          <td style={{ ...tdStyle, padding: '9px 11px' }}>
                            <span style={{ color: GOLD, fontSize: '11px', fontFamily: 'monospace' }}>#{order._id.slice(-6).toUpperCase()}</span>
                            <br />
                            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '9px' }}>
                              {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, padding: '9px 11px' }}>
                            <span style={{ color: '#fff', fontSize: '12px', fontWeight: '600' }}>₹{(order.totalPrice || 0).toLocaleString()}</span>
                          </td>
                          <td style={{ ...tdStyle, padding: '9px 11px' }}>
                            <span style={{ color: '#60a5fa', fontSize: '11px' }}>−₹{dc}</span>
                          </td>
                          <td style={{ ...tdStyle, padding: '9px 11px' }}>
                            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>₹{productVal.toLocaleString()}</span>
                          </td>
                          <td style={{ ...tdStyle, padding: '9px 11px' }}>
                            <span style={{ color: '#f87171', fontSize: '11px' }}>−₹{commission}</span>
                          </td>
                          <td style={{ ...tdStyle, padding: '9px 11px' }}>
                            <span style={{ color: '#fbbf24', fontSize: '11px' }}>−₹{fixed}</span>
                          </td>
                          <td style={{ ...tdStyle, padding: '9px 11px' }}>
                            <span style={{ color: cancelled ? '#f87171' : '#4ade80', fontSize: '12px', fontWeight: '700' }}>
                              {cancelled ? '—' : `₹${earnings}`}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, padding: '9px 11px' }}>
                            <span style={{ fontSize: '9px', padding: '3px 7px', borderRadius: '20px', color: s.color, backgroundColor: s.bg, whiteSpace: 'nowrap' }}>
                              {order.orderStatus}
                            </span>
                          </td>
                          {/* Payout lock column */}
                          <td style={{ ...tdStyle, padding: '9px 11px', minWidth: '120px' }}>
                            {cancelled ? (
                              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>—</span>
                            ) : !delivered ? (
                              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px' }}>
                                Awaiting delivery
                              </span>
                            ) : unlocked ? (
                              <span style={{ color: '#4ade80', fontSize: '10px', fontWeight: '600' }}>
                                🔓 Ready ({days}d ago)
                              </span>
                            ) : (
                              <div>
                                <span style={{ color: '#fbbf24', fontSize: '10px', fontWeight: '600' }}>
                                  🔒 {PAYOUT_LOCK_DAYS - days}d left
                                </span>
                                <PayoutTimeline order={order} />
                              </div>
                            )}
                          </td>
                          {/* Action column */}
                          <td style={{ ...tdStyle, padding: '9px 11px' }}>
                            {canSim ? (
                              <button onClick={() => onSimulate(order._id)} disabled={simulating === order._id}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 9px', backgroundColor: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: '5px', color: '#60a5fa', fontSize: '10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                {simulating === order._id ? <FiRefreshCw size={9} style={{ animation: 'spin 1s linear infinite' }} /> : <FiPlay size={9} />}
                                {simulating === order._id ? '…' : 'Next Step'}
                              </button>
                            ) : delivered ? (
                              <span style={{ color: '#4ade80', fontSize: '10px' }}>✅ Done</span>
                            ) : (
                              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Totals footer */}
                  {validOrders.length > 0 && (
                    <tfoot>
                      <tr style={{ backgroundColor: 'rgba(201,168,76,0.05)' }}>
                        <td style={{ padding: '9px 11px', borderTop: `1px solid ${BORDER}` }}>
                          <span style={{ color: GOLD, fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em' }}>TOTAL</span>
                        </td>
                        <td style={{ padding: '9px 11px', borderTop: `1px solid ${BORDER}` }}>
                          <span style={{ color: '#fff', fontSize: '12px', fontWeight: '700' }}>₹{grossRevenue.toLocaleString()}</span>
                        </td>
                        <td style={{ padding: '9px 11px', borderTop: `1px solid ${BORDER}` }}>
                          <span style={{ color: '#60a5fa', fontSize: '11px' }}>−₹{totalDelivery.toLocaleString()}</span>
                        </td>
                        <td style={{ padding: '9px 11px', borderTop: `1px solid ${BORDER}` }}>
                          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>₹{(grossRevenue - totalDelivery).toLocaleString()}</span>
                        </td>
                        <td style={{ padding: '9px 11px', borderTop: `1px solid ${BORDER}` }}>
                          <span style={{ color: '#f87171', fontSize: '11px' }}>−₹{totalCommission.toLocaleString()}</span>
                        </td>
                        <td style={{ padding: '9px 11px', borderTop: `1px solid ${BORDER}` }}>
                          <span style={{ color: '#fbbf24', fontSize: '11px' }}>−₹{totalFixed.toLocaleString()}</span>
                        </td>
                        <td style={{ padding: '9px 11px', borderTop: `1px solid ${BORDER}` }}>
                          <span style={{ color: '#4ade80', fontSize: '13px', fontWeight: '700' }}>₹{totalEarnings.toLocaleString()}</span>
                        </td>
                        <td colSpan="3" style={{ padding: '9px 11px', borderTop: `1px solid ${BORDER}` }} />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
              <div style={{ padding: '10px 16px', borderTop: `1px solid ${BORDER}`, backgroundColor: '#050505' }}>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', margin: 0 }}>
                  <FiClock size={10} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  Payout unlocks <strong style={{ color: '#fff' }}>{PAYOUT_LOCK_DAYS} days</strong> after delivery is confirmed. Delivery charges are excluded from commission calculations.
                </p>
              </div>
            </div>
          )}

          {/* ── Bank Details ── */}
          <div style={{ backgroundColor: `${GOLD}06`, border: `1px solid ${GOLD}20`, borderRadius: '10px', padding: '16px', marginBottom: '18px' }}>
            <p style={{ color: GOLD, fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 10px', fontWeight: '600' }}>Bank Account</p>
            <InfoRow label="Account Holder" value={seller.sellerInfo?.bank?.name}     highlight />
            <InfoRow label="Bank"           value={seller.sellerInfo?.bank?.bankName} />
            <InfoRow label="Account No."    value={seller.sellerInfo?.bank?.account}  copy highlight />
            <InfoRow label="IFSC"           value={seller.sellerInfo?.bank?.ifsc}     copy highlight />
          </div>

          {/* ── Payout Instructions (only when payout available) ── */}
          {canPayout && (
            <div style={{ backgroundColor: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '10px', padding: '14px 16px', marginBottom: '18px' }}>
              <p style={{ color: '#4ade80', fontSize: '12px', fontWeight: '600', margin: '0 0 8px' }}>How to send payout</p>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', lineHeight: '1.8', margin: 0 }}>
                1. Open bank app → NEFT / IMPS / UPI<br />
                2. Account: <strong style={{ color: '#fff' }}>{seller.sellerInfo?.bank?.account || 'N/A'}</strong> · IFSC: <strong style={{ color: '#fff' }}>{seller.sellerInfo?.bank?.ifsc || 'N/A'}</strong><br />
                3. Name: <strong style={{ color: '#fff' }}>{seller.sellerInfo?.bank?.name || 'N/A'}</strong> · Amount: <strong style={{ color: GOLD }}>₹{pendingPayout.toLocaleString()}</strong><br />
                4. After transfer → click "Pay ₹{pendingPayout.toLocaleString()}" → enter UTR number
              </p>
            </div>
          )}

          {/* ── Action Buttons ── */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {seller.sellerInfo?.status !== 'approved' && (
              <button onClick={() => onStatusChange(seller._id, 'approved')}
                style={{ flex: 1, padding: '11px', backgroundColor: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '8px', color: '#4ade80', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <FiCheck size={13} /> Approve Seller
              </button>
            )}
            {seller.sellerInfo?.status !== 'suspended' && (
              <button onClick={() => onStatusChange(seller._id, 'suspended')}
                style={{ flex: 1, padding: '11px', backgroundColor: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '8px', color: '#f87171', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <FiX size={13} /> Suspend
              </button>
            )}
            {/* Payout button — locked until 7 days after delivery */}
            <button onClick={() => canPayout && onPayout(seller, pendingPayout)} disabled={!canPayout}
              title={!canPayout ? (lockedAmount > 0 ? `₹${lockedAmount.toLocaleString()} locked — ${PAYOUT_LOCK_DAYS}-day hold period` : 'No pending payout') : `Pay ₹${pendingPayout.toLocaleString()}`}
              style={{ flex: 1, padding: '11px', backgroundColor: canPayout ? `${GOLD}18` : 'rgba(255,255,255,0.04)', border: `1px solid ${canPayout ? `${GOLD}40` : BORDER}`, borderRadius: '8px', color: canPayout ? GOLD : 'rgba(255,255,255,0.2)', fontSize: '13px', fontWeight: '600', cursor: canPayout ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {canPayout
                ? <><FiDollarSign size={13} /> Pay ₹{pendingPayout.toLocaleString()}</>
                : <><FiLock size={13} /> {lockedAmount > 0 ? `₹${lockedAmount.toLocaleString()} Locked` : 'Payout Locked'}</>}
            </button>
          </div>

          {/* Lock explanation */}
          {!canPayout && (lockedAmount > 0 || deliveredOrders.length === 0) && (
            <div style={{ backgroundColor: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: '8px', padding: '10px 14px', marginTop: '10px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <FiClock size={13} style={{ color: '#fbbf24', marginTop: '1px', flexShrink: 0 }} />
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', lineHeight: '1.6', margin: 0 }}>
                {deliveredOrders.length === 0
                  ? 'Payout unlocks after an order is delivered and the 7-day hold period passes.'
                  : `₹${lockedAmount.toLocaleString()} is in the ${PAYOUT_LOCK_DAYS}-day hold period after delivery. This protects against returns and disputes.`
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Payout Confirm Modal ──────────────────────────────────────────
function PayoutModal({ seller, amount, onClose, onConfirm }) {
  const [note, setNote]         = useState('');
  const [processing, setProcessing] = useState(false);
  const handleConfirm = async () => {
    setProcessing(true);
    try { await onConfirm(amount, note); onClose(); }
    finally { setProcessing(false); }
  };
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ backgroundColor: '#141414', border: `1px solid ${GOLD}40`, borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '100%' }}>
        <h3 style={{ color: GOLD, fontFamily: 'Cinzel, serif', fontSize: '15px', letterSpacing: '0.1em', marginBottom: '6px' }}>Confirm Payout</h3>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '20px' }}>
          To: <strong style={{ color: '#fff' }}>{seller.sellerInfo?.bank?.name}</strong> · {seller.sellerInfo?.bank?.bankName}
        </p>
        <div style={{ backgroundColor: `${GOLD}08`, border: `1px solid ${GOLD}20`, borderRadius: '10px', padding: '16px', marginBottom: '18px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '0 0 6px' }}>Payout Amount</p>
          <p style={{ color: GOLD, fontSize: '32px', fontWeight: '700', margin: 0 }}>₹{amount.toLocaleString()}</p>
        </div>
        <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '7px' }}>UTR / Reference Number</label>
        <input type="text" value={note} onChange={e => setNote(e.target.value)}
          placeholder="e.g. UTR123456789 or March settlement"
          style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '11px 14px', color: '#fff', fontSize: '13px', outline: 'none', marginBottom: '14px' }}
          onFocus={e => e.target.style.borderColor = GOLD}
          onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        <div style={{ backgroundColor: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.18)', borderRadius: '8px', padding: '12px', marginBottom: '18px' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', lineHeight: '1.6', margin: 0 }}>
            Transfer to seller's bank first, then click Confirm to record it in the system.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', backgroundColor: 'transparent', border: `1px solid ${BORDER}`, borderRadius: '8px', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleConfirm} disabled={processing}
            style={{ flex: 1, padding: '11px', backgroundColor: processing ? `${GOLD}80` : GOLD, border: 'none', borderRadius: '8px', color: '#000', fontSize: '13px', fontWeight: '700', cursor: processing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            {processing ? <><FiRefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</> : <><FiDollarSign size={13} /> Confirm Payout</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main AdminSellers ─────────────────────────────────────────────
export default function AdminSellers() {
  const [sellers,      setSellers]     = useState([]);
  const [allOrders,    setAllOrders]   = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [selected,     setSelected]    = useState(null);
  const [payoutData,   setPayoutData]  = useState(null);
  const [simulating,   setSimulating]  = useState(null);
  const [deliveryMode, setDeliveryMode]= useState(null);

  useEffect(() => {
    fetchData();
    deliveryAPI.getMode().then(r => setDeliveryMode(r.mode)).catch(() => setDeliveryMode('prototype'));
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sellerRes, orderRes] = await Promise.all([
        userAPI.getAll({ role: 'seller', limit: 100 }),
        orderAPI.getAll({ limit: 1000 }).catch(() => ({ orders: [] })),
      ]);
      setSellers(sellerRes.users || []);
      setAllOrders(orderRes.orders || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const getSellerOrders = (sellerId) =>
    allOrders.filter(o => o.orderItems?.some(item => item.seller && String(item.seller) === String(sellerId)));

  const getStats = (seller) => {
    const orders    = getSellerOrders(seller._id);
    const valid     = orders.filter(o => o.orderStatus !== 'Cancelled');
    const delivered = orders.filter(o => o.orderStatus === 'Delivered');
    const unlocked  = delivered.filter(o => o.deliveredAt && daysSince(o.deliveredAt) >= PAYOUT_LOCK_DAYS);

    const gross      = valid.reduce((s, o) => s + (o.totalPrice || 0), 0);
    const commission = valid.reduce((s, o) => s + calcEarnings(o.totalPrice || 0, o.deliveryCharge || 0).commission, 0);
    const fixed      = valid.reduce((s, o) => s + calcEarnings(o.totalPrice || 0, o.deliveryCharge || 0).fixed, 0);
    const earnings   = valid.reduce((s, o) => s + calcEarnings(o.totalPrice || 0, o.deliveryCharge || 0).earnings, 0);
    const unlockedEarnings = unlocked.reduce((s, o) => s + calcEarnings(o.totalPrice || 0, o.deliveryCharge || 0).earnings, 0);
    const paidOut    = seller.sellerInfo?.totalPaidOut || 0;
    const pending    = Math.max(0, unlockedEarnings - paidOut);

    return { orders: orders.length, gross, commission, fixed, earnings, paidOut, pending, deliveredCount: delivered.length, unlockedCount: unlocked.length };
  };

  const handleStatusChange = async (sellerId, newStatus) => {
    try {
      await userAPI.update(sellerId, { 'sellerInfo.status': newStatus });
      toast.success(`Seller ${newStatus}`);
      fetchData();
      if (selected?._id === sellerId) setSelected(s => ({ ...s, sellerInfo: { ...s.sellerInfo, status: newStatus } }));
    } catch { toast.error('Failed to update status'); }
  };

  const handlePayout = async (amount, note) => {
    try {
      await userAPI.processPayout(payoutData.seller._id, { amount, note });
      toast.success(`✅ ₹${amount} payout recorded`);
      fetchData(); setSelected(null);
    } catch (e) { toast.error(e?.message || 'Payout failed'); throw e; }
  };

  const handleResetPayout = async (sellerId) => {
    try {
      await userAPI.clearPayoutHistory(sellerId);
      toast.success('Payout history cleared');
      fetchData();
    } catch (e) { toast.error(e?.message || 'Reset failed'); throw e; }
  };

  const handleSimulate = async (orderId) => {
    setSimulating(orderId);
    try {
      const res = await deliveryAPI.simulate(orderId);
      const { newStatus, payoutEligible } = res;
      toast.success(`📦 ${newStatus}${payoutEligible ? ' · 💰 Payout unlocked!' : ''}`);
      fetchData();
    } catch (e) { toast.error(e?.message || 'Simulation failed'); }
    finally { setSimulating(null); }
  };

  const totalCommission = sellers.reduce((s, seller) => s + getStats(seller).commission, 0);
  const totalPending    = sellers.reduce((s, seller) => s + getStats(seller).pending, 0);
  const approvedCount   = sellers.filter(s => s.sellerInfo?.status === 'approved').length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>

      {selected && (
        <SellerModal
          seller={selected}
          orders={getSellerOrders(selected._id)}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          simulating={simulating}
          onSimulate={handleSimulate}
          onPayout={(seller, amt) => { setSelected(null); setPayoutData({ seller, amount: amt }); }}
          onResetPayout={handleResetPayout}
          deliveryMode={deliveryMode}
        />
      )}
      {payoutData && (
        <PayoutModal seller={payoutData.seller} amount={payoutData.amount}
          onClose={() => setPayoutData(null)} onConfirm={handlePayout} />
      )}

      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between"
        style={{ backgroundColor: '#050505', borderBottom: `1px solid ${BORDER}` }}>
        <div>
          <p className="font-body text-xs tracking-[0.2em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Admin Panel</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 className="font-accent text-xl tracking-[0.2em]" style={{ color: GOLD }}>Sellers</h1>
            {deliveryMode && (
              <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', color: deliveryMode === 'live' ? '#4ade80' : '#fbbf24', backgroundColor: deliveryMode === 'live' ? 'rgba(74,222,128,0.1)' : 'rgba(251,191,36,0.1)' }}>
                {deliveryMode === 'live' ? '🟢 Shiprocket Live' : '🟡 Prototype Mode'}
              </span>
            )}
          </div>
        </div>
        <Link to="/admin" className="flex items-center gap-1 font-body text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <FiArrowLeft size={13} /> Dashboard
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Mode banner */}
        {deliveryMode === 'live' ? (
          <div style={{ backgroundColor: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '10px', padding: '14px 18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#4ade80', flexShrink: 0 }} />
            <div>
              <p style={{ color: '#4ade80', fontSize: '12px', fontWeight: '600', margin: '0 0 2px' }}>Shiprocket Live — Connected</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>Real AWB, automatic status updates, live delivery rates active.</p>
            </div>
          </div>
        ) : (
          <div style={{ backgroundColor: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.18)', borderRadius: '10px', padding: '14px 18px', marginBottom: '24px' }}>
            <p style={{ color: '#fbbf24', fontSize: '12px', fontWeight: '600', margin: '0 0 4px' }}>Prototype Mode — Shiprocket not connected</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', lineHeight: '1.7', margin: 0 }}>
              Use "Next Step" in order details to simulate delivery. Payout unlocks <strong style={{ color: '#fff' }}>{PAYOUT_LOCK_DAYS} days</strong> after delivery.
              Set <code style={{ color: GOLD, backgroundColor: 'rgba(201,168,76,0.1)', padding: '1px 6px', borderRadius: '3px' }}>PROTOTYPE_MODE=false</code> to go live.
            </p>
          </div>
        )}

        {/* 7-day policy notice */}
        <div style={{ backgroundColor: 'rgba(96,165,250,0.04)', border: '1px solid rgba(96,165,250,0.15)', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FiClock size={14} style={{ color: '#60a5fa', flexShrink: 0 }} />
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>
            <strong style={{ color: '#60a5fa' }}>{PAYOUT_LOCK_DAYS}-Day Payout Policy:</strong> Seller payouts are locked for {PAYOUT_LOCK_DAYS} days after delivery to protect against returns and disputes. Payout button unlocks automatically after this period.
          </p>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '28px' }}>
          {[
            { label: 'Total Sellers',       value: sellers.length,                          color: GOLD,      Icon: FiShoppingBag },
            { label: 'Platform Commission', value: `₹${totalCommission.toLocaleString()}`, color: '#4ade80', Icon: FiTrendingUp  },
            { label: 'Pending Payouts',     value: `₹${totalPending.toLocaleString()}`,    color: GOLD,      Icon: FiDollarSign  },
            { label: 'Approved',            value: approvedCount,                           color: '#4ade80', Icon: FiCheck       },
          ].map(({ label, value, color, Icon }) => (
            <div key={label} style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <Icon size={16} style={{ color }} />
              </div>
              <p style={{ color: '#fff', fontSize: '22px', fontWeight: '700', margin: '0 0 4px' }}>{value}</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>{label}</p>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', backgroundColor: color, opacity: 0.35 }} />
            </div>
          ))}
        </div>

        {/* Sellers table */}
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${BORDER}`, backgroundColor: '#0d0d0d' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>All Sellers ({sellers.length})</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '950px' }}>
              <thead>
                <tr>
                  {['Seller', 'Business', 'Status', 'Orders', 'Gross', 'Commission', 'Earns', 'Paid Out', 'Pending', 'Lock Status', 'Actions'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [...Array(3)].map((_, i) => <tr key={i}>{[...Array(11)].map((_, j) => <td key={j} style={tdStyle}><div style={{ height: '14px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} /></td>)}</tr>)
                  : sellers.length === 0
                  ? <tr><td colSpan="11" style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>No sellers registered yet.</td></tr>
                  : sellers.map(seller => {
                      const st    = sellerStatusStyle[seller.sellerInfo?.status || 'pending'];
                      const stats = getStats(seller);
                      return (
                        <tr key={seller._id}
                          onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                          onMouseOut={e  => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                              <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: `${GOLD}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <span style={{ color: GOLD, fontSize: '12px', fontWeight: '700' }}>{seller.name?.charAt(0).toUpperCase()}</span>
                              </div>
                              <div>
                                <p style={{ color: '#fff', fontSize: '12px', fontWeight: '500', margin: '0 0 1px' }}>{seller.name}</p>
                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', margin: 0 }}>{seller.email}</p>
                              </div>
                            </div>
                          </td>
                          <td style={tdStyle}><span style={{ color: '#fff', fontSize: '12px' }}>{seller.sellerInfo?.businessName || '—'}</span></td>
                          <td style={tdStyle}>
                            <span style={{ fontSize: '10px', padding: '3px 9px', borderRadius: '20px', color: st.color, backgroundColor: st.bg }}>
                              {seller.sellerInfo?.status || 'pending'}
                            </span>
                          </td>
                          <td style={tdStyle}><span style={{ color: '#fff', fontSize: '12px' }}>{stats.orders}</span></td>
                          <td style={tdStyle}><span style={{ color: '#fff', fontSize: '12px' }}>₹{stats.gross.toLocaleString()}</span></td>
                          <td style={tdStyle}><span style={{ color: '#4ade80', fontSize: '12px' }}>₹{stats.commission.toLocaleString()}</span></td>
                          <td style={tdStyle}><span style={{ color: '#60a5fa', fontSize: '12px' }}>₹{stats.earnings.toLocaleString()}</span></td>
                          <td style={tdStyle}><span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px' }}>₹{stats.paidOut.toLocaleString()}</span></td>
                          <td style={tdStyle}>
                            {stats.pending > 0
                              ? <span style={{ color: GOLD, fontSize: '13px', fontWeight: '700' }}>₹{stats.pending.toLocaleString()}</span>
                              : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><FiLock size={10} /> —</span>}
                          </td>
                          <td style={tdStyle}>
                            {stats.unlockedCount > 0
                              ? <span style={{ color: '#4ade80', fontSize: '11px' }}>🔓 {stats.unlockedCount} ready</span>
                              : stats.deliveredCount > 0
                              ? <span style={{ color: '#fbbf24', fontSize: '11px' }}>🔒 {stats.deliveredCount} in hold</span>
                              : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>—</span>}
                          </td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                              <button onClick={() => setSelected(seller)} style={{ color: '#60a5fa', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <FiEye size={11} /> View
                              </button>
                              {stats.pending > 0
                                ? <button onClick={() => setPayoutData({ seller, amount: stats.pending })} style={{ color: GOLD, fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <FiDollarSign size={11} /> Pay
                                  </button>
                                : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}><FiLock size={10} /> Pay</span>}
                              {seller.sellerInfo?.status !== 'approved' && (
                                <button onClick={() => handleStatusChange(seller._id, 'approved')} style={{ color: '#4ade80', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <FiCheck size={11} /> OK
                                </button>
                              )}
                              {seller.sellerInfo?.status !== 'suspended' && (
                                <button onClick={() => handleStatusChange(seller._id, 'suspended')} style={{ color: '#f87171', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <FiX size={11} /> Ban
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}