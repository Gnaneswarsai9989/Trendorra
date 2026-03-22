import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { userAPI } from '../../services/api';
import {
  FiArrowLeft, FiTrendingUp, FiShoppingBag, FiUsers,
  FiDollarSign, FiPackage, FiRefreshCw, FiXCircle,
  FiTrash2, FiAlertTriangle, FiShield, FiUser, FiBarChart2,
} from 'react-icons/fi';

const BG     = '#0a0a0a';
const CARD   = '#141414';
const CARD2  = '#1a1a1a';
const BORDER = 'rgba(255,255,255,0.07)';
const GOLD   = '#C9A84C';

const COMMISSION = 0.10;
const FIXED_FEE  = (p) => {
  if (p <= 500)    return 20;
  if (p <= 1000)   return 30;
  if (p <= 5000)   return 40;
  if (p <= 10000)  return 80;
  if (p <= 50000)  return 120;
  if (p <= 100000) return 150;
  return 200;
};

const STATUS_COLORS = {
  Processing:         '#fbbf24',
  Confirmed:          '#60a5fa',
  Shipped:            '#a78bfa',
  'Out for Delivery': '#fb923c',
  Delivered:          '#4ade80',
  Cancelled:          '#f87171',
};

// ── Danger Modal ──────────────────────────────────────────────────
function DangerModal({ open, onClose, onConfirm, loading, title, subtitle, lines, accentColor = '#f87171' }) {
  const [typed, setTyped] = useState('');
  useEffect(() => { if (!open) setTyped(''); }, [open]);
  if (!open) return null;
  const ready = typed === 'DELETE' && !loading;
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
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
          {lines.map((l, i) => <p key={i} style={{ color: i === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.45)', fontSize: i === 0 ? '13px' : '12px', lineHeight: '1.75', marginTop: i > 0 ? '8px' : 0 }}>{l}</p>)}
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${accentColor}20`, display: 'flex', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>🚫</span>
            <p style={{ color: accentColor, fontSize: '12px', fontWeight: '600' }}>Once deleted, this data can NEVER be recovered.</p>
          </div>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', marginBottom: '8px' }}>Type <strong style={{ color: accentColor }}>DELETE</strong> to confirm</p>
          <input autoFocus type="text" value={typed} onChange={e => setTyped(e.target.value)} placeholder="Type DELETE here…"
            style={{ width: '100%', backgroundColor: '#0d0d0d', border: `1px solid ${typed === 'DELETE' ? accentColor : 'rgba(255,255,255,0.1)'}`, borderRadius: '6px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box' }} />
        </div>
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

// ── Stat Card ─────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub, trend }) {
  return (
    <div style={{ backgroundColor: CARD2, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={17} style={{ color }} />
        </div>
        {trend !== undefined && (
          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', color: trend >= 0 ? '#4ade80' : '#f87171', backgroundColor: trend >= 0 ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)' }}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p style={{ color: '#fff', fontSize: '22px', fontWeight: '700', margin: '0 0 4px', fontFamily: 'inherit' }}>{value}</p>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '0 0 2px' }}>{label}</p>
      {sub && <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px', margin: 0 }}>{sub}</p>}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', backgroundColor: color, opacity: 0.4 }} />
    </div>
  );
}

// ── Revenue Split Card ────────────────────────────────────────────
function RevenueSplitCard({ label, value, pct, color, icon: Icon, sub }) {
  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${color}25`, borderRadius: '12px', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={15} style={{ color }} />
        </div>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</p>
          {sub && <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px', margin: 0 }}>{sub}</p>}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '11px', padding: '2px 8px', borderRadius: '20px', color, backgroundColor: `${color}15` }}>{pct}%</span>
      </div>
      <p style={{ color, fontSize: '24px', fontWeight: '700', margin: 0 }}>{value}</p>
      <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '2px', marginTop: '12px' }}>
        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: '2px', transition: 'width 1s ease' }} />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function AdminAnalytics() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState('week');
  const [activeTab, setActiveTab] = useState('overview'); // overview | sellers

  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [revenueDeleting,  setRevenueDeleting]  = useState(false);

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
    if (window.Chart) { initCharts(); return; }
    const existing = document.getElementById('chartjs-script');
    if (!existing) {
      const s = document.createElement('script');
      s.id  = 'chartjs-script';
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
      s.onload = initCharts;
      document.head.appendChild(s);
    } else {
      const check = setInterval(() => { if (window.Chart) { clearInterval(check); initCharts(); } }, 100);
    }
  }, [stats, activeTab]);

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
    const dayCount = stats?.dayCount || 7;
    return Array.from({ length: dayCount }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (dayCount - 1 - i));
      if (period === 'today') return 'Today';
      if (period === 'week')  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
      if (period === 'month') return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      return (i % 30 === 0 || i === dayCount - 1) ? d.toLocaleDateString('en-IN', { month: 'short' }) : '';
    });
  };

  const initCharts = () => {
    if (!window.Chart || !stats || activeTab !== 'overview') return;
    window.Chart.defaults.color       = 'rgba(255,255,255,0.4)';
    window.Chart.defaults.borderColor = 'rgba(255,255,255,0.05)';

    const labels   = generateLabels();
    const dayCount = stats?.dayCount || 7;
    const revData  = (stats.dailyRevenue || []).slice(-dayCount);
    const ordData  = (stats.dailyOrders  || []).slice(-dayCount);

    if (salesRef.current && !salesChartRef.current) {
      salesChartRef.current = new window.Chart(salesRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Revenue (₹)',
            data:  revData.length ? revData : Array(dayCount).fill(0),
            borderColor: GOLD, backgroundColor: 'rgba(201,168,76,0.06)',
            borderWidth: 2, fill: true, tension: 0.4,
            pointBackgroundColor: GOLD, pointRadius: 3, pointHoverRadius: 6,
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: '#1a1a1a', borderColor: GOLD, borderWidth: 1, padding: 12,
              callbacks: { label: ctx => ` ₹${ctx.raw?.toLocaleString()}` } }
          },
          scales: {
            y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { callback: v => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}` } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    if (ordersRef.current && !ordersChartRef.current) {
      ordersChartRef.current = new window.Chart(ordersRef.current, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Orders',
            data: ordData.length ? ordData : Array(dayCount).fill(0),
            backgroundColor: labels.map((_, i) => i === dayCount - 1 ? GOLD : 'rgba(201,168,76,0.25)'),
            borderColor: 'transparent', borderRadius: 5,
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1a1a1a', borderColor: GOLD, borderWidth: 1, padding: 10 } },
          scales: {
            y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { stepSize: 1 } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    if (categoryRef.current && !categoryChartRef.current) {
      const catData = stats.categoryBreakdown?.length ? stats.categoryBreakdown : [{ _id: 'No Data', count: 1 }];
      categoryChartRef.current = new window.Chart(categoryRef.current, {
        type: 'doughnut',
        data: {
          labels:   catData.map(c => c._id || 'Unknown'),
          datasets: [{ data: catData.map(c => c.count || c.revenue || 1),
            backgroundColor: [GOLD, '#E2C97E', '#A07830', 'rgba(201,168,76,0.4)', '#7a5c20'],
            borderColor: CARD2, borderWidth: 3, hoverOffset: 8 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '68%',
          plugins: {
            legend: { position: 'bottom', labels: { padding: 14, usePointStyle: true, pointStyleWidth: 8, font: { size: 11 } } },
            tooltip: { backgroundColor: '#1a1a1a', borderColor: GOLD, borderWidth: 1, padding: 10 }
          }
        }
      });
    }
  };

  // ── Revenue calculations ──────────────────────────────────────
  const totalRevenue   = stats?.totalRevenue   || 0;
  const sellerStats    = stats?.sellerStats    || [];
  const totalSellerRev = sellerStats.reduce((s, x) => s + (x.revenue || 0), 0);
  const adminRevenue   = Math.max(0, totalRevenue - totalSellerRev);
  const platformComm   = sellerStats.reduce((s, x) => {
    const comm = Math.round((x.revenue || 0) * COMMISSION);
    return s + comm;
  }, 0);
  const sellerPayout   = totalSellerRev - platformComm;

  const revPct = (v) => totalRevenue > 0 ? Math.round((v / totalRevenue) * 100) : 0;

  const PERIOD_LABELS = { today: "Today", week: "This Week", month: "This Month", year: "This Year" };

  const mainCards = stats ? [
    { label: 'Total Platform Revenue', value: `₹${totalRevenue.toLocaleString()}`,                         icon: FiDollarSign,  color: '#4ade80', sub: 'All time · excl. cancelled' },
    { label: PERIOD_LABELS[period],     value: `₹${(stats.periodRevenue || 0).toLocaleString()}`,          icon: FiTrendingUp,  color: GOLD,      sub: `${period} period revenue`  },
    { label: 'Total Orders',            value: (stats.totalOrders || 0).toLocaleString(),                   icon: FiShoppingBag, color: '#60a5fa', sub: 'Excl. cancelled'            },
    { label: 'Total Users',             value: (stats.totalUsers  || 0).toLocaleString(),                   icon: FiUsers,       color: '#a78bfa', sub: `${stats.totalSellers || 0} sellers` },
    { label: 'Pending Orders',          value: (stats.ordersByStatus?.find(s => s._id === 'Processing')?.count || 0).toString(), icon: FiPackage, color: '#fbbf24', sub: 'Need attention' },
    { label: 'Cancelled',              value: (stats.cancelledCount || 0).toLocaleString(),                 icon: FiXCircle,     color: '#f87171', sub: 'All time'                   },
  ] : [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>

      <DangerModal open={showRevenueModal} onClose={() => setShowRevenueModal(false)}
        onConfirm={handleResetRevenue} loading={revenueDeleting}
        title="Reset Revenue Data" subtitle="Analytics · All Time" accentColor="#f87171"
        lines={['⚠️ You are about to permanently reset ALL revenue and analytics data.', 'This includes total revenue, daily charts, category breakdown, and seller stats.']} />

      {/* ── Header ── */}
      <div className="px-6 py-5 flex items-center justify-between"
        style={{ backgroundColor: '#050505', borderBottom: `1px solid ${BORDER}` }}>
        <div>
          <p className="font-body text-xs tracking-[0.2em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Admin Panel</p>
          <h1 className="font-accent text-xl tracking-[0.2em]" style={{ color: GOLD }}>Analytics</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowRevenueModal(true)}
            className="flex items-center gap-1.5 font-body text-xs transition-all"
            style={{ color: '#f87171', background: 'none', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer' }}
            onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(248,113,113,0.6)'}
            onMouseOut={e  => e.currentTarget.style.borderColor = 'rgba(248,113,113,0.25)'}>
            <FiTrash2 size={12} /> Reset Revenue
          </button>
          <button onClick={fetchStats} className="flex items-center gap-1.5 font-body text-xs"
            style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <FiRefreshCw size={13} /> Refresh
          </button>
          <Link to="/admin" className="flex items-center gap-1 font-body text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <FiArrowLeft size={13} /> Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Period selector + Tabs ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex gap-2">
            {['today', 'week', 'month', 'year'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className="px-4 py-1.5 text-xs font-body tracking-wider uppercase transition-all"
                style={{ backgroundColor: period === p ? GOLD : 'transparent', color: period === p ? '#fff' : 'rgba(255,255,255,0.4)', border: `1px solid ${period === p ? GOLD : BORDER}`, borderRadius: '6px', cursor: 'pointer' }}>
                {p}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {[
              { key: 'overview', label: 'Overview',        icon: FiBarChart2  },
              { key: 'sellers',  label: 'Seller Breakdown', icon: FiUser       },
            ].map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-body transition-all"
                style={{ backgroundColor: activeTab === key ? 'rgba(201,168,76,0.15)' : 'transparent', color: activeTab === key ? GOLD : 'rgba(255,255,255,0.4)', border: `1px solid ${activeTab === key ? `${GOLD}50` : BORDER}`, borderRadius: '6px', cursor: 'pointer' }}>
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} style={{ height: '120px', backgroundColor: CARD2, borderRadius: '12px', opacity: 0.4 }} />)}
          </div>
        ) : activeTab === 'overview' ? (
          <>
            {/* ── 6 Stat Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {mainCards.map(c => <StatCard key={c.label} {...c} />)}
            </div>

            {/* ── Revenue Split ── */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div style={{ width: '3px', height: '18px', backgroundColor: GOLD, borderRadius: '2px' }} />
                <p className="font-body text-sm font-semibold text-white">Revenue Breakdown</p>
                <span className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>How ₹{totalRevenue.toLocaleString()} is split</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <RevenueSplitCard
                  label="Admin Products"    icon={FiShield}
                  value={`₹${adminRevenue.toLocaleString()}`}
                  pct={revPct(adminRevenue)} color={GOLD}
                  sub="Direct admin sales" />
                <RevenueSplitCard
                  label="Seller Products"   icon={FiUser}
                  value={`₹${totalSellerRev.toLocaleString()}`}
                  pct={revPct(totalSellerRev)} color="#60a5fa"
                  sub={`${sellerStats.length} sellers`} />
                <RevenueSplitCard
                  label="Platform Commission" icon={FiDollarSign}
                  value={`₹${platformComm.toLocaleString()}`}
                  pct={revPct(platformComm)} color="#4ade80"
                  sub="10% of seller sales" />
              </div>
            </div>

            {/* ── Charts row 1 ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
              <div className="lg:col-span-2 p-5" style={{ backgroundColor: CARD2, border: `1px solid ${BORDER}`, borderRadius: '12px' }}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="font-body text-xs tracking-[0.15em] uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      Revenue — {PERIOD_LABELS[period]}
                    </p>
                    <p className="font-body font-bold text-xl text-white mt-1">₹{(stats?.periodRevenue || 0).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5" style={{ backgroundColor: 'rgba(74,222,128,0.1)', borderRadius: '20px' }}>
                    <FiTrendingUp size={12} style={{ color: '#4ade80' }} />
                    <span className="font-body text-xs font-medium" style={{ color: '#4ade80' }}>Live</span>
                  </div>
                </div>
                <div style={{ height: '200px' }}><canvas ref={salesRef} /></div>
              </div>

              <div className="p-5" style={{ backgroundColor: CARD2, border: `1px solid ${BORDER}`, borderRadius: '12px' }}>
                <p className="font-body text-xs tracking-[0.15em] uppercase mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>Sales by Category</p>
                <div style={{ height: '200px' }}><canvas ref={categoryRef} /></div>
              </div>
            </div>

            {/* ── Charts row 2 ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
              <div className="lg:col-span-2 p-5" style={{ backgroundColor: CARD2, border: `1px solid ${BORDER}`, borderRadius: '12px' }}>
                <p className="font-body text-xs tracking-[0.15em] uppercase mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Daily Orders — {PERIOD_LABELS[period]}
                </p>
                <div style={{ height: '180px' }}><canvas ref={ordersRef} /></div>
              </div>

              {/* Order status bars */}
              <div className="p-5" style={{ backgroundColor: CARD2, border: `1px solid ${BORDER}`, borderRadius: '12px' }}>
                <p className="font-body text-xs tracking-[0.15em] uppercase mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>Order Status</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {(stats?.ordersByStatus || []).map(({ _id, count }) => {
                    const total = (stats.totalOrders || 0) + (stats.cancelledCount || 0);
                    const pct   = total ? Math.round((count / total) * 100) : 0;
                    const color = STATUS_COLORS[_id] || '#fff';
                    return (
                      <div key={_id}>
                        <div className="flex justify-between mb-1.5">
                          <span className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{_id}</span>
                          <span className="font-body text-xs font-semibold" style={{ color }}>{count} <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>({pct}%)</span></span>
                        </div>
                        <div style={{ height: '5px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                          <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: '3px', transition: 'width 1s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Recent orders + Top products ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Recent orders */}
              <div style={{ backgroundColor: CARD2, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: '#0d0d0d' }}>
                  <p className="font-body text-xs tracking-[0.15em] uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>Recent Orders</p>
                  <Link to="/admin/orders" className="font-body text-xs hover:underline" style={{ color: GOLD }}>View All</Link>
                </div>
                {(stats?.recentOrders || []).slice(0, 6).map(order => {
                  const hasSeller = order.orderItems?.some(i => i.seller);
                  return (
                    <div key={order._id} className="flex items-center justify-between px-5 py-3.5"
                      style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-body text-sm font-medium text-white">#{order._id?.slice(-8).toUpperCase()}</p>
                          <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '10px', color: hasSeller ? '#60a5fa' : GOLD, backgroundColor: hasSeller ? 'rgba(96,165,250,0.1)' : `${GOLD}15` }}>
                            {hasSeller ? '🏪 Seller' : '👑 Admin'}
                          </span>
                        </div>
                        <p className="font-body text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{order.user?.name}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-body px-2 py-0.5"
                          style={{ color: STATUS_COLORS[order.orderStatus] || '#fff', backgroundColor: `${STATUS_COLORS[order.orderStatus] || '#fff'}15`, borderRadius: '4px' }}>
                          {order.orderStatus}
                        </span>
                        <span className="font-body text-sm font-medium text-white">₹{order.totalPrice?.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Top products */}
              <div style={{ backgroundColor: CARD2, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: '#0d0d0d' }}>
                  <p className="font-body text-xs tracking-[0.15em] uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>Top Products</p>
                  <Link to="/admin/products" className="font-body text-xs hover:underline" style={{ color: GOLD }}>View All</Link>
                </div>
                {(stats?.topProducts || []).slice(0, 5).map((p, i) => (
                  <div key={p._id} className="flex items-center gap-4 px-5 py-3.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <span className="font-body text-sm font-bold w-5 text-center" style={{ color: i < 3 ? GOLD : 'rgba(255,255,255,0.3)' }}>#{i + 1}</span>
                    <img src={p.image} alt="" className="w-10 h-12 object-cover flex-shrink-0" style={{ borderRadius: '6px', backgroundColor: BG }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-medium text-white truncate">{p.name}</p>
                      <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{p.soldCount || 0} sold</p>
                    </div>
                    <p className="font-body text-sm font-semibold flex-shrink-0" style={{ color: GOLD }}>₹{p.revenue?.toLocaleString() || 0}</p>
                  </div>
                ))}
                {(!stats?.topProducts || stats.topProducts.length === 0) && (
                  <div className="px-5 py-10 text-center">
                    <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>No sales data yet</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          // ── SELLER BREAKDOWN TAB ──────────────────────────────
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Active Sellers"      value={sellerStats.length.toString()}          icon={FiUsers}       color="#60a5fa" sub="With orders" />
              <StatCard label="Total Seller Sales"  value={`₹${totalSellerRev.toLocaleString()}`}  icon={FiShoppingBag} color={GOLD}    sub="Excl. cancelled" />
              <StatCard label="Platform Commission" value={`₹${platformComm.toLocaleString()}`}    icon={FiDollarSign}  color="#4ade80" sub="10% of seller revenue" />
              <StatCard label="Pending Payouts"     value={`₹${sellerStats.reduce((s,x)=>{ const comm=Math.round((x.deliveredRevenue||0)*COMMISSION); const net=(x.deliveredRevenue||0)-comm; return s+Math.max(0,net-(x.paidOut||0)); },0).toLocaleString()}`} icon={FiPackage} color="#fbbf24" sub="Delivery complete, unpaid" />
            </div>

            {/* Per-seller cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {sellerStats.length === 0 ? (
                <div style={{ backgroundColor: CARD2, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
                  No seller orders yet.
                </div>
              ) : sellerStats.map((seller, i) => {
                const gross      = seller.revenue || 0;
                const comm       = Math.round(gross * COMMISSION);
                const avgOrder   = seller.deliveredOrders > 0 ? (seller.deliveredRevenue || 0) / seller.deliveredOrders : 0;
                const fixedTotal = seller.deliveredOrders > 0 ? seller.deliveredOrders * FIXED_FEE(avgOrder) : 0;
                const netEarned  = (seller.deliveredRevenue || 0) - Math.round((seller.deliveredRevenue||0) * COMMISSION) - fixedTotal;
                const paidOut    = seller.paidOut || 0;
                const pending    = Math.max(0, netEarned - paidOut);
                const isPaidUp   = pending === 0 && seller.deliveredOrders > 0;
                const revShare   = totalSellerRev > 0 ? Math.round((gross / totalSellerRev) * 100) : 0;

                // Days since last delivery
                const daysSinceDelivery = seller.lastDeliveredAt
                  ? Math.floor((Date.now() - new Date(seller.lastDeliveredAt)) / (1000*60*60*24))
                  : null;

                // Payout status
                const payoutStatus = seller.deliveredOrders === 0
                  ? { label: 'No Deliveries Yet', color: 'rgba(255,255,255,0.2)', bg: 'rgba(255,255,255,0.05)' }
                  : isPaidUp
                  ? { label: '✅ Fully Paid',       color: '#4ade80',              bg: 'rgba(74,222,128,0.1)'  }
                  : { label: `₹${pending.toLocaleString()} Pending`, color: GOLD, bg: `${GOLD}15` };

                const statusBadges = [
                  { label: 'Processing',       count: seller.processingOrders, color: '#fbbf24' },
                  { label: 'Confirmed',         count: seller.confirmedOrders,  color: '#60a5fa' },
                  { label: 'Shipped',           count: seller.shippedOrders,    color: '#a78bfa' },
                  { label: 'Out for Delivery',  count: seller.outForDelivery,   color: '#fb923c' },
                  { label: 'Delivered',         count: seller.deliveredOrders,  color: '#4ade80' },
                  { label: 'Cancelled',         count: seller.cancelledOrders,  color: '#f87171' },
                ].filter(b => b.count > 0);

                return (
                  <div key={seller._id || i} style={{ backgroundColor: CARD2, border: `1px solid ${BORDER}`, borderRadius: '14px', overflow: 'hidden' }}>

                    {/* Seller header */}
                    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, backgroundColor: '#0d0d0d', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: `${GOLD}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ color: GOLD, fontSize: '15px', fontWeight: '700' }}>{seller.sellerName?.charAt(0)?.toUpperCase() || 'S'}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <p style={{ color: '#fff', fontSize: '14px', fontWeight: '600', margin: 0 }}>{seller.sellerName || 'Unknown Seller'}</p>
                          {seller.businessName && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>· {seller.businessName}</span>}
                          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', color: seller.status === 'approved' ? '#4ade80' : '#fbbf24', backgroundColor: seller.status === 'approved' ? 'rgba(74,222,128,0.1)' : 'rgba(251,191,36,0.1)' }}>
                            {seller.status || 'pending'}
                          </span>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '2px 0 0' }}>{seller.sellerEmail}</p>
                      </div>
                      {/* Payout status badge */}
                      <div style={{ padding: '6px 14px', borderRadius: '8px', backgroundColor: payoutStatus.bg, border: `1px solid ${payoutStatus.color}30` }}>
                        <p style={{ color: payoutStatus.color, fontSize: '12px', fontWeight: '600', margin: 0 }}>{payoutStatus.label}</p>
                      </div>
                      {/* Days since delivery */}
                      {daysSinceDelivery !== null && (
                        <div style={{ padding: '6px 14px', borderRadius: '8px', backgroundColor: daysSinceDelivery <= 3 ? 'rgba(74,222,128,0.08)' : daysSinceDelivery <= 7 ? 'rgba(251,191,36,0.08)' : 'rgba(248,113,113,0.08)', border: `1px solid ${daysSinceDelivery <= 3 ? 'rgba(74,222,128,0.2)' : daysSinceDelivery <= 7 ? 'rgba(251,191,36,0.2)' : 'rgba(248,113,113,0.2)'}` }}>
                          <p style={{ color: daysSinceDelivery <= 3 ? '#4ade80' : daysSinceDelivery <= 7 ? '#fbbf24' : '#f87171', fontSize: '11px', fontWeight: '600', margin: 0 }}>
                            Last delivery: {daysSinceDelivery === 0 ? 'Today' : daysSinceDelivery === 1 ? 'Yesterday' : `${daysSinceDelivery}d ago`}
                          </p>
                        </div>
                      )}
                    </div>

                    <div style={{ padding: '16px 20px' }}>
                      {/* Order status badges row */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', display: 'flex', alignItems: 'center', marginRight: '4px' }}>Orders:</span>
                        {statusBadges.map(b => (
                          <span key={b.label} style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', color: b.color, backgroundColor: `${b.color}15`, border: `1px solid ${b.color}30`, fontWeight: '600' }}>
                            {b.label}: {b.count}
                          </span>
                        ))}
                        {statusBadges.length === 0 && <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>No orders</span>}
                      </div>

                      {/* Revenue grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '10px' }}>
                        {[
                          { label: 'Gross Revenue',        value: `₹${gross.toLocaleString()}`,                                          color: '#fff',    sub: `${revShare}% of all sellers`                  },
                          { label: 'Delivered Revenue',    value: `₹${(seller.deliveredRevenue||0).toLocaleString()}`,                   color: '#4ade80', sub: `${seller.deliveredOrders||0} delivered orders` },
                          { label: 'Commission (10%)',      value: `−₹${Math.round((seller.deliveredRevenue||0)*COMMISSION).toLocaleString()}`, color: '#f87171', sub: 'Platform fee'                             },
                          { label: 'Fixed Fees',           value: `−₹${fixedTotal.toLocaleString()}`,                                    color: '#fbbf24', sub: 'Per-order fee'                                 },
                          { label: 'Net Seller Earnings',  value: `₹${netEarned.toLocaleString()}`,                                      color: '#4ade80', sub: 'After all deductions', bold: true               },
                          { label: 'Already Paid Out',     value: `₹${paidOut.toLocaleString()}`,                                        color: '#60a5fa', sub: 'Transferred to seller'                         },
                          { label: pending > 0 ? '⚠️ Pending Payout' : '✅ Payout Complete', value: pending > 0 ? `₹${pending.toLocaleString()}` : '₹0', color: pending > 0 ? GOLD : '#4ade80', sub: pending > 0 ? 'Ready to transfer' : 'All paid', bold: true },
                          { label: 'Items Sold',           value: (seller.itemsSold||0).toString(),                                       color: '#a78bfa', sub: 'Total units'                                   },
                        ].map(({ label, value, color, sub, bold }) => (
                          <div key={label} style={{ backgroundColor: '#0d0d0d', borderRadius: '8px', padding: '12px 14px', border: `1px solid ${bold ? `${color}25` : BORDER}` }}>
                            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 5px' }}>{label}</p>
                            <p style={{ color, fontSize: bold ? '16px' : '14px', fontWeight: bold ? '700' : '600', margin: '0 0 2px' }}>{value}</p>
                            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', margin: 0 }}>{sub}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}