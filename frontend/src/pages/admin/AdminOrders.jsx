import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI, userAPI, deliveryAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiTrash2, FiAlertTriangle, FiRefreshCw, FiShield, FiUser,
  FiX, FiTruck, FiPackage, FiShoppingBag, FiDollarSign, FiMapPin,
  FiPhone, FiCalendar, FiCreditCard, FiTag, FiCheckCircle, FiPlay,
  FiFileText, FiArrowRight, FiRotateCcw, FiCheck
} from 'react-icons/fi';

const BG = '#0a0a0a';
const CARD = '#1a1a1a';
const BORDER = 'rgba(255,255,255,0.08)';
const GOLD = '#C9A84C';

const STATUS_OPTIONS = ['Processing', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

const sStyle = (s) => ({
  Processing: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  Confirmed: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  Shipped: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  'Out for Delivery': { color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
  Delivered: { color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  Cancelled: { color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
}[s] || { color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)' });

const thStyle = {
  color: 'rgba(255,255,255,0.35)', fontSize: '11px', letterSpacing: '0.15em',
  textTransform: 'uppercase', padding: '1rem 1.25rem', textAlign: 'left',
  borderBottom: `1px solid ${BORDER}`, backgroundColor: '#050505',
};
const tdStyle = { padding: '0.875rem 1.25rem', borderBottom: `1px solid ${BORDER}` };

const FLOW_STEPS = [
  { status: 'Processing', label: 'Processing', icon: '🕐' },
  { status: 'Confirmed', label: 'Confirmed', icon: '✅' },
  { status: 'Shipped', label: 'Shipped', icon: '📦' },
  { status: 'Out for Delivery', label: 'Out for Delivery', icon: '🚚' },
  { status: 'Delivered', label: 'Delivered', icon: '🎉' },
];

// ── Rich Order Detail Modal ───────────────────────────────────────
function OrderDetailModal({ open, order, onClose, onRefresh }) {
  const [confirmingOrder, setConfirmingOrder] = useState(false);
  const [markingReady, setMarkingReady] = useState(false);
  const [simulatingOrder, setSimulatingOrder] = useState(false);
  const [reversingPickup, setReversingPickup] = useState(false);
  const [returnActLoad, setReturnActLoad] = useState(false);

  if (!open || !order) return null;

  const s = sStyle(order.orderStatus);
  const isCOD = order.paymentMethod === 'COD';
  const addr = order.shippingAddress || {};
  const isCancelled = order.orderStatus === 'Cancelled';
  const isDelivered = ['Delivered', 'Return Requested', 'Return Approved', 'Return Rejected', 'Returned'].includes(order.orderStatus);
  const dc = order.deliveryCharge || order.shippingPrice || 0;
  const totalPrice = order.totalPrice || 0;

  const isProcessing = order.orderStatus === 'Processing';
  const isConfirmed = order.orderStatus === 'Confirmed';
  const canReady = isProcessing || isConfirmed;
  const hasTracking = !!order.trackingId;
  const canSimulate = hasTracking && !['Delivered', 'Cancelled'].includes(order.orderStatus) && !order.returnRequest;

  const rr = order.returnRequest;
  const hasReturn = !!rr;
  const isReturnApproved = rr?.status === 'Approved' || order.orderStatus === 'Return Approved';

  const stepIdx = FLOW_STEPS.findIndex(f => f.status === order.orderStatus);

  const handleConfirm = async () => {
    setConfirmingOrder(true);
    try {
      await orderAPI.confirm(order._id);
      toast.success('✅ Order confirmed!');
      await onRefresh(order._id);
    } catch (e) { toast.error(e?.message || 'Failed to confirm'); }
    finally { setConfirmingOrder(false); }
  };

  const handleMarkReady = async () => {
    setMarkingReady(true);
    try {
      const res = await deliveryAPI.markReady(order._id);
      toast.success(res.waybill ? `📦 Pickup scheduled! AWB: ${res.waybill}` : '✅ Ready — Shiprocket notified');
      await onRefresh(order._id);
    } catch (e) { toast.error(e?.message || 'Failed'); }
    finally { setMarkingReady(false); }
  };

  const handleSimulate = async () => {
    setSimulatingOrder(true);
    try {
      const res = await deliveryAPI.simulate(order._id);
      toast.success(`📦 ${res.newStatus}${res.payoutEligible ? ' · 💰 Payout unlocked!' : ''}`);
      await onRefresh(order._id);
    } catch (e) { toast.error(e?.message || 'Simulation failed'); }
    finally { setSimulatingOrder(false); }
  };

  const handleReversePickup = async () => {
    setReversingPickup(true);
    try {
      const res = await deliveryAPI.reversePickup(order._id);
      toast.success(res.message || `Reverse pickup scheduled! AWB: ${res.reverseAwb}`);
      await onRefresh(order._id);
    } catch (e) { toast.error(e?.message || 'Reverse pickup failed'); }
    finally { setReversingPickup(false); }
  };

  const handleReturnAction = async (action) => {
    setReturnActLoad(true);
    try {
      const res = await orderAPI.handleReturn(order._id, action, 'Processed by admin');
      toast.success(res.message || (action === 'approve' ? 'Return approved!' : 'Return rejected'));
      await onRefresh(order._id);
    } catch (e) { toast.error(e?.message || 'Action failed'); }
    finally { setReturnActLoad(false); }
  };

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
        borderRadius: '16px', maxWidth: '760px', width: '100%',
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
      }}>

        {/* Header */}
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
            <span style={{ fontSize: '11px', padding: '5px 14px', borderRadius: '20px', color: s.color, backgroundColor: s.bg, fontWeight: '700', border: `1px solid ${s.color}30` }}>
              {order.orderStatus}
            </span>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
              <FiX size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '22px 26px' }}>

          {/* Progress Bar */}
          {!isCancelled && (
            <div style={{ marginBottom: '22px', backgroundColor: '#0d0d0d', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '18px 20px' }}>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 16px' }}>Order Progress</p>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {FLOW_STEPS.map((step, i) => {
                  const isDone = isDelivered ? true : i < stepIdx;
                  const isCurrent = !isDelivered && i === stepIdx;
                  const stepS = sStyle(step.status);
                  return (
                    <div key={step.status} style={{ display: 'flex', alignItems: 'center', flex: i < FLOW_STEPS.length - 1 ? 1 : 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          backgroundColor: isDone || isCurrent ? stepS.bg : 'rgba(255,255,255,0.04)',
                          border: `2px solid ${isDone || isCurrent ? stepS.color : 'rgba(255,255,255,0.1)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px',
                          boxShadow: isCurrent ? `0 0 12px ${stepS.color}50` : 'none',
                        }}>
                          {step.icon}
                        </div>
                        <p style={{ color: isDone || isCurrent ? stepS.color : 'rgba(255,255,255,0.2)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, fontWeight: isCurrent ? '700' : '400', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {step.label}
                        </p>
                      </div>
                      {i < FLOW_STEPS.length - 1 && (
                        <div style={{ flex: 1, height: '2px', margin: '0 4px', marginBottom: '22px', backgroundColor: isDone ? stepS.color : 'rgba(255,255,255,0.08)' }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons — mirrors seller dashboard exactly */}
          {!isCancelled && !isDelivered && (
            <div style={{ marginBottom: '20px', backgroundColor: '#0d0d0d', border: `1px solid ${GOLD}25`, borderRadius: '12px', padding: '16px 20px' }}>
              <p style={{ color: GOLD, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 14px', fontWeight: '600' }}>⚡ Quick Actions</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>

                {/* Step 1: Confirm */}
                {isProcessing && (
                  <button onClick={handleConfirm} disabled={confirmingOrder}
                    style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 18px', backgroundColor: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.35)', borderRadius: '8px', color: '#60a5fa', fontSize: '13px', fontWeight: '600', cursor: confirmingOrder ? 'not-allowed' : 'pointer', opacity: confirmingOrder ? 0.7 : 1 }}>
                    {confirmingOrder ? <FiRefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <FiCheckCircle size={13} />}
                    {confirmingOrder ? 'Confirming…' : 'Confirm Order'}
                  </button>
                )}

                {isProcessing && <FiArrowRight size={14} style={{ color: 'rgba(255,255,255,0.15)' }} />}

                {/* Step 2: Ready for Pickup → Shiprocket */}
                {canReady && (
                  <button onClick={handleMarkReady} disabled={markingReady}
                    style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 18px', backgroundColor: `${GOLD}15`, border: `1px solid ${GOLD}40`, borderRadius: '8px', color: GOLD, fontSize: '13px', fontWeight: '600', cursor: markingReady ? 'not-allowed' : 'pointer', opacity: markingReady ? 0.7 : 1 }}>
                    {markingReady ? <FiRefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <FiTruck size={13} />}
                    {markingReady ? 'Scheduling…' : 'Ready for Pickup → Shiprocket'}
                  </button>
                )}

                {canSimulate && <FiArrowRight size={14} style={{ color: 'rgba(255,255,255,0.15)' }} />}

                {/* Step 3: Simulate next delivery step */}
                {canSimulate && (
                  <button onClick={handleSimulate} disabled={simulatingOrder}
                    style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 18px', backgroundColor: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '8px', color: '#a78bfa', fontSize: '13px', fontWeight: '600', cursor: simulatingOrder ? 'not-allowed' : 'pointer', opacity: simulatingOrder ? 0.7 : 1 }}>
                    {simulatingOrder ? <FiRefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <FiPlay size={13} />}
                    {simulatingOrder ? 'Simulating…' : 'Simulate Next Step'}
                  </button>
                )}

                {hasTracking && !canSimulate && (
                  <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px' }}>Tracking active — awaiting courier updates</span>
                )}
                {!isProcessing && !canReady && !canSimulate && !hasTracking && (
                  <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px' }}>No actions available</span>
                )}
              </div>

              {/* AWB badge */}
              {hasTracking && (
                <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.18)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FiTruck size={13} style={{ color: '#60a5fa', flexShrink: 0 }} />
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 2px' }}>AWB / Tracking No.</p>
                    <p style={{ color: '#60a5fa', fontSize: '13px', fontWeight: '700', margin: 0, fontFamily: 'monospace', letterSpacing: '2px' }}>{order.trackingId}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Delivered banner */}
          {isDelivered && !hasReturn && (
            <div style={{ marginBottom: '20px', padding: '14px 18px', backgroundColor: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '22px' }}>🎉</span>
              <div>
                <p style={{ color: '#4ade80', fontSize: '13px', fontWeight: '700', margin: '0 0 2px' }}>Order Delivered Successfully</p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: 0 }}>{order.trackingId ? `AWB: ${order.trackingId}` : 'No tracking ID'}</p>
              </div>
            </div>
          )}

          {/* Return Request banner & reverse pickup */}
          {hasReturn && (
            <div style={{ marginBottom: '20px', padding: '16px 20px', backgroundColor: '#0d0d0d', border: `1px solid ${rr.status === 'Approved' ? 'rgba(74,222,128,0.3)' : rr.status === 'Rejected' ? 'rgba(248,113,113,0.3)' : 'rgba(251,191,36,0.3)'}`, borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiRotateCcw size={16} style={{ color: rr.status === 'Approved' ? '#4ade80' : rr.status === 'Rejected' ? '#f87171' : '#fbbf24' }} />
                  <p style={{ color: '#fff', fontSize: '14px', fontWeight: '600', margin: 0 }}>Return Request: {rr.status}</p>
                </div>
                {isReturnApproved && !rr.reversePickupScheduled && (
                  <button onClick={handleReversePickup} disabled={reversingPickup}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.35)', borderRadius: '6px', color: '#60a5fa', fontSize: '12px', fontWeight: '600', cursor: reversingPickup ? 'not-allowed' : 'pointer' }}>
                    {reversingPickup ? <FiRefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <FiTruck size={12} />}
                    {reversingPickup ? 'Scheduling…' : 'Schedule Reverse Pickup'}
                  </button>
                )}
                {rr.status === 'Pending' && !rr.reversePickupScheduled && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleReturnAction('approve')} disabled={returnActLoad}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 14px', backgroundColor: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '6px', color: '#4ade80', fontSize: '11px', fontWeight: '600', cursor: returnActLoad ? 'not-allowed' : 'pointer' }}>
                      {returnActLoad ? <FiRefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <FiCheck size={11} />} Approve
                    </button>
                    <button onClick={() => handleReturnAction('reject')} disabled={returnActLoad}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 14px', backgroundColor: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '6px', color: '#f87171', fontSize: '11px', fontWeight: '600', cursor: returnActLoad ? 'not-allowed' : 'pointer' }}>
                      <FiX size={11} /> Reject
                    </button>
                  </div>
                )}
                {rr.reversePickupScheduled && (
                  <span style={{ fontSize: '11px', padding: '4px 10px', backgroundColor: 'rgba(96,165,250,0.1)', color: '#60a5fa', borderRadius: '20px', border: '1px solid rgba(96,165,250,0.3)' }}>
                    🔄 Reverse AWB: {rr.reverseAwb}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 4px' }}>Reason: <strong style={{ color: '#fff' }}>{rr.reasonLabel || rr.reason}</strong></p>
                  {rr.note && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 4px' }}>Note: {rr.note}</p>}
                  {rr.upiId && <p style={{ color: GOLD, fontSize: '11px', margin: 0, fontWeight: '500' }}>UPI: {rr.upiId}</p>}
                </div>
                {rr.images?.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {rr.images.map((img, i) => (
                      <img key={i} src={img.url} alt="Evidence" onClick={() => window.open(img.url, '_blank')}
                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: `1px solid ${BORDER}` }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4-col Meta Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '18px' }}>
            {[
              { icon: FiCalendar, label: 'Order Date', value: new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), iconColor: '#a78bfa' },
              { icon: FiCreditCard, label: 'Payment', value: isCOD ? '💵 COD' : '✅ Prepaid', iconColor: isCOD ? '#fbbf24' : '#4ade80', highlight: isCOD },
              { icon: FiTag, label: 'Items', value: `${order.orderItems?.length || 0} item${(order.orderItems?.length || 0) !== 1 ? 's' : ''}`, iconColor: '#60a5fa' },
              { icon: FiDollarSign, label: 'Total', value: `₹${totalPrice.toLocaleString()}`, iconColor: GOLD },
            ].map(({ icon: Icon, label, value, iconColor, highlight }) => (
              <div key={label} style={{ backgroundColor: '#0d0d0d', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
                  <Icon size={12} style={{ color: iconColor }} />
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>{label}</p>
                </div>
                <p style={{ color: highlight ? '#fbbf24' : '#fff', fontSize: '13px', fontWeight: '600', margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Customer + Source row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
            <div>
              <p style={{ color: GOLD, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 10px', fontWeight: '600' }}>Customer & Delivery</p>
              <div style={{ backgroundColor: '#0d0d0d', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: `${GOLD}15`, border: `1px solid ${GOLD}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FiUser size={13} style={{ color: GOLD }} />
                  </div>
                  <div>
                    <p style={{ color: '#fff', fontSize: '13px', fontWeight: '600', margin: '0 0 2px' }}>{order.user?.name || addr.fullName || '—'}</p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0 }}>{order.user?.email || '—'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <FiMapPin size={12} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', lineHeight: '1.7', margin: 0 }}>
                    {addr.addressLine1 || '—'}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}<br />
                    {[addr.city, addr.state].filter(Boolean).join(', ')}{addr.pincode ? ` — ${addr.pincode}` : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <FiPhone size={12} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: 0 }}>{addr.phone || order.user?.phone || '—'}</p>
                </div>
              </div>
            </div>

            <div>
              <p style={{ color: GOLD, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 10px', fontWeight: '600' }}>
                {order.orderItems?.some(i => i.seller) ? 'Seller Info' : 'Source'}
              </p>
              <div style={{ backgroundColor: '#0d0d0d', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '16px', height: 'calc(100% - 28px)', boxSizing: 'border-box' }}>
                {order.orderItems?.some(i => i.seller) ? (() => {
                  const seller = order.orderItems.find(i => i.seller)?.seller;
                  return (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <FiUser size={13} style={{ color: '#60a5fa' }} />
                        </div>
                        <div>
                          <p style={{ color: '#60a5fa', fontSize: '13px', fontWeight: '600', margin: '0 0 2px' }}>{seller?.name || 'Seller'}</p>
                          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0 }}>{seller?.email || '—'}</p>
                        </div>
                      </div>
                      <div style={{ padding: '8px 10px', backgroundColor: 'rgba(96,165,250,0.05)', border: '1px solid rgba(96,165,250,0.15)', borderRadius: '6px' }}>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: 0 }}>🏪 Third-party seller order</p>
                      </div>
                    </>
                  );
                })() : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: `${GOLD}15`, border: `1px solid ${GOLD}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FiShield size={13} style={{ color: GOLD }} />
                      </div>
                      <div>
                        <p style={{ color: GOLD, fontSize: '13px', fontWeight: '600', margin: '0 0 2px' }}>Admin Order</p>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0 }}>Direct platform sale</p>
                      </div>
                    </div>
                    <div style={{ padding: '8px 10px', backgroundColor: `${GOLD}06`, border: `1px solid ${GOLD}15`, borderRadius: '6px' }}>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: 0 }}>👑 Fulfilled by Trendorra admin</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Items Ordered */}
          <p style={{ color: GOLD, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 10px', fontWeight: '600' }}>Items Ordered</p>
          <div style={{ backgroundColor: '#0d0d0d', border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden', marginBottom: '18px' }}>
            {(order.orderItems || []).map((item, i) => {
              const imgSrc = item.image || item.product?.images?.[0]?.url || item.product?.images?.[0];
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px', borderBottom: i < (order.orderItems.length - 1) ? `1px solid ${BORDER}` : 'none' }}>
                  {imgSrc
                    ? <img src={imgSrc} alt="" style={{ width: '40px', height: '50px', objectFit: 'cover', borderRadius: '5px', backgroundColor: '#1a1a1a', flexShrink: 0 }} />
                    : <div style={{ width: '40px', height: '50px', borderRadius: '5px', backgroundColor: '#1a1a1a', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiPackage size={14} style={{ color: 'rgba(255,255,255,0.2)' }} /></div>
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#fff', fontSize: '13px', fontWeight: '500', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name || item.product?.name || '—'}</p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '0 0 2px' }}>Qty: {item.quantity} × ₹{(item.price || 0).toLocaleString()}</p>
                    {item.size && <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', margin: '0 0 3px' }}>Size: {item.size}</p>}
                    {item.seller && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', backgroundColor: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '20px' }}>
                        <FiUser size={9} style={{ color: '#60a5fa' }} />
                        <span style={{ color: '#60a5fa', fontSize: '10px' }}>{item.seller?.name || 'Seller'}</span>
                      </span>
                    )}
                  </div>
                  <p style={{ color: '#fff', fontSize: '13px', fontWeight: '700', margin: 0, flexShrink: 0 }}>₹{((item.price || 0) * (item.quantity || 1)).toLocaleString()}</p>
                </div>
              );
            })}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#080808', borderTop: `1px solid ${BORDER}` }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{dc > 0 ? `+ ₹${dc} delivery charge` : 'Free delivery'}</span>
              <span style={{ color: '#fff', fontSize: '14px', fontWeight: '700' }}>Total: ₹{totalPrice.toLocaleString()}</span>
            </div>
          </div>

          {/* Status History timeline */}
          {order.statusHistory?.length > 0 && (
            <>
              <p style={{ color: GOLD, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 10px', fontWeight: '600' }}>Status History</p>
              <div style={{ backgroundColor: '#0d0d0d', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '16px' }}>
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
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 26px', borderTop: `1px solid ${BORDER}`, backgroundColor: '#0d0d0d', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', margin: 0 }}>
            Placed {new Date(order.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            {!isCancelled && (
              <button
                onClick={() => window.open(deliveryAPI.getLabel(order._id), '_blank')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', backgroundColor: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '6px', color: '#4ade80', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                <FiFileText size={12} /> 📄 Download Bill
              </button>
            )}
            <button onClick={onClose} style={{ padding: '9px 28px', backgroundColor: GOLD, border: 'none', borderRadius: '6px', color: '#000', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div >
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
      style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ backgroundColor: '#1a1a1a', border: `1px solid ${accentColor}44`, borderRadius: '14px', padding: '32px', maxWidth: '460px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: `${accentColor}15`, border: `1px solid ${accentColor}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiAlertTriangle size={22} style={{ color: accentColor }} />
          </div>
          <div>
            <p style={{ color: accentColor, fontFamily: 'Cinzel, serif', fontSize: '15px', letterSpacing: '0.1em', marginBottom: '3px' }}>{title}</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>{subtitle}</p>
          </div>
        </div>
        <div style={{ backgroundColor: `${accentColor}0d`, border: `1px solid ${accentColor}25`, borderRadius: '8px', padding: '16px', marginBottom: '22px' }}>
          {lines.map((line, i) => (
            <p key={i} style={{ color: i === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.45)', fontSize: i === 0 ? '13px' : '12px', lineHeight: '1.75', marginTop: i > 0 ? '8px' : 0 }}>{line}</p>
          ))}
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${accentColor}20`, display: 'flex', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>🚫</span>
            <p style={{ color: accentColor, fontSize: '12px', fontWeight: '600' }}>Once deleted, this data can NEVER be recovered.</p>
          </div>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', marginBottom: '8px' }}>Type <strong style={{ color: accentColor }}>DELETE</strong> to confirm</p>
        <input autoFocus type="text" value={typed} onChange={e => setTyped(e.target.value)} placeholder="Type DELETE here…"
          style={{ width: '100%', backgroundColor: '#0d0d0d', border: `1px solid ${typed === 'DELETE' ? accentColor : 'rgba(255,255,255,0.1)'}`, borderRadius: '6px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box', marginBottom: '20px' }} />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'rgba(255,255,255,0.45)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => ready && onConfirm()} disabled={!ready}
            style={{ flex: 1, padding: '11px', backgroundColor: ready ? accentColor : `${accentColor}15`, border: `1px solid ${ready ? accentColor : `${accentColor}25`}`, borderRadius: '6px', color: ready ? '#fff' : `${accentColor}44`, fontSize: '13px', fontWeight: '700', cursor: ready ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
            {loading ? <><FiRefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Deleting…</> : <><FiTrash2 size={13} /> Delete Forever</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Orders Table ──────────────────────────────────────────────────
function OrdersTable({ orders, loading, updating, onStatusUpdate, onOpenDetail, source }) {
  const isAdmin = source === 'admin';
  const cols = ['Order ID', 'Customer', 'Date', 'Items', 'Total', isAdmin ? 'Source' : 'Seller', 'Status', 'Update'];

  return (
    <div className="admin-orders-wrap overflow-x-auto" style={{ backgroundColor: CARD, border: `1px solid ${isAdmin ? `${GOLD}30` : 'rgba(96,165,250,0.2)'}`, borderRadius: '8px' }}>
      <style>{`
        @media (max-width: 768px) {
          .admin-orders-card { display: block !important; width: 100% !important; }
          .admin-orders-card thead { display: none !important; }
          .admin-orders-card tbody { display: block !important; width: 100% !important; }
          .admin-orders-card tr { display: flex !important; flex-direction: column !important; border: 1px solid rgba(255,255,255,0.08) !important; border-radius: 12px !important; margin-bottom: 12px !important; padding: 12px !important; background: #0a0a0a !important; }
          .admin-orders-card td { display: flex !important; justify-content: space-between !important; align-items: center !important; padding: 6px 0 !important; border: none !important; }
          .admin-orders-card td::before { content: attr(data-label); color: rgba(255,255,255,0.4); font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; margin-right: 12px; }
          .admin-orders-wrap { background: transparent !important; border: none !important; padding: 0 !important; }
        }
      `}</style>
      <table className="admin-orders-card w-full">
        <thead><tr>{cols.map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
        <tbody>
          {loading
            ? [...Array(3)].map((_, i) => <tr key={i}>{[...Array(cols.length)].map((_, j) => <td key={j} style={tdStyle}><div className="skeleton h-4 rounded" /></td>)}</tr>)
            : orders.length === 0
              ? <tr><td colSpan={cols.length} style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>No orders found.</td></tr>
              : orders.map(order => {
                const sellerItems = order.orderItems?.filter(i => i.seller) || [];
                const hasSellerItems = sellerItems.length > 0;
                const firstSeller = sellerItems[0]?.seller;
                const s = sStyle(order.orderStatus);
                return (
                  <tr key={order._id} onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td data-label="Order ID" style={tdStyle}>
                      <button onClick={() => onOpenDetail(order)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <span style={{ color: GOLD, fontSize: '13px', fontWeight: '600', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px' }}>#{order._id.slice(-8).toUpperCase()}</span>
                      </button>
                    </td>
                    <td data-label="Customer" style={tdStyle}>
                      <div>
                        <p className="font-body text-sm font-medium text-white m-0 leading-tight">{order.user?.name}</p>
                        <p className="font-body text-xs m-0 leading-tight" style={{ color: 'rgba(255,255,255,0.35)' }}>{order.user?.email}</p>
                      </div>
                    </td>
                    <td data-label="Date" style={tdStyle}><span className="font-body text-sm whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.5)' }}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></td>
                    <td data-label="Items" style={tdStyle}><span className="font-body text-sm text-white">{order.orderItems?.length}</span></td>
                    <td data-label="Total" style={tdStyle}><span className="font-body text-sm font-medium text-white">₹{order.totalPrice?.toLocaleString()}</span></td>
                    <td data-label={isAdmin ? 'Source' : 'Seller'} style={tdStyle}>
                      {isAdmin ? (
                        hasSellerItems ? (
                          <div className="flex items-center gap-1.5 justify-end">
                            <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'rgba(96,165,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><FiUser size={9} style={{ color: '#60a5fa' }} /></div>
                            <div className="text-right">
                              <p className="font-body text-xs font-semibold m-0 leading-tight" style={{ color: '#60a5fa' }}>{firstSeller?.name || 'Seller'}</p>
                              <p className="font-body m-0 leading-tight" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{firstSeller?.email || ''}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 justify-end">
                            <FiShield size={11} style={{ color: GOLD }} />
                            <span className="font-body text-xs font-semibold" style={{ color: GOLD }}>Admin</span>
                          </div>
                        )
                      ) : (
                        <div className="flex items-center gap-1.5 justify-end">
                          <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'rgba(96,165,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><FiUser size={9} style={{ color: '#60a5fa' }} /></div>
                          <p className="font-body text-xs m-0" style={{ color: '#60a5fa' }}>{firstSeller?.name || 'Seller'}</p>
                        </div>
                      )}
                    </td>
                    <td data-label="Status" style={tdStyle}><span className="text-xs font-body px-2 py-1" style={{ color: s.color, backgroundColor: s.bg, borderRadius: '4px' }}>{order.orderStatus}</span></td>
                    <td data-label="Update" style={tdStyle}>
                      <select value={order.orderStatus} onChange={e => onStatusUpdate(order._id, e.target.value)} disabled={updating === order._id}
                        className="text-xs font-body px-2 py-1.5 focus:outline-none"
                        style={{ backgroundColor: '#0a0a0a', border: `1px solid ${BORDER}`, color: '#fff', borderRadius: '4px' }}>
                        {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })
          }
        </tbody>
      </table>
    </div>
  );
}

// ── AdminOrders Main ──────────────────────────────────────────────
export function AdminOrders() {
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [updating, setUpdating] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderAPI.getAll({ page, limit: 200, status: filterStatus });
      setAllOrders(res.orders || []);
      setPagination({ pages: res.pages, total: res.total });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [page, filterStatus]);

  // Refresh a single order inside modal after action buttons fire
  const handleRefreshOrder = async (orderId) => {
    try {
      const res = await orderAPI.getAll({ page, limit: 200, status: filterStatus });
      const fresh = (res.orders || []).find(o => o._id === orderId);
      if (fresh) setSelectedOrder(fresh);
      setAllOrders(res.orders || []);
    } catch { /* silent */ }
  };

  const adminOrders = allOrders.filter(o => !o.orderItems?.some(i => i.seller));
  const sellerOrders = allOrders.filter(o => o.orderItems?.some(i => i.seller));

  const sellerGroups = sellerOrders.reduce((acc, order) => {
    const sellerItem = order.orderItems?.find(i => i.seller);
    const sellerId = sellerItem?.seller?._id || sellerItem?.seller || 'unknown';
    const sellerName = sellerItem?.seller?.name || 'Unknown Seller';
    const sellerEmail = sellerItem?.seller?.email || '';
    if (!acc[sellerId]) acc[sellerId] = { name: sellerName, email: sellerEmail, orders: [] };
    acc[sellerId].orders.push(order);
    return acc;
  }, {});
  const sellerIds = Object.keys(sellerGroups);

  const visibleOrders = activeTab === 'all' ? allOrders : activeTab === 'admin' ? adminOrders : sellerGroups[activeTab]?.orders || [];

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await orderAPI.updateStatus(orderId, { orderStatus: newStatus });
      toast.success(`Updated to ${newStatus}`);
      setAllOrders(prev => prev.map(o => o._id === orderId ? { ...o, orderStatus: newStatus } : o));
      if (selectedOrder?._id === orderId) setSelectedOrder(prev => prev ? { ...prev, orderStatus: newStatus } : null);
    } catch { toast.error('Failed'); }
    finally { setUpdating(null); }
  };

  const handleResetOrders = async () => {
    setResetLoading(true);
    try { await userAPI.deleteAllOrders(); setShowResetModal(false); toast.success('All orders deleted'); fetchOrders(); }
    catch { toast.error('Failed'); }
    finally { setResetLoading(false); }
  };

  const tabs = [
    { key: 'all', label: `All Orders (${allOrders.length})`, color: GOLD },
    { key: 'admin', label: `👑 Admin (${adminOrders.length})`, color: GOLD },
    ...sellerIds.map(id => ({ key: id, label: `🏪 ${sellerGroups[id].name} (${sellerGroups[id].orders.length})`, color: '#60a5fa' })),
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>
      <OrderDetailModal open={!!selectedOrder} order={selectedOrder} onClose={() => setSelectedOrder(null)} onRefresh={handleRefreshOrder} />
      <DangerModal open={showResetModal} onClose={() => setShowResetModal(false)} onConfirm={handleResetOrders} loading={resetLoading} title="Delete All Orders" subtitle="Orders · All Time" accentColor="#f87171" lines={['⚠️ You are about to permanently delete ALL order records.', 'Every order — Processing, Confirmed, Shipped, Delivered, Cancelled — will be wiped.']} />

      <div className="px-6 py-5 flex items-center justify-between" style={{ backgroundColor: '#050505', borderBottom: `1px solid ${BORDER}` }}>
        <div>
          <p className="font-body text-xs tracking-[0.2em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Admin Panel</p>
          <h1 className="font-accent text-xl tracking-[0.2em]" style={{ color: GOLD }}>Orders</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowResetModal(true)} className="flex items-center gap-1.5 font-body text-xs" style={{ color: '#f87171', background: 'none', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer' }}>
            <FiTrash2 size={12} /> Reset Orders
          </button>
          <Link to="/admin" className="font-body text-xs flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.4)' }}><FiArrowLeft size={13} /> Dashboard</Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-5 flex-wrap">
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="px-3 py-2.5 text-sm font-body focus:outline-none" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: '#fff', borderRadius: '6px' }}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
          <div className="flex gap-2 flex-wrap">
            <span className="font-body text-xs px-3 py-1.5 rounded-full" style={{ backgroundColor: `${GOLD}15`, color: GOLD, border: `1px solid ${GOLD}30` }}>👑 Admin: {adminOrders.length}</span>
            <span className="font-body text-xs px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.25)' }}>🏪 Seller: {sellerOrders.length}</span>
            {sellerIds.map(id => <span key={id} className="font-body text-xs px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(96,165,250,0.06)', color: 'rgba(96,165,250,0.7)', border: '1px solid rgba(96,165,250,0.15)' }}>{sellerGroups[id].name}: {sellerGroups[id].orders.length}</span>)}
          </div>
          <p className="font-body text-sm ml-auto" style={{ color: 'rgba(255,255,255,0.3)' }}>{allOrders.length} total</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className="px-4 py-2 font-body text-xs transition-all"
              style={{ backgroundColor: activeTab === tab.key ? tab.color : 'transparent', color: activeTab === tab.key ? (tab.key === 'all' || tab.key === 'admin' ? '#000' : '#fff') : 'rgba(255,255,255,0.45)', border: `1px solid ${activeTab === tab.key ? tab.color : BORDER}`, borderRadius: '6px', fontWeight: activeTab === tab.key ? '700' : '400' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'all' ? (
          <>
            {adminOrders.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <div style={{ width: '3px', height: '20px', backgroundColor: GOLD, borderRadius: '2px' }} />
                  <FiShield size={14} style={{ color: GOLD }} />
                  <h2 className="font-body text-sm font-semibold" style={{ color: GOLD }}>Admin Products Orders</h2>
                  <span className="font-body text-xs px-2 py-0.5 rounded" style={{ backgroundColor: `${GOLD}15`, color: GOLD }}>{adminOrders.length} orders</span>
                </div>
                <OrdersTable orders={adminOrders} loading={false} updating={updating} onStatusUpdate={handleStatusUpdate} onOpenDetail={setSelectedOrder} source="admin" />
              </div>
            )}
            {sellerIds.map(id => (
              <div key={id} className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <div style={{ width: '3px', height: '20px', backgroundColor: '#60a5fa', borderRadius: '2px' }} />
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(96,165,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><FiUser size={11} style={{ color: '#60a5fa' }} /></div>
                  <div>
                    <p className="font-body text-sm font-semibold" style={{ color: '#60a5fa' }}>🏪 {sellerGroups[id].name}</p>
                    <p className="font-body" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{sellerGroups[id].email}</p>
                  </div>
                  <span className="font-body text-xs px-2 py-0.5 rounded ml-1" style={{ backgroundColor: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}>{sellerGroups[id].orders.length} orders</span>
                </div>
                <OrdersTable orders={sellerGroups[id].orders} loading={false} updating={updating} onStatusUpdate={handleStatusUpdate} onOpenDetail={setSelectedOrder} source="seller" />
              </div>
            ))}
            {allOrders.length === 0 && !loading && <div className="text-center py-16" style={{ color: 'rgba(255,255,255,0.2)' }}><p className="font-body text-sm">No orders found.</p></div>}
          </>
        ) : (
          <OrdersTable orders={visibleOrders} loading={loading} updating={updating} onStatusUpdate={handleStatusUpdate} onOpenDetail={setSelectedOrder} source={activeTab === 'admin' ? 'admin' : 'seller'} />
        )}

        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {[...Array(pagination.pages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className="w-8 h-8 text-sm font-body transition-all"
                style={{ backgroundColor: page === i + 1 ? GOLD : 'transparent', color: page === i + 1 ? '#fff' : 'rgba(255,255,255,0.4)', border: `1px solid ${page === i + 1 ? GOLD : BORDER}`, borderRadius: '4px' }}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── AdminUsers (unchanged) ────────────────────────────────────────
export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchUsers = async () => {
    setLoading(true);
    try { const res = await userAPI.getAll({ page, limit: 20 }); setUsers(res.users); setPagination({ pages: res.pages, total: res.total }); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchUsers(); }, [page]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try { await userAPI.delete(id); toast.success('User deleted'); fetchUsers(); } catch { toast.error('Failed'); }
  };
  const handleRoleToggle = async (user) => {
    try { await userAPI.update(user._id, { role: user.role === 'admin' ? 'user' : 'admin' }); toast.success('Role updated'); fetchUsers(); } catch { toast.error('Failed'); }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>
      <div className="px-6 py-5 flex items-center justify-between" style={{ backgroundColor: '#050505', borderBottom: `1px solid ${BORDER}` }}>
        <div>
          <p className="font-body text-xs tracking-[0.2em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Admin Panel</p>
          <h1 className="font-accent text-xl tracking-[0.2em]" style={{ color: GOLD }}>Users</h1>
        </div>
        <Link to="/admin" className="font-body text-xs flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.4)' }}><FiArrowLeft size={13} /> Dashboard</Link>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <p className="font-body text-sm mb-6" style={{ color: 'rgba(255,255,255,0.3)' }}>{pagination.total} users</p>
        <div className="overflow-x-auto" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '8px' }}>
          <table className="w-full">
            <thead><tr>{['User', 'Phone', 'Role', 'Joined', 'Status', 'Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {loading
                ? [...Array(5)].map((_, i) => <tr key={i}>{[...Array(6)].map((_, j) => <td key={j} style={tdStyle}><div className="skeleton h-4 rounded" /></td>)}</tr>)
                : users.map(user => (
                  <tr key={user._id} onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={tdStyle}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0" style={{ backgroundColor: GOLD }}>{user.name?.charAt(0).toUpperCase()}</div>
                        <div>
                          <p className="font-body font-medium text-sm text-white">{user.name}</p>
                          <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}><span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{user.phone || '—'}</span></td>
                    <td style={tdStyle}><span className="text-xs font-body px-2 py-1" style={user.role === 'admin' ? { color: GOLD, backgroundColor: 'rgba(201,168,76,0.1)' } : user.role === 'seller' ? { color: '#60a5fa', backgroundColor: 'rgba(96,165,250,0.1)' } : { color: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.05)' }}>{user.role}</span></td>
                    <td style={tdStyle}><span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></td>
                    <td style={tdStyle}><span className="font-body text-xs" style={{ color: user.isActive ? '#4ade80' : '#f87171' }}>{user.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td style={tdStyle}>
                      <div className="flex gap-3">
                        {user.role !== 'seller' && <button onClick={() => handleRoleToggle(user)} className="font-body text-xs hover:underline" style={{ color: '#60a5fa' }}>{user.role === 'admin' ? 'Make User' : 'Make Admin'}</button>}
                        <button onClick={() => handleDelete(user._id)} className="font-body text-xs hover:underline" style={{ color: '#f87171' }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminOrders;