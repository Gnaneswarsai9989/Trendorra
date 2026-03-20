import { Link, useLocation } from 'react-router-dom';
import { FiChevronRight } from 'react-icons/fi';

const GOLD = '#C9A84C';
const BG = '#111111';
const BG2 = '#0a0a0a';
const CARD = '#1a1a1a';
const BORDER = 'rgba(255,255,255,0.08)';

const legalLinks = [
  { label: 'Privacy Policy', to: '/privacy-policy' },
  { label: 'Terms of Service', to: '/terms-of-service' },
  { label: 'Refund Policy', to: '/refund-policy' },
  { label: 'Shipping Policy', to: '/shipping-policy' },
  { label: 'Cookie Policy', to: '/cookie-policy' },
  { label: 'Disclaimer', to: '/disclaimer' },
];

export default function LegalLayout({ title, lastUpdated = 'March 2026', children }) {
  const location = useLocation();
  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>
      {/* Header */}
      <div className="py-12 px-6 text-center" style={{ backgroundColor: BG2, borderBottom: `1px solid ${BORDER}` }}>
        <p className="font-body text-xs tracking-[0.25em] uppercase mb-2" style={{ color: GOLD }}>Legal</p>
        <h1 className="font-display text-3xl md:text-4xl font-light text-white mb-3">{title}</h1>
        <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Last updated: {lastUpdated}</p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* Sidebar navigation */}
          <aside className="lg:w-56 flex-shrink-0">
            <div className="sticky top-28" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
              <p className="font-body text-[10px] tracking-[0.2em] uppercase px-5 py-4" style={{ color: GOLD, borderBottom: `1px solid ${BORDER}` }}>
                Legal Pages
              </p>
              {legalLinks.map(link => {
                const isActive = window.location.pathname === link.to;
                return (
                  <Link key={link.to} to={link.to}
                    className="flex items-center justify-between px-5 py-3.5 text-sm font-body transition-all"
                    style={{
                      color: isActive ? GOLD : 'rgba(255,255,255,0.55)',
                      backgroundColor: isActive ? 'rgba(201,168,76,0.08)' : 'transparent',
                      borderBottom: `1px solid ${BORDER}`,
                      borderLeft: isActive ? `2px solid ${GOLD}` : '2px solid transparent',
                    }}>
                    {link.label}
                    {isActive && <FiChevronRight size={13} style={{ color: GOLD }} />}
                  </Link>
                );
              })}
              <div className="px-5 py-4">
                <p className="font-body text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Questions? Contact us at<br />
                  <a href="mailto:trendorashoppingsai@gmail.com" className="hover:text-gold transition-colors" style={{ color: GOLD }}>
                    trendorashoppingsai@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            <div className="p-6 sm:p-8" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export const H2 = ({ children }) => (
  <h2 className="font-display text-xl font-light text-white mt-8 mb-3 pb-2"
    style={{ borderBottom: `1px solid rgba(201,168,76,0.3)`, color: '#C9A84C' }}>
    {children}
  </h2>
);

export const P = ({ children }) => (
  <p className="font-body text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.65)' }}>
    {children}
  </p>
);

export const UL = ({ items }) => (
  <ul className="space-y-2 mb-4 ml-4">
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-2 font-body text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
        <span style={{ color: '#C9A84C', marginTop: '2px' }}>•</span>
        {item}
      </li>
    ))}
  </ul>
);

export const InfoBox = ({ children }) => (
  <div className="p-4 mb-6 rounded" style={{ backgroundColor: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
    <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{children}</p>
  </div>
);
