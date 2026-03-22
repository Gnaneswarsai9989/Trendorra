import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI, paymentAPI, couponAPI, deliveryAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiCheck, FiMapPin, FiCreditCard, FiShoppingBag, FiTruck, FiShield, FiChevronDown } from 'react-icons/fi';

const BG   = '#111111';
const BG2  = '#0a0a0a';
const CARD = '#1a1a1a';
const BORDER = 'rgba(255,255,255,0.08)';
const GOLD = '#C9A84C';

const STEPS = [
  { label: 'Address', icon: FiMapPin },
  { label: 'Payment', icon: FiCreditCard },
  { label: 'Review',  icon: FiShoppingBag },
];

/* ── Reusable Input ── */
const Field = ({ label, children, col }) => (
  <div className={col || ''}>
    <label style={{
      display: 'block',
      color: 'rgba(255,255,255,0.4)',
      fontSize: '10px',
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
      marginBottom: '6px',
      fontFamily: 'inherit',
    }}>{label}</label>
    {children}
  </div>
);

const inputCls = "w-full px-4 py-3 font-body text-sm text-white focus:outline-none transition-colors";
const inputStyle = (focus) => ({
  backgroundColor: BG2,
  border: `1px solid ${focus ? GOLD : 'rgba(255,255,255,0.1)'}`,
  borderRadius: '8px',
  color: '#fff',
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

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Razorpay');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false); // mobile toggle
  const [address, setAddress] = useState({
    fullName: user?.name || '', phone: user?.phone || '',
    addressLine1: '', addressLine2: '',
    city: '', state: '', pincode: '', country: 'India',
  });

  const items = cart.items || [];
  const [shipping,        setShipping]        = useState(0);
  const [deliveryZone,    setDeliveryZone]    = useState('');
  const [notServiceable,  setNotServiceable]  = useState(false);
  const [serviceMsg,      setServiceMsg]      = useState('');
  const [checkingPin,     setCheckingPin]     = useState(false);
  const [pinValid,        setPinValid]        = useState(null);
  const [zoneLabel,       setZoneLabel]       = useState('');
  const [zoneDays,        setZoneDays]        = useState('');

  // Recalculate delivery charge when address city/state changes
  // ── Pincode validation + Shiprocket serviceability check ────────
  useEffect(() => {
    const pin = address.pincode?.trim();
    if (!pin || pin.length !== 6 || !/^[0-9]{6}$/.test(pin)) {
      setPinValid(null);
      setNotServiceable(false);
      setServiceMsg('');
      return;
    }

    setCheckingPin(true);
    setPinValid(null);

    // Step 1: India Post API — validate pincode + auto-fill city/state
    fetch(`https://api.postalpincode.in/pincode/${pin}`)
      .then(r => r.json())
      .then(async data => {
        const post = data?.[0];

        if (post?.Status !== 'Success' || !post?.PostOffice?.length) {
          // Invalid pincode
          setNotServiceable(true);
          setPinValid(false);
          setServiceMsg(`Pincode ${pin} is not valid. Please enter a correct pincode.`);
          setShipping(0);
          setCheckingPin(false);
          return;
        }

        // Auto-fill city and state
        const po = post.PostOffice[0];
        setAddress(prev => ({
          ...prev,
          city:  prev.city  || po.District || po.Name || '',
          state: prev.state || po.State    || '',
        }));

        // Step 2: Check Shiprocket serviceability via our backend
        try {
          const sellerPincode = cart.items?.[0]?.product?.createdBy?.sellerInfo?.address?.pincode || '';
          const res = await deliveryAPI.checkPincode(pin, sellerPincode);

          if (!res.serviceable) {
            // Pincode valid but Shiprocket doesn't deliver here
            setNotServiceable(true);
            setPinValid(false);
            setServiceMsg(`Delivery not available to pincode ${pin}. Please try a different address.`);
            setShipping(0);
          } else {
            // All good — serviceable
            setNotServiceable(false);
            setPinValid(true);
            setServiceMsg('');
            // If Shiprocket returned a real charge, use it
            if (res.charge && cartTotal < 999) {
              setShipping(res.charge);
              setDeliveryZone(res.zone || 'SHIPROCKET_LIVE');
            }
          }
        } catch {
          // Backend check failed — don't block, just mark valid
          setNotServiceable(false);
          setPinValid(true);
          setServiceMsg('');
        } finally {
          setCheckingPin(false);
        }
      })
      .catch(() => {
        // India Post API failed — don't block customer
        setPinValid(null);
        setCheckingPin(false);
      });
  }, [address.pincode]);

  // ── Calculate zone-based delivery charge from backend ───────────
  useEffect(() => {
    if (!address.pincode || address.pincode.length !== 6) { setShipping(0); setDeliveryZone(''); setZoneLabel(''); setZoneDays(''); return; }
    if (!address.city || !address.state) { setShipping(0); setDeliveryZone(''); return; }
    if (notServiceable) return;

    // Get first product ID to look up seller address on backend
    const productId = cart.items?.[0]?.product?._id || cart.items?.[0]?.product || '';

    deliveryAPI.getCharges({
      customerCity:    address.city,
      customerState:   address.state,
      customerPincode: address.pincode || '',
      productId,
    }).then(res => {
      if (res.success) {
        setShipping(res.charge);
        setDeliveryZone(res.zone);
        setZoneLabel(res.label);
        setZoneDays(res.days);
      }
    }).catch(() => {
      // Fallback if backend fails — keep 0 until pincode entered
      setShipping(0);
      setDeliveryZone('');
    });
  }, [address.city, address.state, address.pincode, cartTotal]);
  const tax = 0;
  const total = cartTotal + (address.pincode?.length === 6 ? shipping : 0) - couponDiscount;

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
    if (phone.length < 10) { toast.error('Enter valid phone number'); return; }
    if (pincode.length !== 6) { toast.error('Enter valid 6-digit pincode'); return; }
    if (notServiceable) {
      toast.error('Delivery not available to this pincode. Please change your address.');
      return;
    }
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
            <div className="mx-3 sm:mx-5 h-px" style={{ width: '48px', backgroundColor: i < step ? GOLD : 'rgba(255,255,255,0.08)' }} />
          )}
        </div>
      ))}
    </div>
  );

  /* ─────────── ORDER SUMMARY ─────────── */
  const OrderSummary = ({ mobile }) => (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
      {/* Mobile toggle header */}
      {mobile && (
        <button onClick={() => setSummaryOpen(!summaryOpen)}
          className="w-full flex items-center justify-between px-5 py-4"
          style={{ backgroundColor: BG2 }}>
          <div className="flex items-center gap-2">
            <FiShoppingBag size={15} style={{ color: GOLD }} />
            <span className="font-body text-xs tracking-[0.15em] uppercase" style={{ color: GOLD }}>
              Order Summary
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-body font-bold text-sm" style={{ color: GOLD }}>₹{total.toLocaleString()}</span>
            <FiChevronDown size={16} style={{ color: 'rgba(255,255,255,0.4)', transform: summaryOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>
        </button>
      )}

      {/* Desktop header */}
      {!mobile && (
        <div className="px-5 py-4" style={{ backgroundColor: BG2, borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2">
            <FiShoppingBag size={15} style={{ color: GOLD }} />
            <h3 className="font-body text-xs tracking-[0.2em] uppercase" style={{ color: GOLD }}>Order Summary</h3>
          </div>
        </div>
      )}

      {/* Content */}
      {(!mobile || summaryOpen) && (
        <>
          {/* Items */}
          <div className="px-5 py-4 space-y-3" style={{ borderBottom: `1px solid ${BORDER}`, maxHeight: '200px', overflowY: 'auto' }}>
            {items.map(item => (
              <div key={item._id} className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <img src={item.product?.images?.[0]?.url} alt=""
                    className="w-12 h-14 object-cover" style={{ borderRadius: '6px', backgroundColor: BG2 }} />
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

          {/* Price rows */}
          <div className="px-5 py-4 space-y-2.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
            {[
              { l: `Subtotal (${items.length} item${items.length !== 1 ? 's' : ''})`, v: `₹${cartTotal.toLocaleString()}` },
              { l: zoneLabel || `Delivery${deliveryZone ? ` (${deliveryZone.replace('_',' ')})` : ''}`,
            v: notServiceable
              ? '❌ Not available'
              : address.pincode?.length === 6 && shipping > 0
              ? `₹${shipping}`
              : address.pincode?.length === 6
              ? '⏳ Calculating...'
              : 'Enter pincode',
            muted: !address.pincode || address.pincode.length < 6,
            red: notServiceable },
                ].map(row => (
              <div key={row.l} className="flex items-center justify-between text-sm font-body">
                <span style={{ color: 'rgba(255,255,255,0.45)' }}>{row.l}</span>
                <span style={{ color: row.green ? '#4ade80' : 'rgba(255,255,255,0.75)' }}>{row.v}</span>
              </div>
            ))}
          </div>

          {/* Total */}
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

          {/* Coupon code */}
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            {couponApplied ? (
              <div className="flex items-center justify-between py-2 px-3" style={{ backgroundColor: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '8px' }}>
                <div>
                  <p className="font-body text-xs font-semibold" style={{ color: '#4ade80' }}>✓ {couponApplied.code} applied!</p>
                  <p className="font-body text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Saving ₹{couponDiscount}</p>
                </div>
                <button onClick={removeCoupon} className="font-body text-xs" style={{ color: '#f87171' }}>Remove</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Coupon code"
                  className="flex-1 px-3 py-2 font-body text-xs text-white focus:outline-none uppercase"
                  style={{ backgroundColor: BG2, border: `1px solid ${BORDER}`, borderRadius: '6px' }}
                  onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()} />
                <button onClick={handleApplyCoupon} disabled={applyingCoupon}
                  className="px-4 py-2 font-body text-xs tracking-wider uppercase text-white flex-shrink-0"
                  style={{ backgroundColor: applyingCoupon ? 'rgba(201,168,76,0.5)' : GOLD, borderRadius: '6px' }}>
                  {applyingCoupon ? '...' : 'Apply'}
                </button>
              </div>
            )}
          </div>

          {/* Trust badges */}
          <div className="px-5 py-4 grid grid-cols-2 gap-2">
            {[{ icon: FiShield, text: 'Secure Payment' }, { icon: FiTruck, text: 'Fast Delivery' }].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: BG2, borderRadius: '6px' }}>
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
      {/* Page Header */}
      <div className="py-8 px-4 sm:px-6 text-center" style={{ backgroundColor: BG2, borderBottom: `1px solid ${BORDER}` }}>
        <p className="section-subtitle">Almost there</p>
        <h1 className="section-title">Checkout</h1>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Step bar */}
        <StepBar />

        {/* Mobile order summary (collapsible) */}
        <div className="lg:hidden mb-6">
          <OrderSummary mobile />
        </div>

        {/* Main layout */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

          {/* ───── LEFT: Form ───── */}
          <div className="flex-1">
            <div className="p-5 sm:p-7" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px' }}>

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
                    {/* Row 1: Name + Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <TextInput label="Full Name *" value={address.fullName} onChange={set('fullName')} required />
                      <TextInput label="Phone Number *" value={address.phone} onChange={set('phone')} type="tel" maxLength={10} required />
                    </div>

                    {/* Address Line 1 */}
                    <TextInput label="Address Line 1 *" value={address.addressLine1} onChange={set('addressLine1')} placeholder="House no., Street, Area" required />

                    {/* Address Line 2 */}
                    <TextInput label="Address Line 2 (Optional)" value={address.addressLine2} onChange={set('addressLine2')} placeholder="Landmark, Colony" />

                    {/* Row: City + State + Pincode */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <TextInput label="City *" value={address.city} onChange={set('city')} required />
                      <TextInput label="State *" value={address.state} onChange={set('state')} required />
                      <div className="col-span-2 sm:col-span-1">
                        <div>
                          <TextInput label="Pincode *" value={address.pincode} onChange={e => { set('pincode')(e); setPinValid(null); setNotServiceable(false); setServiceMsg(''); }} maxLength={6} required />
                          {address.pincode?.length === 6 && (
                            <p className="font-body text-xs mt-1.5" style={{ color: notServiceable ? '#f87171' : pinValid ? '#4ade80' : 'rgba(255,255,255,0.4)' }}>
                              {checkingPin
                                ? '⏳ Checking delivery availability...'
                                : notServiceable
                                ? `❌ ${serviceMsg}`
                                : pinValid
                                ? '✅ Delivery available to this pincode'
                                : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Country (read-only) */}
                    <Field label="Country">
                      <div className="px-4 py-3 font-body text-sm" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.06)`, borderRadius: '8px', color: 'rgba(255,255,255,0.4)' }}>
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

                  <div className="space-y-3 mb-6">
                    {[
                      { id: 'Razorpay', label: 'Pay Online', sub: 'Cards · UPI · Net Banking · Wallets', emojis: '💳 📱 🏦' },
                      { id: 'COD',      label: 'Cash on Delivery', sub: 'Pay when your order arrives (+₹50 fee)', emojis: '💵' },
                    ].map(m => (
                      <label key={m.id} onClick={() => setPaymentMethod(m.id)}
                        className="flex items-center gap-4 p-4 cursor-pointer transition-all"
                        style={{
                          border: `2px solid ${paymentMethod === m.id ? GOLD : 'rgba(255,255,255,0.08)'}`,
                          backgroundColor: paymentMethod === m.id ? 'rgba(201,168,76,0.05)' : BG2,
                          borderRadius: '10px',
                        }}>
                        {/* Custom radio */}
                        <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                          style={{ border: `2px solid ${paymentMethod === m.id ? GOLD : 'rgba(255,255,255,0.2)'}`, backgroundColor: paymentMethod === m.id ? GOLD : 'transparent' }}>
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

                  {/* Address card */}
                  <div className="p-4 mb-4" style={{ backgroundColor: BG2, border: `1px solid ${BORDER}`, borderRadius: '10px' }}>
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

                  {/* Payment card */}
                  <div className="p-4 mb-5" style={{ backgroundColor: BG2, border: `1px solid ${BORDER}`, borderRadius: '10px' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-body text-[10px] tracking-[0.15em] uppercase mb-1" style={{ color: GOLD }}>Payment</p>
                        <p className="font-body text-sm text-white">{paymentMethod === 'COD' ? '💵 Cash on Delivery' : '💳 Online (Razorpay)'}</p>
                      </div>
                      <button onClick={() => setStep(1)} className="font-body text-xs hover:underline" style={{ color: GOLD }}>Edit</button>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="space-y-2 mb-6">
                    <p className="font-body text-[10px] tracking-[0.15em] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {items.length} Item{items.length !== 1 ? 's' : ''}
                    </p>
                    {items.map(item => (
                      <div key={item._id} className="flex items-center gap-3 p-3"
                        style={{ backgroundColor: BG2, border: `1px solid ${BORDER}`, borderRadius: '8px' }}>
                        <img src={item.product?.images?.[0]?.url} alt=""
                          className="w-12 h-14 object-cover flex-shrink-0" style={{ borderRadius: '6px', backgroundColor: BG }} />
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