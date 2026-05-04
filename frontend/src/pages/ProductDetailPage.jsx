import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { productAPI, reviewAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FiHeart, FiShare2, FiCheck, FiTruck, FiRefreshCw,
  FiShield, FiXCircle, FiPlay, FiPause,
  FiChevronLeft, FiChevronRight, FiMinus, FiPlus, FiShoppingCart,
  FiZoomIn, FiX, FiInfo, FiZap
} from 'react-icons/fi';

const GOLD = '#C9A84C';

/* ── Inject page-level styles once ─────────────────────────────── */
const injectDetailStyles = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById('pdp-styles')) return;
  const s = document.createElement('style');
  s.id = 'pdp-styles';
  s.textContent = `
    @property --pdp-angle {
      syntax: '<angle>'; inherits: false; initial-value: 0deg;
    }
    @keyframes pdp-spin       { to { --pdp-angle: 360deg; } }
    @keyframes pdp-glow-pulse { 0%,100%{opacity:0.3} 50%{opacity:0.85} }
    @keyframes pdp-fade-up    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes pdp-badge-pop  { 0%{transform:scale(0.7)} 70%{transform:scale(1.08)} 100%{transform:scale(1)} }
    @keyframes pdp-btn-pulse  { 0%{box-shadow:0 0 0 0 rgba(201,168,76,0.5)} 70%{box-shadow:0 0 0 10px rgba(201,168,76,0)} 100%{box-shadow:0 0 0 0 rgba(201,168,76,0)} }
    @keyframes pdp-skel-pulse { 0%,100%{opacity:0.4} 50%{opacity:0.85} }
    @keyframes pdp-buynow-shine {
      0%   { background-position: -200% center; }
      100% { background-position: 200% center; }
    }

    /* ── Animated gold border — main image card ── */
    .pdp-border-card {
      position: relative; border-radius: 12px; padding: 1.5px; background: transparent;
    }
    .pdp-border-card::before {
      content: ''; position: absolute; inset: 0;
      border-radius: 12px; padding: 1.5px;
      background: conic-gradient(
        from var(--pdp-angle),
        transparent 0deg, transparent 45deg,
        #6b4e10 65deg, #C9A84C 88deg, #f5e09a 110deg,
        #C9A84C 132deg, #6b4e10 152deg,
        transparent 172deg, transparent 360deg
      );
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor; mask-composite: exclude;
      animation: pdp-spin 4s linear infinite;
    }
    .pdp-border-card::after {
      content: ''; position: absolute; inset: -2px;
      border-radius: 14px; pointer-events: none;
      box-shadow: 0 0 18px rgba(201,168,76,0.2);
      animation: pdp-glow-pulse 3s ease-in-out infinite;
    }
    .pdp-border-card-inner {
      position: relative; border-radius: 10px; overflow: hidden; background: #141414; z-index: 1;
    }

    /* ── Active thumbnail spinning border ── */
    .pdp-thumb-active { position: relative; }
    .pdp-thumb-active::before {
      content: ''; position: absolute; inset: -2px;
      border-radius: 10px; padding: 2px;
      background: conic-gradient(from var(--pdp-angle), transparent 0deg, #C9A84C 90deg, transparent 180deg, #C9A84C 270deg, transparent 360deg);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor; mask-composite: exclude;
      animation: pdp-spin 2.5s linear infinite;
    }

    /* ── Size buttons ── */
    .pdp-size-btn {
      min-width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
      border: 1.5px solid rgba(255,255,255,0.12); border-radius: 6px; cursor: pointer;
      font-size: 11px; font-weight: 500; color: rgba(255,255,255,0.6);
      background: rgba(255,255,255,0.03); transition: all 0.2s ease; padding: 0 9px; font-family: inherit;
    }
    .pdp-size-btn:hover  { border-color: rgba(201,168,76,0.5); color: #fff; background: rgba(201,168,76,0.08); }
    .pdp-size-btn.active { border-color: #C9A84C; background: #C9A84C; color: #000; font-weight: 700; }

    /* ── Color swatches ── */
    .pdp-color-swatch {
      width: 24px; height: 24px; border-radius: 50%; cursor: pointer;
      border: 2px solid transparent; transition: all 0.2s ease; position: relative; flex-shrink: 0;
    }
    .pdp-color-swatch.active {
      border-color: #C9A84C; box-shadow: 0 0 0 3px rgba(201,168,76,0.25); transform: scale(1.15);
    }

    /* ── Tab underline ── */
    .pdp-tab {
      position: relative; padding: 10px 4px; font-size: 11px; letter-spacing: 0.12em;
      text-transform: uppercase; cursor: pointer; background: none; border: none; font-family: inherit; transition: color 0.2s;
    }
    .pdp-tab::after {
      content: ''; position: absolute; bottom: 0; left: 0; right: 0;
      height: 2px; background: #C9A84C; transform: scaleX(0); transition: transform 0.25s ease; border-radius: 2px;
    }
    .pdp-tab.active::after { transform: scaleX(1); }

    /* ── Review card ── */
    .pdp-review-card {
      padding: 12px; border-radius: 10px;
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
      animation: pdp-fade-up 0.35s ease both;
    }

    /* ── Perk cards ── */
    .pdp-perk {
      display: flex; align-items: center; gap: 7px; padding: 8px 10px; border-radius: 8px;
      background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); transition: border-color 0.2s;
    }
    .pdp-perk:hover { border-color: rgba(201,168,76,0.2); }

    /* ── Related product cards — animated border ── */
    .pdp-rel-card {
      position: relative; border-radius: 11px; padding: 1.5px;
      background: transparent; text-decoration: none; display: block;
    }
    .pdp-rel-card::before {
      content: ''; position: absolute; inset: 0; border-radius: 11px; padding: 1.5px;
      background: conic-gradient(from var(--pdp-angle), transparent 0deg, transparent 50deg, #8B6914 70deg, #C9A84C 90deg, #f5e09a 110deg, #C9A84C 130deg, #8B6914 150deg, transparent 170deg, transparent 360deg);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor; mask-composite: exclude;
      opacity: 0; animation: pdp-spin 4s linear infinite paused; transition: opacity 0.3s;
    }
    .pdp-rel-card:hover::before { opacity: 1; animation-play-state: running; }
    .pdp-rel-card::after {
      content: ''; position: absolute; inset: -1px; border-radius: 12px; pointer-events: none; transition: box-shadow 0.3s;
    }
    .pdp-rel-card:hover::after { box-shadow: 0 0 20px rgba(201,168,76,0.15), 0 8px 30px rgba(0,0,0,0.4); }
    .pdp-rel-inner { border-radius: 9px; overflow: hidden; background: #000; position: relative; z-index: 1; }

    /* ── DESKTOP: larger related product image ── */
    .pdp-rel-img   { width: 100%; padding-top: 120%; position: relative; overflow: hidden; background: #111; }
    @media (max-width: 639px) {
      .pdp-rel-img { padding-top: 130%; }
    }

    .pdp-rel-img img {
      position: absolute; inset: 0; width: 100%; height: 100%;
      object-fit: cover; object-position: center top; transition: transform 0.5s ease;
    }
    .pdp-rel-card:hover .pdp-rel-img img { transform: scale(1.06); }

    /* Mobile: always-on border */
    @media (hover: none), (pointer: coarse) {
      .pdp-rel-card::before { opacity: 1; animation-play-state: running; }
      .pdp-rel-card::after  { box-shadow: 0 0 12px rgba(201,168,76,0.2); animation: pdp-glow-pulse 3s ease-in-out infinite; }
    }

    /* ── Skeleton ── */
    .pdp-skel { background: rgba(30,22,12,0.6); border-radius: 10px; animation: pdp-skel-pulse 1.4s ease-in-out infinite; }

    /* ── Qty stepper ── */
    .pdp-qty-btn {
      width: 30px; height: 30px; border-radius: 6px; display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
      color: #fff; cursor: pointer; transition: all 0.2s; font-family: inherit;
    }
    .pdp-qty-btn:hover { background: rgba(201,168,76,0.15); border-color: rgba(201,168,76,0.4); }

    /* ── Breadcrumb ── */
    .pdp-crumb { font-size: 10px; color: rgba(255,255,255,0.35); text-decoration: none; transition: color 0.2s; }
    .pdp-crumb:hover { color: #C9A84C; }

    /* ── Size guide modal ── */
    .pdp-sg-overlay {
      position: fixed; inset: 0; z-index: 300; background: rgba(0,0,0,0.82);
      display: flex; align-items: center; justify-content: center;
      padding: 20px; backdrop-filter: blur(8px);
    }
    .pdp-sg-modal {
      background: #141414; border: 1px solid rgba(201,168,76,0.2);
      border-radius: 14px; width: 100%; max-width: 460px;
      max-height: 85vh; overflow-y: auto;
    }
    .pdp-sg-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .pdp-sg-table th {
      padding: 7px 11px; text-align: left; font-size: 9.5px;
      letter-spacing: 0.12em; text-transform: uppercase;
      color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.03);
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .pdp-sg-table td {
      padding: 8px 11px; color: rgba(255,255,255,0.75);
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .pdp-sg-table tr:last-child td { border-bottom: none; }
    .pdp-sg-table tr:hover td { background: rgba(201,168,76,0.04); }

    /* ── ATC button pulse ── */
    .pdp-atc-btn { animation: pdp-btn-pulse 2s ease-in-out infinite; }

    /* ── Buy Now button shine effect ── */
    .pdp-buynow-btn {
      position: relative; overflow: hidden;
      background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%);
      border: 1.5px solid rgba(201,168,76,0.5);
      transition: all 0.25s ease;
    }
    .pdp-buynow-btn::before {
      content: '';
      position: absolute; inset: 0;
      background: linear-gradient(
        105deg,
        transparent 30%,
        rgba(201,168,76,0.18) 50%,
        transparent 70%
      );
      background-size: 200% 100%;
      animation: pdp-buynow-shine 2.2s linear infinite;
    }
    .pdp-buynow-btn:hover {
      background: linear-gradient(135deg, #1e1a0e 0%, #2e2510 50%, #1e1a0e 100%);
      border-color: #C9A84C;
      box-shadow: 0 0 18px rgba(201,168,76,0.25), inset 0 0 12px rgba(201,168,76,0.05);
    }
    .pdp-buynow-btn:active { transform: scale(0.98); }

    /* ── Related product info area black bg ── */
    .pdp-rel-info { padding: 10px 10px 12px; background: #000; }
  `;
  document.head.appendChild(s);
};

/* ── Default size measurements — fallback when seller hasn't set custom ones ── */
const SIZE_MEASUREMENTS = {
  XS: { chest: '32–33"', waist: '24–25"', hips: '34–35"', length: '25"' },
  S: { chest: '34–35"', waist: '26–27"', hips: '36–37"', length: '26"' },
  M: { chest: '36–37"', waist: '28–29"', hips: '38–39"', length: '27"' },
  L: { chest: '38–40"', waist: '30–32"', hips: '40–42"', length: '28"' },
  XL: { chest: '41–43"', waist: '33–35"', hips: '43–45"', length: '29"' },
  XXL: { chest: '44–46"', waist: '36–38"', hips: '46–48"', length: '30"' },
  'Free Size': { chest: '32–42"', waist: '24–36"', hips: '34–46"', length: 'Adjustable' },
};

/* ── Size Guide Modal ── */
function SizeGuideModal({ sizes, sizeGuide, onClose }) {
  const mergedMeasurements = { ...SIZE_MEASUREMENTS, ...(sizeGuide || {}) };
  const displaySizes = (sizes?.length > 0 ? sizes : Object.keys(mergedMeasurements))
    .filter(sz => mergedMeasurements[sz]);

  return (
    <div className="pdp-sg-overlay" onClick={onClose}>
      <motion.div
        className="pdp-sg-modal"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <p style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, margin: '0 0 3px' }}>Trendorra</p>
            <h3 style={{ fontSize: 14, fontWeight: 400, color: '#fff', margin: 0 }}>Size Guide</h3>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}>
            <FiX size={14} />
          </button>
        </div>

        <div style={{ margin: '12px 14px', padding: '9px 12px', borderRadius: 7, background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.18)', display: 'flex', gap: 9, alignItems: 'flex-start' }}>
          <FiInfo size={13} style={{ color: GOLD, flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0 }}>
            <strong style={{ color: GOLD }}>How to measure:</strong> Use a soft measuring tape. Measure chest at fullest point, waist at narrowest, hips at fullest. All measurements in inches.
          </p>
        </div>

        {sizes?.length > 0 && (
          <div style={{ padding: '0 14px 10px' }}>
            <p style={{ fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 7 }}>
              Available in this product
            </p>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {sizes.map(sz => (
                <span key={sz} style={{ padding: '3px 11px', borderRadius: 5, background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', fontSize: 11.5, fontWeight: 600, color: GOLD }}>
                  {sz}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ padding: '0 14px 18px', overflowX: 'auto' }}>
          {displaySizes.length > 0 ? (
            <table className="pdp-sg-table">
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Chest</th>
                  <th>Waist</th>
                  <th>Hips</th>
                  <th>Length</th>
                </tr>
              </thead>
              <tbody>
                {displaySizes.map(sz => {
                  const m = mergedMeasurements[sz];
                  return (
                    <tr key={sz}>
                      <td style={{ fontWeight: 700, color: '#fff' }}>{sz}</td>
                      <td>{m.chest || '—'}</td>
                      <td>{m.waist || '—'}</td>
                      <td>{m.hips || '—'}</td>
                      <td>{m.length || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center', padding: '16px 0' }}>
              No size measurements available for this product.
            </p>
          )}
        </div>

        <div style={{ padding: '10px 14px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
          <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.28)', margin: 0 }}>If between sizes, we recommend sizing up for comfort.</p>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Video Player ── */
function VideoPlayer({ src, style }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [showCtrl, setShowCtrl] = useState(true);
  const hideTimer = useRef(null);

  const toggle = e => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play(); setPlaying(true);
      hideTimer.current = setTimeout(() => setShowCtrl(false), 1800);
    } else {
      v.pause(); setPlaying(false); setShowCtrl(true);
      clearTimeout(hideTimer.current);
    }
  };
  useEffect(() => () => clearTimeout(hideTimer.current), []);

  return (
    <div onClick={() => { setShowCtrl(true); if (playing) { clearTimeout(hideTimer.current); hideTimer.current = setTimeout(() => setShowCtrl(false), 1800); } }} style={{ position: 'relative', ...style }}>
      <video ref={videoRef} src={src} playsInline loop muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 'inherit' }} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      <div onClick={toggle} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: showCtrl ? 1 : 0, transition: 'opacity 0.3s', background: playing && !showCtrl ? 'transparent' : 'rgba(0,0,0,0.2)', cursor: 'pointer', borderRadius: 'inherit' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: `2px solid rgba(201,168,76,0.7)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {playing ? <FiPause size={16} color={GOLD} /> : <FiPlay size={16} color={GOLD} style={{ marginLeft: 2 }} />}
        </div>
      </div>
    </div>
  );
}

/* ── Stars ── */
function Stars({ rating, size = 12 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} style={{ fontSize: size, color: s <= Math.round(rating) ? GOLD : 'rgba(255,255,255,0.12)' }}>★</span>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════ */
export default function ProductDetailPage() {
  injectDetailStyles();

  const { id } = useParams();
  const navigate = useNavigate();
  const reviewsRef = useRef(null);

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [related, setRelated] = useState([]);
  const [activeMedia, setActiveMedia] = useState({ type: 'image', index: 0 });
  const [imgZoomed, setImgZoomed] = useState(false);
  const [addingCart, setAddingCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    Promise.all([productAPI.getById(id), reviewAPI.getByProduct(id)])
      .then(([pRes, rRes]) => {
        const p = pRes.product;
        setProduct(p);
        setReviews(rRes.reviews || []);
        if (p.colors?.[0]) setSelectedColor(p.colors[0].name);
        if (p.sizes?.[0]) setSelectedSize(p.sizes[0]);
        if (p.category) {
          productAPI.getAll({ category: p.category, limit: 5 })
            .then(r => setRelated((r.products || []).filter(x => x._id !== id).slice(0, 4)));
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  /* ── Inject OG meta tags dynamically when product loads ── */
  useEffect(() => {
    if (!product) return;
    const setMeta = (prop, content, isName = false) => {
      const attr = isName ? 'name' : 'property';
      let el = document.querySelector(`meta[${attr}="${prop}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, prop); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    const effectivePrice = product.discountPrice != null && product.discountPrice > 0
      ? product.discountPrice : product.price;
    document.title = `${product.name} | Trendorra`;
    setMeta('og:title', product.name);
    setMeta('og:description', product.description?.slice(0, 150) || product.name);
    setMeta('og:image', product.images?.[0]?.url || '');
    setMeta('og:url', window.location.href);
    setMeta('og:type', 'product');
    setMeta('og:site_name', 'Trendorra');
    setMeta('product:price:amount', String(effectivePrice));
    setMeta('product:price:currency', 'INR');
    setMeta('twitter:card', 'summary_large_image', true);
    setMeta('twitter:title', product.name, true);
    setMeta('twitter:description', product.description?.slice(0, 150) || product.name, true);
    setMeta('twitter:image', product.images?.[0]?.url || '', true);
  }, [product]);

  const handleReadReviews = e => {
    e.preventDefault();
    setActiveTab('reviews');
    setTimeout(() => {
      reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const handleAddToCart = async () => {
    if (product.sizes?.length && !selectedSize) { toast.error('Please select a size'); return; }
    setAddingCart(true);
    await addToCart(product._id, selectedSize, selectedColor, quantity);
    setAddingCart(false);
  };

  /* ── FIX: Buy Now — adds to cart then navigates to checkout ── */
  const handleBuyNow = async () => {
    if (product.sizes?.length && !selectedSize) { toast.error('Please select a size'); return; }
    setBuyingNow(true);
    try {
      await addToCart(product._id, selectedSize, selectedColor, quantity);
      navigate('/checkout');
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setBuyingNow(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const effectivePriceVal = hasDiscount ? product.discountPrice : product.price;
    const savingsLine = hasDiscount
      ? `💰 Save ₹${(product.price - product.discountPrice).toLocaleString()} (${discountPct}% OFF)`
      : '';

    // ✅ Text ONLY — no URL in text. URL passed separately via `url` field.
    // WhatsApp appends the URL at the end and fetches OG image from it automatically.
    const premiumText = [
      `✨ *${product.name}*`,
      `━━━━━━━━━━━━━━━━`,
      hasDiscount
        ? `💸 *₹${effectivePriceVal?.toLocaleString()}* ~₹${product.price?.toLocaleString()}~`
        : `💸 *₹${effectivePriceVal?.toLocaleString()}*`,
      savingsLine,
      product.sizes?.length ? `📐 Sizes: ${product.sizes.join(' · ')}` : '',
      product.colors?.length ? `🎨 Colors: ${product.colors.map(c => c.name).join(' · ')}` : '',
      `━━━━━━━━━━━━━━━━`,
      `🛍️ Shop now on *Trendorra*`,
    ]
      .filter(Boolean)
      .join('\n');

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: premiumText + '\n',  // trailing newline so URL preview renders below
          url,                        // ✅ URL passed here only — NOT inside text
        });
        return;
      } catch (e) { if (e.name === 'AbortError') return; }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(`${premiumText}\n${url}`);
      toast.success('Copied to clipboard!');
    } catch { toast.error('Share failed'); }
  };
  const handleReview = async e => {
    e.preventDefault();
    if (!isLoggedIn) { toast.error('Please login to review'); return; }
    setSubmitting(true);
    try {
      const res = await reviewAPI.create({ productId: id, ...reviewForm });
      setReviews(prev => [res.review, ...prev]);
      setReviewForm({ rating: 5, title: '', comment: '' });
      toast.success('Review submitted!');
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  /* ── Loading skeleton ── */
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', padding: '20px 16px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr', gap: 20 }} className="lg:grid-cols-2">
        <div className="pdp-skel" style={{ width: '100%', paddingTop: '100%', borderRadius: 12 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[80, 55, 40, 65, 45, 75, 40].map((w, i) => (
            <div key={i} className="pdp-skel" style={{ height: i === 0 ? 24 : 11, width: `${w}%` }} />
          ))}
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div style={{ textAlign: 'center', padding: '80px 16px', background: '#0d0d0d', minHeight: '100vh' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, marginBottom: 16 }}>Product not found</p>
      <Link to="/shop" style={{ color: GOLD, textDecoration: 'none', fontSize: 11.5, letterSpacing: '0.12em', textTransform: 'uppercase', border: `1px solid ${GOLD}`, padding: '8px 20px', borderRadius: 6 }}>Back to Shop</Link>
    </div>
  );

  const images = product.images?.length > 0 ? product.images : [{ url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600' }];
  const videos = product.videos || [];
  const allMedia = [
    ...images.map((img, i) => ({ type: 'image', index: i, url: img.url })),
    ...videos.map((vid, i) => ({ type: 'video', index: i, url: vid.url })),
  ];
  const activeMobIdx = allMedia.findIndex(x => x.type === activeMedia.type && x.index === activeMedia.index);

  const hasDiscount = product.discountPrice != null && product.discountPrice > 0;
  const effectivePrice = hasDiscount ? product.discountPrice : product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : null;

  const noReturns = product.createdBy?.sellerInfo?.noReturnsEnabled;

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d' }}>

      {/* ── Breadcrumb ── */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '10px 16px' }} className="sm:px-6">
        <nav style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <Link to="/" className="pdp-crumb">Home</Link>
          <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 9 }}>/</span>
          <Link to="/shop" className="pdp-crumb">Shop</Link>
          <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 9 }}>/</span>
          <Link to={`/shop/${product.category?.toLowerCase()}`} className="pdp-crumb">{product.category}</Link>
          <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 9 }}>/</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</span>
        </nav>
      </div>

      {/* ── Main grid ── */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 16px 32px' }} className="sm:px-6">
        <div style={{ display: 'grid', gap: 24, alignItems: 'start' }} className="lg:grid-cols-2">

          {/* ════ LEFT — GALLERY ════ */}
          <div>
            {/* MOBILE */}
            <div className="lg:hidden">
              <div className="pdp-border-card" style={{ marginBottom: 7 }}>
                <div className="pdp-border-card-inner">
                  <div style={{ position: 'relative', width: '100%', paddingTop: '108%', background: '#1a1a1a' }}>
                    <AnimatePresence mode="wait">
                      {activeMedia.type === 'image' ? (
                        <motion.img key={`mi-${activeMedia.index}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}
                          src={images[activeMedia.index]?.url} alt={product.name}
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', cursor: 'zoom-in' }}
                          onClick={() => setImgZoomed(true)} />
                      ) : (
                        <motion.div key={`mv-${activeMedia.index}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0 }}>
                          <VideoPlayer src={videos[activeMedia.index]?.url} style={{ width: '100%', height: '100%' }} />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 3, zIndex: 4 }}>
                      {product.isNewArrival && <span style={{ background: GOLD, color: '#000', fontSize: 8, fontWeight: 800, letterSpacing: '0.14em', padding: '2px 7px', textTransform: 'uppercase' }}>New</span>}
                      {product.isBestSeller && <span style={{ background: '#111', color: '#fff', fontSize: 8, fontWeight: 700, padding: '2px 7px', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.15)' }}>Best Seller</span>}
                      {discountPct && <span style={{ background: '#ef4444', color: '#fff', fontSize: 8, fontWeight: 800, padding: '2px 7px', textTransform: 'uppercase' }}>-{discountPct}% OFF</span>}
                    </div>

                    {activeMedia.type === 'image' && (
                      <button onClick={() => setImgZoomed(true)} style={{ position: 'absolute', bottom: 8, right: 8, width: 28, height: 28, borderRadius: 6, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 4 }}>
                        <FiZoomIn size={12} color="#fff" />
                      </button>
                    )}

                    {allMedia.length > 1 && (<>
                      <button onClick={() => { const i = (activeMobIdx - 1 + allMedia.length) % allMedia.length; setActiveMedia({ type: allMedia[i].type, index: allMedia[i].index }); }}
                        style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 4 }}>
                        <FiChevronLeft size={13} color="#fff" />
                      </button>
                      <button onClick={() => { const i = (activeMobIdx + 1) % allMedia.length; setActiveMedia({ type: allMedia[i].type, index: allMedia[i].index }); }}
                        style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 4 }}>
                        <FiChevronRight size={13} color="#fff" />
                      </button>
                    </>)}
                  </div>
                </div>
              </div>

              {allMedia.length > 1 && (
                <div style={{ display: 'flex', gap: 5, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 3 }}>
                  {allMedia.map((m, i) => {
                    const active = i === activeMobIdx;
                    return (
                      <button key={i} onClick={() => setActiveMedia({ type: m.type, index: m.index })}
                        className={active ? 'pdp-thumb-active' : ''}
                        style={{ flexShrink: 0, width: 44, height: 54, borderRadius: 7, overflow: 'hidden', border: `1.5px solid ${active ? GOLD : 'rgba(255,255,255,0.1)'}`, background: '#1a1a1a', cursor: 'pointer', position: 'relative', transition: 'border-color 0.2s' }}>
                        {m.type === 'image'
                          ? <img src={m.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a' }}><FiPlay size={11} color={GOLD} /></div>
                        }
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* DESKTOP */}
            <div className="hidden lg:flex" style={{ gap: 8, alignItems: 'flex-start' }}>
              {allMedia.length > 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 52, maxHeight: 460, overflowY: 'auto', scrollbarWidth: 'none', flexShrink: 0 }}>
                  {allMedia.map((m, i) => {
                    const active = activeMedia.type === m.type && activeMedia.index === m.index;
                    return (
                      <button key={i} onClick={() => setActiveMedia({ type: m.type, index: m.index })}
                        className={active ? 'pdp-thumb-active' : ''}
                        style={{ width: '100%', aspectRatio: '3/4', borderRadius: 7, overflow: 'hidden', border: `1.5px solid ${active ? GOLD : 'rgba(255,255,255,0.1)'}`, background: '#1a1a1a', cursor: 'pointer', flexShrink: 0, position: 'relative', transition: 'border-color 0.2s' }}>
                        {m.type === 'image'
                          ? <img src={m.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a' }}><FiPlay size={11} color={GOLD} /></div>
                        }
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="pdp-border-card" style={{ flex: 1 }}>
                <div className="pdp-border-card-inner" style={{ aspectRatio: '2/3', position: 'relative', cursor: 'zoom-in' }} onClick={() => setImgZoomed(true)}>
                  <AnimatePresence mode="wait">
                    {activeMedia.type === 'image' ? (
                      <motion.img key={`di-${activeMedia.index}`} initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.28 }}
                        src={images[activeMedia.index]?.url} alt={product.name}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
                    ) : (
                      <motion.div key={`dv-${activeMedia.index}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'absolute', inset: 0 }}>
                        <VideoPlayer src={videos[activeMedia.index]?.url} style={{ width: '100%', height: '100%' }} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 4 }}>
                    {product.isNewArrival && <span style={{ background: GOLD, color: '#000', fontSize: 8, fontWeight: 800, letterSpacing: '0.14em', padding: '2px 8px', textTransform: 'uppercase' }}>New Arrival</span>}
                    {product.isBestSeller && <span style={{ background: '#111', color: '#fff', fontSize: 8, fontWeight: 700, padding: '2px 8px', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.15)' }}>Best Seller</span>}
                    {discountPct && <span style={{ background: '#ef4444', color: '#fff', fontSize: 8, fontWeight: 800, padding: '2px 8px', textTransform: 'uppercase' }}>-{discountPct}% OFF</span>}
                  </div>

                  <button onClick={e => { e.stopPropagation(); setImgZoomed(true); }}
                    style={{ position: 'absolute', bottom: 10, right: 10, width: 30, height: 30, borderRadius: 7, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 4 }}>
                    <FiZoomIn size={13} color="#fff" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ════ RIGHT — PRODUCT INFO ════ */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} style={{ display: 'flex', flexDirection: 'column' }}>

            {/* Brand + Name */}
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: GOLD, marginBottom: 4, fontFamily: 'Jost,sans-serif' }}>{product.brand || 'Trendorra'}</p>
              <h1 style={{ fontSize: 'clamp(1.1rem,2.8vw,1.5rem)', fontWeight: 300, color: '#fff', lineHeight: 1.25, margin: 0 }}>{product.name}</h1>
            </div>

            {/* Ratings */}
            {product.numReviews > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12, flexWrap: 'wrap' }}>
                <Stars rating={product.ratings} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{product.ratings?.toFixed(1)} · {product.numReviews} reviews</span>
                <a href="#reviews" onClick={handleReadReviews} style={{ fontSize: 10.5, color: GOLD, textDecoration: 'underline', textDecorationColor: 'rgba(201,168,76,0.4)', cursor: 'pointer' }}>Read reviews</a>
              </div>
            )}

            {/* ── PRICE ── */}
            <div style={{ padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: hasDiscount ? 8 : 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 'clamp(1.2rem,3.5vw,1.65rem)', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
                  ₹{effectivePrice?.toLocaleString()}
                </span>
                {hasDiscount && (
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>₹{product.price?.toLocaleString()}</span>
                )}
              </div>
            </div>

            {/* ── Offer label — shown below price bar when discount exists ── */}
            {hasDiscount && (
              <div style={{ marginBottom: 14, marginTop: 0 }}>
                <span style={{
                  display: 'inline-block',
                  background: '#22c55e',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.07em',
                  padding: '3px 10px',
                  borderRadius: 5,
                }}>
                  {discountPct}% OFF
                </span>
                <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)', marginLeft: 8 }}>
                  You save ₹{(product.price - product.discountPrice)?.toLocaleString()}
                </span>
              </div>
            )}

            {/* Color */}
            {product.colors?.length > 0 && (
              <div style={{ marginBottom: 13 }}>
                <p style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.42)', marginBottom: 7 }}>
                  Color: <span style={{ color: '#fff', fontWeight: 500 }}>{selectedColor}</span>
                </p>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {product.colors.map(c => (
                    <div key={c.name} className={`pdp-color-swatch${selectedColor === c.name ? ' active' : ''}`}
                      onClick={() => setSelectedColor(c.name)} title={c.name}
                      style={{ backgroundColor: c.hex || '#555' }} />
                  ))}
                </div>
              </div>
            )}

            {/* Size */}
            {product.sizes?.length > 0 && (
              <div style={{ marginBottom: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                  <p style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.42)', margin: 0 }}>Size</p>
                  <button onClick={() => setSizeGuideOpen(true)}
                    style={{ fontSize: 10, color: GOLD, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', textDecorationColor: 'rgba(201,168,76,0.35)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <FiInfo size={10} /> Size Guide
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {product.sizes.map(size => (
                    <button key={size} className={`pdp-size-btn${selectedSize === size ? ' active' : ''}`}
                      onClick={() => setSelectedSize(size)}>{size}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, overflow: 'hidden' }}>
                <button className="pdp-qty-btn" style={{ borderRadius: 0, border: 'none', borderRight: '1px solid rgba(255,255,255,0.08)' }} onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                  <FiMinus size={11} />
                </button>
                <span style={{ width: 36, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#fff' }}>{quantity}</span>
                <button className="pdp-qty-btn" style={{ borderRadius: 0, border: 'none', borderLeft: '1px solid rgba(255,255,255,0.08)' }} onClick={() => setQuantity(q => Math.min(product.stock || 99, q + 1))}>
                  <FiPlus size={11} />
                </button>
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                {product.stock > 0
                  ? <><span style={{ color: '#22c55e' }}>●</span> {product.stock} in stock</>
                  : <><span style={{ color: '#ef4444' }}>●</span> Out of stock</>}
              </span>
            </div>

            {/* ── CTA ROW: Add to Cart + Wishlist + Share ── */}
            <div style={{ display: 'flex', gap: 7, marginBottom: 9 }}>
              <button className="pdp-atc-btn" onClick={handleAddToCart} disabled={addingCart}
                style={{ flex: 1, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: addingCart ? 'rgba(201,168,76,0.6)' : GOLD, color: '#000', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: addingCart ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' }}>
                <FiShoppingCart size={14} />
                {addingCart ? 'Adding...' : 'Add to Cart'}
              </button>
              <button onClick={() => toggleWishlist(product._id)}
                style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${isWishlisted(product._id) ? GOLD : 'rgba(255,255,255,0.12)'}`, borderRadius: 8, background: isWishlisted(product._id) ? GOLD : 'transparent', color: isWishlisted(product._id) ? '#000' : 'rgba(255,255,255,0.6)', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}>
                <FiHeart size={15} fill={isWishlisted(product._id) ? 'currentColor' : 'none'} />
              </button>
              <button onClick={handleShare}
                style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: 8, background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}>
                <FiShare2 size={15} />
              </button>
            </div>

            {/* ── BUY NOW BUTTON — stylish dark gold shimmer ── */}
            <button
              className="pdp-buynow-btn"
              onClick={handleBuyNow}
              disabled={buyingNow}
              style={{
                width: '100%',
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                cursor: buyingNow ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                color: buyingNow ? 'rgba(201,168,76,0.5)' : GOLD,
                marginBottom: 14,
                opacity: buyingNow ? 0.7 : 1,
              }}
            >
              <FiZap size={13} style={{ filter: `drop-shadow(0 0 4px ${GOLD})` }} />
              {buyingNow ? 'Redirecting...' : 'Buy Now'}
            </button>

            {/* Perks */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
              {[
                { icon: FiTruck, text: 'Free shipping above ₹999', sub: 'Delivered in 3-5 days' },
                { icon: noReturns ? FiXCircle : FiRefreshCw, text: noReturns ? 'Non-returnable' : '7-day returns', sub: noReturns ? 'Check description' : 'Hassle-free process', red: noReturns },
                { icon: FiShield, text: '100% Authentic', sub: 'Verified products' },
                { icon: FiCheck, text: 'Cash on Delivery', sub: 'Available everywhere' },
              ].map(({ icon: Icon, text, sub, red }) => (
                <div key={text} className="pdp-perk">
                  <Icon size={13} style={{ color: red ? '#f87171' : GOLD, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 600, color: red ? '#f87171' : '#fff', margin: '0 0 1px' }}>{text}</p>
                    <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', margin: 0 }}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Return policy */}
            <div style={{ borderRadius: 10, border: `1px solid ${noReturns ? 'rgba(248,113,113,0.22)' : 'rgba(255,255,255,0.07)'}`, overflow: 'hidden' }}>
              <div style={{ background: noReturns ? 'rgba(248,113,113,0.08)' : 'rgba(34,197,94,0.06)', borderBottom: `1px solid ${noReturns ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.06)'}`, padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                {noReturns ? <FiXCircle size={10} style={{ color: '#f87171', flexShrink: 0 }} /> : <FiRefreshCw size={10} style={{ color: '#22c55e', flexShrink: 0 }} />}
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: noReturns ? '#f87171' : '#22c55e' }}>
                  {noReturns ? 'Non-Returnable Item' : 'Return & Exchange Policy'}
                </span>
              </div>
              <div style={{ padding: 10, background: '#0d0d0d', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {(noReturns
                  ? [{ l: 'Return Window', v: 'Not applicable', r: true }, { l: 'Replacement', v: 'Not available', r: true }, { l: 'Reason', v: 'Seller policy' }, { l: 'Support', v: 'Within 48hrs' }]
                  : [{ l: 'Return Window', v: '7 days', g: true }, { l: 'Refund Mode', v: 'Original payment' }, { l: 'Condition', v: 'Unused & intact' }, { l: 'Process', v: 'Pickup arranged' }]
                ).map(({ l, v, r, g }) => (
                  <div key={l} style={{ background: '#161616', borderRadius: 5, padding: '6px 8px' }}>
                    <p style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.26)', margin: '0 0 2px' }}>{l}</p>
                    <p style={{ fontSize: 10.5, fontWeight: 500, color: r ? '#f87171' : g ? '#22c55e' : 'rgba(255,255,255,0.7)', margin: 0 }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
        </div>

        {/* ════ TABS ════ */}
        <div ref={reviewsRef} style={{ marginTop: 36, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', gap: 22, borderBottom: '1px solid rgba(255,255,255,0.07)', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {['description', 'reviews', 'care'].map(tab => (
              <button key={tab} className={`pdp-tab${activeTab === tab ? ' active' : ''}`}
                onClick={() => setActiveTab(tab)}
                style={{ color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>
                {tab === 'reviews' ? `Reviews (${reviews.length})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ padding: '22px 0' }}>
            <AnimatePresence mode="wait">

              {activeTab === 'description' && (
                <motion.div key="desc" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} style={{ maxWidth: 600 }}>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.58)', lineHeight: 1.85, margin: '0 0 12px' }}>{product.description}</p>
                  {product.material && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)' }}><strong style={{ color: 'rgba(255,255,255,0.68)' }}>Material:</strong> {product.material}</p>}
                </motion.div>
              )}

              {activeTab === 'care' && (
                <motion.div key="care" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} style={{ maxWidth: 600 }}>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.58)', lineHeight: 1.85 }}>
                    {product.careInstructions || 'Machine wash cold with similar colors. Do not bleach. Tumble dry low. Cool iron if needed. Do not dry clean.'}
                  </p>
                </motion.div>
              )}

              {activeTab === 'reviews' && (
                <motion.div key="reviews" id="reviews" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} style={{ maxWidth: 680 }}>

                  {reviews.length > 0 && (
                    <div style={{ display: 'flex', gap: 20, padding: 16, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 18, flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'center', minWidth: 64 }}>
                        <p style={{ fontSize: 44, fontWeight: 200, color: GOLD, lineHeight: 1, margin: '0 0 4px' }}>{product.ratings?.toFixed(1)}</p>
                        <Stars rating={product.ratings} size={11} />
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)', marginTop: 2 }}>{product.numReviews} reviews</p>
                      </div>
                      <div style={{ flex: 1, minWidth: 130, display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
                        {[5, 4, 3, 2, 1].map(star => {
                          const cnt = reviews.filter(r => Math.round(r.rating) === star).length;
                          const pct = reviews.length ? Math.round((cnt / reviews.length) * 100) : 0;
                          return (
                            <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', width: 7 }}>{star}</span>
                              <span style={{ fontSize: 10, color: GOLD }}>★</span>
                              <div style={{ flex: 1, height: 3, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: GOLD, borderRadius: 3, transition: 'width 0.8s ease' }} />
                              </div>
                              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.26)', width: 16, textAlign: 'right' }}>{cnt}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {isLoggedIn ? (
                    <div style={{ padding: 16, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 18 }}>
                      <h3 style={{ fontSize: 13, fontWeight: 400, color: '#fff', margin: '0 0 12px' }}>Write a Review</h3>
                      <form onSubmit={handleReview} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div>
                          <p style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.32)', marginBottom: 6 }}>Rating</p>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            {[1, 2, 3, 4, 5].map(s => (
                              <button key={s} type="button" onClick={() => setReviewForm(p => ({ ...p, rating: s }))}
                                style={{ fontSize: 20, color: s <= reviewForm.rating ? GOLD : 'rgba(255,255,255,0.1)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s', padding: 0 }}>★</button>
                            ))}
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginLeft: 4 }}>
                              {['', 'Terrible', 'Poor', 'Average', 'Good', 'Excellent'][reviewForm.rating]}
                            </span>
                          </div>
                        </div>
                        {[
                          { key: 'title', label: 'Review Title', placeholder: 'e.g. Great quality!', type: 'input' },
                          { key: 'comment', label: 'Your Review', placeholder: 'Tell others what you think...', type: 'textarea' },
                        ].map(({ key, label, placeholder, type }) => (
                          <div key={key}>
                            <p style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.32)', marginBottom: 4 }}>{label}</p>
                            {type === 'input'
                              ? <input required placeholder={placeholder} value={reviewForm[key]} onChange={e => setReviewForm(p => ({ ...p, [key]: e.target.value }))}
                                style={{ width: '100%', padding: '8px 12px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                              : <textarea required rows={3} placeholder={placeholder} value={reviewForm[key]} onChange={e => setReviewForm(p => ({ ...p, [key]: e.target.value }))}
                                style={{ width: '100%', padding: '8px 12px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 12, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                            }
                          </div>
                        ))}
                        <button type="submit" disabled={submitting}
                          style={{ alignSelf: 'flex-start', padding: '8px 20px', background: submitting ? 'rgba(201,168,76,0.5)' : GOLD, color: '#000', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                          {submitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div style={{ padding: 16, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center', marginBottom: 18 }}>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)', marginBottom: 10 }}>Login to write a review</p>
                      <Link to="/login" style={{ display: 'inline-block', padding: '7px 20px', background: GOLD, color: '#000', borderRadius: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>Login to Review</Link>
                    </div>
                  )}

                  {reviews.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                      <p style={{ fontSize: 28, marginBottom: 7 }}>⭐</p>
                      <p style={{ fontSize: 14, fontWeight: 300, color: '#fff', marginBottom: 4 }}>No reviews yet</p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.32)' }}>Be the first to share your experience!</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {reviews.map((review, ri) => (
                        <div key={review._id} className="pdp-review-card" style={{ animationDelay: `${ri * 0.05}s` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#000', flexShrink: 0 }}>
                              {review.user?.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{review.user?.name}</span>
                                {review.isVerifiedPurchase && <span style={{ fontSize: 8, background: 'rgba(34,197,94,0.12)', color: '#22c55e', padding: '2px 6px', borderRadius: 3, fontWeight: 600 }}>✓ Verified</span>}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                                <Stars rating={review.rating} size={9} />
                                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)' }}>
                                  {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          </div>
                          {review.title && <h4 style={{ fontSize: 12, fontWeight: 600, color: '#fff', margin: '0 0 3px' }}>{review.title}</h4>}
                          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.58)', lineHeight: 1.65, margin: 0 }}>{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ════ RELATED PRODUCTS ════ */}
        {related.length > 0 && (
          <section style={{ marginTop: 36, paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 3, height: 20, borderRadius: 2, background: GOLD, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 8, letterSpacing: '0.25em', textTransform: 'uppercase', color: GOLD, margin: '0 0 2px', fontFamily: 'Jost,sans-serif' }}>You may also like</p>
                  <h2 style={{ fontSize: 'clamp(0.9rem,2.4vw,1.25rem)', fontWeight: 300, color: '#fff', margin: 0 }}>More from {product.category}</h2>
                </div>
              </div>
              <Link to={`/shop/${product.category?.toLowerCase()}`} style={{ fontSize: 10, color: GOLD, textDecoration: 'none', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: 3 }}>
                View All <FiChevronRight size={11} />
              </Link>
            </div>

            <div
              className="pdp-related-grid"
              style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, 1fr)' }}
            >
              <style>{`
                @media (min-width: 640px) {
                  .pdp-related-grid { grid-template-columns: repeat(4, 1fr) !important; gap: 16px !important; }
                }
              `}</style>

              {related.map((p, i) => (
                <motion.div key={p._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07, duration: 0.3 }}>
                  <Link
                    to={`/product/${p._id}`}
                    className="pdp-rel-card"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="pdp-rel-inner">
                      <div className="pdp-rel-img">
                        <img
                          src={p.images?.[0]?.url || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400'}
                          alt={p.name}
                          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400'; }}
                        />
                        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 3, pointerEvents: 'none' }}>
                          {p.isNewArrival && (
                            <span style={{ background: GOLD, color: '#000', fontSize: 8, fontWeight: 800, padding: '2px 7px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>NEW</span>
                          )}
                          {p.isBestSeller && (
                            <span style={{ background: '#111', color: '#fff', fontSize: 8, fontWeight: 700, padding: '2px 7px', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.2)' }}>BEST SELLER</span>
                          )}
                          {p.discountPrice != null && p.discountPrice > 0 && (
                            <span style={{ background: '#ef4444', color: '#fff', fontSize: 8, fontWeight: 700, padding: '2px 7px' }}>
                              -{Math.round(((p.price - p.discountPrice) / p.price) * 100)}%
                            </span>
                          )}
                        </div>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%', background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)', zIndex: 2, pointerEvents: 'none' }} />
                      </div>
                      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)' }} />
                      <div className="pdp-rel-info">
                        <p style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 3 }}>
                          {p.brand || 'Trendorra'}
                        </p>
                        <h3 style={{ fontSize: 12, fontWeight: 500, color: '#fff', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: '0 0 5px' }}>
                          {p.name}
                        </h3>
                        {p.numReviews > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
                            <Stars rating={p.ratings} size={10} />
                            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>({p.numReviews})</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                            ₹{(p.discountPrice != null && p.discountPrice > 0 ? p.discountPrice : p.price)?.toLocaleString()}
                          </span>
                          {p.discountPrice != null && p.discountPrice > 0 && (
                            <span style={{ fontSize: 11, textDecoration: 'line-through', color: 'rgba(255,255,255,0.28)' }}>
                              ₹{p.price?.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {p.discountPrice != null && p.discountPrice > 0 && (
                          <div style={{ marginTop: 6 }}>
                            <span style={{
                              display: 'inline-block',
                              background: '#22c55e',
                              color: '#fff',
                              fontSize: 10,
                              fontWeight: 800,
                              letterSpacing: '0.06em',
                              padding: '2px 8px',
                              borderRadius: 4,
                            }}>
                              {Math.round(((p.price - p.discountPrice) / p.price) * 100)}% OFF
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ════ SIZE GUIDE MODAL ════ */}
      <AnimatePresence>
        {sizeGuideOpen && (
          <SizeGuideModal
            sizes={product.sizes}
            sizeGuide={product.sizeGuide}
            onClose={() => setSizeGuideOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ════ ZOOM LIGHTBOX ════ */}
      <AnimatePresence>
        {imgZoomed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setImgZoomed(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(8px)', cursor: 'zoom-out' }}>
            <motion.img initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} transition={{ duration: 0.22 }}
              src={images[activeMedia.type === 'image' ? activeMedia.index : 0]?.url} alt={product.name}
              style={{ maxWidth: '92vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 10, boxShadow: '0 0 60px rgba(201,168,76,0.14)' }}
              onClick={e => e.stopPropagation()} />
            <button onClick={() => setImgZoomed(false)}
              style={{ position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}