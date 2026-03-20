import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import logo from '../assets/logo.png';

const GOLD = '#C9A84C';
const BG = '#111111';
const BORDER = 'rgba(255,255,255,0.08)';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [errorField, setErrorField] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const isDark = localStorage.getItem('trendora_theme') !== 'light';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrorField('');
    if (!email.trim()) {
      setError('Please enter your email address.');
      setErrorField('email');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      setErrorField('password');
      return;
    }
    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);
    if (res.success) {
      setTimeout(() => navigate(res.user?.role === 'admin' ? '/admin' : from, { replace: true }), 80);
    } else {
      const msg = res.message || 'Login failed. Please try again.';
      setError(msg);
      if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('incorrect')) {
        setErrorField('password');
      } else if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('account') || msg.toLowerCase().includes('found')) {
        setErrorField('email');
      } else {
        setErrorField('both');
      }
    }
  };

  // ✅ Fixed: points to backend port 5000
  const handleGoogleLogin = () => {
   window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`;
  };

  const borderColor = (field) => {
    if (errorField === field || errorField === 'both') return 'rgba(248,113,113,0.7)';
    return 'rgba(255,255,255,0.1)';
  };
  const labelColor = (field) => {
    if (errorField === field || errorField === 'both') return '#f87171';
    return 'rgba(255,255,255,0.45)';
  };

  // Google SVG icon
  const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21.6 12.227c0-.68-.06-1.333-.174-1.957H12v3.71h5.332c-.23 1.242-.938 2.297-1.998 3.006v2.5h3.23c1.894-1.747 2.99-4.314 2.99-7.26z" fill="#4285F4"/>
      <path d="M12 22c2.7 0 4.97-.9 6.63-2.45l-3.23-2.5c-.9.6-2.05.95-3.4.95-2.61 0-4.82-1.76-5.61-4.12H2.91v2.58C4.56 19.86 8.04 22 12 22z" fill="#34A853"/>
      <path d="M6.39 13.88a6.6 6.6 0 010-3.52V7.78H2.91a10 10 0 000 7.44l3.48-1.34z" fill="#FBBC05"/>
      <path d="M12 6.5c1.47 0 2.8.5 3.85 1.48l2.89-2.79C16.96 3.59 14.7 2.5 12 2.5 8.04 2.5 4.56 4.64 2.91 7.78l3.48 2.6C7.18 8.26 9.39 6.5 12 6.5z" fill="#EA4335"/>
    </svg>
  );

  return (
    <div className="min-h-0 md:min-h-screen flex" style={{ backgroundColor: BG }}>
      {/* Left image - desktop only */}
      <div className="hidden lg:block w-1/2 relative" style={{ backgroundColor: '#0a0a0a', borderRight: `1px solid ${BORDER}` }}>
        <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=900&q=90"
          alt="" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.45 }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 1 }}>
          <img src={logo} alt="Trendorra" className="h-20 w-auto mb-4 mix-blend-lighten" style={{ filter: 'brightness(1.2)' }} />
          <span className="font-accent text-2xl tracking-[0.4em]" style={{ color: GOLD }}>TRENDORRA</span>
          <p className="font-display text-xl font-light mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Premium Fashion Store</p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-start lg:items-center justify-center px-6 py-6 lg:py-12">

        {/* ── MOBILE CARD ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }} className="w-full max-w-md lg:hidden px-4 pt-2">
          <div className="flex justify-center mb-3">
            <img src={logo} alt="Trendorra" className="h-16 w-auto mix-blend-lighten" style={{ filter: 'brightness(1.2)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 420 }}>
              <div style={{ background: isDark ? 'rgba(10,10,10,0.88)' : 'rgba(255,255,255,0.02)', borderRadius: 14, padding: 14, boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.65)' : '0 6px 18px rgba(0,0,0,0.08)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.06)'}` }}>
                <div className="text-center mb-4">
                  <p style={{ color: GOLD, fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 6 }}>Welcome back</p>
                  <h2 className="font-display text-3xl font-light text-white" style={{ margin: 0 }}>Sign In</h2>
                </div>
                {error && (
                  <div className="flex items-start gap-3 px-3 py-3 mb-3" style={{ backgroundColor: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.28)', borderRadius: 8 }}>
                    <FiAlertCircle size={16} style={{ color: '#f87171', flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: 13, color: '#f87171' }}>{error}</div>
                  </div>
                )}
                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: 14 }}>
                    <label className="font-body block" style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: labelColor('email'), marginBottom: 8 }}>Email Address</label>
                    <input type="email" value={email}
                      onChange={e => { setEmail(e.target.value); if (errorField === 'email' || errorField === 'both') { setError(''); setErrorField(''); } }}
                      placeholder="you@example.com" className="font-body w-full"
                      style={{ backgroundColor: 'rgba(255,255,255,0.03)', color: '#fff', border: `1px solid ${borderColor('email')}`, borderRadius: 10, padding: '14px 16px', fontSize: 14, outline: 'none' }} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div className="flex justify-between" style={{ marginBottom: 8 }}>
                      <label className="font-body" style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: labelColor('password') }}>Password</label>
                      <Link to="/forgot-password" className="font-body" style={{ fontSize: 12, color: GOLD }}>Forgot?</Link>
                    </div>
                    <div className="relative">
                      <input type={showPass ? 'text' : 'password'} value={password}
                        onChange={e => { setPassword(e.target.value); if (errorField === 'password' || errorField === 'both') { setError(''); setErrorField(''); } }}
                        placeholder="Enter your password" className="font-body w-full"
                        style={{ backgroundColor: 'rgba(255,255,255,0.03)', color: '#fff', border: `1px solid ${borderColor('password')}`, borderRadius: 10, padding: '14px 44px 14px 16px', fontSize: 14, outline: 'none' }} />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none' }}>
                        {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={submitting} className="w-full font-body text-white"
                    style={{ backgroundColor: submitting ? 'rgba(201,168,76,0.55)' : GOLD, border: 'none', borderRadius: 9999, padding: '12px', fontSize: 14, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                    {submitting ? '⟳ Signing in...' : 'Sign In'}
                  </button>

                  {/* ✅ FIXED Mobile Google Button */}
                  <button type="button" onClick={handleGoogleLogin}
                    className="w-full font-body text-black mt-3"
                    style={{ backgroundColor: '#fff', border: 'none', borderRadius: 9999, padding: '10px', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer' }}>
                    <GoogleIcon />
                    Sign in with Google
                  </button>
                </form>
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>Don't have an account? <Link to="/register" style={{ color: GOLD, fontWeight: 600 }}>Create</Link></p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── DESKTOP FORM ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }} className="w-full max-w-md hidden lg:block">
          <div className="text-center mb-8">
            <p style={{ color: GOLD, fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '8px' }}>Welcome back</p>
            <h1 className="font-display text-4xl font-light text-white">Sign In</h1>
          </div>
          <div style={{ height: error ? 'auto' : '0', overflow: 'hidden', transition: 'height 0.2s', marginBottom: error ? '20px' : '0' }}>
            {error && (
              <div className="flex items-start gap-3 px-4 py-3"
                style={{ backgroundColor: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.35)', borderRadius: '10px' }}>
                <FiAlertCircle size={17} style={{ color: '#f87171', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p className="font-body text-sm font-medium" style={{ color: '#f87171' }}>{error}</p>
                  {errorField === 'password' && (
                    <p className="font-body text-xs mt-0.5" style={{ color: 'rgba(248,113,113,0.7)' }}>Check your password and try again.</p>
                  )}
                  {errorField === 'email' && (
                    <p className="font-body text-xs mt-0.5" style={{ color: 'rgba(248,113,113,0.7)' }}>
                      Try a different email or <Link to="/register" style={{ color: GOLD, textDecoration: 'underline' }}>create an account</Link>.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <label className="font-body block" style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: labelColor('email'), marginBottom: '8px' }}>
                Email Address
              </label>
              <input type="email" value={email}
                onChange={e => { setEmail(e.target.value); if (errorField === 'email' || errorField === 'both') { setError(''); setErrorField(''); } }}
                placeholder="you@example.com" className="font-body w-full"
                style={{ backgroundColor: '#0a0a0a', color: '#fff', border: `1px solid ${borderColor('email')}`, borderRadius: '8px', padding: '13px 16px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={e => { if (errorField !== 'email' && errorField !== 'both') e.target.style.borderColor = GOLD; }}
                onBlur={e => { if (errorField !== 'email' && errorField !== 'both') e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }} />
            </div>
            {/* Password */}
            <div style={{ marginBottom: '24px' }}>
              <div className="flex justify-between" style={{ marginBottom: '8px' }}>
                <label className="font-body" style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: labelColor('password') }}>Password</label>
                <Link to="/forgot-password" className="font-body" style={{ fontSize: '11px', color: GOLD }}>Forgot password?</Link>
              </div>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => { setPassword(e.target.value); if (errorField === 'password' || errorField === 'both') { setError(''); setErrorField(''); } }}
                  placeholder="Enter your password" className="font-body w-full"
                  style={{ backgroundColor: '#0a0a0a', color: '#fff', border: `1px solid ${borderColor('password')}`, borderRadius: '8px', padding: '13px 48px 13px 16px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s' }}
                  onFocus={e => { if (errorField !== 'password' && errorField !== 'both') e.target.style.borderColor = GOLD; }}
                  onBlur={e => { if (errorField !== 'password' && errorField !== 'both') e.target.style.borderColor = borderColor('password'); }} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:text-white"
                  style={{ color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>
            {/* Submit */}
            <button type="submit" disabled={submitting} className="w-full font-body text-white"
              style={{ backgroundColor: submitting ? 'rgba(201,168,76,0.55)' : GOLD, border: 'none', borderRadius: '8px', padding: '14px', fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: submitting ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s' }}>
              {submitting ? '⟳ Signing in...' : 'Sign In'}
            </button>

            {/* ✅ FIXED Desktop Google Button */}
            <button type="button" onClick={handleGoogleLogin}
              className="w-full font-body text-black mt-3"
              style={{ backgroundColor: '#fff', border: 'none', borderRadius: '8px', padding: '12px', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer' }}>
              <GoogleIcon />
              Sign in with Google
            </button>
          </form>
          <p className="text-center font-body mt-6" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-medium" style={{ color: GOLD, textDecoration: 'none' }}
              onMouseOver={e => e.target.style.textDecoration = 'underline'}
              onMouseOut={e => e.target.style.textDecoration = 'none'}>
              Create Account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// ── Register Page ──
export function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [errorField, setErrorField] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setErrorField('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); setErrorField('password'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); setErrorField('confirm'); return; }
    setSubmitting(true);
    const res = await register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
    setSubmitting(false);
    if (res.success) navigate('/');
    else {
      const msg = res.message || 'Registration failed.';
      setError(msg);
      if (msg.toLowerCase().includes('email')) setErrorField('email');
      else if (msg.toLowerCase().includes('phone')) setErrorField('phone');
    }
  };

  const set = (k) => (e) => { setForm(p => ({ ...p, [k]: e.target.value })); if (errorField === k) { setError(''); setErrorField(''); } };
  const borderCol = (f) => errorField === f ? 'rgba(248,113,113,0.7)' : 'rgba(255,255,255,0.1)';
  const labelCol = (f) => errorField === f ? '#f87171' : 'rgba(255,255,255,0.45)';
  const inputStyle = (field, extra = {}) => ({
    backgroundColor: '#0a0a0a', color: '#fff', width: '100%',
    border: `1px solid ${borderCol(field)}`,
    borderRadius: '8px', padding: '13px 16px', fontSize: '14px', outline: 'none',
    fontFamily: 'Jost, sans-serif', ...extra,
  });

  return (
    <div className="min-h-0 md:min-h-screen flex" style={{ backgroundColor: BG }}>
      <div className="hidden lg:block w-1/2 relative" style={{ backgroundColor: '#0a0a0a', borderRight: `1px solid ${BORDER}` }}>
        <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=90"
          alt="" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.45 }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 1 }}>
          <img src={logo} alt="Trendorra" className="h-20 w-auto mb-4 mix-blend-lighten" style={{ filter: 'brightness(1.2)' }} />
          <span className="font-accent text-2xl tracking-[0.4em]" style={{ color: GOLD }}>TRENDORRA</span>
          <p className="font-display text-xl font-light mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Join the Circle</p>
        </div>
      </div>
      <div className="flex-1 flex items-start lg:items-center justify-center px-6 py-6 lg:py-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="flex justify-center mb-8 lg:hidden">
            <img src={logo} alt="Trendorra" className="h-14 w-auto mix-blend-lighten" style={{ filter: 'brightness(1.2)' }} />
          </div>
          <div className="text-center mb-8">
            <p style={{ color: GOLD, fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '8px' }}>Join Trendorra</p>
            <h1 className="font-display text-4xl font-light text-white">Create Account</h1>
          </div>
          {error && (
            <div className="flex items-start gap-3 px-4 py-3 mb-5"
              style={{ backgroundColor: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.35)', borderRadius: '10px' }}>
              <FiAlertCircle size={17} style={{ color: '#f87171', flexShrink: 0, marginTop: '2px' }} />
              <p className="font-body text-sm" style={{ color: '#f87171' }}>{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { k: 'name',     label: 'Full Name',        type: 'text',                         ph: 'Your full name',        req: true },
              { k: 'email',    label: 'Email Address',    type: 'email',                        ph: 'you@example.com',       req: true },
              { k: 'phone',    label: 'Phone Number',     type: 'tel',                          ph: '10-digit mobile number', req: false },
              { k: 'password', label: 'Password',         type: showPass ? 'text' : 'password', ph: 'Min. 6 characters',     req: true },
              { k: 'confirm',  label: 'Confirm Password', type: 'password',                     ph: 'Repeat password',       req: true },
            ].map(field => (
              <div key={field.k}>
                <label className="font-body block"
                  style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: labelCol(field.k), marginBottom: '7px' }}>
                  {field.label}
                </label>
                <input type={field.type} value={form[field.k]} onChange={set(field.k)}
                  placeholder={field.ph} required={field.req} style={inputStyle(field.k)}
                  onFocus={e => { if (errorField !== field.k) e.target.style.borderColor = GOLD; }}
                  onBlur={e => { if (errorField !== field.k) e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }} />
              </div>
            ))}
            <button type="submit" disabled={submitting} className="font-body text-white"
              style={{ backgroundColor: submitting ? 'rgba(201,168,76,0.55)' : GOLD, border: 'none', borderRadius: '8px', padding: '14px', fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: submitting ? 'not-allowed' : 'pointer', marginTop: '4px' }}>
              {submitting ? '⟳ Creating Account...' : 'Create Account'}
            </button>
          </form>
          <p className="text-center font-body mt-6" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: GOLD }}>Sign In</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default LoginPage;