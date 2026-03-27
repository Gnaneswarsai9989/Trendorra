import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiArrowRight, FiX } from 'react-icons/fi';
import { productAPI } from '../../services/api';

const GOLD = '#C9A84C';

export default function LiveSearch({ isDark, placeholder = "Search for products, brands & more…", isDesktop = false }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e?.preventDefault();
    if (query.trim()) {
      navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
      setShowDropdown(false);
      setQuery('');
      inputRef.current?.blur();
    }
  };

  const doSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await productAPI.getAll({ search: q.trim(), limit: 5 });
      setResults(res.products || []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 250);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const BG     = isDark ? '#111111' : '#ffffff';
  const BORDER = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)';
  const HOVER  = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
  const DIM    = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
  const TEXT   = isDark ? '#f0e8d8' : '#111';

  const highlight = (text, q) => {
    if (!q || q.length < 2) return text;
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part)
        ? <mark key={i} style={{ backgroundColor: 'rgba(201,168,76,0.2)', color: GOLD, borderRadius: '2px', padding: '0 2px' }}>{part}</mark>
        : part
    );
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', flex: 1, width: '100%', maxWidth: isDesktop ? '560px' : 'none' }}>
      <form onSubmit={handleSearch}
        style={{
          display: 'flex', alignItems: 'center',
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
          borderRadius: '100px',
          overflow: 'hidden', transition: 'all 0.2s',
          padding: isDesktop ? '6px 6px 6px 20px' : '4px 4px 4px 14px',
        }}
        onFocusCapture={e => {
            e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)';
            e.currentTarget.style.borderColor = `${GOLD}60`;
        }}
        onBlurCapture={e => {
            if (!query) {
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
                e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
            }
        }}>
        <FiSearch size={isDesktop ? 18 : 16} style={{ color: DIM, flexShrink: 0 }} />
        <input 
          ref={inputRef}
          type="text" 
          value={query} 
          onChange={e => { setQuery(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          style={{ 
            flex: 1, padding: isDesktop ? '10px 16px' : '8px 12px', 
            backgroundColor: 'transparent', border: 'none', outline: 'none', 
            color: TEXT, fontSize: isDesktop ? '14px' : '13px', fontFamily: 'inherit' 
          }} 
        />
        {query && (
          <button type="button" onClick={() => { setQuery(''); inputRef.current?.focus(); }} style={{ background: 'none', border: 'none', padding: '0 12px', color: DIM, cursor: 'pointer' }}>
            <FiX size={16} />
          </button>
        )}
        <button type="submit"
          style={{ 
            width: isDesktop ? '40px' : '36px',
            height: isDesktop ? '40px' : '36px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${GOLD}, #a38230)`, border: 'none', cursor: 'pointer', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            flexShrink: 0, transition: 'transform 0.15s, box-shadow 0.15s',
            boxShadow: `0 4px 14px ${GOLD}35`
          }}
          onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = `0 6px 16px ${GOLD}45`; }}
          onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = `0 4px 14px ${GOLD}35`; }}
        >
          <FiArrowRight size={isDesktop ? 18 : 16} style={{ color: '#000' }} />
        </button>
      </form>

      <AnimatePresence>
        {showDropdown && query.trim().length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
              backgroundColor: BG, border: `1px solid ${BORDER}`,
              borderRadius: '12px', boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.8)' : '0 10px 30px rgba(0,0,0,0.15)',
              zIndex: 9999, overflow: 'hidden', padding: '8px 0'
            }}>
            {loading && results.length === 0 ? (
               <div style={{ padding: '24px 16px', color: DIM, fontSize: '13px', textAlign: 'center' }}>Searching perfectly matching styles...</div>
            ) : results.length > 0 ? (
              <>
                <p style={{ margin: '0 0 4px', padding: '4px 16px', fontSize: '10px', color: DIM, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600' }}>
                  {results.length} result{results.length !== 1 ? 's' : ''}
                </p>
                {results.map((p, i) => (
                  <button key={p._id}
                    onClick={() => { navigate(`/product/${p._id}`); setShowDropdown(false); setQuery(''); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '12px 16px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
                      borderBottom: i < results.length - 1 ? `1px solid ${BORDER}` : 'none',
                      textAlign: 'left', transition: 'background-color 0.15s'
                    }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = HOVER}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ width: '40px', height: '48px', backgroundColor: isDark ? '#222' : '#eee', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                      <img src={p.images?.[0]?.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '14px', color: TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '500' }}>
                        {highlight(p.name, query)}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: DIM }}>{p.category} · {p.brand}</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ margin: 0, fontSize: '13px', color: GOLD, fontWeight: '700' }}>₹{(p.discountPrice || p.price)?.toLocaleString()}</p>
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => handleSearch()}
                  style={{
                    width: 'calc(100% - 32px)', margin: '8px 16px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '12px', backgroundColor: `${GOLD}15`, border: `1px solid ${GOLD}40`, color: GOLD,
                    borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.15s'
                  }}
                  onMouseOver={e => { e.currentTarget.style.backgroundColor = `${GOLD}25`; }}
                  onMouseOut={e => { e.currentTarget.style.backgroundColor = `${GOLD}15`; }}
                >
                  See all results for {query} <FiArrowRight size={15} />
                </button>
              </>
            ) : (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: TEXT, margin: '0 0 6px', fontWeight: '500' }}>No styles found</p>
                <p style={{ fontSize: '12px', color: DIM, margin: 0 }}>Try different keywords for {query}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
