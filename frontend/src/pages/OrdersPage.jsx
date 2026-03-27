import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderAPI, deliveryAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiPackage, FiCheck, FiCopy, FiPrinter, FiTruck, FiMapPin, FiClock, FiRotateCcw } from 'react-icons/fi';

const BG = '#111111';
const BG2 = '#0a0a0a';
const BORDER = 'rgba(255,255,255,0.08)';
const GOLD = '#C9A84C';
const STATUS_STEPS = ['Processing', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'];

const statusStyle = (s) => ({
  Processing: { color: '#fbbf24', backgroundColor: 'rgba(251,191,36,0.1)' },
  Confirmed: { color: '#60a5fa', backgroundColor: 'rgba(96,165,250,0.1)' },
  Shipped: { color: '#a78bfa', backgroundColor: 'rgba(167,139,250,0.1)' },
  'Out for Delivery': { color: '#fb923c', backgroundColor: 'rgba(251,146,60,0.1)' },
  Delivered: { color: '#4ade80', backgroundColor: 'rgba(74,222,128,0.1)' },
  Cancelled: { color: '#f87171', backgroundColor: 'rgba(248,113,113,0.1)' },
}[s] || { color: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.05)' });

// Returns true if delivery date is within the last N days
const isWithinDays = (dateStr, days) => {
  if (!dateStr) return false;
  const diff = Date.now() - new Date(dateStr).getTime();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
};

export function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { orderAPI.getMyOrders().then(res => setOrders(res.orders || [])).finally(() => setLoading(false)); }, []);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 max-w-4xl mx-auto" style={{ backgroundColor: BG }}>
      <div className="mb-10">
        <p className="section-subtitle">Purchase History</p>
        <h1 className="section-title">My Orders</h1>
      </div>
      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded" />)}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-24">
          <FiPackage size={64} className="mx-auto mb-6" style={{ color: 'rgba(255,255,255,0.1)' }} />
          <h2 className="font-display text-3xl font-light text-white mb-3">No orders yet</h2>
          <Link to="/shop" className="btn-gold-filled px-8 py-3 inline-block mt-4">Shop Now</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <Link key={order._id} to={`/orders/${order._id}`}
              className="block p-5 transition-all"
              style={{ backgroundColor: BG2, border: `1px solid ${BORDER}` }}
              onMouseOver={e => e.currentTarget.style.borderColor = GOLD}
              onMouseOut={e => e.currentTarget.style.borderColor = BORDER}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-body font-medium text-sm text-white">#{order._id.slice(-8).toUpperCase()}</p>
                  <p className="font-body text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-body px-3 py-1 font-medium" style={statusStyle(order.orderStatus)}>
                    {order.orderStatus}
                  </span>
                  <span className="font-body font-medium text-white">₹{order.totalPrice?.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex gap-2 overflow-hidden">
                {order.orderItems?.slice(0, 4).map(item => (
                  <img key={item._id} src={item.image || item.product?.images?.[0]?.url} alt=""
                    className="w-12 h-14 object-cover flex-shrink-0" />
                ))}
                {order.orderItems?.length > 4 && (
                  <div className="w-12 h-14 flex items-center justify-center text-sm font-body"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                    +{order.orderItems.length - 4}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function OrderDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [scans, setScans] = useState([]);
  const [showScans, setShowScans] = useState(false);
  const [scansLoading, setScansLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [returnImgView, setReturnImgView] = useState(null);

  useEffect(() => { orderAPI.getById(id).then(res => setOrder(res.order)).finally(() => setLoading(false)); }, [id]);

  const handleCancel = async () => {
    const wasPaidOnline = order?.isPaid && order?.paymentMethod !== 'COD';
    const msg = wasPaidOnline
      ? 'Cancel this order? A ₹50 cancellation fee will be deducted. Remaining amount will be refunded in 5-7 business days.'
      : 'Are you sure you want to cancel this order?';
    if (!window.confirm(msg)) return;
    setCancelling(true);
    try {
      const res = await orderAPI.cancel(id);
      toast.success(res.message || 'Order cancelled');
      setOrder(prev => ({ ...prev, orderStatus: 'Cancelled', refundAmount: res.refundAmount, cancellationFee: res.cancellationFee }));
    } catch (err) {
      toast.error(err.message || 'Cannot cancel this order');
    } finally { setCancelling(false); }
  };

  const handleCopyAWB = () => {
    navigator.clipboard.writeText(order.trackingId || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleLoadScans = async () => {
    if (showScans) { setShowScans(false); return; }
    if (!order?.trackingId) return;
    setScansLoading(true);
    try {
      const res = await deliveryAPI.track(order.trackingId);
      const shipData = res?.data?.ShipmentData?.[0]?.Shipment || res?.ShipmentData?.[0]?.Shipment;
      setScans(shipData?.Scans || []);
      setShowScans(true);
    } catch { setScans([]); setShowScans(true); }
    finally { setScansLoading(false); }
  };

  const handlePrintLabel = () => {
    const url = deliveryAPI.getLabel(order._id);
    window.open(url, '_blank');
  };

  // Find the delivered timestamp from statusHistory
  const deliveredEntry = order?.statusHistory?.find(h => h.status === 'Delivered');
  const deliveredAt = deliveredEntry?.timestamp || order?.deliveredAt;

  // Show return/refund button only if delivered AND within 6 days
  const showReturnButton = order?.orderStatus === 'Delivered' && isWithinDays(deliveredAt, 6);

  // Days remaining for return window
  const returnDaysLeft = deliveredAt
    ? Math.max(0, 6 - Math.floor((Date.now() - new Date(deliveredAt).getTime()) / (24 * 60 * 60 * 1000)))
    : 0;

  if (loading) return <div className="min-h-screen" style={{ backgroundColor: BG }}><div className="max-w-4xl mx-auto px-6 py-12"><div className="skeleton h-96 rounded" /></div></div>;
  if (!order) return <div className="text-center py-24" style={{ backgroundColor: BG }}><h2 className="font-display text-3xl text-white">Order not found</h2></div>;

  const currentStep = STATUS_STEPS.indexOf(order.orderStatus);
  const isSeller = user?.role === 'seller' || user?.role === 'admin';

  const historyMap = {};
  (order.statusHistory || []).forEach(h => { historyMap[h.status] = h; });

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 max-w-4xl mx-auto" style={{ backgroundColor: BG }}>
      <Link to="/orders" className="font-body text-sm hover:text-gold mb-8 inline-block transition-colors"
        style={{ color: 'rgba(255,255,255,0.4)' }}>← Back to Orders</Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 gap-4">
        <div>
          <p className="section-subtitle">Order Details</p>
          <h1 className="font-display text-3xl font-light text-white">#{order._id.slice(-8).toUpperCase()}</h1>
          <p className="font-body text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-3 self-start flex-wrap">
          <span className="text-sm font-body px-4 py-2 font-medium" style={statusStyle(order.orderStatus)}>
            {order.orderStatus}
          </span>

          {/* Return & Refund button — only within 6 days of delivery */}
          {showReturnButton && (
            <Link
              to={`/orders/${order._id}/return`}
              className="font-body text-xs px-4 py-2 flex items-center gap-1.5 transition-colors"
              style={{
                border: `1px solid rgba(167,139,250,0.4)`,
                color: '#a78bfa',
                borderRadius: '4px',
                backgroundColor: 'rgba(167,139,250,0.06)',
              }}
              title={`Return window closes in ${returnDaysLeft} day${returnDaysLeft !== 1 ? 's' : ''}`}
            >
              <FiRotateCcw size={12} />
              Return &amp; Refund
              <span style={{
                fontSize: '9px',
                backgroundColor: 'rgba(167,139,250,0.2)',
                color: '#a78bfa',
                padding: '1px 5px',
                borderRadius: '10px',
                marginLeft: '2px',
              }}>
                {returnDaysLeft}d left
              </span>
            </Link>
          )}

          {/* Print Label — sellers & admins only */}
          {isSeller && order.trackingId && (
            <button onClick={handlePrintLabel}
              className="font-body text-xs px-4 py-2 flex items-center gap-1.5 transition-colors"
              style={{ border: `1px solid ${GOLD}40`, color: GOLD, borderRadius: '4px', backgroundColor: `${GOLD}08` }}>
              <FiPrinter size={12} /> Print Label
            </button>
          )}

          {!['Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Return Requested', 'Return Approved', 'Return Rejected', 'Returned'].includes(order.orderStatus) && (
            <button onClick={handleCancel} disabled={cancelling}
              className="font-body text-xs px-4 py-2 transition-colors"
              style={{ border: '1px solid rgba(248,113,113,0.4)', color: '#f87171', borderRadius: '4px', backgroundColor: cancelling ? 'rgba(248,113,113,0.05)' : 'transparent' }}>
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}
        </div>
      </div>

      {/* Return Request details */}
      {order.returnRequest && (
        <div className="mb-8 p-5 rounded-xl border" style={{ backgroundColor: BG2, borderColor: order.returnRequest.status === 'Approved' ? 'rgba(74,222,128,0.3)' : order.returnRequest.status === 'Rejected' ? 'rgba(248,113,113,0.3)' : 'rgba(251,191,36,0.3)' }}>
          <div className="flex items-center gap-2 mb-4">
            <FiRotateCcw size={18} style={{ color: order.returnRequest.status === 'Approved' ? '#4ade80' : order.returnRequest.status === 'Rejected' ? '#f87171' : '#fbbf24' }} />
            <h3 className="font-display text-lg text-white">Return Request: {order.returnRequest.status}</h3>
          </div>

          {/* Return status mini-timeline */}
          <div className="flex items-center mb-5" style={{ gap: 0 }}>
            {['Pending', 'Approved', 'Rejected'].map((step, i) => {
              const isActive = order.returnRequest.status === step;
              const isDone = (step === 'Approved' && order.returnRequest.status === 'Approved') || (step === 'Pending' && ['Approved','Rejected'].includes(order.returnRequest.status));
              const color = step === 'Approved' ? '#4ade80' : step === 'Rejected' ? '#f87171' : '#fbbf24';
              const show = step !== 'Rejected' || order.returnRequest.status === 'Rejected';
              if (!show && step === 'Rejected') return null;
              return (
                <div key={step} style={{ display: 'flex', alignItems: 'center', flex: step === 'Pending' ? 1 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isActive || isDone ? `${color}25` : 'rgba(255,255,255,0.05)', border: `2px solid ${isActive || isDone ? color : 'rgba(255,255,255,0.12)'}`, boxShadow: isActive ? `0 0 10px ${color}50` : 'none', transition: 'all 0.3s', flexShrink: 0 }}>
                      {isDone && !isActive ? <FiCheck size={12} style={{ color }} /> : <span style={{ fontSize: '9px', color: isActive || isDone ? color : 'rgba(255,255,255,0.25)', fontWeight: '700' }}>{i + 1}</span>}
                    </div>
                    <p style={{ fontSize: '9px', marginTop: '5px', color: isActive || isDone ? color : 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{step}</p>
                  </div>
                  {step === 'Pending' && (
                    <div style={{ flex: 1, height: '2px', marginBottom: '18px', background: order.returnRequest.status !== 'Pending' ? (order.returnRequest.status === 'Approved' ? '#4ade80' : '#f87171') : 'rgba(255,255,255,0.08)', margin: '0 8px 18px', transition: 'background 0.3s', minWidth: '24px' }} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-6 text-sm font-body mb-4">
            <div>
              <p style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px', marginBottom: '4px' }}>Requested On</p>
              <p className="text-white">{new Date(order.returnRequest.requestedAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px', marginBottom: '4px' }}>Reason</p>
              <p className="text-white">{order.returnRequest.reasonLabel || order.returnRequest.reason}</p>
            </div>
            {order.returnRequest.note && (
              <div>
                <p style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px', marginBottom: '4px' }}>Your Note</p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>{order.returnRequest.note}</p>
              </div>
            )}
            {order.returnRequest.reversePickupScheduled && (
              <div>
                <p style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px', marginBottom: '4px' }}>Reverse Tracking (AWB)</p>
                <p style={{ color: '#60a5fa', fontWeight: 'bold' }}>{order.returnRequest.reverseAwb}</p>
              </div>
            )}
          </div>

          {/* Evidence Images uploaded by customer */}
          {order.returnRequest.images?.length > 0 && (
            <div className="mb-4">
              <p style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px', marginBottom: '10px' }}>Evidence Photos</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {order.returnRequest.images.map((img, i) => (
                  <div key={i} onClick={() => setReturnImgView(img.url)}
                    style={{ width: '72px', height: '88px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.12)', flexShrink: 0, position: 'relative' }}
                    title="Click to enlarge">
                    <img src={img.url} alt={`Evidence ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.transform = 'scale(1.06)'}
                      onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.returnRequest.status === 'Approved' && (
            <div className="mt-2" style={{ backgroundColor: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '8px', padding: '12px 14px' }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', margin: 0 }}>✨ Return approved! We will initiate the pickup shortly. Refund will be credited to {order.returnRequest.upiId || 'your account'} within 5–7 business days after pickup.</p>
            </div>
          )}
          {order.returnRequest.status === 'Rejected' && order.returnRequest.resolutionNote && (
            <div className="mt-2 p-3 rounded" style={{ backgroundColor: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}>
              <p style={{ color: '#f87171', fontSize: '12px', fontWeight: 'bold', marginBottom: '2px' }}>Rejection Reason:</p>
              <p style={{ color: '#f87171', fontSize: '12px' }}>{order.returnRequest.resolutionNote}</p>
            </div>
          )}
          {order.returnRequest.status === 'Pending' && (
            <div className="mt-2" style={{ backgroundColor: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '8px', padding: '10px 14px' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: 0 }}>⏳ Under review — the seller will respond within 24–48 hours. You'll receive an email update.</p>
            </div>
          )}
        </div>
      )}

      {/* Return image lightbox */}
      {returnImgView && (
        <div onClick={() => setReturnImgView(null)} style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <img src={returnImgView} alt="Return evidence" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }} />
          <button onClick={() => setReturnImgView(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: '#fff', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
      )}

      {/* Tracking */}
      {!['Cancelled', 'Returned'].includes(order.orderStatus) && (
        <div className="mb-8 rounded-xl overflow-hidden" style={{ backgroundColor: BG2, border: `1px solid ${BORDER}` }}>
          <div className="p-6 pb-4">
            <h3 className="font-body text-xs tracking-[0.15em] uppercase mb-6" style={{ color: 'rgba(255,255,255,0.3)' }}>Order Tracking</h3>
            <div className="relative mb-2">
              <div className="absolute top-4 left-4 right-4 h-0.5" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }} />
              <div className="absolute top-4 left-4 h-0.5 transition-all duration-700"
                style={{ backgroundColor: GOLD, width: currentStep >= 0 ? `${(currentStep / (STATUS_STEPS.length - 1)) * 92}%` : '0%', right: 'auto' }} />
              <div className="flex items-start justify-between relative">
                {STATUS_STEPS.map((step, i) => {
                  const hist = historyMap[step];
                  const done = i <= currentStep;
                  const active = i === currentStep;
                  return (
                    <div key={step} className="flex flex-col items-center" style={{ flex: 1 }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm mb-2 transition-all"
                        style={{
                          backgroundColor: done ? GOLD : 'rgba(255,255,255,0.06)',
                          color: done ? '#000' : 'rgba(255,255,255,0.25)',
                          boxShadow: active ? `0 0 0 3px ${GOLD}30` : 'none',
                          border: active ? `2px solid ${GOLD}` : '2px solid transparent',
                          fontWeight: 700,
                        }}>
                        {i < currentStep ? <FiCheck size={14} /> : i + 1}
                      </div>
                      <p className="text-[10px] font-body text-center leading-tight font-medium"
                        style={{ color: done ? '#fff' : 'rgba(255,255,255,0.25)' }}>{step}</p>
                      {hist?.timestamp && (
                        <p className="text-[9px] font-body text-center mt-0.5 leading-tight"
                          style={{ color: 'rgba(255,255,255,0.25)' }}>
                          {new Date(hist.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          <br />{new Date(hist.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {order.trackingId && (
            <div style={{ borderTop: `1px solid ${BORDER}`, padding: '12px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FiTruck size={14} style={{ color: GOLD }} />
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>AWB</span>
                  <span style={{ color: '#fff', fontFamily: 'monospace', fontWeight: '700', letterSpacing: '0.08em', fontSize: '13px' }}>{order.trackingId}</span>
                  <button onClick={handleCopyAWB}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#4ade80' : 'rgba(255,255,255,0.3)', display: 'flex' }}>
                    <FiCopy size={13} />
                  </button>
                  {copied && <span style={{ color: '#4ade80', fontSize: '11px' }}>Copied!</span>}
                </div>
                <button
                  onClick={handleLoadScans}
                  style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '5px 12px', color: 'rgba(255,255,255,0.5)', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {scansLoading ? '⏳ Loading...' : showScans ? '▲ Hide Events' : '▼ Track Shipment'}
                </button>
              </div>

              {showScans && (
                <div style={{ marginTop: '14px' }}>
                  {scans.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '16px', color: 'rgba(255,255,255,0.25)', fontSize: '12px' }}>
                      <FiMapPin size={20} style={{ marginBottom: '6px', opacity: 0.3 }} /><br />
                      No scan events yet — shipment is just being prepared
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {scans.slice().reverse().map((scan, i) => {
                        const s = scan.ScanDetail;
                        return (
                          <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: i === 0 ? GOLD : 'rgba(255,255,255,0.2)', marginTop: '4px', flexShrink: 0 }} />
                            <div>
                              <p style={{ color: i === 0 ? '#fff' : 'rgba(255,255,255,0.55)', fontSize: '12px', fontWeight: i === 0 ? '600' : '400' }}>{s?.Instructions || s?.Scan || 'Update'}</p>
                              {s?.ScanDateTime && <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><FiClock size={9} /> {new Date(s.ScanDateTime).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h3 className="font-body text-xs tracking-[0.15em] uppercase mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Items Ordered</h3>
          <div className="space-y-4">
            {order.orderItems?.map(item => (
              <div key={item._id} className="flex items-center gap-4 pb-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <img src={item.image} alt={item.name} className="w-16 h-20 object-cover" />
                <div className="flex-1">
                  <p className="font-body font-medium text-sm text-white">{item.name}</p>
                  <p className="font-body text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {item.size && `Size: ${item.size}`}{item.color && ` • Color: ${item.color}`} • Qty: {item.quantity}
                  </p>
                </div>
                <p className="font-body font-medium text-sm text-white">₹{(item.price * item.quantity).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <div className="p-5" style={{ backgroundColor: BG2, border: `1px solid ${BORDER}` }}>
            <h3 className="font-body text-xs tracking-[0.15em] uppercase mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Payment Summary</h3>
            <div className="space-y-2 text-sm font-body">
              {[{ l: 'Subtotal', v: `₹${order.subtotal?.toLocaleString()}` }, { l: 'Shipping', v: order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice}` }, { l: 'GST', v: `₹${order.taxPrice?.toLocaleString()}` }].map(row => (
                <div key={row.l} className="flex justify-between">
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>{row.l}</span><span className="text-white">{row.v}</span>
                </div>
              ))}
              <div className="flex justify-between font-medium text-base pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
                <span className="text-white">Total</span><span className="text-white">₹{order.totalPrice?.toLocaleString()}</span>
              </div>
            </div>
            <p className="font-body text-xs mt-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Payment: {order.paymentMethod}</p>
            <p className="font-body text-xs font-medium mt-1" style={{ color: order.isPaid ? '#4ade80' : '#fbbf24' }}>
              {order.isPaid ? '✓ Paid' : 'Payment Pending'}
            </p>
          </div>
          <div className="p-5" style={{ backgroundColor: BG2, border: `1px solid ${BORDER}` }}>
            <h3 className="font-body text-xs tracking-[0.15em] uppercase mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Delivery Address</h3>
            <div className="font-body text-sm space-y-1">
              <p className="font-medium text-white">{order.shippingAddress?.fullName}</p>
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>{order.shippingAddress?.addressLine1}</p>
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>{order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.pincode}</p>
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>📞 {order.shippingAddress?.phone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Refund info after cancellation */}
      {order.orderStatus === 'Cancelled' && order.refundAmount > 0 && (
        <div className="mt-4 p-4" style={{ backgroundColor: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '8px' }}>
          <p className="font-body text-sm font-semibold mb-1" style={{ color: '#4ade80' }}>💰 Refund Information</p>
          <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Refund amount: <strong style={{ color: '#fff' }}>₹{order.refundAmount?.toLocaleString()}</strong>
          </p>
          {order.cancellationFee > 0 && (
            <p className="font-body text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              (₹{order.cancellationFee} cancellation fee deducted)
            </p>
          )}
          <p className="font-body text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Status: <span style={{ color: order.refundStatus === 'Processed' ? '#4ade80' : '#fbbf24' }}>
              {order.refundStatus === 'Processed' ? '✓ Refund Processed' : '⏳ Refund Pending (5-7 business days)'}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

export default OrdersPage;