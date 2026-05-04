import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHeart, FiShoppingBag, FiEye } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

const GOLD = '#C9A84C';

const injectStyles = () => {
  if (typeof document === 'undefined') return;
  const oldStyle = document.getElementById('pc-styles-v3'); if (oldStyle) oldStyle.remove();
  if (document.getElementById('pc-styles-v4')) return;
  const style = document.createElement('style');
  style.id = 'pc-styles-v4';
  style.textContent = `

    /* ── CSS custom property for spinning border angle ── */
    @property --pc-angle {
      syntax: '<angle>';
      inherits: false;
      initial-value: 0deg;
    }

    /* ════════════════════════════════════════
       KEYFRAMES
    ════════════════════════════════════════ */

    @keyframes pc-spin {
      to { --pc-angle: 360deg; }
    }

    @keyframes pc-shimmer {
      0%   { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    @keyframes pc-glow-pulse {
      0%, 100% { opacity: 0.4; }
      50%       { opacity: 1; }
    }

    @keyframes pc-lift {
      0%, 100% { transform: translateY(0px); }
      50%       { transform: translateY(-3px); }
    }

    /* ════════════════════════════════════════
       CARD WRAPPER
    ════════════════════════════════════════ */

    .pc-wrap {
      position: relative;
      border-radius: 16px;
      padding: 1.5px;
      background: transparent;
      display: block;
      width: 100%;
    }

    /* ── Spinning conic gradient border ── */
    .pc-wrap::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 16px;
      padding: 1.5px;
      background: conic-gradient(
        from var(--pc-angle),
        transparent   0deg,
        transparent  50deg,
        #8B6914      70deg,
        #C9A84C      90deg,
        #f5e09a     110deg,
        #C9A84C     130deg,
        #8B6914     150deg,
        transparent 170deg,
        transparent 360deg
      );
      -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
    }

    /* ── Outer glow ring ── */
    .pc-wrap::after {
      content: '';
      position: absolute;
      inset: -1px;
      border-radius: 17px;
      pointer-events: none;
    }

    /* ════════════════════════════════════════
       DESKTOP — border + hover effects
    ════════════════════════════════════════ */

    @media (hover: hover) and (pointer: fine) {

      /* Border hidden by default, plays on hover */
      .pc-wrap::before {
        opacity: 0;
        animation: pc-spin 3.5s linear infinite paused;
        transition: opacity 0.3s ease;
      }

      .pc-wrap::after {
        box-shadow: none;
        transition: box-shadow 0.3s ease;
      }

      /* Card lifts up on hover */
      .pc-wrap:hover {
        transform: translateY(-5px);
        transition: transform 0.3s ease;
      }

      /* Border spins on hover */
      .pc-wrap:hover::before {
        opacity: 1;
        animation-play-state: running;
      }

      /* Glow appears on hover */
      .pc-wrap:hover::after {
        box-shadow:
          0 0 24px rgba(201, 168, 76, 0.2),
          0 12px 40px rgba(0, 0, 0, 0.5);
      }
    }

    /* ════════════════════════════════════════
       MOBILE — always-on border + pulse + float
    ════════════════════════════════════════ */

    @media (hover: none), (pointer: coarse) {

      /* Border always spinning */
      .pc-wrap::before {
        opacity: 1;
        animation: pc-spin 6s linear infinite;
      }

      /* Glow always pulsing */
      .pc-wrap::after {
        box-shadow: 0 0 14px rgba(201, 168, 76, 0.25);
        animation: pc-glow-pulse 4s ease-in-out infinite;
      }

      /* Card gently floating */
      .pc-wrap {
        animation: pc-lift 5s ease-in-out infinite;
      }
    }

    /* ════════════════════════════════════════
       INNER CARD BODY — full black
    ════════════════════════════════════════ */

    .pc-inner {
      position: relative;
      border-radius: 14px;
      overflow: hidden;
      background: #000;
      z-index: 1;
      display: flex;
      flex-direction: column;
    }

    /* ════════════════════════════════════════
       IMAGE CONTAINER
    ════════════════════════════════════════ */

    .pc-img-box {
      position: relative;
      width: 100%;
      padding-top: 118%;
      overflow: hidden;
      background: #000;
      flex-shrink: 0;
    }

    @media (min-width: 1024px) {
      .pc-img-box {
        padding-top: 100%;
      }
    }

    .pc-img-link {
      position: absolute;
      inset: 0;
      z-index: 2;
      display: block;
      text-decoration: none;
    }

    .pc-img-box img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center top;
      transition: transform 0.6s ease, opacity 0.4s ease;
      pointer-events: none;
    }

    .pc-img-main  { opacity: 1; z-index: 1; }
    .pc-img-hover { opacity: 0; z-index: 1; transform: scale(1.06); }

    @media (hover: hover) and (pointer: fine) {
      .pc-wrap:hover .pc-img-main  { opacity: 0; transform: scale(1.08); }
      .pc-wrap:hover .pc-img-hover { opacity: 1; transform: scale(1); }
    }

    /* ── Shimmer sweep ── */
    .pc-shimmer {
      position: absolute;
      inset: 0;
      z-index: 5;
      overflow: hidden;
      pointer-events: none;
    }

    .pc-shimmer::after {
      content: '';
      position: absolute;
      top: 0; bottom: 0; left: 0;
      width: 60%;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(201, 168, 76, 0.1) 50%,
        transparent 100%
      );
      transform: translateX(-100%);
      animation: pc-shimmer 2s ease infinite paused;
    }

    @media (hover: hover) and (pointer: fine) {
      .pc-wrap:hover .pc-shimmer::after {
        animation-play-state: running;
      }
    }

    /* ════════════════════════════════════════
       ACTION BUTTONS
    ════════════════════════════════════════ */

    .pc-actions {
      position: absolute;
      top: 10px;
      right: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      z-index: 8;
      opacity: 0;
      transform: translateX(12px);
      transition: opacity 0.3s ease, transform 0.3s ease;
    }

    @media (hover: hover) and (pointer: fine) {
      .pc-wrap:hover .pc-actions {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @media (hover: none), (pointer: coarse) {
      .pc-actions {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .pc-action-btn {
      width: 30px;
      height: 30px;
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.93);
      color: #111;
      border: none;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      transition: background 0.2s, color 0.2s;
      text-decoration: none;
    }

    .pc-action-btn:hover,
    .pc-action-btn.wishlisted {
      background: #C9A84C;
      color: #fff;
    }

    /* ════════════════════════════════════════
       QUICK ADD BAR
    ════════════════════════════════════════ */

    .pc-quick-add {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      background: #C9A84C;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      cursor: pointer;
      z-index: 8;
      transform: translateY(100%);
      transition: transform 0.3s ease;
    }

    @media (hover: hover) and (pointer: fine) {
      .pc-wrap:hover .pc-quick-add {
        transform: translateY(0);
      }
    }

    @media (hover: none), (pointer: coarse) {
      .pc-quick-add {
        transform: translateY(0);
        padding: 8px;
        font-size: 9px;
      }
    }

    /* ════════════════════════════════════════
       BADGES
    ════════════════════════════════════════ */

    .pc-badges {
      position: absolute;
      top: 10px;
      left: 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      z-index: 8;
      pointer-events: none;
    }

    .pc-badge {
      display: inline-block;
      font-size: 8.5px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      padding: 3px 8px;
      line-height: 1;
    }

    .pc-badge-gold { background: #C9A84C; color: #fff; }
    .pc-badge-dark { background: #000;    color: #fff; border: 1px solid rgba(255, 255, 255, 0.15); }
    .pc-badge-red  { background: #ef4444; color: #fff; }

    /* ════════════════════════════════════════
       INFO SECTION — full black
    ════════════════════════════════════════ */

    .pc-info {
      padding: 10px 12px 12px;
      background: #000;
      flex: 1;
    }

    .pc-brand {
      font-size: 9px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.3);
      margin-bottom: 4px;
    }

    .pc-name {
      font-size: 12.5px;
      font-weight: 500;
      color: #fff;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-decoration: none;
      transition: color 0.2s;
    }

    .pc-name:hover { color: #C9A84C; }

    .pc-stars {
      display: flex;
      align-items: center;
      gap: 3px;
      margin-top: 5px;
    }

    .pc-star { font-size: 10px; }

    .pc-review-count {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.3);
    }

    /* ── Price row ── */
    .pc-price-row {
      display: flex;
      align-items: center;
      gap: 7px;
      margin-top: 8px;
    }

    .pc-price-now {
      font-size: 14px;
      font-weight: 700;
      color: #fff;
    }

    .pc-price-old {
      font-size: 11px;
      text-decoration: line-through;
      color: rgba(255, 255, 255, 0.3);
    }

    /* ── Offer label row — shown below price when discount exists ── */
    .pc-offer-row {
      margin-top: 6px;
    }

    .pc-offer-tag {
      display: inline-block;
      background: #22c55e;
      color: #fff;
      font-size: 9.5px;
      font-weight: 800;
      letter-spacing: 0.07em;
      padding: 2px 8px;
      border-radius: 4px;
      line-height: 1.4;
    }

    /* ── Gold divider between image and info ── */
    .pc-divider {
      height: 1px;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(201, 168, 76, 0.3),
        transparent
      );
    }

  `;
  document.head.appendChild(style);
};

export default function ProductCard({ product, index = 0 }) {
  injectStyles();

  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product._id);

  /* ── Use strict check so discountPrice=0 doesn't count as a discount ── */
  const hasDiscount = product.discountPrice != null && product.discountPrice > 0;
  const effectivePrice = hasDiscount ? product.discountPrice : product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : null;

  const mainImage = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80';
  const hoverImage = product.images?.[1]?.url || mainImage;

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: 'easeOut' }}
      className="pc-wrap"
    >
      <div className="pc-inner">

        {/* ════════ IMAGE ZONE ════════ */}
        <div className="pc-img-box">

          {/* Invisible full-area link */}
          <Link
            to={`/product/${product._id}`}
            className="pc-img-link"
            aria-label={product.name}
          />

          <img src={mainImage} alt={product.name} className="pc-img-main" loading="lazy" />
          <img src={hoverImage} alt={product.name} className="pc-img-hover" loading="lazy" />

          <div className="pc-shimmer" />

          {/* Bottom gradient overlay */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '45%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)',
            zIndex: 3,
            pointerEvents: 'none',
          }} />

          {/* Badges */}
          <div className="pc-badges">
            {product.isNewArrival && <span className="pc-badge pc-badge-gold">New</span>}
            {product.isBestSeller && <span className="pc-badge pc-badge-dark">Best Seller</span>}
            {discountPercent && <span className="pc-badge pc-badge-red">-{discountPercent}%</span>}
          </div>

          {/* Action buttons */}
          <div className="pc-actions">
            <button
              className={`pc-action-btn${wishlisted ? ' wishlisted' : ''}`}
              onClick={e => { e.preventDefault(); toggleWishlist(product._id); }}
              title="Wishlist"
            >
              <FiHeart size={13} fill={wishlisted ? 'currentColor' : 'none'} />
            </button>
            <Link to={`/product/${product._id}`} className="pc-action-btn" title="Quick View">
              <FiEye size={13} />
            </Link>
          </div>

          {/* Quick Add */}
          <div
            className="pc-quick-add"
            onClick={e => { e.preventDefault(); addToCart(product._id, product.sizes?.[0], product.colors?.[0]?.name); }}
          >
            <FiShoppingBag size={12} />
            Quick Add
          </div>

        </div>

        {/* Gold divider */}
        <div className="pc-divider" />

        {/* ════════ INFO ZONE ════════ */}
        <div className="pc-info">

          <p className="pc-brand">{product.brand || 'Trendorra'}</p>

          <Link to={`/product/${product._id}`} className="pc-name">
            {product.name}
          </Link>

          {product.numReviews > 0 && (
            <div className="pc-stars">
              {[1, 2, 3, 4, 5].map(s => (
                <span
                  key={s}
                  className="pc-star"
                  style={{ color: s <= Math.round(product.ratings) ? GOLD : 'rgba(255,255,255,0.12)' }}
                >★</span>
              ))}
              <span className="pc-review-count">({product.numReviews})</span>
            </div>
          )}

          {/* Price row — effective price + strikethrough MRP */}
          <div className="pc-price-row">
            <span className="pc-price-now">
              ₹{effectivePrice?.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="pc-price-old">
                ₹{product.price?.toLocaleString()}
              </span>
            )}
          </div>

          {/* ── Offer label — separate line below price, only when discounted ── */}
          {hasDiscount && (
            <div className="pc-offer-row">
              <span className="pc-offer-tag">{discountPercent}% OFF</span>
            </div>
          )}

          {/* ── Color dots REMOVED as requested ── */}

        </div>

      </div>
    </motion.div>
  );
}