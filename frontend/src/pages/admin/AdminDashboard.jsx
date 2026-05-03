import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userAPI } from '../../services/api';
import {
  FiUsers, FiShoppingBag, FiDollarSign, FiPackage,
  FiTrendingUp, FiArrowRight, FiArrowLeft, FiBell, FiTag, FiSliders,
  FiTrash2, FiAlertTriangle, FiRefreshCw, FiGrid,
  FiShield, FiUser,
} from 'react-icons/fi';

const BG = '#080808';
const CARD = '#111111';
const C2 = '#181818';
const BORDER = 'rgba(255,255,255,0.07)';
const GOLD = '#C9A84C';

const statusStyle = (s) => ({
  Processing: { color: '#fbbf24', backgroundColor: 'rgba(251,191,36,0.12)', borderRadius: '6px', padding: '3px 10px', fontSize: '11px' },
  Confirmed: { color: '#60a5fa', backgroundColor: 'rgba(96,165,250,0.12)', borderRadius: '6px', padding: '3px 10px', fontSize: '11px' },
  Shipped: { color: '#a78bfa', backgroundColor: 'rgba(167,139,250,0.12)', borderRadius: '6px', padding: '3px 10px', fontSize: '11px' },
  'Out for Delivery': { color: '#fb923c', backgroundColor: 'rgba(251,146,60,0.12)', borderRadius: '6px', padding: '3px 10px', fontSize: '11px' },
  Delivered: { color: '#4ade80', backgroundColor: 'rgba(74,222,128,0.12)', borderRadius: '6px', padding: '3px 10px', fontSize: '11px' },
  Cancelled: { color: '#f87171', backgroundColor: 'rgba(248,113,113,0.12)', borderRadius: '6px', padding: '3px 10px', fontSize: '11px' },
}[s] || { color: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '3px 10px', fontSize: '11px' });

// ── Danger Modal ──────────────────────────────────────────────────
function DangerModal({ open, onClose, onConfirm, loading, title, subtitle, lines, accentColor = '#f87171' }) {
  const [typed, setTyped] = useState('');
  useEffect(() => { if (!open) setTyped(''); }, [open]);
  if (!open) return null;
  const ready = typed === 'DELETE' && !loading;
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ backgroundColor: '#141414', border: `1px solid ${accentColor}44`, borderRadius: '16px', padding: '32px', maxWidth: '460px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: `${accentColor}15`, border: `1px solid ${accentColor}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FiAlertTriangle size={22} style={{ color: accentColor }} />
          </div>
          <div>
            <p style={{ color: accentColor, fontFamily: 'Cinzel, serif', fontSize: '15px', letterSpacing: '0.1em', marginBottom: '3px' }}>{title}</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>{subtitle}</p>
          </div>
        </div>
        <div style={{ backgroundColor: `${accentColor}0d`, border: `1px solid ${accentColor}25`, borderRadius: '8px', padding: '16px', marginBottom: '22px' }}>
          {lines.map((l, i) => <p key={i} style={{ color: i === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.45)', fontSize: i === 0 ? '13px' : '12px', lineHeight: '1.75', marginTop: i > 0 ? '8px' : 0 }}>{l}</p>)}
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${accentColor}20`, display: 'flex', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>🚫</span>
            <p style={{ color: accentColor, fontSize: '12px', fontWeight: '600' }}>Once deleted, this data can NEVER be recovered.</p>
          </div>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', marginBottom: '8px' }}>Type <strong style={{ color: accentColor }}>DELETE</strong> to confirm</p>
          <input autoFocus type="text" value={typed} onChange={e => setTyped(e.target.value)} placeholder="Type DELETE here…"
            style={{ width: '100%', backgroundColor: '#0a0a0a', border: `1px solid ${typed === 'DELETE' ? accentColor : 'rgba(255,255,255,0.1)'}`, borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.45)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => ready && onConfirm()} disabled={!ready}
            style={{ flex: 1, padding: '11px', backgroundColor: ready ? accentColor : `${accentColor}15`, border: `1px solid ${ready ? accentColor : `${accentColor}25`}`, borderRadius: '8px', color: ready ? '#fff' : `${accentColor}44`, fontSize: '13px', fontWeight: '700', cursor: ready ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
            {loading ? <><FiRefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Deleting…</> : <><FiTrash2 size={13} /> Delete Forever</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [revenueDeleting, setRevenueDeleting] = useState(false);

  const fetchStats = () => {
    setLoading(true);
    userAPI.getDashboardStats().then(r => setStats(r.stats)).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { fetchStats(); }, []);

  const handleResetRevenue = async () => {
    setRevenueDeleting(true);
    try { await userAPI.resetRevenueData(); setShowRevenueModal(false); fetchStats(); }
    catch (e) { console.error(e); } finally { setRevenueDeleting(false); }
  };

  const totalRevenue = stats?.totalRevenue || 0;
  const sellerRevenue = stats?.sellerStats?.reduce((s, x) => s + (x.revenue || 0), 0) || 0;
  const adminRevenue = Math.max(0, totalRevenue - sellerRevenue);

  const statCards = stats ? [
    { label: 'Total Users', value: (stats.totalUsers || 0).toLocaleString(), icon: FiUsers, color: GOLD, sub: `${stats.totalSellers || 0} sellers` },
    { label: 'Total Orders', value: (stats.totalOrders || 0).toLocaleString(), icon: FiShoppingBag, color: '#60a5fa', sub: `${stats.cancelledCount || 0} cancelled` },
    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: FiDollarSign, color: '#4ade80', sub: 'Excl. cancelled' },
    { label: 'Avg Order Value', value: stats.totalOrders ? `₹${Math.round(totalRevenue / stats.totalOrders).toLocaleString()}` : '₹0', icon: FiTrendingUp, color: '#a78bfa', sub: 'Per order' },
  ] : [];

  const adminLinks = [
    { to: '/admin/products', label: 'Products', icon: FiPackage, desc: 'Add, edit, delete products', color: GOLD },
    { to: '/admin/orders', label: 'Orders', icon: FiShoppingBag, desc: 'View and update all orders', color: '#60a5fa' },
    { to: '/admin/users', label: 'Users', icon: FiUsers, desc: 'Manage customers & roles', color: '#4ade80' },
    { to: '/admin/analytics', label: 'Analytics', icon: FiTrendingUp, desc: 'Revenue charts & insights', color: '#a78bfa' },
    { to: '/admin/notifications', label: 'Notifications', icon: FiBell, desc: 'Send SMS & promotional offers', color: '#fb923c' },
    { to: '/admin/coupons', label: 'Coupons', icon: FiTag, desc: 'Create & manage discount codes', color: '#f472b6' },
    { to: '/admin/sellers', label: 'Sellers', icon: FiUser, desc: 'Seller accounts & payouts', color: '#34d399' },
    { to: '/admin/settings', label: 'Settings', icon: FiSliders, desc: 'Commission & platform fees', color: '#38bdf8' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: BG }}>
      <style>{`
        @media (max-width: 768px) {
          .admin-stats { grid-template-columns: 1fr 1fr !important; }
          .admin-revenue { grid-template-columns: 1fr !important; }
          .admin-nav { grid-template-columns: repeat(2, 1fr) !important; }
          .admin-header { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
          .admin-recent-order { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
          .admin-recent-order > div { width: 100% !important; justify-content: space-between !important; }
        }
      `}</style>

      <DangerModal open={showRevenueModal} onClose={() => setShowRevenueModal(false)}
        onConfirm={handleResetRevenue} loading={revenueDeleting}
        title="Reset All Revenue Data" subtitle="Dashboard · All Time" accentColor="#f87171"
        lines={['⚠️ You are about to permanently reset ALL revenue and analytics data.', 'This includes total revenue, order value, and all related analytics.']} />

      {/* ── Header ── */}
      <div className="admin-header" style={{ backgroundColor: '#050505', borderBottom: `1px solid ${BORDER}`, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: `${GOLD}18`, border: `1px solid ${GOLD}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiGrid size={16} style={{ color: GOLD }} />
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 2px' }}>Admin Panel</p>
            <h1 style={{ color: GOLD, fontFamily: 'Cinzel, serif', fontSize: '17px', letterSpacing: '0.15em', margin: 0 }}>TRENDORRA Dashboard</h1>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={fetchStats} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>
            <FiRefreshCw size={12} /> Refresh
          </button>
          <button onClick={() => setShowRevenueModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#f87171', background: 'none', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px' }}
            onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(248,113,113,0.6)'}
            onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(248,113,113,0.25)'}>
            <FiTrash2 size={12} /> Reset Revenue
          </button>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', fontSize: '12px' }}>
            <FiArrowLeft size={13} /> Back to Store
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '28px' }}>
            {[...Array(4)].map((_, i) => <div key={i} style={{ height: '110px', backgroundColor: CARD, borderRadius: '14px', opacity: 0.4 }} />)}
          </div>
        ) : (
          <>
            {/* ── Stat Cards ── */}
            <div className="admin-stats md:grid-cols-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '24px' }}>
              {statCards.map(({ label, value, icon: Icon, color, sub }) => (
                <div key={label} style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '22px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `${color}18`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} style={{ color }} />
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
                  </div>
                  <p style={{ color: '#fff', fontSize: '26px', fontWeight: '700', margin: '0 0 4px', letterSpacing: '-0.5px' }}>{value}</p>
                  <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', margin: 0 }}>{sub}</p>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', backgroundColor: color, opacity: 0.5 }} />
                  {/* subtle corner glow */}
                  <div style={{ position: 'absolute', top: 0, right: 0, width: '60px', height: '60px', background: `radial-gradient(circle at top right, ${color}10, transparent)`, pointerEvents: 'none' }} />
                </div>
              ))}
            </div>

            {/* ── Revenue Breakdown ── */}
            <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '3px', height: '20px', backgroundColor: GOLD, borderRadius: '2px' }} />
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>Revenue Breakdown</p>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['overview', 'sellers'].map(t => (
                    <button key={t} onClick={() => setTab(t)}
                      style={{ padding: '5px 14px', fontSize: '11px', textTransform: 'capitalize', letterSpacing: '0.05em', backgroundColor: tab === t ? GOLD : 'transparent', color: tab === t ? '#000' : 'rgba(255,255,255,0.4)', border: `1px solid ${tab === t ? GOLD : BORDER}`, borderRadius: '6px', cursor: 'pointer', fontWeight: tab === t ? '700' : '400' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {tab === 'overview' && (
                <div className="admin-revenue" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
                  {[
                    { label: 'Total Platform Revenue', value: `₹${totalRevenue.toLocaleString()}`, color: GOLD, sub: `${stats?.totalOrders || 0} orders total`, bg: `${GOLD}08`, border: `${GOLD}22` },
                    { label: 'Admin Products Revenue', value: `₹${adminRevenue.toLocaleString()}`, color: '#60a5fa', sub: 'Your own product sales', bg: 'rgba(96,165,250,0.06)', border: 'rgba(96,165,250,0.18)' },
                    { label: 'Seller Products Revenue', value: `₹${sellerRevenue.toLocaleString()}`, color: '#4ade80', sub: `${stats?.sellerStats?.length || 0} active sellers`, bg: 'rgba(74,222,128,0.06)', border: 'rgba(74,222,128,0.18)' },
                  ].map(({ label, value, color, sub, bg, border }) => {
                    const num = parseFloat(value.replace(/[₹,]/g, '')) || 0;
                    const pct = totalRevenue > 0 ? Math.round((num / totalRevenue) * 100) : 0;
                    return (
                      <div key={label} style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: '12px', padding: '18px 20px' }}>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 10px', letterSpacing: '0.05em' }}>{label}</p>
                        <p style={{ color, fontSize: '24px', fontWeight: '700', margin: '0 0 4px', letterSpacing: '-0.5px' }}>{value}</p>
                        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', margin: '0 0 12px' }}>{sub}</p>
                        <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
                          <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: '2px', opacity: 0.8, transition: 'width 1s ease' }} />
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', margin: '5px 0 0' }}>{pct}% of total</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {tab === 'sellers' && (
                <>
                  {!stats?.sellerStats?.length ? (
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center', padding: '32px 0' }}>No seller revenue data yet</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead>
                          <tr>
                            {['Seller', 'Business', 'Orders', 'Items', 'Revenue', 'Paid Out', 'Pending'].map(h => (
                              <th key={h} style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '10px 12px', textAlign: 'left', borderBottom: `1px solid ${BORDER}`, backgroundColor: '#0a0a0a' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {stats.sellerStats.map((s, i) => {
                            const pending = Math.max(0, (s.revenue || 0) - (s.paidOut || 0));
                            return (
                              <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}
                                onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                <td style={{ padding: '12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: `${GOLD}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      <span style={{ color: GOLD, fontSize: '11px', fontWeight: '700' }}>{s.sellerName?.charAt(0)?.toUpperCase()}</span>
                                    </div>
                                    <div>
                                      <p style={{ color: '#fff', fontSize: '12px', fontWeight: '500', margin: 0 }}>{s.sellerName || '—'}</p>
                                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', margin: 0 }}>{s.sellerEmail}</p>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding: '12px', color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>{s.businessName || '—'}</td>
                                <td style={{ padding: '12px', color: '#fff', fontSize: '12px' }}>{s.orderCount}</td>
                                <td style={{ padding: '12px', color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>{s.itemsSold}</td>
                                <td style={{ padding: '12px', color: GOLD, fontSize: '12px', fontWeight: '600' }}>₹{(s.revenue || 0).toLocaleString()}</td>
                                <td style={{ padding: '12px', color: '#4ade80', fontSize: '12px' }}>₹{(s.paidOut || 0).toLocaleString()}</td>
                                <td style={{ padding: '12px' }}>
                                  <span style={{ color: pending > 0 ? '#fbbf24' : 'rgba(255,255,255,0.2)', fontSize: '12px', fontWeight: pending > 0 ? '600' : '400' }}>
                                    {pending > 0 ? `₹${pending.toLocaleString()}` : '—'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Orders by Status ── */}
            {stats?.ordersByStatus?.length > 0 && (
              <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '20px 24px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '3px', height: '18px', backgroundColor: '#60a5fa', borderRadius: '2px' }} />
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>Orders by Status</p>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {stats.ordersByStatus.map(({ _id, count }) => {
                    const s = statusStyle(_id);
                    return (
                      <Link key={_id} to={`/admin/orders?status=${_id}`}
                        style={{ ...s, display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', border: `1px solid ${s.color}25`, transition: 'opacity 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.opacity = '0.7'}
                        onMouseOut={e => e.currentTarget.style.opacity = '1'}>
                        <span style={{ fontSize: '11px' }}>{_id}</span>
                        <span style={{ backgroundColor: s.color, color: '#000', fontSize: '10px', fontWeight: '700', borderRadius: '20px', padding: '1px 7px', minWidth: '20px', textAlign: 'center' }}>{count}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Quick Navigation ── */}
            <div style={{ backgroundColor: CARD, border: `1px solid rgba(201,168,76,0.25)`, borderRadius: '18px', padding: '24px', marginBottom: '24px', outline: '3px solid rgba(201,168,76,0.05)', outlineOffset: '0' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '3px', height: '20px', backgroundColor: GOLD, borderRadius: '2px' }} />
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', margin: 0 }}>Quick Navigation</p>
                <div style={{ flex: 1, height: '1px', backgroundColor: `${GOLD}15` }} />
              </div>

              {/* 7 cards grid */}
              <div className="admin-nav" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
                {adminLinks.map(({ to, label, icon: Icon, desc, color }) => (
                  <Link key={to} to={to}
                    style={{
                      backgroundColor: '#0d0d0d',
                      border: `1px solid rgba(255,255,255,0.07)`,
                      borderRadius: '14px', padding: '18px 14px',
                      textDecoration: 'none', display: 'flex',
                      flexDirection: 'column', alignItems: 'center',
                      textAlign: 'center', gap: '12px',
                      transition: 'all 0.2s ease',
                      position: 'relative', overflow: 'hidden',
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.borderColor = color;
                      e.currentTarget.style.backgroundColor = `${color}0d`;
                      e.currentTarget.style.transform = 'translateY(-4px)';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                      e.currentTarget.style.backgroundColor = '#0d0d0d';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}>
                    {/* Icon circle */}
                    <div style={{
                      width: '46px', height: '46px', borderRadius: '12px',
                      backgroundColor: `${color}18`,
                      border: `1px solid ${color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={20} style={{ color }} />
                    </div>
                    {/* Label */}
                    <div>
                      <p style={{ color: '#fff', fontSize: '12px', fontWeight: '600', margin: '0 0 3px', letterSpacing: '0.02em' }}>{label}</p>
                      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px', lineHeight: '1.4', margin: 0 }}>{desc}</p>
                    </div>
                    {/* Bottom color line */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', backgroundColor: color, opacity: 0.45 }} />
                  </Link>
                ))}
              </div>
            </div>

            {/* ── Recent Orders ── */}
            {stats?.recentOrders?.length > 0 && (
              <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: `1px solid ${BORDER}`, backgroundColor: '#0a0a0a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '3px', height: '18px', backgroundColor: GOLD, borderRadius: '2px' }} />
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>Recent Orders</p>
                  </div>
                  <Link to="/admin/orders" style={{ color: GOLD, fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    View All <FiArrowRight size={12} />
                  </Link>
                </div>
                {stats.recentOrders.slice(0, 8).map(order => {
                  const hasSeller = order.orderItems?.some(i => i.seller);
                  return (
                    <Link key={order._id} className="admin-recent-order" to="/admin/orders" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: `1px solid ${BORDER}`, textDecoration: 'none', transition: 'background 0.15s' }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {/* Order source badge */}
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: hasSeller ? 'rgba(96,165,250,0.12)' : `${GOLD}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {hasSeller ? <FiUser size={13} style={{ color: '#60a5fa' }} /> : <FiShield size={13} style={{ color: GOLD }} />}
                        </div>
                        <div>
                          <p style={{ color: '#fff', fontSize: '13px', fontWeight: '500', margin: '0 0 2px' }}>
                            #{order._id.slice(-8).toUpperCase()}
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: '400', marginLeft: '8px' }}>{order.user?.name}</span>
                          </p>
                          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', margin: 0 }}>
                            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            <span style={{ marginLeft: '8px', color: hasSeller ? '#60a5fa' : GOLD, fontSize: '10px' }}>
                              {hasSeller ? '🏪 Seller' : '👑 Admin'}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span style={{ ...statusStyle(order.orderStatus), fontFamily: 'Jost, sans-serif' }}>{order.orderStatus}</span>
                        <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600', minWidth: '70px', textAlign: 'right' }}>₹{order.totalPrice?.toLocaleString()}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}