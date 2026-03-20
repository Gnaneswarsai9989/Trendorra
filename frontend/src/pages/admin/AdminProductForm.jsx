import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { productAPI, uploadAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FiUpload, FiX, FiPlus, FiArrowLeft, FiChevronDown, FiCheck } from 'react-icons/fi';
import { CATEGORIES, getSubCategoryNames, getGroupedSubCategories } from '../../constants/categories';

const BG     = '#0a0a0a';
const CARD   = '#1a1a1a';
const BORDER = 'rgba(255,255,255,0.08)';
const GOLD   = '#C9A84C';
const SIZES  = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

const inputStyle = {
  backgroundColor: '#0a0a0a',
  border: `1px solid rgba(255,255,255,0.12)`,
  color: '#fff',
  width: '100%',
  padding: '0.75rem 1rem',
  fontSize: '0.875rem',
  outline: 'none',
};
const labelStyle = {
  display: 'block',
  color: 'rgba(255,255,255,0.45)',
  fontSize: '11px',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  marginBottom: '8px',
};
const sectionStyle = {
  backgroundColor: CARD,
  border: `1px solid ${BORDER}`,
  padding: '1.5rem',
  marginBottom: '1.5rem',
};
const sectionTitleStyle = {
  color: 'rgba(255,255,255,0.4)',
  fontSize: '11px',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  marginBottom: '1.5rem',
  paddingBottom: '0.75rem',
  borderBottom: `1px solid ${BORDER}`,
};

/* ── Field — MUST be outside AdminProductForm to prevent focus loss ───────── */
function Field({ label, children, span }) {
  return (
    <div className={span ? `md:col-span-${span}` : ''}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

/* ── SubCategoryDropdown ─────────────────────────────────────────────────── */
function SubCategoryDropdown({ category, value, onChange }) {
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState('');
  const ref       = useRef(null);
  const searchRef = useRef(null);
  const grouped  = getGroupedSubCategories(category);
  const allNames = getSubCategoryNames(category);
  const filtered = search.trim()
    ? allNames.filter(n => n.toLowerCase().includes(search.toLowerCase()))
    : null;
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  useEffect(() => { if (open) setTimeout(() => searchRef.current?.focus(), 60); }, [open]);
  useEffect(() => { onChange(''); setSearch(''); }, [category]);
  const select = name => { onChange(name); setOpen(false); setSearch(''); };
  const noop = allNames.length === 0;
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        disabled={noop}
        onClick={() => setOpen(p => !p)}
        style={{
          ...inputStyle,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: noop ? 'not-allowed' : 'pointer',
          borderColor: open ? GOLD : 'rgba(255,255,255,0.12)',
          transition: 'border-color 0.15s',
        }}
      >
        <span style={{ color: value ? '#fff' : 'rgba(255,255,255,0.30)' }}>
          {value || (noop ? 'No subcategories' : 'Select subcategory')}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {value && (
            <span onClick={e => { e.stopPropagation(); onChange(''); }}
              style={{ color: 'rgba(255,255,255,0.35)', cursor: 'pointer', lineHeight: 1 }}>
              <FiX size={13} />
            </span>
          )}
          <FiChevronDown size={15} style={{
            color: open ? GOLD : 'rgba(255,255,255,0.35)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.18s, color 0.15s',
          }} />
        </div>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          zIndex: 200, background: '#141414',
          border: `1px solid rgba(201,168,76,0.35)`, borderRadius: '8px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.70)', overflow: 'hidden',
        }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search subcategories..."
              style={{
                width: '100%', background: '#0a0a0a',
                border: '1px solid rgba(255,255,255,0.10)', borderRadius: '5px',
                padding: '7px 10px', fontSize: '12px', color: '#fff', outline: 'none', fontFamily: 'inherit',
              }} />
          </div>
          <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
            {filtered && (
              filtered.length === 0
                ? <p style={{ padding: '14px 16px', fontSize: '12px', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>No results</p>
                : filtered.map(name => <DropItem key={name} name={name} active={value === name} onSelect={select} />)
            )}
            {!filtered && Object.entries(grouped).map(([group, names]) => (
              <div key={group}>
                <div style={{
                  padding: '7px 14px 4px', fontSize: '9px', letterSpacing: '0.18em',
                  textTransform: 'uppercase', color: GOLD, fontWeight: 500,
                  background: 'rgba(201,168,76,0.05)', borderTop: '1px solid rgba(255,255,255,0.04)',
                }}>
                  {group}
                </div>
                {names.map(name => <DropItem key={name} name={name} active={value === name} onSelect={select} />)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DropItem({ name, active, onSelect }) {
  return (
    <button type="button" onClick={() => onSelect(name)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', padding: '9px 16px', fontSize: '13px',
        color: active ? GOLD : 'rgba(255,255,255,0.75)',
        background: active ? 'rgba(201,168,76,0.08)' : 'transparent',
        border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
        transition: 'background 0.12s, color 0.12s',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#fff'; }}}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}}
    >
      <span>{name}</span>
      {active && <FiCheck size={13} style={{ color: GOLD, flexShrink: 0 }} />}
    </button>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function AdminProductForm() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const isEdit   = !!id;

  const [loading,   setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', price: '', discountPrice: '',
    category: 'Men', subCategory: '',
    brand: 'Trendorra', stock: '',
    sizes: [], material: '', careInstructions: '',
    isFeatured: false, isNewArrival: false, isBestSeller: false,
    images: [], colors: [],
  });
  const [newColor, setNewColor] = useState({ name: '', hex: '#C9A84C' });

  useEffect(() => {
    if (isEdit) {
      productAPI.getById(id).then(res => {
        const p = res.product;
        setForm({
          name: p.name || '', description: p.description || '',
          price: p.price || '', discountPrice: p.discountPrice || '',
          category: p.category || 'Men', subCategory: p.subCategory || '',
          brand: p.brand || 'Trendorra',
          stock: p.stock || '', sizes: p.sizes || [],
          material: p.material || '', careInstructions: p.careInstructions || '',
          isFeatured: p.isFeatured || false, isNewArrival: p.isNewArrival || false,
          isBestSeller: p.isBestSeller || false,
          images: p.images || [], colors: p.colors || [],
        });
      });
    }
  }, [id, isEdit]);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('images', f));
      const res = await uploadAPI.uploadImages(formData);
      setForm(prev => ({ ...prev, images: [...prev.images, ...res.images] }));
      toast.success('Images uploaded!');
    } catch { toast.error('Failed to upload images'); }
    finally  { setUploading(false); }
  };

  const removeImage = i   => setForm(prev => ({ ...prev, images: prev.images.filter((_, j) => j !== i) }));
  const toggleSize  = sz  => setForm(prev => ({ ...prev, sizes: prev.sizes.includes(sz) ? prev.sizes.filter(s => s !== sz) : [...prev.sizes, sz] }));
  const addColor    = ()  => {
    if (!newColor.name) return;
    setForm(prev => ({ ...prev, colors: [...prev.colors, { ...newColor }] }));
    setNewColor({ name: '', hex: '#C9A84C' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...form,
        price:         Number(form.price),
        discountPrice: Number(form.discountPrice) || 0,
        stock:         Number(form.stock),
      };
      if (isEdit) { await productAPI.update(id, data); toast.success('Product updated!'); }
      else        { await productAPI.create(data);     toast.success('Product created!'); }
      navigate('/admin/products');
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally       { setLoading(false); }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>
      {/* ── Header ── */}
      <div className="px-6 py-5 flex items-center justify-between"
        style={{ backgroundColor: '#050505', borderBottom: `1px solid ${BORDER}` }}>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Admin Panel
          </p>
          <h1 style={{ color: GOLD, fontFamily: 'Cinzel, serif', fontSize: '18px', letterSpacing: '0.2em' }}>
            {isEdit ? 'Edit Product' : 'Add Product'}
          </h1>
        </div>
        <Link to="/admin/products"
          className="flex items-center gap-1 font-body text-xs tracking-wider hover:text-gold transition-colors"
          style={{ color: 'rgba(255,255,255,0.4)' }}>
          <FiArrowLeft size={13} /> Products
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit}>

          {/* ── BASIC INFORMATION ── */}
          <div style={sectionStyle}>
            <p style={sectionTitleStyle}>Basic Information</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <Field label="Product Name *">
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    style={inputStyle} required placeholder="e.g. Classic Oversized Tee" />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Description">
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    style={{ ...inputStyle, resize: 'none', minHeight: '100px' }}
                    rows={4} placeholder="Describe your product..." />
                </Field>
              </div>
              <div>
                <label style={labelStyle}>Category *</label>
                <select value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value, subCategory: '' }))}
                  style={inputStyle}>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c} style={{ backgroundColor: '#0a0a0a' }}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Sub Category</label>
                <SubCategoryDropdown
                  category={form.category}
                  value={form.subCategory}
                  onChange={val => setForm(p => ({ ...p, subCategory: val }))}
                />
              </div>
              <Field label="Brand">
                <input value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))}
                  style={inputStyle} />
              </Field>
              <Field label="Material">
                <input value={form.material} onChange={e => setForm(p => ({ ...p, material: e.target.value }))}
                  style={inputStyle} placeholder="e.g. 100% Cotton" />
              </Field>
              <Field label="Price (₹) *">
                <input type="number" value={form.price}
                  onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                  style={inputStyle} required min={0} />
              </Field>
              <Field label="Discount Price (₹)">
                <input type="number" value={form.discountPrice}
                  onChange={e => setForm(p => ({ ...p, discountPrice: e.target.value }))}
                  style={inputStyle} min={0} />
              </Field>
              <Field label="Stock Quantity *">
                <input type="number" value={form.stock}
                  onChange={e => setForm(p => ({ ...p, stock: e.target.value }))}
                  style={inputStyle} required min={0} />
              </Field>
              <Field label="Care Instructions">
                <input value={form.careInstructions}
                  onChange={e => setForm(p => ({ ...p, careInstructions: e.target.value }))}
                  style={inputStyle} placeholder="e.g. Machine wash cold" />
              </Field>
            </div>
          </div>

          {/* ── PRODUCT IMAGES ── */}
          <div style={sectionStyle}>
            <p style={sectionTitleStyle}>Product Images</p>
            <div className="flex flex-wrap gap-4 mb-4">
              {form.images.map((img, i) => (
                <div key={i} className="relative group w-24 h-28">
                  <img src={img.url} alt="" className="w-full h-full object-cover"
                    style={{ border: `1px solid ${BORDER}` }} />
                  <button type="button" onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: '#ef4444' }}>
                    <FiX size={12} />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-0 left-0 right-0 text-[9px] text-center py-0.5 text-white"
                      style={{ backgroundColor: GOLD }}>Main</span>
                  )}
                </div>
              ))}
              <label
                className="w-24 h-28 flex flex-col items-center justify-center cursor-pointer transition-colors"
                style={{ border: `2px dashed ${BORDER}`, opacity: uploading ? 0.5 : 1 }}
                onMouseOver={e => e.currentTarget.style.borderColor = GOLD}
                onMouseOut={e  => e.currentTarget.style.borderColor = BORDER}>
                <input type="file" multiple accept="image/*" onChange={handleImageUpload}
                  className="hidden" disabled={uploading} />
                <FiUpload size={20} style={{ color: 'rgba(255,255,255,0.3)', marginBottom: '4px' }} />
                <span className="text-[10px] font-body" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {uploading ? 'Uploading...' : 'Upload'}
                </span>
              </label>
            </div>
            <p className="text-xs font-body" style={{ color: 'rgba(255,255,255,0.25)' }}>
              First image is the main product photo. Max 5MB per image.
            </p>
          </div>

          {/* ── SIZES & COLORS ── */}
          <div style={sectionStyle}>
            <p style={sectionTitleStyle}>Sizes & Colors</p>
            <div className="mb-6">
              <label style={labelStyle}>Available Sizes</label>
              <div className="flex flex-wrap gap-2">
                {SIZES.map(size => (
                  <button key={size} type="button" onClick={() => toggleSize(size)}
                    className="px-3 py-2 text-xs font-body border transition-all"
                    style={{
                      backgroundColor: form.sizes.includes(size) ? GOLD : 'transparent',
                      borderColor:     form.sizes.includes(size) ? GOLD : 'rgba(255,255,255,0.15)',
                      color:           form.sizes.includes(size) ? '#fff' : 'rgba(255,255,255,0.5)',
                    }}>
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Colors</label>
              <div className="flex flex-wrap gap-3 mb-4">
                {form.colors.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}` }}>
                    <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: c.hex }} />
                    <span className="font-body text-sm text-white">{c.name}</span>
                    <button type="button"
                      onClick={() => setForm(p => ({ ...p, colors: p.colors.filter((_, j) => j !== i) }))}
                      className="text-red-400 ml-1"><FiX size={12} /></button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <input value={newColor.name} onChange={e => setNewColor(p => ({ ...p, name: e.target.value }))}
                  placeholder="Color name" className="px-3 py-2 text-sm font-body focus:outline-none w-36"
                  style={{ backgroundColor: '#0a0a0a', border: `1px solid rgba(255,255,255,0.12)`, color: '#fff' }} />
                <input type="color" value={newColor.hex} onChange={e => setNewColor(p => ({ ...p, hex: e.target.value }))}
                  className="w-10 h-10 cursor-pointer"
                  style={{ border: `1px solid ${BORDER}`, backgroundColor: 'transparent' }} />
                <button type="button" onClick={addColor}
                  className="flex items-center gap-1 text-sm font-body hover:underline" style={{ color: GOLD }}>
                  <FiPlus size={14} /> Add Color
                </button>
              </div>
            </div>
          </div>

          {/* ── PRODUCT LABELS ── */}
          <div style={sectionStyle}>
            <p style={sectionTitleStyle}>Product Labels</p>
            <div className="flex flex-wrap gap-6">
              {[
                { key: 'isFeatured',   label: 'Featured Product' },
                { key: 'isNewArrival', label: 'New Arrival'      },
                { key: 'isBestSeller', label: 'Best Seller'      },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <div className="relative w-10 h-6 cursor-pointer"
                    onClick={() => setForm(p => ({ ...p, [key]: !p[key] }))}>
                    <div className="w-10 h-6 rounded-full transition-colors"
                      style={{ backgroundColor: form[key] ? GOLD : 'rgba(255,255,255,0.1)' }} />
                    <div className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all"
                      style={{ left: form[key] ? '1.25rem' : '0.25rem' }} />
                  </div>
                  <span className="font-body text-sm"
                    style={{ color: form[key] ? '#fff' : 'rgba(255,255,255,0.5)' }}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ── ACTIONS ── */}
          <div className="flex gap-4">
            <button type="submit" disabled={loading}
              className="px-12 py-4 font-body text-sm tracking-[0.15em] uppercase text-white transition-colors"
              style={{ backgroundColor: loading ? 'rgba(201,168,76,0.5)' : GOLD }}>
              {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
            </button>
            <Link to="/admin/products"
              className="px-12 py-4 font-body text-sm tracking-[0.15em] uppercase text-center transition-colors"
              style={{ border: `1px solid rgba(255,255,255,0.2)`, color: 'rgba(255,255,255,0.6)' }}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}