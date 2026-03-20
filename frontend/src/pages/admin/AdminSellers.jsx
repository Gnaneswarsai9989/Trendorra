import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userAPI, orderAPI } from '../../services/api';
import toast from 'react-hot-toast';
import axios from 'axios';
import {
  FiArrowLeft, FiShoppingBag, FiDollarSign,
  FiCheck, FiX, FiAlertCircle, FiRefreshCw,
  FiEye, FiCopy, FiPackage, FiTrendingUp, FiTruck,
  FiPlay, FiLock,
} from 'react-icons/fi';

const BG     = '#0a0a0a';
const CARD   = '#1a1a1a';
const BORDER = 'rgba(255,255,255,0.08)';
const GOLD   = '#C9A84C';

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
const calcEarnings = (price) => {
  const p          = Number(price) || 0;
  const commission = Math.round(p * COMMISSION_RATE);
  const fixed      = FIXED_FEE(p);
  return { commission, fixed, total_deduction: commission + fixed, earnings: p - commission - fixed };
};

const statusColor = {
  pending:   { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)'  },
  approved:  { color: '#4ade80', bg: 'rgba(74,222,128,0.1)'  },
  suspended: { color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
};

const orderStatusStyle = (s) => ({
  Processing:         { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)'  },
  Confirmed:          { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
  Shipped:            { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  'Out for Delivery': { color: '#fb923c', bg: 'rgba(251,146,60,0.1)'  },
  Delivered:          { color: '#4ade80', bg: 'rgba(74,222,128,0.1)'  },
  Cancelled:          { color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
}[s] || { color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.05)' });

const thStyle = { color: 'rgba(255,255,255,0.35)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '11px 14px', textAlign: 'left', borderBottom: `1px solid ${BORDER}`, backgroundColor: '#050505', whiteSpace: 'nowrap' };
const tdStyle = { padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, verticalAlign: 'middle' };

function CopyBtn({ value, label }) {
  return (
    <button onClick={() => { navigator.clipboard.writeText(value); toast.success(`${label} copied!`); }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '2px', marginLeft: '4px' }}
      onMouseOver={e => e.currentTarget.style.color = GOLD} onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
      <FiCopy size={11} />
    </button>
  );
}

function InfoRow({ label, value, highlight, copy }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${BORDER}` }}>
      <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', fontFamily: 'inherit', flexShrink: 0, marginRight: '10px' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ color: highlight ? GOLD : '#fff', fontSize: '13px', fontFamily: 'inherit', fontWeight: highlight ? '600' : '400', textAlign: 'right', wordBreak: 'break-all' }}>{value || '—'}</span>
        {copy && value && <CopyBtn value={value} label={label} />}
      </div>
    </div>
  );
}

// ── Seller Detail + Orders Modal ─────────────────────────────────
function SellerModal({ seller, orders, onClose, onStatusChange, onPayout, onSimulate, simulating }) {
  const validOrders     = orders.filter(o => o.orderStatus !== 'Cancelled');
  const deliveredOrders = orders.filter(o => o.orderStatus === 'Delivered');
  const grossRevenue    = validOrders.reduce((s, o) => s + (o.totalPrice || 0), 0);
  const totalCommission = validOrders.reduce((s, o) => s + calcEarnings(o.totalPrice || 0).commission, 0);
  const totalFixed      = validOrders.reduce((s, o) => s + calcEarnings(o.totalPrice || 0).fixed, 0);
  const totalEarnings   = validOrders.reduce((s, o) => s + calcEarnings(o.totalPrice || 0).earnings, 0);

  // ── Payout is only on DELIVERED orders ────────────────────────
  const deliveredEarnings = deliveredOrders.reduce((s, o) => s + calcEarnings(o.totalPrice || 0).earnings, 0);
  const totalPaidOut      = seller.sellerInfo?.totalPaidOut || 0;
  const pendingPayout     = Math.max(0, deliveredEarnings - totalPaidOut);
  const canPayout         = pendingPayout > 0 && deliveredOrders.length > 0;

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ backgroundColor: '#1a1a1a', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '28px', maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>
          <div>
            <h3 style={{ color: GOLD, fontFamily: 'Cinzel, serif', fontSize: '16px', letterSpacing: '0.1em', margin: '0 0 5px' }}>{seller.sellerInfo?.businessName || seller.name}</h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontFamily: 'inherit', margin: 0 }}>{seller.email} · {seller.phone}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '22px' }}>×</button>
        </div>

        {/* ── PAYOUT CALCULATION ── */}
        <div style={{ backgroundColor: `${GOLD}08`, border: `1px solid ${GOLD}30`, borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <p style={{ color: GOLD, fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 14px', fontFamily: 'inherit', fontWeight: '600' }}>
            💰 Auto Payout Calculation
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '12px' }}>
            {[
              { label: 'Gross Revenue',      value: `₹${grossRevenue.toLocaleString()}`,    color: '#fff'     },
              { label: 'Commission (10%)',    value: `- ₹${totalCommission.toLocaleString()}`, color: '#f87171' },
              { label: 'Fixed Fees',         value: `- ₹${totalFixed.toLocaleString()}`,    color: '#fbbf24'  },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ backgroundColor: '#0d0d0d', borderRadius: '8px', padding: '12px' }}>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: '0 0 3px', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
                <p style={{ color, fontSize: '15px', fontWeight: '600', margin: 0, fontFamily: 'inherit' }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Example */}
          <div style={{ backgroundColor: '#0d0d0d', borderRadius: '8px', padding: '11px 14px', marginBottom: '12px' }}>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: '0 0 3px', fontFamily: 'inherit' }}>Example calculation</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', lineHeight: '1.6', margin: 0, fontFamily: 'inherit' }}>
              ₹1,000 sale − ₹100 (10%) − ₹30 (fixed) = <strong style={{ color: '#4ade80' }}>₹870 seller payout</strong>
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div style={{ backgroundColor: '#4ade8015', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '8px', padding: '13px' }}>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: '0 0 3px', fontFamily: 'inherit' }}>TOTAL EARNINGS</p>
              <p style={{ color: '#4ade80', fontSize: '18px', fontWeight: '700', margin: 0, fontFamily: 'inherit' }}>₹{totalEarnings.toLocaleString()}</p>
            </div>
            <div style={{ backgroundColor: '#60a5fa15', border: '1px solid rgba(96,165,250,0.3)', borderRadius: '8px', padding: '13px' }}>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: '0 0 3px', fontFamily: 'inherit' }}>ALREADY PAID</p>
              <p style={{ color: '#60a5fa', fontSize: '18px', fontWeight: '700', margin: 0, fontFamily: 'inherit' }}>₹{totalPaidOut.toLocaleString()}</p>
            </div>
            <div style={{ backgroundColor: canPayout ? `${GOLD}15` : 'rgba(255,255,255,0.04)', border: `1px solid ${canPayout ? `${GOLD}40` : BORDER}`, borderRadius: '8px', padding: '13px' }}>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', margin: '0 0 3px', fontFamily: 'inherit' }}>PENDING PAYOUT</p>
              <p style={{ color: canPayout ? GOLD : 'rgba(255,255,255,0.3)', fontSize: '18px', fontWeight: '700', margin: 0, fontFamily: 'inherit' }}>₹{pendingPayout.toLocaleString()}</p>
              {!canPayout && <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', margin: '3px 0 0', fontFamily: 'inherit' }}>Only after delivery</p>}
            </div>
          </div>
        </div>

        {/* ── Orders table with simulate button ── */}
        {orders.length > 0 && (
          <div style={{ backgroundColor: '#0d0d0d', border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden', marginBottom: '18px' }}>
            <div style={{ padding: '11px 16px', borderBottom: `1px solid ${BORDER}`, backgroundColor: '#050505', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'inherit', margin: 0 }}>Orders & Delivery Status</p>
              <span style={{ color: 'rgba(251,191,36,0.7)', fontSize: '10px', fontFamily: 'inherit', padding: '3px 8px', backgroundColor: 'rgba(251,191,36,0.08)', borderRadius: '10px' }}>🟡 Prototype Mode</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                {['Order', 'Sale Price', '−Commission', '−Fixed', 'Seller Earns', 'Tracking', 'Status', 'Simulate'].map(h => (
                  <th key={h} style={{ ...thStyle, fontSize: '9px', padding: '9px 12px' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {orders.map(order => {
                  const { commission, fixed, earnings } = calcEarnings(order.totalPrice || 0);
                  const cancelled = order.orderStatus === 'Cancelled';
                  const delivered = order.orderStatus === 'Delivered';
                  const s = orderStatusStyle(order.orderStatus);
                  const canSim = !cancelled && !delivered;
                  return (
                    <tr key={order._id} style={{ opacity: cancelled ? 0.5 : 1 }}>
                      <td style={{ ...tdStyle, padding: '9px 12px' }}><span style={{ color: GOLD, fontSize: '11px', fontFamily: 'inherit' }}>#{order._id.slice(-6).toUpperCase()}</span></td>
                      <td style={{ ...tdStyle, padding: '9px 12px' }}><span style={{ color: '#fff', fontSize: '12px', fontFamily: 'inherit' }}>₹{order.totalPrice?.toLocaleString()}</span></td>
                      <td style={{ ...tdStyle, padding: '9px 12px' }}><span style={{ color: '#f87171', fontSize: '11px', fontFamily: 'inherit' }}>−₹{commission}</span></td>
                      <td style={{ ...tdStyle, padding: '9px 12px' }}><span style={{ color: '#fbbf24', fontSize: '11px', fontFamily: 'inherit' }}>−₹{fixed}</span></td>
                      <td style={{ ...tdStyle, padding: '9px 12px' }}><span style={{ color: cancelled ? '#f87171' : '#4ade80', fontSize: '12px', fontWeight: '700', fontFamily: 'inherit' }}>{cancelled ? 'Cancelled' : `₹${earnings}`}</span></td>
                      <td style={{ ...tdStyle, padding: '9px 12px' }}><span style={{ color: '#60a5fa', fontSize: '10px', fontFamily: 'inherit' }}>{order.trackingId || '—'}</span></td>
                      <td style={{ ...tdStyle, padding: '9px 12px' }}>
                        <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '20px', color: s.color, backgroundColor: s.bg, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, padding: '9px 12px' }}>
                        {canSim ? (
                          <button onClick={() => onSimulate(order._id)} disabled={simulating === order._id}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 9px', backgroundColor: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: '5px', color: '#60a5fa', fontSize: '10px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                            {simulating === order._id ? <FiRefreshCw size={9} style={{ animation: 'spin 1s linear infinite' }} /> : <FiPlay size={9} />}
                            {simulating === order._id ? '…' : 'Next Step'}
                          </button>
                        ) : (
                          <span style={{ color: delivered ? '#4ade80' : 'rgba(255,255,255,0.2)', fontSize: '10px', fontFamily: 'inherit' }}>
                            {delivered ? '✅ Done' : '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ padding: '10px 16px', borderTop: `1px solid ${BORDER}`, backgroundColor: '#050505' }}>
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', fontFamily: 'inherit', margin: 0 }}>
                💡 <strong style={{ color: 'rgba(255,255,255,0.45)' }}>Prototype:</strong> Click "Next Step" to simulate Delhivery updating the delivery status. When status reaches <strong style={{ color: '#4ade80' }}>Delivered</strong>, payout becomes available.
              </p>
            </div>
          </div>
        )}

        {/* Bank details */}
        <div style={{ backgroundColor: `${GOLD}08`, border: `1px solid ${GOLD}22`, borderRadius: '10px', padding: '16px', marginBottom: '18px' }}>
          <p style={{ color: GOLD, fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 10px', fontFamily: 'inherit' }}>💳 Bank Account</p>
          <InfoRow label="Account Holder" value={seller.sellerInfo?.bank?.name}     highlight />
          <InfoRow label="Bank"           value={seller.sellerInfo?.bank?.bankName} />
          <InfoRow label="Account No."    value={seller.sellerInfo?.bank?.account}  copy highlight />
          <InfoRow label="IFSC"           value={seller.sellerInfo?.bank?.ifsc}     copy highlight />
        </div>

        {/* Payout instructions */}
        <div style={{ backgroundColor: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '8px', padding: '14px', marginBottom: '18px' }}>
          <p style={{ color: '#4ade80', fontSize: '12px', fontWeight: '600', margin: '0 0 8px', fontFamily: 'inherit' }}>💸 How to Send Payout</p>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', lineHeight: '1.7', margin: 0, fontFamily: 'inherit' }}>
            1. Open bank app → NEFT / IMPS / UPI<br />
            2. Account: <strong style={{ color: '#fff' }}>{seller.sellerInfo?.bank?.account || 'N/A'}</strong> · IFSC: <strong style={{ color: '#fff' }}>{seller.sellerInfo?.bank?.ifsc || 'N/A'}</strong><br />
            3. Name: <strong style={{ color: '#fff' }}>{seller.sellerInfo?.bank?.name || 'N/A'}</strong> · Amount: <strong style={{ color: GOLD }}>₹{pendingPayout.toLocaleString()}</strong><br />
            4. After transfer → click "Confirm Payout" → enter UTR number
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {seller.sellerInfo?.status !== 'approved' && (
            <button onClick={() => onStatusChange(seller._id, 'approved')}
              style={{ flex: 1, padding: '10px', backgroundColor: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '6px', color: '#4ade80', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <FiCheck size={13} /> Approve
            </button>
          )}
          {seller.sellerInfo?.status !== 'suspended' && (
            <button onClick={() => onStatusChange(seller._id, 'suspended')}
              style={{ flex: 1, padding: '10px', backgroundColor: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '6px', color: '#f87171', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <FiX size={13} /> Suspend
            </button>
          )}
          {/* Payout — only enabled after delivery */}
          <button
            onClick={() => canPayout && onPayout(seller, pendingPayout)}
            disabled={!canPayout}
            title={!canPayout ? 'Payout available only after order is Delivered' : `Pay ₹${pendingPayout}`}
            style={{
              flex: 1, padding: '10px',
              backgroundColor: canPayout ? `${GOLD}18` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${canPayout ? `${GOLD}35` : BORDER}`,
              borderRadius: '6px',
              color: canPayout ? GOLD : 'rgba(255,255,255,0.2)',
              fontSize: '13px',
              cursor: canPayout ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit', fontWeight: '600',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}>
            {canPayout
              ? <><FiDollarSign size={13} /> Pay ₹{pendingPayout.toLocaleString()}</>
              : <><FiLock size={13} /> Payout Locked</>
            }
          </button>
        </div>
        {!canPayout && (
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', textAlign: 'center', marginTop: '10px', fontFamily: 'inherit' }}>
            🔒 Payout unlocks automatically when order status reaches <strong style={{ color: '#4ade80' }}>Delivered</strong>
          </p>
        )}
      </div>
    </div>
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

  const inp = { width: '100%', boxSizing: 'border-box', backgroundColor: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'inherit', marginBottom: '14px' };

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ backgroundColor: '#1a1a1a', border: `1px solid ${GOLD}40`, borderRadius: '12px', padding: '28px', maxWidth: '420px', width: '100%' }}>
        <h3 style={{ color: GOLD, fontFamily: 'Cinzel, serif', fontSize: '15px', letterSpacing: '0.1em', marginBottom: '6px' }}>Confirm Payout</h3>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '18px', fontFamily: 'inherit' }}>
          To: <strong style={{ color: '#fff' }}>{seller.sellerInfo?.bank?.name}</strong> · {seller.sellerInfo?.bank?.bankName}
        </p>
        <div style={{ backgroundColor: `${GOLD}08`, border: `1px solid ${GOLD}20`, borderRadius: '8px', padding: '14px', marginBottom: '18px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '0 0 6px', fontFamily: 'inherit' }}>Payout Amount</p>
          <p style={{ color: GOLD, fontSize: '28px', fontWeight: '700', margin: 0, fontFamily: 'inherit' }}>₹{amount.toLocaleString()}</p>
        </div>
        <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '7px', fontFamily: 'inherit' }}>UTR / Reference Number</label>
        <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. UTR123456789 / March settlement" style={inp}
          onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        <div style={{ backgroundColor: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '8px', padding: '12px', marginBottom: '18px' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', lineHeight: '1.6', margin: 0, fontFamily: 'inherit' }}>
            ⚠️ Transfer the money to seller's bank first, then click Confirm to record it in the system.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', backgroundColor: 'transparent', border: `1px solid ${BORDER}`, borderRadius: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={handleConfirm} disabled={processing}
            style={{ flex: 1, padding: '11px', backgroundColor: processing ? `${GOLD}80` : GOLD, border: 'none', borderRadius: '6px', color: '#000', fontSize: '13px', fontWeight: '700', cursor: processing ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            {processing ? <><FiRefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> …</> : <><FiDollarSign size={13} /> Confirm Payout</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main AdminSellers ─────────────────────────────────────────────
export default function AdminSellers() {
  const [sellers,    setSellers]    = useState([]);
  const [allOrders,  setAllOrders]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState(null);
  const [payoutData, setPayoutData] = useState(null);
  const [simulating, setSimulating] = useState(null); // orderId being simulated

  useEffect(() => { fetchData(); }, []);

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
    allOrders.filter(o => String(o.seller) === String(sellerId) || String(o.user?._id) === String(sellerId));

  const getStats = (seller) => {
    const orders      = getSellerOrders(seller._id);
    const valid       = orders.filter(o => o.orderStatus !== 'Cancelled');
    const delivered   = orders.filter(o => o.orderStatus === 'Delivered');
    const gross       = valid.reduce((s, o) => s + (o.totalPrice || 0), 0);
    const commission  = valid.reduce((s, o) => s + calcEarnings(o.totalPrice || 0).commission, 0);
    const fixed       = valid.reduce((s, o) => s + calcEarnings(o.totalPrice || 0).fixed, 0);
    const earnings    = valid.reduce((s, o) => s + calcEarnings(o.totalPrice || 0).earnings, 0);
    // Only delivered orders are payout-eligible
    const deliveredEarnings = delivered.reduce((s, o) => s + calcEarnings(o.totalPrice || 0).earnings, 0);
    const paidOut     = seller.sellerInfo?.totalPaidOut || 0;
    const pending     = Math.max(0, deliveredEarnings - paidOut);
    return { orders: orders.length, gross, commission, fixed, earnings, deliveredEarnings, paidOut, pending, deliveredCount: delivered.length };
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
      fetchData();
      setSelected(null);
    } catch (e) { toast.error(e?.message || 'Payout failed'); throw e; }
  };

  // ── Prototype: simulate next delivery step ────────────────────
  const handleSimulate = async (orderId) => {
    setSimulating(orderId);
    try {
      const token = localStorage.getItem('trendora_token');
      const res = await axios.post(`/api/delivery/simulate/${orderId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { newStatus, payoutEligible } = res.data;
      toast.success(`📦 Status → ${newStatus}${payoutEligible ? ' · 💰 Payout UNLOCKED!' : ''}`);
      fetchData();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Simulate failed');
    } finally { setSimulating(null); }
  };

  const platformCommission = sellers.reduce((s, seller) => s + getStats(seller).commission, 0);
  const totalPending       = sellers.reduce((s, seller) => s + getStats(seller).pending, 0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>

      {/* Modals */}
      {selected && (
        <SellerModal
          seller={selected}
          orders={getSellerOrders(selected._id)}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          simulating={simulating}
          onSimulate={handleSimulate}
          onPayout={(seller, amt) => { setSelected(null); setPayoutData({ seller, amount: amt }); }}
        />
      )}
      {payoutData && (
        <PayoutModal
          seller={payoutData.seller}
          amount={payoutData.amount}
          onClose={() => setPayoutData(null)}
          onConfirm={handlePayout}
        />
      )}

      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between" style={{ backgroundColor: '#050505', borderBottom: `1px solid ${BORDER}` }}>
        <div>
          <p className="font-body text-xs tracking-[0.2em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Admin Panel</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 className="font-accent text-xl tracking-[0.2em]" style={{ color: GOLD }}>Sellers</h1>
            <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', color: '#fbbf24', backgroundColor: 'rgba(251,191,36,0.1)', fontFamily: 'inherit' }}>🟡 Prototype Mode</span>
          </div>
        </div>
        <Link to="/admin" className="flex items-center gap-1 font-body text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <FiArrowLeft size={13} /> Dashboard
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Prototype info banner */}
        <div style={{ backgroundColor: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '10px', padding: '14px 18px', marginBottom: '24px' }}>
          <p style={{ color: '#fbbf24', fontSize: '12px', fontWeight: '600', margin: '0 0 4px', fontFamily: 'inherit' }}>🟡 Prototype / Demo Mode</p>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', lineHeight: '1.6', margin: 0, fontFamily: 'inherit' }}>
            Delhivery API is <strong style={{ color: '#fff' }}>not connected yet</strong>. Use the <strong style={{ color: '#fff' }}>"Next Step"</strong> button inside each seller's orders to simulate delivery status updates. When status reaches <strong style={{ color: '#4ade80' }}>Delivered</strong>, the Payout button automatically unlocks. When ready to go live, swap <code style={{ color: GOLD, backgroundColor: 'rgba(201,168,76,0.1)', padding: '1px 6px', borderRadius: '3px' }}>DELHIVERY_SANDBOX=false</code> in your .env and add your API token.
          </p>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '28px' }}>
          {[
            { label: 'Total Sellers',       value: sellers.length,                          color: GOLD,      icon: FiShoppingBag },
            { label: 'Platform Commission', value: `₹${platformCommission.toLocaleString()}`, color: '#4ade80', icon: FiTrendingUp  },
            { label: 'Pending Payouts',     value: `₹${totalPending.toLocaleString()}`,     color: GOLD,      icon: FiDollarSign  },
            { label: 'Approved Sellers',    value: sellers.filter(s => s.sellerInfo?.status === 'approved').length, color: '#4ade80', icon: FiCheck },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                <Icon size={15} style={{ color }} />
              </div>
              <p style={{ color: '#fff', fontSize: '22px', fontWeight: '700', fontFamily: 'inherit', margin: '0 0 4px' }}>{value}</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'inherit', margin: 0 }}>{label}</p>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', backgroundColor: color, opacity: 0.4 }} />
            </div>
          ))}
        </div>

        {/* Sellers table */}
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
              <thead><tr>
                {['Seller', 'Business', 'Status', 'Orders', 'Gross', 'Commission', 'Earnings', 'Paid Out', 'Pending', 'Bank', 'Actions'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {loading
                  ? [...Array(3)].map((_, i) => (
                      <tr key={i}>{[...Array(11)].map((_, j) => <td key={j} style={tdStyle}><div style={{ height: '14px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} /></td>)}</tr>
                    ))
                  : sellers.length === 0
                    ? <tr><td colSpan="11" style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontFamily: 'inherit' }}>No sellers yet.</td></tr>
                    : sellers.map(seller => {
                        const st    = statusColor[seller.sellerInfo?.status || 'pending'];
                        const stats = getStats(seller);
                        return (
                          <tr key={seller._id}
                            onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                            onMouseOut={e  => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <td style={tdStyle}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: `${GOLD}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <span style={{ color: GOLD, fontSize: '11px', fontWeight: '700' }}>{seller.name?.charAt(0).toUpperCase()}</span>
                                </div>
                                <div>
                                  <p style={{ color: '#fff', fontSize: '12px', fontWeight: '500', margin: '0 0 1px', fontFamily: 'inherit' }}>{seller.name}</p>
                                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', margin: 0, fontFamily: 'inherit' }}>{seller.email}</p>
                                </div>
                              </div>
                            </td>
                            <td style={tdStyle}><span style={{ color: '#fff', fontSize: '12px', fontFamily: 'inherit' }}>{seller.sellerInfo?.businessName || '—'}</span></td>
                            <td style={tdStyle}><span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '20px', color: st.color, backgroundColor: st.bg, fontFamily: 'inherit' }}>{seller.sellerInfo?.status || 'pending'}</span></td>
                            <td style={tdStyle}><span style={{ color: '#fff', fontSize: '12px', fontFamily: 'inherit' }}>{stats.orders}</span></td>
                            <td style={tdStyle}><span style={{ color: '#fff', fontSize: '12px', fontFamily: 'inherit' }}>₹{stats.gross.toLocaleString()}</span></td>
                            <td style={tdStyle}><span style={{ color: '#4ade80', fontSize: '12px', fontFamily: 'inherit' }}>₹{stats.commission.toLocaleString()}</span></td>
                            <td style={tdStyle}><span style={{ color: '#60a5fa', fontSize: '12px', fontFamily: 'inherit' }}>₹{stats.earnings.toLocaleString()}</span></td>
                            <td style={tdStyle}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontFamily: 'inherit' }}>₹{stats.paidOut.toLocaleString()}</span></td>
                            <td style={tdStyle}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                {stats.pending > 0
                                  ? <span style={{ color: GOLD, fontSize: '13px', fontWeight: '700', fontFamily: 'inherit' }}>₹{stats.pending.toLocaleString()}</span>
                                  : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}><FiLock size={10} /> —</span>
                                }
                              </div>
                            </td>
                            <td style={tdStyle}>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontFamily: 'inherit' }}>
                                  {seller.sellerInfo?.bank?.account ? `****${seller.sellerInfo.bank.account.slice(-4)}` : '—'}
                                </span>
                                {seller.sellerInfo?.bank?.account && <CopyBtn value={seller.sellerInfo.bank.account} label="Account" />}
                              </div>
                            </td>
                            <td style={tdStyle}>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <button onClick={() => setSelected(seller)}
                                  style={{ color: '#60a5fa', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <FiEye size={11} /> View
                                </button>
                                {stats.pending > 0 ? (
                                  <button onClick={() => setPayoutData({ seller, amount: stats.pending })}
                                    style={{ color: GOLD, fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <FiDollarSign size={11} /> Pay
                                  </button>
                                ) : (
                                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <FiLock size={10} /> Pay
                                  </span>
                                )}
                                {seller.sellerInfo?.status !== 'approved' && (
                                  <button onClick={() => handleStatusChange(seller._id, 'approved')}
                                    style={{ color: '#4ade80', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <FiCheck size={11} /> OK
                                  </button>
                                )}
                                {seller.sellerInfo?.status !== 'suspended' && (
                                  <button onClick={() => handleStatusChange(seller._id, 'suspended')}
                                    style={{ color: '#f87171', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '3px' }}>
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