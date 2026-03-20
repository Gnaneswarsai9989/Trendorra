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
  FiRefreshCw, FiTag, FiMessageCircle,
} from 'react-icons/fi';
import logo from '../../assets/logo.png';
import SearchOverlay from './SearchOverlay';
import {
  SUB_CATEGORIES,
  SUB_CATEGORY_IMAGES,
  CATEGORY_META,
  getGroupedSubCategories,
} from '../../constants/categories';

const categories = ['Men', 'Women', 'Streetwear', 'Accessories'];

// Use full subcategory data from constants/categories.js
const subCategories = SUB_CATEGORIES;

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
      <path d="M9 10L7.5 20M15 10l1.5 10" stroke={color} strokeWidth="0.5" opacity="0.4"/>
    </svg>
  ),
  Women: ({ color = '#d4827a', size = 26 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="5.5" r="2.8" fill={color} opacity="0.9"/>
      <path d="M7 10c0 0 1.5-1.5 5-1.5s5 1.5 5 1.5l2 6H15l-1 5H10l-1-5H7L7 10z" fill={color} opacity="0.75"/>
      <path d="M9 16h6" stroke={color} strokeWidth="1" opacity="0.5" strokeLinecap="round"/>
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
      <rect x="11.2" y="13.5" width="1.6" height="2.5" rx="0.8" fill={color} opacity="0.9"/>
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
      <path d="M26 32l-3 28M44 32l3 28" stroke={color} strokeWidth="1" opacity="0.25"/>
    </svg>
  ),
  Women: ({ color = '#d4827a' }) => (
    <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
      <circle cx="35" cy="15" r="9" fill={color} opacity="0.25"/>
      <circle cx="35" cy="15" r="6" fill={color} opacity="0.65"/>
      <path d="M20 28c0 0 4-4 15-4s15 4 15 4l5 16H47l-3 14H26l-3-14H15L20 28z" fill={color} opacity="0.38"/>
      <path d="M27 44h16" stroke={color} strokeWidth="1.5" opacity="0.55" strokeLinecap="round"/>
    </svg>
  ),
  Streetwear: ({ color = '#8899dd' }) => (
    <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
      <path d="M12 26c0-7 7-14 23-14s23 7 23 14v2H12v-2z" fill={color} opacity="0.35"/>
      <ellipse cx="35" cy="24" rx="8" ry="3.5" fill={color} opacity="0.30"/>
      <rect x="9" y="29" width="52" height="3" rx="1.5" fill={color} opacity="0.45"/>
      <path d="M14 32v20a2 2 0 002 2h38a2 2 0 002-2V32H14z" fill={color} opacity="0.30"/>
    </svg>
  ),
  Accessories: ({ color = '#7ab870' }) => (
    <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
      <rect x="17" y="30" width="36" height="24" rx="4" fill={color} opacity="0.30"/>
      <path d="M26 30V24a9 9 0 0118 0v6" stroke={color} strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.55"/>
      <circle cx="35" cy="41" r="4" fill={color} opacity="0.70"/>
      <rect x="33" y="41" width="4" height="6" rx="2" fill={color} opacity="0.70"/>
      <path d="M26 30V24a9 9 0 0118 0v6" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.90"/>
    </svg>
  ),
};

const SubIcons = {
  'T-Shirts':       ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 7l4-3h10l4 3-3 3v10H6V10L3 7z" fill={c} opacity="0.85"/><path d="M9 4c0 1.5-1.5 3-3 3M15 4c0 1.5 1.5 3 3 3" stroke={c} strokeWidth="1.5" fill="none" opacity="0.5"/></svg>,
  'Casual Shirts':  ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 7l4-3h10l4 3-3 3v10H6V10L3 7z" fill={c} opacity="0.70"/><line x1="12" y1="7" x2="12" y2="14" stroke={c} strokeWidth="1" opacity="0.6"/><line x1="10" y1="9" x2="14" y2="9" stroke={c} strokeWidth="1" opacity="0.4"/></svg>,
  'Formal Shirts':  ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 7l4-3h10l4 3-3 3v10H6V10L3 7z" fill={c} opacity="0.75"/><line x1="12" y1="6" x2="12" y2="17" stroke={c} strokeWidth="1.2" opacity="0.65"/></svg>,
  'Shirts':         ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 7l4-3h10l4 3-3 3v10H6V10L3 7z" fill={c} opacity="0.70"/><line x1="12" y1="7" x2="12" y2="14" stroke={c} strokeWidth="1" opacity="0.6"/></svg>,
  'Hoodies & Sweatshirts': ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 8l4-4 2 3-1 2v9H4V11L3 8z" fill={c} opacity="0.80"/><path d="M21 8l-4-4-2 3 1 2v9h4V11l1-3z" fill={c} opacity="0.80"/><rect x="8" y="4" width="8" height="14" rx="2" fill={c} opacity="0.60"/><path d="M9 4c1 3 5 3 6 0" stroke={c} strokeWidth="1.5" fill="none" opacity="0.7"/></svg>,
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
  'Wallets':        ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="14" rx="2" fill={c} opacity="0.70"/><rect x="14" y="12" width="6" height="4" rx="2" fill={c} opacity="0.85"/><circle cx="17" cy="14" r="1" fill={c} opacity="0.50"/></svg>,
  'Sunglasses':     ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="2" y="9" width="8" height="6" rx="3" fill={c} opacity="0.75"/><rect x="14" y="9" width="8" height="6" rx="3" fill={c} opacity="0.75"/><line x1="10" y1="12" x2="14" y2="12" stroke={c} strokeWidth="1.5" opacity="0.80"/></svg>,
  'Caps & Hats':    ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M4 14c0-5 3.5-9 8-9s8 4 8 9v1H4v-1z" fill={c} opacity="0.80"/><rect x="3" y="14" width="18" height="2.5" rx="1.25" fill={c} opacity="0.60"/></svg>,
  'Bags & Backpacks': ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="4" y="9" width="16" height="12" rx="2" fill={c} opacity="0.80"/><path d="M9 9V7a3 3 0 016 0v2" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.90"/><line x1="12" y1="13" x2="12" y2="18" stroke={c} strokeWidth="1.2" opacity="0.50"/></svg>,
  'Jewellery':      ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><polygon points="12,3 16,9 20,8 17,14 19,20 12,17 5,20 7,14 4,8 8,9" stroke={c} strokeWidth="1.5" fill="none" opacity="0.80"/><circle cx="12" cy="12" r="2.5" fill={c} opacity="0.90"/></svg>,
  'Scarves':        ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M5 3c4 0 10 2 10 9 0 5-3 8-3 8l-3 1" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.80"/></svg>,
  'Hats':           ({ c, size=22 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M5 13c0-4 3-8 7-8s7 4 7 8v1H5v-1z" fill={c} opacity="0.80"/><rect x="2" y="13" width="20" height="3" rx="1.5" fill={c} opacity="0.65"/></svg>,
};

const CAT_CONFIG = {
  Men:         { color: '#C9A84C', bg: 'linear-gradient(135deg, #1a1a0e, #0f0f0a)', tag: 'New Season', count: '240+ styles' },
  Women:       { color: '#d4827a', bg: 'linear-gradient(135deg, #1a1010, #0f0808)', tag: 'Trending',   count: '380+ styles' },
  Streetwear:  { color: '#8899dd', bg: 'linear-gradient(135deg, #101418, #080a0e)', tag: 'New Drop',   count: '160+ styles' },
  Accessories: { color: '#7ab870', bg: 'linear-gradient(135deg, #121810, #090e08)', tag: 'Curated',    count: '120+ picks'  },
};

const GOLD      = '#C9A84C';
const GOLD_GLOW = 'rgba(201,168,76,0.10)';

export default function Navbar() {
  const [scrolled,       setScrolled]       = useState(false);
  const [searchOpen,     setSearchOpen]     = useState(false);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [userMenuOpen,   setUserMenuOpen]   = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [activeCat,      setActiveCat]      = useState('Men');
  const [isDark,         setIsDark]         = useState(() => localStorage.getItem('trendora_theme') !== 'light');
  const [deskCatOpen,    setDeskCatOpen]    = useState(false);
  const [deskMoreOpen,   setDeskMoreOpen]   = useState(false);

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
    document.body.style.color           = isDark ? '#f0e8d8' : '#111111';
  }, [isDark]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setUserMenuOpen(false);
    setSearchOpen(false);
    setCategoriesOpen(false);
    setDeskCatOpen(false);
    setDeskMoreOpen(false);
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
    document.body.style.overflow = searchOpen || categoriesOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [searchOpen, categoriesOpen]);

  const handleSearch = e => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${searchQuery.trim()}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

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

  return (
    <>
      <style>{`
        @keyframes navDropdown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .desk-cat-img:hover { transform: scale(1.10); }
      `}</style>

      {/* Announcement bar */}
      <div style={{ backgroundColor: GOLD, color: '#000000' }}
        className="text-center py-2 text-[11px] tracking-[0.18em] font-body uppercase px-4 font-medium">
        Free shipping above ₹999&nbsp;&nbsp;|&nbsp;&nbsp;New Collection: Autumn/Winter 2026
      </div>

      {/* Main header */}
      <header
        className={`sticky top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'shadow-2xl' : ''}`}
        style={{ backgroundColor: NAV_BG }}
      >
        {/* ══ MOBILE top bar ══ */}
        <div className="md:hidden" style={{ backgroundColor: NAV_BG }}>
          <div className="relative flex items-center justify-between px-4 h-14"
            style={{ borderBottom: `1px solid ${BORDER}` }}>
            <button onClick={() => setSearchOpen(true)}
              className="w-9 h-9 flex items-center justify-center z-10"
              style={{ color: TEXT }}>
              <FiSearch size={19} />
            </button>
            <Link to="/" className="absolute left-0 right-0 flex items-center justify-center gap-2 pointer-events-auto">
              <img src={logo} alt="Trendorra" className="h-9 w-auto object-contain mix-blend-lighten"
                style={{ filter: 'brightness(1.1)' }} />
              <span className="font-accent text-[14px] tracking-[0.28em] whitespace-nowrap"
                style={{ color: GOLD }}>TRENDORRA</span>
            </Link>
            <div className="flex items-center gap-1 z-10">
              <Link to="/wishlist" className="relative w-9 h-9 flex items-center justify-center" style={{ color: TEXT }}>
                <FiHeart size={19} />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 text-white text-[9px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-bold"
                    style={{ backgroundColor: GOLD }}>{wishlistCount}</span>
                )}
              </Link>
            </div>
          </div>

          {/* Mobile search */}
          <div style={{ backgroundColor: NAV_BG, padding: '8px 12px', borderBottom: `1px solid ${BORDER}` }}>
            <form onSubmit={handleSearch} style={{
              display: 'flex', alignItems: 'center',
              backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
              border: `1px solid ${isDark ? 'rgba(201,168,76,0.2)' : 'rgba(0,0,0,0.12)'}`,
              borderRadius: '8px', overflow: 'hidden',
            }}>
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search for products, brands & more…"
                style={{ flex: 1, padding: '9px 14px', backgroundColor: 'transparent', border: 'none', outline: 'none', color: isDark ? '#f0e8d8' : '#111', fontSize: '13px', fontFamily: 'inherit' }} />
              <button type="submit" style={{ padding: '0 14px', height: '38px', backgroundColor: GOLD, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FiSearch size={16} style={{ color: '#000' }} />
              </button>
            </form>
          </div>

          {/* Category pills */}
          <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', backgroundColor: NAV_BG, borderBottom: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2 px-4 py-2 w-max">
              {['All', ...categories].map(cat => {
                const path   = cat === 'All' ? '/shop' : `/shop/${cat.toLowerCase()}`;
                const active = cat === 'All' ? location.pathname === '/shop' && !location.search : location.pathname === `/shop/${cat.toLowerCase()}`;
                return (
                  <button key={cat} onClick={() => navigate(path)}
                    className="flex-shrink-0 px-4 py-1 text-[11px] font-body tracking-[0.1em] uppercase rounded-full border transition-all"
                    style={{ backgroundColor: active ? GOLD : 'transparent', borderColor: active ? GOLD : BORDER, color: active ? '#000000' : TEXT }}>
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ══ DESKTOP nav ══ */}
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

              {/* Categories dropdown */}
              <div ref={deskCatRef} style={{ position: 'relative', flexShrink: 0 }}>
                <button
                  onClick={() => { setDeskCatOpen(o => !o); setDeskMoreOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 14px', borderRadius: '6px',
                    backgroundColor: deskCatOpen ? `${GOLD}18` : 'transparent',
                    border: `1px solid ${deskCatOpen ? `${GOLD}40` : 'transparent'}`,
                    color: deskCatOpen ? GOLD : TEXT,
                    fontSize: '13px', fontFamily: 'inherit', letterSpacing: '0.08em',
                    textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
                  }}
                  onMouseOver={e => { if (!deskCatOpen) { e.currentTarget.style.color = GOLD; e.currentTarget.style.backgroundColor = `${GOLD}10`; } }}
                  onMouseOut={e  => { if (!deskCatOpen) { e.currentTarget.style.color = TEXT; e.currentTarget.style.backgroundColor = 'transparent'; } }}
                >
                  <FiGrid size={14} />
                  Categories
                  <FiChevronDown size={13} style={{ transition: 'transform 0.2s', transform: deskCatOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </button>

                {/* ── DESKTOP MEGA-MENU ── */}
                {deskCatOpen && (
                  <div style={{ ...dropdownStyle, left: 0, width: '720px', maxHeight: '80vh', overflowY: 'auto' }}>
                    {/* Category tabs */}
                    <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, backgroundColor: isDark ? '#0d0d0d' : '#f8f8f8', position: 'sticky', top: 0, zIndex: 1 }}>
                      {categories.map(cat => {
                        const cfg = CAT_CONFIG[cat];
                        return (
                          <button key={cat} onClick={() => setActiveCat(cat)}
                            style={{
                              flex: 1, padding: '12px 8px',
                              backgroundColor: activeCat === cat ? `${cfg.color}18` : 'transparent',
                              border: 'none',
                              borderBottom: activeCat === cat ? `2px solid ${cfg.color}` : '2px solid transparent',
                              color: activeCat === cat ? cfg.color : isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
                              fontSize: '12px', fontFamily: 'inherit', letterSpacing: '0.08em',
                              textTransform: 'uppercase', cursor: 'pointer',
                              transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            }}>
                            {(() => { const I = CategoryIcons[cat]; return I ? <I color={activeCat === cat ? cfg.color : isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} size={18} /> : null; })()}
                            {cat}
                          </button>
                        );
                      })}
                    </div>

                    {/* Content panel */}
                    {(() => {
                      const cfg = CAT_CONFIG[activeCat];
                      const grouped = getGroupedSubCategories(activeCat);
                      return (
                        <div style={{ padding: '16px' }}>
                          {/* Hero banner */}
                          <div
                            onClick={() => { navigate(`/shop/${activeCat.toLowerCase()}`); setDeskCatOpen(false); }}
                            style={{
                              borderRadius: '10px', padding: '16px 20px', marginBottom: '16px',
                              background: cfg.bg, border: `1px solid ${cfg.color}25`,
                              cursor: 'pointer', display: 'flex', alignItems: 'center',
                              justifyContent: 'space-between', position: 'relative', overflow: 'hidden',
                            }}>
                            <div>
                              <span style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: cfg.color, opacity: 0.8 }}>
                                {cfg.tag} · {cfg.count}
                              </span>
                              <p style={{ color: '#f0e8d8', fontSize: '18px', fontWeight: 300, margin: '4px 0 0', letterSpacing: '0.05em' }}>
                                Shop All {activeCat} →
                              </p>
                            </div>
                            {(() => { const H = HeroIllustrations[activeCat]; return H ? <H color={cfg.color} /> : null; })()}
                          </div>

                          {/* Grouped image-card grid */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {Object.entries(grouped).map(([group, names]) => (
                              <div key={group}>
                                {/* Group label */}
                                <p style={{
                                  fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase',
                                  color: cfg.color, opacity: 0.70, margin: '0 0 8px', fontFamily: 'inherit',
                                }}>{group}</p>

                                {/* 4-col image cards */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                                  {names.map(name => {
                                    const img = SUB_CATEGORY_IMAGES[name];
                                    const SI  = SubIcons[name];
                                    return (
                                      <button key={name}
                                        onClick={() => { navigate(`/shop?category=${activeCat}&search=${encodeURIComponent(name)}`); setDeskCatOpen(false); }}
                                        style={{
                                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                                          padding: 0, borderRadius: '10px', overflow: 'hidden',
                                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                                          cursor: 'pointer', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                          transition: 'all 0.18s',
                                        }}
                                        onMouseOver={e => {
                                          e.currentTarget.style.borderColor = `${cfg.color}55`;
                                          e.currentTarget.style.transform   = 'translateY(-2px)';
                                          e.currentTarget.style.boxShadow   = '0 6px 20px rgba(0,0,0,0.35)';
                                          e.currentTarget.style.background   = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
                                        }}
                                        onMouseOut={e => {
                                          e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
                                          e.currentTarget.style.transform   = 'translateY(0)';
                                          e.currentTarget.style.boxShadow   = 'none';
                                          e.currentTarget.style.background   = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
                                        }}
                                      >
                                        {/* Image */}
                                        <div style={{ width: '100%', height: '70px', overflow: 'hidden', backgroundColor: isDark ? '#1a1a1a' : '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                          {img ? (
                                            <img
                                              src={img.url} alt={img.alt} loading="lazy"
                                              className="desk-cat-img"
                                              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.35s', display: 'block' }}
                                              onError={e => { e.currentTarget.style.display = 'none'; }}
                                            />
                                          ) : (
                                            SI ? <SI c={cfg.color} size={28} /> : null
                                          )}
                                        </div>
                                        {/* Label */}
                                        <span style={{ fontSize: '11px', color: isDark ? 'rgba(240,232,216,0.82)' : 'rgba(0,0,0,0.75)', fontFamily: 'inherit', padding: '5px 6px 8px', textAlign: 'center', lineHeight: 1.3, width: '100%' }}>
                                          {name}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Search bar */}
              <form onSubmit={handleSearch}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center',
                  backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                  border: `2px solid ${GOLD}`, borderRadius: '8px', overflow: 'hidden',
                  maxWidth: '560px', transition: 'box-shadow 0.2s',
                }}
                onFocus={e => e.currentTarget.style.boxShadow = `0 0 0 3px ${GOLD}30`}
                onBlur={e  => e.currentTarget.style.boxShadow = 'none'}
              >
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search for products, brands, categories…"
                  style={{ flex: 1, padding: '11px 18px', backgroundColor: 'transparent', border: 'none', outline: 'none', color: isDark ? '#f0e8d8' : '#111', fontSize: '14px', fontFamily: 'inherit' }} />
                <button type="submit"
                  style={{ padding: '0 20px', height: '44px', backgroundColor: GOLD, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexShrink: 0, transition: 'background-color 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#b8933f'}
                  onMouseOut={e  => e.currentTarget.style.backgroundColor = GOLD}
                >
                  <FiSearch size={18} style={{ color: '#000' }} />
                  <span style={{ color: '#000', fontSize: '13px', fontWeight: '600', fontFamily: 'inherit', letterSpacing: '0.05em' }}>Search</span>
                </button>
              </form>

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
                    <Link to={isSeller ? '/seller/dashboard' : '/seller/register'} onClick={() => setDeskMoreOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px', textDecoration: 'none', borderBottom: `1px solid ${BORDER}`, transition: 'background-color 0.15s' }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = `${GOLD}0d`}
                      onMouseOut={e  => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0, backgroundColor: `${GOLD}18`, border: `1px solid ${GOLD}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiShoppingBag size={15} style={{ color: GOLD }} />
                      </div>
                      <div>
                        <p style={{ color: isDark ? '#fff' : '#111', fontSize: '13px', fontWeight: '500', margin: '0 0 2px', fontFamily: 'inherit' }}>{isSeller ? 'Seller Dashboard' : 'Become a Seller'}</p>
                        <p style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)', fontSize: '11px', margin: 0, fontFamily: 'inherit' }}>{isSeller ? (user?.sellerInfo?.businessName || 'My Store') : 'Sell on Trendorra'}</p>
                      </div>
                    </Link>
                    <Link to="/orders" onClick={() => setDeskMoreOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px', textDecoration: 'none', borderBottom: `1px solid ${BORDER}`, transition: 'background-color 0.15s' }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}
                      onMouseOut={e  => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0, backgroundColor: isDark ? 'rgba(96,165,250,0.12)' : 'rgba(59,130,246,0.08)', border: '1px solid rgba(96,165,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiTruck size={15} style={{ color: '#60a5fa' }} />
                      </div>
                      <div>
                        <p style={{ color: isDark ? '#fff' : '#111', fontSize: '13px', fontWeight: '500', margin: '0 0 2px', fontFamily: 'inherit' }}>Track Order</p>
                        <p style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)', fontSize: '11px', margin: 0, fontFamily: 'inherit' }}>Check delivery status</p>
                      </div>
                    </Link>
                    <Link to="/shop" onClick={() => setDeskMoreOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px', textDecoration: 'none', borderBottom: `1px solid ${BORDER}`, transition: 'background-color 0.15s' }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}
                      onMouseOut={e  => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0, backgroundColor: isDark ? 'rgba(74,222,128,0.1)' : 'rgba(22,163,74,0.08)', border: '1px solid rgba(74,222,128,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiTag size={15} style={{ color: '#4ade80' }} />
                      </div>
                      <div>
                        <p style={{ color: isDark ? '#fff' : '#111', fontSize: '13px', fontWeight: '500', margin: '0 0 2px', fontFamily: 'inherit' }}>Offers & Coupons</p>
                        <p style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)', fontSize: '11px', margin: 0, fontFamily: 'inherit' }}>Deals & discounts</p>
                      </div>
                    </Link>
                    <Link to="/help" onClick={() => setDeskMoreOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px', textDecoration: 'none', transition: 'background-color 0.15s' }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}
                      onMouseOut={e  => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiHelpCircle size={15} style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }} />
                      </div>
                      <div>
                        <p style={{ color: isDark ? '#fff' : '#111', fontSize: '13px', fontWeight: '500', margin: '0 0 2px', fontFamily: 'inherit' }}>Help & Support</p>
                        <p style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)', fontSize: '11px', margin: 0, fontFamily: 'inherit' }}>FAQs & customer care</p>
                      </div>
                    </Link>
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
                            <p className="font-body font-medium text-sm truncate" style={{ color: isDark ? '#f0e8d8' : '#111' }}>{user.name}</p>
                            <p className="text-xs truncate" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>{user.email}</p>
                            {isSeller && <span style={{ display: 'inline-block', marginTop: '4px', fontSize: '10px', letterSpacing: '0.1em', color: GOLD, backgroundColor: `${GOLD}18`, padding: '2px 8px', borderRadius: '999px', fontFamily: 'inherit' }}>SELLER</span>}
                          </div>
                          {[
                            { to: '/profile', icon: FiUser,    label: 'My Profile' },
                            { to: '/orders',  icon: FiPackage, label: 'My Orders'  },
                            { to: '/wishlist',icon: FiHeart,   label: 'Wishlist'   },
                          ].map(({ to, icon: Icon, label }) => (
                            <Link key={to} to={to} className="flex items-center gap-3 px-4 py-3 text-sm font-body hover:text-gold transition-colors"
                              style={{ color: isDark ? 'rgba(240,232,216,0.7)' : 'rgba(0,0,0,0.65)', borderBottom: `1px solid ${BORDER}` }}>
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
                            { to: '/legal/privacy-policy',   label: 'Privacy Policy'   },
                            { to: '/legal/terms-of-service', label: 'Terms of Service' },
                            { to: '/legal/refund-policy',    label: 'Refund Policy'    },
                            { to: '/legal/shipping-policy',  label: 'Shipping Policy'  },
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

      {/* ══ MOBILE BOTTOM NAV ══ */}
      <div className="md:hidden fixed z-[109]"
        style={{ bottom: 0, left: 0, right: 0, height: '76px', background: isDark ? 'linear-gradient(to top, #000000 55%, rgba(0,0,0,0) 100%)' : 'linear-gradient(to top, #ffffff 55%, rgba(255,255,255,0) 100%)', pointerEvents: 'none' }} />
      <nav className="md:hidden fixed z-[110]"
        style={{ bottom: '12px', left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 28px)', maxWidth: '390px' }}>
        <div className="flex items-center justify-around px-2 py-2 relative"
          style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.99)' : 'rgba(255,255,255,0.99)', borderRadius: '100px', border: `1px solid ${isDark ? 'rgba(201,168,76,0.20)' : 'rgba(0,0,0,0.10)'}`, boxShadow: isDark ? '0 4px 28px rgba(0,0,0,0.92), 0 0 0 1px rgba(201,168,76,0.06), inset 0 1px 0 rgba(255,255,255,0.04)' : '0 4px 24px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>
          <Link to="/" className="flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 relative" style={{ minWidth: '56px' }}>
            {isActivePath('/') && <span className="absolute inset-0 rounded-full" style={{ backgroundColor: GOLD_GLOW }} />}
            <FiHome size={19} strokeWidth={isActivePath('/') ? 2.5 : 1.5} style={{ color: isActivePath('/') ? GOLD : TEXT, position: 'relative' }} />
            <span className="text-[9px] font-body tracking-wide relative" style={{ color: isActivePath('/') ? GOLD : TEXT }}>Home</span>
          </Link>
          <button onClick={() => setCategoriesOpen(true)} className="flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 relative" style={{ minWidth: '56px' }}>
            <span className="absolute inset-0 rounded-full transition-all" style={{ backgroundColor: categoriesOpen ? GOLD : GOLD_GLOW }} />
            <FiGrid size={19} strokeWidth={categoriesOpen ? 2.5 : 1.5} style={{ color: categoriesOpen ? '#000000' : TEXT, position: 'relative', zIndex: 1 }} />
            <span className="text-[9px] font-body tracking-wide relative" style={{ zIndex: 1, color: categoriesOpen ? '#000000' : TEXT }}>Categories</span>
          </button>
          <Link to={user ? '/profile' : '/login'} className="flex flex-col items-center justify-center gap-0.5 px-3 py-2 relative" style={{ minWidth: '56px' }}>
            <span className="absolute inset-0 rounded-full" style={{ backgroundColor: (isActivePath('/profile') || isActivePath('/login')) ? GOLD : GOLD_GLOW }} />
            {user ? <span className="text-[13px] font-body font-semibold relative z-10" style={{ color: '#fff' }}>{user.name?.charAt(0).toUpperCase()}</span>
                  : <FiUser size={19} strokeWidth={1.5} style={{ color: '#fff', position: 'relative', zIndex: 1 }} />}
            <span className="text-[9px] font-body tracking-wide relative z-10" style={{ color: (isActivePath('/profile') || isActivePath('/login')) ? '#fff' : 'rgba(255,255,255,0.8)' }}>Account</span>
          </Link>
          <Link to="/cart" className="flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 relative" style={{ minWidth: '56px' }}>
            {isActivePath('/cart') && <span className="absolute inset-0 rounded-full" style={{ backgroundColor: GOLD_GLOW }} />}
            <div className="relative z-10">
              <FiShoppingCart size={19} strokeWidth={isActivePath('/cart') ? 2.5 : 1.5} style={{ color: isActivePath('/cart') ? GOLD : TEXT }} />
              {cartCount > 0 && <span className="absolute -top-2 -right-2.5 text-white text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-bold" style={{ backgroundColor: GOLD }}>{cartCount}</span>}
            </div>
            <span className="text-[9px] font-body tracking-wide relative z-10" style={{ color: isActivePath('/cart') ? GOLD : TEXT }}>Cart</span>
          </Link>
        </div>
      </nav>

      {/* ══ MOBILE CATEGORIES OVERLAY ══ */}
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 13px', background: 'linear-gradient(to bottom, #111111, #000000)', borderBottom: '1px solid rgba(201,168,76,0.18)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #1a1a1a, #0f0f0f)', border: '1px solid rgba(201,168,76,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.50)' }}>
                    <img src={logo} alt="Trendorra" style={{ width: '36px', height: '36px', objectFit: 'contain', filter: 'brightness(1.15)', mixBlendMode: 'lighten' }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '9px', letterSpacing: '0.24em', color: 'rgba(201,168,76,0.60)', margin: '0 0 2px', textTransform: 'uppercase' }}>Trendorra</p>
                    <h2 style={{ fontSize: '16px', fontWeight: 400, color: '#f0e8d8', margin: 0, letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>Shop Collection</h2>
                  </div>
                </div>
                <button onClick={() => setCategoriesOpen(false)} style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(240,232,216,0.70)', cursor: 'pointer' }}>
                  <FiX size={16} />
                </button>
              </div>

              {/* Two column body */}
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Left rail */}
                <div style={{ width: '100px', flexShrink: 0, background: '#000000', overflowY: 'auto', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  <button onClick={() => { navigate('/shop'); setCategoriesOpen(false); }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '16px 0 13px', gap: '9px', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(201,168,76,0.12)', borderLeft: '3px solid transparent', cursor: 'pointer' }}>
                    <div style={{ width: '62px', height: '62px', borderRadius: '18px', background: 'linear-gradient(135deg, #1e1e1e, #111111)', border: '1.5px solid rgba(201,168,76,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="2" fill="#C9A84C" opacity="0.9"/><rect x="14" y="3" width="7" height="7" rx="2" fill="#C9A84C" opacity="0.55"/><rect x="3" y="14" width="7" height="7" rx="2" fill="#C9A84C" opacity="0.55"/><rect x="14" y="14" width="7" height="7" rx="2" fill="#C9A84C" opacity="0.9"/></svg>
                    </div>
                    <span style={{ fontSize: '12px', color: 'rgba(201,168,76,0.60)', fontFamily: 'inherit', letterSpacing: '0.02em' }}>All</span>
                  </button>

                  {categories.map(cat => {
                    const cfg = CAT_CONFIG[cat]; const active = activeCat === cat; const Icon = CategoryIcons[cat];
                    return (
                      <button key={cat} onClick={() => setActiveCat(cat)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '16px 0 13px', gap: '9px', background: active ? `${cfg.color}12` : 'transparent', border: 'none', borderBottom: '1px solid rgba(201,168,76,0.12)', borderLeft: active ? `3px solid ${cfg.color}` : '3px solid transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
                        <div style={{ width: '62px', height: '62px', borderRadius: '18px', background: active ? `linear-gradient(135deg, ${cfg.color}50, ${cfg.color}20)` : `linear-gradient(135deg, ${cfg.color}20, ${cfg.color}08)`, border: `1.5px solid ${active ? cfg.color + '90' : cfg.color + '35'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: active ? `0 0 22px ${cfg.color}35, inset 0 1px 0 ${cfg.color}30` : 'none', transition: 'all 0.2s' }}>
                          {Icon && <Icon color={active ? cfg.color : cfg.color + 'bb'} size={30} />}
                        </div>
                        <span style={{ fontSize: '12px', lineHeight: 1.2, textAlign: 'center', color: active ? cfg.color : 'rgba(200,180,140,0.65)', fontFamily: 'inherit', fontWeight: active ? 600 : 400, transition: 'color 0.15s', letterSpacing: '0.01em', paddingLeft: '4px', paddingRight: '4px' }}>{cat}</span>
                      </button>
                    );
                  })}

                  {isSeller ? (
                    <Link to="/seller/dashboard" onClick={() => setCategoriesOpen(false)}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '16px 0 13px', gap: '9px', borderBottom: '1px solid rgba(201,168,76,0.12)', borderLeft: `3px solid ${GOLD}60`, backgroundColor: `${GOLD}0a`, textDecoration: 'none' }}>
                      <div style={{ width: '62px', height: '62px', borderRadius: '18px', background: `linear-gradient(135deg, ${GOLD}45, ${GOLD}18)`, border: `1.5px solid ${GOLD}70`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 16px ${GOLD}30` }}>
                        <FiShoppingBag size={22} style={{ color: GOLD }} />
                      </div>
                      <span style={{ fontSize: '10px', color: GOLD, fontFamily: 'inherit', letterSpacing: '0.01em', textAlign: 'center', lineHeight: 1.3, paddingLeft: '4px', paddingRight: '4px', fontWeight: '600' }}>My Store</span>
                    </Link>
                  ) : (
                    <Link to="/seller/register" onClick={() => setCategoriesOpen(false)}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '16px 0 13px', gap: '9px', borderBottom: '1px solid rgba(201,168,76,0.12)', borderLeft: '3px solid transparent', textDecoration: 'none' }}>
                      <div style={{ width: '62px', height: '62px', borderRadius: '18px', background: `${GOLD}18`, border: `1.5px solid ${GOLD}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiShoppingBag size={22} style={{ color: GOLD }} />
                      </div>
                      <span style={{ fontSize: '11px', color: GOLD, fontFamily: 'inherit', letterSpacing: '0.01em', textAlign: 'center', lineHeight: 1.3, paddingLeft: '4px', paddingRight: '4px' }}>Sell</span>
                    </Link>
                  )}

                  {user && (
                    <button onClick={handleLogout}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '16px 0 13px', gap: '9px', marginTop: 'auto', background: 'transparent', border: 'none', borderTop: '1px solid rgba(248,113,113,0.15)', borderLeft: '3px solid transparent', cursor: 'pointer' }}>
                      <div style={{ width: '62px', height: '62px', borderRadius: '18px', background: 'rgba(248,113,113,0.08)', border: '1.5px solid rgba(248,113,113,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiLogOut size={22} style={{ color: '#f87171' }} />
                      </div>
                      <span style={{ fontSize: '12px', color: '#f87171', fontFamily: 'inherit', letterSpacing: '0.01em' }}>Logout</span>
                    </button>
                  )}
                </div>

                {/* Divider */}
                <div style={{ width: '2px', flexShrink: 0, background: '#111111', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, background: 'linear-gradient(to bottom, transparent 0%, rgba(201,168,76,0.35) 20%, rgba(201,168,76,0.55) 50%, rgba(201,168,76,0.35) 80%, transparent 100%)' }} />
                  <motion.div animate={{ y: ['0%', '85%', '0%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ position: 'absolute', top: '5%', width: '6px', height: '32px', borderRadius: '3px', marginLeft: '-2px', background: 'linear-gradient(to bottom, transparent, #C9A84C, #dbbe6a, #C9A84C, transparent)', boxShadow: '0 0 10px rgba(201,168,76,0.80), 0 0 20px rgba(201,168,76,0.40)', zIndex: 2 }} />
                </div>

                {/* Right panel */}
                <div style={{ flex: 1, overflowY: 'auto', background: '#000000' }}>
                  <AnimatePresence mode="wait">
                    <motion.div key={activeCat} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                      {/* Hero card */}
                      <div onClick={() => { navigate(`/shop/${activeCat.toLowerCase()}`); setCategoriesOpen(false); }}
                        style={{ margin: '14px 12px 0', borderRadius: '20px', background: CAT_CONFIG[activeCat].bg, border: `1px solid ${CAT_CONFIG[activeCat].color}25`, padding: '20px 20px', position: 'relative', overflow: 'hidden', cursor: 'pointer', minHeight: '110px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                        <div style={{ position: 'absolute', right: '-30px', top: '-30px', width: '160px', height: '160px', borderRadius: '50%', background: `radial-gradient(circle, ${CAT_CONFIG[activeCat].color}30 0%, transparent 65%)`, pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.80 }}>
                          {(() => { const H = HeroIllustrations[activeCat]; return H ? <H color={CAT_CONFIG[activeCat].color} /> : null; })()}
                        </div>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                          <span style={{ display: 'inline-block', fontSize: '8px', letterSpacing: '0.20em', textTransform: 'uppercase', color: CAT_CONFIG[activeCat].color, background: `${CAT_CONFIG[activeCat].color}15`, border: `1px solid ${CAT_CONFIG[activeCat].color}30`, padding: '3px 10px', borderRadius: '999px', marginBottom: '8px' }}>
                            {CAT_CONFIG[activeCat].tag} · {CAT_CONFIG[activeCat].count}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                            <h3 style={{ fontSize: '26px', fontWeight: 300, color: '#f0e8d8', margin: 0, letterSpacing: '-0.01em', lineHeight: 1 }}>{activeCat}</h3>
                            <span style={{ fontSize: '11px', color: `${CAT_CONFIG[activeCat].color}80` }}>→</span>
                          </div>
                        </div>
                      </div>

                      {/* Section label */}
                      <div style={{ padding: '16px 12px 10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ height: '1px', flex: 1, background: 'rgba(201,168,76,0.18)' }} />
                        <span style={{ fontSize: '8px', letterSpacing: '0.20em', color: 'rgba(201,168,76,0.55)', textTransform: 'uppercase' }}>Shop by style</span>
                        <div style={{ height: '1px', flex: 1, background: 'rgba(201,168,76,0.18)' }} />
                      </div>

                      {/* Subcategory grid — uses full SUB_CATEGORIES data */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '0 12px 16px' }}>
                        {(subCategories[activeCat] || []).map((sub, idx) => {
                          const SubIcon = SubIcons[sub.name];
                          const cc = CAT_CONFIG[activeCat].color;
                          return (
                            <motion.button key={sub.name} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.14, delay: idx * 0.02 }}
                              onClick={() => { navigate(`/shop?category=${activeCat}&search=${encodeURIComponent(sub.name)}`); setCategoriesOpen(false); }}
                              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '16px 8px 12px', borderRadius: '18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', cursor: 'pointer', transition: 'all 0.14s', position: 'relative', overflow: 'hidden' }}
                              onTouchStart={e => { e.currentTarget.style.background = `${cc}20`; e.currentTarget.style.borderColor = `${cc}50`; e.currentTarget.style.transform = 'scale(0.96)'; }}
                              onTouchEnd={e   => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; e.currentTarget.style.transform = 'scale(1)'; }}
                              onMouseEnter={e => { e.currentTarget.style.background = `${cc}10`; e.currentTarget.style.borderColor = `${cc}35`; e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = `0 0 12px rgba(201,168,76,0.25)`; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                              <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: `linear-gradient(135deg, ${cc}38, ${cc}18)`, border: `1px solid ${cc}45`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {SubIcon ? <SubIcon c={cc} size={24} /> : <span style={{ fontSize: '20px' }}>{sub.icon}</span>}
                              </div>
                              <span style={{ fontSize: '11px', color: 'rgba(240,232,216,0.92)', fontFamily: 'inherit', lineHeight: 1.3, textAlign: 'center', wordBreak: 'break-word', fontWeight: 400 }}>{sub.name}</span>
                            </motion.button>
                          );
                        })}
                      </div>

                      {/* View all CTA */}
                      <div style={{ padding: '0 12px 20px' }}>
                        <button onClick={() => { navigate(`/shop/${activeCat.toLowerCase()}`); setCategoriesOpen(false); }}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderRadius: '18px', background: `linear-gradient(135deg, ${CAT_CONFIG[activeCat].color}20, ${CAT_CONFIG[activeCat].color}08)`, border: `1px solid ${CAT_CONFIG[activeCat].color}30`, cursor: 'pointer', transition: 'all 0.15s' }}>
                          <div>
                            <p style={{ fontSize: '9px', color: `${CAT_CONFIG[activeCat].color}70`, margin: '0 0 3px', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Full collection</p>
                            <p style={{ fontSize: '15px', color: '#f0e8d8', margin: 0, fontWeight: 300, letterSpacing: '0.02em' }}>Shop all {activeCat}</p>
                          </div>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `linear-gradient(135deg, ${GOLD}, #7a5c18)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 16px ${GOLD}35` }}>
                            <FiChevronRight size={18} style={{ color: '#000000' }} />
                          </div>
                        </button>
                      </div>

                      {/* Legal links */}
                      <div style={{ margin: '0 12px 24px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '10px 14px 6px', margin: 0, fontFamily: 'inherit' }}>Legal</p>
                        {[
                          { to: '/legal/privacy-policy',   label: 'Privacy Policy'   },
                          { to: '/legal/terms-of-service', label: 'Terms of Service' },
                          { to: '/legal/refund-policy',    label: 'Refund Policy'    },
                          { to: '/legal/shipping-policy',  label: 'Shipping Policy'  },
                          { to: '/legal/cookie-policy',    label: 'Cookie Policy'    },
                          { to: '/legal/disclaimer',       label: 'Disclaimer'       },
                        ].map(({ to, label }, i) => (
                          <Link key={to} to={to} onClick={() => setCategoriesOpen(false)}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', textDecoration: 'none', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
                            onTouchStart={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'}
                            onTouchEnd={e   => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <FiFileText size={13} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
                              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontFamily: 'inherit' }}>{label}</span>
                            </div>
                            <FiChevronRight size={12} style={{ color: 'rgba(255,255,255,0.2)' }} />
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} isDark={isDark} />
    </>
  );
}