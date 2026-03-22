import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { productAPI, uploadAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiUpload, FiX, FiSave } from 'react-icons/fi';

const BG = '#0a0a0a'; const CARD = '#1a1a1a';
const BORDER = 'rgba(255,255,255,0.08)'; const GOLD = '#C9A84C';

const inputStyle = {
  backgroundColor: '#050505', border: `1px solid rgba(255,255,255,0.1)`,
  color: '#fff', width: '100%', padding: '0.65rem 0.875rem',
  fontSize: '13px', borderRadius: '6px', outline: 'none',
};
const labelStyle = {
  display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '10px',
  letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px',
};
const focusGold = (e) => e.target.style.borderColor = GOLD;
const blurGray  = (e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)';

const CATEGORIES   = ['Men', 'Women', 'Streetwear', 'Accessories', 'Kids'];
const SIZES        = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
const SUB_CATS     = {
  Men:         ['T-Shirts', 'Shirts', 'Jeans', 'Trousers', 'Jackets', 'Ethnic Wear', 'Sportswear'],
  Women:       ['Tops', 'Dresses', 'Jeans', 'Sarees', 'Kurtis', 'Skirts', 'Jackets'],
  Streetwear:  ['Hoodies', 'Oversized Tees', 'Joggers', 'Caps', 'Sneakers'],
  Accessories: ['Bags', 'Belts', 'Watches', 'Sunglasses', 'Jewelry', 'Scarves'],
  Kids:        ['Boys', 'Girls', 'Infants', 'School Wear', 'Party Wear'],
};

export default function AdminProductForm() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const isEdit     = Boolean(id);

  const [loading,   setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetching,  setFetching]  = useState(isEdit);

  const [form, setForm] = useState({
    name: '', description: '', price: '', discountPrice: '',
    category: 'Men', subCategory: '', brand: 'Trendorra',
    stock: '', material: '', careInstructions: '',
    sizes: [], colors: [],
    isFeatured: false, isNewArrival: false, isBestSeller: false,
    tags: '',
  });
  const [images, setImages] = useState([]);   // [{ url, public_id }]
  const [colorInput, setColorInput] = useState({ name: '', hex: '#000000' });

  // Load existing product if editing
  useEffect(() => {
    if (!isEdit) return;
    setFetching(true);
    productAPI.getById(id)
      .then(res => {
        const p = res.product;
        setForm({
          name:              p.name || '',
          description:       p.description || '',
          price:             p.price || '',
          discountPrice:     p.discountPrice || '',
          category:          p.category || 'Men',
          subCategory:       p.subCategory || '',
          brand:             p.brand || 'Trendorra',
          stock:             p.stock || '',
          material:          p.material || '',
          careInstructions:  p.careInstructions || '',
          sizes:             p.sizes || [],
          colors:            p.colors || [],
          isFeatured:        p.isFeatured || false,
          isNewArrival:      p.isNewArrival || false,
          isBestSeller:      p.isBestSeller || false,
          tags:              (p.tags || []).join(', '),
        });
        setImages(p.images || []);
      })
      .catch(() => toast.error('Product not found'))
      .finally(() => setFetching(false));
  }, [id, isEdit]);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const toggle = k => () => setForm(p => ({ ...p, [k]: !p[k] }));

  const toggleSize = (size) => setForm(p => ({
    ...p,
    sizes: p.sizes.includes(size) ? p.sizes.filter(s => s !== size) : [...p.sizes, size],
  }));

  const addColor = () => {
    if (!colorInput.name.trim()) return;
    setForm(p => ({ ...p, colors: [...p.colors, { ...colorInput }] }));
    setColorInput({ name: '', hex: '#000000' });
  };
  const removeColor = (i) => setForm(p => ({ ...p, colors: p.colors.filter((_, idx) => idx !== i) }));

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (images.length + files.length > 5) { toast.error('Max 5 images'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('images', f));
      const res = await uploadAPI.uploadImages(formData);
      setImages(p => [...p, ...(res.images || [])]);
      toast.success(`${files.length} image(s) uploaded`);
    } catch { toast.error('Image upload failed'); }
    finally { setUploading(false); }
  };

  const removeImage = (i) => setImages(p => p.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.stock || !form.description) {
      toast.error('Fill all required fields'); return;
    }
    if (images.length === 0) { toast.error('Add at least 1 image'); return; }

    setLoading(true);
    try {
      const payload = {
        ...form,
        price:         Number(form.price),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : 0,
        stock:         Number(form.stock),
        tags:          form.tags.split(',').map(t => t.trim()).filter(Boolean),
        images,
      };

      if (isEdit) {
        await productAPI.update(id, payload);
        toast.success('Product updated!');
      } else {
        await productAPI.create(payload);
        toast.success('Product created!');
      }
      navigate('/admin/products');
    } catch (err) {
      toast.error(err.message || 'Failed to save product');
    } finally { setLoading(false); }
  };

  if (fetching) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BG }}>
      <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Loading product…</p>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between"
        style={{ backgroundColor: '#050505', borderBottom: `1px solid ${BORDER}` }}>
        <div>
          <p className="font-body text-xs tracking-[0.2em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Admin Panel</p>
          <h1 className="font-accent text-xl tracking-[0.2em]" style={{ color: GOLD }}>
            {isEdit ? 'Edit Product' : 'Add Product'}
          </h1>
        </div>
        <Link to="/admin/products" className="flex items-center gap-1 font-body text-xs hover:text-gold transition-colors"
          style={{ color: 'rgba(255,255,255,0.4)' }}>
          <FiArrowLeft size={13} /> Products
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left column (2/3) ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Basic Info */}
            <div className="p-6" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px' }}>
              <h3 className="font-body text-xs tracking-[0.15em] uppercase mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>Basic Info</h3>
              <div className="space-y-4">
                <div>
                  <label style={labelStyle}>Product Name *</label>
                  <input value={form.name} onChange={set('name')} style={inputStyle} placeholder="e.g. Premium Cotton Shirt" required onFocus={focusGold} onBlur={blurGray} />
                </div>
                <div>
                  <label style={labelStyle}>Description *</label>
                  <textarea value={form.description} onChange={set('description')} rows={4}
                    style={{ ...inputStyle, resize: 'vertical' }} placeholder="Describe the product…" required onFocus={focusGold} onBlur={blurGray} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Brand</label>
                    <input value={form.brand} onChange={set('brand')} style={inputStyle} onFocus={focusGold} onBlur={blurGray} />
                  </div>
                  <div>
                    <label style={labelStyle}>Tags (comma separated)</label>
                    <input value={form.tags} onChange={set('tags')} style={inputStyle} placeholder="cotton, casual, summer" onFocus={focusGold} onBlur={blurGray} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Material</label>
                    <input value={form.material} onChange={set('material')} style={inputStyle} placeholder="100% Cotton" onFocus={focusGold} onBlur={blurGray} />
                  </div>
                  <div>
                    <label style={labelStyle}>Care Instructions</label>
                    <input value={form.careInstructions} onChange={set('careInstructions')} style={inputStyle} placeholder="Machine wash cold" onFocus={focusGold} onBlur={blurGray} />
                  </div>
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="p-6" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px' }}>
              <h3 className="font-body text-xs tracking-[0.15em] uppercase mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>Images (max 5)</h3>
              <div className="flex flex-wrap gap-3 mb-4">
                {images.map((img, i) => (
                  <div key={i} className="relative w-20 h-24 flex-shrink-0">
                    <img src={img.url} alt="" className="w-full h-full object-cover rounded" style={{ backgroundColor: '#0a0a0a' }} />
                    <button type="button" onClick={() => removeImage(i)}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: '#f87171' }}>
                      <FiX size={10} color="#fff" />
                    </button>
                    {i === 0 && <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] py-0.5" style={{ backgroundColor: GOLD, color: '#fff' }}>Main</span>}
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="w-20 h-24 flex flex-col items-center justify-center cursor-pointer rounded"
                    style={{ border: `2px dashed rgba(255,255,255,0.15)`, backgroundColor: '#050505' }}>
                    <FiUpload size={16} style={{ color: 'rgba(255,255,255,0.3)' }} />
                    <span className="font-body text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{uploading ? 'Uploading…' : 'Add Image'}</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                )}
              </div>
            </div>

            {/* Sizes & Colors */}
            <div className="p-6" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px' }}>
              <h3 className="font-body text-xs tracking-[0.15em] uppercase mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>Sizes & Colors</h3>
              <div className="mb-4">
                <label style={labelStyle}>Sizes</label>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map(s => (
                    <button key={s} type="button" onClick={() => toggleSize(s)}
                      className="px-3 py-1.5 font-body text-xs transition-all"
                      style={{
                        backgroundColor: form.sizes.includes(s) ? GOLD : 'transparent',
                        color:           form.sizes.includes(s) ? '#fff' : 'rgba(255,255,255,0.4)',
                        border:          `1px solid ${form.sizes.includes(s) ? GOLD : BORDER}`,
                        borderRadius:    '4px',
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Colors</label>
                <div className="flex gap-2 mb-3 flex-wrap">
                  {form.colors.map((c, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded"
                      style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}` }}>
                      <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: c.hex }} />
                      <span className="font-body text-xs text-white">{c.name}</span>
                      <button type="button" onClick={() => removeColor(i)} style={{ color: '#f87171' }}><FiX size={10} /></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={colorInput.name} onChange={e => setColorInput(p => ({ ...p, name: e.target.value }))}
                    style={{ ...inputStyle, width: '140px' }} placeholder="Color name" onFocus={focusGold} onBlur={blurGray} />
                  <input type="color" value={colorInput.hex} onChange={e => setColorInput(p => ({ ...p, hex: e.target.value }))}
                    style={{ width: '44px', height: '38px', borderRadius: '6px', border: `1px solid ${BORDER}`, backgroundColor: '#050505', cursor: 'pointer', padding: '2px' }} />
                  <button type="button" onClick={addColor}
                    className="px-4 font-body text-xs"
                    style={{ backgroundColor: 'rgba(201,168,76,0.15)', color: GOLD, border: `1px solid rgba(201,168,76,0.3)`, borderRadius: '6px' }}>
                    Add
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* ── Right column (1/3) ── */}
          <div className="space-y-6">

            {/* Pricing */}
            <div className="p-6" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px' }}>
              <h3 className="font-body text-xs tracking-[0.15em] uppercase mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>Pricing & Stock</h3>
              <div className="space-y-4">
                <div>
                  <label style={labelStyle}>Price (₹) *</label>
                  <input type="number" value={form.price} onChange={set('price')} style={inputStyle} placeholder="999" required min="0" onFocus={focusGold} onBlur={blurGray} />
                </div>
                <div>
                  <label style={labelStyle}>Discount Price (₹)</label>
                  <input type="number" value={form.discountPrice} onChange={set('discountPrice')} style={inputStyle} placeholder="799" min="0" onFocus={focusGold} onBlur={blurGray} />
                </div>
                <div>
                  <label style={labelStyle}>Stock *</label>
                  <input type="number" value={form.stock} onChange={set('stock')} style={inputStyle} placeholder="50" required min="0" onFocus={focusGold} onBlur={blurGray} />
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="p-6" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px' }}>
              <h3 className="font-body text-xs tracking-[0.15em] uppercase mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>Category</h3>
              <div className="space-y-4">
                <div>
                  <label style={labelStyle}>Category *</label>
                  <select value={form.category} onChange={set('category')} style={inputStyle} onFocus={focusGold} onBlur={blurGray}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Sub Category</label>
                  <select value={form.subCategory} onChange={set('subCategory')} style={inputStyle} onFocus={focusGold} onBlur={blurGray}>
                    <option value="">— Select —</option>
                    {(SUB_CATS[form.category] || []).map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Flags */}
            <div className="p-6" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px' }}>
              <h3 className="font-body text-xs tracking-[0.15em] uppercase mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>Labels</h3>
              <div className="space-y-3">
                {[
                  { key: 'isFeatured',   label: 'Featured Product' },
                  { key: 'isNewArrival', label: 'New Arrival' },
                  { key: 'isBestSeller', label: 'Best Seller' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <div onClick={toggle(key)}
                      className="w-10 h-5 rounded-full relative transition-all flex-shrink-0"
                      style={{ backgroundColor: form[key] ? GOLD : 'rgba(255,255,255,0.1)' }}>
                      <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                        style={{ left: form[key] ? '22px' : '2px' }} />
                    </div>
                    <span className="font-body text-sm text-white">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading || uploading}
              className="w-full py-3.5 font-body text-sm tracking-[0.15em] uppercase text-white flex items-center justify-center gap-2"
              style={{ backgroundColor: loading ? 'rgba(201,168,76,0.5)' : GOLD, borderRadius: '8px' }}>
              <FiSave size={15} />
              {loading ? 'Saving…' : isEdit ? 'Update Product' : 'Create Product'}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}