import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiSend, FiSmartphone, FiMail, FiUsers, FiMessageSquare, FiCheck, FiAlertCircle } from 'react-icons/fi';
import API from '../../services/api';
import toast from 'react-hot-toast';

const BG = '#0a0a0a'; const CARD = '#1a1a1a';
const BORDER = 'rgba(255,255,255,0.08)'; const GOLD = '#C9A84C';

const SMS_TEMPLATES = [
  { label: 'Weekend Sale', message: '🎉 Weekend Sale at Trendorra! Flat 20% OFF. Use code WEEKEND20. Shop: trendorra.in Valid till Sunday!' },
  { label: 'New Arrival', message: '✨ New arrivals just dropped at Trendorra! Fresh Men, Women & Streetwear styles. Shop: trendorra.in' },
  { label: 'Free Shipping', message: '🚚 FREE shipping on all orders this week at Trendorra! No minimum. Shop: trendorra.in' },
  { label: 'Flash Sale', message: '⚡ FLASH SALE - 3 hrs only! 30% OFF everything at Trendorra. Hurry: trendorra.in' },
  { label: 'Festival Offer', message: '🎊 Festival Special! Up to 40% OFF. Use code FEST40 at Trendorra. Shop: trendorra.in' },
];

const EMAIL_TEMPLATES = [
  { label: 'Weekend Sale', subject: '🎉 Weekend Sale — 20% OFF Everything at Trendorra!', message: 'We\'re running a special Weekend Sale just for you!\n\nGet flat 20% OFF on all orders this weekend.\nUse the coupon code below at checkout.', coupon: 'WEEKEND20', discount: '20% OFF' },
  { label: 'New Arrivals', subject: '✨ New Collection Just Dropped — Shop Before It Sells Out!', message: 'Our latest collection is now live!\n\nShop fresh styles in Men, Women, Streetwear & Accessories.\nNew pieces added every week — don\'t miss out!', coupon: '', discount: '' },
  { label: 'Exclusive Offer', subject: '🎁 An Exclusive Offer Just For You, [Name]!', message: 'As a valued Trendorra customer, we have a special offer just for you.\n\nUse your exclusive coupon below to save on your next order.\nOffer valid for 48 hours only!', coupon: 'VIP15', discount: '15% OFF' },
  { label: 'Festival Sale', subject: '🎊 Festival Special — Up to 40% OFF at Trendorra!', message: 'Celebrate in style with our biggest sale of the season!\n\nUp to 40% OFF on premium fashion across all categories.\nLimited time offer — grab your favourites before they\'re gone!', coupon: 'FEST40', discount: '40% OFF' },
];

export default function AdminNotifications() {
  const [tab, setTab] = useState('sms');
  const [stats, setStats] = useState(null);
  const [smsMessage, setSmsMessage] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailCoupon, setEmailCoupon] = useState('');
  const [emailDiscount, setEmailDiscount] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    API.get('/notifications/stats').then(res => setStats(res.stats)).catch(console.error);
  }, []);

  const handleSendSMS = async () => {
    if (!smsMessage.trim()) { toast.error('Write a message'); return; }
    if (!window.confirm(`Send SMS to ${stats?.withPhone} customers?`)) return;
    setSending(true); setResult(null);
    try {
      const res = await API.post('/notifications/bulk-sms', { message: smsMessage, targetAll: true });
      setResult({ success: true, msg: `SMS sent to ${res.sent}/${res.total} customers!` });
      toast.success(`Sent to ${res.sent} customers!`);
    } catch (err) { setResult({ success: false, msg: err.message }); toast.error(err.message); }
    finally { setSending(false); }
  };

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) { toast.error('Fill subject and message'); return; }
    if (!window.confirm(`Send email to ${stats?.withEmail} customers?`)) return;
    setSending(true); setResult(null);
    try {
      const res = await API.post('/notifications/bulk-email', { subject: emailSubject, message: emailMessage, couponCode: emailCoupon, discount: emailDiscount });
      setResult({ success: true, msg: `Email sent to ${res.sent}/${res.total} customers!` });
      toast.success(`Sent to ${res.sent} customers!`);
    } catch (err) { setResult({ success: false, msg: err.message }); toast.error(err.message); }
    finally { setSending(false); }
  };

  const inputStyle = (h = '48px') => ({ backgroundColor: BG, border: `1px solid rgba(255,255,255,0.1)`, color: '#fff', width: '100%', padding: '0.75rem 1rem', fontSize: '13px', borderRadius: '8px', outline: 'none', minHeight: h, resize: h === '48px' ? 'none' : 'vertical' });
  const labelStyle = { color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between" style={{ backgroundColor: '#050505', borderBottom: `1px solid ${BORDER}` }}>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>Admin Panel</p>
          <h1 style={{ color: GOLD, fontFamily: 'Cinzel,serif', fontSize: '18px', letterSpacing: '0.2em' }}>Notifications</h1>
        </div>
        <Link to="/admin" className="flex items-center gap-1 font-body text-xs hover:text-gold" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <FiArrowLeft size={13} /> Dashboard
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: FiUsers,       label: 'Total Customers', value: stats?.totalUsers || 0, color: GOLD },
            { icon: FiSmartphone,  label: 'Can Receive SMS', value: stats?.withPhone  || 0, color: '#4ade80' },
            { icon: FiMail,        label: 'Can Receive Email', value: stats?.withEmail || 0, color: '#60a5fa' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="p-5" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${color}18` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <p className="font-body font-bold text-xl text-white">{value}</p>
              <p className="font-body text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'sms',   icon: FiSmartphone, label: 'SMS Campaign' },
            { id: 'email', icon: FiMail,        label: 'Email Campaign' },
          ].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setResult(null); }}
              className="flex items-center gap-2 px-5 py-2.5 font-body text-sm transition-all"
              style={{ backgroundColor: tab === t.id ? GOLD : CARD, color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.5)', border: `1px solid ${tab === t.id ? GOLD : BORDER}`, borderRadius: '8px' }}>
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── SMS Tab ── */}
          {tab === 'sms' && (
            <>
              <div className="lg:col-span-2">
                <div className="p-6" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px' }}>
                  <h2 className="font-display text-xl font-light text-white mb-5 flex items-center gap-2">
                    <FiSmartphone style={{ color: GOLD }} /> Send SMS to All Customers
                  </h2>
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <label style={labelStyle}>Message</label>
                      <span className="font-body text-xs" style={{ color: smsMessage.length > 140 ? '#f87171' : 'rgba(255,255,255,0.3)' }}>{smsMessage.length}/160</span>
                    </div>
                    <textarea value={smsMessage} onChange={e => setSmsMessage(e.target.value)} rows={5} maxLength={160}
                      placeholder="Type your SMS message... keep under 160 characters"
                      style={inputStyle('120px')}
                      onFocus={e => e.target.style.borderColor = GOLD}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                  </div>

                  {/* Phone preview */}
                  {smsMessage && (
                    <div className="mb-5 p-4" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: `1px solid ${BORDER}` }}>
                      <p className="font-body text-[10px] uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>📱 Preview</p>
                      <div className="inline-block max-w-xs px-4 py-2.5 rounded-2xl rounded-tl-sm" style={{ backgroundColor: '#25d366' }}>
                        <p className="font-body text-sm text-white leading-relaxed">{smsMessage}</p>
                      </div>
                    </div>
                  )}

                  {result && (
                    <div className="flex items-center gap-2 p-4 mb-4 rounded-lg"
                      style={{ backgroundColor: result.success ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)', border: `1px solid ${result.success ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}` }}>
                      {result.success ? <FiCheck style={{ color: '#4ade80' }} /> : <FiAlertCircle style={{ color: '#f87171' }} />}
                      <p className="font-body text-sm" style={{ color: result.success ? '#4ade80' : '#f87171' }}>{result.msg}</p>
                    </div>
                  )}

                  <button onClick={handleSendSMS} disabled={sending || !smsMessage.trim()}
                    className="w-full flex items-center justify-center gap-2 py-4 font-body text-sm tracking-wider uppercase text-white"
                    style={{ backgroundColor: sending || !smsMessage.trim() ? 'rgba(201,168,76,0.4)' : GOLD, borderRadius: '8px' }}>
                    {sending ? '⟳ Sending...' : <><FiSend size={16} /> Send to {stats?.withPhone || 0} Customers</>}
                  </button>
                  <p className="text-center font-body text-xs mt-2" style={{ color: 'rgba(255,255,255,0.2)' }}>Cost: ₹0.15–₹0.25 per SMS via Fast2SMS</p>
                </div>
              </div>

              {/* SMS Templates */}
              <div className="p-5" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px' }}>
                <p className="font-body text-[10px] tracking-[0.15em] uppercase mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>Quick Templates</p>
                <div className="space-y-2">
                  {SMS_TEMPLATES.map(t => (
                    <button key={t.label} onClick={() => setSmsMessage(t.message)}
                      className="w-full text-left p-3 transition-all"
                      style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, borderRadius: '8px' }}
                      onMouseOver={e => e.currentTarget.style.borderColor = GOLD}
                      onMouseOut={e => e.currentTarget.style.borderColor = BORDER}>
                      <p className="font-body text-xs font-semibold text-white mb-1">{t.label}</p>
                      <p className="font-body text-[11px] line-clamp-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.message}</p>
                    </button>
                  ))}
                </div>
                {/* Setup guide */}
                <div className="mt-4 p-3" style={{ backgroundColor: 'rgba(201,168,76,0.06)', border: `1px solid rgba(201,168,76,0.2)`, borderRadius: '8px' }}>
                  <p className="font-body text-xs font-semibold mb-2" style={{ color: GOLD }}>Setup Fast2SMS</p>
                  {['Go to fast2sms.com', 'Sign up free', 'Dev API → Copy key', 'Add to .env: FAST2SMS_API_KEY=key'].map((s, i) => (
                    <p key={i} className="font-body text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{i+1}. {s}</p>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Email Tab ── */}
          {tab === 'email' && (
            <>
              <div className="lg:col-span-2">
                <div className="p-6" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px' }}>
                  <h2 className="font-display text-xl font-light text-white mb-5 flex items-center gap-2">
                    <FiMail style={{ color: GOLD }} /> Send Email to All Customers
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label style={labelStyle}>Email Subject *</label>
                      <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)}
                        placeholder="e.g. 🎉 Weekend Sale — 20% OFF Everything!"
                        style={inputStyle()}
                        onFocus={e => e.target.style.borderColor = GOLD}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                    </div>
                    <div>
                      <label style={labelStyle}>Message *</label>
                      <textarea value={emailMessage} onChange={e => setEmailMessage(e.target.value)} rows={5}
                        placeholder="Write your message to customers..."
                        style={inputStyle('130px')}
                        onFocus={e => e.target.style.borderColor = GOLD}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label style={labelStyle}>Coupon Code (optional)</label>
                        <input value={emailCoupon} onChange={e => setEmailCoupon(e.target.value.toUpperCase())}
                          placeholder="SAVE20"
                          style={inputStyle()}
                          onFocus={e => e.target.style.borderColor = GOLD}
                          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                      </div>
                      <div>
                        <label style={labelStyle}>Discount Label</label>
                        <input value={emailDiscount} onChange={e => setEmailDiscount(e.target.value)}
                          placeholder="20% OFF"
                          style={inputStyle()}
                          onFocus={e => e.target.style.borderColor = GOLD}
                          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                      </div>
                    </div>
                  </div>

                  {result && (
                    <div className="flex items-center gap-2 p-4 mt-4 rounded-lg"
                      style={{ backgroundColor: result.success ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)', border: `1px solid ${result.success ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}` }}>
                      {result.success ? <FiCheck style={{ color: '#4ade80' }} /> : <FiAlertCircle style={{ color: '#f87171' }} />}
                      <p className="font-body text-sm" style={{ color: result.success ? '#4ade80' : '#f87171' }}>{result.msg}</p>
                    </div>
                  )}

                  <button onClick={handleSendEmail} disabled={sending || !emailSubject.trim() || !emailMessage.trim()}
                    className="w-full flex items-center justify-center gap-2 py-4 font-body text-sm tracking-wider uppercase text-white mt-5"
                    style={{ backgroundColor: sending || !emailSubject.trim() ? 'rgba(201,168,76,0.4)' : GOLD, borderRadius: '8px' }}>
                    {sending ? '⟳ Sending...' : <><FiSend size={16} /> Send to {stats?.withEmail || 0} Customers</>}
                  </button>
                  <p className="text-center font-body text-xs mt-2" style={{ color: 'rgba(255,255,255,0.2)' }}>Free via Gmail (500/day limit)</p>
                </div>
              </div>

              {/* Email Templates */}
              <div className="p-5" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px' }}>
                <p className="font-body text-[10px] tracking-[0.15em] uppercase mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>Quick Templates</p>
                <div className="space-y-2">
                  {EMAIL_TEMPLATES.map(t => (
                    <button key={t.label} onClick={() => { setEmailSubject(t.subject); setEmailMessage(t.message); setEmailCoupon(t.coupon); setEmailDiscount(t.discount); }}
                      className="w-full text-left p-3 transition-all"
                      style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, borderRadius: '8px' }}
                      onMouseOver={e => e.currentTarget.style.borderColor = GOLD}
                      onMouseOut={e => e.currentTarget.style.borderColor = BORDER}>
                      <p className="font-body text-xs font-semibold text-white mb-1">{t.label}</p>
                      <p className="font-body text-[11px] line-clamp-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.subject}</p>
                      {t.coupon && <span className="font-body text-[10px] px-2 py-0.5 mt-1 inline-block" style={{ backgroundColor: 'rgba(201,168,76,0.15)', color: GOLD, borderRadius: '4px' }}>{t.coupon}</span>}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}