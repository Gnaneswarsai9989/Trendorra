import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { FiEye, FiEyeOff, FiAlertCircle, FiArrowRight } from 'react-icons/fi';
import { authAPI } from '../services/api';
import logo from '../assets/logo.png';

const GOLD = '#C9A84C';
const GOLD2 = '#E8C97A';
const BG = '#080808';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  .auth-wrap * { box-sizing: border-box; }
  .auth-wrap { font-family: 'DM Sans', sans-serif; background: ${BG}; color: #fff; }

  .auth-mobile  { display: flex !important; }
  .auth-desktop { display: none  !important; }
  @media (min-width: 1024px) {
    .auth-mobile  { display: none  !important; }
    .auth-desktop { display: flex  !important; }
  }

  /* ── Floating label inputs ── */
  .fl-wrap { position: relative; }
  .fl-input {
    width: 100%;
    background: rgba(255,255,255,0.05);
    color: #fff;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 22px 16px 8px;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
  }
  .fl-input::placeholder { color: transparent; }
  .fl-input:focus { background: rgba(255,255,255,0.08); border-color: ${GOLD}; }
  .fl-input.err  { border-color: rgba(248,113,113,0.6) !important; }

  .fl-label {
    position: absolute;
    left: 16px; top: 50%;
    transform: translateY(-50%);
    font-size: 13px;
    color: rgba(255,255,255,0.32);
    pointer-events: none;
    transition: all 0.18s ease;
    font-family: 'DM Sans', sans-serif;
  }
  .fl-input:focus ~ .fl-label,
  .fl-input:not(:placeholder-shown) ~ .fl-label {
    top: 10px; transform: none;
    font-size: 10px; letter-spacing: 0.1em;
    text-transform: uppercase; color: ${GOLD};
  }
  .fl-input.err ~ .fl-label { color: #f87171; }

  /* ── Gold button ── */
  .btn-gold {
    width: 100%; border: none; border-radius: 12px; padding: 15px;
    font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;
    font-weight: 700; font-family: 'DM Sans', sans-serif; color: #111;
    cursor: pointer;
    background: linear-gradient(135deg, ${GOLD} 0%, ${GOLD2} 50%, ${GOLD} 100%);
    background-size: 200% 100%;
    transition: background-position 0.4s ease, opacity 0.2s;
  }
  .btn-gold:hover:not(:disabled) { background-position: 100% 0; }
  .btn-gold:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── Google button ── */
  .btn-google {
    width: 100%;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px; padding: 13px;
    font-size: 13px; font-family: 'DM Sans', sans-serif;
    font-weight: 500; color: rgba(255,255,255,0.75);
    cursor: pointer; display: flex; align-items: center;
    justify-content: center; gap: 10px;
    transition: background 0.2s, border-color 0.2s;
  }
  .btn-google:hover { background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.18); }

  /* ── Divider ── */
  .auth-div {
    display: flex; align-items: center; gap: 12px;
    margin: 4px 0; color: rgba(255,255,255,0.18);
    font-size: 11px; letter-spacing: 0.1em;
  }
  .auth-div::before, .auth-div::after {
    content: ''; flex: 1; height: 1px;
    background: rgba(255,255,255,0.07);
  }

  /* ── Error banner ── */
  .err-banner {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 12px 14px;
    background: rgba(248,113,113,0.06);
    border: 1px solid rgba(248,113,113,0.22);
    border-radius: 10px; margin-bottom: 20px;
  }

  /* ── Gold glow orb (subtle, right panel only) ── */
  .gold-orb {
    position: absolute; border-radius: 50%;
    filter: blur(100px); pointer-events: none; z-index: 0;
  }
`;

/* ── Reusable float input ── */
function FloatInput({ label, type = 'text', value, onChange, onFocus, onBlur, hasError, rightSlot, autoComplete }) {
  return (
    <div className="fl-wrap">
      <input
        className={`fl-input${hasError ? ' err' : ''}`}
        type={type} value={value} onChange={onChange}
        onFocus={onFocus} onBlur={onBlur}
        placeholder=" " autoComplete={autoComplete}
        style={rightSlot ? { paddingRight: 46 } : {}}
      />
      <label className="fl-label">{label}</label>
      {rightSlot}
    </div>
  );
}

const EyeBtn = ({ show, toggle }) => (
  <button type="button" onClick={toggle}
    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.28)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', zIndex: 2 }}>
    {show ? <FiEyeOff size={16} /> : <FiEye size={16} />}
  </button>
);

const GoogleSVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M21.6 12.227c0-.68-.06-1.333-.174-1.957H12v3.71h5.332c-.23 1.242-.938 2.297-1.998 3.006v2.5h3.23c1.894-1.747 2.99-4.314 2.99-7.26z" fill="#4285F4" />
    <path d="M12 22c2.7 0 4.97-.9 6.63-2.45l-3.23-2.5c-.9.6-2.05.95-3.4.95-2.61 0-4.82-1.76-5.61-4.12H2.91v2.58C4.56 19.86 8.04 22 12 22z" fill="#34A853" />
    <path d="M6.39 13.88a6.6 6.6 0 010-3.52V7.78H2.91a10 10 0 000 7.44l3.48-1.34z" fill="#FBBC05" />
    <path d="M12 6.5c1.47 0 2.8.5 3.85 1.48l2.89-2.79C16.96 3.59 14.7 2.5 12 2.5 8.04 2.5 4.56 4.64 2.91 7.78l3.48 2.6C7.18 8.26 9.39 6.5 12 6.5z" fill="#EA4335" />
  </svg>
);

/* ── Shared image panel ── */
function ImagePanel() {
  return (
    <div style={{ position: 'relative', width: '50%', flexShrink: 0, overflow: 'hidden' }}>
      <img src="/signinimage.png" alt=""
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(8,8,8,0.5) 0%,transparent 55%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent 42%,rgba(8,8,8,0.65) 75%,rgba(8,8,8,0.98) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(8,8,8,0.38) 0%,transparent 18%,transparent 80%,rgba(8,8,8,0.42) 100%)' }} />

      {/* brand — top left */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.1 }}
        style={{ position: 'absolute', top: 38, left: 42, zIndex: 2, display: 'flex', alignItems: 'center', gap: 11 }}>

      </motion.div>

      {/* headline — bottom left */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.22 }}
        style={{ position: 'absolute', bottom: 50, left: 42, zIndex: 2, maxWidth: 310 }}>

        <div style={{ width: 34, height: 1, background: `linear-gradient(90deg,${GOLD},transparent)` }} />
      </motion.div>
    </div>
  );
}

/* ════════════════════════════
   LOGIN PAGE
════════════════════════════ */
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

  const isErr = (f) => errorField === f || errorField === 'both';
  const clr = (f) => () => { if (isErr(f)) { setError(''); setErrorField(''); } };

  const formJSX = (
    <form onSubmit={submit} autoComplete="on" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <FloatInput label="Email Address" type="email" value={email} autoComplete="email"
        onChange={e => { setEmail(e.target.value); clr('email')(); }}
        hasError={isErr('email')}
        onFocus={e => { if (!isErr('email')) e.target.style.borderColor = GOLD; }}
        onBlur={e => { if (!isErr('email')) e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
      />
      <FloatInput label="Password" type={showPass ? 'text' : 'password'} value={password} autoComplete="current-password"
        onChange={e => { setPassword(e.target.value); clr('password')(); }}
        hasError={isErr('password')}
        onFocus={e => { if (!isErr('password')) e.target.style.borderColor = GOLD; }}
        onBlur={e => { if (!isErr('password')) e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
        rightSlot={<EyeBtn show={showPass} toggle={() => setShowPass(p => !p)} />}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -4 }}>
        <Link to="/forgot-password" style={{ fontSize: 12, color: GOLD, textDecoration: 'none', opacity: 0.8 }}>Forgot password?</Link>
      </div>
      <button className="btn-gold" type="submit" disabled={submitting} style={{ marginTop: 4 }}>
        {submitting ? '⟳  Signing in…' : (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            Sign In <FiArrowRight size={14} />
          </span>
        )}
      </button>
      <div className="auth-div">or</div>
      <button type="button" className="btn-google" onClick={() => authAPI.googleLogin()}>
        <GoogleSVG /> Continue with Google
      </button>
    </form>
  );

  /* ── MOBILE ── */
  const mobileView = (
    <div className="auth-mobile" style={{ flexDirection: 'column', minHeight: '100svh' }}>
      <div style={{ position: 'relative', height: 255, flexShrink: 0, overflow: 'hidden' }}>
        <img src="/signinimage.png" alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(8,8,8,0.18) 0%,rgba(8,8,8,0) 32%,rgba(8,8,8,0.94) 84%,#080808 100%)' }} />
        {/* logo centered */}
        <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>

        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${GOLD}55 50%,transparent)` }} />
      </div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38, delay: 0.1 }}
        style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '30px 24px 52px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: GOLD, marginBottom: 8 }}>Welcome back</p>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 36, fontWeight: 300, color: '#fff', marginBottom: 26, lineHeight: 1.1 }}>Sign In</h2>
          {error && <div className="err-banner"><FiAlertCircle size={14} style={{ color: '#f87171', flexShrink: 0, marginTop: 2 }} /><p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{error}</p></div>}
          {formJSX}
          <p style={{ textAlign: 'center', marginTop: 22, fontSize: 13, color: 'rgba(255,255,255,0.28)' }}>
            No account?{' '}<Link to="/register" style={{ color: GOLD, fontWeight: 600, textDecoration: 'none' }}>Create one</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );

  /* ── DESKTOP ── */
  const desktopView = (
    <div className="auth-desktop" style={{ height: '100vh', overflow: 'hidden' }}>
      <ImagePanel />
      {/* gold divider */}
      <div style={{ width: 1, flexShrink: 0, alignSelf: 'stretch', background: `linear-gradient(180deg,transparent,${GOLD}85 22%,${GOLD}85 78%,transparent)` }} />
      {/* right panel — pure solid dark, NO grid, NO noise */}
      <div style={{
        position: 'relative', width: '50%', flexShrink: 0,
        backgroundColor: BG,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 72px', overflow: 'hidden',
      }}>
        {/* single subtle orb — very low opacity */}
        <div className="gold-orb" style={{ width: 340, height: 340, background: `radial-gradient(circle,rgba(201,168,76,0.07),transparent 70%)`, top: '10%', right: '-12%' }} />

        <motion.div initial={{ opacity: 0, x: 22 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.14 }}
          style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420 }}>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 11, letterSpacing: '0.32em', textTransform: 'uppercase', color: GOLD, marginBottom: 10 }}>Welcome back</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 52, fontWeight: 300, color: '#fff', marginBottom: 36, lineHeight: 1.05 }}>Sign In</h1>
          {error && (
            <div className="err-banner">
              <FiAlertCircle size={14} style={{ color: '#f87171', flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{error}</p>
                {errorField === 'password' && <p style={{ color: 'rgba(248,113,113,0.6)', fontSize: 12, marginTop: 3 }}>Check your password and try again.</p>}
                {errorField === 'email' && <p style={{ color: 'rgba(248,113,113,0.6)', fontSize: 12, marginTop: 3 }}>Try a different email or <Link to="/register" style={{ color: GOLD }}>create an account</Link>.</p>}
              </div>
            </div>
          )}
          {formJSX}
          <p style={{ textAlign: 'center', marginTop: 26, fontSize: 13, color: 'rgba(255,255,255,0.28)' }}>
            No account?{' '}
            <Link to="/register" style={{ color: GOLD, fontWeight: 600, textDecoration: 'none' }}
              onMouseOver={e => e.target.style.textDecoration = 'underline'}
              onMouseOut={e => e.target.style.textDecoration = 'none'}>
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="auth-wrap">
        {mobileView}
        {desktopView}
      </div>
    </>
  );
}

/* ════════════════════════════
   REGISTER PAGE
════════════════════════════ */
export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [strength, setStrength] = useState(0);
  const [error, setError] = useState('');
  const [errorField, setErrorField] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    setStrength(s);
  }, [password]);

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][strength];
  const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'][strength];

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

  const isErr = (f) => errorField === f;
  const clr = (f) => () => { if (isErr(f)) { setError(''); setErrorField(''); } };
  const fo = (f) => (e) => { if (!isErr(f)) e.target.style.borderColor = GOLD; };
  const bl = (f) => (e) => { if (!isErr(f)) e.target.style.borderColor = 'rgba(255,255,255,0.1)'; };

  const regJSX = (
    <form onSubmit={submit} autoComplete="on" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <FloatInput label="Full Name" type="text" value={name} autoComplete="name" onChange={e => { setName(e.target.value); clr('name')(); }} hasError={isErr('name')} onFocus={fo('name')} onBlur={bl('name')} />
      <FloatInput label="Email Address" type="email" value={email} autoComplete="email" onChange={e => { setEmail(e.target.value); clr('email')(); }} hasError={isErr('email')} onFocus={fo('email')} onBlur={bl('email')} />
      <FloatInput label="Phone Number (optional)" type="tel" value={phone} autoComplete="tel" onChange={e => { setPhone(e.target.value); clr('phone')(); }} hasError={isErr('phone')} onFocus={fo('phone')} onBlur={bl('phone')} />
      <div>
        <FloatInput label="Password" type={showPass ? 'text' : 'password'} value={password} autoComplete="new-password"
          onChange={e => { setPassword(e.target.value); clr('password')(); }}
          hasError={isErr('password')} onFocus={fo('password')} onBlur={bl('password')}
          rightSlot={<EyeBtn show={showPass} toggle={() => setShowPass(p => !p)} />} />
        {password.length > 0 && (
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? strengthColor : 'rgba(255,255,255,0.08)', transition: 'background 0.3s' }} />
              ))}
            </div>
            {strengthLabel && <p style={{ fontSize: 11, color: strengthColor, letterSpacing: '0.06em', margin: 0 }}>{strengthLabel}</p>}
          </div>
        )}
      </div>
      <FloatInput label="Confirm Password" type="password" value={confirm} autoComplete="new-password"
        onChange={e => { setConfirm(e.target.value); clr('confirm')(); }}
        hasError={isErr('confirm')} onFocus={fo('confirm')} onBlur={bl('confirm')} />
      <button className="btn-gold" type="submit" disabled={submitting} style={{ marginTop: 6 }}>
        {submitting ? '⟳  Creating account…' : (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            Create Account <FiArrowRight size={14} />
          </span>
        )}
      </button>
    </form>
  );

  /* ── MOBILE ── */
  const mobileView = (
    <div className="auth-mobile" style={{ flexDirection: 'column', minHeight: '100svh' }}>
      <div style={{ position: 'relative', height: 220, flexShrink: 0, overflow: 'hidden' }}>
        <img src="/signinimage.png" alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(8,8,8,0.15) 0%,rgba(8,8,8,0) 32%,rgba(8,8,8,0.94) 85%,#080808 100%)' }} />
        <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>

        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${GOLD}55 50%,transparent)` }} />
      </div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38, delay: 0.1 }}
        style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '28px 24px 56px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: GOLD, marginBottom: 8 }}>Join Trendorra</p>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, fontWeight: 300, color: '#fff', marginBottom: 22, lineHeight: 1.1 }}>Create Account</h2>
          {error && <div className="err-banner"><FiAlertCircle size={14} style={{ color: '#f87171', flexShrink: 0, marginTop: 2 }} /><p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{error}</p></div>}
          {regJSX}
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.28)' }}>
            Already have an account?{' '}<Link to="/login" style={{ color: GOLD, fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );

  /* ── DESKTOP ── */
  const desktopView = (
    <div className="auth-desktop" style={{ height: '100vh', overflow: 'hidden' }}>
      <ImagePanel />
      <div style={{ width: 1, flexShrink: 0, alignSelf: 'stretch', background: `linear-gradient(180deg,transparent,${GOLD}85 22%,${GOLD}85 78%,transparent)` }} />
      {/* right panel — clean solid dark */}
      <div style={{
        position: 'relative', width: '50%', flexShrink: 0,
        backgroundColor: BG,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 72px', overflowY: 'auto',
      }}>
        <div className="gold-orb" style={{ width: 300, height: 300, background: `radial-gradient(circle,rgba(201,168,76,0.06),transparent 70%)`, bottom: '8%', right: '-10%' }} />

        <motion.div initial={{ opacity: 0, x: 22 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.14 }}
          style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420 }}>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 11, letterSpacing: '0.32em', textTransform: 'uppercase', color: GOLD, marginBottom: 10 }}>Join Trendorra</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 46, fontWeight: 300, color: '#fff', marginBottom: 28, lineHeight: 1.05 }}>Create Account</h1>
          {error && <div className="err-banner"><FiAlertCircle size={14} style={{ color: '#f87171', flexShrink: 0, marginTop: 2 }} /><p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{error}</p></div>}
          {regJSX}
          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.28)' }}>
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
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="auth-wrap">
        {mobileView}
        {desktopView}
      </div>
    </>
  );
}

export default LoginPage;