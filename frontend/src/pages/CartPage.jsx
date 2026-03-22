import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { FiTrash2, FiShoppingBag, FiArrowRight } from 'react-icons/fi';

const BG = '#0d0d0d';
const BG2 = '#111';
const BORDER = 'rgba(255,255,255,0.08)';
const GOLD = '#C9A84C';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, cartTotal } = useCart();
  const navigate = useNavigate();
  const items = cart.items || [];
  const total = cartTotal;

  if (items.length === 0) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6"
      style={{ backgroundColor: BG }}>
      <FiShoppingBag size={64} className="mb-6" style={{ color: 'rgba(255,255,255,0.1)' }} />
      <h2 className="font-display text-4xl font-light text-white mb-3">Your cart is empty</h2>
      <p className="font-body mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>Nothing added yet.</p>
      <Link to="/shop" className="btn-gold-filled px-8 py-3">Start Shopping</Link>
    </div>
  );

  return (
    <div className="min-h-screen px-4 sm:px-6 py-12 max-w-7xl mx-auto" style={{ backgroundColor: BG }}>
      <div className="flex items-end justify-between mb-8 pb-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div>
          <p style={{ fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: '6px', fontFamily: 'Jost,sans-serif' }}>
            Review your order
          </p>
          <h1 className="font-display font-light text-white" style={{ fontSize: 'clamp(1.6rem,4vw,2.25rem)', margin: 0 }}>
            Shopping Cart
          </h1>
        </div>
        <div className="px-4 py-2 font-body text-sm"
          style={{ backgroundColor: 'rgba(201,168,76,0.1)', color: '#C9A84C', borderRadius: '20px', border: '1px solid rgba(201,168,76,0.2)' }}>
          {items.length} item{items.length > 1 ? 's' : ''}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Items */}
        <div className="lg:col-span-2">
          <div className="hidden sm:grid grid-cols-12 gap-4 pb-4 text-xs font-body tracking-[0.15em] uppercase"
            style={{ borderBottom: `1px solid ${BORDER}`, color: 'rgba(255,255,255,0.3)' }}>
            <div className="col-span-6">Product</div>
            <div className="col-span-2 text-center">Price</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          <AnimatePresence>
            {items.map(item => {
              const product = item.product;
              const price = item.price || product?.price || 0;
              const image = product?.images?.[0]?.url || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=200';
              return (
                <motion.div key={item._id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="grid grid-cols-12 gap-4 py-6 items-center"
                  style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <div className="col-span-12 sm:col-span-6 flex items-center gap-4">
                    <Link to={`/product/${product?._id}`}>
                      <img src={image} alt={product?.name} className="w-20 h-24 object-cover flex-shrink-0" style={{ borderRadius: '10px' }} />
                    </Link>
                    <div>
                      <Link to={`/product/${product?._id}`}>
                        <h3 className="font-body font-medium text-sm text-white hover:text-gold transition-colors">{product?.name}</h3>
                      </Link>
                      <div className="flex gap-3 mt-1">
                        {item.size && <span className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Size: {item.size}</span>}
                        {item.color && <span className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Color: {item.color}</span>}
                      </div>
                      <button onClick={() => removeFromCart(item._id)}
                        className="flex items-center gap-1 mt-2 text-xs font-body text-red-400 hover:text-red-300 transition-colors">
                        <FiTrash2 size={12} /> Remove
                      </button>
                    </div>
                  </div>
                  <div className="col-span-4 sm:col-span-2 text-center font-body text-sm text-white">₹{price.toLocaleString()}</div>
                  <div className="col-span-4 sm:col-span-2 flex justify-center">
                    <div className="flex items-center" style={{ border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
                      <button onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-sm text-white hover:text-gold transition-colors">−</button>
                      <span className="w-8 text-center font-body text-sm text-white">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-sm text-white hover:text-gold transition-colors">+</button>
                    </div>
                  </div>
                  <div className="col-span-4 sm:col-span-2 text-right font-body font-medium text-sm text-white">
                    ₹{(price * item.quantity).toLocaleString()}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          <div className="mt-6">
            <Link to="/shop" className="font-body text-sm hover:text-gold transition-colors"
              style={{ color: 'rgba(255,255,255,0.4)' }}>← Continue Shopping</Link>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="p-8 sticky top-32" style={{ backgroundColor: BG2, border: `1px solid ${BORDER}` }}>
            <h2 className="font-display text-2xl font-light text-white mb-6">Order Summary</h2>
            <div className="space-y-3 mb-6 pb-6" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div className="flex justify-between font-body text-sm">
                <span style={{ color: 'rgba(255,255,255,0.45)' }}>Subtotal ({items.length} item{items.length > 1 ? 's' : ''})</span>
                <span style={{ color: '#fff' }}>₹{cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-body text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                <span>Delivery charge calculated at checkout</span>
              </div>
            </div>
            <div className="flex justify-between font-body font-medium text-lg text-white mb-8">
              <span>Subtotal</span>
              <span style={{ color: GOLD }}>₹{total.toLocaleString()}</span>
            </div>
            <button onClick={() => navigate('/checkout')}
              className="w-full py-4 flex items-center justify-center gap-3 font-body text-sm tracking-[0.15em] uppercase transition-colors"
              style={{ backgroundColor: GOLD, color: '#fff' }}
              onMouseOver={e => e.target.style.backgroundColor = '#A07830'}
              onMouseOut={e => e.target.style.backgroundColor = GOLD}>
              Proceed to Checkout <FiArrowRight size={16} />
            </button>
            <div className="mt-6 flex justify-center gap-3">
              {['Visa', 'Mastercard', 'UPI', 'Razorpay'].map(p => (
                <span key={p} className="text-[9px] px-2 py-1 font-body"
                  style={{ border: `1px solid ${BORDER}`, color: 'rgba(255,255,255,0.3)' }}>{p}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}