import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FiArrowLeft } from 'react-icons/fi';

const BG = '#0a0a0a';
const CARD = '#1a1a1a';
const BORDER = 'rgba(255,255,255,0.08)';
const GOLD = '#C9A84C';

const thStyle = {
  color: 'rgba(255,255,255,0.35)', fontSize: '11px', letterSpacing: '0.15em',
  textTransform: 'uppercase', padding: '1rem 1.5rem', textAlign: 'left',
  borderBottom: `1px solid ${BORDER}`, backgroundColor: '#050505',
};
const tdStyle = { padding: '0.875rem 1.5rem', borderBottom: `1px solid ${BORDER}` };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState('');

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
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    try { await userAPI.delete(id); toast.success('User deleted'); fetchUsers(); }
    catch { toast.error('Failed to delete'); }
  };

  const handleRoleToggle = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change ${user.name} to ${newRole}?`)) return;
    try { await userAPI.update(user._id, { role: newRole }); toast.success('Role updated'); fetchUsers(); }
    catch { toast.error('Failed to update role'); }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between"
        style={{ backgroundColor: '#050505', borderBottom: `1px solid ${BORDER}` }}>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Admin Panel
          </p>
          <h1 style={{ color: GOLD, fontFamily: 'Cinzel, serif', fontSize: '18px', letterSpacing: '0.2em' }}>Users</h1>
        </div>
        <Link to="/admin" className="flex items-center gap-1 font-body text-xs tracking-wider hover:text-gold transition-colors"
          style={{ color: 'rgba(255,255,255,0.4)' }}>
          <FiArrowLeft size={13} /> Dashboard
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <input type="text" placeholder="Search users..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-4 py-2.5 text-sm font-body w-64 focus:outline-none"
            style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: '#fff' }} />
          <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {pagination.total} registered users
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Users', value: pagination.total || 0, color: GOLD },
            { label: 'Admins', value: users.filter(u => u.role === 'admin').length, color: '#a78bfa' },
            { label: 'Active', value: users.filter(u => u.isActive).length, color: '#4ade80' },
          ].map(stat => (
            <div key={stat.label} className="p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
              <p className="font-body font-bold text-xl" style={{ color: stat.color }}>{stat.value}</p>
              <p className="font-body text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
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
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} style={tdStyle}><div className="skeleton h-4 rounded w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.map(user => (
                <tr key={user._id}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={tdStyle}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium text-white flex-shrink-0"
                        style={{ backgroundColor: user.role === 'admin' ? GOLD : '#333' }}>
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
                        ? { color: GOLD, backgroundColor: 'rgba(201,168,76,0.12)', border: `1px solid rgba(201,168,76,0.3)` }
                        : { color: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}` }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span className="font-body text-xs font-medium"
                      style={{ color: user.isActive ? '#4ade80' : '#f87171' }}>
                      {user.isActive ? '● Active' : '● Inactive'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleRoleToggle(user)}
                        className="font-body text-xs hover:underline transition-colors"
                        style={{ color: '#60a5fa' }}>
                        {user.role === 'admin' ? 'Make User' : 'Make Admin'}
                      </button>
                      <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
                      <button onClick={() => handleDelete(user._id)}
                        className="font-body text-xs hover:underline transition-colors"
                        style={{ color: '#f87171' }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {[...Array(pagination.pages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className="w-8 h-8 text-sm font-body transition-all"
                style={{
                  backgroundColor: page === i + 1 ? GOLD : 'transparent',
                  color: page === i + 1 ? '#fff' : 'rgba(255,255,255,0.4)',
                  border: `1px solid ${page === i + 1 ? GOLD : BORDER}`,
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
