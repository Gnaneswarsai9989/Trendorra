import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import { authAPI } from '../services/api';
import logo from '../assets/logo.png';

const GOLD = '#C9A84C';
const BG = '#0e0e0e';

const CSS = `
  .auth-mobile  { display:flex!important; }
  .auth-desktop { display:none!important; }
  @media(min-width:1024px){
    .auth-mobile  { display:none!important; }
    .auth-desktop { display:flex!important; }
  }
  .auth-input{
    width:100%; background:rgba(255,255,255,0.06); color:#fff;
    border-radius:10px; padding:13px 16px; font-size:14px;
    outline:none; box-sizing:border-box; transition:border-color 0.2s;
    font-family:inherit;
  }
  .auth-input::placeholder{ color:rgba(255,255,255,0.25); }
  .auth-input:focus{ background:rgba(255,255,255,0.09); }
`;

/* ════════════════════════════════
   LOGIN PAGE
════════════════════════════════ */
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

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setErrorField('');
    if (!email.trim()) { setError('Please enter your email address.'); setErrorField('email'); return; }
    if (!password) { setError('Please enter your password.'); setErrorField('password'); return; }
    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);
    if (res.success) {
      setTimeout(() => navigate(res.user?.role === 'admin' ? '/admin' : from, { replace: true }), 80);
    } else {
      const msg = res.message || 'Login failed.';
      setError(msg);
      if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('incorrect')) setErrorField('password');
      else if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('account')) setErrorField('email');
      else setErrorField('both');
    }
  };

  const bc = (f) => (errorField === f || errorField === 'both') ? 'rgba(248,113,113,0.65)' : 'rgba(255,255,255,0.1)';
  const lc = (f) => (errorField === f || errorField === 'both') ? '#f87171' : 'rgba(255,255,255,0.4)';

  /* ── shared form block (inline JSX, NOT a nested component) ── */
  const formBlock = (
    <form onSubmit={submit} autoComplete="on">
      {/* Email */}
      <div style={{ marginBottom: 15 }}>
        <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: lc('email'), marginBottom: 7 }}>
          Email Address
        </label>
        <input
          className="auth-input"
          type="email"
          autoComplete="email"
          value={email}
          onChange={e => { setEmail(e.target.value); if (errorField === 'email' || errorField === 'both') { setError(''); setErrorField(''); } }}
          placeholder="you@example.com"
          style={{ border: `1px solid ${bc('email')}` }}
          onFocus={e => { if (errorField !== 'email' && errorField !== 'both') e.target.style.borderColor = GOLD; }}
          onBlur={e => { if (errorField !== 'email' && errorField !== 'both') e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
        />
      </div>
      {/* Password */}
      <div style={{ marginBottom: 26 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
          <label style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: lc('password') }}>Password</label>
          <Link to="/forgot-password" style={{ fontSize: 11, color: GOLD, textDecoration: 'none' }}>Forgot password?</Link>
        </div>
        <div style={{ position: 'relative' }}>
          <input
            className="auth-input"
            type={showPass ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={e => { setPassword(e.target.value); if (errorField === 'password' || errorField === 'both') { setError(''); setErrorField(''); } }}
            placeholder="Enter your password"
            style={{ border: `1px solid ${bc('password')}`, paddingRight: 46 }}
            onFocus={e => { if (errorField !== 'password' && errorField !== 'both') e.target.style.borderColor = GOLD; }}
            onBlur={e => { if (errorField !== 'password' && errorField !== 'both') e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          />
          <button type="button" onClick={() => setShowPass(p => !p)}
            style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
            {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
          </button>
        </div>
      </div>
      {/* Submit */}
      <button type="submit" disabled={submitting}
        style={{ width: '100%', backgroundColor: submitting ? 'rgba(201,168,76,0.5)' : GOLD, color: submitting ? 'rgba(255,255,255,0.5)' : '#111', border: 'none', borderRadius: 10, padding: '14px', fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 700, transition: 'background 0.2s' }}>
        {submitting ? '⟳  Signing in…' : 'Sign In'}
      </button>
      {/* Google */}
      <button type="button" onClick={() => authAPI.googleLogin()}
        style={{ width: '100%', marginTop: 11, backgroundColor: '#fff', border: 'none', borderRadius: 10, padding: '12px 16px', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', fontWeight: 500, color: '#333' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M21.6 12.227c0-.68-.06-1.333-.174-1.957H12v3.71h5.332c-.23 1.242-.938 2.297-1.998 3.006v2.5h3.23c1.894-1.747 2.99-4.314 2.99-7.26z" fill="#4285F4" />
          <path d="M12 22c2.7 0 4.97-.9 6.63-2.45l-3.23-2.5c-.9.6-2.05.95-3.4.95-2.61 0-4.82-1.76-5.61-4.12H2.91v2.58C4.56 19.86 8.04 22 12 22z" fill="#34A853" />
          <path d="M6.39 13.88a6.6 6.6 0 010-3.52V7.78H2.91a10 10 0 000 7.44l3.48-1.34z" fill="#FBBC05" />
          <path d="M12 6.5c1.47 0 2.8.5 3.85 1.48l2.89-2.79C16.96 3.59 14.7 2.5 12 2.5 8.04 2.5 4.56 4.64 2.91 7.78l3.48 2.6C7.18 8.26 9.39 6.5 12 6.5z" fill="#EA4335" />
        </svg>
        Sign in with Google
      </button>
    </form>
  );

  return (
    <>
      <style>{CSS}</style>
      <div style={{ backgroundColor: BG }}>

        {/* ════ MOBILE ════ */}
        <div className="auth-mobile" style={{ flexDirection: 'column', minHeight: '100svh' }}>
          {/* Hero image */}
          <div style={{ position: 'relative', width: '100%', height: 260, flexShrink: 0, overflow: 'hidden' }}>
            <img src="/signinimage.png" alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(14,14,14,0.15) 0%,rgba(14,14,14,0) 30%,rgba(14,14,14,0.9) 80%,#0e0e0e 100%)' }} />
            {/* Logo over image */}
            <div style={{ position: 'absolute', bottom: 24, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>

            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${GOLD}70 50%,transparent)` }} />
          </div>
          {/* Form */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}
            style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '32px 24px 52px' }}>
            <div style={{ width: '100%', maxWidth: 400 }}>
              <p style={{ color: GOLD, fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', margin: '0 0 6px' }}>Welcome back</p>
              <h2 style={{ color: '#fff', fontSize: 30, fontWeight: 300, margin: '0 0 28px' }}>Sign In</h2>
              {error && (
                <div style={{ display: 'flex', gap: 10, padding: '11px 14px', background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.28)', borderRadius: 10, marginBottom: 18 }}>
                  <FiAlertCircle size={15} style={{ color: '#f87171', flexShrink: 0, marginTop: 2 }} />
                  <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{error}</p>
                </div>
              )}
              {formBlock}
              <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                Don't have an account?{' '}
                <Link to="/register" style={{ color: GOLD, fontWeight: 600, textDecoration: 'none' }}>Create Account</Link>
              </p>
            </div>
          </motion.div>
        </div>

        {/* ════ DESKTOP ════ */}
        <div className="auth-desktop" style={{ height: '100vh', overflow: 'hidden' }}>

          {/* Left image panel */}
          <div style={{ position: 'relative', width: '50%', flexShrink: 0, overflow: 'hidden' }}>
            <img src="/signinimage.png" alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
            {/* Right edge fade into dark form panel */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(14,14,14,0) 40%,rgba(14,14,14,0.65) 78%,rgba(14,14,14,0.97) 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(14,14,14,0.4) 0%,transparent 18%,transparent 80%,rgba(14,14,14,0.4) 100%)' }} />
          </div>

          {/* Gold vertical divider */}
          <div style={{ width: 1, flexShrink: 0, alignSelf: 'stretch', background: `linear-gradient(180deg,transparent,${GOLD}80 22%,${GOLD}80 78%,transparent)` }} />

          {/* Right form panel */}
          <div style={{ width: '50%', flexShrink: 0, backgroundColor: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 72px', overflow: 'hidden' }}>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
              style={{ width: '100%', maxWidth: 420 }}>
              <p style={{ color: GOLD, fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', margin: '0 0 10px' }}>Welcome back</p>
              <h1 style={{ color: '#fff', fontSize: 42, fontWeight: 300, margin: '0 0 36px', lineHeight: 1.1 }}>Sign In</h1>
              {error && (
                <div style={{ display: 'flex', gap: 12, padding: '12px 16px', background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.28)', borderRadius: 10, marginBottom: 22 }}>
                  <FiAlertCircle size={16} style={{ color: '#f87171', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{error}</p>
                    {errorField === 'password' && <p style={{ color: 'rgba(248,113,113,0.65)', fontSize: 12, margin: '3px 0 0' }}>Check your password and try again.</p>}
                    {errorField === 'email' && <p style={{ color: 'rgba(248,113,113,0.65)', fontSize: 12, margin: '3px 0 0' }}>Try a different email or <Link to="/register" style={{ color: GOLD, textDecoration: 'underline' }}>create an account</Link>.</p>}
                  </div>
                </div>
              )}
              {formBlock}
              <p style={{ textAlign: 'center', marginTop: 26, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                Don't have an account?{' '}
                <Link to="/register" style={{ color: GOLD, fontWeight: 600, textDecoration: 'none' }}
                  onMouseOver={e => e.target.style.textDecoration = 'underline'}
                  onMouseOut={e => e.target.style.textDecoration = 'none'}>
                  Create Account
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════
   REGISTER PAGE
════════════════════════════════ */
export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [errorField, setErrorField] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setErrorField('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); setErrorField('password'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); setErrorField('confirm'); return; }
    setSubmitting(true);
    const res = await register({ name, email, phone, password });
    setSubmitting(false);
    if (res.success) navigate('/');
    else {
      const msg = res.message || 'Registration failed.';
      setError(msg);
      if (msg.toLowerCase().includes('email')) setErrorField('email');
      else if (msg.toLowerCase().includes('phone')) setErrorField('phone');
    }
  };

  const bc = (f) => errorField === f ? 'rgba(248,113,113,0.65)' : 'rgba(255,255,255,0.1)';
  const lc = (f) => errorField === f ? '#f87171' : 'rgba(255,255,255,0.4)';
  const fo = (f) => (e) => { if (errorField !== f) e.target.style.borderColor = GOLD; };
  const bl = (f) => (e) => { if (errorField !== f) e.target.style.borderColor = 'rgba(255,255,255,0.1)'; };
  const clr = (f) => () => { if (errorField === f) { setError(''); setErrorField(''); } };

  /* ── inline form block ── */
  const regBlock = (
    <form onSubmit={submit} autoComplete="on" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Name */}
      <div>
        <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: lc('name'), marginBottom: 7 }}>Full Name</label>
        <input className="auth-input" type="text" autoComplete="name" value={name}
          onChange={e => { setName(e.target.value); clr('name')(); }} placeholder="Your full name" required
          style={{ border: `1px solid ${bc('name')}` }} onFocus={fo('name')} onBlur={bl('name')} />
      </div>
      {/* Email */}
      <div>
        <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: lc('email'), marginBottom: 7 }}>Email Address</label>
        <input className="auth-input" type="email" autoComplete="email" value={email}
          onChange={e => { setEmail(e.target.value); clr('email')(); }} placeholder="you@example.com" required
          style={{ border: `1px solid ${bc('email')}` }} onFocus={fo('email')} onBlur={bl('email')} />
      </div>
      {/* Phone */}
      <div>
        <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: lc('phone'), marginBottom: 7 }}>Phone Number <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}>(optional)</span></label>
        <input className="auth-input" type="tel" autoComplete="tel" value={phone}
          onChange={e => { setPhone(e.target.value); clr('phone')(); }} placeholder="10-digit mobile number"
          style={{ border: `1px solid ${bc('phone')}` }} onFocus={fo('phone')} onBlur={bl('phone')} />
      </div>
      {/* Password */}
      <div>
        <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: lc('password'), marginBottom: 7 }}>Password</label>
        <div style={{ position: 'relative' }}>
          <input className="auth-input" type={showPass ? 'text' : 'password'} autoComplete="new-password" value={password}
            onChange={e => { setPassword(e.target.value); clr('password')(); }} placeholder="Min. 6 characters" required
            style={{ border: `1px solid ${bc('password')}`, paddingRight: 46 }} onFocus={fo('password')} onBlur={bl('password')} />
          <button type="button" onClick={() => setShowPass(p => !p)}
            style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
            {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
          </button>
        </div>
      </div>
      {/* Confirm */}
      <div>
        <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: lc('confirm'), marginBottom: 7 }}>Confirm Password</label>
        <input className="auth-input" type="password" autoComplete="new-password" value={confirm}
          onChange={e => { setConfirm(e.target.value); clr('confirm')(); }} placeholder="Repeat password" required
          style={{ border: `1px solid ${bc('confirm')}` }} onFocus={fo('confirm')} onBlur={bl('confirm')} />
      </div>
      {/* Submit */}
      <button type="submit" disabled={submitting}
        style={{ marginTop: 4, width: '100%', backgroundColor: submitting ? 'rgba(201,168,76,0.5)' : GOLD, color: submitting ? 'rgba(255,255,255,0.5)' : '#111', border: 'none', borderRadius: 10, padding: '14px', fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 700, transition: 'background 0.2s' }}>
        {submitting ? '⟳  Creating Account…' : 'Create Account'}
      </button>
    </form>
  );

  return (
    <>
      <style>{CSS}</style>
      <div style={{ backgroundColor: BG }}>

        {/* ════ MOBILE ════ */}
        <div className="auth-mobile" style={{ flexDirection: 'column', minHeight: '100svh' }}>
          <div style={{ position: 'relative', width: '100%', height: 220, flexShrink: 0, overflow: 'hidden' }}>
            <img src="/signinimage.png" alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(14,14,14,0.15) 0%,rgba(14,14,14,0) 28%,rgba(14,14,14,0.9) 80%,#0e0e0e 100%)' }} />
            <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>

            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${GOLD}70 50%,transparent)` }} />
          </div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}
            style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '28px 24px 56px' }}>
            <div style={{ width: '100%', maxWidth: 400 }}>
              <p style={{ color: GOLD, fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', margin: '0 0 6px' }}>Join Trendorra</p>
              <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 300, margin: '0 0 24px' }}>Create Account</h2>
              {error && (
                <div style={{ display: 'flex', gap: 10, padding: '11px 14px', background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.28)', borderRadius: 10, marginBottom: 16 }}>
                  <FiAlertCircle size={15} style={{ color: '#f87171', flexShrink: 0, marginTop: 2 }} />
                  <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{error}</p>
                </div>
              )}
              {regBlock}
              <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: GOLD, fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
              </p>
            </div>
          </motion.div>
        </div>

        {/* ════ DESKTOP ════ */}
        <div className="auth-desktop" style={{ height: '100vh', overflow: 'hidden' }}>

          {/* Left image */}
          <div style={{ position: 'relative', width: '50%', flexShrink: 0, overflow: 'hidden' }}>
            <img src="/signinimage.png" alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(14,14,14,0) 40%,rgba(14,14,14,0.65) 78%,rgba(14,14,14,0.97) 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(14,14,14,0.4) 0%,transparent 18%,transparent 80%,rgba(14,14,14,0.4) 100%)' }} />
          </div>

          {/* Divider */}
          <div style={{ width: 1, flexShrink: 0, alignSelf: 'stretch', background: `linear-gradient(180deg,transparent,${GOLD}80 22%,${GOLD}80 78%,transparent)` }} />

          {/* Right form — scrollable so all 5 fields fit on any screen height */}
          <div style={{ width: '50%', flexShrink: 0, backgroundColor: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 72px', overflowY: 'auto' }}>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
              style={{ width: '100%', maxWidth: 420 }}>
              <p style={{ color: GOLD, fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', margin: '0 0 10px' }}>Join Trendorra</p>
              <h1 style={{ color: '#fff', fontSize: 38, fontWeight: 300, margin: '0 0 30px', lineHeight: 1.1 }}>Create Account</h1>
              {error && (
                <div style={{ display: 'flex', gap: 12, padding: '12px 16px', background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.28)', borderRadius: 10, marginBottom: 20 }}>
                  <FiAlertCircle size={16} style={{ color: '#f87171', flexShrink: 0, marginTop: 2 }} />
                  <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{error}</p>
                </div>
              )}
              {regBlock}
              <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: GOLD, fontWeight: 600, textDecoration: 'none' }}
                  onMouseOver={e => e.target.style.textDecoration = 'underline'}
                  onMouseOut={e => e.target.style.textDecoration = 'none'}>
                  Sign In
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}

export default LoginPage;