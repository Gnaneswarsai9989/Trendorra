import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userAPI } from '../../services/api';
import {
  FiUsers, FiShoppingBag, FiDollarSign, FiPackage,
  FiTrendingUp, FiArrowRight, FiArrowLeft, FiBell, FiTag,
  FiTrash2, FiAlertTriangle, FiRefreshCw,
} from 'react-icons/fi';

const BG     = '#0a0a0a';
const CARD   = '#1a1a1a';
const BORDER = 'rgba(255,255,255,0.08)';
const GOLD   = '#C9A84C';

const statusStyle = (s) => ({
  Processing:         { color: '#fbbf24', backgroundColor: 'rgba(251,191,36,0.1)'  },
  Confirmed:          { color: '#60a5fa', backgroundColor: 'rgba(96,165,250,0.1)'  },
  Shipped:            { color: '#a78bfa', backgroundColor: 'rgba(167,139,250,0.1)' },
  'Out for Delivery': { color: '#fb923c', backgroundColor: 'rgba(251,146,60,0.1)'  },
  Delivered:          { color: '#4ade80', backgroundColor: 'rgba(74,222,128,0.1)'  },
  Cancelled:          { color: '#f87171', backgroundColor: 'rgba(248,113,113,0.1)' },
}[s] || { color: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.05)' });

// ─── Reusable Danger Modal ─────────────────────────────────────────────────
function DangerModal({ open, onClose, onConfirm, loading, title, subtitle, lines, accentColor = '#f87171' }) {
  const [typed, setTyped] = useState('');
  useEffect(() => { if (!open) setTyped(''); }, [open]);
  if (!open) return null;
  const ready = typed === 'DELETE' && !loading;

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
    >
      <div style={{
        backgroundColor: '#1a1a1a',
        border: `1px solid ${accentColor}44`,
        borderRadius: '14px', padding: '32px',
        maxWidth: '460px', width: '100%',
        boxShadow: `0 0 40px ${accentColor}15`,
      }}>
        {/* Icon + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            backgroundColor: `${accentColor}15`,
            border: `1px solid ${accentColor}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <FiAlertTriangle size={22} style={{ color: accentColor }} />
          </div>
          <div>
            <p style={{ color: accentColor, fontFamily: 'Cinzel, serif', fontSize: '15px', letterSpacing: '0.1em', marginBottom: '3px' }}>
              {title}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontFamily: 'inherit', letterSpacing: '0.05em' }}>
              {subtitle}
            </p>
          </div>
        </div>

        {/* Warning box */}
        <div style={{
          backgroundColor: `${accentColor}0d`,
          border: `1px solid ${accentColor}25`,
          borderRadius: '8px', padding: '16px', marginBottom: '22px',
        }}>
          {lines.map((line, i) => (
            <p key={i} style={{
              color: i === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.45)',
              fontSize: i === 0 ? '13px' : '12px',
              lineHeight: '1.75', marginTop: i > 0 ? '8px' : '0',
              fontFamily: 'inherit',
            }}>{line}</p>
          ))}
          <div style={{
            marginTop: '12px', paddingTop: '12px',
            borderTop: `1px solid ${accentColor}20`,
            display: 'flex', alignItems: 'flex-start', gap: '8px',
          }}>
            <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>🚫</span>
            <p style={{ color: accentColor, fontSize: '12px', fontWeight: '600', fontFamily: 'inherit', lineHeight: '1.5' }}>
              Once deleted, this data can NEVER be recovered. This action is permanent and irreversible.
            </p>
          </div>
        </div>

        {/* Confirm input */}
        <div style={{ marginBottom: '20px' }}>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', marginBottom: '8px', letterSpacing: '0.05em', fontFamily: 'inherit' }}>
            Type <strong style={{ color: accentColor }}>DELETE</strong> to confirm
          </p>
          <input
            autoFocus
            type="text"
            value={typed}
            onChange={e => setTyped(e.target.value)}
            placeholder="Type DELETE here…"
            style={{
              width: '100%', backgroundColor: '#0d0d0d',
              border: `1px solid ${typed === 'DELETE' ? accentColor : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '6px', padding: '10px 14px',
              color: '#fff', fontSize: '13px', outline: 'none',
              fontFamily: 'monospace', boxSizing: 'border-box', transition: 'border-color 0.2s',
            }}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '11px', backgroundColor: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px',
              color: 'rgba(255,255,255,0.45)', fontSize: '13px', cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
            onMouseOut={e  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';  e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
          >
            Cancel
          </button>
          <button
            onClick={() => ready && onConfirm()}
            disabled={!ready}
            style={{
              flex: 1, padding: '11px',
              backgroundColor: ready ? accentColor : `${accentColor}15`,
              border: `1px solid ${ready ? accentColor : `${accentColor}25`}`,
              borderRadius: '6px',
              color: ready ? '#fff' : `${accentColor}44`,
              fontSize: '13px', fontWeight: '700',
              cursor: ready ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
            }}
          >
            {loading
              ? <><FiRefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Deleting…</>
              : <><FiTrash2 size={13} /> Delete Forever</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [revenueDeleting, setRevenueDeleting]   = useState(false);

  const fetchStats = () =>
    userAPI.getDashboardStats().then(res => setStats(res.stats)).finally(() => setLoading(false));

  useEffect(() => { fetchStats(); }, []);

  const handleResetRevenue = async () => {
    setRevenueDeleting(true);
    try {
      await userAPI.resetRevenueData();
      setShowRevenueModal(false);
      fetchStats();
    } catch (e) { console.error(e); }
    finally { setRevenueDeleting(false); }
  };

  const statCards = stats ? [
    { label: 'Total Users',     value: stats.totalUsers,  icon: FiUsers,       color: GOLD      },
    { label: 'Total Orders',    value: stats.totalOrders, icon: FiShoppingBag, color: '#60a5fa' },
    { label: 'Total Revenue',   value: `₹${(stats.totalRevenue || 0).toLocaleString()}`, icon: FiDollarSign, color: '#4ade80' },
    { label: 'Avg Order Value', value: stats.totalOrders ? `₹${Math.round(stats.totalRevenue / stats.totalOrders).toLocaleString()}` : '₹0', icon: FiTrendingUp, color: '#a78bfa' },
  ] : [];

  // ── 7 links — grid will auto-wrap cleanly ──
  const adminLinks = [
    { to: '/admin/products',      label: 'Products',      icon: FiPackage,     desc: 'Add, edit, delete products'            },
    { to: '/admin/orders',        label: 'Orders',        icon: FiShoppingBag, desc: 'View and update orders'                },
    { to: '/admin/users',         label: 'Users',         icon: FiUsers,       desc: 'Manage customers'                      },
    { to: '/admin/analytics',     label: 'Analytics',     icon: FiTrendingUp,  desc: 'Sales charts & insights'               },
    { to: '/admin/notifications', label: 'Notifications', icon: FiBell,        desc: 'Send SMS & offers to customers'        },
    { to: '/admin/coupons',       label: 'Coupons',       icon: FiTag,         desc: 'Create discount codes'                 },
    { to: '/admin/sellers',       label: 'Sellers',       icon: FiShoppingBag, desc: 'Manage seller accounts & payouts'      },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>

      {/* Reset Revenue Modal */}
      <DangerModal
        open={showRevenueModal}
        onClose={() => setShowRevenueModal(false)}
        onConfirm={handleResetRevenue}
        loading={revenueDeleting}
        title="Reset All Revenue Data"
        subtitle="Dashboard · All Time"
        accentColor="#f87171"
        lines={[
          '⚠️  You are about to permanently reset ALL revenue and analytics data for all time.',
          'This includes: total revenue, average order value, daily revenue charts, and all related analytics data.',
        ]}
      />

      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between"
        style={{ backgroundColor: '#050505', borderBottom: `1px solid ${BORDER}` }}>
        <div>
          <p className="font-body text-xs tracking-[0.2em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Admin Panel
          </p>
          <h1 className="font-accent text-xl tracking-[0.2em]" style={{ color: GOLD }}>TRENDORRA Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Reset Revenue button */}
          <button
            onClick={() => setShowRevenueModal(true)}
            className="flex items-center gap-1.5 font-body text-xs transition-all"
            style={{
              color: '#f87171', background: 'none',
              border: '1px solid rgba(248,113,113,0.25)',
              borderRadius: '4px', padding: '5px 10px', cursor: 'pointer',
            }}
            onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(248,113,113,0.6)'}
            onMouseOut={e  => e.currentTarget.style.borderColor = 'rgba(248,113,113,0.25)'}
          >
            <FiTrash2 size={12} /> Reset Revenue
          </button>

          <Link to="/" className="flex items-center gap-2 font-body text-xs tracking-wider hover:text-gold transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)' }}>
            <FiArrowLeft size={14} /> Back to Store
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded" />)}
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
              {statCards.map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="p-5" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
                  <div className="flex items-center justify-between mb-4">
                    <Icon size={20} style={{ color }} />
                    <span className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</span>
                  </div>
                  <p className="font-body font-bold text-2xl text-white">{value}</p>
                </div>
              ))}
            </div>

            {/* Order Status Breakdown */}
            {stats?.ordersByStatus?.length > 0 && (
              <div className="p-6 mb-8" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
                <h2 className="font-body text-xs tracking-[0.15em] uppercase mb-4"
                  style={{ color: 'rgba(255,255,255,0.4)' }}>Orders by Status</h2>
                <div className="flex flex-wrap gap-3">
                  {stats.ordersByStatus.map(({ _id, count }) => (
                    <div key={_id} className="px-4 py-2 text-sm font-body" style={statusStyle(_id)}>
                      {_id}: <strong>{count}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Links — 4 cols on desktop to fit 7 items neatly */}
            <div
              className="grid grid-cols-1 gap-5 mb-8"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
            >
              {adminLinks.map(({ to, label, icon: Icon, desc }) => (
                <Link key={to} to={to}
                  className="p-5 flex items-center justify-between group transition-all"
                  style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
                  onMouseOver={e => e.currentTarget.style.borderColor = GOLD}
                  onMouseOut={e  => e.currentTarget.style.borderColor = BORDER}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(201,168,76,0.15)' }}>
                      <Icon size={18} style={{ color: GOLD }} />
                    </div>
                    <div>
                      <p className="font-body font-medium text-sm text-white">{label}</p>
                      <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{desc}</p>
                    </div>
                  </div>
                  <FiArrowRight size={16} style={{ color: 'rgba(255,255,255,0.2)' }} />
                </Link>
              ))}
            </div>

            {/* Recent Orders */}
            {stats?.recentOrders?.length > 0 && (
              <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
                <div className="flex items-center justify-between px-6 py-4"
                  style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <h2 className="font-body text-xs tracking-[0.15em] uppercase"
                    style={{ color: 'rgba(255,255,255,0.4)' }}>Recent Orders</h2>
                  <Link to="/admin/orders" className="font-body text-xs hover:underline" style={{ color: GOLD }}>
                    View All
                  </Link>
                </div>
                <div>
                  {stats.recentOrders.map(order => (
                    <div key={order._id} className="flex items-center justify-between px-6 py-4"
                      style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <div>
                        <p className="font-body text-sm font-medium text-white">
                          #{order._id.slice(-8).toUpperCase()}
                        </p>
                        <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          {order.user?.name} • {order.user?.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-body px-3 py-1" style={statusStyle(order.orderStatus)}>
                          {order.orderStatus}
                        </span>
                        <span className="font-body text-sm font-medium text-white">
                          ₹{order.totalPrice?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}