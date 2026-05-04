import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { productAPI } from '../services/api';
import ProductCard from '../components/product/ProductCard';
import { FiFilter, FiX, FiChevronDown, FiChevronUp, FiSearch, FiCheck, FiArrowRight } from 'react-icons/fi';
import { getSubCategoryNames } from '../constants/categories';

const CATEGORIES = ['Men', 'Women', 'Streetwear', 'Accessories', 'Kids'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Top Rated', value: 'rating' },
  { label: 'Most Popular', value: 'popular' },
];

const BG_GRADIENT = 'linear-gradient(160deg, #0d0d0d 0%, #080808 50%, #030303 100%)';
const SURFACE = 'rgba(18,18,18,0.96)';
const SURFACE_SOFT = 'rgba(15,15,15,0.82)';
const SURFACE_CARD = 'rgba(22,22,22,0.99)';
const GOLD = '#c9a84c';
const BORDER = 'rgba(255,255,255,0.12)';
const BORDER_HOVER = 'rgba(201,168,76,0.40)';
const TEXT_PRIMARY = '#f8f8f8';
const TEXT_MUTED = '#a8a8a8';
const TEXT_SOFT = 'rgba(255,255,255,0.45)';

/* ─── Inject shop grid styles once ───────────────────────────────────── */
const injectShopStyles = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById('shop-grid-styles')) return;
  const s = document.createElement('style');
  s.id = 'shop-grid-styles';
  s.textContent = `
    /* Shop product grid */
    .product-grid-shop {
      display: grid;
      gap: 10px;
      grid-template-columns: repeat(2, 1fr);
    }
    @media (min-width: 768px) {
      .product-grid-shop {
        gap: 14px;
        grid-template-columns: repeat(3, 1fr);
      }
    }
    @media (min-width: 1024px) {
      .product-grid-shop {
        gap: 18px;
        grid-template-columns: repeat(3, 1fr);
      }
    }

    /* Shop skeleton */
    .shop-skel-card {
      border-radius: 16px; overflow: hidden;
      background: rgba(22,16,10,0.80);
      border: 1px solid rgba(255,255,255,0.08);
    }
    .shop-skel-img {
      width: 100%;
      padding-top: 125%;
      background: rgba(30,22,12,0.55);
      animation: shopSkPulse 1.4s ease-in-out infinite;
    }
    .shop-skel-line {
      height: 10px; border-radius: 6px;
      animation: shopSkPulse 1.4s ease-in-out infinite;
    }
    @keyframes shopSkPulse {
      0%,100%{opacity:0.5;}50%{opacity:1;}
    }
  `;
  document.head.appendChild(s);
};

/* ─── Sort Dropdown ──────────────────────────────────────────────────── */
function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = SORT_OPTIONS.find(o => o.value === value);
  useEffect(() => {
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative', minWidth: '152px' }}>
      <button onClick={() => setOpen(p => !p)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '8px', width: '100%', padding: '8px 12px',
        background: SURFACE_SOFT, border: `1px solid ${open ? BORDER_HOVER : BORDER}`,
        borderRadius: '10px', color: TEXT_PRIMARY, fontSize: '12px',
        fontFamily: 'inherit', cursor: 'pointer', transition: 'border-color 0.15s', whiteSpace: 'nowrap',
      }}>
        <span>{current?.label}</span>
        <FiChevronDown size={13} style={{ color: GOLD, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s', flexShrink: 0 }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.14, ease: 'easeOut' }}
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 100,
              minWidth: '100%', background: SURFACE_CARD, border: `1px solid ${BORDER_HOVER}`,
              borderRadius: '12px', padding: '4px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.75)',
            }}
          >
            {SORT_OPTIONS.map(opt => {
              const active = opt.value === value;
              return (
                <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(201,168,76,0.07)'; e.currentTarget.style.color = TEXT_PRIMARY; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = TEXT_MUTED; } }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: '10px', width: '100%', padding: '9px 12px', borderRadius: '8px',
                    background: active ? 'rgba(201,168,76,0.12)' : 'transparent', border: 'none',
                    color: active ? GOLD : TEXT_MUTED, fontSize: '12px', fontFamily: 'inherit',
                    cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s, color 0.12s', whiteSpace: 'nowrap',
                  }}
                >
                  <span>{opt.label}</span>
                  {active && <FiCheck size={12} style={{ color: GOLD, flexShrink: 0 }} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Collapsible Filter Section ─────────────────────────────────────── */
function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: `1px solid ${BORDER}`, paddingBottom: '18px', marginBottom: '18px' }}>
      <button onClick={() => setOpen(p => !p)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', marginBottom: open ? '14px' : '0',
        background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'margin 0.18s',
      }}>
        <span style={{ fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: TEXT_SOFT, fontFamily: 'inherit' }}>{title}</span>
        {open
          ? <FiChevronUp size={13} style={{ color: GOLD, flexShrink: 0 }} />
          : <FiChevronDown size={13} style={{ color: TEXT_SOFT, flexShrink: 0 }} />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="c"
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Pill Button ─────────────────────────────────────────────────────── */
function PillBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 16px', fontSize: '12px', borderRadius: '999px',
      background: active ? `linear-gradient(135deg, ${GOLD}, #a07830)` : 'rgba(18,18,18,0.90)',
      border: `1px solid ${active ? GOLD : BORDER}`,
      color: active ? '#030303' : TEXT_MUTED,
      cursor: 'pointer', fontFamily: 'inherit',
      fontWeight: active ? 600 : 400, whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s',
    }}>
      {label}
    </button>
  );
}

/* ─── Price Range Filter ──────────────────────────────────────────────── */
function PriceRangeFilter({ minPrice, maxPrice, onApply }) {
  const [draftMin, setDraftMin] = useState(minPrice);
  const [draftMax, setDraftMax] = useState(maxPrice);
  const [minFocused, setMinFocused] = useState(false);
  const [maxFocused, setMaxFocused] = useState(false);

  useEffect(() => { setDraftMin(minPrice); }, [minPrice]);
  useEffect(() => { setDraftMax(maxPrice); }, [maxPrice]);

  const isActive = minPrice !== '' || maxPrice !== '';
  const isDirty = draftMin !== minPrice || draftMax !== maxPrice;

  const handleApply = () => {
    const mn = draftMin === '' ? '' : Number(draftMin);
    const mx = draftMax === '' ? '' : Number(draftMax);
    if (mn !== '' && mx !== '' && mn > mx) {
      onApply(String(mx), String(mn));
      setDraftMin(String(mx)); setDraftMax(String(mn));
      return;
    }
    onApply(String(draftMin), String(draftMax));
  };

  const inputStyle = focused => ({
    flex: 1, padding: '10px 12px', fontSize: '13px',
    background: 'rgba(10,10,10,0.85)',
    border: `1px solid ${focused ? BORDER_HOVER : BORDER}`,
    borderRadius: '10px', color: TEXT_PRIMARY, fontFamily: 'inherit',
    outline: 'none', minWidth: 0, transition: 'border-color 0.15s',
    WebkitAppearance: 'none', MozAppearance: 'textfield',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {isActive && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '3px 10px', borderRadius: '999px',
          background: 'rgba(201,168,76,0.10)', border: `1px solid rgba(201,168,76,0.28)`,
          fontSize: '11px', color: GOLD, width: 'fit-content',
        }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: GOLD, flexShrink: 0 }} />
          {minPrice && maxPrice
            ? `₹${Number(minPrice).toLocaleString('en-IN')} – ₹${Number(maxPrice).toLocaleString('en-IN')}`
            : minPrice ? `From ₹${Number(minPrice).toLocaleString('en-IN')}` : `Up to ₹${Number(maxPrice).toLocaleString('en-IN')}`}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input type="number" placeholder="Min ₹" value={draftMin}
          onChange={e => setDraftMin(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleApply()}
          onFocus={() => setMinFocused(true)} onBlur={() => setMinFocused(false)}
          style={inputStyle(minFocused)} />
        <span style={{ color: 'rgba(201,168,76,0.4)', fontSize: '16px', fontWeight: 300, flexShrink: 0 }}>—</span>
        <input type="number" placeholder="Max ₹" value={draftMax}
          onChange={e => setDraftMax(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleApply()}
          onFocus={() => setMaxFocused(true)} onBlur={() => setMaxFocused(false)}
          style={inputStyle(maxFocused)} />
      </div>
      {isDirty && (
        <motion.button initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} onClick={handleApply}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '9px 0', width: '100%', fontSize: '12px',
            background: `linear-gradient(135deg, ${GOLD}, #a07830)`,
            border: 'none', borderRadius: '10px', color: '#030303',
            cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, letterSpacing: '0.04em',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          Apply Range <FiArrowRight size={12} />
        </motion.button>
      )}
      {isActive && !isDirty && (
        <button onClick={() => { setDraftMin(''); setDraftMax(''); onApply('', ''); }}
          style={{ fontSize: '11px', padding: 0, background: 'none', border: 'none', color: TEXT_SOFT, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', textDecoration: 'underline' }}>
          Clear price filter
        </button>
      )}
    </div>
  );
}

/* ─── Skeleton Grid ───────────────────────────────────────────────────── */
function ShopSkeletonGrid() {
  return (
    <div className="product-grid-shop">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="shop-skel-card">
          <div className="shop-skel-img" />
          <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
            <div className="shop-skel-line" style={{ width: '55%', background: 'rgba(30,22,12,0.7)' }} />
            <div className="shop-skel-line" style={{ width: '80%', background: 'rgba(30,22,12,0.55)' }} />
            <div className="shop-skel-line" style={{ width: '40%', background: 'rgba(30,22,12,0.4)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Main ShopPage ───────────────────────────────────────────────────── */
export default function ShopPage() {
  injectShopStyles();

  const { category: urlCategory } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [filters, setFilters] = useState({
    category: urlCategory ? urlCategory.charAt(0).toUpperCase() + urlCategory.slice(1) : searchParams.get('category') || '',
    search: searchParams.get('search') || '',
    subCategory: '',
    minPrice: '',
    maxPrice: '',
    sizes: [],
    sort: 'newest',
    page: 1,
  });

  useEffect(() => {
    const newCategory = urlCategory ? urlCategory.charAt(0).toUpperCase() + urlCategory.slice(1) : searchParams.get('category') || '';
    const newSearch = searchParams.get('search') || '';
    setFilters(prev => ({ ...prev, category: newCategory, search: newSearch, subCategory: '', page: 1 }));
  }, [location.pathname, location.search, urlCategory, searchParams]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, search: filters.subCategory || filters.search };
      if (filters.sizes.length) params.size = filters.sizes.join(',');
      const res = await productAPI.getAll(params);
      setProducts(res.products);
      setPagination(res.pagination);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const updateFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value, page: key === 'page' ? value : 1 }));
  const toggleSize = size => setFilters(prev => ({ ...prev, sizes: prev.sizes.includes(size) ? prev.sizes.filter(s => s !== size) : [...prev.sizes, size], page: 1 }));
  const applyPriceRange = (min, max) => setFilters(prev => ({ ...prev, minPrice: min, maxPrice: max, page: 1 }));
  const clearFilters = () => setFilters({ category: '', search: '', subCategory: '', minPrice: '', maxPrice: '', sizes: [], sort: 'newest', page: 1 });

  const subCategoryNames = filters.category ? getSubCategoryNames(filters.category) : [];

  /* ── Filters Panel ── */
  const FiltersPanel = () => (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: TEXT_SOFT }}>Filters</span>
        <button onClick={clearFilters} style={{
          fontSize: '11px', padding: '4px 12px', borderRadius: '999px',
          color: GOLD, background: 'rgba(201,168,76,0.10)',
          border: `1px solid rgba(201,168,76,0.25)`, cursor: 'pointer', fontFamily: 'inherit',
        }}>Clear All</button>
      </div>

      {filters.category && subCategoryNames.length > 0 && (
        <FilterSection title={`${filters.category} · Styles`}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {subCategoryNames.map(sub => {
              const active = filters.subCategory === sub;
              return (
                <button key={sub} onClick={() => updateFilter('subCategory', active ? '' : sub)} style={{
                  padding: '5px 12px', fontSize: '11px', borderRadius: '999px',
                  background: active ? `linear-gradient(135deg, ${GOLD}, #a07830)` : 'transparent',
                  border: `1px solid ${active ? GOLD : BORDER}`,
                  color: active ? '#030303' : TEXT_MUTED,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                }}>{sub}</button>
              );
            })}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Category">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[...CATEGORIES, null].map(cat => {
            const active = cat ? filters.category === cat : !filters.category;
            const label = cat ?? 'All Categories';
            return (
              <label key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <span style={{
                  width: '15px', height: '15px', borderRadius: '50%',
                  border: `1.5px solid ${active ? GOLD : BORDER}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  boxShadow: active ? `0 0 0 3px rgba(201,168,76,0.15)` : 'none', transition: 'all 0.15s',
                }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: active ? GOLD : 'transparent', transition: 'background 0.15s' }} />
                </span>
                <span style={{ fontSize: '13px', color: active ? TEXT_PRIMARY : TEXT_MUTED, transition: 'color 0.15s' }}>{label}</span>
                <input type="radio" name="category" style={{ display: 'none' }} checked={active} onChange={() => updateFilter('category', cat ?? '')} />
              </label>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Price Range">
        <PriceRangeFilter minPrice={filters.minPrice} maxPrice={filters.maxPrice} onApply={applyPriceRange} />
      </FilterSection>

      <FilterSection title="Size" defaultOpen={false}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {SIZES.map(size => {
            const active = filters.sizes.includes(size);
            return (
              <button key={size} onClick={() => toggleSize(size)} style={{
                padding: '5px 12px', fontSize: '11px', borderRadius: '999px',
                background: active ? `linear-gradient(135deg, ${GOLD}, #a07830)` : SURFACE_SOFT,
                border: `1px solid ${active ? GOLD : BORDER}`,
                color: active ? '#030303' : TEXT_MUTED,
                cursor: 'pointer', fontFamily: 'inherit',
                fontWeight: active ? 600 : 400, transition: 'all 0.15s',
              }}>{size}</button>
            );
          })}
        </div>
      </FilterSection>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: BG_GRADIENT }}>

      {/* ── Sticky top bar ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        background: 'linear-gradient(to bottom, rgba(10,8,6,0.98) 0%, rgba(10,8,6,0.92) 75%, rgba(10,8,6,0) 100%)',
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>

          {/* Row 1 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '16px 0 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              {filters.category && (
                <div style={{ width: '3px', height: '34px', borderRadius: '2px', background: `linear-gradient(to bottom, #d4d4d4, ${GOLD}, #a07830)`, flexShrink: 0 }} />
              )}
              <div style={{ minWidth: 0 }}>
                {filters.category && (
                  <p style={{ fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: TEXT_SOFT, margin: '0 0 2px' }}>{filters.category}</p>
                )}
                <h1 style={{ fontSize: 'clamp(1.1rem,3vw,1.7rem)', fontWeight: 300, color: TEXT_PRIMARY, lineHeight: 1.1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {filters.subCategory || filters.search || (filters.category ? `Shop ${filters.category}` : 'Discover Everything')}
                </h1>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px',
                background: 'rgba(201,168,76,0.08)', border: `1px solid rgba(201,168,76,0.22)`,
                borderRadius: '999px', whiteSpace: 'nowrap',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(5,4,3,0.95)', border: `1px solid rgba(201,168,76,0.32)`, fontSize: '10px', color: GOLD, fontWeight: 600 }}>
                  {pagination.total || 0}
                </span>
                <span style={{ fontSize: '11px', color: GOLD }}>{pagination.total === 1 ? '1 product' : `${pagination.total} products`}</span>
              </div>
              <div className="hidden sm:flex" style={{ alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: TEXT_SOFT, whiteSpace: 'nowrap' }}>Sort</span>
                <SortDropdown value={filters.sort} onChange={v => updateFilter('sort', v)} />
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '12px' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
              <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: TEXT_SOFT, pointerEvents: 'none', width: '14px', height: '14px' }} />
              <input type="text" placeholder="Search products, brands or tags..."
                value={filters.search}
                onChange={e => setFilters(prev => ({ ...prev, search: e.target.value, subCategory: '', page: 1 }))}
                style={{ width: '100%', paddingLeft: '36px', paddingRight: '14px', paddingTop: '9px', paddingBottom: '9px', fontSize: '12px', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '10px', color: TEXT_PRIMARY, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <button onClick={() => setFiltersOpen(true)} className="lg:hidden"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', fontSize: '12px', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '10px', color: TEXT_MUTED, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
              <FiFilter size={13} /> Filters
            </button>
            <div className="sm:hidden" style={{ flexShrink: 0 }}>
              <SortDropdown value={filters.sort} onChange={v => updateFilter('sort', v)} />
            </div>
          </div>

          {/* Row 3 — subcategory pills */}
          {filters.category && subCategoryNames.length > 0 && (
            <div style={{ overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', width: 'max-content' }}>
                <PillBtn label={`All ${filters.category}`} active={!filters.subCategory} onClick={() => updateFilter('subCategory', '')} />
                {subCategoryNames.map(sub => (
                  <PillBtn key={sub} label={sub} active={filters.subCategory === sub}
                    onClick={() => setFilters(prev => ({ ...prev, subCategory: prev.subCategory === sub ? '' : sub, search: '', page: 1 }))} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

          {/* Desktop sidebar */}
          <aside className="hidden lg:block" style={{
            width: '210px', flexShrink: 0, background: SURFACE, borderRadius: '16px',
            border: `1px solid ${BORDER}`, padding: '20px',
            position: 'sticky', top: '130px', boxShadow: '0 12px 36px rgba(0,0,0,0.45)',
          }}>
            <FiltersPanel />
          </aside>

          {/* Product grid */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? <ShopSkeletonGrid /> : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <p style={{ fontSize: '26px', fontWeight: 300, color: 'rgba(160,140,110,0.18)', marginBottom: '10px' }}>Nothing matches your vibe yet.</p>
                <p style={{ fontSize: '13px', color: TEXT_SOFT, marginBottom: '24px' }}>Try clearing filters or exploring another category.</p>
                <button onClick={clearFilters} style={{ padding: '10px 28px', fontSize: '12px', borderRadius: '999px', background: `linear-gradient(135deg, ${GOLD}, #a07830)`, color: '#030303', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                  Reset filters
                </button>
              </div>
            ) : (
              <>
                <div className="product-grid-shop">
                  {products.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
                </div>

                {pagination.pages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '48px' }}>
                    {[...Array(pagination.pages)].map((_, i) => {
                      const page = i + 1;
                      const active = filters.page === page;
                      return (
                        <button key={page} onClick={() => updateFilter('page', page)} style={{
                          width: '38px', height: '38px', borderRadius: '50%', fontSize: '12px',
                          background: active ? `linear-gradient(135deg, ${GOLD}, #a07830)` : 'transparent',
                          color: active ? '#030303' : TEXT_SOFT,
                          border: `1px solid ${active ? GOLD : 'rgba(160,130,80,0.22)'}`,
                          cursor: 'pointer', fontFamily: 'inherit', fontWeight: active ? 700 : 400, transition: 'all 0.15s',
                        }}>{page}</button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile Filter Drawer ── */}
      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setFiltersOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(5,4,3,0.76)', backdropFilter: 'blur(4px)' }} />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.22 }}
              style={{ position: 'fixed', left: 0, top: 0, height: '100%', width: '290px', zIndex: 50, padding: '24px', overflowY: 'auto', background: 'linear-gradient(to bottom,#0d0d0d,#080808,#030303)', borderRight: `1px solid ${BORDER}`, boxShadow: '12px 0 40px rgba(0,0,0,0.60)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: TEXT_PRIMARY, margin: 0 }}>Refine results</h2>
                <button onClick={() => setFiltersOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SOFT, padding: '4px' }}>
                  <FiX size={18} />
                </button>
              </div>
              <FiltersPanel />
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}