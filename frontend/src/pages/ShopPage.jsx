import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { productAPI } from '../services/api';
import ProductCard from '../components/product/ProductCard';
import { FiFilter, FiX, FiChevronDown, FiChevronUp, FiSearch, FiCheck } from 'react-icons/fi';
import { getSubCategoryNames } from '../constants/categories';

const CATEGORIES = ['Men', 'Women', 'Streetwear', 'Accessories', 'Kids'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
const SORT_OPTIONS = [
  { label: 'Newest First',       value: 'newest'     },
  { label: 'Price: Low to High', value: 'price-asc'  },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Top Rated',          value: 'rating'     },
  { label: 'Most Popular',       value: 'popular'    },
];

// ─── Colour palette: Black · Gold · Brown ─────────────────────────────────────
const BG_GRADIENT  = 'linear-gradient(160deg, #100c08 0%, #0a0806 50%, #050403 100%)';
const SURFACE      = 'rgba(22, 16, 10, 0.96)';
const SURFACE_SOFT = 'rgba(18, 13, 8, 0.82)';
const SURFACE_CARD = 'rgba(26, 19, 11, 0.99)';
const GOLD         = '#c9a84c';
const GOLD_LIGHT   = '#dbbe6a';
const BORDER       = 'rgba(180, 140, 60, 0.18)';
const BORDER_HOVER = 'rgba(201, 168, 76, 0.40)';
const TEXT_PRIMARY = '#f0e8d8';
const TEXT_MUTED   = '#a08c6e';
const TEXT_SOFT    = 'rgba(160, 140, 110, 0.60)';
// ──────────────────────────────────────────────────────────────────────────────

// ─── Custom Sort Dropdown (replaces native <select>) ──────────────────────────
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
      {/* Trigger button */}
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          gap:            '8px',
          width:          '100%',
          padding:        '8px 12px',
          background:     SURFACE_SOFT,
          border:         `1px solid ${open ? BORDER_HOVER : BORDER}`,
          borderRadius:   '10px',
          color:          TEXT_PRIMARY,
          fontSize:       '12px',
          fontFamily:     'inherit',
          cursor:         'pointer',
          transition:     'border-color 0.15s',
          whiteSpace:     'nowrap',
        }}
      >
        <span>{current?.label}</span>
        <FiChevronDown
          size={13}
          style={{
            color:      GOLD,
            transform:  open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.18s',
            flexShrink: 0,
          }}
        />
      </button>
      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{   opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            style={{
              position:     'absolute',
              top:          'calc(100% + 6px)',
              right:        0,
              zIndex:       100,
              minWidth:     '100%',
              background:   SURFACE_CARD,
              border:       `1px solid ${BORDER_HOVER}`,
              borderRadius: '12px',
              padding:      '4px',
              boxShadow:    `0 20px 50px rgba(0,0,0,0.75), 0 0 0 1px rgba(201,168,76,0.06)`,
            }}
          >
            {SORT_OPTIONS.map(opt => {
              const active = opt.value === value;
              return (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.background = 'rgba(201,168,76,0.07)';
                      e.currentTarget.style.color = TEXT_PRIMARY;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = TEXT_MUTED;
                    }
                  }}
                  style={{
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'space-between',
                    gap:            '10px',
                    width:          '100%',
                    padding:        '9px 12px',
                    borderRadius:   '8px',
                    background:     active ? 'rgba(201,168,76,0.12)' : 'transparent',
                    border:         'none',
                    color:          active ? GOLD : TEXT_MUTED,
                    fontSize:       '12px',
                    fontFamily:     'inherit',
                    cursor:         'pointer',
                    textAlign:      'left',
                    transition:     'background 0.12s, color 0.12s',
                    whiteSpace:     'nowrap',
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

// ─── Collapsible filter section ───────────────────────────────────────────────
function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: `1px solid ${BORDER}`, paddingBottom: '18px', marginBottom: '18px' }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          width:          '100%',
          marginBottom:   '14px',
          background:     'none',
          border:         'none',
          cursor:         'pointer',
          padding:        0,
        }}
      >
        <span style={{ fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: TEXT_SOFT, fontFamily: 'inherit' }}>
          {title}
        </span>
        {open
          ? <FiChevronUp   size={13} style={{ color: GOLD,     flexShrink: 0 }} />
          : <FiChevronDown size={13} style={{ color: TEXT_SOFT, flexShrink: 0 }} />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="c"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{   height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Pill button ──────────────────────────────────────────────────────────────
function PillBtn({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding:      '7px 16px',
        fontSize:     '12px',
        borderRadius: '999px',
        background:   active ? `linear-gradient(135deg, ${GOLD}, #9a7530)` : 'rgba(22,16,10,0.90)',
        border:       `1px solid ${active ? GOLD : BORDER}`,
        color:        active ? '#0a0806' : TEXT_MUTED,
        cursor:       'pointer',
        fontFamily:   'inherit',
        fontWeight:   active ? 600 : 400,
        whiteSpace:   'nowrap',
        flexShrink:   0,
        transition:   'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ShopPage() {
  const { category: urlCategory } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const [products,    setProducts]    = useState([]);
  const [pagination,  setPagination]  = useState({ page: 1, pages: 1, total: 0 });
  const [loading,     setLoading]     = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [filters, setFilters] = useState({
    category: urlCategory
      ? urlCategory.charAt(0).toUpperCase() + urlCategory.slice(1)
      : searchParams.get('category') || '',
    search:   searchParams.get('search') || '',
    minPrice: '',
    maxPrice: '',
    sizes:    [],
    sort:     'newest',
    page:     1,
  });

  useEffect(() => {
    const newCategory = urlCategory
      ? urlCategory.charAt(0).toUpperCase() + urlCategory.slice(1)
      : searchParams.get('category') || '';
    const newSearch = searchParams.get('search') || '';
    setFilters(prev => ({ ...prev, category: newCategory, search: newSearch, page: 1 }));
  }, [location.pathname, location.search, urlCategory, searchParams]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (filters.sizes.length) params.size = filters.sizes.join(',');
      const res = await productAPI.getAll(params);
      setProducts(res.products);
      setPagination(res.pagination);
    } catch { /* handle */ }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const updateFilter = (key, value) =>
    setFilters(prev => ({ ...prev, [key]: value, page: key === 'page' ? value : 1 }));

  const toggleSize = size =>
    setFilters(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size) ? prev.sizes.filter(s => s !== size) : [...prev.sizes, size],
      page: 1,
    }));

  const clearFilters = () =>
    setFilters({ category: '', search: '', minPrice: '', maxPrice: '', sizes: [], sort: 'newest', page: 1 });

  // Get full subcategory list from categories.js for the active category
  const subCategoryNames = filters.category ? getSubCategoryNames(filters.category) : [];

  // ── Filters panel (desktop sidebar + mobile drawer) ──────────────────────────
  const FiltersPanel = () => (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: TEXT_SOFT }}>
          Filters
        </span>
        <button
          onClick={clearFilters}
          style={{
            fontSize:     '11px',
            padding:      '4px 12px',
            borderRadius: '999px',
            color:        GOLD,
            background:   'rgba(201,168,76,0.10)',
            border:       `1px solid rgba(201,168,76,0.25)`,
            cursor:       'pointer',
            fontFamily:   'inherit',
          }}
        >
          Clear All
        </button>
      </div>

      {/* Subcategory pills — full list from categories.js */}
      {filters.category && subCategoryNames.length > 0 && (
        <FilterSection title={`${filters.category} • Styles`}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {subCategoryNames.map(sub => {
              const active = filters.search === sub;
              return (
                <button
                  key={sub}
                  onClick={() => updateFilter('search', active ? '' : sub)}
                  style={{
                    padding:      '5px 12px',
                    fontSize:     '11px',
                    borderRadius: '999px',
                    background:   active ? `linear-gradient(135deg, ${GOLD}, #9a7530)` : 'transparent',
                    border:       `1px solid ${active ? GOLD : BORDER}`,
                    color:        active ? '#0a0806' : TEXT_MUTED,
                    cursor:       'pointer',
                    fontFamily:   'inherit',
                    transition:   'all 0.15s',
                  }}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      {/* Category */}
      <FilterSection title="Category">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[...CATEGORIES, null].map(cat => {
            const active = cat ? filters.category === cat : !filters.category;
            const label  = cat ?? 'All Categories';
            return (
              <label key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <span style={{
                  width:        '15px', height: '15px',
                  borderRadius: '50%',
                  border:       `1.5px solid ${active ? GOLD : BORDER}`,
                  display:      'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink:   0,
                  boxShadow:    active ? `0 0 0 3px rgba(201,168,76,0.15)` : 'none',
                  transition:   'all 0.15s',
                }}>
                  <span style={{
                    width:           '7px', height: '7px',
                    borderRadius:    '50%',
                    backgroundColor: active ? GOLD : 'transparent',
                    transition:      'background 0.15s',
                  }} />
                </span>
                <span style={{ fontSize: '13px', color: active ? TEXT_PRIMARY : TEXT_MUTED, transition: 'color 0.15s' }}>
                  {label}
                </span>
                <input type="radio" name="category" style={{ display: 'none' }}
                  checked={active} onChange={() => updateFilter('category', cat ?? '')} />
              </label>
            );
          })}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="number"
            placeholder="Min ₹"
            value={filters.minPrice}
            onChange={e => updateFilter('minPrice', e.target.value)}
            style={{
              flex: 1, padding: '8px 10px', fontSize: '12px',
              background: SURFACE_SOFT, border: `1px solid ${BORDER}`,
              borderRadius: '8px', color: TEXT_PRIMARY, fontFamily: 'inherit',
              outline: 'none', minWidth: 0,
            }}
          />
          <span style={{ color: TEXT_SOFT, fontSize: '13px' }}>–</span>
          <input
            type="number"
            placeholder="Max ₹"
            value={filters.maxPrice}
            onChange={e => updateFilter('maxPrice', e.target.value)}
            style={{
              flex: 1, padding: '8px 10px', fontSize: '12px',
              background: SURFACE_SOFT, border: `1px solid ${BORDER}`,
              borderRadius: '8px', color: TEXT_PRIMARY, fontFamily: 'inherit',
              outline: 'none', minWidth: 0,
            }}
          />
        </div>
      </FilterSection>

      {/* Size */}
      <FilterSection title="Size" defaultOpen={false}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {SIZES.map(size => {
            const active = filters.sizes.includes(size);
            return (
              <button
                key={size}
                onClick={() => toggleSize(size)}
                style={{
                  padding:      '5px 12px', fontSize: '11px',
                  borderRadius: '999px',
                  background:   active ? `linear-gradient(135deg, ${GOLD}, #9a7530)` : SURFACE_SOFT,
                  border:       `1px solid ${active ? GOLD : BORDER}`,
                  color:        active ? '#0a0806' : TEXT_MUTED,
                  cursor:       'pointer', fontFamily: 'inherit',
                  fontWeight:   active ? 600 : 400, transition: 'all 0.15s',
                }}
              >
                {size}
              </button>
            );
          })}
        </div>
      </FilterSection>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: BG_GRADIENT }}>

      {/* ═══ STICKY TOP BAR ═══════════════════════════════════════════════════ */}
      <div style={{
        position:             'sticky',
        top:                  0,
        zIndex:               30,
        backdropFilter:       'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background:           `linear-gradient(to bottom, rgba(10,8,6,0.98) 0%, rgba(10,8,6,0.92) 75%, rgba(10,8,6,0) 100%)`,
        borderBottom:         `1px solid ${BORDER}`,
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>

          {/* ── Row 1: Title  ·  Count + Sort ──── */}
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            gap:            '16px',
            padding:        '18px 0 12px',
          }}>
            {/* Left: gold bar + category label + page title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              {filters.category && (
                <div style={{
                  width:        '3px',
                  height:       '36px',
                  borderRadius: '2px',
                  background:   `linear-gradient(to bottom, ${GOLD_LIGHT}, ${GOLD}, #9a7530)`,
                  flexShrink:   0,
                }} />
              )}
              <div style={{ minWidth: 0 }}>
                {filters.category && (
                  <p style={{
                    fontSize: '10px', letterSpacing: '0.22em',
                    textTransform: 'uppercase', color: TEXT_SOFT, margin: '0 0 2px',
                  }}>
                    {filters.category}
                  </p>
                )}
                <h1 style={{
                  fontSize:     'clamp(1.3rem, 3.5vw, 1.8rem)',
                  fontWeight:   300,
                  color:        TEXT_PRIMARY,
                  lineHeight:   1.1,
                  margin:       0,
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace:   'nowrap',
                }}>
                  {filters.search
                    ? `"${filters.search}"`
                    : filters.category
                    ? `Shop ${filters.category}`
                    : 'Discover Everything'}
                </h1>
              </div>
            </div>

            {/* Right: count badge + Sort label + custom dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              {/* Count badge */}
              <div style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '7px',
                padding:      '5px 12px',
                background:   'rgba(201,168,76,0.08)',
                border:       `1px solid rgba(201,168,76,0.22)`,
                borderRadius: '999px',
                whiteSpace:   'nowrap',
              }}>
                <span style={{
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  width:          '18px',
                  height:         '18px',
                  borderRadius:   '50%',
                  background:     'rgba(5,4,3,0.95)',
                  border:         `1px solid rgba(201,168,76,0.32)`,
                  fontSize:       '10px',
                  color:          GOLD,
                  fontWeight:     600,
                }}>
                  {pagination.total || 0}
                </span>
                <span style={{ fontSize: '11px', color: GOLD }}>
                  {pagination.total === 1 ? '1 product' : `${pagination.total} products`}
                </span>
              </div>

              {/* Sort — desktop */}
              <div className="hidden sm:flex" style={{ alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: TEXT_SOFT, whiteSpace: 'nowrap' }}>Sort</span>
                <SortDropdown value={filters.sort} onChange={v => updateFilter('sort', v)} />
              </div>
            </div>
          </div>

          {/* ── Row 2: Search · Filters btn · mobile Sort ───────────────── */}
          <div style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '10px',
            paddingBottom:'14px',
          }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
              <FiSearch style={{
                position: 'absolute', left: '12px', top: '50%',
                transform: 'translateY(-50%)',
                color: TEXT_SOFT, pointerEvents: 'none', width: '14px', height: '14px',
              }} />
              <input
                type="text"
                placeholder="Search products, brands or tags..."
                value={filters.search}
                onChange={e => updateFilter('search', e.target.value)}
                style={{
                  width:         '100%',
                  paddingLeft:   '36px',
                  paddingRight:  '14px',
                  paddingTop:    '9px',
                  paddingBottom: '9px',
                  fontSize:      '12px',
                  background:    SURFACE,
                  border:        `1px solid ${BORDER}`,
                  borderRadius:  '10px',
                  color:         TEXT_PRIMARY,
                  fontFamily:    'inherit',
                  outline:       'none',
                  boxSizing:     'border-box',
                }}
              />
            </div>

            {/* Mobile Filters button */}
            <button
              onClick={() => setFiltersOpen(true)}
              className="lg:hidden"
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '6px',
                padding:      '9px 14px',
                fontSize:     '12px',
                background:   SURFACE,
                border:       `1px solid ${BORDER}`,
                borderRadius: '10px',
                color:        TEXT_MUTED,
                cursor:       'pointer',
                fontFamily:   'inherit',
                whiteSpace:   'nowrap',
                flexShrink:   0,
              }}
            >
              <FiFilter size={13} />
              Filters
            </button>

            {/* Mobile Sort */}
            <div className="sm:hidden" style={{ flexShrink: 0 }}>
              <SortDropdown value={filters.sort} onChange={v => updateFilter('sort', v)} />
            </div>
          </div>

          {/* ── Row 3: Subcategory pills — full list from categories.js ──── */}
          {filters.category && subCategoryNames.length > 0 && (
            <div style={{
              overflowX:               'auto',
              scrollbarWidth:          'none',
              WebkitOverflowScrolling: 'touch',
              paddingBottom:           '14px',
            }}>
              <div style={{ display: 'flex', gap: '8px', width: 'max-content' }}>
                <PillBtn
                  label={`All ${filters.category}`}
                  active={!filters.search}
                  onClick={() => updateFilter('search', '')}
                />
                {subCategoryNames.map(sub => (
                  <PillBtn
                    key={sub}
                    label={sub}
                    active={filters.search === sub}
                    onClick={() => updateFilter('search', filters.search === sub ? '' : sub)}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ═══ BODY ═════════════════════════════════════════════════════════════ */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '28px 24px' }}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

          {/* ── Desktop sidebar ─────────────────────────────────────────── */}
          <aside
            className="hidden lg:block"
            style={{
              width:        '216px',
              flexShrink:   0,
              background:   SURFACE,
              borderRadius: '16px',
              border:       `1px solid ${BORDER}`,
              padding:      '20px',
              position:     'sticky',
              top:          '130px',
              boxShadow:    '0 12px 36px rgba(0,0,0,0.45)',
            }}
          >
            <FiltersPanel />
          </aside>

          {/* ── Product grid ────────────────────────────────────────────── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{
                    borderRadius: '16px', overflow: 'hidden',
                    background:   'rgba(22,16,10,0.80)',
                    border:       `1px solid ${BORDER}`,
                  }}>
                    <div className="animate-pulse"
                      style={{ aspectRatio: '3/4', background: 'rgba(30,22,12,0.55)' }} />
                    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ height: '10px', width: '60%', borderRadius: '6px', background: 'rgba(30,22,12,0.7)' }} />
                      <div style={{ height: '10px', width: '40%', borderRadius: '6px', background: 'rgba(30,22,12,0.5)' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <p style={{ fontSize: '28px', fontWeight: 300, color: 'rgba(160,140,110,0.18)', marginBottom: '12px' }}>
                  Nothing matches your vibe yet.
                </p>
                <p style={{ fontSize: '13px', color: TEXT_SOFT, marginBottom: '24px' }}>
                  Try clearing filters or exploring another category.
                </p>
                <button
                  onClick={clearFilters}
                  style={{
                    padding: '10px 28px', fontSize: '12px', borderRadius: '999px',
                    background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD}, #9a7530)`,
                    color: '#0a0806', border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', fontWeight: 600,
                  }}
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                  {products.map((p, i) => (
                    <ProductCard key={p._id} product={p} index={i} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '48px' }}>
                    {[...Array(pagination.pages)].map((_, i) => {
                      const page   = i + 1;
                      const active = filters.page === page;
                      return (
                        <button
                          key={page}
                          onClick={() => updateFilter('page', page)}
                          style={{
                            width:        '38px', height: '38px',
                            borderRadius: '50%', fontSize: '12px',
                            background:   active ? `linear-gradient(135deg, ${GOLD}, #9a7530)` : 'transparent',
                            color:        active ? '#0a0806' : TEXT_SOFT,
                            border:       `1px solid ${active ? GOLD : 'rgba(160,130,80,0.22)'}`,
                            cursor:       'pointer', fontFamily: 'inherit',
                            fontWeight:   active ? 700 : 400, transition: 'all 0.15s',
                          }}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ═══ MOBILE FILTER DRAWER ═════════════════════════════════════════════ */}
      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{   opacity: 0 }}
              onClick={() => setFiltersOpen(false)}
              style={{
                position:       'fixed', inset: 0, zIndex: 40,
                background:     'rgba(5,4,3,0.76)',
                backdropFilter: 'blur(4px)',
              }}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{   x: '-100%' }}
              transition={{ type: 'tween', duration: 0.22 }}
              style={{
                position:    'fixed', left: 0, top: 0,
                height:      '100%', width: '300px',
                zIndex:      50, padding: '24px', overflowY: 'auto',
                background:  `linear-gradient(to bottom, #100c08, #0a0806, #050403)`,
                borderRight: `1px solid ${BORDER}`,
                boxShadow:   '12px 0 40px rgba(0,0,0,0.60)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{
                  fontSize: '11px', letterSpacing: '0.16em',
                  textTransform: 'uppercase', color: TEXT_PRIMARY, margin: 0,
                }}>
                  Refine results
                </h2>
                <button
                  onClick={() => setFiltersOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SOFT, padding: '4px' }}
                >
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