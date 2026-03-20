import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { orderAPI } from '../services/api';
import { FiCheck, FiPackage } from 'react-icons/fi';
const GOLD = '#C9A84C';
export default function OrderConfirmationPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  useEffect(() => { orderAPI.getById(id).then(res => setOrder(res.order)); }, [id]);
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-20" style={{ backgroundColor: '#111111' }}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg w-full text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'rgba(74,222,128,0.15)' }}>
          <FiCheck size={36} style={{ color: '#4ade80' }} />
        </div>
        <p className="section-subtitle" style={{ color: '#4ade80' }}>Success</p>
        <h1 className="font-display text-4xl font-light text-white mb-4">Order Confirmed!</h1>
        <p className="font-body mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Thank you for shopping with Trendorra.</p>
        {order && <p className="font-body text-sm mb-8" style={{ color: 'rgba(255,255,255,0.35)' }}>Order #{order._id.slice(-8).toUpperCase()} • ₹{order.totalPrice?.toLocaleString()}</p>}
        <p className="font-body text-sm mb-10" style={{ color: 'rgba(255,255,255,0.4)' }}>You'll receive a confirmation email shortly.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to={`/orders/${id}`} className="py-3 px-8 flex items-center justify-center gap-2 font-body text-sm tracking-[0.15em] uppercase" style={{ backgroundColor: GOLD, color: '#fff' }}>
            <FiPackage size={16} /> Track Order
          </Link>
          <Link to="/shop" className="py-3 px-8 font-body text-sm tracking-[0.15em] uppercase" style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }}>
            Continue Shopping
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
