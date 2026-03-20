import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI, paymentAPI, couponAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiCheck, FiMapPin, FiCreditCard, FiShoppingBag, FiTruck, FiShield, FiChevronDown, FiTag, FiX } from 'react-icons/fi';

const BG     = '#111111';
const BG2    = '#0a0a0a';
const CARD   = '#1a1a1a';
const BORDER = 'rgba(255,255,255,0.08)';
const GOLD   = '#C9A84C';

const STEPS = [
  { label: 'Address', icon: FiMapPin },
  { label: 'Payment', icon: FiCreditCard },
  { label: 'Review',  icon: FiShoppingBag },
];

/* ── Reusable Field + Input ── */
const Field = ({ label, children, col }) => (
  <div className={col || ''}>
    <label style={{
      display: 'block', color: 'rgba(255,255,255,0.4)',
      fontSize: '10px', letterSpacing: '0.15em',
      textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'inherit',
    }}>{label}</label>
    {children}
  </div>
);

const inputCls = "w-full px-4 py-3 font-body text-sm text-white focus:outline-none transition-colors";
const inputStyle = (focus) => ({
  backgroundColor: BG2,
  border: `1px solid ${focus ? GOLD : 'rgba(255,255,255,0.1)'}`,
  borderRadius: '8px', color: '#fff',
});

const TextInput = ({ label, value, onChange, placeholder, type = 'text', maxLength, required, col }) => {
  const [focus, setFocus] = useState(false);
  return (
    <Field label={label} col={col}>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        maxLength={maxLength} required={required}
        className={inputCls} style={inputStyle(focus)}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} />
    </Field>
  );
};

/* ── Coupon Box — standalone reusable ── */
const CouponBox = ({ couponCode, setCouponCode, couponApplied, couponDiscount, applyingCoupon, onApply, onRemove }) => {
  const [focused, setFocused] = useState(false);

  if (couponApplied) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 14px',
        background: 'rgba(74,222,128,0.06)',
        border: '1px solid rgba(74,222,128,0.22)',
        borderRadius: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'rgba(74,222,128,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <FiCheck size={13} style={{ color: '#4ade80' }} />
          </div>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#4ade80', margin: 0 }}>
              {couponApplied.code} applied!
            </p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.40)', margin: '2px 0 0' }}>
              You save ₹{couponDiscount.toLocaleString()}
            </p>
          </div>
        </div>
        <button
          onClick={onRemove}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            background: 'rgba(248,113,113,0.10)',
            border: '1px solid rgba(248,113,113,0.22)',
            borderRadius: '6px', padding: '5px 10px',
            color: '#f87171', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <FiX size={11} /> Remove
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
        <FiTag size={13} style={{ color: GOLD }} />
        <span style={{
          fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'rgba(201,168,76,0.70)', fontFamily: 'inherit',
        }}>
          Have a coupon?
        </span>
      </div>
      {/* Input + button */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          value={couponCode}
          onChange={e => setCouponCode(e.target.value.toUpperCase())}
          placeholder="Enter coupon code"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={e => e.key === 'Enter' && onApply()}
          style={{
            flex: 1,
            padding: '11px 14px',
            fontSize: '13px',
            fontFamily: 'inherit',
            letterSpacing: '0.08em',
            background: BG2,
            border: `1.5px solid ${focused ? GOLD : 'rgba(255,255,255,0.10)'}`,
            borderRadius: '8px',
            color: '#fff',
            outline: 'none',
            transition: 'border-color 0.15s',
            minWidth: 0,
          }}
        />
        <button
          onClick={onApply}
          disabled={applyingCoupon}
          style={{
            padding: '11px 18px',
            fontSize: '12px',
            fontFamily: 'inherit',
            fontWeight: 600,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            background: applyingCoupon ? 'rgba(201,168,76,0.45)' : GOLD,
            color: '#0a0a0a',
            border: 'none',
            borderRadius: '8px',
            cursor: applyingCoupon ? 'not-allowed' : 'pointer',
            flexShrink: 0,
            transition: 'background 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          {applyingCoupon ? '...' : 'Apply'}
        </button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user }                       = useAuth();
  const navigate                       = useNavigate();

  const [step,           setStep]           = useState(0);
  const [loading,        setLoading]        = useState(false);
  const [paymentMethod,  setPaymentMethod]  = useState('Razorpay');
  const [couponCode,     setCouponCode]     = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied,  setCouponApplied]  = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [summaryOpen,    setSummaryOpen]    = useState(false);

  const [address, setAddress] = useState({
    fullName: user?.name || '', phone: user?.phone || '',
    addressLine1: '', addressLine2: '',
    city: '', state: '', pincode: '', country: 'India',
  });

  const items    = cart.items || [];
  const shipping = cartTotal >= 999 ? 0 : 99;
  const tax      = Math.round(cartTotal * 0.18);
  const total    = cartTotal + shipping + tax - couponDiscount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) { toast.error('Enter a coupon code'); return; }
    setApplyingCoupon(true);
    try {
      const res = await couponAPI.apply({ code: couponCode.trim(), orderTotal: cartTotal });
      setCouponDiscount(res.discount);
      setCouponApplied(res.coupon);
      toast.success(`Coupon applied! You save ₹${res.discount}`);
    } catch (err) {
      toast.error(err.message || 'Invalid coupon');
      setCouponDiscount(0); setCouponApplied(null);
    } finally { setApplyingCoupon(false); }
  };

  const removeCoupon = () => { setCouponCode(''); setCouponDiscount(0); setCouponApplied(null); };
  const set = (key) => (e) => setAddress(p => ({ ...p, [key]: e.target.value }));

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    const { fullName, phone, addressLine1, city, state, pincode } = address;
    if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
      toast.error('Please fill all required fields'); return;
    }
    if (phone.length < 10)  { toast.error('Enter valid phone number'); return; }
    if (pincode.length !== 6){ toast.error('Enter valid 6-digit pincode'); return; }
    setStep(1);
  };

  const placeOrder = async (paymentResult = null) => {
    setLoading(true);
    try {
      const orderItems = items.map(item => ({
        product: item.product._id,
        name: item.product.name,
        image: item.product.images?.[0]?.url,
        price: item.price || item.product.price,
        size: item.size, color: item.color, quantity: item.quantity,
      }));
      const res = await orderAPI.create({ orderItems, shippingAddress: address, paymentMethod, paymentResult });
      await clearCart();
      navigate(`/order-confirmation/${res.order._id}`);
    } catch (err) { toast.error(err.message || 'Failed to place order'); }
    finally { setLoading(false); }
  };

  const handleRazorpayPayment = async () => {
    setLoading(true);
    try {
      const { order, key } = await paymentAPI.createRazorpayOrder(total);
      const options = {
        key, amount: order.amount, currency: order.currency,
        name: 'Trendorra', description: 'Fashion Purchase', order_id: order.id,
        handler: async (response) => {
          await paymentAPI.verifyRazorpay(response);
          await placeOrder({ id: response.razorpay_payment_id, status: 'COMPLETED', updateTime: new Date().toISOString(), emailAddress: user.email });
        },
        prefill: { name: user.name, email: user.email, contact: address.phone },
        theme: { color: GOLD },
      };
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => { const rzp = new window.Razorpay(options); rzp.open(); };
      document.body.appendChild(script);
    } catch { toast.error('Payment failed. Please try again.'); }
    finally { setLoading(false); }
  };

  const handlePlaceOrder = () => paymentMethod === 'COD' ? placeOrder() : handleRazorpayPayment();

  /* ─────────── STEP INDICATOR ─────────── */
  const StepBar = () => (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((s, i) => (
        <div key={s.label} className="flex items-center">
          <button onClick={() => i < step && setStep(i)}
            className="flex flex-col items-center gap-1.5"
            style={{ cursor: i < step ? 'pointer' : 'default' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-body text-sm font-medium transition-all"
              style={{
                backgroundColor: i < step ? GOLD : i === step ? '#fff' : 'rgba(255,255,255,0.07)',
                color: i < step ? '#fff' : i === step ? '#111' : 'rgba(255,255,255,0.25)',
                boxShadow: i === step ? `0 0 0 4px rgba(201,168,76,0.2)` : 'none',
              }}>
              {i < step ? <FiCheck size={16} /> : <s.icon size={15} />}
            </div>
            <span className="font-body text-[10px] tracking-[0.12em] uppercase"
              style={{ color: i === step ? '#fff' : i < step ? GOLD : 'rgba(255,255,255,0.25)' }}>
              {s.label}
            </span>
          </button>
          {i < STEPS.length - 1 && (
            <div className="mx-3 sm:mx-5 h-px"
              style={{ width: '48px', backgroundColor: i < step ? GOLD : 'rgba(255,255,255,0.08)' }} />
          )}
        </div>
      ))}
    </div>
  );

  /* ─────────── ORDER SUMMARY ─────────── */
  const OrderSummary = ({ mobile }) => (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
      {mobile && (
        <button onClick={() => setSummaryOpen(!summaryOpen)}
          className="w-full flex items-center justify-between px-5 py-4"
          style={{ backgroundColor: BG2 }}>
          <div className="flex items-center gap-2">
            <FiShoppingBag size={15} style={{ color: GOLD }} />
            <span className="font-body text-xs tracking-[0.15em] uppercase" style={{ color: GOLD }}>Order Summary</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-body font-bold text-sm" style={{ color: GOLD }}>₹{total.toLocaleString()}</span>
            <FiChevronDown size={16} style={{
              color: 'rgba(255,255,255,0.4)',
              transform: summaryOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }} />
          </div>
        </button>
      )}
      {!mobile && (
        <div className="px-5 py-4" style={{ backgroundColor: BG2, borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2">
            <FiShoppingBag size={15} style={{ color: GOLD }} />
            <h3 className="font-body text-xs tracking-[0.2em] uppercase" style={{ color: GOLD }}>Order Summary</h3>
          </div>
        </div>
      )}
      {(!mobile || summaryOpen) && (
        <>
          <div className="px-5 py-4 space-y-3" style={{ borderBottom: `1px solid ${BORDER}`, maxHeight: '200px', overflowY: 'auto' }}>
            {items.map(item => (
              <div key={item._id} className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <img src={item.product?.images?.[0]?.url} alt=""
                    className="w-12 h-14 object-cover"
                    style={{ borderRadius: '6px', backgroundColor: BG2 }} />
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                    style={{ backgroundColor: GOLD }}>{item.quantity}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-xs font-medium text-white truncate">{item.product?.name}</p>
                  {item.size && <p className="font-body text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Size: {item.size}</p>}
                </div>
                <p className="font-body text-xs font-semibold text-white flex-shrink-0">
                  ₹{((item.price || item.product?.price) * item.quantity).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
          <div className="px-5 py-4 space-y-2.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
            {[
              { l: `Subtotal (${items.length} item${items.length !== 1 ? 's' : ''})`, v: `₹${cartTotal.toLocaleString()}` },
              { l: 'Shipping', v: shipping === 0 ? 'FREE' : `₹${shipping}`, green: shipping === 0 },
              { l: 'GST (18%)', v: `₹${tax.toLocaleString()}` },
              ...(couponDiscount > 0 ? [{ l: `Coupon (${couponApplied?.code})`, v: `-₹${couponDiscount.toLocaleString()}`, green: true }] : []),
            ].map(row => (
              <div key={row.l} className="flex items-center justify-between text-sm font-body">
                <span style={{ color: 'rgba(255,255,255,0.45)' }}>{row.l}</span>
                <span style={{ color: row.green ? '#4ade80' : 'rgba(255,255,255,0.75)' }}>{row.v}</span>
              </div>
            ))}
          </div>
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between">
              <span className="font-body font-semibold text-base text-white">Total</span>
              <span className="font-body font-bold text-xl" style={{ color: GOLD }}>₹{total.toLocaleString()}</span>
            </div>
            {shipping > 0 && (
              <p className="font-body text-[10px] mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Add ₹{(999 - cartTotal).toLocaleString()} more for FREE shipping
              </p>
            )}
          </div>
          {/* Coupon — desktop sidebar only */}
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <CouponBox
              couponCode={couponCode} setCouponCode={setCouponCode}
              couponApplied={couponApplied} couponDiscount={couponDiscount}
              applyingCoupon={applyingCoupon}
              onApply={handleApplyCoupon} onRemove={removeCoupon}
            />
          </div>
          <div className="px-5 py-4 grid grid-cols-2 gap-2">
            {[{ icon: FiShield, text: 'Secure Payment' }, { icon: FiTruck, text: 'Fast Delivery' }].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 px-3 py-2"
                style={{ backgroundColor: BG2, borderRadius: '6px' }}>
                <Icon size={13} style={{ color: GOLD, flexShrink: 0 }} />
                <span className="font-body text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{text}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  /* ─────────── MAIN RENDER ─────────── */
  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>
      <div className="py-8 px-4 sm:px-6 text-center"
        style={{ backgroundColor: BG2, borderBottom: `1px solid ${BORDER}` }}>
        <p className="section-subtitle">Almost there</p>
        <h1 className="section-title">Checkout</h1>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <StepBar />

        {/* Mobile order summary */}
        <div className="lg:hidden mb-6">
          <OrderSummary mobile />
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* ───── LEFT: Form ───── */}
          <div className="flex-1">
            <div className="p-5 sm:p-7"
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px' }}>

              {/* ── Step 0: Address ── */}
              {step === 0 && (
                <form onSubmit={handleAddressSubmit}>
                  <div className="flex items-center gap-2.5 mb-6">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'rgba(201,168,76,0.15)' }}>
                      <FiMapPin size={14} style={{ color: GOLD }} />
                    </div>
                    <h2 className="font-display text-xl font-light text-white">Delivery Address</h2>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <TextInput label="Full Name *" value={address.fullName} onChange={set('fullName')} required />
                      <TextInput label="Phone Number *" value={address.phone} onChange={set('phone')} type="tel" maxLength={10} required />
                    </div>
                    <TextInput label="Address Line 1 *" value={address.addressLine1} onChange={set('addressLine1')} placeholder="House no., Street, Area" required />
                    <TextInput label="Address Line 2 (Optional)" value={address.addressLine2} onChange={set('addressLine2')} placeholder="Landmark, Colony" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <TextInput label="City *" value={address.city} onChange={set('city')} required />
                      <TextInput label="State *" value={address.state} onChange={set('state')} required />
                      <div className="col-span-2 sm:col-span-1">
                        <TextInput label="Pincode *" value={address.pincode} onChange={set('pincode')} maxLength={6} required />
                      </div>
                    </div>
                    <Field label="Country">
                      <div className="px-4 py-3 font-body text-sm"
                        style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.06)`, borderRadius: '8px', color: 'rgba(255,255,255,0.4)' }}>
                        🇮🇳 India
                      </div>
                    </Field>
                  </div>
                  <button type="submit"
                    className="w-full mt-7 py-4 font-body text-sm tracking-[0.15em] uppercase text-white font-medium transition-colors"
                    style={{ backgroundColor: GOLD, borderRadius: '8px' }}>
                    Continue to Payment →
                  </button>
                </form>
              )}

              {/* ── Step 1: Payment ── */}
              {step === 1 && (
                <div>
                  <div className="flex items-center gap-2.5 mb-6">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'rgba(201,168,76,0.15)' }}>
                      <FiCreditCard size={14} style={{ color: GOLD }} />
                    </div>
                    <h2 className="font-display text-xl font-light text-white">Payment Method</h2>
                  </div>

                  {/* Payment options */}
                  <div className="space-y-3 mb-5">
                    {[
                      { id: 'Razorpay', label: 'Pay Online',        sub: 'Cards · UPI · Net Banking · Wallets', emojis: '💳 📱 🏦' },
                      { id: 'COD',      label: 'Cash on Delivery',   sub: 'Pay when your order arrives (+₹50 fee)', emojis: '💵' },
                    ].map(m => (
                      <label key={m.id} onClick={() => setPaymentMethod(m.id)}
                        className="flex items-center gap-4 p-4 cursor-pointer transition-all"
                        style={{
                          border: `2px solid ${paymentMethod === m.id ? GOLD : 'rgba(255,255,255,0.08)'}`,
                          backgroundColor: paymentMethod === m.id ? 'rgba(201,168,76,0.05)' : BG2,
                          borderRadius: '10px',
                        }}>
                        <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                          style={{
                            border: `2px solid ${paymentMethod === m.id ? GOLD : 'rgba(255,255,255,0.2)'}`,
                            backgroundColor: paymentMethod === m.id ? GOLD : 'transparent',
                          }}>
                          {paymentMethod === m.id && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-body font-semibold text-sm text-white mb-0.5">{m.label}</p>
                          <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{m.sub}</p>
                        </div>
                        <span className="text-xl flex-shrink-0">{m.emojis}</span>
                      </label>
                    ))}
                  </div>

                  {/* ── COUPON BOX — always visible on mobile in Step 1 ── */}
                  <div className="lg:hidden mb-5">
                    <div style={{
                      padding: '16px',
                      background: 'rgba(201,168,76,0.04)',
                      border: `1px solid rgba(201,168,76,0.18)`,
                      borderRadius: '12px',
                    }}>
                      <CouponBox
                        couponCode={couponCode} setCouponCode={setCouponCode}
                        couponApplied={couponApplied} couponDiscount={couponDiscount}
                        applyingCoupon={applyingCoupon}
                        onApply={handleApplyCoupon} onRemove={removeCoupon}
                      />
                      {/* Show discount line if applied */}
                      {couponDiscount > 0 && (
                        <div style={{
                          display: 'flex', justifyContent: 'space-between',
                          marginTop: '12px', paddingTop: '12px',
                          borderTop: '1px solid rgba(255,255,255,0.06)',
                        }}>
                          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontFamily: 'inherit' }}>
                            Total after discount
                          </span>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: GOLD, fontFamily: 'inherit' }}>
                            ₹{total.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Back / Review buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setStep(0)}
                      className="py-4 font-body text-sm tracking-[0.12em] uppercase transition-all"
                      style={{ border: `1px solid rgba(255,255,255,0.12)`, color: 'rgba(255,255,255,0.55)', borderRadius: '8px' }}>
                      ← Back
                    </button>
                    <button onClick={() => setStep(2)}
                      className="py-4 font-body text-sm tracking-[0.12em] uppercase text-white font-medium transition-all"
                      style={{ backgroundColor: GOLD, borderRadius: '8px' }}>
                      Review Order →
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 2: Review ── */}
              {step === 2 && (
                <div>
                  <div className="flex items-center gap-2.5 mb-6">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'rgba(201,168,76,0.15)' }}>
                      <FiShoppingBag size={14} style={{ color: GOLD }} />
                    </div>
                    <h2 className="font-display text-xl font-light text-white">Review Order</h2>
                  </div>
                  <div className="p-4 mb-4"
                    style={{ backgroundColor: BG2, border: `1px solid ${BORDER}`, borderRadius: '10px' }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-body text-[10px] tracking-[0.15em] uppercase mb-2" style={{ color: GOLD }}>Delivery Address</p>
                        <p className="font-body text-sm font-semibold text-white">{address.fullName}</p>
                        <p className="font-body text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          {address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}
                        </p>
                        <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          {address.city}, {address.state} – {address.pincode}
                        </p>
                        <p className="font-body text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>📞 {address.phone}</p>
                      </div>
                      <button onClick={() => setStep(0)} className="font-body text-xs hover:underline flex-shrink-0 ml-4" style={{ color: GOLD }}>Edit</button>
                    </div>
                  </div>
                  <div className="p-4 mb-5"
                    style={{ backgroundColor: BG2, border: `1px solid ${BORDER}`, borderRadius: '10px' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-body text-[10px] tracking-[0.15em] uppercase mb-1" style={{ color: GOLD }}>Payment</p>
                        <p className="font-body text-sm text-white">{paymentMethod === 'COD' ? '💵 Cash on Delivery' : '💳 Online (Razorpay)'}</p>
                      </div>
                      <button onClick={() => setStep(1)} className="font-body text-xs hover:underline" style={{ color: GOLD }}>Edit</button>
                    </div>
                  </div>
                  <div className="space-y-2 mb-6">
                    <p className="font-body text-[10px] tracking-[0.15em] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {items.length} Item{items.length !== 1 ? 's' : ''}
                    </p>
                    {items.map(item => (
                      <div key={item._id} className="flex items-center gap-3 p-3"
                        style={{ backgroundColor: BG2, border: `1px solid ${BORDER}`, borderRadius: '8px' }}>
                        <img src={item.product?.images?.[0]?.url} alt=""
                          className="w-12 h-14 object-cover flex-shrink-0"
                          style={{ borderRadius: '6px', backgroundColor: BG }} />
                        <div className="flex-1 min-w-0">
                          <p className="font-body font-medium text-sm text-white truncate">{item.product?.name}</p>
                          <p className="font-body text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {[item.size && `Size: ${item.size}`, item.color && item.color, `Qty: ${item.quantity}`].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                        <p className="font-body font-semibold text-sm flex-shrink-0" style={{ color: GOLD }}>
                          ₹{((item.price || item.product?.price) * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setStep(1)}
                      className="py-4 font-body text-sm tracking-[0.12em] uppercase transition-all"
                      style={{ border: `1px solid rgba(255,255,255,0.12)`, color: 'rgba(255,255,255,0.55)', borderRadius: '8px' }}>
                      ← Back
                    </button>
                    <button onClick={handlePlaceOrder} disabled={loading}
                      className="py-4 font-body text-sm tracking-[0.12em] uppercase text-white font-medium transition-all"
                      style={{ backgroundColor: loading ? 'rgba(201,168,76,0.5)' : GOLD, borderRadius: '8px' }}>
                      {loading ? '⏳ Processing...' : paymentMethod === 'COD' ? '✓ Place Order' : `Pay ₹${total.toLocaleString()}`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ───── RIGHT: Sticky Summary (desktop only) ───── */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-28">
              <OrderSummary />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}