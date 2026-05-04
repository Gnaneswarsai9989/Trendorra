import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { productAPI } from '../services/api';
import ProductCard from '../components/product/ProductCard';
import { FiArrowRight } from 'react-icons/fi';
import womenTraditional from '../assets/images/women_traditional.png';
import womenStylish from '../assets/images/women_stylish.png';

const heroSlides = [
  {
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1600&q=90',
    tag: 'New Collection', title: 'Autumn\nWinter\n2026',
    subtitle: 'Redefine your wardrobe with timeless pieces crafted for the modern individual.',
    cta: 'Explore Collection', link: '/shop',
  },
  {
    image: womenStylish, tag: 'Trendorra Fusion', title: 'Modern\nTraditional\nFusion',
    subtitle: 'Where heritage meets contemporary style. Discover the art of modern ethnic wear.',
    cta: 'Shop Fusion', link: '/shop/women',
  },
  {
    image: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?w=1600&q=90',
    tag: 'Trending Now', title: 'Street\nHeritage\nSharp.',
    subtitle: 'High-end tailoring reimagined for the bold, style-conscious generation.',
    cta: 'Shop Trends', link: '/shop/men',
  },
];

const categories = [
  { name: 'Men', image: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=600&q=80', link: '/shop/men' },
  { name: 'Women', image: womenTraditional, link: '/shop/women' },
  { name: 'Streetwear', image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600&q=80', link: '/shop/streetwear' },
  { name: 'Accessories', image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80', link: '/shop/accessories' },
];

/* ─── One-time style injection ─────────────────────────────────── */
const injectHomeStyles = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById('home-styles-v2')) return;
  const s = document.createElement('style');
  s.id = 'home-styles-v2';
  s.textContent = `
    /* ── Product grids ── */
    .product-grid-home {
      display: grid;
      gap: 10px;
      grid-template-columns: repeat(2, 1fr);
    }
    @media (min-width: 640px) {
      .product-grid-home { gap: 12px; }
    }
    @media (min-width: 768px) {
      .product-grid-home { gap: 16px; grid-template-columns: repeat(4, 1fr); }
    }
    @media (min-width: 1024px) {
      .product-grid-home { gap: 18px; }
    }

    /* ── Category grid ──
       Mobile:  2 cols, aspect 3/4
       Desktop: 4 cols, FIXED height — no more giant images */
    .cat-grid {
      display: grid;
      gap: 10px;
      grid-template-columns: repeat(2, 1fr);
    }
    @media (min-width: 768px) {
      .cat-grid { gap: 14px; grid-template-columns: repeat(4, 1fr); }
    }

    .cat-card {
      position: relative;
      overflow: hidden;
      border-radius: 12px;
      display: block;
      /* Mobile: portrait */
      padding-top: 130%;
      text-decoration: none;
    }
    /* Desktop: fixed shorter height so they don't tower */
    @media (min-width: 768px) {
      .cat-card { padding-top: 0; height: 300px; }
    }
    @media (min-width: 1024px) {
      .cat-card { height: 340px; }
    }

    .cat-card img {
      position: absolute;
      inset: 0; width: 100%; height: 100%;
      object-fit: cover; object-position: center top;
      transition: transform 0.7s ease;
    }
    .cat-card:hover img { transform: scale(1.06); }

    .cat-card-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 55%, transparent 100%);
    }
    .cat-card-text {
      position: absolute; bottom: 0; left: 0;
      padding: 14px 16px;
    }
    @media (min-width: 768px) {
      .cat-card-text { padding: 18px 20px; }
    }

    /* ── Skeleton ── */
    .home-skel-card {
      border-radius: 16px; overflow: hidden;
      background: rgba(22,16,10,0.80);
      border: 1px solid rgba(255,255,255,0.07);
    }
    .home-skel-img {
      width: 100%; padding-top: 118%;
      background: rgba(30,22,12,0.55);
      animation: homeSk 1.4s ease-in-out infinite;
    }
    @media (min-width: 1024px) {
      .home-skel-img { padding-top: 100%; }
    }
    .home-skel-line {
      height: 10px; border-radius: 6px;
      animation: homeSk 1.4s ease-in-out infinite;
    }
    @keyframes homeSk { 0%,100%{opacity:0.45} 50%{opacity:0.9} }
  `;
  document.head.appendChild(s);
};

/* ─── Sub-components ────────────────────────────────────────────── */
function SectionHeader({ sup, title, link, linkLabel = 'View All' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '3px', height: '26px', borderRadius: '2px', backgroundColor: '#C9A84C', flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#C9A84C', margin: '0 0 2px', fontFamily: 'Jost,sans-serif' }}>{sup}</p>
          <h2 className="font-display font-light text-white" style={{ fontSize: 'clamp(1.1rem,3.2vw,1.65rem)', margin: 0, lineHeight: 1.1 }}>{title}</h2>
        </div>
      </div>
      <Link to={link} style={{ color: '#C9A84C', textDecoration: 'none', fontSize: '11px', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '5px', opacity: 0.82 }}
        className="hover:opacity-100 transition-opacity">
        {linkLabel} <FiArrowRight size={12} />
      </Link>
    </div>
  );
}

function SkeletonGrid({ count = 4 }) {
  return (
    <div className="product-grid-home">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="home-skel-card">
          <div className="home-skel-img" />
          <div style={{ padding: '9px 11px 12px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
            <div className="home-skel-line" style={{ width: '55%', background: 'rgba(30,22,12,0.7)' }} />
            <div className="home-skel-line" style={{ width: '80%', background: 'rgba(30,22,12,0.5)' }} />
            <div className="home-skel-line" style={{ width: '38%', background: 'rgba(30,22,12,0.38)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Main ──────────────────────────────────────────────────────── */
export default function HomePage() {
  injectHomeStyles();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setCurrentSlide(s => (s + 1) % heroSlides.length), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    productAPI.getFeatured()
      .then(res => { setNewArrivals(res.newArrivals || []); setBestSellers(res.bestSellers || []); })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const slide = heroSlides[currentSlide];

  return (
    <div style={{ backgroundColor: '#0d0d0d', overflow: 'hidden' }}>

      {/* ── Hero ── */}
      <section style={{ padding: '14px 14px 0', backgroundColor: '#0d0d0d' }} className="sm:px-6 md:px-8">
        <div className="relative overflow-hidden"
          style={{ borderRadius: '18px', height: 'clamp(240px, 50vw, 580px)', maxHeight: '580px' }}>
          {heroSlides.map((s, i) => (
            <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${i === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
              <img src={s.image} alt={s.title} className="w-full h-full object-cover object-top" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(110deg,rgba(0,0,0,0.76) 0%,rgba(0,0,0,0.34) 55%,rgba(0,0,0,0.04) 100%)' }} />
            </div>
          ))}
          <div className="absolute inset-0 flex items-end pb-7 sm:items-center sm:pb-0">
            <div className="px-5 sm:px-10 w-full max-w-lg">
              <motion.div key={currentSlide} initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: 'easeOut' }}>
                <div className="inline-flex items-center gap-2 mb-3"
                  style={{ backgroundColor: 'rgba(201,168,76,0.18)', border: '1px solid rgba(201,168,76,0.38)', borderRadius: '20px', padding: '4px 12px' }}>
                  <span style={{ color: '#C9A84C', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'Jost,sans-serif' }}>{slide.tag}</span>
                </div>
                <h1 className="font-display font-light text-white leading-none whitespace-pre-line"
                  style={{ fontSize: 'clamp(24px, 6.5vw, 68px)', marginBottom: '10px', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
                  {slide.title}
                </h1>
                <p className="font-body text-sm leading-relaxed hidden sm:block"
                  style={{ color: 'rgba(255,255,255,0.68)', marginBottom: '22px', maxWidth: '320px' }}>
                  {slide.subtitle}
                </p>
                <Link to={slide.link}
                  className="inline-flex items-center gap-2 font-body text-xs sm:text-sm tracking-[0.14em] uppercase text-white"
                  style={{ backgroundColor: '#C9A84C', padding: '9px 18px', borderRadius: '7px', textDecoration: 'none' }}>
                  {slide.cta} <FiArrowRight size={13} />
                </Link>
              </motion.div>
            </div>
          </div>
          {/* Indicators */}
          <div className="absolute bottom-3 right-4 flex gap-1.5">
            {heroSlides.map((_, i) => (
              <button key={i} onClick={() => setCurrentSlide(i)} style={{ width: i === currentSlide ? '22px' : '7px', height: '3.5px', borderRadius: '2px', backgroundColor: i === currentSlide ? '#C9A84C' : 'rgba(255,255,255,0.38)', border: 'none', cursor: 'pointer', transition: 'all 0.3s' }} />
            ))}
          </div>
          <div className="absolute top-3 right-4 font-body text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {currentSlide + 1}/{heroSlides.length}
          </div>
        </div>
      </section>

      {/* ── Marquee ── */}
      <div className="py-2.5 overflow-hidden" style={{ backgroundColor: '#C9A84C', marginTop: '14px' }}>
        <div className="marquee-track flex whitespace-nowrap">
          {['New Arrivals', 'Premium Quality', 'Free Shipping Above ₹999', 'Exclusive Designs',
            'New Arrivals', 'Premium Quality', 'Free Shipping Above ₹999', 'Exclusive Designs'].map((t, i) => (
              <span key={i} className="font-body text-xs tracking-[0.24em] uppercase text-white mx-6 flex-shrink-0">{t} &nbsp;•</span>
            ))}
        </div>
      </div>

      {/* ── Categories — FIXED desktop height ── */}
      <section style={{ backgroundColor: '#111111' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 16px' }} className="sm:px-6">
          <SectionHeader sup="Collections" title="Shop by Category" link="/shop" linkLabel="All" />
          <div className="cat-grid">
            {categories.map((cat, i) => (
              <motion.div key={cat.name}
                initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.4 }}>
                <Link to={cat.link} className="cat-card group">
                  <img src={cat.image} alt={cat.name} loading="lazy" />
                  <div className="cat-card-overlay" />
                  <div className="cat-card-text">
                    <h3 className="font-display font-light text-white" style={{ fontSize: 'clamp(0.95rem,3vw,1.35rem)', marginBottom: '4px' }}>{cat.name}</h3>
                    <span className="flex items-center gap-1.5 group-hover:gap-3 transition-all font-body"
                      style={{ color: '#C9A84C', fontSize: '9.5px', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                      Shop Now <FiArrowRight size={9} />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── New Arrivals ── */}
      {(newArrivals.length > 0 || loading) && (
        <section className="py-12" style={{ backgroundColor: '#0a0a0a' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }} className="sm:px-6">
            <SectionHeader sup="Just Landed" title="New Arrivals" link="/shop?newArrival=true" />
            {loading ? <SkeletonGrid count={4} /> : (
              <div className="product-grid-home">
                {newArrivals.slice(0, 4).map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Banner ── */}
      <section className="relative overflow-hidden" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
        <img src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1600&q=90" alt="Campaign"
          className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.65)' }} />
        <div className="relative text-center text-white" style={{ maxWidth: '800px', margin: '0 auto', padding: '0 16px' }}>
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="section-subtitle text-gold">Limited Time</p>
            <h2 className="font-display font-light mb-5" style={{ fontSize: 'clamp(2rem,7vw,4.5rem)' }}>The Season Sale</h2>
            <p className="font-body text-gray-300 mb-8" style={{ fontSize: 'clamp(0.82rem,1.8vw,1rem)' }}>Up to 50% off on selected styles</p>
            <Link to="/shop?sale=true" className="btn-gold-filled inline-flex items-center gap-3">
              Shop the Sale <FiArrowRight size={15} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Best Sellers ── */}
      {(bestSellers.length > 0 || loading) && (
        <section className="py-12" style={{ backgroundColor: '#111111' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }} className="sm:px-6">
            <SectionHeader sup="Customer Favourites" title="Best Sellers" link="/shop?bestSeller=true" />
            {loading ? <SkeletonGrid count={4} /> : (
              <div className="product-grid-home">
                {bestSellers.slice(0, 4).map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Features ── */}
      <section className="py-12" style={{ backgroundColor: '#0a0a0a' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }} className="sm:px-6">
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(2,1fr)' }} className="md:grid-cols-4">
            {[
              { icon: '🚚', title: 'Free Shipping', desc: 'Orders above ₹999' },
              { icon: '↩️', title: 'Easy Returns', desc: '30-day return policy' },
              { icon: '🔒', title: 'Secure Payment', desc: '100% encrypted checkout' },
              { icon: '⭐', title: 'Premium Quality', desc: 'Curated fashion pieces' },
            ].map(f => (
              <div key={f.title} className="text-white text-center">
                <div style={{ fontSize: '26px', marginBottom: '8px' }}>{f.icon}</div>
                <h4 className="font-body font-medium text-sm tracking-[0.1em] uppercase mb-1">{f.title}</h4>
                <p className="font-body text-xs text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}