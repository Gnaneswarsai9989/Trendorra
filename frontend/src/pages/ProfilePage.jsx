import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { FiUser, FiLock, FiShoppingBag, FiHeart, FiLogOut, FiEdit3, FiSun, FiMoon, FiChevronRight, FiCheck, FiX } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const GOLD = '#C9A84C';
const BORDER = 'rgba(255,255,255,0.07)';

export function ProfilePage() {
  const { user, logout, updateUser, isAdmin } = useAuth();
  const [tab, setTab] = useState('');
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const BG   = isDark ? '#0d0d0d' : '#f0f0f0';
  const CARD = isDark ? '#181818' : '#fff';
  const TEXT = isDark ? '#fff' : '#111';
  const DIM  = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';

  const handleLogout = () => { logout(); navigate('/'); };

  const navItems = [
    { id: 'profile',  label: 'My Profile',     icon: FiUser,        action: () => setTab('profile') },
    { id: 'password', label: 'Change Password', icon: FiLock,        action: () => setTab('password') },
    { id: 'orders',   label: 'My Orders',       icon: FiShoppingBag, action: () => navigate('/orders') },
    { id: 'wishlist', label: 'Wishlist',        icon: FiHeart,       action: () => navigate('/wishlist') },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG, transition: 'background-color 0.3s' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Profile Hero Card ── */}
        <div className="relative overflow-hidden mb-5 p-5"
          style={{ background: isDark ? 'linear-gradient(135deg,#1e1e1e,#141414)' : '#fff', borderRadius: '20px', border: `1px solid ${BORDER}`, boxShadow: isDark ? 'none' : '0 2px 20px rgba(0,0,0,0.08)' }}>
          <div className="absolute top-0 left-0 right-0 h-0.5"
            style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${GOLD}, #A07830)` }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full"
                style={{ backgroundColor: '#4ade80', border: `2px solid ${CARD}` }} />
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-lg font-light truncate" style={{ color: TEXT }}>{user?.name}</h1>
              <p className="font-body text-xs mt-0.5 truncate" style={{ color: DIM }}>{user?.email}</p>
              {user?.phone && <p className="font-body text-xs mt-0.5" style={{ color: DIM }}>+91 {user.phone}</p>}
            </div>
            {/* Edit pencil - opens profile tab */}
            <button onClick={() => setTab(tab === 'profile' ? '' : 'profile')}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center transition-all"
              style={{
                backgroundColor: tab === 'profile' ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.06)',
                borderRadius: '10px',
                border: `1px solid ${tab === 'profile' ? 'rgba(201,168,76,0.3)' : BORDER}`,
              }}>
              {tab === 'profile'
                ? <FiX size={14} style={{ color: GOLD }} />
                : <FiEdit3 size={14} style={{ color: DIM }} />}
            </button>
          </div>
          {isAdmin && (
            <div className="mt-4 pt-4 flex items-center gap-2" style={{ borderTop: `1px solid ${BORDER}` }}>
              <span className="font-body text-[10px] px-2.5 py-1 tracking-wider uppercase"
                style={{ backgroundColor: 'rgba(201,168,76,0.12)', color: GOLD, borderRadius: '6px', border: `1px solid rgba(201,168,76,0.2)` }}>
                Admin
              </span>
              <Link to="/admin" className="font-body text-xs" style={{ color: GOLD }}>Go to Admin Panel →</Link>
            </div>
          )}
        </div>

        {/* ── Nav Card ── */}
        <div className="mb-5 p-2"
          style={{ backgroundColor: CARD, borderRadius: '16px', border: `1px solid ${BORDER}`, boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)' }}>
          {navItems.map(({ id, label, icon: Icon, action }) => (
            <button key={id} onClick={action}
              className="w-full flex items-center justify-between px-3 py-3.5 transition-all mb-0.5"
              style={{
                backgroundColor: tab === id ? 'rgba(201,168,76,0.1)' : 'transparent',
                borderRadius: '12px',
                border: `1px solid ${tab === id ? 'rgba(201,168,76,0.2)' : 'transparent'}`,
              }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-xl flex-shrink-0"
                  style={{ backgroundColor: tab === id ? 'rgba(201,168,76,0.15)' : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                  <Icon size={15} style={{ color: tab === id ? GOLD : DIM }} />
                </div>
                <span className="font-body text-sm font-medium" style={{ color: tab === id ? TEXT : DIM }}>
                  {label}
                </span>
              </div>
              <FiChevronRight size={14} style={{ color: tab === id ? GOLD : 'rgba(255,255,255,0.15)' }} />
            </button>
          ))}

          <div className="my-1.5" style={{ height: '1px', backgroundColor: BORDER, marginLeft: '12px', marginRight: '12px' }} />

          {/* Light/Dark Toggle */}
          <button onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-3.5 transition-all mb-0.5"
            style={{ borderRadius: '12px' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-xl flex-shrink-0"
                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                {isDark
                  ? <FiSun size={15} style={{ color: DIM }} />
                  : <FiMoon size={15} style={{ color: DIM }} />}
              </div>
              <span className="font-body text-sm font-medium" style={{ color: DIM }}>
                {isDark ? 'Switch to Light' : 'Switch to Dark'}
              </span>
            </div>
            {/* Toggle switch */}
            <div className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
              style={{ backgroundColor: isDark ? GOLD : 'rgba(0,0,0,0.15)' }}>
              <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all"
                style={{ left: isDark ? '22px' : '2px' }} />
            </div>
          </button>

          <div className="my-1.5" style={{ height: '1px', backgroundColor: BORDER, marginLeft: '12px', marginRight: '12px' }} />

          {/* Logout */}
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3.5 transition-all"
            style={{ borderRadius: '12px' }}>
            <div className="w-8 h-8 flex items-center justify-center rounded-xl flex-shrink-0"
              style={{ backgroundColor: 'rgba(248,113,113,0.08)' }}>
              <FiLogOut size={15} style={{ color: '#f87171' }} />
            </div>
            <span className="font-body text-sm font-medium" style={{ color: '#f87171' }}>Logout</span>
          </button>
        </div>

        {/* ── Edit Profile Panel ── */}
        {tab === 'profile' && (
          <div className="mb-5 p-5"
            style={{ backgroundColor: CARD, borderRadius: '16px', border: `1px solid ${BORDER}`, boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)' }}>
            <EditProfileForm user={user} updateUser={updateUser} isDark={isDark} TEXT={TEXT} DIM={DIM} BG={BG} onClose={() => setTab('')} />
          </div>
        )}

        {/* ── Change Password Panel ── */}
        {tab === 'password' && (
          <div className="mb-5 p-5"
            style={{ backgroundColor: CARD, borderRadius: '16px', border: `1px solid ${BORDER}`, boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)' }}>
            <ChangePasswordForm isDark={isDark} TEXT={TEXT} DIM={DIM} BG={BG} onClose={() => setTab('')} />
          </div>
        )}

      </div>
    </div>
  );
}

function EditProfileForm({ user, updateUser, isDark, TEXT, DIM, BG, onClose }) {
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authAPI.updateProfile(form);
      updateUser(res.user);
      toast.success('Profile updated!');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to update');
    } finally { setSaving(false); }
  };

  const inputSt = { backgroundColor: isDark ? '#0d0d0d' : '#f5f5f5', color: TEXT, border: `1px solid rgba(255,255,255,0.1)`, borderRadius: '10px', padding: '12px 14px', fontSize: '14px', outline: 'none', width: '100%', fontFamily: 'Jost,sans-serif' };

  return (
    <>
      <h3 className="font-display text-lg font-light mb-4" style={{ color: TEXT }}>Edit Profile</h3>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[
          { label: 'Full Name', key: 'name', type: 'text', ph: 'Your full name' },
          { label: 'Phone', key: 'phone', type: 'tel', ph: '10-digit number' },
        ].map(f => (
          <div key={f.key}>
            <label style={{ display: 'block', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: DIM, marginBottom: '6px', fontFamily: 'Jost,sans-serif' }}>{f.label}</label>
            <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.ph} style={inputSt}
              onFocus={e => e.target.style.borderColor = GOLD}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
          </div>
        ))}
        <div>
          <label style={{ display: 'block', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: DIM, marginBottom: '6px', fontFamily: 'Jost,sans-serif' }}>Email</label>
          <input value={user?.email || ''} readOnly style={{ ...inputSt, backgroundColor: isDark ? '#0a0a0a' : '#eee', color: DIM, cursor: 'not-allowed', border: '1px solid transparent' }} />
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginTop: '3px', fontFamily: 'Jost,sans-serif' }}>Cannot be changed</p>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="flex-1 font-body text-white flex items-center justify-center gap-1.5"
            style={{ backgroundColor: saving ? 'rgba(201,168,76,0.5)' : GOLD, border: 'none', borderRadius: '10px', padding: '12px', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? '⟳ Saving...' : <><FiCheck size={13} /> Save Changes</>}
          </button>
          <button type="button" onClick={onClose}
            className="font-body"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: '10px', padding: '12px 18px', fontSize: '11px', color: DIM, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </form>
    </>
  );
}

function ChangePasswordForm({ isDark, TEXT, DIM, BG, onClose }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword.length < 6) { setError('Min. 6 characters required.'); return; }
    if (form.newPassword !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    setSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success('Password changed!');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed. Check your current password.');
    } finally { setSaving(false); }
  };

  const inputSt = { backgroundColor: isDark ? '#0d0d0d' : '#f5f5f5', color: TEXT, border: `1px solid rgba(255,255,255,0.1)`, borderRadius: '10px', padding: '12px 14px', fontSize: '14px', outline: 'none', width: '100%', fontFamily: 'Jost,sans-serif' };

  return (
    <>
      <h3 className="font-display text-lg font-light mb-4" style={{ color: TEXT }}>Change Password</h3>
      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 mb-4" style={{ backgroundColor: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '8px' }}>
          <span className="font-body text-sm" style={{ color: '#f87171' }}>{error}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[
          { label: 'Current Password', key: 'currentPassword' },
          { label: 'New Password', key: 'newPassword' },
          { label: 'Confirm New Password', key: 'confirmPassword' },
        ].map(f => (
          <div key={f.key}>
            <label style={{ display: 'block', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: DIM, marginBottom: '6px', fontFamily: 'Jost,sans-serif' }}>{f.label}</label>
            <input type="password" value={form[f.key]} onChange={e => { setForm(p => ({ ...p, [f.key]: e.target.value })); setError(''); }}
              required style={inputSt}
              onFocus={e => e.target.style.borderColor = GOLD}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
          </div>
        ))}
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="flex-1 font-body text-white flex items-center justify-center gap-1.5"
            style={{ backgroundColor: saving ? 'rgba(201,168,76,0.5)' : GOLD, border: 'none', borderRadius: '10px', padding: '12px', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? '⟳ Changing...' : <><FiCheck size={13} /> Update Password</>}
          </button>
          <button type="button" onClick={onClose}
            style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: '10px', padding: '12px 18px', fontSize: '11px', color: DIM, cursor: 'pointer', fontFamily: 'Jost,sans-serif' }}>
            Cancel
          </button>
        </div>
      </form>
    </>
  );
}

export default ProfilePage;