import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHeart, FiShoppingBag, FiEye } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

const GOLD = '#C9A84C';
const BORDER = 'rgba(255,255,255,0.08)';

export default function ProductCard({ product, index = 0 }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product._id);
  const discountPercent = product.discountPrice ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : null;
  const mainImage = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80';
  const hoverImage = product.images?.[1]?.url || mainImage;

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.06 }}
      className="product-card">
      {/* Image */}
      <div className="relative overflow-hidden aspect-[3/4]" style={{ backgroundColor: '#1a1a1a', borderRadius: '12px' }}>
        <Link to={`/product/${product._id}`}>
          <img src={mainImage} alt={product.name} className="w-full h-full object-cover transition-all duration-500 group-hover:opacity-0 group-hover:scale-110 absolute inset-0" />
          <img src={hoverImage} alt={product.name} className="w-full h-full object-cover transition-all duration-500 opacity-0 group-hover:opacity-100 group-hover:scale-105 absolute inset-0" />
        </Link>
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {product.isNewArrival && <span className="badge-gold">New</span>}
          {product.isBestSeller && <span className="badge-black">Best Seller</span>}
          {discountPercent && <span className="text-white text-[10px] font-body font-medium tracking-wider uppercase px-2 py-0.5" style={{ backgroundColor: '#ef4444' }}>-{discountPercent}%</span>}
        </div>
        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
          <button onClick={() => toggleWishlist(product._id)}
            className="w-9 h-9 flex items-center justify-center shadow-md transition-all duration-200"
            style={{ backgroundColor: wishlisted ? GOLD : '#fff', color: wishlisted ? '#fff' : '#111' }}>
            <FiHeart size={16} fill={wishlisted ? 'currentColor' : 'none'} />
          </button>
          <Link to={`/product/${product._id}`}
            className="w-9 h-9 flex items-center justify-center shadow-md transition-all duration-200"
            style={{ backgroundColor: '#fff', color: '#111' }}
            onMouseOver={e => { e.currentTarget.style.backgroundColor = GOLD; e.currentTarget.style.color = '#fff'; }}
            onMouseOut={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#111'; }}>
            <FiEye size={16} />
          </Link>
        </div>
        {/* Quick add */}
        <div className="absolute bottom-0 left-0 right-0 text-center py-3 text-xs tracking-[0.2em] uppercase font-body font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-full group-hover:translate-y-0 cursor-pointer"
          style={{ backgroundColor: GOLD, color: '#fff' }}
          onClick={() => addToCart(product._id, product.sizes?.[0], product.colors?.[0]?.name)}>
          <span className="flex items-center justify-center gap-2">
            <FiShoppingBag size={14} /> Quick Add
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="pt-3 pb-2">
        <p className="font-body text-[10px] tracking-[0.2em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{product.brand || 'Trendorra'}</p>
        <Link to={`/product/${product._id}`}>
          <h3 className="font-body text-sm font-medium text-white hover:text-gold transition-colors line-clamp-2 leading-snug">{product.name}</h3>
        </Link>
        {product.numReviews > 0 && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="flex">
              {[1,2,3,4,5].map(s => <span key={s} className="text-xs" style={{ color: s <= Math.round(product.ratings) ? GOLD : 'rgba(255,255,255,0.15)' }}>★</span>)}
            </div>
            <span className="text-[11px] font-body" style={{ color: 'rgba(255,255,255,0.3)' }}>({product.numReviews})</span>
          </div>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span className="font-body font-medium text-white">₹{(product.discountPrice || product.price)?.toLocaleString()}</span>
          {product.discountPrice && <span className="font-body text-sm line-through" style={{ color: 'rgba(255,255,255,0.3)' }}>₹{product.price?.toLocaleString()}</span>}
        </div>
        {product.colors?.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            {product.colors.slice(0, 4).map((c, i) => (
              <div key={i} title={c.name} className="w-3 h-3 rounded-full border" style={{ backgroundColor: c.hex || '#000', borderColor: 'rgba(255,255,255,0.2)' }} />
            ))}
            {product.colors.length > 4 && <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>+{product.colors.length - 4}</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
}