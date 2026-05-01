import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import {
  FiSearch, FiHeart, FiShoppingBag, FiUser, FiX,
  FiLogOut, FiPackage, FiSettings, FiChevronRight,
  FiHome, FiGrid, FiShoppingCart, FiChevronDown,
  FiHelpCircle, FiFileText, FiShield, FiTruck,
  FiRefreshCw, FiTag, FiMessageCircle, FiMenu,
  FiFilter, FiStar, FiPercent, FiArrowRight,
} from 'react-icons/fi';
import logo from '../../assets/logo.png';
import LiveSearch from './LiveSearch';
import {
  SUB_CATEGORIES,
  SUB_CATEGORY_IMAGES,
  CATEGORY_META,
  getGroupedSubCategories,
} from '../../constants/categories';

const categories = ['Men', 'Women', 'Streetwear', 'Accessories'];
const subCategories = SUB_CATEGORIES;

// ─── SVG Category Icons ───────────────────────────────────────────────────────
const CategoryIcons = {
  All: ({ color = '#C9A84C', size = 26 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="1.5" fill={color} opacity="0.9"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5" fill={color} opacity="0.6"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5" fill={color} opacity="0.6"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5" fill={color} opacity="0.9"/>
    </svg>
  ),
  Men: ({ color = '#C9A84C', size = 26 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="6" r="3" fill={color} opacity="0.9"/>
      <path d="M8 10h8l1.5 10H14l-2-6-2 6H4.5L8 10z" fill={color} opacity="0.75"/>
    </svg>
  ),
  Women: ({ color = '#d4827a', size = 26 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="5.5" r="2.8" fill={color} opacity="0.9"/>
      <path d="M7 10c0 0 1.5-1.5 5-1.5s5 1.5 5 1.5l2 6H15l-1 5H10l-1-5H7L7 10z" fill={color} opacity="0.75"/>
    </svg>
  ),
  Streetwear: ({ color = '#8899dd', size = 26 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 10c0-3 3-6 8-6s8 3 8 6v1H4v-1z" fill={color} opacity="0.9"/>
      <rect x="3" y="11" width="18" height="1.5" rx="0.75" fill={color} opacity="0.5"/>
      <path d="M8 12v7a1 1 0 001 1h6a1 1 0 001-1v-7H8z" fill={color} opacity="0.65"/>
    </svg>
  ),
  Accessories: ({ color = '#7ab870', size = 26 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="5" y="9" width="14" height="9" rx="2" fill={color} opacity="0.7"/>
      <path d="M9 9V7a3 3 0 016 0v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.9"/>
      <circle cx="12" cy="13.5" r="1.5" fill={color} opacity="0.9"/>
    </svg>
  ),
};

const HeroIllustrations = {
  Men: ({ color = '#C9A84C' }) => (
    <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
      <circle cx="35" cy="18" r="10" fill={color} opacity="0.15"/>
      <circle cx="35" cy="18" r="7" fill={color} opacity="0.30"/>
      <path d="M20 32h30l4 30H46l-11-18-11 18H16L20 32z" fill={color} opacity="0.20"/>
      <path d="M22 32h26l3 28H44L35 42l-9 18H17L22 32z" fill={color} opacity="0.40"/>
      <circle cx="35" cy="18" r="6" fill={color} opacity="0.70"/>
    </svg>
  ),
  Women: ({ color = '#d4827a' }) => (
    <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
      <circle cx="35" cy="15" r="9" fill={color} opacity="0.25"/>
      <circle cx="35" cy="15" r="6" fill={color} opacity="0.65"/>
      <path d="M20 28c0 0 4-4 15-4s15 4 15 4l5 16H47l-3 14H26l-3-14H15L20 28z" fill={color} opacity="0.38"/>
    </svg>
  ),
  Streetwear: ({ color = '#8899dd' }) => (
    <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
      <path d="M12 26c0-7 7-14 23-14s23 7 23 14v2H12v-2z" fill={color} opacity="0.35"/>
      <rect x="9" y="29" width="52" height="3" rx="1.5" fill={color} opacity="0.45"/>
      <path d="M14 32v20a2 2 0 002 2h38a2 2 0 002-2V32H14z" fill={color} opacity="0.30"/>
    </svg>
  ),
  Accessories: ({ color = '#7ab870' }) => (
    <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
      <rect x="17" y="30" width="36" height="24" rx="4" fill={color} opacity="0.30"/>
      <path d="M26 30V24a9 9 0 0118 0v6" stroke={color} strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.55"/>
      <circle cx="35" cy="41" r="4" fill={color} opacity="0.70"/>
    </svg>
  ),
};

const SubIcons = {
  'T-Shirts':       ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 7l4-3h10l4 3-3 3v10H6V10L3 7z" fill={c} opacity="0.85"/><path d="M9 4c0 1.5-1.5 3-3 3M15 4c0 1.5 1.5 3 3 3" stroke={c} strokeWidth="1.5" fill="none" opacity="0.5"/></svg>,
  'Casual Shirts':  ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 7l4-3h10l4 3-3 3v10H6V10L3 7z" fill={c} opacity="0.70"/><line x1="12" y1="7" x2="12" y2="14" stroke={c} strokeWidth="1" opacity="0.6"/></svg>,
  'Formal Shirts':  ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 7l4-3h10l4 3-3 3v10H6V10L3 7z" fill={c} opacity="0.75"/><line x1="12" y1="6" x2="12" y2="17" stroke={c} strokeWidth="1.2" opacity="0.65"/></svg>,
  'Shirts':         ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 7l4-3h10l4 3-3 3v10H6V10L3 7z" fill={c} opacity="0.70"/><line x1="12" y1="7" x2="12" y2="14" stroke={c} strokeWidth="1" opacity="0.6"/></svg>,
  'Hoodies & Sweatshirts': ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 8l4-4 2 3-1 2v9H4V11L3 8z" fill={c} opacity="0.80"/><path d="M21 8l-4-4-2 3 1 2v9h4V11l1-3z" fill={c} opacity="0.80"/><rect x="8" y="4" width="8" height="14" rx="2" fill={c} opacity="0.60"/></svg>,
  'Jackets & Coats': ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 6l4-3 2 4-1 2v8H4V9L3 6z" fill={c} opacity="0.80"/><path d="M21 6l-4-3-2 4 1 2v8h4V9l1-3z" fill={c} opacity="0.80"/><rect x="8" y="3" width="8" height="14" rx="1" fill={c} opacity="0.55"/></svg>,
  'Blazers':        ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 6l4-3 2 4-1 2v8H4V9L3 6z" fill={c} opacity="0.90"/><path d="M21 6l-4-3-2 4 1 2v8h4V9l1-3z" fill={c} opacity="0.90"/><rect x="8" y="3" width="8" height="14" rx="1" fill={c} opacity="0.65"/><path d="M12 3l-2 5h4l-2-5z" fill={c} opacity="0.90"/></svg>,
  'Sweaters':       ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 8l4-4 2 3-1 2v9H4V11L3 8z" fill={c} opacity="0.75"/><path d="M21 8l-4-4-2 3 1 2v9h4V11l1-3z" fill={c} opacity="0.75"/><rect x="8" y="4" width="8" height="14" rx="2" fill={c} opacity="0.55"/></svg>,
  'Jackets':        ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 6l4-3 2 4-1 2v8H4V9L3 6z" fill={c} opacity="0.80"/><path d="M21 6l-4-3-2 4 1 2v8h4V9l1-3z" fill={c} opacity="0.80"/><rect x="8" y="3" width="8" height="14" rx="1" fill={c} opacity="0.55"/></svg>,
  'Suits':          ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 6l4-3 2 4-1 2v8H4V9L3 6z" fill={c} opacity="0.90"/><path d="M21 6l-4-3-2 4 1 2v8h4V9l1-3z" fill={c} opacity="0.90"/><rect x="8" y="3" width="8" height="14" rx="1" fill={c} opacity="0.65"/><path d="M12 3l-2 5h4l-2-5z" fill={c} opacity="0.90"/></svg>,
  'Jeans':          ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M5 3h14v7l-3 11H13l-1-6-1 6H8L5 10V3z" fill={c} opacity="0.80"/><line x1="12" y1="3" x2="12" y2="10" stroke={c} strokeWidth="1.5" opacity="0.35"/></svg>,
  'Trousers':       ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M5 3h14v9l-3 9H13l-1-6-1 6H8L5 12V3z" fill={c} opacity="0.80"/><line x1="12" y1="3" x2="12" y2="12" stroke={c} strokeWidth="1.5" opacity="0.4"/></svg>,
  'Track Pants':    ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M5 3h14v8l-2 9H13l-1-5-1 5H9L7 11V3z" fill={c} opacity="0.80"/><line x1="5" y1="5" x2="19" y2="5" stroke={c} strokeWidth="1" opacity="0.40"/></svg>,
  'Joggers':        ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M5 3h14v8l-2 9H13l-1-5-1 5H9L7 11V3z" fill={c} opacity="0.80"/><line x1="5" y1="6" x2="19" y2="6" stroke={c} strokeWidth="1" opacity="0.35"/></svg>,
  'Shorts':         ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M4 4h16v7l-3 7H13l-1-4-1 4H7l-3-7V4z" fill={c} opacity="0.80"/><line x1="12" y1="4" x2="12" y2="11" stroke={c} strokeWidth="1.5" opacity="0.4"/></svg>,
  'Cargo Pants':    ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M5 3h14v8l-3 10H13l-1-6-1 6H8L5 11V3z" fill={c} opacity="0.75"/><rect x="5" y="9" width="4" height="3" rx="0.5" fill={c} opacity="0.55"/><rect x="15" y="9" width="4" height="3" rx="0.5" fill={c} opacity="0.55"/></svg>,
  'Pants':          ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M5 3h14v8l-3 10H13l-1-7-1 7H8L5 11V3z" fill={c} opacity="0.80"/><line x1="12" y1="3" x2="12" y2="11" stroke={c} strokeWidth="1.5" opacity="0.4"/></svg>,
  'Kurtas':         ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 7l4-3h10l4 3-3 3v9H6V10L3 7z" fill={c} opacity="0.75"/><line x1="12" y1="5" x2="12" y2="11" stroke={c} strokeWidth="1.5" opacity="0.7"/></svg>,
  'Kurta Sets':     ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 7l4-3h10l4 3-3 3v9H6V10L3 7z" fill={c} opacity="0.70"/><line x1="12" y1="5" x2="12" y2="11" stroke={c} strokeWidth="1.5" opacity="0.6"/><rect x="7" y="15" width="10" height="5" rx="1" fill={c} opacity="0.40"/></svg>,
  'Sherwanis':      ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 6l4-3h10l4 3-3 3v10H6V9L3 6z" fill={c} opacity="0.75"/><path d="M12 4l-2 6h4l-2-6z" fill={c} opacity="0.85"/></svg>,
  'Ethnic Jackets': ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 6l4-3 2 4-1 2v8H4V9L3 6z" fill={c} opacity="0.80"/><path d="M21 6l-4-3-2 4 1 2v8h4V9l1-3z" fill={c} opacity="0.80"/><rect x="8" y="3" width="8" height="14" rx="1" fill={c} opacity="0.50"/></svg>,
  'Dhoti':          ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M5 5h14l2 8-5 6H8L3 13l2-8z" fill={c} opacity="0.75"/></svg>,
  'Activewear':     ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M8 3h8l2 6-2 1v7H8v-7L6 9l2-6z" fill={c} opacity="0.80"/></svg>,
  'Tops':           ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 7l4-3h10l4 3-3 3v7H6V10L3 7z" fill={c} opacity="0.80"/></svg>,
  'Kurtis':         ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 7l4-3h10l4 3-3 3v9H6V10L3 7z" fill={c} opacity="0.72"/><line x1="12" y1="5" x2="12" y2="12" stroke={c} strokeWidth="1.5" opacity="0.6"/></svg>,
  'Tunics':         ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 7l4-3h10l4 3-3 3v10H6V10L3 7z" fill={c} opacity="0.65"/></svg>,
  'Dresses':        ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M9 3h6l2 5-3 1v4l3 7H7l3-7v-4L7 8l2-5z" fill={c} opacity="0.80"/></svg>,
  'Casual Dresses': ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M9 3h6l2 5-3 1v4l3 7H7l3-7v-4L7 8l2-5z" fill={c} opacity="0.70"/></svg>,
  'Party Dresses':  ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M9 3h6l2 5-3 1v4l3 7H7l3-7v-4L7 8l2-5z" fill={c} opacity="0.85"/><circle cx="12" cy="7" r="1.5" fill={c} opacity="0.90"/></svg>,
  'Maxi Dresses':   ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M9 3h6l1 4-2 1v12H10V8L8 7l1-4z" fill={c} opacity="0.78"/></svg>,
  'Bodycon Dresses':({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M10 3h4l2 4-1 5 2 6H7l2-6-1-5 2-4z" fill={c} opacity="0.80"/></svg>,
  'Mini Dresses':   ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M9 3h6l2 5-3 1v4l3 5H7l3-5v-4L7 8l2-5z" fill={c} opacity="0.75"/></svg>,
  'Leggings':       ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M7 3h10v10l-2 8H12l-1-5-1 5H8L6 13V3z" fill={c} opacity="0.80"/></svg>,
  'Palazzos':       ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M6 3h12v8l-4 10H13l-1-6-1 6H9L5 11V3z" fill={c} opacity="0.70"/></svg>,
  'Skirts':         ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="7" y="3" width="10" height="5" rx="1" fill={c} opacity="0.80"/><path d="M7 8l-4 12h18L17 8H7z" fill={c} opacity="0.65"/></svg>,
  'Co-ords':        ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="5" y="2" width="14" height="8" rx="2" fill={c} opacity="0.80"/><rect x="5" y="13" width="14" height="8" rx="2" fill={c} opacity="0.55"/></svg>,
  'Sarees':         ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M6 3c3 0 8 2 10 8-1 5-4 9-4 9H9s2-4 2-9c0-4-3-5-5-5V3z" fill={c} opacity="0.75"/></svg>,
  'Salwar Suits':   ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 7l4-3h10l4 3-3 3v5H6V10L3 7z" fill={c} opacity="0.70"/><path d="M8 15h8v5H8z" fill={c} opacity="0.55"/></svg>,
  'Lehenga Choli':  ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="8" y="2" width="8" height="5" rx="1" fill={c} opacity="0.80"/><path d="M5 9h14l2 11H3L5 9z" fill={c} opacity="0.65"/></svg>,
  'Dupattas':       ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M5 4c3 0 9 1 11 8-1 5-4 8-4 8H5s2-3 2-8C7 7 5 5 5 4z" fill={c} opacity="0.70"/></svg>,
  'Heels':          ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M4 18l3-8 8-4 4 2-3 2-4 8H4z" fill={c} opacity="0.80"/><line x1="7" y1="18" x2="16" y2="18" stroke={c} strokeWidth="2" opacity="0.60"/></svg>,
  'Sandals':        ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 14l4-6h10l4 4v4H3v-2z" fill={c} opacity="0.75"/><line x1="3" y1="17" x2="21" y2="17" stroke={c} strokeWidth="1.5" opacity="0.50"/></svg>,
  'Flats':          ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M2 15l5-5h10l4 3v4H2v-2z" fill={c} opacity="0.80"/><line x1="2" y1="17" x2="21" y2="17" stroke={c} strokeWidth="2" opacity="0.50"/></svg>,
  'Sneakers':       ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M2 14l3-6h10l4 3-1 3v2H2v-2z" fill={c} opacity="0.80"/><line x1="2" y1="17" x2="18" y2="17" stroke={c} strokeWidth="2" opacity="0.50"/></svg>,
  'Boots':          ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M8 3h4v10l4 3v4H4v-4l2-1V3h2z" fill={c} opacity="0.78"/></svg>,
  'Hoodies':        ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 8l4-4 2 3-1 2v9H4V11L3 8z" fill={c} opacity="0.80"/><path d="M21 8l-4-4-2 3 1 2v9h4V11l1-3z" fill={c} opacity="0.80"/><rect x="8" y="4" width="8" height="14" rx="2" fill={c} opacity="0.60"/></svg>,
  'Graphic Tees':   ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 7l4-3h10l4 3-3 3v9H6V10L3 7z" fill={c} opacity="0.70"/><rect x="9" y="11" width="6" height="5" rx="1" fill={c} opacity="0.60"/></svg>,
  'Oversized Tees': ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M2 7l5-4h10l5 4-4 3v9H6V10L2 7z" fill={c} opacity="0.80"/></svg>,
  'Bomber Jackets': ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 7l4-3 1 3-1 2v8H3V9l0-2z" fill={c} opacity="0.85"/><path d="M21 7l-4-3-1 3 1 2v8h4V9l0-2z" fill={c} opacity="0.85"/><rect x="7" y="4" width="10" height="13" rx="2" fill={c} opacity="0.60"/></svg>,
  'Caps':           ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M4 14c0-5 3.5-9 8-9s8 4 8 9v1H4v-1z" fill={c} opacity="0.80"/><rect x="3" y="14" width="18" height="2.5" rx="1.25" fill={c} opacity="0.60"/></svg>,
  'Bags':           ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="4" y="9" width="16" height="12" rx="2" fill={c} opacity="0.80"/><path d="M9 9V7a3 3 0 016 0v2" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.90"/></svg>,
  'Watches':        ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="6" stroke={c} strokeWidth="2" fill="none" opacity="0.85"/><rect x="10" y="3" width="4" height="3" rx="1" fill={c} opacity="0.70"/><rect x="10" y="18" width="4" height="3" rx="1" fill={c} opacity="0.70"/><line x1="12" y1="8" x2="12" y2="12" stroke={c} strokeWidth="1.5" strokeLinecap="round"/><line x1="12" y1="12" x2="15" y2="12" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></svg>,
  'Belts':          ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="2" y="10" width="20" height="4" rx="2" fill={c} opacity="0.80"/><rect x="10" y="9" width="5" height="6" rx="1" fill={c} opacity="0.90"/><circle cx="12" cy="12" r="1.5" fill={c} opacity="1"/></svg>,
  'Wallets':        ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="14" rx="2" fill={c} opacity="0.70"/><rect x="14" y="12" width="6" height="4" rx="2" fill={c} opacity="0.85"/></svg>,
  'Sunglasses':     ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="2" y="9" width="8" height="6" rx="3" fill={c} opacity="0.75"/><rect x="14" y="9" width="8" height="6" rx="3" fill={c} opacity="0.75"/><line x1="10" y1="12" x2="14" y2="12" stroke={c} strokeWidth="1.5" opacity="0.80"/></svg>,
  'Caps & Hats':    ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M4 14c0-5 3.5-9 8-9s8 4 8 9v1H4v-1z" fill={c} opacity="0.80"/><rect x="3" y="14" width="18" height="2.5" rx="1.25" fill={c} opacity="0.60"/></svg>,
  'Bags & Backpacks': ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="4" y="9" width="16" height="12" rx="2" fill={c} opacity="0.80"/><path d="M9 9V7a3 3 0 016 0v2" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.90"/><line x1="12" y1="13" x2="12" y2="18" stroke={c} strokeWidth="1.2" opacity="0.50"/></svg>,
  'Jewellery':      ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><polygon points="12,3 16,9 20,8 17,14 19,20 12,17 5,20 7,14 4,8 8,9" stroke={c} strokeWidth="1.5" fill="none" opacity="0.80"/><circle cx="12" cy="12" r="2.5" fill={c} opacity="0.90"/></svg>,
  'Scarves':        ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M5 3c4 0 10 2 10 9 0 5-3 8-3 8l-3 1" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.80"/></svg>,
  'Hats':           ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M5 13c0-4 3-8 7-8s7 4 7 8v1H5v-1z" fill={c} opacity="0.80"/><rect x="2" y="13" width="20" height="3" rx="1.5" fill={c} opacity="0.65"/></svg>,
};

const CAT_CONFIG = {
  Men:         { color: '#C9A84C', bg: 'linear-gradient(135deg, #1a1a0e 0%, #0f0f0a 100%)', tag: 'New Season', count: '240+ styles' },
  Women:       { color: '#d4827a', bg: 'linear-gradient(135deg, #1a1010 0%, #0f0808 100%)', tag: 'Trending',   count: '380+ styles' },
  Streetwear:  { color: '#8899dd', bg: 'linear-gradient(135deg, #101418 0%, #080a0e 100%)', tag: 'New Drop',   count: '160+ styles' },
  Accessories: { color: '#7ab870', bg: 'linear-gradient(135deg, #121810 0%, #090e08 100%)', tag: 'Curated',    count: '120+ picks'  },
};

// Quick-filters shown per category in the desktop full-screen panel
const QUICK_FILTERS = {
  Men:         ['New Arrivals', 'Best Sellers', 'Under ₹999', 'Premium', 'Ethnic', 'Sports'],
  Women:       ['New Arrivals', 'Trending Now', 'Under ₹999', 'Ethnic Wear', 'Party Wear', 'Work Wear'],
  Streetwear:  ['New Drops', 'Limited Edition', 'Under ₹1499', 'Collab', 'Vintage', 'Unisex'],
  Accessories: ['New In', 'Best Sellers', 'Under ₹499', 'Luxury', 'Daily Essentials', 'Gift Ideas'],
};

const GOLD      = '#C9A84C';
const GOLD_GLOW = 'rgba(201,168,76,0.10)';

export default function Navbar() {
  const [scrolled,           setScrolled]           = useState(false);
  const [userMenuOpen,       setUserMenuOpen]       = useState(false);
  const [mobileMoreOpen,     setMobileMoreOpen]     = useState(false);
  const [categoriesOpen,     setCategoriesOpen]     = useState(false);
  const [activeCat,          setActiveCat]          = useState('Men');
  const [isDark,             setIsDark]             = useState(() => localStorage.getItem('trendora_theme') !== 'light');
  const [deskCatOpen,        setDeskCatOpen]        = useState(false);
  const [deskMoreOpen,       setDeskMoreOpen]       = useState(false);
  const [mobileAccountOpen,  setMobileAccountOpen]  = useState(false);

  const deskCatRef  = useRef(null);
  const deskMoreRef = useRef(null);

  const { user, logout, isAdmin } = useAuth();
  const isSeller = user?.role === 'seller';

  const { cartCount }     = useCart();
  const { wishlistCount } = useWishlist();
  const navigate          = useNavigate();
  const location          = useLocation();

  const NAV_BG = isDark ? '#000000' : '#ffffff';
  const TEXT   = isDark ? 'rgba(240,232,216,0.80)' : 'rgba(0,0,0,0.70)';
  const BORDER = isDark ? 'rgba(201,168,76,0.14)'  : 'rgba(0,0,0,0.10)';

  useEffect(() => {
    document.body.style.backgroundColor = isDark ? '#000000' : '#ffffff';
    document.body.style.color           = isDark ? '#f5f5f5' : '#111111';
  }, [isDark]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setUserMenuOpen(false);
    setCategoriesOpen(false);
    setDeskCatOpen(false);
    setDeskMoreOpen(false);
    setMobileAccountOpen(false);
    setMobileMoreOpen(false);
  }, [location]);

  useEffect(() => {
    const handler = (e) => {
      if (deskCatRef.current  && !deskCatRef.current.contains(e.target))  setDeskCatOpen(false);
      if (deskMoreRef.current && !deskMoreRef.current.contains(e.target)) setDeskMoreOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = (categoriesOpen || deskCatOpen) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [categoriesOpen, deskCatOpen]);

  const isActivePath = path => location.pathname === path;
  const handleLogout = () => { logout(); setCategoriesOpen(false); setUserMenuOpen(false); };

  const dropdownStyle = {
    position: 'absolute', top: 'calc(100% + 10px)',
    backgroundColor: isDark ? '#111111' : '#ffffff',
    border: `1px solid ${BORDER}`,
    borderRadius: '12px',
    boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.7)' : '0 20px 40px rgba(0,0,0,0.15)',
    zIndex: 999, overflow: 'hidden',
    animation: 'navDropdown 0.18s ease both',
  };

  // ─── Shared sub-category card renderer ────────────────────────────────────
  const renderSubCard = (name, cfg, onClick, size = 'md') => {
    const SI  = SubIcons[name];
    const img = SUB_CATEGORY_IMAGES?.[name];
    const imgH = size === 'sm' ? '72px' : '96px';
    const fontSize = size === 'sm' ? '11px' : '12px';
    return (
      <button
        key={name}
        onClick={onClick}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: 0, borderRadius: '12px', overflow: 'hidden',
          border: `1px solid ${isDark ? 'rgba(201,168,76,0.15)' : 'rgba(0,0,0,0.08)'}`,
          cursor: 'pointer',
          background: isDark
            ? 'linear-gradient(160deg, rgba(201,168,76,0.06) 0%, rgba(0,0,0,0.4) 100%)'
            : 'linear-gradient(160deg, rgba(201,168,76,0.06) 0%, rgba(255,255,255,0.9) 100%)',
          transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        }}
        onMouseOver={e => {
          e.currentTarget.style.borderColor = `${cfg.color}70`;
          e.currentTarget.style.transform   = 'translateY(-3px) scale(1.02)';
          e.currentTarget.style.boxShadow   = `0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px ${cfg.color}30`;
          e.currentTarget.style.background  = isDark ? `linear-gradient(160deg, ${cfg.color}18, rgba(0,0,0,0.5))` : `linear-gradient(160deg, ${cfg.color}12, rgba(255,255,255,1))`;
        }}
        onMouseOut={e => {
          e.currentTarget.style.borderColor = isDark ? 'rgba(201,168,76,0.15)' : 'rgba(0,0,0,0.08)';
          e.currentTarget.style.transform   = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow   = '0 2px 8px rgba(0,0,0,0.18)';
          e.currentTarget.style.background  = isDark ? 'linear-gradient(160deg, rgba(201,168,76,0.06) 0%, rgba(0,0,0,0.4) 100%)' : 'linear-gradient(160deg, rgba(201,168,76,0.06) 0%, rgba(255,255,255,0.9) 100%)';
        }}
      >
        {/* Image area */}
        <div style={{
          width: '100%', height: imgH, overflow: 'hidden', flexShrink: 0,
          backgroundColor: isDark ? '#1a1a14' : '#f5f0e8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          {img ? (
            <img
              src={img.url} alt={img.alt || name} loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block', transition: 'transform 0.4s' }}
              onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
            />
          ) : null}
          {/* Fallback icon — always rendered but hidden when image loads */}
          <div style={{
            display: img ? 'none' : 'flex', position: 'absolute', inset: 0,
            alignItems: 'center', justifyContent: 'center',
            background: `linear-gradient(135deg, ${cfg.color}20, ${cfg.color}08)`,
          }}>
            {SI ? <SI c={cfg.color} size={32} /> : null}
          </div>
          {/* Gold shimmer overlay at bottom */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '32px', background: `linear-gradient(to top, ${isDark ? 'rgba(0,0,0,0.65)' : 'rgba(245,240,232,0.65)'}, transparent)`, pointerEvents: 'none' }} />
        </div>
        {/* Label */}
        <span style={{
          fontSize, color: isDark ? 'rgba(240,232,216,0.88)' : 'rgba(0,0,0,0.78)',
          padding: '7px 6px 9px', textAlign: 'center', lineHeight: 1.25,
          width: '100%', fontFamily: 'inherit', fontWeight: 500,
          letterSpacing: '0.01em',
        }}>
          {name}
        </span>
      </button>
    );
  };

  return (
    <>
      <style>{`
        @keyframes navDropdown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fullScreenIn {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .desk-subcard img:hover { transform: scale(1.08); }
        /* Scrollbar styling for mega menu */
        .mega-scroll::-webkit-scrollbar { width: 4px; }
        .mega-scroll::-webkit-scrollbar-track { background: transparent; }
        .mega-scroll::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.3); border-radius: 4px; }
        .mega-scroll::-webkit-scrollbar-thumb:hover { background: rgba(201,168,76,0.6); }
      `}</style>

      {/* ── Announcement bar ── */}
      <div style={{ backgroundColor: GOLD, color: '#000000' }}
        className="text-center py-2 text-[11px] tracking-[0.18em] font-body uppercase px-4 font-medium">
        Free shipping above ₹999&nbsp;&nbsp;|&nbsp;&nbsp;New Collection: Autumn/Winter 2026
      </div>

      {/* ── Main header ── */}
      <header
        className={`sticky top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'shadow-2xl' : ''}`}
        style={{ backgroundColor: NAV_BG }}
      >
        {/* ════ MOBILE TOP BAR ════ */}
        <div className="md:hidden" style={{ backgroundColor: NAV_BG }}>
          <div className="relative flex items-center justify-between px-4 h-14"
            style={{ borderBottom: `1px solid ${BORDER}` }}>
            <div className="flex items-center z-10">
              <button onClick={() => setMobileMoreOpen(true)}
                className="w-9 h-9 flex items-center justify-center -ml-1" style={{ color: TEXT }}>
                <FiMenu size={22} />
              </button>
            </div>
            <Link to="/" className="absolute left-0 right-0 flex items-center justify-center gap-2 pointer-events-auto z-0">
              <img src={logo} alt="Trendorra" className="h-9 w-auto object-contain mix-blend-lighten"
                style={{ filter: 'brightness(1.1)' }} />
              <span className="font-accent text-[15px] tracking-[0.28em] whitespace-nowrap"
                style={{ color: GOLD }}>TRENDORRA</span>
            </Link>
            <div className="flex items-center z-10">
              <Link to="/wishlist" className="relative w-9 h-9 flex items-center justify-center -mr-1" style={{ color: TEXT }}>
                <FiHeart size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 text-white text-[9px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-bold"
                    style={{ backgroundColor: GOLD }}>{wishlistCount}</span>
                )}
              </Link>
            </div>
          </div>

          {/* Mobile Live Search */}
          <div style={{ backgroundColor: NAV_BG, padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, zIndex: 101, position: 'relative' }}>
            <LiveSearch isDark={isDark} isDesktop={false} placeholder="What are you looking for?" />
          </div>

          {/* Category pills */}
          <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', backgroundColor: NAV_BG, borderBottom: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2 px-4 py-2 w-max">
              {['All', ...categories].map(cat => {
                const path   = cat === 'All' ? '/shop' : `/shop/${cat.toLowerCase()}`;
                const active = cat === 'All' ? location.pathname === '/shop' && !location.search : location.pathname === `/shop/${cat.toLowerCase()}`;
                const cfg    = CAT_CONFIG[cat];
                const pillColor = cfg?.color || GOLD;
                return (
                  <button key={cat} onClick={() => navigate(path)}
                    className="flex-shrink-0 px-4 py-1 text-[11px] font-body tracking-[0.1em] uppercase rounded-full border transition-all"
                    style={{
                      backgroundColor: active ? pillColor : 'transparent',
                      borderColor: active ? pillColor : isDark ? `${pillColor}40` : `${pillColor}60`,
                      color: active ? '#000000' : isDark ? `${pillColor}cc` : `${pillColor}`,
                      fontWeight: active ? '700' : '500',
                      boxShadow: active ? `0 0 12px ${pillColor}40` : 'none',
                    }}>
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ════ DESKTOP NAV ════ */}
        <div className="hidden md:block" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center h-20 gap-4">

              {/* Logo */}
              <Link to="/" className="flex items-center gap-3 flex-shrink-0 mr-6">
                <img src={logo} alt="Trendorra" className="h-12 w-auto object-contain mix-blend-lighten"
                  style={{ filter: 'brightness(1.1)' }} />
                <span className="font-accent text-[17px] tracking-[0.32em] whitespace-nowrap"
                  style={{ color: GOLD }}>TRENDORRA</span>
              </Link>

              {/* ── Categories button (triggers full-screen overlay) ── */}
              <div ref={deskCatRef} style={{ position: 'relative', flexShrink: 0 }}>
                <button
                  onClick={() => { setDeskCatOpen(o => !o); setDeskMoreOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '9px 18px', borderRadius: '8px',
                    background: deskCatOpen
                      ? `linear-gradient(135deg, ${GOLD}25, ${GOLD}10)`
                      : isDark ? 'rgba(201,168,76,0.08)' : 'rgba(201,168,76,0.06)',
                    border: `1.5px solid ${deskCatOpen ? GOLD : `${GOLD}40`}`,
                    color: deskCatOpen ? GOLD : isDark ? `${GOLD}cc` : `${GOLD}`,
                    fontSize: '13px', fontFamily: 'inherit', letterSpacing: '0.1em',
                    textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s',
                    whiteSpace: 'nowrap', fontWeight: '600',
                    boxShadow: deskCatOpen ? `0 0 20px ${GOLD}30` : 'none',
                  }}
                  onMouseOver={e => { if (!deskCatOpen) { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; e.currentTarget.style.boxShadow = `0 0 16px ${GOLD}25`; } }}
                  onMouseOut={e  => { if (!deskCatOpen) { e.currentTarget.style.borderColor = `${GOLD}40`; e.currentTarget.style.color = isDark ? `${GOLD}cc` : GOLD; e.currentTarget.style.boxShadow = 'none'; } }}
                >
                  <FiGrid size={15} />
                  All Categories
                  <FiChevronDown size={13} style={{ transition: 'transform 0.25s', transform: deskCatOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </button>
              </div>

              {/* Live Search */}
              <div style={{ flex: 1, maxWidth: '560px', zIndex: 101, position: 'relative' }}>
                <LiveSearch isDark={isDark} isDesktop={true} />
              </div>

              {/* More dropdown */}
              <div ref={deskMoreRef} style={{ position: 'relative', flexShrink: 0 }}>
                <button
                  onClick={() => { setDeskMoreOpen(o => !o); setDeskCatOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '6px',
                    backgroundColor: deskMoreOpen ? `${GOLD}18` : 'transparent',
                    border: `1px solid ${deskMoreOpen ? `${GOLD}40` : 'transparent'}`,
                    color: deskMoreOpen ? GOLD : TEXT,
                    fontSize: '13px', fontFamily: 'inherit', letterSpacing: '0.05em',
                    cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
                  }}
                  onMouseOver={e => { if (!deskMoreOpen) { e.currentTarget.style.color = GOLD; e.currentTarget.style.backgroundColor = `${GOLD}10`; } }}
                  onMouseOut={e  => { if (!deskMoreOpen) { e.currentTarget.style.color = TEXT; e.currentTarget.style.backgroundColor = 'transparent'; } }}
                >
                  More
                  <FiChevronDown size={13} style={{ transition: 'transform 0.2s', transform: deskMoreOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </button>

                {deskMoreOpen && (
                  <div style={{ ...dropdownStyle, right: 0, width: '260px' }}>
                    <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, backgroundColor: isDark ? '#0d0d0d' : '#f8f8f8' }}>
                      <p style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'inherit', margin: 0 }}>More Options</p>
                    </div>
                    {[
                      { to: isSeller ? '/seller/dashboard' : '/seller/register', icon: FiShoppingBag, label: isSeller ? 'Seller Dashboard' : 'Become a Seller', sub: isSeller ? (user?.sellerInfo?.businessName || 'My Store') : 'Sell on Trendorra', iconBg: `${GOLD}18`, iconBorder: `${GOLD}30`, iconColor: GOLD },
                      { to: '/orders',  icon: FiTruck,      label: 'Track Order',      sub: 'Check delivery status',     iconBg: 'rgba(96,165,250,0.12)', iconBorder: 'rgba(96,165,250,0.25)', iconColor: '#60a5fa' },
                      { to: '/shop',    icon: FiTag,        label: 'Offers & Coupons', sub: 'Deals & discounts',         iconBg: 'rgba(74,222,128,0.10)', iconBorder: 'rgba(74,222,128,0.25)', iconColor: '#4ade80' },
                      { to: '/help',    icon: FiHelpCircle, label: 'Help & Support',   sub: 'FAQs & customer care',      iconBg: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', iconBorder: BORDER, iconColor: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' },
                    ].map(({ to, icon: Icon, label, sub, iconBg, iconBorder, iconColor }, i, arr) => (
                      <Link key={to} to={to} onClick={() => setDeskMoreOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px', textDecoration: 'none', borderBottom: i < arr.length-1 ? `1px solid ${BORDER}` : 'none', transition: 'background-color 0.15s' }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}
                        onMouseOut={e  => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div style={{ width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0, backgroundColor: iconBg, border: `1px solid ${iconBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={15} style={{ color: iconColor }} />
                        </div>
                        <div>
                          <p style={{ color: isDark ? '#fff' : '#111', fontSize: '13px', fontWeight: '500', margin: '0 0 2px', fontFamily: 'inherit' }}>{label}</p>
                          <p style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)', fontSize: '11px', margin: 0, fontFamily: 'inherit' }}>{sub}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Right icons */}
              <div className="flex items-center gap-1 ml-2">
                <Link to="/wishlist" className="relative w-9 h-9 flex items-center justify-center hover:text-gold transition-colors" style={{ color: TEXT }}>
                  <FiHeart size={18} />
                  {wishlistCount > 0 && (
                    <span className="absolute top-1 right-1 text-white text-[9px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-bold" style={{ backgroundColor: GOLD }}>{wishlistCount}</span>
                  )}
                </Link>
                <Link to="/cart" className="relative w-9 h-9 flex items-center justify-center hover:text-gold transition-colors" style={{ color: TEXT }}>
                  <FiShoppingBag size={18} />
                  {cartCount > 0 && (
                    <span className="absolute top-1 right-1 text-white text-[9px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-bold" style={{ backgroundColor: GOLD }}>{cartCount}</span>
                  )}
                </Link>

                {isSeller && (
                  <Link to="/seller/dashboard"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '6px', backgroundColor: `${GOLD}15`, border: `1px solid ${GOLD}35`, color: GOLD, fontSize: '12px', fontFamily: 'inherit', letterSpacing: '0.06em', textTransform: 'uppercase', textDecoration: 'none', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                    onMouseOver={e => { e.currentTarget.style.backgroundColor = `${GOLD}28`; e.currentTarget.style.borderColor = GOLD; }}
                    onMouseOut={e  => { e.currentTarget.style.backgroundColor = `${GOLD}15`; e.currentTarget.style.borderColor = `${GOLD}35`; }}
                  >
                    <FiShoppingBag size={13} /> My Store
                  </Link>
                )}

                {user ? (
                  <div className="relative ml-1">
                    <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="w-8 h-8 text-white rounded-full flex items-center justify-center text-xs font-medium"
                      style={{ backgroundColor: GOLD }}>
                      {user.name?.charAt(0).toUpperCase()}
                    </button>
                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}
                          className="absolute right-0 top-11 w-64 z-50 shadow-2xl"
                          style={{ backgroundColor: isDark ? '#111' : '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
                          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: isDark ? '#0d0d0d' : '#f8f8f8' }}>
                            <p className="font-body font-medium text-sm truncate" style={{ color: isDark ? '#f5f5f5' : '#111' }}>{user.name}</p>
                            <p className="text-xs truncate" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>{user.email}</p>
                            {isSeller && <span style={{ display: 'inline-block', marginTop: '4px', fontSize: '10px', letterSpacing: '0.1em', color: GOLD, backgroundColor: `${GOLD}18`, padding: '2px 8px', borderRadius: '999px', fontFamily: 'inherit' }}>SELLER</span>}
                          </div>
                          {[
                            { to: '/profile', icon: FiUser,    label: 'My Profile' },
                            { to: '/orders',  icon: FiPackage, label: 'My Orders'  },
                            { to: '/wishlist',icon: FiHeart,   label: 'Wishlist'   },
                          ].map(({ to, icon: Icon, label }) => (
                            <Link key={to} to={to} className="flex items-center gap-3 px-4 py-3 text-sm font-body hover:text-gold transition-colors"
                              style={{ color: isDark ? 'rgba(245,245,245,0.75)' : 'rgba(0,0,0,0.65)', borderBottom: `1px solid ${BORDER}` }}>
                              <Icon size={14} /> {label}
                            </Link>
                          ))}
                          {isSeller ? (
                            <Link to="/seller/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-body transition-colors"
                              style={{ color: GOLD, borderBottom: `1px solid ${BORDER}` }}
                              onMouseOver={e => e.currentTarget.style.backgroundColor = `${GOLD}0d`}
                              onMouseOut={e  => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <FiShoppingBag size={14} />
                              <div>
                                <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', fontFamily: 'inherit' }}>Seller Dashboard</p>
                                <p style={{ margin: 0, fontSize: '10px', color: `${GOLD}80`, fontFamily: 'inherit' }}>{user?.sellerInfo?.businessName || 'My Store'}</p>
                              </div>
                            </Link>
                          ) : (
                            <Link to="/seller/register" className="flex items-center gap-3 px-4 py-3 text-sm font-body transition-colors"
                              style={{ color: GOLD, borderBottom: `1px solid ${BORDER}` }}
                              onMouseOver={e => e.currentTarget.style.backgroundColor = `${GOLD}0d`}
                              onMouseOut={e  => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <FiShoppingBag size={14} /> Become a Seller
                            </Link>
                          )}
                          {isAdmin && (
                            <Link to="/admin" className="flex items-center gap-3 px-4 py-3 text-sm font-body transition-colors"
                              style={{ color: GOLD, borderBottom: `1px solid ${BORDER}` }}>
                              <FiSettings size={14} /> Admin Dashboard
                            </Link>
                          )}
                          <div style={{ padding: '8px 16px 4px', borderTop: `1px solid ${BORDER}` }}>
                            <p style={{ color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'inherit', margin: '0 0 6px' }}>Legal</p>
                          </div>
                          {[
                            { to: '/privacy-policy',   label: 'Privacy Policy'   },
                            { to: '/terms-of-service', label: 'Terms of Service' },
                            { to: '/refund-policy',    label: 'Refund Policy'    },
                            { to: '/shipping-policy',  label: 'Shipping Policy'  },
                          ].map(({ to, label }) => (
                            <Link key={to} to={to} className="flex items-center gap-3 px-4 py-2 text-xs font-body hover:text-gold transition-colors"
                              style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)', borderBottom: `1px solid ${BORDER}` }}>
                              <FiFileText size={12} /> {label}
                            </Link>
                          ))}
                          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-body text-red-400 transition-colors hover:bg-red-400/5">
                            <FiLogOut size={14} /> Logout
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link to="/login" className="w-9 h-9 flex items-center justify-center hover:text-gold transition-colors ml-1" style={{ color: TEXT }}>
                    <FiUser size={18} />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════════
          DESKTOP FULL-SCREEN CATEGORY MEGA-MENU (Flipkart / Amazon style)
          ════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {deskCatOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="hidden md:block fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(2px)' }}
              onClick={() => setDeskCatOpen(false)}
            />

            {/* Full-screen panel */}
            <motion.div
              initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              transition={{ type: 'tween', duration: 0.28, ease: 'easeOut' }}
              className="hidden md:flex fixed z-50"
              style={{
                top: '130px', /* below announcement + header */
                left: 0, right: 0,
                height: 'calc(100vh - 130px)',
                background: isDark ? '#090909' : '#ffffff',
                borderTop: `2px solid ${GOLD}`,
                boxShadow: `0 24px 80px rgba(0,0,0,0.8)`,
              }}
            >
              {/* ── LEFT SIDEBAR: category list ── */}
              <div style={{
                width: '220px', flexShrink: 0,
                background: isDark ? '#050505' : '#f7f3ea',
                borderRight: `1px solid ${isDark ? 'rgba(201,168,76,0.20)' : 'rgba(201,168,76,0.25)'}`,
                overflowY: 'auto', display: 'flex', flexDirection: 'column',
              }} className="mega-scroll">
                {/* Header */}
                <div style={{ padding: '20px 18px 14px', borderBottom: `1px solid ${isDark ? 'rgba(201,168,76,0.15)' : 'rgba(201,168,76,0.20)'}` }}>
                  <p style={{ color: GOLD, fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', margin: 0, fontWeight: '700' }}>Shop Categories</p>
                </div>

                {/* All */}
                <button onClick={() => { navigate('/shop'); setDeskCatOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`,
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = `${GOLD}12`; }}
                  onMouseOut={e  => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${GOLD}15`, border: `1px solid ${GOLD}30` }}>
                    <CategoryIcons.All color={GOLD} size={20} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ color: isDark ? '#f5f5f5' : '#111', fontSize: '14px', fontWeight: '500', margin: 0, fontFamily: 'inherit' }}>All Categories</p>
                    <p style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)', fontSize: '11px', margin: '2px 0 0', fontFamily: 'inherit' }}>Browse everything</p>
                  </div>
                  <FiChevronRight size={14} style={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', marginLeft: 'auto', flexShrink: 0 }} />
                </button>

                {/* Each category */}
                {categories.map(cat => {
                  const cfg    = CAT_CONFIG[cat];
                  const active = activeCat === cat;
                  const Icon   = CategoryIcons[cat];
                  const subs   = subCategories[cat] || [];
                  return (
                    <button key={cat}
                      onClick={() => setActiveCat(cat)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px',
                        background: active ? `linear-gradient(90deg, ${cfg.color}18, ${cfg.color}06)` : 'transparent',
                        border: 'none', borderLeft: active ? `3px solid ${cfg.color}` : '3px solid transparent',
                        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`,
                        cursor: 'pointer', transition: 'all 0.18s', width: '100%', textAlign: 'left',
                      }}
                      onMouseOver={e => { if (!active) { e.currentTarget.style.background = `${cfg.color}10`; e.currentTarget.style.borderLeftColor = `${cfg.color}60`; } }}
                      onMouseOut={e  => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeftColor = 'transparent'; } }}
                    >
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: active ? `${cfg.color}25` : `${cfg.color}12`,
                        border: `1px solid ${active ? cfg.color + '60' : cfg.color + '25'}`,
                        boxShadow: active ? `0 0 16px ${cfg.color}30` : 'none',
                        transition: 'all 0.18s',
                      }}>
                        {Icon && <Icon color={active ? cfg.color : cfg.color + 'aa'} size={20} />}
                      </div>
                      <div>
                        <p style={{ color: active ? cfg.color : isDark ? '#f5f5f5' : '#111', fontSize: '14px', fontWeight: active ? '600' : '500', margin: 0, fontFamily: 'inherit', transition: 'color 0.15s' }}>{cat}</p>
                        <p style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)', fontSize: '11px', margin: '2px 0 0', fontFamily: 'inherit' }}>{subs.length}+ items</p>
                      </div>
                      <FiChevronRight size={14} style={{ color: active ? cfg.color : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', marginLeft: 'auto', flexShrink: 0 }} />
                    </button>
                  );
                })}

                {/* Seller shortcut */}
                <div style={{ marginTop: 'auto', borderTop: `1px solid ${isDark ? 'rgba(201,168,76,0.15)' : 'rgba(201,168,76,0.20)'}` }}>
                  <Link to={isSeller ? '/seller/dashboard' : '/seller/register'} onClick={() => setDeskCatOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 18px', textDecoration: 'none', background: `${GOLD}08` }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${GOLD}18`, border: `1px solid ${GOLD}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FiShoppingBag size={16} style={{ color: GOLD }} />
                    </div>
                    <div>
                      <p style={{ color: GOLD, fontSize: '13px', fontWeight: '600', margin: 0, fontFamily: 'inherit' }}>{isSeller ? 'My Store' : 'Sell Here'}</p>
                      <p style={{ color: `${GOLD}70`, fontSize: '10px', margin: '1px 0 0', fontFamily: 'inherit' }}>{isSeller ? 'Dashboard' : 'Start selling'}</p>
                    </div>
                  </Link>
                </div>
              </div>

              {/* ── MAIN CONTENT PANEL ── */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {(() => {
                  const cfg     = CAT_CONFIG[activeCat];
                  const grouped = getGroupedSubCategories(activeCat);
                  const qf      = QUICK_FILTERS[activeCat] || [];
                  return (
                    <>
                      {/* Top band: hero info + quick filters */}
                      <div style={{
                        flexShrink: 0,
                        background: isDark
                          ? `linear-gradient(90deg, ${cfg.color}12 0%, rgba(0,0,0,0) 60%)`
                          : `linear-gradient(90deg, ${cfg.color}10 0%, rgba(255,255,255,0) 60%)`,
                        borderBottom: `1px solid ${isDark ? 'rgba(201,168,76,0.12)' : 'rgba(201,168,76,0.15)'}`,
                        padding: '14px 28px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
                      }}>
                        {/* Title */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${cfg.color}30, ${cfg.color}12)`, border: `1.5px solid ${cfg.color}50`, boxShadow: `0 0 20px ${cfg.color}25` }}>
                            {(() => { const I = CategoryIcons[activeCat]; return I ? <I color={cfg.color} size={24} /> : null; })()}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <h2 style={{ color: isDark ? '#fff' : '#111', fontSize: '22px', fontWeight: 300, margin: 0, letterSpacing: '0.04em', fontFamily: 'inherit' }}>{activeCat}</h2>
                              <span style={{ fontSize: '9px', letterSpacing: '0.18em', color: cfg.color, background: `${cfg.color}18`, border: `1px solid ${cfg.color}35`, padding: '3px 10px', borderRadius: '999px', textTransform: 'uppercase', fontWeight: '600' }}>{cfg.tag}</span>
                            </div>
                            <p style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: '12px', margin: '3px 0 0', fontFamily: 'inherit' }}>{cfg.count} · Explore the full collection</p>
                          </div>
                        </div>

                        {/* Quick filter tags */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {qf.map(f => (
                            <button key={f}
                              onClick={() => { navigate(`/shop?category=${activeCat}&filter=${encodeURIComponent(f)}`); setDeskCatOpen(false); }}
                              style={{
                                padding: '5px 14px', borderRadius: '999px', fontSize: '11px', letterSpacing: '0.06em',
                                background: 'transparent', border: `1px solid ${isDark ? 'rgba(201,168,76,0.30)' : 'rgba(201,168,76,0.40)'}`,
                                color: isDark ? `${GOLD}cc` : GOLD, cursor: 'pointer', transition: 'all 0.18s',
                                fontFamily: 'inherit', whiteSpace: 'nowrap',
                              }}
                              onMouseOver={e => { e.currentTarget.style.background = GOLD; e.currentTarget.style.color = '#000'; e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.boxShadow = `0 0 12px ${GOLD}40`; }}
                              onMouseOut={e  => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isDark ? `${GOLD}cc` : GOLD; e.currentTarget.style.borderColor = isDark ? 'rgba(201,168,76,0.30)' : 'rgba(201,168,76,0.40)'; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                              {f}
                            </button>
                          ))}
                          <button
                            onClick={() => { navigate(`/shop/${activeCat.toLowerCase()}`); setDeskCatOpen(false); }}
                            style={{
                              padding: '5px 14px', borderRadius: '999px', fontSize: '11px', letterSpacing: '0.08em',
                              background: `linear-gradient(135deg, ${GOLD}, #a07830)`, border: 'none',
                              color: '#000', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit',
                              whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px',
                              boxShadow: `0 4px 16px ${GOLD}35`,
                            }}
                          >
                            Shop All <FiArrowRight size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Scrollable grid */}
                      <div className="mega-scroll" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 32px' }}>
                        {Object.entries(grouped).map(([group, names]) => (
                          <div key={group} style={{ marginBottom: '32px' }}>
                            {/* Group heading */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                              <div style={{ width: '3px', height: '18px', borderRadius: '2px', background: `linear-gradient(to bottom, ${cfg.color}, ${cfg.color}50)`, flexShrink: 0 }} />
                              <p style={{ color: cfg.color, fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', margin: 0, fontWeight: '700', fontFamily: 'inherit' }}>{group}</p>
                              <div style={{ flex: 1, height: '1px', background: isDark ? 'rgba(201,168,76,0.12)' : 'rgba(201,168,76,0.15)' }} />
                              <span style={{ color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.30)', fontSize: '10px', fontFamily: 'inherit' }}>{names.length} items</span>
                            </div>

                            {/* 6-column uniform card grid */}
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                              gap: '12px',
                            }}>
                              {names.map(name =>
                                renderSubCard(name, cfg, () => { navigate(`/shop?category=${activeCat}&search=${encodeURIComponent(name)}`); setDeskCatOpen(false); }, 'md')
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* ── CLOSE button ── */}
              <button
                onClick={() => setDeskCatOpen(false)}
                style={{
                  position: 'absolute', top: '16px', right: '20px',
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
                  transition: 'all 0.18s',
                }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.15)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)'; }}
                onMouseOut={e  => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'; e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'; e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'; }}
              >
                <FiX size={16} />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ════ MOBILE BOTTOM NAV ════ */}
      <div className="md:hidden fixed z-[109]"
        style={{ bottom: 0, left: 0, right: 0, height: '76px', background: isDark ? 'linear-gradient(to top, #000000 55%, rgba(0,0,0,0) 100%)' : 'linear-gradient(to top, #ffffff 55%, rgba(255,255,255,0) 100%)', pointerEvents: 'none' }} />
      <nav className="md:hidden fixed z-[110]"
        style={{ bottom: '12px', left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 28px)', maxWidth: '390px' }}>
        <div className="flex items-center justify-around px-2 py-2 relative"
          style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.99)' : 'rgba(255,255,255,0.99)', borderRadius: '100px', border: `1px solid ${isDark ? 'rgba(201,168,76,0.20)' : 'rgba(0,0,0,0.10)'}`, boxShadow: isDark ? '0 4px 28px rgba(0,0,0,0.92), 0 0 0 1px rgba(201,168,76,0.06)' : '0 4px 24px rgba(0,0,0,0.18)', backdropFilter: 'blur(24px)' }}>
          <Link to="/" onClick={() => { setMobileAccountOpen(false); setCategoriesOpen(false); setMobileMoreOpen(false); }} className="flex flex-col items-center justify-center gap-1 px-4 py-1.5 relative" style={{ minWidth: '56px' }}>
            {isActivePath('/') && <span className="absolute inset-0 rounded-full" style={{ backgroundColor: GOLD_GLOW }} />}
            <FiHome size={20} strokeWidth={isActivePath('/') ? 2.5 : 1.5} style={{ color: isActivePath('/') ? GOLD : TEXT, position: 'relative' }} />
            <span className="text-[10px] font-body font-medium tracking-wide relative" style={{ color: isActivePath('/') ? GOLD : TEXT }}>Home</span>
          </Link>
          <button onClick={() => { setCategoriesOpen(!categoriesOpen); setMobileAccountOpen(false); setMobileMoreOpen(false); }} className="flex flex-col items-center justify-center gap-1 px-4 py-1.5 relative" style={{ minWidth: '56px' }}>
            <span className="absolute inset-0 rounded-full transition-all" style={{ backgroundColor: categoriesOpen ? GOLD : GOLD_GLOW }} />
            <FiGrid size={20} strokeWidth={categoriesOpen ? 2.5 : 1.5} style={{ color: categoriesOpen ? '#000000' : TEXT, position: 'relative', zIndex: 1 }} />
            <span className="text-[10px] font-body font-medium tracking-wide relative" style={{ zIndex: 1, color: categoriesOpen ? '#000000' : TEXT }}>Categories</span>
          </button>
          <button onClick={() => { if (!user) navigate('/login'); else { setMobileAccountOpen(!mobileAccountOpen); setCategoriesOpen(false); setMobileMoreOpen(false); } }} className="flex flex-col items-center justify-center gap-1 px-3 py-1.5 relative" style={{ minWidth: '56px', background: 'none', border: 'none', cursor: 'pointer' }}>
            <span className="absolute inset-0 rounded-full" style={{ backgroundColor: mobileAccountOpen ? GOLD : GOLD_GLOW }} />
            {user ? <span className="text-[14px] font-body font-bold relative z-10 flex items-center justify-center" style={{ color: mobileAccountOpen ? '#000' : '#fff', width: '20px', height: '20px' }}>{user.name?.charAt(0).toUpperCase()}</span>
                  : <FiUser size={20} strokeWidth={1.5} style={{ color: '#fff', position: 'relative', zIndex: 1 }} />}
            <span className="text-[10px] font-body font-medium tracking-wide relative z-10" style={{ color: mobileAccountOpen ? '#000' : 'rgba(255,255,255,0.8)' }}>Account</span>
          </button>
          <Link to="/cart" onClick={() => { setMobileAccountOpen(false); setCategoriesOpen(false); setMobileMoreOpen(false); }} className="flex flex-col items-center justify-center gap-1 px-4 py-1.5 relative" style={{ minWidth: '56px' }}>
            {isActivePath('/cart') && <span className="absolute inset-0 rounded-full" style={{ backgroundColor: GOLD_GLOW }} />}
            <div className="relative z-10">
              <FiShoppingCart size={20} strokeWidth={isActivePath('/cart') ? 2.5 : 1.5} style={{ color: isActivePath('/cart') ? GOLD : TEXT }} />
              {cartCount > 0 && <span className="absolute -top-1.5 -right-2.5 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold" style={{ backgroundColor: GOLD }}>{cartCount}</span>}
            </div>
            <span className="text-[10px] font-body font-medium tracking-wide relative z-10" style={{ color: isActivePath('/cart') ? GOLD : TEXT }}>Cart</span>
          </Link>
        </div>
      </nav>

      {/* ════ MOBILE ACCOUNT OVERLAY ════ */}
      <AnimatePresence>
        {mobileAccountOpen && user && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="fixed z-[90] md:hidden" style={{ top: 0, left: 0, right: 0, bottom: '76px', background: 'rgba(0,0,0,0.85)' }}
              onClick={() => setMobileAccountOpen(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'tween', duration: 0.35, ease: 'easeOut' }}
              className="fixed left-0 right-0 z-[95] md:hidden flex flex-col"
              style={{ top: 0, bottom: '76px', background: '#0a0a0a', borderTop: `1px solid ${BORDER}` }}>
              <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#050505', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: `${GOLD}22`, border: `1px solid ${GOLD}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: GOLD, fontSize: '20px', fontWeight: '700' }}>{user.name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', margin: '0 0 4px', fontFamily: 'Cinzel, serif', letterSpacing: '0.05em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</h2>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                  </div>
                </div>
                <button onClick={() => setMobileAccountOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                  <FiX size={18} />
                </button>
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                <div style={{ padding: '12px 16px' }}>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 12px 4px', fontWeight: '600' }}>Your Account</p>
                  <div style={{ backgroundColor: '#111', borderRadius: '12px', border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
                    {[
                      { to: '/profile', icon: FiUser,    label: 'My Profile',  desc: 'Edit account details' },
                      { to: '/orders',  icon: FiPackage, label: 'My Orders',   desc: 'Track & manage orders' },
                      { to: '/wishlist',icon: FiHeart,   label: 'Wishlist',    desc: 'Saved items' },
                    ].map(({ to, icon: Icon, label, desc }, i) => (
                      <Link key={to} to={to} onClick={() => setMobileAccountOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', textDecoration: 'none', borderBottom: i < 2 ? `1px solid ${BORDER}` : 'none' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${GOLD}12`, border: `1px solid ${GOLD}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon size={16} style={{ color: GOLD }} />
                        </div>
                        <div>
                          <p style={{ color: '#f5f5f5', fontSize: '15px', fontWeight: '500', margin: 0, marginBottom: '2px' }}>{label}</p>
                          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: 0 }}>{desc}</p>
                        </div>
                        <FiChevronRight size={16} style={{ color: 'rgba(255,255,255,0.2)', marginLeft: 'auto', flexShrink: 0 }} />
                      </Link>
                    ))}
                  </div>
                </div>
                {isSeller && (
                  <div style={{ padding: '0 16px 12px' }}>
                    <p style={{ color: `${GOLD}80`, fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 12px 4px', fontWeight: '600' }}>Seller Central</p>
                    <Link to="/seller/dashboard" onClick={() => setMobileAccountOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', textDecoration: 'none', background: `linear-gradient(135deg, ${GOLD}10, ${GOLD}02)`, border: `1px solid ${GOLD}40`, borderRadius: '12px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: `${GOLD}22`, border: `1px solid ${GOLD}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FiShoppingBag size={18} style={{ color: GOLD }} />
                      </div>
                      <div>
                        <p style={{ color: GOLD, fontSize: '15px', fontWeight: '600', margin: 0, marginBottom: '2px' }}>Seller Dashboard</p>
                        <p style={{ color: `${GOLD}70`, fontSize: '12px', margin: 0 }}>{user?.sellerInfo?.businessName || 'Manage your store'}</p>
                      </div>
                      <FiChevronRight size={16} style={{ color: `${GOLD}60`, marginLeft: 'auto', flexShrink: 0 }} />
                    </Link>
                  </div>
                )}
                <div style={{ padding: '12px 16px' }}>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 12px 4px', fontWeight: '600' }}>Legal</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[
                      { to: '/privacy-policy',   label: 'Privacy Policy',   icon: FiShield   },
                      { to: '/terms-of-service', label: 'Terms of Service', icon: FiFileText },
                      { to: '/refund-policy',    label: 'Refund Policy',    icon: FiRefreshCw},
                      { to: '/shipping-policy',  label: 'Shipping Policy',  icon: FiTruck    },
                    ].map(({ to, label, icon: Icon }) => (
                      <Link key={to} to={to} onClick={() => setMobileAccountOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 12px', background: '#111', border: `1px solid ${BORDER}`, borderRadius: '10px', textDecoration: 'none' }}>
                        <Icon size={14} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', lineHeight: 1.2, fontWeight: '500' }}>{label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
                <div style={{ padding: '24px 16px 40px' }}>
                  <button onClick={() => { handleLogout(); setMobileAccountOpen(false); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '16px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '12px', cursor: 'pointer' }}>
                    <FiLogOut size={16} style={{ color: '#f87171' }} />
                    <span style={{ color: '#f87171', fontSize: '15px', fontWeight: '600', letterSpacing: '0.05em' }}>Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ════ MOBILE CATEGORIES OVERLAY ════ */}
      <AnimatePresence>
        {categoriesOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.20 }}
              className="fixed z-[90] md:hidden"
              style={{ top: 0, left: 0, right: 0, bottom: '76px', background: 'rgba(0,0,0,0.88)' }}
              onClick={() => setCategoriesOpen(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'tween', duration: 0.35, ease: 'easeOut' }}
              className="fixed left-0 right-0 z-[95] md:hidden flex flex-col"
              style={{ top: 0, bottom: '76px', background: '#000000', overflow: 'hidden' }}>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 13px', background: 'linear-gradient(to bottom, #111111, #000000)', borderBottom: `1px solid ${GOLD}28`, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #1a1a1a, #0f0f0f)', border: `1px solid ${GOLD}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 16px rgba(0,0,0,0.50)` }}>
                    <img src={logo} alt="Trendorra" style={{ width: '36px', height: '36px', objectFit: 'contain', filter: 'brightness(1.15)', mixBlendMode: 'lighten' }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '9px', letterSpacing: '0.24em', color: `${GOLD}70`, margin: '0 0 2px', textTransform: 'uppercase' }}>Trendorra</p>
                    <h2 style={{ fontSize: '16px', fontWeight: 400, color: '#f5f5f5', margin: 0, letterSpacing: '0.03em' }}>Shop Collection</h2>
                  </div>
                </div>
                <button onClick={() => setCategoriesOpen(false)} style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(255,255,255,0.10)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(240,232,216,0.70)', cursor: 'pointer' }}>
                  <FiX size={16} />
                </button>
              </div>

              {/* Two column body */}
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Left rail */}
                <div style={{ width: '100px', flexShrink: 0, background: '#050505', overflowY: 'auto', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${GOLD}20` }}>
                  {/* All */}
                  <button onClick={() => { navigate('/shop'); setCategoriesOpen(false); }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '16px 0 13px', gap: '9px', background: 'transparent', border: 'none', borderBottom: `1px solid ${GOLD}12`, borderLeft: '3px solid transparent', cursor: 'pointer' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `${GOLD}18`, border: `1.5px solid ${GOLD}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CategoryIcons.All color={GOLD} size={26} />
                    </div>
                    <span style={{ fontSize: '11px', color: `${GOLD}80`, fontFamily: 'inherit', letterSpacing: '0.02em' }}>All</span>
                  </button>

                  {categories.map(cat => {
                    const cfg = CAT_CONFIG[cat]; const active = activeCat === cat; const Icon = CategoryIcons[cat];
                    return (
                      <button key={cat} onClick={() => setActiveCat(cat)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          width: '100%', padding: '16px 0 13px', gap: '9px',
                          background: active ? `linear-gradient(180deg, ${cfg.color}18 0%, ${cfg.color}06 100%)` : 'transparent',
                          border: 'none', borderBottom: `1px solid ${GOLD}12`,
                          borderLeft: active ? `3px solid ${cfg.color}` : '3px solid transparent',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}>
                        <div style={{
                          width: '56px', height: '56px', borderRadius: '16px',
                          background: active ? `linear-gradient(135deg, ${cfg.color}45, ${cfg.color}18)` : `${cfg.color}14`,
                          border: `1.5px solid ${active ? cfg.color + '80' : cfg.color + '30'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: active ? `0 0 20px ${cfg.color}30, inset 0 1px 0 ${cfg.color}30` : 'none',
                          transition: 'all 0.2s',
                        }}>
                          {Icon && <Icon color={active ? cfg.color : cfg.color + 'bb'} size={26} />}
                        </div>
                        <span style={{ fontSize: '11px', lineHeight: 1.2, textAlign: 'center', color: active ? cfg.color : 'rgba(200,180,140,0.55)', fontFamily: 'inherit', fontWeight: active ? 600 : 400, transition: 'color 0.15s', paddingLeft: '4px', paddingRight: '4px' }}>{cat}</span>
                      </button>
                    );
                  })}

                  {/* Sell shortcut */}
                  <Link to={isSeller ? '/seller/dashboard' : '/seller/register'} onClick={() => setCategoriesOpen(false)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '16px 0 13px', gap: '9px', borderBottom: `1px solid ${GOLD}12`, borderLeft: `3px solid ${GOLD}50`, backgroundColor: `${GOLD}08`, textDecoration: 'none', marginTop: 'auto' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `${GOLD}30`, border: `1.5px solid ${GOLD}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 14px ${GOLD}25` }}>
                      <FiShoppingBag size={22} style={{ color: GOLD }} />
                    </div>
                    <span style={{ fontSize: '11px', color: GOLD, fontFamily: 'inherit', fontWeight: '600', textAlign: 'center', paddingLeft: '4px', paddingRight: '4px' }}>{isSeller ? 'My Store' : 'Sell'}</span>
                  </Link>

                  {user && (
                    <button onClick={handleLogout}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '16px 0 13px', gap: '9px', background: 'transparent', border: 'none', borderTop: '1px solid rgba(248,113,113,0.15)', borderLeft: '3px solid transparent', cursor: 'pointer' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(248,113,113,0.08)', border: '1.5px solid rgba(248,113,113,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiLogOut size={20} style={{ color: '#f87171' }} />
                      </div>
                      <span style={{ fontSize: '11px', color: '#f87171', fontFamily: 'inherit' }}>Logout</span>
                    </button>
                  )}
                </div>

                {/* Gold divider */}
                <div style={{ width: '2px', flexShrink: 0, background: '#111111', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, background: `linear-gradient(to bottom, transparent 0%, ${GOLD}50 20%, ${GOLD}70 50%, ${GOLD}50 80%, transparent 100%)` }} />
                  <motion.div animate={{ y: ['0%', '85%', '0%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ position: 'absolute', top: '5%', width: '6px', height: '32px', borderRadius: '3px', marginLeft: '-2px', background: `linear-gradient(to bottom, transparent, ${GOLD}, #dbbe6a, ${GOLD}, transparent)`, boxShadow: `0 0 10px ${GOLD}80, 0 0 20px ${GOLD}40`, zIndex: 2 }} />
                </div>

                {/* Right panel */}
                <div style={{ flex: 1, overflowY: 'auto', background: '#000000' }} className="mega-scroll">
                  <AnimatePresence mode="wait">
                    <motion.div key={activeCat} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                      {/* Hero card */}
                      <div onClick={() => { navigate(`/shop/${activeCat.toLowerCase()}`); setCategoriesOpen(false); }}
                        style={{ margin: '12px 10px 0', borderRadius: '16px', background: CAT_CONFIG[activeCat].bg, border: `1px solid ${CAT_CONFIG[activeCat].color}30`, padding: '18px 16px', position: 'relative', overflow: 'hidden', cursor: 'pointer', minHeight: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                        <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '140px', height: '140px', borderRadius: '50%', background: `radial-gradient(circle, ${CAT_CONFIG[activeCat].color}35 0%, transparent 65%)`, pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.80 }}>
                          {(() => { const H = HeroIllustrations[activeCat]; return H ? <H color={CAT_CONFIG[activeCat].color} /> : null; })()}
                        </div>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                          <span style={{ display: 'inline-block', fontSize: '8px', letterSpacing: '0.20em', textTransform: 'uppercase', color: CAT_CONFIG[activeCat].color, background: `${CAT_CONFIG[activeCat].color}18`, border: `1px solid ${CAT_CONFIG[activeCat].color}35`, padding: '3px 10px', borderRadius: '999px', marginBottom: '6px' }}>
                            {CAT_CONFIG[activeCat].tag} · {CAT_CONFIG[activeCat].count}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                            <h3 style={{ fontSize: '24px', fontWeight: 300, color: '#f5f5f5', margin: 0, letterSpacing: '-0.01em', lineHeight: 1 }}>{activeCat}</h3>
                            <span style={{ fontSize: '11px', color: `${CAT_CONFIG[activeCat].color}90` }}>→</span>
                          </div>
                        </div>
                      </div>

                      {/* Section label */}
                      <div style={{ padding: '14px 10px 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ height: '1px', flex: 1, background: `${GOLD}20` }} />
                        <span style={{ fontSize: '8px', letterSpacing: '0.20em', color: `${GOLD}60`, textTransform: 'uppercase', fontWeight: '600' }}>Shop by style</span>
                        <div style={{ height: '1px', flex: 1, background: `${GOLD}20` }} />
                      </div>

                      {/* ── MOBILE Subcategory uniform grid (3 cols, fixed image height) ── */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '0 10px 16px' }}>
                        {(subCategories[activeCat] || []).map((sub, idx) => {
                          const SubIcon = SubIcons[sub.name];
                          const cc = CAT_CONFIG[activeCat].color;
                          const img = SUB_CATEGORY_IMAGES?.[sub.name];
                          return (
                            <motion.button
                              key={sub.name}
                              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.14, delay: idx * 0.018 }}
                              onClick={() => { navigate(`/shop?category=${activeCat}&search=${encodeURIComponent(sub.name)}`); setCategoriesOpen(false); }}
                              style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                padding: 0, borderRadius: '14px', overflow: 'hidden',
                                border: `1px solid ${cc}22`,
                                cursor: 'pointer',
                                background: `linear-gradient(160deg, ${cc}10 0%, rgba(0,0,0,0.5) 100%)`,
                                transition: 'all 0.14s',
                              }}
                              onTouchStart={e => { e.currentTarget.style.background = `${cc}25`; e.currentTarget.style.borderColor = `${cc}55`; e.currentTarget.style.transform = 'scale(0.96)'; }}
                              onTouchEnd={e   => { e.currentTarget.style.background = `linear-gradient(160deg, ${cc}10 0%, rgba(0,0,0,0.5) 100%)`; e.currentTarget.style.borderColor = `${cc}22`; e.currentTarget.style.transform = 'scale(1)'; }}
                            >
                              {/* Image */}
                              <div style={{ width: '100%', height: '72px', overflow: 'hidden', flexShrink: 0, position: 'relative', backgroundColor: `${cc}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {img ? (
                                  <img src={img.url} alt={img.alt || sub.name} loading="lazy"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }}
                                    onError={e => { e.currentTarget.style.display = 'none'; }}
                                  />
                                ) : null}
                                {/* Fallback icon */}
                                {!img && (
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: `linear-gradient(135deg, ${cc}28, ${cc}10)` }}>
                                    {SubIcon ? <SubIcon c={cc} size={26} /> : <span style={{ fontSize: '18px' }}>{sub.icon}</span>}
                                  </div>
                                )}
                                {/* Bottom fade */}
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '24px', background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)', pointerEvents: 'none' }} />
                              </div>
                              {/* Label */}
                              <span style={{ fontSize: '10px', color: 'rgba(240,232,216,0.90)', fontFamily: 'inherit', padding: '6px 4px 8px', textAlign: 'center', lineHeight: 1.3, width: '100%', fontWeight: 500, letterSpacing: '0.01em' }}>{sub.name}</span>
                            </motion.button>
                          );
                        })}
                      </div>

                      {/* View all CTA */}
                      <div style={{ padding: '0 10px 20px' }}>
                        <button onClick={() => { navigate(`/shop/${activeCat.toLowerCase()}`); setCategoriesOpen(false); }}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: '14px', background: `linear-gradient(135deg, ${CAT_CONFIG[activeCat].color}22, ${CAT_CONFIG[activeCat].color}08)`, border: `1px solid ${CAT_CONFIG[activeCat].color}30`, cursor: 'pointer' }}>
                          <div>
                            <p style={{ fontSize: '9px', color: `${CAT_CONFIG[activeCat].color}70`, margin: '0 0 3px', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Full collection</p>
                            <p style={{ fontSize: '14px', color: '#f5f5f5', margin: 0, fontWeight: 300 }}>Shop all {activeCat}</p>
                          </div>
                          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: `linear-gradient(135deg, ${GOLD}, #a07830)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 14px ${GOLD}35` }}>
                            <FiChevronRight size={16} style={{ color: '#000000' }} />
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

      {/* ════ MOBILE MORE OVERLAY ════ */}
      <AnimatePresence>
        {mobileMoreOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="fixed z-[90] md:hidden" style={{ top: 0, left: 0, right: 0, bottom: '76px', background: 'rgba(0,0,0,0.85)' }}
              onClick={() => setMobileMoreOpen(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'tween', duration: 0.35, ease: 'easeOut' }}
              className="fixed left-0 right-0 z-[95] md:hidden flex flex-col"
              style={{ top: 0, bottom: '76px', background: '#0a0a0a', borderTop: `1px solid ${BORDER}`, overflowY: 'auto' }}>
              <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#050505', flexShrink: 0 }}>
                <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', margin: 0, fontFamily: 'Cinzel, serif', letterSpacing: '0.05em' }}>More Options</h2>
                <button onClick={() => setMobileMoreOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                  <FiX size={18} />
                </button>
              </div>
              <div style={{ overflowY: 'auto', flex: 1, padding: '24px 16px' }}>
                <div style={{ backgroundColor: '#111', borderRadius: '12px', border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
                  {[
                    { to: isSeller ? '/seller/dashboard' : '/seller/register', icon: FiShoppingBag, label: isSeller ? 'Seller Dashboard' : 'Become a Seller', sub: isSeller ? (user?.sellerInfo?.businessName || 'My Store') : 'Sell on Trendorra', iconBg: `${GOLD}15`, iconBorder: `${GOLD}30`, iconColor: GOLD },
                    { to: '/orders',  icon: FiTruck,      label: 'Track Order',      sub: 'Check delivery status', iconBg: 'rgba(96,165,250,0.12)', iconBorder: 'rgba(96,165,250,0.25)', iconColor: '#60a5fa' },
                    { to: '/shop',    icon: FiTag,        label: 'Offers & Coupons', sub: 'Deals & discounts',     iconBg: 'rgba(74,222,128,0.10)', iconBorder: 'rgba(74,222,128,0.25)', iconColor: '#4ade80' },
                    { to: '/help',    icon: FiHelpCircle, label: 'Help & Support',   sub: 'FAQs & customer care',  iconBg: 'rgba(255,255,255,0.06)', iconBorder: BORDER, iconColor: 'rgba(255,255,255,0.6)' },
                  ].map(({ to, icon: Icon, label, sub, iconBg, iconBorder, iconColor }, i, arr) => (
                    <Link key={to} to={to} onClick={() => setMobileMoreOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', textDecoration: 'none', borderBottom: i < arr.length-1 ? `1px solid ${BORDER}` : 'none' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: iconBg, border: `1px solid ${iconBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={18} style={{ color: iconColor }} />
                      </div>
                      <div>
                        <p style={{ color: '#f5f5f5', fontSize: '15px', fontWeight: '500', margin: '0 0 2px' }}>{label}</p>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: 0 }}>{sub}</p>
                      </div>
                      <FiChevronRight size={16} style={{ color: 'rgba(255,255,255,0.2)', marginLeft: 'auto', flexShrink: 0 }} />
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