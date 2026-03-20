import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI, userAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiTrash2, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

const BG     = '#0a0a0a';
const CARD   = '#1a1a1a';
const BORDER = 'rgba(255,255,255,0.08)';
const GOLD   = '#C9A84C';

const STATUS_OPTIONS = ['Processing', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

const statusStyle = (s) => ({
  Processing:         { color: '#fbbf24', backgroundColor: 'rgba(251,191,36,0.1)'  },
  Confirmed:          { color: '#60a5fa', backgroundColor: 'rgba(96,165,250,0.1)'  },
  Shipped:            { color: '#a78bfa', backgroundColor: 'rgba(167,139,250,0.1)' },
  'Out for Delivery': { color: '#fb923c', backgroundColor: 'rgba(251,146,60,0.1)'  },
  Delivered:          { color: '#4ade80', backgroundColor: 'rgba(74,222,128,0.1)'  },
  Cancelled:          { color: '#f87171', backgroundColor: 'rgba(248,113,113,0.1)' },
}[s] || { color: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.05)' });

const thStyle = {
  color: 'rgba(255,255,255,0.35)', fontSize: '11px', letterSpacing: '0.15em',
  textTransform: 'uppercase', padding: '1rem 1.25rem', textAlign: 'left',
  borderBottom: `1px solid ${BORDER}`, backgroundColor: '#050505',
};
const tdStyle = { padding: '0.875rem 1.25rem', borderBottom: `1px solid ${BORDER}` };

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

// ─── Admin Header ──────────────────────────────────────────────────────────
const AdminHeader = ({ title, rightSlot }) => (
  <div className="px-6 py-5 flex items-center justify-between"
    style={{ backgroundColor: '#050505', borderBottom: `1px solid ${BORDER}` }}>
    <div>
      <p className="font-body text-xs tracking-[0.2em] uppercase mb-1"
        style={{ color: 'rgba(255,255,255,0.3)' }}>Admin Panel</p>
      <h1 className="font-accent text-xl tracking-[0.2em]" style={{ color: GOLD }}>{title}</h1>
    </div>
    <div className="flex items-center gap-3">
      {rightSlot}
      <Link to="/admin"
        className="font-body text-xs tracking-wider hover:text-gold transition-colors flex items-center gap-1"
        style={{ color: 'rgba(255,255,255,0.4)' }}>
        <FiArrowLeft size={13} /> Dashboard
      </Link>
    </div>
  </div>
);

// ─── AdminOrders ───────────────────────────────────────────────────────────
export function AdminOrders() {
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage]             = useState(1);
  const [pagination, setPagination] = useState({});
  const [updating, setUpdating]     = useState(null);

  // Reset Orders modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetLoading, setResetLoading]     = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderAPI.getAll({ page, limit: 15, status: filterStatus });
      setOrders(res.orders);
      setPagination({ pages: res.pages, total: res.total });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [page, filterStatus]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await orderAPI.updateStatus(orderId, { orderStatus: newStatus });
      toast.success(`Updated to ${newStatus}`);
      fetchOrders();
    } catch { toast.error('Failed'); }
    finally { setUpdating(null); }
  };

  const handleResetOrders = async () => {
    setResetLoading(true);
    try {
      await userAPI.deleteAllOrders();
      setShowResetModal(false);
      toast.success('All orders deleted permanently');
      fetchOrders();
    } catch {
      toast.error('Failed to delete orders');
    } finally { setResetLoading(false); }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>

      {/* Reset Orders Modal */}
      <DangerModal
        open={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleResetOrders}
        loading={resetLoading}
        title="Delete All Orders"
        subtitle="Orders · All Time"
        accentColor="#f87171"
        lines={[
          '⚠️  You are about to permanently delete ALL order records from the database.',
          'Every order — Processing, Confirmed, Shipped, Delivered, Cancelled — will be completely wiped. Customer order history will be lost.',
        ]}
      />

      <AdminHeader
        title="Orders"
        rightSlot={
          <button
            onClick={() => setShowResetModal(true)}
            className="flex items-center gap-1.5 font-body text-xs transition-all"
            style={{
              color: '#f87171', background: 'none',
              border: '1px solid rgba(248,113,113,0.25)',
              borderRadius: '4px', padding: '5px 10px', cursor: 'pointer',
            }}
            onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(248,113,113,0.6)'}
            onMouseOut={e  => e.currentTarget.style.borderColor = 'rgba(248,113,113,0.25)'}
          >
            <FiTrash2 size={12} /> Reset Orders
          </button>
        }
      />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            className="px-3 py-2.5 text-sm font-body focus:outline-none"
            style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: '#fff' }}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
          <p className="font-body text-sm ml-auto" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {pagination.total} orders
          </p>
        </div>

        <div className="overflow-x-auto" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
          <table className="w-full">
            <thead>
              <tr>
                {['Order ID', 'Customer', 'Date', 'Items', 'Total', 'Status', 'Update'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(7)].map((_, j) => (
                        <td key={j} style={tdStyle}><div className="skeleton h-4 rounded" /></td>
                      ))}
                    </tr>
                  ))
                : orders.map(order => (
                    <tr key={order._id}>
                      <td style={tdStyle}>
                        <Link to={`/orders/${order._id}`} className="font-body text-sm hover:underline"
                          style={{ color: GOLD }}>
                          #{order._id.slice(-8).toUpperCase()}
                        </Link>
                      </td>
                      <td style={tdStyle}>
                        <p className="font-body text-sm font-medium text-white">{order.user?.name}</p>
                        <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{order.user?.email}</p>
                      </td>
                      <td style={tdStyle}>
                        <span className="font-body text-sm whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span className="font-body text-sm text-white">{order.orderItems?.length}</span>
                      </td>
                      <td style={tdStyle}>
                        <span className="font-body text-sm font-medium text-white">
                          ₹{order.totalPrice?.toLocaleString()}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span className="text-xs font-body px-2 py-1" style={statusStyle(order.orderStatus)}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <select
                          value={order.orderStatus}
                          onChange={e => handleStatusUpdate(order._id, e.target.value)}
                          disabled={updating === order._id}
                          className="text-xs font-body px-2 py-1.5 focus:outline-none"
                          style={{ backgroundColor: '#0a0a0a', border: `1px solid ${BORDER}`, color: '#fff' }}
                        >
                          {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {[...Array(pagination.pages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className="w-8 h-8 text-sm font-body transition-all"
                style={{
                  backgroundColor: page === i + 1 ? GOLD : 'transparent',
                  color:           page === i + 1 ? '#fff' : 'rgba(255,255,255,0.4)',
                  border:          `1px solid ${page === i + 1 ? GOLD : BORDER}`,
                }}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AdminUsers ────────────────────────────────────────────────────────────
export function AdminUsers() {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userAPI.getAll({ page, limit: 20 });
      setUsers(res.users);
      setPagination({ pages: res.pages, total: res.total });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try { await userAPI.delete(id); toast.success('User deleted'); fetchUsers(); }
    catch { toast.error('Failed'); }
  };

  const handleRoleToggle = async (user) => {
    try {
      await userAPI.update(user._id, { role: user.role === 'admin' ? 'user' : 'admin' });
      toast.success('Role updated');
      fetchUsers();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>
      <AdminHeader title="Users" />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <p className="font-body text-sm mb-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {pagination.total} users
        </p>
        <div className="overflow-x-auto" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
          <table className="w-full">
            <thead>
              <tr>
                {['User', 'Phone', 'Role', 'Joined', 'Status', 'Actions'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(6)].map((_, j) => (
                        <td key={j} style={tdStyle}><div className="skeleton h-4 rounded" /></td>
                      ))}
                    </tr>
                  ))
                : users.map(user => (
                    <tr key={user._id}>
                      <td style={tdStyle}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0"
                            style={{ backgroundColor: GOLD }}>
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-body font-medium text-sm text-white">{user.name}</p>
                            <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          {user.phone || '—'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span className="text-xs font-body px-2 py-1"
                          style={user.role === 'admin'
                            ? { color: GOLD, backgroundColor: 'rgba(201,168,76,0.1)' }
                            : { color: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span className="font-body text-xs" style={{ color: user.isActive ? '#4ade80' : '#f87171' }}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div className="flex gap-3">
                          <button onClick={() => handleRoleToggle(user)}
                            className="font-body text-xs hover:underline" style={{ color: '#60a5fa' }}>
                            {user.role === 'admin' ? 'Make User' : 'Make Admin'}
                          </button>
                          <button onClick={() => handleDelete(user._id)}
                            className="font-body text-xs hover:underline" style={{ color: '#f87171' }}>
                            Delete
                          </button>
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