import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiArrowLeft, FiAlertCircle, FiCheckCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import API from '../services/api';
import logo from '../assets/logo.png';

const GOLD = '#C9A84C';
const BG = '#111111';

const inputStyle = (hasError) => ({
  backgroundColor: '#0a0a0a',
  color: '#fff',
  width: '100%',
  border: `1px solid ${hasError ? 'rgba(248,113,113,0.7)' : 'rgba(255,255,255,0.1)'}`,
  borderRadius: '8px',
  padding: '13px 16px',
  fontSize: '14px',
  outline: 'none',
  fontFamily: 'Jost, sans-serif',
  boxSizing: 'border-box',
});

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1=email, 2=otp+newpass, 3=success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const navigate = useNavigate();

  // Step 1 — Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true);
    try {
      const res = await API.post('/auth/forgot-password', { email });
      setMaskedEmail(res.message?.match(/to (.+)$/)?.[1] || email);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally { setLoading(false); }
  };

  // Step 2 — Verify OTP + Reset password
  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) { setError('Please enter the 6-digit OTP.'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await API.post('/auth/reset-password', { email, otp, newPassword });
      setStep(3);
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-0 md:min-h-screen flex items-start lg:items-center justify-center px-6 py-6 lg:py-12" style={{ backgroundColor: BG }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img src={logo} alt="Trendorra" className="h-14 w-auto mix-blend-lighten"
            style={{ filter: 'brightness(1.2)' }} />
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-body font-medium transition-all"
                style={{
                  backgroundColor: step >= s ? GOLD : 'rgba(255,255,255,0.08)',
                  color: step >= s ? '#fff' : 'rgba(255,255,255,0.3)',
                }}>
                {step > s ? '✓' : s}
              </div>
              {s < 3 && <div className="w-8 h-px transition-all" style={{ backgroundColor: step > s ? GOLD : 'rgba(255,255,255,0.1)' }} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── Step 1: Enter Email ── */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)' }}>
                  <FiMail size={24} style={{ color: GOLD }} />
                </div>
                <h1 className="font-display text-3xl font-light text-white mb-2">Forgot Password?</h1>
                <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Enter your email and we'll send you a 6-digit OTP
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-3 px-4 py-3 mb-5"
                  style={{ backgroundColor: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '10px' }}>
                  <FiAlertCircle size={16} style={{ color: '#f87171', flexShrink: 0 }} />
                  <p className="font-body text-sm" style={{ color: '#f87171' }}>{error}</p>
                </div>
              )}

              <form onSubmit={handleSendOTP}>
                <label className="font-body block mb-2"
                  style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
                  Email Address
                </label>
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@example.com" required style={inputStyle(!!error)}
                  onFocus={e => e.target.style.borderColor = GOLD}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />

                <button type="submit" disabled={loading}
                  className="w-full font-body text-white mt-5"
                  style={{ backgroundColor: loading ? 'rgba(201,168,76,0.5)' : GOLD, border: 'none', borderRadius: '8px', padding: '14px', fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? '⟳ Sending OTP...' : 'Send OTP'}
                </button>
              </form>

              <div className="text-center mt-5">
                <Link to="/login" className="font-body text-sm flex items-center justify-center gap-1.5"
                  style={{ color: 'rgba(255,255,255,0.35)' }}>
                  <FiArrowLeft size={13} /> Back to Sign In
                </Link>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Enter OTP + New Password ── */}
              {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)' }}>
                  <FiLock size={24} style={{ color: GOLD }} />
                </div>
                <h1 className="font-display text-3xl font-light text-white mb-2">Check Your Email</h1>
                <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  OTP sent to <span style={{ color: GOLD }}>{maskedEmail}</span>
                </p>
                <p className="font-body text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Valid for 15 minutes · Check spam folder too
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-3 px-4 py-3 mb-5"
                  style={{ backgroundColor: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '10px' }}>
                  <FiAlertCircle size={16} style={{ color: '#f87171', flexShrink: 0 }} />
                  <p className="font-body text-sm" style={{ color: '#f87171' }}>{error}</p>
                </div>
              )}

              <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* OTP input */}
                <div>
                  <label className="font-body block mb-2"
                    style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
                    6-Digit OTP
                  </label>
                  <input type="text" value={otp}
                    onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    style={{ ...inputStyle(false), textAlign: 'center', fontSize: '24px', letterSpacing: '0.4em', fontWeight: '600', color: GOLD }}
                    onFocus={e => e.target.style.borderColor = GOLD}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                </div>

                {/* New password */}
                <div>
                  <label className="font-body block mb-2"
                    style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
                    New Password
                  </label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={newPassword}
                      onChange={e => { setNewPassword(e.target.value); setError(''); }}
                      placeholder="Min. 6 characters"
                      style={{ ...inputStyle(false), paddingRight: '48px' }}
                      onFocus={e => e.target.style.borderColor = GOLD}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="font-body block mb-2"
                    style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
                    Confirm Password
                  </label>
                  <input type="password" value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                    placeholder="Repeat new password"
                    style={inputStyle(false)}
                    onFocus={e => e.target.style.borderColor = GOLD}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                </div>

                <button type="submit" disabled={loading || otp.length < 6}
                  className="font-body text-white"
                  style={{ backgroundColor: loading || otp.length < 6 ? 'rgba(201,168,76,0.45)' : GOLD, border: 'none', borderRadius: '8px', padding: '14px', fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: loading || otp.length < 6 ? 'not-allowed' : 'pointer', marginTop: '4px' }}>
                  {loading ? '⟳ Resetting...' : 'Reset Password'}
                </button>
              </form>

              <div className="flex justify-between mt-4">
                <button onClick={() => { setStep(1); setOtp(''); setError(''); }}
                  className="font-body text-xs flex items-center gap-1"
                  style={{ color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <FiArrowLeft size={12} /> Change email
                </button>
                <button onClick={handleSendOTP}
                  className="font-body text-xs"
                  style={{ color: GOLD, background: 'none', border: 'none', cursor: 'pointer' }}>
                  Resend OTP
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Success ── */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: 'rgba(74,222,128,0.12)', border: '2px solid rgba(74,222,128,0.3)' }}>
                <FiCheckCircle size={30} style={{ color: '#4ade80' }} />
              </div>
              <h1 className="font-display text-3xl font-light text-white mb-3">Password Reset!</h1>
              <p className="font-body text-sm mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Your password has been updated successfully.<br />You can now sign in with your new password.
              </p>
              <button onClick={() => navigate('/login')}
                className="w-full font-body text-white"
                style={{ backgroundColor: GOLD, border: 'none', borderRadius: '8px', padding: '14px', fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer' }}>
                Go to Sign In
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}