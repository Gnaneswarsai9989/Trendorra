import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import {
  FiHeart, FiShoppingBag, FiUser, FiX,
  FiLogOut, FiPackage, FiSettings, FiChevronRight,
  FiHome, FiGrid, FiShoppingCart, FiChevronDown,
  FiHelpCircle, FiFileText, FiShield, FiTruck,
  FiRefreshCw, FiTag, FiMenu, FiArrowRight, FiBell,
} from 'react-icons/fi';
import logo from '../../assets/logo.png';
import LiveSearch from './LiveSearch';
import {
  SUB_CATEGORIES,
  SUB_CATEGORY_IMAGES,
  getGroupedSubCategories,
} from '../../constants/categories';

// ─── Theme ───────────────────────────────────────────────────────────────────
const GOLD = '#C9A84C';
const GOLD_GLOW = 'rgba(201,168,76,0.10)';
const CATEGORIES = ['Men', 'Women', 'Streetwear', 'Accessories'];

const CAT_CONFIG = {
  Men: { color: '#C9A84C', tag: 'New Season', count: '240+ styles', bg: 'linear-gradient(135deg,#1a1a0e,#0f0f0a)' },
  Women: { color: '#e08c84', tag: 'Trending', count: '380+ styles', bg: 'linear-gradient(135deg,#1a1010,#0f0808)' },
  Streetwear: { color: '#8899dd', tag: 'New Drop', count: '160+ styles', bg: 'linear-gradient(135deg,#101418,#080a0e)' },
  Accessories: { color: '#7ab870', tag: 'Curated', count: '120+ picks', bg: 'linear-gradient(135deg,#121810,#090e08)' },
};

const CAT_IMAGES = {
  Men: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=300&h=300&fit=crop&crop=top&auto=format&q=85',
  Women: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=300&fit=crop&crop=faces&auto=format&q=85',
  Streetwear: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=300&h=300&fit=crop&crop=top&auto=format&q=85',
  Accessories: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop&crop=top&auto=format&q=85',
};

const QUICK_FILTERS = {
  Men: ['New Arrivals', 'Best Sellers', 'Under ₹999', 'Ethnic', 'Sports'],
  Women: ['New Arrivals', 'Trending Now', 'Under ₹999', 'Ethnic Wear', 'Party Wear'],
  Streetwear: ['New Drops', 'Limited Edition', 'Under ₹1499', 'Vintage', 'Unisex'],
  Accessories: ['New In', 'Best Sellers', 'Under ₹499', 'Luxury', 'Gift Ideas'],
};

const SUBCAT_IMGS = {
  'T-Shirts': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Casual Shirts': 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Formal Shirts': 'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Hoodies & Sweatshirts': 'https://images.unsplash.com/photo-1622567893612-a5345baa5c9a?w=300&h=220&fit=crop&auto=format&q=80',
  'Jackets & Coats': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Blazers': 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Sweaters': 'https://images.unsplash.com/photo-1516826957135-700dedea698c?w=300&h=220&fit=crop&auto=format&q=80',
  'Suits': 'https://images.unsplash.com/photo-1594938298603-c8148c4b3f39?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Jeans': 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Trousers': 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Track Pants': 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=300&h=220&fit=crop&auto=format&q=80',
  'Joggers': 'https://images.unsplash.com/photo-1584865288642-42078afe6942?w=300&h=220&fit=crop&auto=format&q=80',
  'Shorts': 'https://images.unsplash.com/photo-1560243563-062bfc001d68?w=300&h=220&fit=crop&auto=format&q=80',
  'Cargo Pants': 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Pants': 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Kurtas': 'https://images.unsplash.com/photo-1602810319428-019690571b5b?w=300&h=220&fit=crop&auto=format&q=80',
  'Kurta Sets': 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Sherwanis': 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=300&h=220&fit=crop&auto=format&q=80',
  'Ethnic Jackets': 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=300&h=220&fit=crop&auto=format&q=80',
  'Dhoti': 'https://images.unsplash.com/photo-1650632784494-7b6d1960113f?w=300&h=220&fit=crop&auto=format&q=80',
  'Activewear': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Tops': 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Shirts': 'https://images.unsplash.com/photo-1723126004568-206c5ee9f6f7?w=300&h=220&fit=crop&auto=format&q=80',
  'Kurtis': 'https://images.unsplash.com/photo-1745313452052-0e4e341f326c?w=300&h=220&fit=crop&auto=format&q=80',
  'Tunics': 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Dresses': 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Casual Dresses': 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Party Dresses': 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Maxi Dresses': 'https://images.unsplash.com/photo-1623609163841-5e69d8c62cc7?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Bodycon Dresses': 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Mini Dresses': 'https://images.unsplash.com/photo-1752797203245-3b9e233b2ac8?w=300&h=220&fit=crop&auto=format&q=80',
  'Leggings': 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Palazzos': 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Skirts': 'https://images.unsplash.com/photo-1532635241-17e820acc59f?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Co-ords': 'https://images.unsplash.com/photo-1603400521630-9f2de124b33b?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Sarees': 'https://images.unsplash.com/photo-1678705730064-a7ecbab4b3fb?w=300&h=220&fit=crop&auto=format&q=80',
  'Salwar Suits': 'https://images.unsplash.com/photo-1603124552830-30ee98dfe342?w=300&h=220&fit=crop&auto=format&q=80',
  'Lehenga Choli': 'https://images.unsplash.com/photo-1759720883040-af9be070929e?w=300&h=220&fit=crop&auto=format&q=80',
  'Dupattas': 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Heels': 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Sandals': 'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Flats': 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Hoodies': 'https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Graphic Tees': 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Oversized Tees': 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Bomber Jackets': 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300&h=220&fit=crop&auto=format&q=80',
  'Jackets': 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Caps': 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Sneakers': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Bags': 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Watches': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Belts': 'https://images.unsplash.com/photo-1666723043169-22e29545675c?w=300&h=220&fit=crop&auto=format&q=80',
  'Wallets': 'https://plus.unsplash.com/premium_photo-1672759267829-17e48ef96660?w=300&h=220&fit=crop&auto=format&q=80',
  'Sunglasses': 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Caps & Hats': 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Bags & Backpacks': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Jewellery': 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Scarves': 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Hats': 'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
  'Boots': 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=300&h=220&fit=crop&crop=top&auto=format&q=80',
};

// ─── Notification type configs ────────────────────────────────────────────────
const NOTIF_TYPE_CONFIG = {
  offer: { color: '#C9A84C', icon: FiTag, bg: 'rgba(201,168,76,0.12)' },
  order: { color: '#60a5fa', icon: FiPackage, bg: 'rgba(96,165,250,0.12)' },
  alert: { color: '#f87171', icon: FiBell, bg: 'rgba(248,113,113,0.12)' },
  info: { color: '#7ab870', icon: FiBell, bg: 'rgba(122,184,112,0.12)' },
};


// ✅ NEW — polls your own backend every 30s, no Firestore needed
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function useNotifications(userId, db) {
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('trendora_token');
      if (!token || !userId) { setNotifications([]); return; }
      const res = await fetch(`${API_URL}/api/notifications/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setNotifications(data.notifications || []);
    } catch (e) { /* silent */ }
  };

  useEffect(() => {
    if (!userId) { setNotifications([]); return; }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const markRead = async (notifId) => {
    try {
      const token = localStorage.getItem('trendora_token');
      await fetch(`${API_URL}/api/notifications/mark-read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notificationId: notifId })
      });
      setNotifications(prev => prev.map(n =>
        n._id === notifId ? { ...n, isRead: true } : n
      ));
    } catch (e) { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('trendora_token');
      await fetch(`${API_URL}/api/notifications/mark-read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({})
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) { /* silent */ }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return { notifications, unreadCount, markRead, markAllRead };
}
// ─── Notification Panel ───────────────────────────────────────────────────────
function NotificationPanel({ notifications, userId, unreadCount, markRead, markAllRead, onClose, isDark, isMobile }) {
  const BORDER = isDark ? 'rgba(201,168,76,0.14)' : 'rgba(0,0,0,0.10)';

  const formatTime = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const panelStyle = isMobile
    ? {
      position: 'fixed', left: 0, right: 0, top: 0, bottom: '76px',
      background: '#0a0a0a', zIndex: 95, display: 'flex', flexDirection: 'column',
      borderTop: `1px solid ${BORDER}`,
    }
    : {
      position: 'absolute', top: 'calc(100% + 10px)', right: 0,
      width: '380px', maxHeight: '520px', background: isDark ? '#111' : '#fff',
      border: `1px solid ${BORDER}`, borderRadius: '16px',
      boxShadow: isDark ? '0 24px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(201,168,76,0.08)' : '0 20px 40px rgba(0,0,0,0.15)',
      zIndex: 999, overflow: 'hidden', display: 'flex', flexDirection: 'column',
    };

  return (
    <motion.div
      initial={isMobile ? { y: '100%' } : { opacity: 0, y: -10, scale: 0.97 }}
      animate={isMobile ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
      exit={isMobile ? { y: '100%' } : { opacity: 0, y: -10, scale: 0.97 }}
      transition={{ type: 'tween', duration: 0.28, ease: 'easeOut' }}
      style={panelStyle}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 18px', borderBottom: `1px solid ${BORDER}`,
        background: isDark ? 'linear-gradient(135deg,#0d0d0d,#111)' : '#f8f8f8', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${GOLD}18`, border: `1px solid ${GOLD}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiBell size={14} style={{ color: GOLD }} />
          </div>
          <div>
            <span style={{ color: isDark ? '#fff' : '#111', fontSize: '13px', fontWeight: '600', letterSpacing: '0.04em', display: 'block' }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px' }}>{unreadCount} unread</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              style={{
                background: `${GOLD}14`, border: `1px solid ${GOLD}30`, cursor: 'pointer',
                fontSize: '10px', color: GOLD, letterSpacing: '0.06em',
                padding: '5px 10px', borderRadius: '6px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = `${GOLD}25`}
              onMouseLeave={e => e.currentTarget.style.background = `${GOLD}14`}
            >
              Mark all read
            </button>
          )}
          {isMobile && (
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`,
              borderRadius: '50%', width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', cursor: 'pointer',
            }}>
              <FiX size={15} />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div style={{ overflowY: 'auto', flex: 1 }} className="t-scroll">
        {notifications.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '48px 24px', gap: '12px',
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: `${GOLD}10`, border: `1px solid ${GOLD}25`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FiBell size={22} style={{ color: `${GOLD}60` }} />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', margin: 0, textAlign: 'center', lineHeight: 1.6 }}>
              No notifications yet.<br />We'll let you know when something arrives.
            </p>
          </div>
        ) : (
          notifications.map((notif, idx) => {
            const cfg = NOTIF_TYPE_CONFIG[notif.type] || NOTIF_TYPE_CONFIG.info;
            const Icon = cfg.icon;
            const isUnread = !notif.isRead;
            return (
              <div
                key={notif._id}
                onClick={() => markRead(notif.id)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  padding: '14px 18px', cursor: 'pointer',
                  borderBottom: idx < notifications.length - 1 ? `1px solid ${BORDER}` : 'none',
                  background: isUnread ? `${cfg.color}07` : 'transparent',
                  transition: 'background 0.15s',
                  position: 'relative',
                }}
                onMouseEnter={e => e.currentTarget.style.background = isUnread ? `${cfg.color}12` : 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = isUnread ? `${cfg.color}07` : 'transparent'}
              >
                {isUnread && (
                  <span style={{
                    position: 'absolute', top: '18px', right: '16px',
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: cfg.color, flexShrink: 0,
                  }} />
                )}
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: cfg.bg, border: `1px solid ${cfg.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={15} style={{ color: cfg.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    color: isDark ? (isUnread ? '#fff' : 'rgba(245,245,245,0.70)') : (isUnread ? '#111' : '#555'),
                    fontSize: '13px', fontWeight: isUnread ? '600' : '400',
                    margin: '0 0 3px', lineHeight: 1.35,
                  }}>
                    {notif.title}
                  </p>
                  <p style={{
                    color: 'rgba(255,255,255,0.38)', fontSize: '11.5px',
                    margin: '0 0 5px', lineHeight: 1.45,
                  }}>
                    {notif.message}
                  </p>
                  <span style={{ color: `${GOLD}70`, fontSize: '10.5px', letterSpacing: '0.04em' }}>
                    {formatTime(notif.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function resolveImg(name) {
  if (SUBCAT_IMGS[name]) return SUBCAT_IMGS[name];
  if (SUB_CATEGORY_IMAGES?.[name]?.url) return SUB_CATEGORY_IMAGES[name].url;
  return null;
}

function SubCard({ name, color, imgH, onClick }) {
  const [err, setErr] = useState(false);
  const url = resolveImg(name);
  const hasImg = url && !err;

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column',
        padding: 0, borderRadius: '10px', overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.07)',
        cursor: 'pointer', background: '#0e0e0e',
        transition: 'transform 0.18s, box-shadow 0.18s, border-color 0.18s',
        textAlign: 'left',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = `0 10px 30px rgba(0,0,0,0.6), 0 0 0 1.5px ${color}50`;
        e.currentTarget.style.borderColor = `${color}50`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
      }}
    >
      <div style={{ width: '100%', height: `${imgH}px`, overflow: 'hidden', position: 'relative', backgroundColor: '#1a1a14', flexShrink: 0 }}>
        {hasImg ? (
          <img
            src={url} alt={name} loading="lazy"
            onError={() => setErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block', transition: 'transform 0.4s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.07)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: `linear-gradient(145deg,${color}18,#111)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <span style={{ color, fontSize: '22px', fontWeight: '700', fontFamily: 'Cinzel,serif', opacity: 0.65 }}>
              {name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
            </span>
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '28px', background: 'linear-gradient(to top,rgba(0,0,0,0.55),transparent)', pointerEvents: 'none' }} />
      </div>
      <div style={{ padding: '7px 8px 9px', background: '#0e0e0e' }}>
        <span style={{ fontSize: '11.5px', color: 'rgba(240,232,216,0.88)', fontWeight: 500, lineHeight: 1.25, letterSpacing: '0.01em', display: 'block' }}>
          {name}
        </span>
      </div>
    </button>
  );
}

function SidebarCatBtn({ cat, active, onClick }) {
  const cfg = CAT_CONFIG[cat];
  const [imgErr, setImgErr] = useState(false);
  const imgUrl = CAT_IMAGES[cat];

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '0',
        width: '100%', textAlign: 'left', padding: 0,
        background: active ? `linear-gradient(90deg,${cfg.color}20,${cfg.color}06)` : 'transparent',
        border: 'none',
        borderLeft: `3px solid ${active ? cfg.color : 'transparent'}`,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        cursor: 'pointer', transition: 'all 0.18s', overflow: 'hidden',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = `${cfg.color}0e`; e.currentTarget.style.borderLeftColor = `${cfg.color}55`; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeftColor = 'transparent'; } }}
    >
      <div style={{ width: '58px', height: '58px', flexShrink: 0, overflow: 'hidden', position: 'relative', margin: '10px 14px 10px 0' }}>
        <div style={{ width: '58px', height: '58px', borderRadius: '12px', overflow: 'hidden', border: `1.5px solid ${active ? cfg.color + '70' : cfg.color + '25'}`, boxShadow: active ? `0 0 14px ${cfg.color}28` : 'none', transition: 'all 0.18s' }}>
          {!imgErr && imgUrl ? (
            <img src={imgUrl} alt={cat} loading="lazy" onError={() => setImgErr(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg,${cfg.color}30,${cfg.color}10)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: cfg.color, fontSize: '18px', fontWeight: '700', fontFamily: 'Cinzel,serif' }}>{cat[0]}</span>
            </div>
          )}
        </div>
      </div>
      <div style={{ flex: 1, paddingRight: '16px', minWidth: 0 }}>
        <p style={{ color: active ? cfg.color : 'rgba(245,240,230,0.85)', fontSize: '14px', fontWeight: active ? '600' : '500', margin: 0, letterSpacing: '0.02em', transition: 'color 0.15s', whiteSpace: 'nowrap' }}>{cat}</p>
        <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '11px', margin: '2px 0 0', whiteSpace: 'nowrap' }}>{(SUB_CATEGORIES?.[cat] || []).length}+ items</p>
      </div>
      <FiChevronRight size={13} style={{ color: active ? cfg.color : 'rgba(255,255,255,0.18)', marginRight: '16px', flexShrink: 0, transition: 'color 0.15s' }} />
    </button>
  );
}

function MobileCatBtn({ cat, active, onClick }) {
  const c = CAT_CONFIG[cat];
  const [imgErr, setImgErr] = useState(false);
  const imgUrl = CAT_IMAGES[cat];

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '12px 4px', gap: '7px',
        background: active ? `${c.color}10` : 'transparent',
        border: 'none',
        borderBottom: 'rgba(201,168,76,0.10) 1px solid',
        borderLeft: `3px solid ${active ? c.color : 'transparent'}`,
        cursor: 'pointer', transition: 'all 0.15s', width: '100%',
      }}
    >
      <div style={{ width: '54px', height: '54px', borderRadius: '13px', overflow: 'hidden', border: `2px solid ${active ? c.color + '90' : c.color + '25'}`, boxShadow: active ? `0 0 16px ${c.color}30, 0 0 0 1px ${c.color}25` : 'none', transition: 'all 0.18s', flexShrink: 0 }}>
        {!imgErr && imgUrl ? (
          <img src={imgUrl} alt={cat} loading="lazy" onError={() => setImgErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg,${c.color}35,${c.color}10)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: c.color, fontSize: '20px', fontWeight: '700', fontFamily: 'Cinzel,serif' }}>{cat[0]}</span>
          </div>
        )}
      </div>
      <span style={{ fontSize: '10px', color: active ? c.color : 'rgba(210,195,160,0.60)', fontWeight: active ? '600' : '400', transition: 'color 0.15s', lineHeight: 1.2, textAlign: 'center' }}>
        {cat}
      </span>
    </button>
  );
}

// ─── Main Navbar ──────────────────────────────────────────────────────────────
export default function Navbar({ db = null }) {
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [activeCat, setActiveCat] = useState('Men');
  const [isDark] = useState(() => localStorage.getItem('trendora_theme') !== 'light');
  const [deskCatOpen, setDeskCatOpen] = useState(false);
  const [deskMoreOpen, setDeskMoreOpen] = useState(false);
  const [mobileAccountOpen, setMobileAccountOpen] = useState(false);

  // ── Notification state ──
  const [deskNotifOpen, setDeskNotifOpen] = useState(false);
  const [mobileNotifOpen, setMobileNotifOpen] = useState(false);
  const deskNotifRef = useRef(null);
  const deskMoreRef = useRef(null);

  const { user, logout, isAdmin } = useAuth();
  const isSeller = user?.role === 'seller';
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  // ── Hook: real-time notifications ──
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(
    user ? (user.uid || user._id?.toString?.() || String(user._id)) : null,
    db
  );
  const NAV_BG = isDark ? '#000000' : '#ffffff';
  const TEXT = isDark ? 'rgba(240,232,216,0.80)' : 'rgba(0,0,0,0.70)';
  const BORDER = isDark ? 'rgba(201,168,76,0.14)' : 'rgba(0,0,0,0.10)';

  useEffect(() => {
    document.body.style.backgroundColor = isDark ? '#000000' : '#ffffff';
    document.body.style.color = isDark ? '#f5f5f5' : '#111';
  }, [isDark]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    setUserMenuOpen(false); setCategoriesOpen(false);
    setDeskCatOpen(false); setDeskMoreOpen(false);
    setMobileAccountOpen(false); setMobileMoreOpen(false);
    setDeskNotifOpen(false); setMobileNotifOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const h = (e) => {
      if (deskMoreRef.current && !deskMoreRef.current.contains(e.target)) setDeskMoreOpen(false);
      if (deskNotifRef.current && !deskNotifRef.current.contains(e.target)) setDeskNotifOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    document.body.style.overflow = (categoriesOpen || deskCatOpen || mobileNotifOpen || mobileAccountOpen || mobileMoreOpen) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [categoriesOpen, deskCatOpen, mobileNotifOpen, mobileAccountOpen, mobileMoreOpen]);

  const isActivePath = p => location.pathname === p;
  const handleLogout = () => { logout(); setCategoriesOpen(false); setUserMenuOpen(false); };

  const cfg = CAT_CONFIG[activeCat] || CAT_CONFIG.Men;
  const subs = SUB_CATEGORIES?.[activeCat] || [];
  let grouped = {};
  try { grouped = getGroupedSubCategories ? getGroupedSubCategories(activeCat) : {}; } catch (_) { }
  const groupKeys = Object.keys(grouped);

  const dropdownStyle = {
    position: 'absolute', top: 'calc(100% + 10px)',
    backgroundColor: isDark ? '#111' : '#fff',
    border: `1px solid ${BORDER}`, borderRadius: '12px',
    boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.7)' : '0 20px 40px rgba(0,0,0,0.15)',
    zIndex: 999, overflow: 'hidden',
  };

  // ── Bell Button (reusable) ──
  const BellBtn = ({ isMobile: mob }) => (
    <button
      onClick={() => {
        if (mob) {
          setMobileNotifOpen(o => !o);
          setMobileAccountOpen(false);
          setCategoriesOpen(false);
          setMobileMoreOpen(false);
        } else {
          setDeskNotifOpen(o => !o);
          setDeskMoreOpen(false);
          setDeskCatOpen(false);
        }
      }}
      style={{
        position: 'relative',
        width: '38px',
        height: '38px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: (mob ? mobileNotifOpen : deskNotifOpen) ? `${GOLD}15` : 'none',
        border: `1px solid ${(mob ? mobileNotifOpen : deskNotifOpen) ? `${GOLD}40` : 'transparent'}`,
        cursor: 'pointer',
        color: (mob ? mobileNotifOpen : deskNotifOpen) ? GOLD : TEXT,
        borderRadius: '10px',
        transition: 'color 0.18s, background 0.18s, border-color 0.18s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = `${GOLD}12`; e.currentTarget.style.color = GOLD; e.currentTarget.style.borderColor = `${GOLD}30`; }}
      onMouseLeave={e => {
        e.currentTarget.style.background = (mob ? mobileNotifOpen : deskNotifOpen) ? `${GOLD}15` : 'none';
        e.currentTarget.style.color = (mob ? mobileNotifOpen : deskNotifOpen) ? GOLD : TEXT;
        e.currentTarget.style.borderColor = (mob ? mobileNotifOpen : deskNotifOpen) ? `${GOLD}40` : 'transparent';
      }}
    >
      <FiBell size={mob ? 20 : 17} />
      {unreadCount > 0 && (
        <span style={{
          position: 'absolute', top: mob ? '4px' : '5px', right: mob ? '4px' : '5px',
          background: 'linear-gradient(135deg,#f87171,#dc2626)', color: '#fff',
          fontSize: '8px', fontWeight: '800',
          minWidth: '15px', height: '15px',
          borderRadius: '999px', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          lineHeight: 1, padding: '0 3px',
          border: '1.5px solid #000',
          boxShadow: '0 0 8px rgba(248,113,113,0.5)',
        }}>
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );

  return (
    <>
      <style>{`
        .t-scroll::-webkit-scrollbar{width:4px;height:4px;}
        .t-scroll::-webkit-scrollbar-track{background:transparent;}
        .t-scroll::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.30);border-radius:4px;}
        .t-scroll::-webkit-scrollbar-thumb:hover{background:rgba(201,168,76,0.60);}
        button:focus{outline:none;}
        @keyframes catPulse { 0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,0.4);} 50%{box-shadow:0 0 0 6px rgba(201,168,76,0);} }
        .cat-btn-pulse { animation: catPulse 2.5s ease-in-out infinite; }
      `}</style>

      {/* ── Announcement bar ── */}
      <div style={{ backgroundColor: GOLD, color: '#000' }}
        className="text-center py-2 text-[11px] tracking-[0.18em] font-body uppercase px-4 font-semibold">
        Free shipping above ₹999 &nbsp;|&nbsp; New Collection: Autumn/Winter 2026
      </div>

      {/* ══ HEADER ══ */}
      <header className={`sticky top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'shadow-2xl' : ''}`} style={{ backgroundColor: NAV_BG }}>

        {/* ── Mobile ── */}
        <div className="md:hidden" style={{ backgroundColor: NAV_BG }}>
          <div className="relative flex items-center justify-between px-4 h-14" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <button onClick={() => setMobileMoreOpen(true)} className="w-9 h-9 flex items-center justify-center -ml-1 z-10" style={{ color: TEXT }}>
              <FiMenu size={22} />
            </button>
            <Link to="/" className="absolute inset-0 flex items-center justify-center gap-2 pointer-events-none">
              <span className="pointer-events-auto flex items-center gap-2">
                <img src={logo} alt="Trendorra" className="h-9 w-auto object-contain mix-blend-lighten" style={{ filter: 'brightness(1.1)' }} />
                <span className="font-accent text-[15px] tracking-[0.28em]" style={{ color: GOLD }}>TRENDORRA</span>
              </span>
            </Link>
            {/* 🔔 Mobile top-right: Bell */}
            <div className="-mr-1 z-10">
              <BellBtn isMobile={true} />
            </div>
          </div>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, position: 'relative', zIndex: 101 }}>
            <LiveSearch isDark={isDark} isDesktop={false} placeholder="Search products, brands..." />
          </div>
          <div className="overflow-x-auto t-scroll" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2 px-4 py-2 w-max">
              {['All', ...CATEGORIES].map(cat => {
                const c = CAT_CONFIG[cat]; const clr = c?.color || GOLD;
                const path = cat === 'All' ? '/shop' : `/shop/${cat.toLowerCase()}`;
                const active = cat === 'All' ? location.pathname === '/shop' : location.pathname === `/shop/${cat.toLowerCase()}`;
                return (
                  <button key={cat} onClick={() => navigate(path)}
                    style={{ flexShrink: 0, padding: '5px 16px', fontSize: '11px', letterSpacing: '0.10em', textTransform: 'uppercase', borderRadius: '999px', border: `1.5px solid ${active ? clr : clr + '50'}`, backgroundColor: active ? clr : 'transparent', color: active ? '#000' : isDark ? `${clr}cc` : clr, fontWeight: active ? '700' : '500', boxShadow: active ? `0 0 12px ${clr}40` : 'none', transition: 'all 0.18s', cursor: 'pointer' }}>
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Desktop ── */}
        <div className="hidden md:block" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center h-20 gap-4">
              <Link to="/" className="flex items-center gap-3 flex-shrink-0 mr-6">
                <img src={logo} alt="Trendorra" className="h-12 w-auto object-contain mix-blend-lighten" style={{ filter: 'brightness(1.1)' }} />
                <span className="font-accent text-[17px] tracking-[0.32em] whitespace-nowrap" style={{ color: GOLD }}>TRENDORRA</span>
              </Link>

              {/* ── UPGRADED Categories Button ── */}
              <button
                onClick={() => { setDeskCatOpen(o => !o); setDeskMoreOpen(false); setDeskNotifOpen(false); }}
                className={!deskCatOpen ? 'cat-btn-pulse' : ''}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '0 20px', height: '42px', borderRadius: '10px', flexShrink: 0,
                  background: deskCatOpen
                    ? `linear-gradient(135deg, ${GOLD}22, ${GOLD}0a)`
                    : `linear-gradient(135deg, rgba(201,168,76,0.14), rgba(201,168,76,0.04))`,
                  border: `1.5px solid ${deskCatOpen ? GOLD : 'rgba(201,168,76,0.45)'}`,
                  color: deskCatOpen ? GOLD : 'rgba(201,168,76,0.90)',
                  fontSize: '12px', fontFamily: 'inherit',
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  cursor: 'pointer', transition: 'all 0.22s ease',
                  whiteSpace: 'nowrap', fontWeight: '700',
                  position: 'relative', overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  if (!deskCatOpen) {
                    e.currentTarget.style.borderColor = GOLD;
                    e.currentTarget.style.color = GOLD;
                    e.currentTarget.style.background = `linear-gradient(135deg, rgba(201,168,76,0.22), rgba(201,168,76,0.08))`;
                  }
                }}
                onMouseLeave={e => {
                  if (!deskCatOpen) {
                    e.currentTarget.style.borderColor = 'rgba(201,168,76,0.45)';
                    e.currentTarget.style.color = 'rgba(201,168,76,0.90)';
                    e.currentTarget.style.background = `linear-gradient(135deg, rgba(201,168,76,0.14), rgba(201,168,76,0.04))`;
                  }
                }}
              >
                {/* shimmer line */}
                <div style={{ position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.12), transparent)', transform: 'skewX(-20deg)', pointerEvents: 'none', animation: deskCatOpen ? 'none' : 'shimmer 3s ease-in-out infinite' }} />
                <div style={{ width: '20px', height: '20px', borderRadius: '5px', background: `${GOLD}20`, border: `1px solid ${GOLD}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FiGrid size={11} style={{ color: GOLD }} />
                </div>
                <span>All Categories</span>
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: deskCatOpen ? `${GOLD}25` : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.22s',
                }}>
                  <FiChevronDown size={12} style={{ transition: 'transform 0.25s', transform: deskCatOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </div>
              </button>

              <div style={{ flex: 1, maxWidth: '560px', zIndex: 101, position: 'relative' }}>
                <LiveSearch isDark={isDark} isDesktop={true} />
              </div>

              {/* ── More dropdown ── */}
              <div ref={deskMoreRef} style={{ position: 'relative', flexShrink: 0 }}>
                <button onClick={() => { setDeskMoreOpen(o => !o); setDeskCatOpen(false); setDeskNotifOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', backgroundColor: deskMoreOpen ? `${GOLD}18` : 'transparent', border: `1px solid ${deskMoreOpen ? `${GOLD}40` : 'transparent'}`, color: deskMoreOpen ? GOLD : TEXT, fontSize: '13px', fontFamily: 'inherit', letterSpacing: '0.05em', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                  onMouseEnter={e => { if (!deskMoreOpen) { e.currentTarget.style.color = GOLD; e.currentTarget.style.backgroundColor = `${GOLD}10`; } }}
                  onMouseLeave={e => { if (!deskMoreOpen) { e.currentTarget.style.color = TEXT; e.currentTarget.style.backgroundColor = 'transparent'; } }}
                >
                  More <FiChevronDown size={13} style={{ transition: 'transform 0.2s', transform: deskMoreOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </button>
                {deskMoreOpen && (
                  <div style={{ ...dropdownStyle, right: 0, width: '260px' }}>
                    <div style={{ padding: '10px 16px', borderBottom: `1px solid ${BORDER}`, backgroundColor: isDark ? '#0d0d0d' : '#f8f8f8' }}>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>More Options</p>
                    </div>
                    {[
                      { to: isSeller ? '/seller/dashboard' : '/seller/register', icon: FiShoppingBag, label: isSeller ? 'Seller Dashboard' : 'Become a Seller', sub: isSeller ? (user?.sellerInfo?.businessName || 'My Store') : 'Sell on Trendorra', ic: GOLD, ib: `${GOLD}18` },
                      { to: '/orders', icon: FiTruck, label: 'Track Order', sub: 'Check delivery status', ic: '#60a5fa', ib: 'rgba(96,165,250,0.12)' },
                      { to: '/shop', icon: FiTag, label: 'Offers & Coupons', sub: 'Deals & discounts', ic: '#4ade80', ib: 'rgba(74,222,128,0.10)' },
                      { to: '/help', icon: FiHelpCircle, label: 'Help & Support', sub: 'FAQs & customer care', ic: 'rgba(255,255,255,0.5)', ib: 'rgba(255,255,255,0.06)' },
                    ].map(({ to, icon: Icon, label, sub, ic, ib }, i, arr) => (
                      <Link key={to} to={to} onClick={() => setDeskMoreOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : 'none', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div style={{ width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0, backgroundColor: ib, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={15} style={{ color: ic }} />
                        </div>
                        <div>
                          <p style={{ color: isDark ? '#fff' : '#111', fontSize: '13px', fontWeight: '500', margin: '0 0 1px', fontFamily: 'inherit' }}>{label}</p>
                          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0, fontFamily: 'inherit' }}>{sub}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Right icons ── */}
              <div className="flex items-center gap-1 ml-2">
                {/* Wishlist */}
                <Link to="/wishlist"
                  style={{ position: 'relative', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', border: '1px solid transparent', color: TEXT, transition: 'all 0.18s', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${GOLD}10`; e.currentTarget.style.borderColor = `${GOLD}25`; e.currentTarget.style.color = GOLD; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = TEXT; }}
                >
                  <FiHeart size={17} />
                  {wishlistCount > 0 && <span style={{ position: 'absolute', top: '5px', right: '5px', backgroundColor: GOLD, color: '#000', fontSize: '8px', fontWeight: '800', width: '14px', height: '14px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{wishlistCount}</span>}
                </Link>

                {/* Cart */}
                <Link to="/cart"
                  style={{ position: 'relative', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', border: '1px solid transparent', color: TEXT, transition: 'all 0.18s', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${GOLD}10`; e.currentTarget.style.borderColor = `${GOLD}25`; e.currentTarget.style.color = GOLD; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = TEXT; }}
                >
                  <FiShoppingBag size={17} />
                  {cartCount > 0 && <span style={{ position: 'absolute', top: '5px', right: '5px', backgroundColor: GOLD, color: '#000', fontSize: '8px', fontWeight: '800', width: '14px', height: '14px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartCount}</span>}
                </Link>

                {/* 🔔 Desktop Bell — always visible */}
                <div ref={deskNotifRef} style={{ position: 'relative' }}>
                  <BellBtn isMobile={false} />
                  <AnimatePresence>
                    {deskNotifOpen && (
                      <NotificationPanel
                        notifications={notifications}
                        userId={user?.uid || user?._id}
                        unreadCount={unreadCount}
                        markRead={markRead}
                        markAllRead={markAllRead}
                        onClose={() => setDeskNotifOpen(false)}
                        isDark={isDark}
                        isMobile={false}
                      />
                    )}
                  </AnimatePresence>
                </div>

                {user ? (
                  <div className="relative ml-1">
                    <button onClick={() => setUserMenuOpen(o => !o)}
                      style={{ width: '34px', height: '34px', color: '#000', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800', background: `linear-gradient(135deg, ${GOLD}, #a07830)`, border: `1.5px solid ${GOLD}`, cursor: 'pointer', boxShadow: `0 2px 12px ${GOLD}40`, letterSpacing: '0.04em' }}>
                      {user.name?.charAt(0).toUpperCase()}
                    </button>
                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}
                          className="absolute right-0 top-11 w-64 z-50 shadow-2xl"
                          style={{ backgroundColor: isDark ? '#111' : '#fff', border: `1px solid ${BORDER}`, borderRadius: '14px', overflow: 'hidden' }}>
                          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: isDark ? '#0d0d0d' : '#f8f8f8' }}>
                            <p className="font-body font-medium text-sm truncate" style={{ color: isDark ? '#f5f5f5' : '#111' }}>{user.name}</p>
                            <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{user.email}</p>
                          </div>
                          {[
                            { to: '/profile', icon: FiUser, label: 'My Profile' },
                            { to: '/orders', icon: FiPackage, label: 'My Orders' },
                            { to: '/wishlist', icon: FiHeart, label: 'Wishlist' },
                          ].map(({ to, icon: Icon, label }) => (
                            <Link key={to} to={to} className="flex items-center gap-3 px-4 py-3 text-sm"
                              style={{ color: isDark ? 'rgba(245,245,245,0.75)' : 'rgba(0,0,0,0.65)', borderBottom: `1px solid ${BORDER}` }}>
                              <Icon size={14} /> {label}
                            </Link>
                          ))}
                          {isSeller && (
                            <Link to="/seller/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm"
                              style={{ color: GOLD, borderBottom: `1px solid ${BORDER}` }}>
                              <FiShoppingBag size={14} /> Seller Dashboard
                            </Link>
                          )}
                          {isAdmin && (
                            <Link to="/admin" className="flex items-center gap-3 px-4 py-3 text-sm"
                              style={{ color: GOLD, borderBottom: `1px solid ${BORDER}` }}>
                              <FiSettings size={14} /> Admin Dashboard
                            </Link>
                          )}
                          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400">
                            <FiLogOut size={14} /> Logout
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link to="/login"
                    style={{ width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '4px', borderRadius: '10px', border: '1px solid transparent', color: TEXT, transition: 'all 0.18s', textDecoration: 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${GOLD}10`; e.currentTarget.style.borderColor = `${GOLD}25`; e.currentTarget.style.color = GOLD; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = TEXT; }}
                  >
                    <FiUser size={17} />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ══ DESKTOP MEGA MENU ══ */}
      <AnimatePresence>
        {deskCatOpen && (
          <>
            <motion.div key="desk-bg"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="hidden md:block fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(3px)' }}
              onClick={() => setDeskCatOpen(false)}
            />
            <motion.div key="desk-panel"
              initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              transition={{ type: 'tween', duration: 0.26, ease: 'easeOut' }}
              className="hidden md:flex fixed z-50"
              style={{ top: '130px', left: 0, right: 0, height: 'calc(100vh - 130px)', background: '#0a0a0a', borderTop: `2px solid ${GOLD}`, boxShadow: '0 24px 80px rgba(0,0,0,0.9)' }}
            >
              <div className="t-scroll" style={{ width: '260px', flexShrink: 0, background: '#040404', borderRight: '1px solid rgba(201,168,76,0.15)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '18px 18px 12px', borderBottom: '1px solid rgba(201,168,76,0.10)', flexShrink: 0 }}>
                  <p style={{ color: GOLD, fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', margin: 0, fontWeight: '700' }}>Shop Categories</p>
                </div>
                <button
                  onClick={() => { navigate('/shop'); setDeskCatOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0', padding: 0, width: '100%', textAlign: 'left', background: 'transparent', border: 'none', borderLeft: '3px solid transparent', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'all 0.15s', overflow: 'hidden' }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${GOLD}10`; e.currentTarget.style.borderLeftColor = `${GOLD}55`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeftColor = 'transparent'; }}
                >
                  <div style={{ width: '58px', height: '58px', flexShrink: 0, margin: '10px 14px 10px 0' }}>
                    <div style={{ width: '58px', height: '58px', borderRadius: '12px', background: `${GOLD}15`, border: `1.5px solid ${GOLD}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FiGrid size={22} style={{ color: GOLD }} />
                    </div>
                  </div>
                  <div style={{ flex: 1, paddingRight: '16px' }}>
                    <p style={{ color: 'rgba(245,240,230,0.85)', fontSize: '14px', fontWeight: '500', margin: 0, whiteSpace: 'nowrap' }}>All Categories</p>
                    <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '11px', margin: '2px 0 0', whiteSpace: 'nowrap' }}>Browse everything</p>
                  </div>
                  <FiChevronRight size={13} style={{ color: 'rgba(255,255,255,0.18)', marginRight: '16px', flexShrink: 0 }} />
                </button>
                {CATEGORIES.map(cat => (
                  <SidebarCatBtn key={cat} cat={cat} active={activeCat === cat} onClick={() => setActiveCat(cat)} />
                ))}
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ flexShrink: 0, padding: '14px 28px', background: `linear-gradient(90deg,${cfg.color}12,transparent)`, borderBottom: '1px solid rgba(201,168,76,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '14px', overflow: 'hidden', border: `2px solid ${cfg.color}55`, boxShadow: `0 0 18px ${cfg.color}22`, flexShrink: 0 }}>
                      <img src={CAT_IMAGES[activeCat]} alt={activeCat} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 300, margin: 0, letterSpacing: '0.04em' }}>{activeCat}</h2>
                        <span style={{ fontSize: '9px', letterSpacing: '0.18em', color: cfg.color, background: `${cfg.color}18`, border: `1px solid ${cfg.color}35`, padding: '3px 10px', borderRadius: '999px', textTransform: 'uppercase', fontWeight: '600' }}>{cfg.tag}</span>
                      </div>
                      <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '12px', margin: '3px 0 0' }}>{cfg.count}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end', flex: 1 }}>
                    {(QUICK_FILTERS[activeCat] || []).map(f => (
                      <button key={f}
                        onClick={() => { navigate(`/shop?category=${activeCat}&filter=${encodeURIComponent(f)}`); setDeskCatOpen(false); }}
                        style={{ padding: '5px 14px', borderRadius: '999px', fontSize: '11px', background: 'transparent', border: `1px solid ${cfg.color}45`, color: `${cfg.color}cc`, cursor: 'pointer', transition: 'all 0.18s', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                        onMouseEnter={e => { e.currentTarget.style.background = cfg.color; e.currentTarget.style.color = '#000'; e.currentTarget.style.borderColor = cfg.color; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = `${cfg.color}cc`; e.currentTarget.style.borderColor = `${cfg.color}45`; }}
                      >{f}</button>
                    ))}
                    <button onClick={() => { navigate(`/shop/${activeCat.toLowerCase()}`); setDeskCatOpen(false); }}
                      style={{ padding: '6px 18px', borderRadius: '999px', fontSize: '11px', background: `linear-gradient(135deg,${GOLD},#a07830)`, border: 'none', color: '#000', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: `0 4px 16px ${GOLD}35`, whiteSpace: 'nowrap' }}>
                      Shop All <FiArrowRight size={12} />
                    </button>
                  </div>
                </div>

                <div className="t-scroll" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 40px' }}>
                  {groupKeys.length > 0
                    ? groupKeys.map(group => (
                      <div key={group} style={{ marginBottom: '34px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                          <div style={{ width: '4px', height: '18px', borderRadius: '2px', background: `linear-gradient(to bottom,${cfg.color},${cfg.color}50)`, flexShrink: 0 }} />
                          <p style={{ color: cfg.color, fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', margin: 0, fontWeight: '700' }}>{group}</p>
                          <div style={{ flex: 1, height: '1px', background: 'rgba(201,168,76,0.10)' }} />
                          <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: '10px' }}>{grouped[group].length} items</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(135px,1fr))', gap: '12px' }}>
                          {grouped[group].map(name => (
                            <SubCard key={name} name={name} color={cfg.color} imgH={115}
                              onClick={() => { navigate(`/shop?category=${activeCat}&search=${encodeURIComponent(name)}`); setDeskCatOpen(false); }} />
                          ))}
                        </div>
                      </div>
                    ))
                    : (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                          <div style={{ width: '4px', height: '18px', borderRadius: '2px', background: cfg.color }} />
                          <p style={{ color: cfg.color, fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', margin: 0, fontWeight: '700' }}>All {activeCat}</p>
                          <div style={{ flex: 1, height: '1px', background: 'rgba(201,168,76,0.10)' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(135px,1fr))', gap: '12px' }}>
                          {subs.map(sub => {
                            const name = typeof sub === 'string' ? sub : sub.name;
                            return <SubCard key={name} name={name} color={cfg.color} imgH={115}
                              onClick={() => { navigate(`/shop?category=${activeCat}&search=${encodeURIComponent(name)}`); setDeskCatOpen(false); }} />;
                          })}
                        </div>
                      </div>
                    )
                  }
                </div>
              </div>

              <button onClick={() => setDeskCatOpen(false)}
                style={{ position: 'absolute', top: '14px', right: '18px', width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', transition: 'all 0.18s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.15)'; e.currentTarget.style.color = '#f87171'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}>
                <FiX size={16} />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══ MOBILE BOTTOM NAV ══ */}
      <div className="md:hidden fixed z-[109]" style={{ bottom: 0, left: 0, right: 0, height: '110px', background: 'linear-gradient(to top, #000000 55%, transparent 100%)', pointerEvents: 'none' }} />
      <nav className="md:hidden fixed z-[110]" style={{ bottom: '12px', left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 28px)', maxWidth: '390px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '6px 8px', backgroundColor: '#000000', borderRadius: '100px', border: '1px solid rgba(201,168,76,0.20)', boxShadow: '0 4px 28px rgba(0,0,0,0.92)', backdropFilter: 'blur(24px)' }}>

          <button onClick={() => { setMobileAccountOpen(false); setCategoriesOpen(false); setMobileMoreOpen(false); setMobileNotifOpen(false); navigate('/home'); }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '6px 14px', background: 'none', border: 'none', cursor: 'pointer', position: 'relative', minWidth: '52px' }}>
            {isActivePath('/home') && <span style={{ position: 'absolute', inset: 0, borderRadius: '999px', backgroundColor: GOLD_GLOW }} />}
            <FiHome size={20} strokeWidth={isActivePath('/home') ? 2.5 : 1.5} style={{ color: isActivePath('/home') ? GOLD : TEXT }} />
            <span style={{ fontSize: '10px', color: isActivePath('/home') ? GOLD : TEXT, fontWeight: '500' }}>Home</span>
          </button>

          <button onClick={() => { setCategoriesOpen(o => !o); setMobileAccountOpen(false); setMobileMoreOpen(false); setMobileNotifOpen(false); }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '6px 14px', background: 'none', border: 'none', cursor: 'pointer', position: 'relative', minWidth: '52px' }}>
            <span style={{ position: 'absolute', inset: 0, borderRadius: '999px', backgroundColor: categoriesOpen ? GOLD : GOLD_GLOW, transition: 'background 0.18s' }} />
            <FiGrid size={20} strokeWidth={categoriesOpen ? 2.5 : 1.5} style={{ color: categoriesOpen ? '#000' : TEXT, position: 'relative', zIndex: 1 }} />
            <span style={{ fontSize: '10px', color: categoriesOpen ? '#000' : TEXT, fontWeight: '500', position: 'relative', zIndex: 1 }}>Categories</span>
          </button>

          <button onClick={() => { if (!user) navigate('/login'); else { setMobileAccountOpen(o => !o); setCategoriesOpen(false); setMobileMoreOpen(false); setMobileNotifOpen(false); } }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', position: 'relative', minWidth: '52px' }}>
            <span style={{ position: 'absolute', inset: 0, borderRadius: '999px', backgroundColor: mobileAccountOpen ? GOLD : GOLD_GLOW }} />
            {user
              ? <span style={{ color: mobileAccountOpen ? '#000' : '#fff', fontSize: '15px', fontWeight: '700', position: 'relative', zIndex: 1, lineHeight: 1, height: '20px', display: 'flex', alignItems: 'center' }}>{user.name?.charAt(0).toUpperCase()}</span>
              : <FiUser size={20} strokeWidth={1.5} style={{ color: '#fff', position: 'relative', zIndex: 1 }} />
            }
            <span style={{ fontSize: '10px', color: mobileAccountOpen ? '#000' : 'rgba(255,255,255,0.8)', fontWeight: '500', position: 'relative', zIndex: 1 }}>Account</span>
          </button>

          <Link to="/cart" onClick={() => { setMobileAccountOpen(false); setCategoriesOpen(false); setMobileMoreOpen(false); setMobileNotifOpen(false); }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '6px 14px', position: 'relative', minWidth: '52px', textDecoration: 'none' }}>
            {isActivePath('/cart') && <span style={{ position: 'absolute', inset: 0, borderRadius: '999px', backgroundColor: GOLD_GLOW }} />}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <FiShoppingCart size={20} strokeWidth={isActivePath('/cart') ? 2.5 : 1.5} style={{ color: isActivePath('/cart') ? GOLD : TEXT }} />
              {cartCount > 0 && <span style={{ position: 'absolute', top: '-6px', right: '-8px', backgroundColor: GOLD, color: '#000', fontSize: '9px', width: '14px', height: '14px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>{cartCount}</span>}
            </div>
            <span style={{ fontSize: '10px', color: isActivePath('/cart') ? GOLD : TEXT, fontWeight: '500', position: 'relative', zIndex: 1 }}>Cart</span>
          </Link>
        </div>
      </nav>

      {/* ══ MOBILE NOTIFICATIONS OVERLAY ══ */}
      <AnimatePresence>
        {mobileNotifOpen && (
          <>
            <motion.div key="notif-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="fixed z-[90] md:hidden" style={{ top: 0, left: 0, right: 0, bottom: '76px', background: 'rgba(0,0,0,0.88)' }}
              onClick={() => setMobileNotifOpen(false)} />
            <NotificationPanel
              notifications={notifications}
              userId={user?.uid || user?._id}
              unreadCount={unreadCount}
              markRead={markRead}
              markAllRead={markAllRead}
              onClose={() => setMobileNotifOpen(false)}
              isDark={isDark}
              isMobile={true}
            />
          </>
        )}
      </AnimatePresence>

      {/* ══ MOBILE ACCOUNT OVERLAY ══ */}
      <AnimatePresence>
        {mobileAccountOpen && user && (
          <>
            <motion.div key="acc-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="fixed z-[90] md:hidden" style={{ top: 0, left: 0, right: 0, bottom: '76px', background: 'rgba(0,0,0,0.85)' }}
              onClick={() => setMobileAccountOpen(false)} />
            <motion.div key="acc-panel" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'tween', duration: 0.32, ease: 'easeOut' }}
              className="fixed left-0 right-0 z-[95] md:hidden flex flex-col"
              style={{ top: 0, bottom: '76px', background: '#0a0a0a', borderTop: `1px solid ${BORDER}` }}>
              <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#050505', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '50%', backgroundColor: `${GOLD}22`, border: `1px solid ${GOLD}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: GOLD, fontSize: '20px', fontWeight: '700' }}>{user.name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <h2 style={{ color: '#fff', fontSize: '17px', fontWeight: '600', margin: '0 0 3px', letterSpacing: '0.04em' }}>{user.name}</h2>
                    <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '12px', margin: 0 }}>{user.email}</p>
                  </div>
                </div>
                <button onClick={() => setMobileAccountOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, borderRadius: '50%', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
                  <FiX size={16} />
                </button>
              </div>
              <div className="t-scroll" style={{ overflowY: 'auto', flex: 1, padding: '16px' }}>
                <div style={{ backgroundColor: '#111', borderRadius: '12px', border: `1px solid ${BORDER}`, overflow: 'hidden', marginBottom: '16px' }}>
                  {[
                    { to: '/profile', icon: FiUser, label: 'My Profile', desc: 'Edit details' },
                    { to: '/orders', icon: FiPackage, label: 'My Orders', desc: 'Track orders' },
                    { to: '/wishlist', icon: FiHeart, label: 'Wishlist', desc: 'Saved items' },
                  ].map(({ to, icon: Icon, label, desc }, i) => (
                    <Link key={to} to={to} onClick={() => setMobileAccountOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '15px 16px', textDecoration: 'none', borderBottom: i < 2 ? `1px solid ${BORDER}` : 'none' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${GOLD}12`, border: `1px solid ${GOLD}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={15} style={{ color: GOLD }} />
                      </div>
                      <div>
                        <p style={{ color: '#f5f5f5', fontSize: '14px', fontWeight: '500', margin: 0 }}>{label}</p>
                        <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: '11px', margin: '2px 0 0' }}>{desc}</p>
                      </div>
                      <FiChevronRight size={14} style={{ color: 'rgba(255,255,255,0.18)', marginLeft: 'auto', flexShrink: 0 }} />
                    </Link>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  {[
                    { to: '/privacy-policy', label: 'Privacy Policy', icon: FiShield },
                    { to: '/terms-of-service', label: 'Terms of Service', icon: FiFileText },
                    { to: '/refund-policy', label: 'Refund Policy', icon: FiRefreshCw },
                    { to: '/shipping-policy', label: 'Shipping Policy', icon: FiTruck },
                  ].map(({ to, label, icon: Icon }) => (
                    <Link key={to} to={to} onClick={() => setMobileAccountOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '12px', background: '#111', border: `1px solid ${BORDER}`, borderRadius: '10px', textDecoration: 'none' }}>
                      <Icon size={13} style={{ color: 'rgba(255,255,255,0.38)', flexShrink: 0 }} />
                      <span style={{ color: 'rgba(255,255,255,0.48)', fontSize: '11px', lineHeight: 1.2 }}>{label}</span>
                    </Link>
                  ))}
                </div>
                <button onClick={() => { handleLogout(); setMobileAccountOpen(false); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '15px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.20)', borderRadius: '12px', cursor: 'pointer' }}>
                  <FiLogOut size={15} style={{ color: '#f87171' }} />
                  <span style={{ color: '#f87171', fontSize: '14px', fontWeight: '600' }}>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══ MOBILE CATEGORIES OVERLAY ══ */}
      <AnimatePresence>
        {categoriesOpen && (
          <>
            <motion.div key="cat-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="fixed z-[90] md:hidden" style={{ top: 0, left: 0, right: 0, bottom: '76px', background: 'rgba(0,0,0,0.90)' }}
              onClick={() => setCategoriesOpen(false)} />
            <motion.div key="cat-panel" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'tween', duration: 0.32, ease: 'easeOut' }}
              className="fixed left-0 right-0 z-[95] md:hidden flex flex-col"
              style={{ top: 0, bottom: '76px', background: '#000', overflow: 'hidden' }}>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#0a0a0a', borderBottom: `1px solid ${GOLD}28`, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src={logo} alt="Trendorra" style={{ width: '30px', height: '30px', objectFit: 'contain', filter: 'brightness(1.15)', mixBlendMode: 'lighten' }} />
                  <span style={{ color: GOLD, fontSize: '13px', letterSpacing: '0.22em', fontFamily: 'Cinzel, serif' }}>TRENDORRA</span>
                </div>
                <button onClick={() => setCategoriesOpen(false)} style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(240,232,216,0.7)', cursor: 'pointer' }}>
                  <FiX size={15} />
                </button>
              </div>

              <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <div className="t-scroll" style={{ width: '96px', flexShrink: 0, background: '#050505', overflowY: 'auto', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${GOLD}18` }}>
                  <button onClick={() => { navigate('/shop'); setCategoriesOpen(false); }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '13px 4px', gap: '6px', background: 'transparent', border: 'none', borderBottom: `1px solid ${GOLD}10`, borderLeft: '3px solid transparent', cursor: 'pointer' }}>
                    <div style={{ width: '54px', height: '54px', borderRadius: '13px', background: `${GOLD}14`, border: `1.5px solid ${GOLD}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FiGrid size={22} style={{ color: GOLD }} />
                    </div>
                    <span style={{ fontSize: '10px', color: `${GOLD}80`, textAlign: 'center' }}>All</span>
                  </button>
                  {CATEGORIES.map(cat => (
                    <MobileCatBtn key={cat} cat={cat} active={activeCat === cat} onClick={() => setActiveCat(cat)} />
                  ))}
                </div>

                <div style={{ width: '1px', flexShrink: 0, background: `linear-gradient(to bottom,transparent,${GOLD}55,${GOLD}75,${GOLD}55,transparent)`, position: 'relative' }}>
                  <motion.div animate={{ y: ['0%', '85%', '0%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ position: 'absolute', top: '5%', width: '5px', height: '28px', borderRadius: '3px', left: '-2px', background: `linear-gradient(to bottom,transparent,${GOLD},#dbbe6a,${GOLD},transparent)`, boxShadow: `0 0 10px ${GOLD}80`, zIndex: 2 }} />
                </div>

                <div className="t-scroll" style={{ flex: 1, overflowY: 'auto', background: '#000' }}>
                  <AnimatePresence mode="wait">
                    <motion.div key={activeCat} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }}>
                      <div
                        onClick={() => { navigate(`/shop/${activeCat.toLowerCase()}`); setCategoriesOpen(false); }}
                        style={{ margin: '10px 10px 0', borderRadius: '14px', overflow: 'hidden', position: 'relative', cursor: 'pointer', height: '100px' }}
                      >
                        <img src={CAT_IMAGES[activeCat]} alt={activeCat} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right,rgba(0,0,0,0.72) 0%,rgba(0,0,0,0.20) 100%)' }} />
                        <div style={{ position: 'absolute', inset: 0, borderRadius: '14px', border: `1px solid ${cfg.color}35` }} />
                        <div style={{ position: 'absolute', left: '14px', bottom: '14px' }}>
                          <span style={{ display: 'inline-block', fontSize: '8px', letterSpacing: '0.18em', textTransform: 'uppercase', color: cfg.color, background: `${cfg.color}20`, border: `1px solid ${cfg.color}40`, padding: '2px 9px', borderRadius: '999px', marginBottom: '5px' }}>
                            {cfg.tag} · {cfg.count}
                          </span>
                          <h3 style={{ fontSize: '20px', fontWeight: 400, color: '#fff', margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>
                            {activeCat} <span style={{ color: cfg.color, fontSize: '13px' }}>→</span>
                          </h3>
                        </div>
                      </div>

                      <div style={{ padding: '11px 10px 7px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ height: '1px', flex: 1, background: `${GOLD}18` }} />
                        <span style={{ fontSize: '8px', letterSpacing: '0.18em', color: `${GOLD}55`, textTransform: 'uppercase', fontWeight: '600' }}>Shop by style</span>
                        <div style={{ height: '1px', flex: 1, background: `${GOLD}18` }} />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', padding: '0 10px 16px' }}>
                        {subs.map((sub, idx) => {
                          const name = typeof sub === 'string' ? sub : sub.name;
                          return (
                            <motion.div key={name} initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.11, delay: idx * 0.012 }}>
                              <SubCard name={name} color={cfg.color} imgH={82}
                                onClick={() => { navigate(`/shop?category=${activeCat}&search=${encodeURIComponent(name)}`); setCategoriesOpen(false); }} />
                            </motion.div>
                          );
                        })}
                      </div>

                      <div style={{ padding: '0 10px 20px' }}>
                        <button onClick={() => { navigate(`/shop/${activeCat.toLowerCase()}`); setCategoriesOpen(false); }}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: '12px', background: `linear-gradient(135deg,${cfg.color}22,${cfg.color}08)`, border: `1px solid ${cfg.color}30`, cursor: 'pointer' }}>
                          <div>
                            <p style={{ fontSize: '9px', color: `${cfg.color}70`, margin: '0 0 3px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Full collection</p>
                            <p style={{ fontSize: '14px', color: '#f5f5f5', margin: 0, fontWeight: 300 }}>Shop all {activeCat}</p>
                          </div>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `linear-gradient(135deg,${GOLD},#a07830)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <FiChevronRight size={16} style={{ color: '#000' }} />
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══ MOBILE MORE OVERLAY ══ */}
      <AnimatePresence>
        {mobileMoreOpen && (
          <>
            <motion.div key="more-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="fixed z-[90] md:hidden" style={{ top: 0, left: 0, right: 0, bottom: '76px', background: 'rgba(0,0,0,0.86)' }}
              onClick={() => setMobileMoreOpen(false)} />
            <motion.div key="more-panel" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'tween', duration: 0.32, ease: 'easeOut' }}
              className="fixed left-0 right-0 z-[95] md:hidden flex flex-col"
              style={{ top: 0, bottom: '76px', background: '#0a0a0a', borderTop: `1px solid ${BORDER}`, overflowY: 'auto' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#050505', flexShrink: 0 }}>
                <h2 style={{ color: '#fff', fontSize: '17px', fontWeight: '600', margin: 0, fontFamily: 'Cinzel, serif', letterSpacing: '0.05em' }}>More Options</h2>
                <button onClick={() => setMobileMoreOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, borderRadius: '50%', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
                  <FiX size={16} />
                </button>
              </div>
              <div style={{ padding: '20px 16px', flex: 1 }}>
                <div style={{ backgroundColor: '#111', borderRadius: '12px', border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
                  {[
                    { to: isSeller ? '/seller/dashboard' : '/seller/register', icon: FiShoppingBag, label: isSeller ? 'Seller Dashboard' : 'Become a Seller', sub: isSeller ? (user?.sellerInfo?.businessName || 'My Store') : 'Sell on Trendorra', ic: GOLD, ib: `${GOLD}15` },
                    { to: '/orders', icon: FiTruck, label: 'Track Order', sub: 'Check delivery status', ic: '#60a5fa', ib: 'rgba(96,165,250,0.12)' },
                    { to: '/shop', icon: FiTag, label: 'Offers & Coupons', sub: 'Deals & discounts', ic: '#4ade80', ib: 'rgba(74,222,128,0.10)' },
                    { to: '/help', icon: FiHelpCircle, label: 'Help & Support', sub: 'FAQs & customer care', ic: 'rgba(255,255,255,0.55)', ib: 'rgba(255,255,255,0.06)' },
                  ].map(({ to, icon: Icon, label, sub, ic, ib }, i, arr) => (
                    <Link key={to} to={to} onClick={() => setMobileMoreOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '15px 16px', textDecoration: 'none', borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: ib, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={18} style={{ color: ic }} />
                      </div>
                      <div>
                        <p style={{ color: '#f5f5f5', fontSize: '14px', fontWeight: '500', margin: '0 0 2px' }}>{label}</p>
                        <p style={{ color: 'rgba(255,255,255,0.33)', fontSize: '11px', margin: 0 }}>{sub}</p>
                      </div>
                      <FiChevronRight size={14} style={{ color: 'rgba(255,255,255,0.18)', marginLeft: 'auto', flexShrink: 0 }} />
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}