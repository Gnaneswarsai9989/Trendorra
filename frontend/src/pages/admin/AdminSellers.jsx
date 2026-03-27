import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userAPI, orderAPI, deliveryAPI, settingsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiShoppingBag, FiDollarSign, FiCheck, FiX,
  FiRefreshCw, FiEye, FiCopy, FiTrendingUp, FiPlay, FiLock,
  FiTrash2, FiAlertTriangle, FiClock, FiTruck, FiUser, FiShield,
  FiRotateCcw,
} from 'react-icons/fi';

const BG     = '#080808';
const CARD   = '#111111';
const CARD2  = '#161616';
const BORDER = 'rgba(255,255,255,0.07)';
const GOLD   = '#C9A84C';

// ✅ Dynamic: fetched from DB — defaults to 0 until admin sets them
let _commRate  = 0;
let _fixedCharge = 0;

const calcEarnings = (price, deliveryCharge = 0) => {
  const p          = Number(price) || 0;
  const dc         = Number(deliveryCharge) || 0;
  const productVal = Math.max(0, p - dc);
  const commission = Math.round(productVal * (_commRate / 100));
  const fixed      = Number(_fixedCharge) || 0;
  return { commission, fixed, deliveryCharge: dc, productVal, earnings: Math.max(0, productVal - commission - fixed) };
};

const PAYOUT_LOCK_DAYS = 7;
const daysSince = (date) => date ? Math.floor((Date.now() - new Date(date)) / (1000*60*60*24)) : null;

// ✅ FIXED: properly resolve seller ID whether item.seller is object or string
const resolveId = (val) => val?._id || val;
const matchSeller = (item, sellerId) => {
  if (!item.seller) return false;
  return String(resolveId(item.seller)) === String(sellerId);
};

const sellerStatusStyle = {
  pending:   { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
  approved:  { color: '#4ade80', bg: 'rgba(74,222,128,0.12)'  },
  suspended: { color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
};
const sStyle = (s) => ({
  Processing:         { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
  Confirmed:          { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  Shipped:            { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  'Out for Delivery': { color: '#fb923c', bg: 'rgba(251,146,60,0.12)'  },
  Delivered:          { color: '#4ade80', bg: 'rgba(74,222,128,0.12)'  },
  Cancelled:          { color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
}[s] || { color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.05)' });

const thS = { color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 12px', textAlign: 'left', borderBottom: `1px solid ${BORDER}`, backgroundColor: '#050505', whiteSpace: 'nowrap' };
const tdS = { padding: '10px 12px', borderBottom: `1px solid ${BORDER}`, verticalAlign: 'middle' };

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

function Tile({ label, value, color, sub }) {
  return (
    <div style={{ backgroundColor: '#0a0a0a', borderRadius: '8px', padding: '12px 14px', border: `1px solid ${color}18` }}>
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>{label}</p>
      <p style={{ color, fontSize: '17px', fontWeight: '700', margin: 0 }}>{value}</p>
      {sub && <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', margin: '2px 0 0' }}>{sub}</p>}
    </div>
  );
}

// ── Danger Modal ──────────────────────────────────────────────────
function DangerModal({ open, onClose, onConfirm, loading, title, subtitle, lines, accentColor = '#f87171' }) {
  const [typed, setTyped] = useState('');
  useEffect(() => { if (!open) setTyped(''); }, [open]);
  if (!open) return null;
  const ready = typed === 'DELETE' && !loading;
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 10001, backgroundColor: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ backgroundColor: '#141414', border: `1px solid ${accentColor}44`, borderRadius: '14px', padding: '28px', maxWidth: '440px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: `${accentColor}15`, border: `1px solid ${accentColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FiAlertTriangle size={18} style={{ color: accentColor }} />
          </div>
          <div>
            <p style={{ color: accentColor, fontFamily: 'Cinzel, serif', fontSize: '14px', letterSpacing: '0.1em', margin: '0 0 2px' }}>{title}</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0 }}>{subtitle}</p>
          </div>
        </div>
        <div style={{ backgroundColor: `${accentColor}0a`, border: `1px solid ${accentColor}22`, borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
          {lines.map((l, i) => <p key={i} style={{ color: i === 0 ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.4)', fontSize: '12px', lineHeight: '1.7', marginTop: i > 0 ? '6px' : 0 }}>{l}</p>)}
          <p style={{ color: accentColor, fontSize: '11px', fontWeight: '600', marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${accentColor}20` }}>🚫 Cannot be undone.</p>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', marginBottom: '7px' }}>Type <strong style={{ color: accentColor }}>DELETE</strong> to confirm</p>
        <input autoFocus type="text" value={typed} onChange={e => setTyped(e.target.value)} placeholder="Type DELETE here…"
          style={{ width: '100%', backgroundColor: '#0a0a0a', border: `1px solid ${typed === 'DELETE' ? accentColor : 'rgba(255,255,255,0.1)'}`, borderRadius: '6px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box', marginBottom: '14px' }} />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => ready && onConfirm()} disabled={!ready}
            style={{ flex: 1, padding: '10px', backgroundColor: ready ? accentColor : `${accentColor}12`, border: `1px solid ${ready ? accentColor : `${accentColor}22`}`, borderRadius: '6px', color: ready ? '#fff' : `${accentColor}44`, fontSize: '13px', fontWeight: '700', cursor: ready ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            {loading ? <><FiRefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</> : <><FiTrash2 size={12} /> Confirm</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Payout Timeline ───────────────────────────────────────────────
function PayoutTimeline({ order }) {
  if (!order.deliveredAt) return null;
  const days = daysSince(order.deliveredAt);
  const pct  = Math.min(100, Math.round((days / PAYOUT_LOCK_DAYS) * 100));
  const daysLeft = Math.max(0, PAYOUT_LOCK_DAYS - days);
  return (
    <div style={{ marginTop: '5px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <span style={{ color: days < PAYOUT_LOCK_DAYS ? '#fbbf24' : '#4ade80', fontSize: '10px', fontWeight: '600' }}>
          {days < PAYOUT_LOCK_DAYS ? `🔒 ${daysLeft}d left` : '🔓 Ready'}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>{days}d ago</span>
      </div>
      <div style={{ height: '3px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: days < PAYOUT_LOCK_DAYS ? '#fbbf24' : '#4ade80', borderRadius: '2px' }} />
      </div>
    </div>
  );
}

// ── Seller Detail Modal ───────────────────────────────────────────
function SellerModal({ seller, orders, onClose, onStatusChange, onPayout, onSimulate, simulating, onResetPayout, deliveryMode, onToggleNoReturns }) {
  const [showReset, setShowReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  const enriched = orders.map(o => {
    const dc = o.deliveryCharge || o.shippingPrice || 0;
    const calc = calcEarnings(o.totalPrice || 0, dc);
    const isDelivered = o.orderStatus === 'Delivered';
    const daysAfter = o.deliveredAt ? daysSince(o.deliveredAt) : null;
    const unlocked  = isDelivered && daysAfter !== null && daysAfter >= PAYOUT_LOCK_DAYS;
    return { ...o, calc, isDelivered, daysAfter, unlocked };
  });

  const valid       = enriched.filter(o => o.orderStatus !== 'Cancelled');
  const delivered   = enriched.filter(o => o.isDelivered);
  const unlocked    = enriched.filter(o => o.unlocked);

  const gross       = valid.reduce((s, o) => s + (o.totalPrice || 0), 0);
  const totalDC     = valid.reduce((s, o) => s + o.calc.deliveryCharge, 0);
  const totalComm   = valid.reduce((s, o) => s + o.calc.commission, 0);
  const totalFixed  = valid.reduce((s, o) => s + o.calc.fixed, 0);
  const totalEarn   = valid.reduce((s, o) => s + o.calc.earnings, 0);
  const delivEarn   = delivered.reduce((s, o) => s + o.calc.earnings, 0);
  const unlockEarn  = unlocked.reduce((s, o) => s + o.calc.earnings, 0);
  const paidOut     = seller.sellerInfo?.totalPaidOut || 0;
  const pending     = Math.max(0, unlockEarn - paidOut);
  const locked      = Math.max(0, delivEarn - unlockEarn);
  const canPayout   = pending > 0;

  const st = sellerStatusStyle[seller.sellerInfo?.status || 'pending'];

  return (
    <>
      {showReset && (
        <DangerModal open onClose={() => setShowReset(false)}
          onConfirm={async () => { setResetting(true); try { await onResetPayout(seller._id); setShowReset(false); } finally { setResetting(false); } }}
          loading={resetting} title="Reset Payout History" subtitle={seller.sellerInfo?.businessName || seller.name}
          lines={[`Clear all payout history for ${seller.name} and reset totalPaidOut to ₹0.`, 'All previous payout records will be permanently deleted.']} />
      )}
      <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div style={{ backgroundColor: '#111', border: `1px solid ${GOLD}25`, borderRadius: '16px', padding: '26px', maxWidth: '800px', width: '100%', maxHeight: '92vh', overflowY: 'auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: `${GOLD}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: GOLD, fontWeight: '700', fontSize: '16px' }}>{seller.name?.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ color: GOLD, fontFamily: 'Cinzel, serif', fontSize: '15px', letterSpacing: '0.08em', margin: 0 }}>{seller.sellerInfo?.businessName || seller.name}</h3>
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', color: st.color, backgroundColor: st.bg }}>{seller.sellerInfo?.status || 'pending'}</span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: '2px 0 0' }}>{seller.email}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowReset(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 11px', backgroundColor: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.22)', borderRadius: '6px', color: '#f87171', fontSize: '11px', cursor: 'pointer' }}>
                <FiTrash2 size={11} /> Reset Payout
              </button>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '22px', lineHeight: 1 }}>×</button>
            </div>
          </div>

          {/* Revenue tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginBottom: '14px' }}>
            <Tile label="Gross Revenue"     value={`₹${gross.toLocaleString()}`}       color="#fff"     sub={`${valid.length} orders`} />
            <Tile label="−Delivery (Courier)" value={`₹${totalDC.toLocaleString()}`}  color="#60a5fa"  sub="To courier" />
            <Tile label="−Commission 10%"   value={`₹${totalComm.toLocaleString()}`}   color="#f87171"  sub="Platform fee" />
            <Tile label="−Fixed Fees"       value={`₹${totalFixed.toLocaleString()}`}  color="#fbbf24"  sub="Per order" />
          </div>

          {/* Payout box */}
          <div style={{ backgroundColor: `${GOLD}07`, border: `1px solid ${GOLD}22`, borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <p style={{ color: GOLD, fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 12px', fontWeight: '600' }}>
              Payout Status — {PAYOUT_LOCK_DAYS}-Day Lock Policy
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginBottom: '12px' }}>
              <Tile label="Net Earnings"           value={`₹${totalEarn.toLocaleString()}`}   color="#4ade80" sub="All valid orders" />
              <Tile label={`🔓 Unlocked (${PAYOUT_LOCK_DAYS}d+)`} value={`₹${unlockEarn.toLocaleString()}`} color="#4ade80" sub={`${unlocked.length} orders`} />
              <Tile label="🔒 In Hold (<7d)"       value={`₹${locked.toLocaleString()}`}       color="#fbbf24" sub="After 7d releases" />
              <Tile label="Paid Out"               value={`₹${paidOut.toLocaleString()}`}       color="#60a5fa" sub="Transferred" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: canPayout ? `${GOLD}10` : 'rgba(255,255,255,0.03)', border: `1px solid ${canPayout ? `${GOLD}30` : BORDER}`, borderRadius: '8px', padding: '12px 16px' }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', textTransform: 'uppercase', margin: '0 0 3px' }}>
                  {canPayout ? '⚠️ Pending Payout' : locked > 0 ? '🔒 Locked' : '✅ Fully Paid'}
                </p>
                <p style={{ color: canPayout ? GOLD : locked > 0 ? '#fbbf24' : '#4ade80', fontSize: '24px', fontWeight: '700', margin: 0 }}>₹{pending.toLocaleString()}</p>
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textAlign: 'right', lineHeight: '1.7' }}>
                Formula: (Total − Delivery) × 90% − Fixed<br />
                <span style={{ color: '#4ade80' }}>e.g. ₹1,000 − ₹60 = ₹940 → ₹940×90% − ₹30 = ₹816</span>
              </div>
            </div>
          </div>

          {/* Orders table */}
          {orders.length > 0 && (
            <div style={{ backgroundColor: '#0a0a0a', border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, backgroundColor: '#050505', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
                  Orders & Payout Breakdown ({orders.length})
                </p>
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', color: deliveryMode === 'live' ? '#4ade80' : '#fbbf24', backgroundColor: deliveryMode === 'live' ? 'rgba(74,222,128,0.1)' : 'rgba(251,191,36,0.1)' }}>
                  {deliveryMode === 'live' ? '🟢 Shiprocket Live' : '🟡 Prototype'}
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '820px' }}>
                  <thead>
                    <tr>{['Order', 'Sale Total', '−Delivery', 'Product Val', '−10% Comm', '−Fixed', 'Earns', 'Status', 'Payout Lock', 'Action'].map(h => (
                      <th key={h} style={{ ...thS, padding: '8px 10px', fontSize: '9px' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {enriched.map(order => {
                      const { commission, fixed, deliveryCharge: dc, productVal, earnings } = order.calc;
                      const cancelled = order.orderStatus === 'Cancelled';
                      const s = sStyle(order.orderStatus);
                      const canSim = !cancelled && !order.isDelivered && deliveryMode !== 'live';
                      return (
                        <tr key={order._id} style={{ opacity: cancelled ? 0.4 : 1 }}
                          onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                          onMouseOut={e  => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <td style={{ ...tdS, padding: '8px 10px' }}>
                            <span style={{ color: GOLD, fontSize: '11px', fontFamily: 'monospace', display: 'block' }}>#{order._id.slice(-6).toUpperCase()}</span>
                            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '9px' }}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                          </td>
                          <td style={{ ...tdS, padding: '8px 10px' }}><span style={{ color: '#fff', fontSize: '12px', fontWeight: '600' }}>₹{(order.totalPrice || 0).toLocaleString()}</span></td>
                          <td style={{ ...tdS, padding: '8px 10px' }}><span style={{ color: '#60a5fa', fontSize: '11px' }}>−₹{dc}</span></td>
                          <td style={{ ...tdS, padding: '8px 10px' }}><span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>₹{productVal.toLocaleString()}</span></td>
                          <td style={{ ...tdS, padding: '8px 10px' }}><span style={{ color: '#f87171', fontSize: '11px' }}>−₹{commission}</span></td>
                          <td style={{ ...tdS, padding: '8px 10px' }}><span style={{ color: '#fbbf24', fontSize: '11px' }}>−₹{fixed}</span></td>
                          <td style={{ ...tdS, padding: '8px 10px' }}>
                            <span style={{ color: cancelled ? '#f87171' : '#4ade80', fontSize: '12px', fontWeight: '700' }}>{cancelled ? '—' : `₹${earnings}`}</span>
                          </td>
                          <td style={{ ...tdS, padding: '8px 10px' }}>
                            <span style={{ fontSize: '9px', padding: '3px 7px', borderRadius: '20px', color: s.color, backgroundColor: s.bg, whiteSpace: 'nowrap' }}>{order.orderStatus}</span>
                          </td>
                          <td style={{ ...tdS, padding: '8px 10px', minWidth: '110px' }}>
                            {cancelled ? <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>—</span>
                            : !order.isDelivered ? <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>Awaiting delivery</span>
                            : order.unlocked ? <span style={{ color: '#4ade80', fontSize: '10px', fontWeight: '600' }}>🔓 Ready ({order.daysAfter}d)</span>
                            : <div><span style={{ color: '#fbbf24', fontSize: '10px', fontWeight: '600' }}>🔒 {PAYOUT_LOCK_DAYS - order.daysAfter}d left</span><PayoutTimeline order={order} /></div>}
                          </td>
                          <td style={{ ...tdS, padding: '8px 10px' }}>
                            {canSim ? (
                              <button onClick={() => onSimulate(order._id)} disabled={simulating === order._id}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', backgroundColor: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', borderRadius: '5px', color: '#60a5fa', fontSize: '10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                {simulating === order._id ? <FiRefreshCw size={9} style={{ animation: 'spin 1s linear infinite' }} /> : <FiPlay size={9} />}
                                {simulating === order._id ? '…' : 'Next Step'}
                              </button>
                            ) : order.isDelivered ? (
                              <span style={{ color: '#4ade80', fontSize: '10px' }}>✅ Done</span>
                            ) : <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '10px' }}>—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {valid.length > 0 && (
                    <tfoot>
                      <tr style={{ backgroundColor: `${GOLD}05` }}>
                        <td style={{ padding: '8px 10px', borderTop: `1px solid ${BORDER}` }}><span style={{ color: GOLD, fontSize: '10px', fontWeight: '700' }}>TOTAL</span></td>
                        <td style={{ padding: '8px 10px', borderTop: `1px solid ${BORDER}` }}><span style={{ color: '#fff', fontWeight: '700', fontSize: '12px' }}>₹{gross.toLocaleString()}</span></td>
                        <td style={{ padding: '8px 10px', borderTop: `1px solid ${BORDER}` }}><span style={{ color: '#60a5fa', fontSize: '11px' }}>−₹{totalDC.toLocaleString()}</span></td>
                        <td style={{ padding: '8px 10px', borderTop: `1px solid ${BORDER}` }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>₹{(gross - totalDC).toLocaleString()}</span></td>
                        <td style={{ padding: '8px 10px', borderTop: `1px solid ${BORDER}` }}><span style={{ color: '#f87171', fontSize: '11px' }}>−₹{totalComm.toLocaleString()}</span></td>
                        <td style={{ padding: '8px 10px', borderTop: `1px solid ${BORDER}` }}><span style={{ color: '#fbbf24', fontSize: '11px' }}>−₹{totalFixed.toLocaleString()}</span></td>
                        <td style={{ padding: '8px 10px', borderTop: `1px solid ${BORDER}` }}><span style={{ color: '#4ade80', fontWeight: '700', fontSize: '13px' }}>₹{totalEarn.toLocaleString()}</span></td>
                        <td colSpan="3" style={{ padding: '8px 10px', borderTop: `1px solid ${BORDER}` }} />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
              <div style={{ padding: '8px 14px', borderTop: `1px solid ${BORDER}`, backgroundColor: '#050505' }}>
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', margin: 0 }}>
                  <FiClock size={10} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  Payout unlocks <strong style={{ color: '#fff' }}>{PAYOUT_LOCK_DAYS} days</strong> after delivery. Delivery charges excluded from commission base.
                </p>
              </div>
            </div>
          )}

          {/* Bank details */}
          <div style={{ backgroundColor: `${GOLD}06`, border: `1px solid ${GOLD}18`, borderRadius: '10px', padding: '14px 16px', marginBottom: '14px' }}>
            <p style={{ color: GOLD, fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 10px', fontWeight: '600' }}>Bank Account</p>
            <InfoRow label="Account Holder" value={seller.sellerInfo?.bank?.name}     highlight />
            <InfoRow label="Bank"           value={seller.sellerInfo?.bank?.bankName} />
            <InfoRow label="Account No."    value={seller.sellerInfo?.bank?.account}  copy highlight />
            <InfoRow label="IFSC"           value={seller.sellerInfo?.bank?.ifsc}     copy highlight />
          </div>

          {canPayout && (
            <div style={{ backgroundColor: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.18)', borderRadius: '10px', padding: '14px 16px', marginBottom: '14px' }}>
              <p style={{ color: '#4ade80', fontSize: '12px', fontWeight: '600', margin: '0 0 8px' }}>How to pay</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', lineHeight: '1.8', margin: 0 }}>
                1. Open bank app → NEFT/IMPS/UPI<br />
                2. A/C: <strong style={{ color: '#fff' }}>{seller.sellerInfo?.bank?.account || 'N/A'}</strong> · IFSC: <strong style={{ color: '#fff' }}>{seller.sellerInfo?.bank?.ifsc || 'N/A'}</strong><br />
                3. Name: <strong style={{ color: '#fff' }}>{seller.sellerInfo?.bank?.name || 'N/A'}</strong> · Amount: <strong style={{ color: GOLD }}>₹{pending.toLocaleString()}</strong><br />
                4. After transfer → click Pay → enter UTR
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {seller.sellerInfo?.status !== 'approved' && (
              <button onClick={() => onStatusChange(seller._id, 'approved')}
                style={{ flex: 1, padding: '11px', backgroundColor: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: '8px', color: '#4ade80', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <FiCheck size={13} /> Approve
              </button>
            )}
            {seller.sellerInfo?.status !== 'suspended' && (
              <button onClick={() => onStatusChange(seller._id, 'suspended')}
                style={{ flex: 1, padding: '11px', backgroundColor: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.22)', borderRadius: '8px', color: '#f87171', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <FiX size={13} /> Suspend
              </button>
            )}
            <button onClick={() => canPayout && onPayout(seller, pending)} disabled={!canPayout}
              style={{ flex: 1, padding: '11px', backgroundColor: canPayout ? `${GOLD}18` : 'rgba(255,255,255,0.03)', border: `1px solid ${canPayout ? `${GOLD}40` : BORDER}`, borderRadius: '8px', color: canPayout ? GOLD : 'rgba(255,255,255,0.2)', fontSize: '13px', fontWeight: '600', cursor: canPayout ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {canPayout ? <><FiDollarSign size={13} /> Pay ₹{pending.toLocaleString()}</> : <><FiLock size={13} /> {locked > 0 ? `₹${locked.toLocaleString()} Locked` : 'Payout Locked'}</>}
            </button>
          </div>

          {/* No-Returns Permission Toggle */}
          <div style={{ marginTop: '10px', backgroundColor: seller.sellerInfo?.noReturnsApproved ? 'rgba(248,113,113,0.05)' : 'rgba(255,255,255,0.03)', border: `1px solid ${seller.sellerInfo?.noReturnsApproved ? 'rgba(248,113,113,0.22)' : BORDER}`, borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiRotateCcw size={15} style={{ color: seller.sellerInfo?.noReturnsApproved ? '#f87171' : 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
              <div>
                <p style={{ color: '#fff', fontSize: '13px', fontWeight: '600', margin: '0 0 2px' }}>No Returns Permission</p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: 0 }}>
                  {seller.sellerInfo?.noReturnsApproved
                    ? seller.sellerInfo?.noReturnsEnabled ? '🔴 Active — Seller has enabled no-returns' : '✅ Approved — Seller has not enabled it yet'
                    : 'Not granted — seller follows standard return policy'}
                </p>
              </div>
            </div>
            <button
              onClick={() => onToggleNoReturns(seller._id, !seller.sellerInfo?.noReturnsApproved)}
              style={{ padding: '7px 14px', backgroundColor: seller.sellerInfo?.noReturnsApproved ? 'rgba(248,113,113,0.12)' : 'rgba(251,191,36,0.1)', border: `1px solid ${seller.sellerInfo?.noReturnsApproved ? 'rgba(248,113,113,0.3)' : 'rgba(251,191,36,0.25)'}`, borderRadius: '7px', color: seller.sellerInfo?.noReturnsApproved ? '#f87171' : '#fbbf24', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {seller.sellerInfo?.noReturnsApproved ? 'Revoke Permission' : 'Grant Permission'}
            </button>
          </div>
          {!canPayout && (locked > 0 || delivered.length === 0) && (
            <div style={{ backgroundColor: 'rgba(251,191,36,0.04)', border: '1px solid rgba(251,191,36,0.14)', borderRadius: '7px', padding: '9px 13px', marginTop: '9px', display: 'flex', gap: '8px' }}>
              <FiClock size={13} style={{ color: '#fbbf24', flexShrink: 0, marginTop: '1px' }} />
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', lineHeight: '1.6', margin: 0 }}>
                {delivered.length === 0 ? 'Payout unlocks after delivery + 7-day hold period.'
                  : `₹${locked.toLocaleString()} held for ${PAYOUT_LOCK_DAYS}-day return protection period.`}
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
  const [processing, setProc]   = useState(false);
  const go = async () => { setProc(true); try { await onConfirm(amount, note); onClose(); } finally { setProc(false); } };
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ backgroundColor: '#111', border: `1px solid ${GOLD}40`, borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '100%' }}>
        <h3 style={{ color: GOLD, fontFamily: 'Cinzel, serif', fontSize: '15px', letterSpacing: '0.1em', marginBottom: '6px' }}>Confirm Payout</h3>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '18px' }}>To: <strong style={{ color: '#fff' }}>{seller.sellerInfo?.bank?.name}</strong> · {seller.sellerInfo?.bank?.bankName}</p>
        <div style={{ backgroundColor: `${GOLD}08`, border: `1px solid ${GOLD}20`, borderRadius: '10px', padding: '14px', marginBottom: '16px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '0 0 6px' }}>Payout Amount</p>
          <p style={{ color: GOLD, fontSize: '32px', fontWeight: '700', margin: 0 }}>₹{amount.toLocaleString()}</p>
        </div>
        <label style={{ display: 'block', color: 'rgba(255,255,255,0.35)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>UTR / Reference</label>
        <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. UTR123456789"
          style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none', marginBottom: '12px' }}
          onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', lineHeight: '1.6', marginBottom: '16px' }}>Transfer to seller's bank first, then click Confirm.</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', border: `1px solid ${BORDER}`, borderRadius: '7px', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={go} disabled={processing}
            style={{ flex: 1, padding: '10px', backgroundColor: processing ? `${GOLD}80` : GOLD, border: 'none', borderRadius: '7px', color: '#000', fontSize: '13px', fontWeight: '700', cursor: processing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            {processing ? <><FiRefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</> : <><FiDollarSign size={12} /> Confirm Payout</>}
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
    // Load platform commission settings
    settingsAPI.get().then(res => {
      _commRate    = res.settings?.commissionRate ?? 0;
      _fixedCharge = res.settings?.fixedCharge   ?? 0;
    }).catch(() => {});
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

  // ✅ FIXED: handles both populated object {_id, name} and raw string ID
  const getSellerOrders = (sellerId) =>
    allOrders.filter(o =>
      o.orderItems?.some(item => {
        if (!item.seller) return false;
        const id = item.seller?._id || item.seller;
        return String(id) === String(sellerId);
      })
    );

  const getStats = (seller) => {
    const orders    = getSellerOrders(seller._id);
    const valid     = orders.filter(o => o.orderStatus !== 'Cancelled');
    const delivered = orders.filter(o => o.orderStatus === 'Delivered');
    const unlocked  = delivered.filter(o => o.deliveredAt && daysSince(o.deliveredAt) >= PAYOUT_LOCK_DAYS);

    // ✅ FIXED: subtract deliveryCharge from commission base
    const gross    = valid.reduce((s, o) => s + (o.totalPrice || 0), 0);
    const comm     = valid.reduce((s, o) => s + calcEarnings(o.totalPrice || 0, o.deliveryCharge || 0).commission, 0);
    const fixed    = valid.reduce((s, o) => s + calcEarnings(o.totalPrice || 0, o.deliveryCharge || 0).fixed, 0);
    const earn     = valid.reduce((s, o) => s + calcEarnings(o.totalPrice || 0, o.deliveryCharge || 0).earnings, 0);
    const unlEarn  = unlocked.reduce((s, o) => s + calcEarnings(o.totalPrice || 0, o.deliveryCharge || 0).earnings, 0);
    const paidOut  = seller.sellerInfo?.totalPaidOut || 0;
    const pending  = Math.max(0, unlEarn - paidOut);
    return { orders: orders.length, gross, comm, fixed, earn, paidOut, pending, deliveredCount: delivered.length, unlockedCount: unlocked.length };
  };

  const handleStatusChange = async (sellerId, newStatus) => {
    try {
      await userAPI.update(sellerId, { 'sellerInfo.status': newStatus });
      toast.success(`Seller ${newStatus}`);
      fetchData();
      if (selected?._id === sellerId) setSelected(s => ({ ...s, sellerInfo: { ...s.sellerInfo, status: newStatus } }));
    } catch { toast.error('Failed'); }
  };

  const handlePayout = async (amount, note) => {
    try {
      await userAPI.processPayout(payoutData.seller._id, { amount, note });
      toast.success(`✅ ₹${amount} payout recorded`);
      fetchData(); setSelected(null);
    } catch (e) { toast.error(e?.message || 'Payout failed'); throw e; }
  };

  const handleResetPayout = async (sellerId) => {
    try { await userAPI.clearPayoutHistory(sellerId); toast.success('Payout history cleared'); fetchData(); }
    catch (e) { toast.error(e?.message || 'Reset failed'); throw e; }
  };

  const handleSimulate = async (orderId) => {
    setSimulating(orderId);
    try {
      const res = await deliveryAPI.simulate(orderId);
      toast.success(`📦 ${res.newStatus}${res.payoutEligible ? ' · 💰 Payout unlocked!' : ''}`);
      fetchData();
    } catch (e) { toast.error(e?.message || 'Failed'); }
    finally { setSimulating(null); }
  };

  const handleNoReturnsApproval = async (sellerId, approve) => {
    try {
      const res = await userAPI.toggleNoReturnsApproval(sellerId, approve);
      toast.success(approve ? '✅ No-returns permission granted' : '🚫 No-returns permission revoked');
      fetchData();
      if (selected?._id === sellerId) setSelected(s => ({ ...s, sellerInfo: { ...s.sellerInfo, noReturnsApproved: approve, ...(!approve && { noReturnsEnabled: false }) } }));
    } catch { toast.error('Failed to update no-returns permission'); }
  };

  const totComm    = sellers.reduce((s, x) => s + getStats(x).comm, 0);
  const totPending = sellers.reduce((s, x) => s + getStats(x).pending, 0);
  const approved   = sellers.filter(s => s.sellerInfo?.status === 'approved').length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#080808' }}>
      {selected && <SellerModal seller={selected} orders={getSellerOrders(selected._id)} onClose={() => setSelected(null)} onStatusChange={handleStatusChange} simulating={simulating} onSimulate={handleSimulate} onPayout={(seller, amt) => { setSelected(null); setPayoutData({ seller, amount: amt }); }} onResetPayout={handleResetPayout} deliveryMode={deliveryMode} onToggleNoReturns={handleNoReturnsApproval} />}
      {payoutData && <PayoutModal seller={payoutData.seller} amount={payoutData.amount} onClose={() => setPayoutData(null)} onConfirm={handlePayout} />}

      {/* Header */}
      <div style={{ backgroundColor: '#050505', borderBottom: `1px solid ${BORDER}`, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 4px' }}>Admin Panel</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ color: GOLD, fontFamily: 'Cinzel, serif', fontSize: '18px', letterSpacing: '0.15em', margin: 0 }}>Sellers</h1>
            {deliveryMode && (
              <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', color: deliveryMode === 'live' ? '#4ade80' : '#fbbf24', backgroundColor: deliveryMode === 'live' ? 'rgba(74,222,128,0.1)' : 'rgba(251,191,36,0.1)' }}>
                {deliveryMode === 'live' ? '🟢 Shiprocket Live' : '🟡 Prototype Mode'}
              </span>
            )}
          </div>
        </div>
        <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.35)', fontSize: '12px', textDecoration: 'none' }}>
          <FiArrowLeft size={13} /> Dashboard
        </Link>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '28px 24px' }}>

        {/* Mode banner */}
        {deliveryMode === 'live' ? (
          <div style={{ backgroundColor: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '10px', padding: '13px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4ade80', flexShrink: 0 }} />
            <div>
              <p style={{ color: '#4ade80', fontSize: '12px', fontWeight: '600', margin: '0 0 2px' }}>Shiprocket Live — Connected</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>Real AWB generation, automatic status updates, live delivery rates active.</p>
            </div>
          </div>
        ) : (
          <div style={{ backgroundColor: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.18)', borderRadius: '10px', padding: '13px 18px', marginBottom: '20px' }}>
            <p style={{ color: '#fbbf24', fontSize: '12px', fontWeight: '600', margin: '0 0 4px' }}>Prototype Mode — Shiprocket not connected</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', lineHeight: '1.7', margin: 0 }}>
              Use "Next Step" in seller modal to simulate delivery. Payout unlocks <strong style={{ color: '#fff' }}>{PAYOUT_LOCK_DAYS} days</strong> after delivery.
              Set <code style={{ color: GOLD, backgroundColor: 'rgba(201,168,76,0.1)', padding: '1px 6px', borderRadius: '3px' }}>PROTOTYPE_MODE=false</code> to go live.
            </p>
          </div>
        )}

        {/* 7-day policy */}
        <div style={{ backgroundColor: 'rgba(96,165,250,0.04)', border: '1px solid rgba(96,165,250,0.14)', borderRadius: '10px', padding: '11px 16px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <FiClock size={13} style={{ color: '#60a5fa', flexShrink: 0 }} />
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>
            <strong style={{ color: '#60a5fa' }}>{PAYOUT_LOCK_DAYS}-Day Payout Policy:</strong> Payouts locked for {PAYOUT_LOCK_DAYS} days after delivery for return protection. Unlocks automatically.
          </p>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Total Sellers',       value: sellers.length,                        color: GOLD,      Icon: FiShoppingBag },
            { label: 'Platform Commission', value: `₹${totComm.toLocaleString()}`,        color: '#4ade80', Icon: FiTrendingUp  },
            { label: 'Pending Payouts',     value: `₹${totPending.toLocaleString()}`,     color: GOLD,      Icon: FiDollarSign  },
            { label: 'Approved',            value: approved,                              color: '#4ade80', Icon: FiCheck       },
          ].map(({ label, value, color, Icon }) => (
            <div key={label} style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '18px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                <Icon size={15} style={{ color }} />
              </div>
              <p style={{ color: '#fff', fontSize: '21px', fontWeight: '700', margin: '0 0 3px' }}>{value}</p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{label}</p>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', backgroundColor: color, opacity: 0.35 }} />
            </div>
          ))}
        </div>

        {/* Sellers table */}
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '13px 18px', borderBottom: `1px solid ${BORDER}`, backgroundColor: '#0a0a0a' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>All Sellers ({sellers.length})</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
              <thead>
                <tr>{['Seller', 'Business', 'Status', 'Orders', 'Gross', 'Commission', 'Earns', 'Paid Out', 'Pending', 'Lock', 'Actions'].map(h => (
                  <th key={h} style={thS}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {loading
                  ? [...Array(3)].map((_, i) => <tr key={i}>{[...Array(11)].map((_, j) => <td key={j} style={tdS}><div style={{ height: '13px', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '4px' }} /></td>)}</tr>)
                  : sellers.length === 0
                  ? <tr><td colSpan="11" style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>No sellers yet.</td></tr>
                  : sellers.map(seller => {
                      const st    = sellerStatusStyle[seller.sellerInfo?.status || 'pending'];
                      const stats = getStats(seller);
                      return (
                        <tr key={seller._id}
                          onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                          onMouseOut={e  => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <td style={tdS}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: `${GOLD}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <span style={{ color: GOLD, fontSize: '11px', fontWeight: '700' }}>{seller.name?.charAt(0).toUpperCase()}</span>
                              </div>
                              <div>
                                <p style={{ color: '#fff', fontSize: '12px', fontWeight: '500', margin: '0 0 1px' }}>{seller.name}</p>
                                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px', margin: 0 }}>{seller.email}</p>
                              </div>
                            </div>
                          </td>
                          <td style={tdS}><span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>{seller.sellerInfo?.businessName || '—'}</span></td>
                          <td style={tdS}><span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', color: st.color, backgroundColor: st.bg }}>{seller.sellerInfo?.status || 'pending'}</span></td>
                          <td style={tdS}><span style={{ color: '#fff', fontSize: '12px' }}>{stats.orders}</span></td>
                          <td style={tdS}><span style={{ color: '#fff', fontSize: '12px' }}>₹{stats.gross.toLocaleString()}</span></td>
                          <td style={tdS}><span style={{ color: '#4ade80', fontSize: '12px' }}>₹{stats.comm.toLocaleString()}</span></td>
                          <td style={tdS}><span style={{ color: '#60a5fa', fontSize: '12px' }}>₹{stats.earn.toLocaleString()}</span></td>
                          <td style={tdS}><span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>₹{stats.paidOut.toLocaleString()}</span></td>
                          <td style={tdS}>
                            {stats.pending > 0
                              ? <span style={{ color: GOLD, fontSize: '13px', fontWeight: '700' }}>₹{stats.pending.toLocaleString()}</span>
                              : <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}><FiLock size={9}/> —</span>}
                          </td>
                          <td style={tdS}>
                            {stats.unlockedCount > 0 ? <span style={{ color: '#4ade80', fontSize: '11px' }}>🔓 {stats.unlockedCount}</span>
                            : stats.deliveredCount > 0 ? <span style={{ color: '#fbbf24', fontSize: '11px' }}>🔒 {stats.deliveredCount}</span>
                            : <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '11px' }}>—</span>}
                          </td>
                          <td style={tdS}>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              <button onClick={() => setSelected(seller)} style={{ color: '#60a5fa', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <FiEye size={11}/> View
                              </button>
                              {stats.pending > 0
                                ? <button onClick={() => setPayoutData({ seller, amount: stats.pending })} style={{ color: GOLD, fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}><FiDollarSign size={11}/> Pay</button>
                                : <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}><FiLock size={9}/> Pay</span>}
                              {seller.sellerInfo?.status !== 'approved' && (
                                <button onClick={() => handleStatusChange(seller._id, 'approved')} style={{ color: '#4ade80', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}><FiCheck size={11}/> OK</button>
                              )}
                              {seller.sellerInfo?.status !== 'suspended' && (
                                <button onClick={() => handleStatusChange(seller._id, 'suspended')} style={{ color: '#f87171', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}><FiX size={11}/> Ban</button>
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