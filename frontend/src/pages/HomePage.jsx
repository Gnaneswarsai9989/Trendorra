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
    tag: 'New Collection',
    title: 'Autumn\nWinter\n2026',
    subtitle: 'Redefine your wardrobe with timeless pieces crafted for the modern individual.',
    cta: 'Explore Collection',
    link: '/shop',
  },
  {
    image: womenStylish,
    tag: "Trendorra Fusion",
    title: 'Modern\nTraditional\nFusion',
    subtitle: 'Where heritage meets contemporary style. Discover the art of modern ethnic wear.',
    cta: 'Shop Fusion',
    link: '/shop/women',
  },
  {
    image: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?w=1600&q=90',
    tag: "Trending Now",
    title: 'Street\nHeritage\nSharp.',
    subtitle: 'High-end tailoring reimagined for the bold, style-conscious generation.',
    cta: 'Shop Trends',
    link: '/shop/men',
  },
];

const categories = [
  { name: 'Men', image: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=600&q=80', link: '/shop/men', sub: 'T-Shirts, Shirts & more' },
  { name: 'Women', image: womenTraditional, link: '/shop/women', sub: 'Elegance Redefined' },
  { name: 'Streetwear', image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600&q=80', link: '/shop/streetwear', sub: 'BOLD & BEYOND' },
  { name: 'Accessories', image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80', link: '/shop/accessories', sub: 'Bags, Watches & more' },
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featured, setFeatured] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide(s => (s + 1) % heroSlides.length), 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    productAPI.getFeatured()
      .then(res => {
        setFeatured(res.featured || []);
        setNewArrivals(res.newArrivals || []);
        setBestSellers(res.bestSellers || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const slide = heroSlides[currentSlide];

  return (
    <div style={{backgroundColor:"#0d0d0d", overflow:'hidden'}}>
      {/* ── Hero — Modern Floating Card ── */}
      <section style={{ padding: '16px 16px 0', backgroundColor: '#0d0d0d' }}
        className="sm:px-6 md:px-8">

        {/* Floating card container */}
        <div className="relative overflow-hidden"
          style={{
            borderRadius: '20px',
            height: 'clamp(280px, 55vw, 640px)',
            maxHeight: '640px',
          }}>

          {/* Slides */}
          {heroSlides.map((s, i) => (
            <div key={i}
              className={`absolute inset-0 transition-opacity duration-1000 ${i === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
              <img src={s.image} alt={s.title}
                className="w-full h-full object-cover object-top" />
              <div className="absolute inset-0"
                style={{ background: 'linear-gradient(110deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.05) 100%)' }} />
            </div>
          ))}

          {/* Text content */}
          <div className="absolute inset-0 flex items-end pb-8 sm:items-center sm:pb-0">
            <div className="px-6 sm:px-10 w-full max-w-lg">
              <motion.div key={currentSlide}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}>

                {/* Tag pill */}
                <div className="inline-flex items-center gap-2 mb-3 sm:mb-4"
                  style={{ backgroundColor: 'rgba(201,168,76,0.2)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '20px', padding: '4px 12px' }}>
                  <span className="font-body text-[10px] tracking-[0.2em] uppercase" style={{ color: '#C9A84C' }}>{slide.tag}</span>
                </div>

                <h1 className="font-display font-light text-white leading-none whitespace-pre-line"
                  style={{ fontSize: 'clamp(28px, 7vw, 72px)', marginBottom: '12px', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
                  {slide.title}
                </h1>

                <p className="font-body text-sm sm:text-base leading-relaxed hidden sm:block"
                  style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '24px', maxWidth: '340px' }}>
                  {slide.subtitle}
                </p>

                <Link to={slide.link}
                  className="inline-flex items-center gap-2 font-body text-xs sm:text-sm tracking-[0.15em] uppercase text-white"
                  style={{ backgroundColor: '#C9A84C', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none' }}>
                  {slide.cta} <FiArrowRight size={14} />
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Slide indicators - bottom right */}
          <div className="absolute bottom-4 right-5 flex gap-1.5">
            {heroSlides.map((_, i) => (
              <button key={i} onClick={() => setCurrentSlide(i)}
                className="transition-all duration-300"
                style={{
                  width: i === currentSlide ? '24px' : '8px',
                  height: '4px',
                  borderRadius: '2px',
                  backgroundColor: i === currentSlide ? '#C9A84C' : 'rgba(255,255,255,0.4)',
                  border: 'none', cursor: 'pointer',
                }} />
            ))}
          </div>

          {/* Slide counter - top right */}
          <div className="absolute top-4 right-5 font-body text-xs"
            style={{ color: 'rgba(255,255,255,0.5)' }}>
            {currentSlide + 1}/{heroSlides.length}
          </div>
        </div>
      </section>

      {/* ── Marquee ── */}
      <div className="py-3 overflow-hidden" style={{backgroundColor:"#C9A84C", marginTop:'16px'}}>
        <div className="marquee-track flex whitespace-nowrap">
          {['New Arrivals', 'Premium Quality', 'Free Shipping Above ₹999', 'Exclusive Designs', 'New Arrivals', 'Premium Quality', 'Free Shipping Above ₹999', 'Exclusive Designs'].map((text, i) => (
            <span key={i} className="font-body text-xs tracking-[0.25em] uppercase text-white mx-6 flex-shrink-0">
              {text} &nbsp;•
            </span>
          ))}
        </div>
      </div>

      {/* ── Categories ── */}
      <section style={{backgroundColor:"#111111"}}>
        <div className="py-16 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-7 rounded-full" style={{backgroundColor:'#C9A84C'}} />
                <div>
                  <p style={{fontSize:'9px', letterSpacing:'0.25em', textTransform:'uppercase', color:'#C9A84C', marginBottom:'2px', fontFamily:'Jost,sans-serif'}}>Collections</p>
                  <h2 className="font-display font-light text-white" style={{fontSize:'clamp(1.3rem,4vw,1.8rem)', margin:0, lineHeight:1.1}}>Shop by Category</h2>
                </div>
              </div>
              <Link to="/shop" className="font-body text-xs tracking-wider flex items-center gap-1.5 hover:opacity-70 transition-opacity"
                style={{color:'#C9A84C', textDecoration:'none'}}>
                All <FiArrowRight size={12}/>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link to={cat.link} className="group relative overflow-hidden block aspect-[3/4]">
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6">
                    <h3 className="font-display text-2xl font-light text-white mb-1">{cat.name}</h3>
                    <span className="flex items-center gap-2 text-gold text-xs tracking-[0.2em] uppercase font-body group-hover:gap-4 transition-all">
                      Shop Now <FiArrowRight size={12} />
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
        <section className="py-16" style={{backgroundColor:"#0a0a0a"}}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-7 rounded-full" style={{backgroundColor:'#C9A84C'}} />
                <div>
                  <p style={{fontSize:'9px', letterSpacing:'0.25em', textTransform:'uppercase', color:'#C9A84C', marginBottom:'2px', fontFamily:'Jost,sans-serif'}}>Just Landed</p>
                  <h2 className="font-display font-light text-white" style={{fontSize:'clamp(1.3rem,4vw,1.8rem)', margin:0, lineHeight:1.1}}>New Arrivals</h2>
                </div>
              </div>
              <Link to="/shop?newArrival=true" className="font-body text-xs tracking-wider flex items-center gap-1.5 hover:opacity-70 transition-opacity"
                style={{color:'#C9A84C', textDecoration:'none'}}>
                View All <FiArrowRight size={12}/>
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton aspect-[3/4] rounded" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {newArrivals.slice(0, 4).map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Banner ── */}
      <section className="relative py-32 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1600&q=90"
          alt="Campaign"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-charcoal/70" />
        <div className="relative max-w-7xl mx-auto px-6 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="section-subtitle text-gold">Limited Time</p>
            <h2 className="font-display text-5xl md:text-7xl font-light mb-6">The Season Sale</h2>
            <p className="font-body text-gray-300 mb-10 text-lg">Up to 50% off on selected styles</p>
            <Link to="/shop?sale=true" className="btn-gold-filled inline-flex items-center gap-3">
              Shop the Sale <FiArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Best Sellers ── */}
      {(bestSellers.length > 0 || loading) && (
        <section className="py-16" style={{backgroundColor:"#111111"}}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-7 rounded-full" style={{backgroundColor:'#C9A84C'}} />
                <div>
                  <p style={{fontSize:'9px', letterSpacing:'0.25em', textTransform:'uppercase', color:'#C9A84C', marginBottom:'2px', fontFamily:'Jost,sans-serif'}}>Customer Favourites</p>
                  <h2 className="font-display font-light text-white" style={{fontSize:'clamp(1.3rem,4vw,1.8rem)', margin:0, lineHeight:1.1}}>Best Sellers</h2>
                </div>
              </div>
              <Link to="/shop?bestSeller=true" className="font-body text-xs tracking-wider flex items-center gap-1.5 hover:opacity-70 transition-opacity"
                style={{color:'#C9A84C', textDecoration:'none'}}>
                View All <FiArrowRight size={12}/>
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton aspect-[3/4] rounded" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {bestSellers.slice(0, 4).map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Features ── */}
      <section className="py-16" style={{backgroundColor:"#0a0a0a"}}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: '🚚', title: 'Free Shipping', desc: 'Orders above ₹999' },
              { icon: '↩️', title: 'Easy Returns', desc: '30-day return policy' },
              { icon: '🔒', title: 'Secure Payment', desc: '100% encrypted checkout' },
              { icon: '⭐', title: 'Premium Quality', desc: 'Curated fashion pieces' },
            ].map(f => (
              <div key={f.title} className="text-white">
                <div className="text-3xl mb-3">{f.icon}</div>
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