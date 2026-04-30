import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import { authAPI } from '../services/api';
import logo from '../assets/logo.png';

const GOLD = '#C9A84C';
const BG   = '#111111';

/* ─── Global styles injected once ─────────────────────────────────────── */
const CSS = `
  .auth-mobile  { display: flex !important; }
  .auth-desktop { display: none !important; }
  @media (min-width: 1024px) {
    .auth-mobile  { display: none  !important; }
    .auth-desktop { display: flex  !important; }
  }
  .auth-input {
    width: 100%; background: rgba(255,255,255,0.05); color: #fff;
    border-radius: 10px; padding: 12px 16px; font-size: 14px;
    outline: none; box-sizing: border-box; transition: border-color 0.2s;
    font-family: inherit;
  }
  .auth-btn-gold {
    width: 100%; border: none; border-radius: 10px; padding: 13px;
    font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase;
    cursor: pointer; font-weight: 600; transition: background-color 0.2s;
  }
`;

function InjectStyles() {
  return <style>{CSS}</style>;
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M21.6 12.227c0-.68-.06-1.333-.174-1.957H12v3.71h5.332c-.23 1.242-.938 2.297-1.998 3.006v2.5h3.23c1.894-1.747 2.99-4.314 2.99-7.26z" fill="#4285F4"/>
    <path d="M12 22c2.7 0 4.97-.9 6.63-2.45l-3.23-2.5c-.9.6-2.05.95-3.4.95-2.61 0-4.82-1.76-5.61-4.12H2.91v2.58C4.56 19.86 8.04 22 12 22z" fill="#34A853"/>
    <path d="M6.39 13.88a6.6 6.6 0 010-3.52V7.78H2.91a10 10 0 000 7.44l3.48-1.34z" fill="#FBBC05"/>
    <path d="M12 6.5c1.47 0 2.8.5 3.85 1.48l2.89-2.79C16.96 3.59 14.7 2.5 12 2.5 8.04 2.5 4.56 4.64 2.91 7.78l3.48 2.6C7.18 8.26 9.39 6.5 12 6.5z" fill="#EA4335"/>
  </svg>
);

/* ════════════════════════════════════════════
   LOGIN PAGE
════════════════════════════════════════════ */
export function LoginPage() {
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [error,      setError]      = useState('');
  const [errorField, setErrorField] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from || '/';

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setErrorField('');
    if (!email.trim()) { setError('Please enter your email address.'); setErrorField('email');    return; }
    if (!password)     { setError('Please enter your password.');      setErrorField('password'); return; }
    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);
    if (res.success) {
      setTimeout(() => navigate(res.user?.role === 'admin' ? '/admin' : from, { replace: true }), 80);
    } else {
      const msg = res.message || 'Login failed.';
      setError(msg);
      if      (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('incorrect')) setErrorField('password');
      else if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('account') || msg.toLowerCase().includes('found')) setErrorField('email');
      else    setErrorField('both');
    }
  };

  const bc = (f) => (errorField===f||errorField==='both') ? 'rgba(248,113,113,0.7)' : 'rgba(255,255,255,0.12)';
  const lc = (f) => (errorField===f||errorField==='both') ? '#f87171' : 'rgba(255,255,255,0.45)';

  const clearField = (f) => () => { if(errorField===f||errorField==='both'){setError('');setErrorField('');} };
  const focusBorder = (f) => (e) => { if(errorField!==f&&errorField!=='both') e.target.style.borderColor=GOLD; };
  const blurBorder  = (f) => (e) => { if(errorField!==f&&errorField!=='both') e.target.style.borderColor='rgba(255,255,255,0.12)'; };

  const ErrorBanner = () => error ? (
    <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'11px 14px', background:'rgba(248,113,113,0.07)', border:'1px solid rgba(248,113,113,0.28)', borderRadius:10, marginBottom:16 }}>
      <FiAlertCircle size={15} style={{ color:'#f87171', flexShrink:0, marginTop:2 }} />
      <p style={{ color:'#f87171', fontSize:13, margin:0 }}>{error}</p>
    </div>
  ) : null;

  const LoginForm = () => (
    <form onSubmit={submit}>
      <div style={{ marginBottom:14 }}>
        <label style={{ display:'block', fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:lc('email'), marginBottom:7 }}>Email Address</label>
        <input className="auth-input" type="email" value={email}
          onChange={e=>{setEmail(e.target.value);clearField('email')();}}
          placeholder="you@example.com"
          style={{ border:`1px solid ${bc('email')}` }}
          onFocus={focusBorder('email')} onBlur={blurBorder('email')} />
      </div>
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
          <label style={{ fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:lc('password') }}>Password</label>
          <Link to="/forgot-password" style={{ fontSize:11, color:GOLD, textDecoration:'none' }}>Forgot password?</Link>
        </div>
        <div style={{ position:'relative' }}>
          <input className="auth-input" type={showPass?'text':'password'} value={password}
            onChange={e=>{setPassword(e.target.value);clearField('password')();}}
            placeholder="Enter your password"
            style={{ border:`1px solid ${bc('password')}`, paddingRight:46 }}
            onFocus={focusBorder('password')} onBlur={blurBorder('password')} />
          <button type="button" onClick={()=>setShowPass(!showPass)}
            style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.32)', background:'none', border:'none', cursor:'pointer', padding:0 }}>
            {showPass ? <FiEyeOff size={16}/> : <FiEye size={16}/>}
          </button>
        </div>
      </div>
      <button className="auth-btn-gold" type="submit" disabled={submitting}
        style={{ backgroundColor:submitting?'rgba(201,168,76,0.5)':GOLD, color:submitting?'rgba(255,255,255,0.6)':'#111', cursor:submitting?'not-allowed':'pointer' }}>
        {submitting ? '⟳ Signing in…' : 'Sign In'}
      </button>
      <button 
  type="button" 
  onClick={() => authAPI.googleLogin()}
  style={{
    width: '100%',
    marginTop: 10,
   backgroundColor: '#fff',
  color: '#111',
  border: '1px solid #ddd',
    borderRadius: 10,
    padding: '11px',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    cursor: 'pointer',
    fontWeight: 500
  }}
>
  <GoogleIcon /> Sign in with Google
</button>
    </form>
  );

  return (
    <>
      <InjectStyles />
      <div style={{ backgroundColor: BG }}>

        {/* ── MOBILE ── */}
        <div className="auth-mobile" style={{ flexDirection:'column', minHeight:'100svh' }}>
          <div style={{ position:'relative', width:'100%', height:240, flexShrink:0, overflow:'hidden' }}>
            <img src="/signinimage.png" alt=""
              style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 30%' }} />
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,rgba(17,17,17,0.2) 0%,rgba(17,17,17,0) 30%,rgba(17,17,17,0.88) 82%,#111 100%)' }} />
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6 }}>
            </div>
            <div style={{ position:'absolute', bottom:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${GOLD}80 50%,transparent)` }} />
          </div>
          <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{duration:0.35,delay:0.08}}
            style={{ flex:1, display:'flex', justifyContent:'center', alignItems:'flex-start', padding:'28px 22px 48px' }}>
            <div style={{ width:'100%', maxWidth:400 }}>
              <div style={{ marginBottom:22 }}>
                <p style={{ color:GOLD, fontSize:10, letterSpacing:'0.28em', textTransform:'uppercase', margin:'0 0 7px' }}>Welcome back</p>
                <h2 style={{ color:'#fff', fontSize:28, fontWeight:300, margin:0 }}>Sign In</h2>
              </div>
              <ErrorBanner />
              <LoginForm />
              <p style={{ textAlign:'center', marginTop:18, fontSize:13, color:'rgba(255,255,255,0.38)' }}>
                Don't have an account?{' '}
                <Link to="/register" style={{ color:GOLD, fontWeight:600, textDecoration:'none' }}>Create Account</Link>
              </p>
            </div>
          </motion.div>
        </div>

        {/* ── DESKTOP ── */}
        <div className="auth-desktop" style={{ height:'100vh', overflow:'hidden' }}>

          {/* Left: image 50% */}
          <div style={{ position:'relative', width:'50%', flexShrink:0, overflow:'hidden' }}>
            <img src="/signinimage.png" alt=""
              style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center' }} />
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent 50%,rgba(17,17,17,0.6) 80%,rgba(17,17,17,0.95) 100%)' }} />
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,rgba(17,17,17,0.35) 0%,transparent 15%,transparent 82%,rgba(17,17,17,0.38) 100%)' }} />
          </div>

          {/* Divider */}
          <div style={{ width:1, flexShrink:0, alignSelf:'stretch', background:`linear-gradient(180deg,transparent,${GOLD}70 22%,${GOLD}70 78%,transparent)` }} />

          {/* Right: form 50% */}
          <div style={{ width:'50%', flexShrink:0, backgroundColor:BG, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 64px', overflow:'hidden' }}>
            <motion.div initial={{opacity:0,x:18}} animate={{opacity:1,x:0}} transition={{duration:0.42,delay:0.12}}
              style={{ width:'100%', maxWidth:420 }}>
              <div style={{ marginBottom:32 }}>
                <p style={{ color:GOLD, fontSize:10, letterSpacing:'0.28em', textTransform:'uppercase', margin:'0 0 10px' }}>Welcome back</p>
                <h1 style={{ color:'#fff', fontSize:38, fontWeight:300, margin:0 }}>Sign In</h1>
              </div>
              <ErrorBanner />
              <LoginForm />
              <p style={{ textAlign:'center', marginTop:24, fontSize:13, color:'rgba(255,255,255,0.38)' }}>
                Don't have an account?{' '}
                <Link to="/register" style={{ color:GOLD, fontWeight:600, textDecoration:'none' }}
                  onMouseOver={e=>e.target.style.textDecoration='underline'}
                  onMouseOut={e =>e.target.style.textDecoration='none'}>
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

/* ════════════════════════════════════════════
   REGISTER PAGE
════════════════════════════════════════════ */
export function RegisterPage() {
  const [form,       setForm]       = useState({ name:'', email:'', phone:'', password:'', confirm:'' });
  const [showPass,   setShowPass]   = useState(false);
  const [error,      setError]      = useState('');
  const [errorField, setErrorField] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate     = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setErrorField('');
    if (form.password.length < 6)       { setError('Password must be at least 6 characters.'); setErrorField('password'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.');                 setErrorField('confirm');  return; }
    setSubmitting(true);
    const res = await register({ name:form.name, email:form.email, phone:form.phone, password:form.password });
    setSubmitting(false);
    if (res.success) navigate('/');
    else {
      const msg = res.message || 'Registration failed.';
      setError(msg);
      if      (msg.toLowerCase().includes('email')) setErrorField('email');
      else if (msg.toLowerCase().includes('phone')) setErrorField('phone');
    }
  };

  const set  = (k) => (e) => { setForm(p=>({...p,[k]:e.target.value})); if(errorField===k){setError('');setErrorField('');} };
  const bc   = (f) => errorField===f ? 'rgba(248,113,113,0.7)' : 'rgba(255,255,255,0.12)';
  const lc   = (f) => errorField===f ? '#f87171' : 'rgba(255,255,255,0.45)';

  const fields = [
    { k:'name',     label:'Full Name',        type:'text',                       ph:'Your full name',         req:true  },
    { k:'email',    label:'Email Address',    type:'email',                      ph:'you@example.com',        req:true  },
    { k:'phone',    label:'Phone Number',     type:'tel',                        ph:'10-digit mobile number', req:false },
    { k:'password', label:'Password',         type:showPass?'text':'password',   ph:'Min. 6 characters',      req:true  },
    { k:'confirm',  label:'Confirm Password', type:'password',                   ph:'Repeat password',        req:true  },
  ];

  const RegForm = () => (
    <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:13 }}>
      {fields.map(f => (
        <div key={f.k}>
          <label style={{ display:'block', fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:lc(f.k), marginBottom:6 }}>{f.label}</label>
          <input className="auth-input" type={f.type} value={form[f.k]} onChange={set(f.k)} placeholder={f.ph} required={f.req}
            style={{ border:`1px solid ${bc(f.k)}` }}
            onFocus={e=>{if(errorField!==f.k) e.target.style.borderColor=GOLD;}}
            onBlur={e =>{if(errorField!==f.k) e.target.style.borderColor='rgba(255,255,255,0.12)';}} />
        </div>
      ))}
      <button className="auth-btn-gold" type="submit" disabled={submitting}
        style={{ marginTop:4, backgroundColor:submitting?'rgba(201,168,76,0.5)':GOLD, color:submitting?'rgba(255,255,255,0.6)':'#111', cursor:submitting?'not-allowed':'pointer' }}>
        {submitting ? '⟳ Creating Account…' : 'Create Account'}
      </button>
    </form>
  );

  return (
    <>
      <InjectStyles />
      <div style={{ backgroundColor: BG }}>

        {/* ── MOBILE ── */}
       <div className="auth-mobile" style={{ flexDirection:'column', minHeight:'100svh' }}>
          <div style={{ position:'relative', width:'100%', height:240, flexShrink:0, overflow:'hidden' }}>
            <img src="/signinimage.png" alt=""
              style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 30%' }} />
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,rgba(17,17,17,0.2) 0%,rgba(17,17,17,0) 30%,rgba(17,17,17,0.88) 82%,#111 100%)' }} />
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6 }}>
            </div>
            <div style={{ position:'absolute', bottom:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${GOLD}80 50%,transparent)` }} />
          </div>
          <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{duration:0.35,delay:0.08}}
            style={{ flex:1, display:'flex', justifyContent:'center', alignItems:'flex-start', padding:'26px 22px 52px' }}>
            <div style={{ width:'100%', maxWidth:400 }}>
              <div style={{ marginBottom:20 }}>
                <p style={{ color:GOLD, fontSize:10, letterSpacing:'0.28em', textTransform:'uppercase', margin:'0 0 7px' }}>Join Trendorra</p>
                <h2 style={{ color:'#fff', fontSize:26, fontWeight:300, margin:0 }}>Create Account</h2>
              </div>
              {error && (
                <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'11px 14px', background:'rgba(248,113,113,0.07)', border:'1px solid rgba(248,113,113,0.28)', borderRadius:10, marginBottom:14 }}>
                  <FiAlertCircle size={15} style={{ color:'#f87171', flexShrink:0, marginTop:2 }} />
                  <p style={{ color:'#f87171', fontSize:13, margin:0 }}>{error}</p>
                </div>
              )}
              <RegForm />
              <p style={{ textAlign:'center', marginTop:18, fontSize:13, color:'rgba(255,255,255,0.38)' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color:GOLD, fontWeight:600, textDecoration:'none' }}>Sign In</Link>
              </p>
            </div>
          </motion.div>
        </div>

        {/* ── DESKTOP ── */}
        <div className="auth-desktop" style={{ height:'100vh', overflow:'hidden' }}>

          {/* Left: image 50% */}
          <div style={{ position:'relative', width:'50%', flexShrink:0, overflow:'hidden' }}>
            <img src="signinimage.png" alt=""
              style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center', opacity:0.65 }} />
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent 50%,rgba(17,17,17,0.55) 80%,rgba(17,17,17,0.95) 100%)' }} />
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,rgba(17,17,17,0.35) 0%,transparent 16%,transparent 80%,rgba(17,17,17,0.4) 100%)' }} />
            
          </div>

          {/* Divider */}
          <div style={{ width:1, flexShrink:0, alignSelf:'stretch', background:`linear-gradient(180deg,transparent,${GOLD}70 22%,${GOLD}70 78%,transparent)` }} />

          {/* Right: form 50% */}
          <div style={{ width:'50%', flexShrink:0, backgroundColor:BG, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 64px', overflow:'hidden' }}>
            <motion.div initial={{opacity:0,x:18}} animate={{opacity:1,x:0}} transition={{duration:0.42,delay:0.12}}
              style={{ width:'100%', maxWidth:420 }}>
              <div style={{ marginBottom:28 }}>
                <p style={{ color:GOLD, fontSize:10, letterSpacing:'0.28em', textTransform:'uppercase', margin:'0 0 10px' }}>Join Trendorra</p>
                <h1 style={{ color:'#fff', fontSize:36, fontWeight:300, margin:0 }}>Create Account</h1>
              </div>
              {error && (
                <div style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'12px 16px', background:'rgba(248,113,113,0.07)', border:'1px solid rgba(248,113,113,0.28)', borderRadius:10, marginBottom:18 }}>
                  <FiAlertCircle size={16} style={{ color:'#f87171', flexShrink:0, marginTop:2 }} />
                  <p style={{ color:'#f87171', fontSize:13, margin:0 }}>{error}</p>
                </div>
              )}
              <RegForm />
              <p style={{ textAlign:'center', marginTop:22, fontSize:13, color:'rgba(255,255,255,0.38)' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color:GOLD, fontWeight:600, textDecoration:'none' }}
                  onMouseOver={e=>e.target.style.textDecoration='underline'}
                  onMouseOut={e =>e.target.style.textDecoration='none'}>
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