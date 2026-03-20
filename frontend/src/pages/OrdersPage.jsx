import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiPackage, FiCheck } from 'react-icons/fi';

const BG = '#111111';
const BG2 = '#0a0a0a';
const BORDER = 'rgba(255,255,255,0.08)';
const GOLD = '#C9A84C';
const STATUS_STEPS = ['Processing', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'];

const statusStyle = (s) => ({
  Processing:      { color: '#fbbf24', backgroundColor: 'rgba(251,191,36,0.1)'  },
  Confirmed:       { color: '#60a5fa', backgroundColor: 'rgba(96,165,250,0.1)'  },
  Shipped:         { color: '#a78bfa', backgroundColor: 'rgba(167,139,250,0.1)' },
  'Out for Delivery': { color: '#fb923c', backgroundColor: 'rgba(251,146,60,0.1)'  },
  Delivered:       { color: '#4ade80', backgroundColor: 'rgba(74,222,128,0.1)'  },
  Cancelled:       { color: '#f87171', backgroundColor: 'rgba(248,113,113,0.1)' },
}[s] || { color: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.05)' });

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
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
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

  if (loading) return <div className="min-h-screen" style={{ backgroundColor: BG }}><div className="max-w-4xl mx-auto px-6 py-12"><div className="skeleton h-96 rounded" /></div></div>;
  if (!order) return <div className="text-center py-24" style={{ backgroundColor: BG }}><h2 className="font-display text-3xl text-white">Order not found</h2></div>;

  const currentStep = STATUS_STEPS.indexOf(order.orderStatus);

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
          {!['Shipped','Out for Delivery','Delivered','Cancelled'].includes(order.orderStatus) && (
            <button onClick={handleCancel} disabled={cancelling}
              className="font-body text-xs px-4 py-2 transition-colors"
              style={{ border: '1px solid rgba(248,113,113,0.4)', color: '#f87171', borderRadius: '4px', backgroundColor: cancelling ? 'rgba(248,113,113,0.05)' : 'transparent' }}>
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}
        </div>
      </div>

      {/* Tracking */}
      {!['Cancelled', 'Returned'].includes(order.orderStatus) && (
        <div className="mb-10 p-6" style={{ backgroundColor: BG2, border: `1px solid ${BORDER}` }}>
          <h3 className="font-body text-xs tracking-[0.15em] uppercase mb-6" style={{ color: 'rgba(255,255,255,0.3)' }}>Order Tracking</h3>
          <div className="flex items-start justify-between">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex flex-col items-center flex-1">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm mb-2 transition-all"
                  style={{ backgroundColor: i <= currentStep ? GOLD : 'rgba(255,255,255,0.08)', color: i <= currentStep ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                  {i < currentStep ? <FiCheck size={14} /> : i + 1}
                </div>
                <p className="text-[10px] font-body text-center leading-tight"
                  style={{ color: i <= currentStep ? '#fff' : 'rgba(255,255,255,0.3)' }}>{step}</p>
              </div>
            ))}
          </div>
          {order.trackingNumber && (
            <p className="font-body text-sm text-center mt-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Tracking: <strong className="text-white">{order.trackingNumber}</strong>
            </p>
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
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>{order.shippingAddress?.city}, {order.shippingAddress?.state} – {order.shippingAddress?.pincode}</p>
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>📞 {order.shippingAddress?.phone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Refund info for cancelled paid orders */}
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