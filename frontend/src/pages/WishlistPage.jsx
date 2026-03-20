import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiArrowRight } from 'react-icons/fi';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/product/ProductCard';

const BG = '#0d0d0d';
const GOLD = '#C9A84C';

export default function WishlistPage() {
  const { wishlist, fetchWishlist } = useWishlist();
  useEffect(() => { fetchWishlist(); }, []);
  const products = wishlist.products || [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Modern header */}
        <div className="flex items-end justify-between mb-8 pb-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <p style={{ fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: GOLD, marginBottom: '6px', fontFamily: 'Jost,sans-serif' }}>
              Saved Items
            </p>
            <h1 className="font-display font-light text-white" style={{ fontSize: 'clamp(1.6rem,4vw,2.25rem)', margin: 0 }}>
              My Wishlist
            </h1>
          </div>
          {products.length > 0 && (
            <div className="px-4 py-2 font-body text-sm"
              style={{ backgroundColor: 'rgba(201,168,76,0.1)', color: GOLD, borderRadius: '20px', border: '1px solid rgba(201,168,76,0.2)' }}>
              {products.length} item{products.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <FiHeart size={32} style={{ color: 'rgba(255,255,255,0.2)' }} />
            </div>
            <h2 className="font-display text-2xl font-light text-white mb-2">No saved items yet</h2>
            <p className="font-body text-sm mb-8" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Tap the heart icon on any product to save it here.
            </p>
            <Link to="/shop" className="inline-flex items-center gap-2 font-body text-sm tracking-wider uppercase text-white px-6 py-3"
              style={{ backgroundColor: GOLD, borderRadius: '10px', textDecoration: 'none' }}>
              Browse Products <FiArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}