import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiArrowRight, FiCheck, FiShoppingBag,
  FiUser, FiMail, FiPhone, FiMapPin, FiFileText,
  FiEye, FiEyeOff, FiShield, FiTrendingUp, FiPackage,
  FiAlertCircle, FiCreditCard,
} from 'react-icons/fi';

const GOLD   = '#C9A84C';
const BG     = '#0a0a0a';
const CARD   = '#111111';
const BORDER = 'rgba(255,255,255,0.08)';

const STEPS = [
  { label: 'Account',  icon: FiUser        },
  { label: 'Business', icon: FiShoppingBag },
  { label: 'Address',  icon: FiMapPin      },
  { label: 'Bank',     icon: FiCreditCard  },
  { label: 'Confirm',  icon: FiShield      },
];

const BENEFITS = [
  { icon: FiTrendingUp, title: 'Grow Your Business',  desc: 'Reach thousands of customers across India'       },
  { icon: FiPackage,    title: 'Easy Inventory',       desc: 'Manage products, stock & orders in one place'    },
  { icon: FiShield,     title: 'Secure Payments',      desc: 'Fast settlements directly to your bank account'  },
  { icon: FiTrendingUp, title: 'Analytics Dashboard',  desc: 'Track sales, revenue & performance in real time' },
];

// ── Reusable Field ────────────────────────────────────────────────
function Field({ label, icon: Icon, error, hint, ...props }) {
  const [show, setShow] = useState(false);
  const isPass = props.type === 'password';
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block', color: 'rgba(255,255,255,0.45)', fontSize: '11px',
        letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '7px',
        fontFamily: 'inherit',
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {Icon && (
          <Icon size={14} style={{
            position: 'absolute', left: '13px', top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(255,255,255,0.22)', pointerEvents: 'none',
          }} />
        )}
        <input
          {...props}
          type={isPass && show ? 'text' : props.type}
          style={{
            width: '100%', boxSizing: 'border-box',
            backgroundColor: '#0d0d0d',
            border: `1px solid ${error ? '#f87171' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '6px',
            padding: `11px ${isPass ? '40px' : '14px'} 11px ${Icon ? '38px' : '14px'}`,
            color: '#fff', fontSize: '14px', outline: 'none',
            fontFamily: 'inherit', transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = GOLD}
          onBlur={e  => e.target.style.borderColor  = error ? '#f87171' : 'rgba(255,255,255,0.1)'}
        />
        {isPass && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            style={{
              position: 'absolute', right: '13px', top: '50%',
              transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.3)', padding: 0,
            }}
          >
            {show ? <FiEyeOff size={14} /> : <FiEye size={14} />}
          </button>
        )}
      </div>
      {hint  && !error && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', marginTop: '5px', fontFamily: 'inherit' }}>{hint}</p>}
      {error && <p style={{ color: '#f87171', fontSize: '11px', marginTop: '5px', fontFamily: 'inherit' }}>{error}</p>}
    </div>
  );
}

// ── Reusable SelectField ──────────────────────────────────────────
function SelectField({ label, icon: Icon, children, error, ...props }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block', color: 'rgba(255,255,255,0.45)', fontSize: '11px',
        letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '7px',
        fontFamily: 'inherit',
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {Icon && (
          <Icon size={14} style={{
            position: 'absolute', left: '13px', top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(255,255,255,0.22)', pointerEvents: 'none',
          }} />
        )}
        <select
          {...props}
          style={{
            width: '100%', boxSizing: 'border-box',
            backgroundColor: '#0d0d0d',
            border: `1px solid ${error ? '#f87171' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '6px',
            padding: `11px 14px 11px ${Icon ? '38px' : '14px'}`,
            color: props.value ? '#fff' : 'rgba(255,255,255,0.3)',
            fontSize: '14px', outline: 'none',
            fontFamily: 'inherit', appearance: 'none', cursor: 'pointer',
          }}
          onFocus={e => e.target.style.borderColor = GOLD}
          onBlur={e  => e.target.style.borderColor  = error ? '#f87171' : 'rgba(255,255,255,0.1)'}
        >
          {children}
        </select>
      </div>
      {error && <p style={{ color: '#f87171', fontSize: '11px', marginTop: '5px', fontFamily: 'inherit' }}>{error}</p>}
    </div>
  );
}

// ── Info box ──────────────────────────────────────────────────────
function InfoBox({ color = GOLD, children }) {
  return (
    <div style={{
      backgroundColor: `${color}08`,
      border: `1px solid ${color}25`,
      borderRadius: '8px', padding: '12px 14px', marginBottom: '16px',
    }}>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', lineHeight: '1.65', fontFamily: 'inherit', margin: 0 }}>
        {children}
      </p>
    </div>
  );
}

// ── Indian states list ────────────────────────────────────────────
const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu & Kashmir','Ladakh','Puducherry','Other',
];

// ── Main Page ─────────────────────────────────────────────────────
export default function SellerRegisterPage() {
  const navigate  = useNavigate();
  const [step, setStep]       = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  const [form, setForm] = useState({
    // Step 0
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    // Step 1
    businessName: '', businessType: '', gstin: '', category: '',
    // Step 2
    addressLine: '', city: '', state: '', pincode: '',
    // Step 3
    bankAccount: '', confirmBankAccount: '', ifsc: '', accountName: '', bankName: '',
    // Step 4
    agreed: false,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── Validation per step ───────────────────────────────────────
  const validate = () => {
    const e = {};

    if (step === 0) {
      if (!form.name.trim())                         e.name            = 'Full name required';
      if (!/\S+@\S+\.\S+/.test(form.email))         e.email           = 'Valid email required';
      if (!/^[6-9]\d{9}$/.test(form.phone))         e.phone           = 'Valid 10-digit mobile required';
      if (form.password.length < 8)                  e.password        = 'Minimum 8 characters required';
      if (form.password !== form.confirmPassword)    e.confirmPassword = 'Passwords do not match';
    }

    if (step === 1) {
      if (!form.businessName.trim()) e.businessName = 'Business name required';
      if (!form.businessType)        e.businessType = 'Select a business type';
      if (!form.category)            e.category     = 'Select a category';
    }

    if (step === 2) {
      if (!form.addressLine.trim())        e.addressLine = 'Address required';
      if (!form.city.trim())               e.city        = 'City required';
      if (!form.state)                     e.state       = 'Select a state';
      if (!/^\d{6}$/.test(form.pincode))  e.pincode     = 'Valid 6-digit pincode required';
    }

    if (step === 3) {
      if (!form.accountName.trim())                                          e.accountName        = 'Account holder name required';
      if (!form.bankName.trim())                                             e.bankName           = 'Bank name required';
      if (!form.bankAccount.trim())                                          e.bankAccount        = 'Account number required';
      if (form.bankAccount !== form.confirmBankAccount)                      e.confirmBankAccount = 'Account numbers do not match';
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifsc.toUpperCase()))         e.ifsc               = 'Valid IFSC required (e.g. SBIN0001234)';
    }

    if (step === 4) {
      if (!form.agreed) e.agreed = 'You must accept the terms to continue';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep(s => s + 1); };
  const back = () => { setStep(s => s - 1); setErrors({}); };

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authAPI.registerSeller({
        name:     form.name,
        email:    form.email,
        phone:    form.phone,
        password: form.password,
        sellerInfo: {
          businessName: form.businessName,
          businessType: form.businessType,
          gstin:        form.gstin,
          category:     form.category,
          address: {
            line:    form.addressLine,
            city:    form.city,
            state:   form.state,
            pincode: form.pincode,
          },
          bank: {
            account:  form.bankAccount,
            ifsc:     form.ifsc.toUpperCase(),
            name:     form.accountName,
            bankName: form.bankName,
          },
        },
      });

      // Log them in immediately
      localStorage.setItem('trendora_token', res.token);
      localStorage.setItem('trendora_user',  JSON.stringify(res.user));

      const isUpgrade = res.message?.toLowerCase().includes('upgraded');
      toast.success(
        isUpgrade
          ? '🎉 Account upgraded to seller! Welcome to your dashboard.'
          : '🎉 Seller account created! Welcome aboard.',
        { duration: 3000 }
      );

      setTimeout(() => navigate('/seller/dashboard'), 1200);

    } catch (err) {
      const msg = err?.message || '';

      if (msg.includes('Enter your existing account password')) {
        toast.error(
          'This email is already registered. Enter your existing Trendorra password to upgrade your account.',
          { duration: 6000 }
        );
        setStep(0);
        setErrors({ password: 'Enter your existing Trendorra account password to upgrade' });
      } else if (msg.includes('already registered as a seller')) {
        toast.error('This email is already a seller account. Redirecting to login…', { duration: 4000 });
        setTimeout(() => navigate('/login'), 2000);
      } else if (msg.includes('admin account')) {
        toast.error('This email belongs to an admin account and cannot be used here.');
      } else {
        toast.error(msg || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Summary for Step 4 ────────────────────────────────────────
  const summaryRows = [
    { label: 'Name',            value: form.name },
    { label: 'Email',           value: form.email },
    { label: 'Phone',           value: form.phone },
    { label: 'Business Name',   value: form.businessName },
    { label: 'Business Type',   value: form.businessType },
    { label: 'Category',        value: form.category },
    { label: 'GSTIN',           value: form.gstin || 'Not provided' },
    { label: 'Pickup Address',  value: `${form.addressLine}, ${form.city}, ${form.state} – ${form.pincode}` },
    { label: 'Bank',            value: form.bankName },
    { label: 'Account Holder',  value: form.accountName },
    { label: 'Account Number',  value: form.bankAccount ? `****${form.bankAccount.slice(-4)}` : '' },
    { label: 'IFSC',            value: form.ifsc.toUpperCase() },
  ].filter(r => r.value);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: BG, display: 'flex' }}>

      {/* ── Left sidebar (desktop only) ── */}
      <div
        className="hidden lg:flex"
        style={{
          width: '360px', flexShrink: 0,
          backgroundColor: '#0d0d0d',
          borderRight: `1px solid ${BORDER}`,
          padding: '44px 36px',
          flexDirection: 'column',
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '44px', textDecoration: 'none' }}>
          <FiArrowLeft size={13} style={{ color: 'rgba(255,255,255,0.3)' }} />
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontFamily: 'inherit', letterSpacing: '0.08em' }}>
            Back to Trendorra
          </span>
        </Link>

        <p style={{ color: GOLD, fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '10px', fontFamily: 'inherit' }}>
          Seller Program
        </p>
        <h2 style={{ color: '#fff', fontFamily: 'Cinzel, serif', fontSize: '22px', letterSpacing: '0.08em', lineHeight: '1.35', marginBottom: '14px' }}>
          Grow Your Business with Trendorra
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', lineHeight: '1.7', fontFamily: 'inherit', marginBottom: '32px' }}>
          Join thousands of sellers already growing their fashion business on India's premium marketplace.
        </p>

        {/* Benefits */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', flex: 1 }}>
          {BENEFITS.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ display: 'flex', gap: '13px', alignItems: 'flex-start' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0,
                backgroundColor: `${GOLD}15`, border: `1px solid ${GOLD}28`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={15} style={{ color: GOLD }} />
              </div>
              <div>
                <p style={{ color: '#fff', fontSize: '13px', fontWeight: '600', marginBottom: '3px', fontFamily: 'inherit' }}>{title}</p>
                <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: '12px', lineHeight: '1.5', fontFamily: 'inherit' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Existing account upgrade notice */}
        <div style={{
          marginTop: '32px', padding: '14px 16px',
          backgroundColor: `${GOLD}08`, border: `1px solid ${GOLD}22`, borderRadius: '8px',
        }}>
          <p style={{ color: GOLD, fontSize: '11px', fontWeight: '600', marginBottom: '5px', fontFamily: 'inherit' }}>
            Already have a Trendorra account?
          </p>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '11px', lineHeight: '1.6', fontFamily: 'inherit', margin: 0 }}>
            Use the same email & your existing password — your account will be upgraded to a seller account automatically. Your orders and profile stay intact.
          </p>
        </div>

        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: `1px solid ${BORDER}` }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', fontFamily: 'inherit' }}>
            Already a seller?{' '}
            <Link to="/login" style={{ color: GOLD, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '44px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <div style={{ width: '100%', maxWidth: '520px' }}>

          {/* Mobile back link */}
          <Link to="/" className="flex lg:hidden items-center gap-2 mb-8"
            style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontFamily: 'inherit' }}>
            <FiArrowLeft size={13} /> Back to Trendorra
          </Link>

          {/* ── Step progress bar ── */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '36px' }}>
            {STEPS.map((s, i) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    backgroundColor: i < step ? GOLD : i === step ? `${GOLD}22` : 'rgba(255,255,255,0.05)',
                    border: `2px solid ${i <= step ? GOLD : 'rgba(255,255,255,0.1)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s',
                  }}>
                    {i < step
                      ? <FiCheck size={13} style={{ color: '#fff' }} />
                      : <s.icon size={13} style={{ color: i === step ? GOLD : 'rgba(255,255,255,0.25)' }} />
                    }
                  </div>
                  <span style={{
                    fontSize: '9px', color: i <= step ? GOLD : 'rgba(255,255,255,0.2)',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    fontFamily: 'inherit', whiteSpace: 'nowrap',
                  }}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{
                    flex: 1, height: '2px',
                    backgroundColor: i < step ? GOLD : 'rgba(255,255,255,0.07)',
                    marginBottom: '20px', marginLeft: '6px', marginRight: '6px',
                    transition: 'background-color 0.3s',
                  }} />
                )}
              </div>
            ))}
          </div>

          {/* ── Form card ── */}
          <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '32px' }}>

            {/* ════ STEP 0 — Account ════ */}
            {step === 0 && (
              <>
                <h3 style={{ color: '#fff', fontFamily: 'Cinzel, serif', fontSize: '17px', letterSpacing: '0.08em', marginBottom: '5px' }}>
                  Create Your Account
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', marginBottom: '22px', fontFamily: 'inherit' }}>
                  These will be your login credentials for the seller dashboard.
                </p>

                <InfoBox>
                  💡 <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Already have a Trendorra account?</strong> Enter your existing email and password below — your account will be upgraded to a seller account automatically.
                </InfoBox>

                <Field
                  label="Full Name" icon={FiUser} type="text"
                  value={form.name} onChange={e => set('name', e.target.value)}
                  error={errors.name} placeholder="Your full name"
                />
                <Field
                  label="Email Address" icon={FiMail} type="email"
                  value={form.email} onChange={e => set('email', e.target.value)}
                  error={errors.email} placeholder="you@business.com"
                />
                <Field
                  label="Mobile Number" icon={FiPhone} type="tel"
                  value={form.phone} onChange={e => set('phone', e.target.value)}
                  error={errors.phone} placeholder="10-digit mobile number"
                  hint="Must be a unique number not linked to any other account"
                />
                <Field
                  label="Password" type="password"
                  value={form.password} onChange={e => set('password', e.target.value)}
                  error={errors.password}
                  placeholder="Min 8 characters  (or your existing Trendorra password)"
                />
                <Field
                  label="Confirm Password" type="password"
                  value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
                  error={errors.confirmPassword} placeholder="Re-enter password"
                />
              </>
            )}

            {/* ════ STEP 1 — Business ════ */}
            {step === 1 && (
              <>
                <h3 style={{ color: '#fff', fontFamily: 'Cinzel, serif', fontSize: '17px', letterSpacing: '0.08em', marginBottom: '5px' }}>
                  Business Information
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', marginBottom: '22px', fontFamily: 'inherit' }}>
                  Tell us about your business to set up your seller profile.
                </p>

                <Field
                  label="Business / Brand Name" icon={FiShoppingBag} type="text"
                  value={form.businessName} onChange={e => set('businessName', e.target.value)}
                  error={errors.businessName} placeholder="Your brand or shop name"
                />
                <SelectField
                  label="Business Type" icon={FiFileText}
                  value={form.businessType} onChange={e => set('businessType', e.target.value)}
                  error={errors.businessType}
                >
                  <option value="">Select business type</option>
                  <option value="individual">Individual / Sole Proprietor</option>
                  <option value="partnership">Partnership Firm</option>
                  <option value="pvt_ltd">Private Limited Company</option>
                  <option value="llp">LLP</option>
                  <option value="other">Other</option>
                </SelectField>
                <SelectField
                  label="Primary Category" icon={FiPackage}
                  value={form.category} onChange={e => set('category', e.target.value)}
                  error={errors.category}
                >
                  <option value="">Select your main category</option>
                  <option value="men">Men's Fashion</option>
                  <option value="women">Women's Fashion</option>
                  <option value="streetwear">Streetwear</option>
                  <option value="accessories">Accessories</option>
                  <option value="all">Multiple Categories</option>
                </SelectField>
                <Field
                  label="GSTIN (Optional)" icon={FiFileText} type="text"
                  value={form.gstin} onChange={e => set('gstin', e.target.value)}
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  hint="Leave blank if annual turnover is below ₹20 lakhs — you can add it later from your seller dashboard."
                />
              </>
            )}

            {/* ════ STEP 2 — Pickup Address ════ */}
            {step === 2 && (
              <>
                <h3 style={{ color: '#fff', fontFamily: 'Cinzel, serif', fontSize: '17px', letterSpacing: '0.08em', marginBottom: '5px' }}>
                  Pickup Address
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', marginBottom: '22px', fontFamily: 'inherit' }}>
                  Our logistics partner will pick up orders from this address.
                </p>

                <InfoBox>
                  📦 This address is used for <strong style={{ color: 'rgba(255,255,255,0.6)' }}>order pickups</strong> by our delivery partner. Make sure someone is available at this location during business hours (9 AM – 7 PM).
                </InfoBox>

                <Field
                  label="Street / Area / Building" icon={FiMapPin} type="text"
                  value={form.addressLine} onChange={e => set('addressLine', e.target.value)}
                  error={errors.addressLine} placeholder="e.g. 12, Gandhi Road, Opp. City Mall"
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <Field
                    label="City" type="text"
                    value={form.city} onChange={e => set('city', e.target.value)}
                    error={errors.city} placeholder="City"
                  />
                  <Field
                    label="Pincode" type="text"
                    value={form.pincode} onChange={e => set('pincode', e.target.value)}
                    error={errors.pincode} placeholder="6-digit pincode"
                  />
                </div>
                <SelectField
                  label="State"
                  value={form.state} onChange={e => set('state', e.target.value)}
                  error={errors.state}
                >
                  <option value="">Select state</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </SelectField>
              </>
            )}

            {/* ════ STEP 3 — Bank Details ════ */}
            {step === 3 && (
              <>
                <h3 style={{ color: '#fff', fontFamily: 'Cinzel, serif', fontSize: '17px', letterSpacing: '0.08em', marginBottom: '5px' }}>
                  Bank Account Details
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', marginBottom: '22px', fontFamily: 'inherit' }}>
                  All payments for delivered orders will be settled to this account.
                </p>

                <InfoBox color="#4ade80">
                  🔒 Your bank details are <strong style={{ color: 'rgba(255,255,255,0.6)' }}>encrypted and stored securely</strong>. Payouts are processed within <strong style={{ color: 'rgba(255,255,255,0.6)' }}>7 business days</strong> of order delivery.
                </InfoBox>

                <Field
                  label="Account Holder Name" icon={FiUser} type="text"
                  value={form.accountName} onChange={e => set('accountName', e.target.value)}
                  error={errors.accountName} placeholder="Exactly as per bank records"
                />
                <Field
                  label="Bank Name" icon={FiCreditCard} type="text"
                  value={form.bankName} onChange={e => set('bankName', e.target.value)}
                  error={errors.bankName} placeholder="e.g. State Bank of India, HDFC Bank"
                />
                <Field
                  label="Account Number" icon={FiCreditCard} type="text"
                  value={form.bankAccount} onChange={e => set('bankAccount', e.target.value)}
                  error={errors.bankAccount} placeholder="Enter account number"
                />
                <Field
                  label="Confirm Account Number" icon={FiCreditCard} type="password"
                  value={form.confirmBankAccount} onChange={e => set('confirmBankAccount', e.target.value)}
                  error={errors.confirmBankAccount} placeholder="Re-enter account number to confirm"
                />
                <Field
                  label="IFSC Code" icon={FiFileText} type="text"
                  value={form.ifsc} onChange={e => set('ifsc', e.target.value.toUpperCase())}
                  error={errors.ifsc} placeholder="e.g. SBIN0001234"
                  hint="11-character code printed on your cheque book or passbook"
                />

                <div style={{
                  backgroundColor: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)',
                  borderRadius: '8px', padding: '12px 14px',
                  display: 'flex', gap: '10px', alignItems: 'flex-start',
                }}>
                  <FiAlertCircle size={15} style={{ color: '#fbbf24', flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', lineHeight: '1.6', fontFamily: 'inherit', margin: 0 }}>
                    Enter a <strong style={{ color: 'rgba(255,255,255,0.6)' }}>savings or current account</strong> in your own name or business name. Incorrect details may cause payment delays.
                  </p>
                </div>
              </>
            )}

            {/* ════ STEP 4 — Review & Agree ════ */}
            {step === 4 && (
              <>
                <h3 style={{ color: '#fff', fontFamily: 'Cinzel, serif', fontSize: '17px', letterSpacing: '0.08em', marginBottom: '5px' }}>
                  Review & Agree
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', marginBottom: '20px', fontFamily: 'inherit' }}>
                  Check your details before submitting your seller application.
                </p>

                {/* Summary table */}
                <div style={{ backgroundColor: '#0d0d0d', border: `1px solid ${BORDER}`, borderRadius: '8px', overflow: 'hidden', marginBottom: '20px' }}>
                  {summaryRows.map(({ label, value }, i) => (
                    <div key={label} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px',
                      borderBottom: i < summaryRows.length - 1 ? `1px solid ${BORDER}` : 'none',
                    }}>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontFamily: 'inherit', flexShrink: 0, marginRight: '12px' }}>
                        {label}
                      </span>
                      <span style={{ color: '#fff', fontSize: '12px', fontFamily: 'inherit', fontWeight: '500', textAlign: 'right', wordBreak: 'break-all' }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', marginBottom: '20px', fontFamily: 'inherit' }}>
                  Need to change something? Hit <strong style={{ color: 'rgba(255,255,255,0.4)' }}>Back</strong> to edit any step.
                </p>

                {/* Terms scroll box */}
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`,
                  borderRadius: '8px', padding: '14px 16px', marginBottom: '20px',
                  maxHeight: '130px', overflowY: 'auto',
                }}>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', lineHeight: '1.8', fontFamily: 'inherit', margin: 0 }}>
                    <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Seller Terms & Conditions</strong><br /><br />
                    By creating a seller account you agree to: maintain accurate product listings; ship orders within the committed timeframe; maintain a minimum seller rating of 3.5 stars; comply with all applicable laws and Trendorra's seller policies; not list counterfeit or prohibited goods. Trendorra reserves the right to suspend accounts that violate these terms. Commission rates apply as per the category slab shared in the seller onboarding kit. Payouts are processed within 7 business days of confirmed delivery.
                  </p>
                </div>

                {/* Agreement checkbox */}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', marginBottom: '4px' }}>
                  <div
                    onClick={() => set('agreed', !form.agreed)}
                    style={{
                      width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0, marginTop: '2px',
                      backgroundColor: form.agreed ? GOLD : 'transparent',
                      border: `2px solid ${form.agreed ? GOLD : 'rgba(255,255,255,0.2)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    {form.agreed && <FiCheck size={11} style={{ color: '#fff' }} />}
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', lineHeight: '1.6', fontFamily: 'inherit' }}>
                    I have read and agree to Trendorra's Seller Terms & Conditions and Privacy Policy.
                  </span>
                </label>
                {errors.agreed && (
                  <p style={{ color: '#f87171', fontSize: '11px', marginTop: '6px', fontFamily: 'inherit' }}>{errors.agreed}</p>
                )}
              </>
            )}

            {/* ── Navigation buttons ── */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '28px' }}>
              {step > 0 && (
                <button
                  onClick={back}
                  style={{
                    flex: 1, padding: '12px', backgroundColor: 'transparent',
                    border: `1px solid ${BORDER}`, borderRadius: '6px',
                    color: 'rgba(255,255,255,0.45)', fontSize: '14px',
                    cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'}
                  onMouseOut={e  => e.currentTarget.style.borderColor = BORDER}
                >
                  <FiArrowLeft size={14} /> Back
                </button>
              )}

              {step < 4 ? (
                <button
                  onClick={next}
                  style={{
                    flex: 1, padding: '12px', backgroundColor: GOLD,
                    border: 'none', borderRadius: '6px',
                    color: '#fff', fontSize: '14px', fontWeight: '600',
                    cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.04em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#b8933f'}
                  onMouseOut={e  => e.currentTarget.style.backgroundColor = GOLD}
                >
                  Continue <FiArrowRight size={14} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    flex: 1, padding: '12px',
                    backgroundColor: loading ? `${GOLD}80` : GOLD,
                    border: 'none', borderRadius: '6px',
                    color: '#fff', fontSize: '14px', fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', letterSpacing: '0.04em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}
                >
                  {loading
                    ? 'Submitting…'
                    : <><FiCheck size={14} /> Submit Application</>
                  }
                </button>
              )}
            </div>
          </div>

          <p style={{ textAlign: 'center', marginTop: '20px', color: 'rgba(255,255,255,0.2)', fontSize: '12px', fontFamily: 'inherit' }}>
            Already a seller?{' '}
            <Link to="/login" style={{ color: GOLD, textDecoration: 'none' }}>Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}