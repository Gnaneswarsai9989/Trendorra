import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
export default function NotFoundPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center text-center px-6" style={{ backgroundColor: '#111111' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="font-accent text-8xl font-bold mb-4" style={{ color: 'rgba(255,255,255,0.06)' }}>404</p>
        <h1 className="font-display text-4xl font-light text-white mb-4">Page Not Found</h1>
        <p className="font-body mb-10 max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.4)' }}>The page you're looking for doesn't exist.</p>
        <Link to="/" className="px-8 py-3 font-body text-sm tracking-[0.15em] uppercase" style={{ backgroundColor: '#C9A84C', color: '#fff' }}>Go Back Home</Link>
      </motion.div>
    </div>
  );
}
