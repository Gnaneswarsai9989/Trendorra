import { Link } from 'react-router-dom';
import { FiInstagram, FiTwitter, FiFacebook, FiYoutube, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { useState } from 'react';
import toast from 'react-hot-toast';
import logo from '../../assets/logo.png';

const GOLD = '#C9A84C';
const BG = '#0a0a0a';
const BORDER = 'rgba(255,255,255,0.08)';
const TEXT = 'rgba(255,255,255,0.5)';

export default function Footer() {
  const [email, setEmail] = useState('');

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (email) { toast.success('Thank you for subscribing!'); setEmail(''); }
  };

  return (
    <>
      <footer style={{ backgroundColor: BG }}>

        {/* ── Newsletter ── */}
        <div className="py-14 px-6 text-center" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="max-w-lg mx-auto">
            <p className="font-body text-xs tracking-[0.25em] uppercase mb-3" style={{ color: GOLD }}>Stay in the loop</p>
            <h3 className="font-display text-3xl font-light text-white mb-3">Join the Trendorra Circle</h3>
            <p className="font-body text-sm mb-6 leading-relaxed" style={{ color: TEXT }}>
              Be the first to know about new collections, exclusive offers & style inspiration.
              We send 2–3 emails per month — no spam, unsubscribe anytime.
            </p>
            <form onSubmit={handleNewsletter} className="flex max-w-md mx-auto">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Your email address" required
                className="flex-1 px-5 py-3.5 text-sm font-body text-white focus:outline-none focus:border-gold transition-colors"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: `1px solid rgba(255,255,255,0.15)`, borderRight: 'none' }} />
              <button type="submit"
                className="px-6 py-3.5 text-xs tracking-[0.2em] uppercase font-body font-medium text-white whitespace-nowrap transition-colors"
                style={{ backgroundColor: GOLD }}>
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* ── Main footer grid ── */}
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">

            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-2.5 mb-5">
                <img src={logo} alt="Trendorra" className="h-10 w-auto object-contain mix-blend-lighten"
                  style={{ filter: 'brightness(1.1)' }} />
                <span className="font-accent text-base tracking-[0.3em]" style={{ color: GOLD }}>TRENDORRA</span>
              </Link>
              <p className="font-body text-sm leading-relaxed mb-5" style={{ color: TEXT }}>
                Premium fashion for the modern individual. Curated collections that blend timeless elegance with contemporary edge.
              </p>
              <div className="flex items-center gap-4 mb-5">
                {[
                  { Icon: FiInstagram, href: '#' },
                  { Icon: FiTwitter, href: '#' },
                  { Icon: FiFacebook, href: '#' },
                  { Icon: FiYoutube, href: '#' },
                ].map(({ Icon, href }, i) => (
                  <a key={i} href={href}
                    className="w-8 h-8 flex items-center justify-center transition-all hover:text-gold"
                    style={{ color: 'rgba(255,255,255,0.35)', border: `1px solid ${BORDER}`, borderRadius: '50%' }}>
                    <Icon size={14} />
                  </a>
                ))}
              </div>
              <div className="space-y-2 text-sm font-body" style={{ color: TEXT }}>
                <div className="flex items-center gap-2">
                  <FiMail size={13} style={{ color: GOLD }} />
                  <a href="mailto:trendorashoppingsai@gmail.com" className="hover:text-white transition-colors">trendorashoppingsai@gmail.com</a>
                </div>
                <div className="flex items-center gap-2">
                  <FiPhone size={13} style={{ color: GOLD }} />
                  <span>+91 6304000624</span>
                </div>
              </div>
            </div>

            {/* Shop */}
            <div>
              <h4 className="font-body text-[11px] tracking-[0.25em] uppercase mb-5" style={{ color: GOLD }}>Shop</h4>
              <ul className="space-y-3">
                {[
                  { label: 'Men', to: '/shop/men' },
                  { label: 'Women', to: '/shop/women' },
                  { label: 'Streetwear', to: '/shop/streetwear' },
                  { label: 'Accessories', to: '/shop/accessories' },
                  { label: 'New Arrivals', to: '/shop?newArrival=true' },
                  { label: 'Best Sellers', to: '/shop?bestSeller=true' },
                  { label: 'Sale', to: '/shop?sale=true' },
                ].map(item => (
                  <li key={item.label}>
                    <Link to={item.to} className="font-body text-sm transition-colors hover:text-white" style={{ color: TEXT }}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Help */}
            <div>
              <h4 className="font-body text-[11px] tracking-[0.25em] uppercase mb-5" style={{ color: GOLD }}>Help</h4>
              <ul className="space-y-3">
                {[
                  { label: 'Size Guide', to: '/size-guide' },
                  { label: 'Shipping & Returns', to: '/shipping-policy' },
                  { label: 'Track My Order', to: '/track-order' },
                  { label: 'FAQ', to: '/faq' },
                  { label: 'Contact Us', to: '/contact' },
                  { label: 'Cancellation Policy', to: '/refund-policy' },
                ].map(item => (
                  <li key={item.label}>
                    <Link to={item.to} className="font-body text-sm transition-colors hover:text-white" style={{ color: TEXT }}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal + Contact */}
            <div>
              <h4 className="font-body text-[11px] tracking-[0.25em] uppercase mb-5" style={{ color: GOLD }}>Legal</h4>
              <ul className="space-y-3 mb-7">
                {[
                  { label: 'Privacy Policy', to: '/privacy-policy' },
                  { label: 'Terms of Service', to: '/terms-of-service' },
                  { label: 'Refund Policy', to: '/refund-policy' },
                  { label: 'Cookie Policy', to: '/cookie-policy' },
                  { label: 'Disclaimer', to: '/disclaimer' },
                ].map(item => (
                  <li key={item.label}>
                    <Link to={item.to} className="font-body text-sm transition-colors hover:text-white" style={{ color: TEXT }}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="text-sm font-body space-y-1.5" style={{ color: TEXT }}>
                <p className="font-medium text-white text-xs">Trendorra Fashion Pvt. Ltd.</p>
                <div className="flex items-start gap-1.5">
                  <FiMapPin size={12} className="mt-0.5 flex-shrink-0" style={{ color: GOLD }} />
                  <p>Nellore – 524004, Andhra Pradesh, India</p>
                </div>
                <p>GSTIN: 29XXXXX1234X1ZX</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div style={{ borderTop: `1px solid ${BORDER}` }}>
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-center sm:text-left">
              <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                © 2026 Trendorra Fashion Pvt. Ltd. All rights reserved.
              </p>
              {/* Payment badges */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {['Visa', 'Mastercard', 'RuPay', 'UPI', 'Razorpay', 'COD'].map(p => (
                  <span key={p} className="font-body text-[10px] px-2.5 py-1"
                    style={{ border: `1px solid rgba(255,255,255,0.12)`, color: 'rgba(255,255,255,0.4)', borderRadius: '3px' }}>
                    {p}
                  </span>
                ))}
              </div>
              <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
                Secured by 256-bit SSL
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile bottom nav spacer */}
      <div className="md:hidden h-24" style={{ backgroundColor: 'transparent' }} />
    </>
  );
}
