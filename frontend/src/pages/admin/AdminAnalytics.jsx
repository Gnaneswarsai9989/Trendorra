import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { userAPI } from '../../services/api';
import {
  FiArrowLeft, FiTrendingUp, FiShoppingBag, FiUsers,
  FiDollarSign, FiPackage, FiRefreshCw, FiXCircle,
  FiTrash2, FiAlertTriangle,
} from 'react-icons/fi';

const BG     = '#0a0a0a';
const CARD   = '#1a1a1a';
const BORDER = 'rgba(255,255,255,0.08)';
const GOLD   = '#C9A84C';

const statusColors = {
  Processing:         '#fbbf24',
  Confirmed:          '#60a5fa',
  Shipped:            '#a78bfa',
  'Out for Delivery': '#fb923c',
  Delivered:          '#4ade80',
  Cancelled:          '#f87171',
};

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
export default function AdminAnalytics() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod]   = useState('week');

  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [revenueDeleting, setRevenueDeleting]   = useState(false);

  const salesRef    = useRef(null);
  const ordersRef   = useRef(null);
  const categoryRef = useRef(null);
  const salesChartRef    = useRef(null);
  const ordersChartRef   = useRef(null);
  const categoryChartRef = useRef(null);

  useEffect(() => { fetchStats(); }, [period]);

  useEffect(() => {
    if (!stats) return;
    [salesChartRef, ordersChartRef, categoryChartRef].forEach(ref => {
      if (ref.current) { ref.current.destroy(); ref.current = null; }
    });
    const existing = document.getElementById('chartjs-script');
    if (existing && window.Chart) { initCharts(); return; }
    if (!existing) {
      const s = document.createElement('script');
      s.id  = 'chartjs-script';
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
      s.onload = initCharts;
      document.head.appendChild(s);
    }
  }, [stats]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await userAPI.getDashboardStats({ period });
      setStats(res.stats);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleResetRevenue = async () => {
    setRevenueDeleting(true);
    try {
      await userAPI.resetRevenueData();
      setShowRevenueModal(false);
      fetchStats();
    } catch (e) { console.error(e); }
    finally { setRevenueDeleting(false); }
  };

  const generateLabels = () => {
    const dayCount = stats?.dayCount || { today: 1, week: 7, month: 30, year: 365 }[period] || 7;
    const labels = [];
    for (let i = dayCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      let label = '';
      if      (period === 'today') label = 'Today';
      else if (period === 'week')  label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
      else if (period === 'month') label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      else if (period === 'year') {
        if (i % 30 === 0 || i === dayCount - 1)
          label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        else label = '';
      }
      labels.push(label);
    }
    return labels;
  };

  const initCharts = () => {
    if (!window.Chart || !stats) return;
    window.Chart.defaults.color       = 'rgba(255,255,255,0.5)';
    window.Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
    const labels   = generateLabels();
    const dayCount = stats?.dayCount || { today: 1, week: 7, month: 30, year: 365 }[period] || 7;
    const revenueData = (stats.dailyRevenue || []).slice(-dayCount);
    const ordersData  = (stats.dailyOrders  || []).slice(-dayCount);

    if (salesRef.current) {
      salesChartRef.current = new window.Chart(salesRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Revenue (₹)',
            data: revenueData.length > 0 ? revenueData : Array(dayCount).fill(0),
            borderColor: GOLD, backgroundColor: 'rgba(201,168,76,0.08)',
            borderWidth: 2.5, fill: true, tension: 0.4,
            pointBackgroundColor: GOLD, pointRadius: 4, pointHoverRadius: 6,
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: '#1a1a1a', borderColor: GOLD, borderWidth: 1,
              callbacks: { label: ctx => ` ₹${ctx.raw?.toLocaleString()}` } }
          },
          scales: {
            y: { grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { callback: v => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}` } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    if (ordersRef.current) {
      ordersChartRef.current = new window.Chart(ordersRef.current, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Orders',
            data: ordersData.length > 0 ? ordersData : Array(dayCount).fill(0),
            backgroundColor: labels.map((_, i) => i === dayCount - 1 ? GOLD : 'rgba(201,168,76,0.3)'),
            borderColor: GOLD, borderWidth: 1, borderRadius: 6,
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: '#1a1a1a', borderColor: GOLD, borderWidth: 1 }
          },
          scales: {
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { stepSize: 1 } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    if (categoryRef.current) {
      const catData = stats.categoryBreakdown?.length
        ? stats.categoryBreakdown : [{ _id: 'No Data', count: 1 }];
      categoryChartRef.current = new window.Chart(categoryRef.current, {
        type: 'doughnut',
        data: {
          labels: catData.map(c => c._id || 'Unknown'),
          datasets: [{
            data: catData.map(c => c.count || c.revenue || 1),
            backgroundColor: ['#C9A84C', '#E2C97E', '#A07830', 'rgba(201,168,76,0.4)', '#7a5c20'],
            borderColor: '#1a1a1a', borderWidth: 3, hoverOffset: 8,
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '68%',
          plugins: {
            legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyleWidth: 8 } },
            tooltip: { backgroundColor: '#1a1a1a', borderColor: GOLD, borderWidth: 1 }
          }
        }
      });
    }
  };

  const periodLabels = { today: "Today's", week: "This Week's", month: "This Month's", year: "This Year's" };
  const chartTitles  = { today: "Today's Revenue", week: "Revenue (Last 7 Days)", month: "Revenue (Last 30 Days)", year: "Revenue (Last 365 Days)" };

  const statCards = stats ? [
    { label: 'Total Revenue',    value: `₹${(stats.totalRevenue  || 0).toLocaleString()}`, icon: FiDollarSign,  color: '#4ade80', sub: 'All time (excl. cancelled)' },
    { label: `${periodLabels[period]} Revenue`, value: `₹${(stats.periodRevenue || 0).toLocaleString()}`, icon: FiTrendingUp, color: GOLD, sub: `${period} period` },
    { label: 'Total Orders',     value: stats.totalOrders  || 0,  icon: FiShoppingBag, color: '#60a5fa', sub: 'Excl. cancelled' },
    { label: 'Total Users',      value: stats.totalUsers   || 0,  icon: FiUsers,       color: '#a78bfa', sub: 'Registered' },
    { label: 'Pending Orders',   value: stats.ordersByStatus?.find(s => s._id === 'Processing')?.count || 0, icon: FiPackage, color: '#fbbf24', sub: 'Need action' },
    { label: 'Cancelled Orders', value: stats.cancelledCount || 0, icon: FiXCircle,    color: '#f87171', sub: 'Revenue excluded' },
  ] : [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>

      {/* Reset Revenue Modal */}
      <DangerModal
        open={showRevenueModal}
        onClose={() => setShowRevenueModal(false)}
        onConfirm={handleResetRevenue}
        loading={revenueDeleting}
        title="Reset All Revenue Data"
        subtitle="Analytics · All Time"
        accentColor="#f87171"
        lines={[
          '⚠️  You are about to permanently reset ALL revenue and analytics data for all time.',
          'This includes: total revenue, period revenue, daily revenue charts, category breakdowns, and all related analytics data.',
        ]}
      />

      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between"
        style={{ backgroundColor: '#050505', borderBottom: `1px solid ${BORDER}` }}>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Admin Panel
          </p>
          <h1 style={{ color: GOLD, fontFamily: 'Cinzel, serif', fontSize: '18px', letterSpacing: '0.2em' }}>
            Analytics
          </h1>
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

          <button onClick={fetchStats}
            className="flex items-center gap-1.5 font-body text-xs hover:text-gold transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <FiRefreshCw size={13} /> Refresh
          </button>
          <Link to="/admin" className="flex items-center gap-1 font-body text-xs hover:text-gold transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)' }}>
            <FiArrowLeft size={13} /> Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Period selector */}
        <div className="flex items-center gap-2 mb-8">
          {['today', 'week', 'month', 'year'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="px-4 py-1.5 text-xs font-body tracking-wider uppercase transition-all"
              style={{
                backgroundColor: period === p ? GOLD : 'transparent',
                color:           period === p ? '#fff' : 'rgba(255,255,255,0.4)',
                border:          `1px solid ${period === p ? GOLD : BORDER}`,
                borderRadius: '4px', cursor: 'pointer',
              }}>
              {p}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ height: '112px', backgroundColor: CARD, borderRadius: '10px', opacity: 0.5 }} />
            ))}
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {statCards.map(({ label, value, icon: Icon, color, sub }) => (
                <div key={label} className="p-5 relative overflow-hidden"
                  style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${color}18` }}>
                      <Icon size={17} style={{ color }} />
                    </div>
                    <span className="font-body text-[10px] tracking-wider uppercase"
                      style={{ color: 'rgba(255,255,255,0.3)' }}>{sub}</span>
                  </div>
                  <p className="font-body font-bold text-xl text-white mb-0.5">{value}</p>
                  <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: color, opacity: 0.5 }} />
                </div>
              ))}
            </div>

            {/* Charts row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
              <div className="lg:col-span-2 p-5"
                style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px' }}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="font-body text-xs tracking-[0.15em] uppercase"
                      style={{ color: 'rgba(255,255,255,0.4)' }}>{chartTitles[period]}</p>
                    <p className="font-body font-bold text-lg text-white mt-0.5">
                      ₹{(stats?.periodRevenue || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5"
                    style={{ backgroundColor: 'rgba(74,222,128,0.1)', borderRadius: '20px' }}>
                    <FiTrendingUp size={12} style={{ color: '#4ade80' }} />
                    <span className="font-body text-xs font-medium" style={{ color: '#4ade80' }}>Live</span>
                  </div>
                </div>
                <div style={{ height: '200px' }}><canvas ref={salesRef} /></div>
              </div>

              <div className="p-5"
                style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px' }}>
                <p className="font-body text-xs tracking-[0.15em] uppercase mb-5"
                  style={{ color: 'rgba(255,255,255,0.4)' }}>Sales by Category</p>
                <div style={{ height: '200px' }}><canvas ref={categoryRef} /></div>
              </div>
            </div>

            {/* Charts row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
              <div className="lg:col-span-2 p-5"
                style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px' }}>
                <p className="font-body text-xs tracking-[0.15em] uppercase mb-5"
                  style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {period === 'today' ? "Today's Orders" : `Daily Orders (Last ${stats?.dayCount || 7} Days)`}
                </p>
                <div style={{ height: '180px' }}><canvas ref={ordersRef} /></div>
              </div>

              <div className="p-5"
                style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px' }}>
                <p className="font-body text-xs tracking-[0.15em] uppercase mb-4"
                  style={{ color: 'rgba(255,255,255,0.4)' }}>Order Status</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(stats?.ordersByStatus || []).map(({ _id, count }) => {
                    const total = (stats.totalOrders || 0) + (stats.cancelledCount || 0);
                    const pct   = total ? Math.round((count / total) * 100) : 0;
                    const color = statusColors[_id] || '#fff';
                    return (
                      <div key={_id}>
                        <div className="flex justify-between mb-1">
                          <span className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{_id}</span>
                          <span className="font-body text-xs font-medium" style={{ color }}>{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent orders + Top products */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
                <div className="flex items-center justify-between px-5 py-4"
                  style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: '#0d0d0d' }}>
                  <p className="font-body text-xs tracking-[0.15em] uppercase"
                    style={{ color: 'rgba(255,255,255,0.4)' }}>Recent Orders</p>
                  <Link to="/admin/orders" className="font-body text-xs hover:underline" style={{ color: GOLD }}>
                    View All
                  </Link>
                </div>
                {(stats?.recentOrders || []).slice(0, 5).map(order => (
                  <div key={order._id} className="flex items-center justify-between px-5 py-3.5"
                    style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <div>
                      <p className="font-body text-sm font-medium text-white">
                        #{order._id?.slice(-8).toUpperCase()}
                      </p>
                      <p className="font-body text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {order.user?.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-body px-2 py-0.5"
                        style={{
                          color:           statusColors[order.orderStatus] || '#fff',
                          backgroundColor: `${statusColors[order.orderStatus] || '#fff'}18`,
                          borderRadius:    '4px',
                        }}>
                        {order.orderStatus}
                      </span>
                      <span className="font-body text-sm font-medium text-white">
                        ₹{order.totalPrice?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
                <div className="flex items-center justify-between px-5 py-4"
                  style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: '#0d0d0d' }}>
                  <p className="font-body text-xs tracking-[0.15em] uppercase"
                    style={{ color: 'rgba(255,255,255,0.4)' }}>Top Products</p>
                  <Link to="/admin/products" className="font-body text-xs hover:underline" style={{ color: GOLD }}>
                    View All
                  </Link>
                </div>
                {(stats?.topProducts || []).slice(0, 5).map((p, i) => (
                  <div key={p._id} className="flex items-center gap-4 px-5 py-3.5"
                    style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <span className="font-body text-sm font-bold w-5 text-center"
                      style={{ color: i < 3 ? GOLD : 'rgba(255,255,255,0.3)' }}>#{i + 1}</span>
                    <img src={p.image} alt="" className="w-10 h-12 object-cover flex-shrink-0"
                      style={{ borderRadius: '4px', backgroundColor: BG }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-medium text-white truncate">{p.name}</p>
                      <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {p.soldCount || 0} sold
                      </p>
                    </div>
                    <p className="font-body text-sm font-semibold flex-shrink-0" style={{ color: GOLD }}>
                      ₹{p.revenue?.toLocaleString() || 0}
                    </p>
                  </div>
                ))}
                {(!stats?.topProducts || stats.topProducts.length === 0) && (
                  <div className="px-5 py-8 text-center">
                    <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>No sales data yet</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}