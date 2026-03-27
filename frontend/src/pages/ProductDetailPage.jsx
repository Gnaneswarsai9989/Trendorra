import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { productAPI, reviewAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiHeart, FiShare2, FiStar, FiCheck, FiTruck, FiRefreshCw, FiShield, FiAlertCircle, FiXCircle, FiPlay, FiPause } from 'react-icons/fi';

// ── Custom Video Player (play/pause only, Flipkart style) ─────────────────────
function VideoPlayer({ src, style, className }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [showControl, setShowControl] = useState(true);
  const hideTimer = useRef(null);

  const togglePlay = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setShowControl(false), 1500);
    } else {
      v.pause();
      setPlaying(false);
      setShowControl(true);
      clearTimeout(hideTimer.current);
    }
  };

  const handleTap = () => {
    setShowControl(true);
    clearTimeout(hideTimer.current);
    if (playing) {
      hideTimer.current = setTimeout(() => setShowControl(false), 1500);
    }
  };

  useEffect(() => {
    return () => clearTimeout(hideTimer.current);
  }, []);

  return (
    <div onClick={handleTap} style={{ position: 'relative', ...style }} className={className}>
      <video
        ref={videoRef}
        src={src}
        playsInline
        loop
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 'inherit' }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      {/* Center play/pause button */}
      <div
        onClick={togglePlay}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'inherit',
          opacity: showControl ? 1 : 0,
          transition: 'opacity 0.3s ease',
          background: playing && !showControl ? 'transparent' : 'rgba(0,0,0,0.18)',
          cursor: 'pointer',
        }}
      >
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(8px)',
          border: '2px solid rgba(201,168,76,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {playing
            ? <FiPause size={22} color="#C9A84C" />
            : <FiPlay size={22} color="#C9A84C" style={{ marginLeft: '3px' }} />
          }
        </div>
      </div>
      {/* VIDEO badge */}
      <div style={{
        position: 'absolute', top: '12px', left: '12px',
        display: 'flex', alignItems: 'center', gap: '5px',
        padding: '4px 10px', borderRadius: '20px',
        backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
        border: '1px solid rgba(201,168,76,0.25)', pointerEvents: 'none',
      }}>
        <FiPlay size={9} color="#C9A84C" />
        <span style={{ color: '#C9A84C', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em' }}>VIDEO</span>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeMedia, setActiveMedia] = useState({ type: 'image', index: 0 });

  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    Promise.all([productAPI.getById(id), reviewAPI.getByProduct(id)])
      .then(([pRes, rRes]) => {
        setProduct(pRes.product);
        setReviews(rRes.reviews || []);
        if (pRes.product.colors?.[0]) setSelectedColor(pRes.product.colors[0].name);
        if (pRes.product.sizes?.[0]) setSelectedSize(pRes.product.sizes[0]);
        if (pRes.product?.category) {
          productAPI.getAll({ category: pRes.product.category, limit: 5 })
            .then(r => setRelatedProducts((r.products || []).filter(p => p._id !== id).slice(0, 4)));
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (product.sizes?.length && !selectedSize) { toast.error('Please select a size'); return; }
    await addToCart(product._id, selectedSize, selectedColor, quantity);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) { toast.error('Please login to submit a review'); return; }
    setSubmittingReview(true);
    try {
      const res = await reviewAPI.create({ productId: id, ...reviewForm });
      setReviews(prev => [res.review, ...prev]);
      setReviewForm({ rating: 5, title: '', comment: '' });
      toast.success('Review submitted!');
    } catch (err) {
      toast.error(err.message || 'Failed to submit review');
    } finally { setSubmittingReview(false); }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const priceText = `₹${(product.discountPrice || product.price).toLocaleString()}`;
    // Using bolding (*) and emojis for a neat, premium look in WhatsApp/Telegram
    const shareText = `🛍️ *${product.name}*\n💰 *Price: ${priceText}*\n\nCheck out this product on *Trendorra*:\n🔗 ${url}`;

    try {
      if (navigator.share) {
        const shareData = {
          title: product.name,
          text: shareText,
          url: url,
        };

        // Attempt to share the image file if supported
        if (product.images?.[0]?.url && navigator.canShare) {
          try {
            const resp = await fetch(product.images[0].url);
            const blob = await resp.blob();
            const file = new File([blob], 'product.jpg', { type: 'image/jpeg' });
            if (navigator.canShare({ files: [file] })) {
              shareData.files = [file];
            }
          } catch (e) {
            console.error('Image fetch error:', e);
          }
        }

        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${url}`);
        toast.success('Details & link copied!');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        toast.error('Sharing failed');
      }
    }
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-12" style={{ backgroundColor: "#111111", minHeight: "100vh" }}>
      <div className="skeleton aspect-[3/4]" />
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-8 rounded" style={{ width: `${80 - i * 10}%` }} />)}
      </div>
    </div>
  );

  if (!product) return (
    <div className="text-center py-24">
      <h2 className="font-display text-3xl">Product not found</h2>
      <Link to="/shop" className="btn-gold mt-6 inline-block">Back to Shop</Link>
    </div>
  );

  const images = product.images?.length > 0 ? product.images : [{ url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600' }];
  const videos = product.videos || [];
  const allMedia = [
    ...images.map((img, i) => ({ type: 'image', index: i, url: img.url })),
    ...videos.map((vid, i) => ({ type: 'video', index: i, url: vid.url })),
  ];
  const activeMobileIdx = allMedia.findIndex(x => x.type === activeMedia.type && x.index === activeMedia.index);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12" style={{ backgroundColor: "#111111", minHeight: "100vh" }}>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-body text-white/40 mb-10">
        <Link to="/" className="hover:text-gold">Home</Link> /
        <Link to="/shop" className="hover:text-gold">Shop</Link> /
        <Link to={`/shop/${product.category.toLowerCase()}`} className="hover:text-gold">{product.category}</Link> /
        <span className="text-white">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mb-12 sm:mb-20">
        {/* ── GALLERY ── */}
        <div>
          {/* MOBILE slider */}
          <div className="lg:hidden relative">
            <div
              id="img-slider"
              className="flex overflow-x-auto"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
              onScroll={(e) => {
                const idx = Math.round(e.target.scrollLeft / e.target.offsetWidth);
                const m = allMedia[idx];
                if (m) setActiveMedia({ type: m.type, index: m.index });
              }}
            >
              {allMedia.map((media, i) => (
                <div key={i} className="flex-shrink-0 w-full relative overflow-hidden"
                  style={{ scrollSnapAlign: 'start', aspectRatio: '1/1', backgroundColor: '#1a1a1a', borderRadius: '16px' }}>
                  {media.type === 'image'
                    ? <img src={media.url} alt={product.name} className="w-full h-full object-cover" style={{ borderRadius: '16px' }} />
                    : <VideoPlayer src={media.url} style={{ width: '100%', height: '100%', borderRadius: '16px' }} />
                  }
                </div>
              ))}
            </div>
            {allMedia.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-3">
                {allMedia.map((m, i) => (
                  <button key={i}
                    onClick={() => {
                      const el = document.getElementById('img-slider');
                      if (el) el.scrollTo({ left: i * el.offsetWidth, behavior: 'smooth' });
                      setActiveMedia({ type: m.type, index: m.index });
                    }}
                    style={{
                      width: i === activeMobileIdx ? '20px' : '6px', height: '6px', borderRadius: '3px',
                      backgroundColor: i === activeMobileIdx ? '#C9A84C' : 'rgba(255,255,255,0.25)',
                      border: 'none', transition: 'all 0.3s',
                    }} />
                ))}
              </div>
            )}
            {allMedia.length > 1 && (
              <div className="absolute top-3 right-3 px-2 py-1 rounded font-body text-xs text-white" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                {activeMobileIdx + 1}/{allMedia.length}
              </div>
            )}
            {product.isNewArrival && <span className="absolute top-3 left-3 badge-gold">New Arrival</span>}
          </div>

          {/* DESKTOP thumbnails + main */}
          <div className="hidden lg:flex gap-4">
            {allMedia.length > 1 && (
              <div className="flex flex-col gap-3 w-20" style={{ maxHeight: '560px', overflowY: 'auto', scrollbarWidth: 'none' }}>
                {allMedia.map((media, i) => {
                  const isActive = activeMedia.type === media.type && activeMedia.index === media.index;
                  return (
                    <button key={i} onClick={() => setActiveMedia({ type: media.type, index: media.index })}
                      className="relative flex-shrink-0 overflow-hidden transition-all"
                      style={{ border: `2px solid ${isActive ? '#C9A84C' : 'rgba(255,255,255,0.1)'}`, borderRadius: '10px', aspectRatio: '3/4', backgroundColor: '#1a1a1a' }}>
                      {media.type === 'image'
                        ? <img src={media.url} alt="" className="w-full h-full object-cover" style={{ borderRadius: '8px' }} />
                        : <>
                          <video src={media.url} className="w-full h-full object-cover" style={{ borderRadius: '8px' }} muted />
                          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: '8px' }}>
                            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(201,168,76,0.9)' }}>
                              <FiPlay size={11} color="#fff" style={{ marginLeft: '1px' }} />
                            </div>
                          </div>
                        </>
                      }
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex-1 relative overflow-hidden" style={{ aspectRatio: '3/4', backgroundColor: '#1a1a1a', borderRadius: '18px' }}>
              {activeMedia.type === 'image' ? (
                <motion.img key={`img-${activeMedia.index}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  src={images[activeMedia.index]?.url} alt={product.name}
                  className="w-full h-full object-cover" style={{ borderRadius: '18px' }} />
              ) : (
                <motion.div key={`vid-${activeMedia.index}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%', height: '100%' }}>
                  <VideoPlayer src={videos[activeMedia.index]?.url} style={{ width: '100%', height: '100%', borderRadius: '18px' }} />
                </motion.div>
              )}
              {product.isNewArrival && activeMedia.type === 'image' && <span className="absolute top-4 left-4 badge-gold">New Arrival</span>}
            </div>
          </div>
        </div>

        {/* ── PRODUCT INFO ── */}
        <div>
          <p className="font-body text-xs tracking-[0.2em] uppercase mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{product.brand}</p>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-light mb-3 text-white">{product.name}</h1>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(s => (
                <FiStar key={s} size={16} style={{ color: s <= Math.round(product.ratings) ? '#C9A84C' : 'rgba(255,255,255,0.15)' }} />
              ))}
            </div>
            <span className="text-sm font-body text-white/50">({product.numReviews} reviews)</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap mb-8 pb-8" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <span className="font-display text-2xl sm:text-3xl font-light" style={{ color: "#C9A84C" }}>
              ₹{(product.discountPrice || product.price)?.toLocaleString()}
            </span>
            {product.discountPrice && (
              <>
                <span className="font-body text-base line-through" style={{ color: "rgba(255,255,255,0.35)" }}>₹{product.price?.toLocaleString()}</span>
                <span className="text-white text-[11px] font-body font-medium tracking-wider uppercase px-2 py-0.5" style={{ backgroundColor: "#C9A84C" }}>
                  {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
                </span>
              </>
            )}
          </div>
          {product.colors?.length > 0 && (
            <div className="mb-6">
              <p className="font-body text-xs tracking-[0.15em] uppercase mb-3">Color: <span className="text-gold">{selectedColor}</span></p>
              <div className="flex gap-3">
                {product.colors.map(c => (
                  <button key={c.name} onClick={() => setSelectedColor(c.name)} title={c.name} className="w-7 h-7 rounded-full transition-all"
                    style={{ border: selectedColor === c.name ? '2px solid #C9A84C' : '2px solid transparent', transform: selectedColor === c.name ? 'scale(1.15)' : 'scale(1)', backgroundColor: c.hex || '#000' }} />
                ))}
              </div>
            </div>
          )}
          {product.sizes?.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <p className="font-body text-xs tracking-[0.15em] uppercase">Size</p>
                <button className="text-xs text-gold font-body underline">Size Guide</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(size => (
                  <button key={size} onClick={() => setSelectedSize(size)} className="min-w-[40px] h-10 px-3 text-xs font-body border transition-all"
                    style={{ backgroundColor: selectedSize === size ? '#C9A84C' : 'transparent', borderColor: selectedSize === size ? '#C9A84C' : 'rgba(255,255,255,0.12)', color: selectedSize === size ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center text-base text-white hover:text-gold transition-colors">−</button>
              <span className="w-10 text-center font-body text-sm text-white">{quantity}</span>
              <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} className="w-10 h-10 flex items-center justify-center text-base text-white hover:text-gold transition-colors">+</button>
            </div>
            <span className="text-xs text-white/40 font-body">{product.stock} in stock</span>
          </div>
          <div className="flex gap-3 mb-8">
            <button onClick={handleAddToCart} className="flex-1 py-3 sm:py-4 text-sm font-body tracking-[0.15em] uppercase text-white transition-colors" style={{ backgroundColor: "#C9A84C" }}>
              Add to Cart
            </button>
            <button onClick={() => toggleWishlist(product._id)} className="w-12 h-12 flex items-center justify-center transition-all"
              style={{ border: `1px solid ${isWishlisted(product._id) ? '#C9A84C' : 'rgba(255,255,255,0.12)'}`, backgroundColor: isWishlisted(product._id) ? '#C9A84C' : 'transparent', color: isWishlisted(product._id) ? '#fff' : 'rgba(255,255,255,0.6)' }}>
              <FiHeart size={17} fill={isWishlisted(product._id) ? 'currentColor' : 'none'} />
            </button>
            <button onClick={handleShare} className="w-12 h-12 flex items-center justify-center transition-all" style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}>
              <FiShare2 size={17} />
            </button>
          </div>
          {(() => {
            const noReturns = product.createdBy?.sellerInfo?.noReturnsEnabled;
            const perks = [
              { icon: FiTruck, text: 'Free shipping on orders above ₹999' },
              noReturns ? { icon: FiXCircle, text: 'Non-returnable', red: true } : { icon: FiRefreshCw, text: 'Easy 7-day returns & exchanges' },
              { icon: FiShield, text: '100% authentic products guaranteed' },
              { icon: FiCheck, text: 'Cash on delivery available' },
            ];
            return (
              <div className="border-t border-white/10 pt-6">
                <div className="space-y-3">
                  {perks.map(({ icon: Icon, text, red }) => (
                    <div key={text} className="flex items-center gap-3 text-sm font-body" style={{ color: red ? '#f87171' : 'rgba(255,255,255,0.5)' }}>
                      <Icon size={15} style={{ color: red ? '#f87171' : '#C9A84C', flexShrink: 0 }} /> {text}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '16px', borderRadius: '10px', border: noReturns ? '1px solid rgba(248,113,113,0.3)' : '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ backgroundColor: noReturns ? 'rgba(248,113,113,0.1)' : 'rgba(74,222,128,0.07)', borderBottom: noReturns ? '1px solid rgba(248,113,113,0.2)' : '1px solid rgba(255,255,255,0.06)', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {noReturns ? <FiXCircle size={13} style={{ color: '#f87171', flexShrink: 0 }} /> : <FiRefreshCw size={13} style={{ color: '#4ade80', flexShrink: 0 }} />}
                    <span style={{ color: noReturns ? '#f87171' : '#4ade80', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {noReturns ? 'Non-Returnable Item' : 'Return Policy'}
                    </span>
                  </div>
                  <div style={{ padding: '14px', backgroundColor: '#0d0d0d' }}>
                    {noReturns ? (
                      <>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <FiAlertCircle size={16} style={{ color: '#fbbf24', flexShrink: 0, marginTop: '1px' }} />
                          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', lineHeight: '1.7', margin: 0 }}>
                            <strong style={{ color: '#fff' }}>This item is non-returnable.</strong> Please read product details carefully before purchasing.
                          </p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                          {[{ label: 'Return Window', value: 'Not applicable', red: true }, { label: 'Replacement', value: 'Not available', red: true }, { label: 'Reason', value: 'Seller policy' }, { label: 'Warranty', value: 'Check description' }].map(({ label, value, red }) => (
                            <div key={label} style={{ backgroundColor: '#161616', borderRadius: '6px', padding: '8px 10px' }}>
                              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 2px' }}>{label}</p>
                              <p style={{ color: red ? '#f87171' : 'rgba(255,255,255,0.65)', fontSize: '12px', fontWeight: '500', margin: 0 }}>{value}</p>
                            </div>
                          ))}
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', marginTop: '10px', lineHeight: '1.5' }}>⚠️ In case of a defective or wrong item, please contact support within 48 hours of delivery.</p>
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <FiRefreshCw size={14} style={{ color: '#4ade80', flexShrink: 0, marginTop: '2px' }} />
                          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', lineHeight: '1.7', margin: 0 }}>
                            <strong style={{ color: '#fff' }}>7-day hassle-free returns & replacements.</strong> Item must be unused and in original packaging.
                          </p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          {[{ label: 'Return Window', value: '7 days', green: true }, { label: 'Refund', value: 'Original mode' }, { label: 'Condition', value: 'Unused & intact' }, { label: 'Process', value: 'Pickup arranged' }].map(({ label, value, green }) => (
                            <div key={label} style={{ backgroundColor: '#161616', borderRadius: '6px', padding: '8px 10px' }}>
                              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 2px' }}>{label}</p>
                              <p style={{ color: green ? '#4ade80' : 'rgba(255,255,255,0.65)', fontSize: '12px', fontWeight: '500', margin: 0 }}>{value}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="border-t border-white/10">
        <div className="flex gap-8 border-b border-white/10">
          {['description', 'reviews', 'care'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`py-4 text-sm font-body tracking-[0.1em] uppercase transition-all relative ${activeTab === tab ? 'text-white' : 'text-white/40 hover:text-white'}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {activeTab === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />}
            </button>
          ))}
        </div>
        <div className="py-10">
          {activeTab === 'description' && (
            <div className="max-w-2xl">
              <p className="font-body text-white/60 leading-relaxed mb-6">{product.description}</p>
              {product.material && <p className="font-body text-sm text-white/50"><strong>Material:</strong> {product.material}</p>}
            </div>
          )}
          {activeTab === 'care' && (
            <div className="max-w-2xl">
              <p className="font-body text-white/60 leading-relaxed">
                {product.careInstructions || 'Machine wash cold with similar colors. Do not bleach. Tumble dry low. Cool iron if needed. Do not dry clean.'}
              </p>
            </div>
          )}
          {activeTab === 'reviews' && (
            <div className="max-w-3xl" id="reviews">
              {reviews.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-8 p-6 mb-8 rounded-xl" style={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="text-center flex-shrink-0">
                    <p className="font-display text-6xl font-light" style={{ color: '#C9A84C' }}>{product.ratings?.toFixed(1) || '0.0'}</p>
                    <div className="flex justify-center gap-0.5 my-2">
                      {[1, 2, 3, 4, 5].map(s => <span key={s} style={{ color: s <= Math.round(product.ratings) ? '#C9A84C' : 'rgba(255,255,255,0.12)', fontSize: '16px' }}>★</span>)}
                    </div>
                    <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{product.numReviews} reviews</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = reviews.filter(r => Math.round(r.rating) === star).length;
                      const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
                      return (
                        <div key={star} className="flex items-center gap-3">
                          <span className="font-body text-xs w-3 text-right" style={{ color: 'rgba(255,255,255,0.5)' }}>{star}</span>
                          <span style={{ color: '#C9A84C', fontSize: '12px' }}>★</span>
                          <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: '#C9A84C' }} />
                          </div>
                          <span className="font-body text-xs w-8" style={{ color: 'rgba(255,255,255,0.35)' }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {isLoggedIn ? (
                <div className="p-6 mb-8 rounded-xl" style={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <h3 className="font-display text-xl font-light text-white mb-5">Write a Review</h3>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="block font-body text-[10px] tracking-[0.15em] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>Your Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button key={s} type="button" onClick={() => setReviewForm(p => ({ ...p, rating: s }))}
                            className="transition-transform hover:scale-110 text-2xl" style={{ color: s <= reviewForm.rating ? '#C9A84C' : 'rgba(255,255,255,0.15)' }}>★</button>
                        ))}
                        <span className="font-body text-sm ml-2 self-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          {['', 'Terrible', 'Poor', 'Average', 'Good', 'Excellent'][reviewForm.rating]}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block font-body text-[10px] tracking-[0.15em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Review Title</label>
                      <input required placeholder="e.g. Great quality, fits perfectly!" value={reviewForm.title}
                        onChange={e => setReviewForm(p => ({ ...p, title: e.target.value }))}
                        className="w-full px-4 py-3 font-body text-sm text-white focus:outline-none transition-colors"
                        style={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        onFocus={e => e.target.style.borderColor = '#C9A84C'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                    </div>
                    <div>
                      <label className="block font-body text-[10px] tracking-[0.15em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Your Review</label>
                      <textarea required rows={4} placeholder="Tell others what you think about this product..."
                        value={reviewForm.comment} onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                        className="w-full px-4 py-3 font-body text-sm text-white focus:outline-none resize-none transition-colors"
                        style={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        onFocus={e => e.target.style.borderColor = '#C9A84C'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                    </div>
                    <button type="submit" disabled={submittingReview}
                      className="px-8 py-3 font-body text-sm tracking-[0.15em] uppercase text-white transition-colors"
                      style={{ backgroundColor: submittingReview ? 'rgba(201,168,76,0.5)' : '#C9A84C', borderRadius: '8px' }}>
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-5 mb-8 text-center rounded-xl" style={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="font-body text-sm mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Login to write a review</p>
                  <Link to="/login" className="inline-block px-6 py-2.5 font-body text-sm tracking-wider uppercase text-white" style={{ backgroundColor: '#C9A84C', borderRadius: '6px' }}>Login to Review</Link>
                </div>
              )}
              {reviews.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">⭐</p>
                  <p className="font-display text-xl font-light text-white mb-2">No reviews yet</p>
                  <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Be the first to share your experience!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="font-body text-[10px] tracking-[0.2em] uppercase mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {reviews.length} Customer Review{reviews.length !== 1 ? 's' : ''}
                  </p>
                  {reviews.map(review => (
                    <div key={review._id} className="p-5 rounded-xl" style={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium text-white flex-shrink-0" style={{ backgroundColor: '#C9A84C' }}>
                            {review.user?.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-body font-medium text-sm text-white">{review.user?.name}</span>
                              {review.isVerifiedPurchase && (
                                <span className="text-[9px] font-body px-1.5 py-0.5 font-medium" style={{ backgroundColor: 'rgba(74,222,128,0.12)', color: '#4ade80', borderRadius: '3px' }}>✓ Verified</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map(s => <span key={s} className="text-xs" style={{ color: s <= review.rating ? '#C9A84C' : 'rgba(255,255,255,0.12)' }}>★</span>)}
                              </div>
                              <span className="font-body text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {review.title && <h4 className="font-body font-semibold text-sm text-white mb-1.5">{review.title}</h4>}
                      <p className="font-body text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── RELATED PRODUCTS ── */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 pb-12">
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '3rem' }}>
            <p className="section-subtitle">You may also like</p>
            <h2 className="font-display text-2xl sm:text-3xl font-light text-white mb-8">More from {product?.category}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((p) => (
                <Link key={p._id} to={`/product/${p._id}`} className="group block" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  <div className="relative overflow-hidden aspect-[3/4] mb-3" style={{ backgroundColor: '#1a1a1a' }}>
                    <img src={p.images?.[0]?.url} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    {p.isNewArrival && <span className="absolute top-2 left-2 text-white text-[10px] font-body font-medium tracking-wider uppercase px-2 py-0.5" style={{ backgroundColor: '#C9A84C' }}>New</span>}
                    {p.discountPrice && <span className="absolute top-2 right-2 text-white text-[10px] font-body font-medium px-2 py-0.5" style={{ backgroundColor: '#ef4444' }}>-{Math.round(((p.price - p.discountPrice) / p.price) * 100)}%</span>}
                  </div>
                  <p className="font-body text-[10px] tracking-[0.15em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{p.brand}</p>
                  <h3 className="font-body text-sm font-medium text-white group-hover:text-gold transition-colors line-clamp-2 mb-1">{p.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="font-body text-sm font-medium" style={{ color: '#C9A84C' }}>₹{(p.discountPrice || p.price)?.toLocaleString()}</span>
                    {p.discountPrice && <span className="font-body text-xs line-through" style={{ color: 'rgba(255,255,255,0.3)' }}>₹{p.price?.toLocaleString()}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}