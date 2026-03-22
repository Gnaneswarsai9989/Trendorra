import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiStar, FiArrowLeft, FiUser, FiShield } from 'react-icons/fi';

const BG = '#0a0a0a'; const CARD = '#1a1a1a';
const BORDER = 'rgba(255,255,255,0.08)'; const GOLD = '#C9A84C';

const thStyle = {
  color: 'rgba(255,255,255,0.35)', fontSize: '11px', letterSpacing: '0.15em',
  textTransform: 'uppercase', padding: '1rem 1.5rem', textAlign: 'left',
  borderBottom: `1px solid ${BORDER}`, backgroundColor: '#050505',
};
const tdStyle = { padding: '1rem 1.5rem', borderBottom: `1px solid ${BORDER}` };

export default function AdminProducts() {
  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [deleting,   setDeleting]   = useState(null);
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(1);
  const [pagination, setPagination] = useState({});
  const [filter,     setFilter]     = useState('all'); // 'all' | 'admin' | seller email

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productAPI.getAll({ search, page, limit: 50 });
      setProducts(res.products || []);
      setPagination(res.pagination || {});
    } finally { setLoading(false); }
  };
  useEffect(() => { fetchProducts(); }, [search, page]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    setDeleting(id);
    try { await productAPI.delete(id); toast.success('Product deleted'); fetchProducts(); }
    catch { toast.error('Failed to delete'); } finally { setDeleting(null); }
  };

  // ── Separate admin vs seller products ────────────────────────────
  const adminProducts  = products.filter(p => !p.createdBy || p.createdBy?.role !== 'seller');
  const sellerProducts = products.filter(p => p.createdBy?.role === 'seller');

  // ── Group seller products by seller email ─────────────────────────
  const sellerGroups = sellerProducts.reduce((acc, product) => {
    const email = product.createdBy?.email || 'unknown';
    const name  = product.createdBy?.name  || 'Unknown Seller';
    if (!acc[email]) acc[email] = { name, email, products: [] };
    acc[email].products.push(product);
    return acc;
  }, {});
  const sellerEmails = Object.keys(sellerGroups);

  // ── Filter tabs ───────────────────────────────────────────────────
  const tabs = [
    { key: 'all',   label: `All (${products.length})` },
    { key: 'admin', label: `👑 Admin (${adminProducts.length})` },
    ...sellerEmails.map(email => ({
      key:   email,
      label: `🏪 ${sellerGroups[email].name} (${sellerGroups[email].products.length})`,
    })),
  ];

  // ── Products to show based on active filter ───────────────────────
  const visibleProducts = filter === 'all'
    ? products
    : filter === 'admin'
    ? adminProducts
    : sellerGroups[filter]?.products || [];

  const ProductRow = ({ product }) => {
    const isByAdmin  = !product.createdBy || product.createdBy?.role !== 'seller';
    const sellerName  = product.createdBy?.name  || null;
    const sellerEmail = product.createdBy?.email || null;

    return (
      <tr
        onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
        onMouseOut={e  => e.currentTarget.style.backgroundColor = 'transparent'}>

        {/* Product */}
        <td style={tdStyle}>
          <div className="flex items-center gap-3">
            <img src={product.images?.[0]?.url} alt=""
              className="w-12 h-14 object-cover flex-shrink-0"
              style={{ backgroundColor: '#0a0a0a', borderRadius: '4px' }} />
            <div>
              <p className="font-body font-medium text-sm text-white line-clamp-1">{product.name}</p>
              <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{product.brand}</p>
              <div className="flex gap-1 mt-1">
                {product.isFeatured   && <span className="badge-gold text-[9px]">Featured</span>}
                {product.isNewArrival && <span className="badge-black text-[9px]">New</span>}
                {product.isBestSeller && <span className="badge-black text-[9px]">Best</span>}
              </div>
            </div>
          </div>
        </td>

        {/* Source — who created it */}
        <td style={tdStyle}>
          {isByAdmin ? (
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'rgba(201,168,76,0.15)' }}>
                <FiShield size={10} style={{ color: GOLD }} />
              </div>
              <div>
                <p className="font-body text-xs font-semibold" style={{ color: GOLD }}>Admin</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'rgba(96,165,250,0.15)' }}>
                <FiUser size={10} style={{ color: '#60a5fa' }} />
              </div>
              <div>
                <p className="font-body text-xs font-semibold" style={{ color: '#60a5fa' }}>{sellerName}</p>
                <p className="font-body text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{sellerEmail}</p>
              </div>
            </div>
          )}
        </td>

        {/* Category */}
        <td style={tdStyle}>
          <div>
            <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{product.category}</p>
            {product.subCategory && (
              <p className="font-body text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{product.subCategory}</p>
            )}
          </div>
        </td>

        {/* Price */}
        <td style={tdStyle}>
          <p className="font-body text-sm font-medium text-white">
            ₹{(product.discountPrice || product.price)?.toLocaleString()}
          </p>
          {product.discountPrice > 0 && (
            <p className="font-body text-xs line-through" style={{ color: 'rgba(255,255,255,0.3)' }}>
              ₹{product.price?.toLocaleString()}
            </p>
          )}
        </td>

        {/* Stock */}
        <td style={tdStyle}>
          <span className="font-body text-sm font-semibold"
            style={{ color: product.stock === 0 ? '#f87171' : product.stock < 10 ? '#fbbf24' : '#4ade80' }}>
            {product.stock}
          </span>
        </td>

        {/* Rating */}
        <td style={tdStyle}>
          <div className="flex items-center gap-1">
            <FiStar size={11} style={{ color: GOLD }} />
            <span className="font-body text-sm text-white">{product.ratings || 0}</span>
            <span className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>({product.numReviews || 0})</span>
          </div>
        </td>

        {/* Actions */}
        <td style={tdStyle}>
          <div className="flex items-center gap-2">
            <Link to={`/admin/products/${product._id}/edit`}
              className="w-8 h-8 flex items-center justify-center transition-all"
              style={{ border: `1px solid ${BORDER}`, color: 'rgba(255,255,255,0.4)', borderRadius: '4px' }}
              onMouseOver={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
              onMouseOut={e  => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}>
              <FiEdit2 size={13} />
            </Link>
            <button onClick={() => handleDelete(product._id)} disabled={deleting === product._id}
              className="w-8 h-8 flex items-center justify-center transition-all"
              style={{ border: `1px solid ${BORDER}`, color: 'rgba(255,255,255,0.4)', borderRadius: '4px' }}
              onMouseOver={e => { e.currentTarget.style.borderColor = '#f87171'; e.currentTarget.style.color = '#f87171'; }}
              onMouseOut={e  => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}>
              <FiTrash2 size={13} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>

      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between"
        style={{ backgroundColor: '#050505', borderBottom: `1px solid ${BORDER}` }}>
        <div>
          <p className="font-body text-xs tracking-[0.2em] uppercase mb-1"
            style={{ color: 'rgba(255,255,255,0.3)' }}>Admin Panel</p>
          <h1 className="font-accent text-xl tracking-[0.2em]" style={{ color: GOLD }}>Products</h1>
        </div>
        <div className="flex gap-4 items-center">
          <Link to="/admin"
            className="font-body text-xs tracking-wider hover:text-gold transition-colors flex items-center gap-1"
            style={{ color: 'rgba(255,255,255,0.4)' }}>
            <FiArrowLeft size={13} /> Dashboard
          </Link>
          <Link to="/admin/products/new"
            className="flex items-center gap-2 px-4 py-2 text-xs font-body tracking-wider text-white"
            style={{ backgroundColor: GOLD, borderRadius: '4px' }}>
            <FiPlus size={14} /> Add Product
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Search */}
        <div className="flex justify-between items-center mb-5">
          <input type="text" placeholder="Search products..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="px-4 py-2.5 text-sm font-body w-64 focus:outline-none"
            style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: '#fff', borderRadius: '6px' }} />
          <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {pagination.total || products.length} products total
          </p>
        </div>

        {/* ── Filter Tabs ──────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className="px-4 py-2 font-body text-xs transition-all"
              style={{
                backgroundColor: filter === tab.key ? GOLD : 'transparent',
                color:           filter === tab.key ? '#fff' : 'rgba(255,255,255,0.45)',
                border:          `1px solid ${filter === tab.key ? GOLD : BORDER}`,
                borderRadius:    '6px',
                fontWeight:      filter === tab.key ? '700' : '400',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Table ────────────────────────────────────────────────── */}
        {filter === 'all' ? (
          // ALL view: show Admin section first, then each seller section
          <>
            {/* Admin Products Section */}
            {adminProducts.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-1 h-5 rounded" style={{ backgroundColor: GOLD }} />
                  <h2 className="font-body text-sm font-semibold" style={{ color: GOLD }}>
                    👑 Admin Products
                  </h2>
                  <span className="font-body text-xs px-2 py-0.5 rounded"
                    style={{ backgroundColor: 'rgba(201,168,76,0.1)', color: GOLD }}>
                    {adminProducts.length} products
                  </span>
                </div>
                <div className="overflow-x-auto" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '8px' }}>
                  <table className="w-full">
                    <thead><tr>{['Product','Source','Category','Price','Stock','Rating','Actions'].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                    <tbody>{adminProducts.map(p => <ProductRow key={p._id} product={p} />)}</tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Seller Products — grouped by seller */}
            {sellerEmails.map(email => (
              <div key={email} className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-1 h-5 rounded" style={{ backgroundColor: '#60a5fa' }} />
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'rgba(96,165,250,0.15)' }}>
                    <FiUser size={13} style={{ color: '#60a5fa' }} />
                  </div>
                  <div>
                    <p className="font-body text-sm font-semibold" style={{ color: '#60a5fa' }}>
                      🏪 {sellerGroups[email].name}
                    </p>
                    <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{email}</p>
                  </div>
                  <span className="font-body text-xs px-2 py-0.5 rounded ml-1"
                    style={{ backgroundColor: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}>
                    {sellerGroups[email].products.length} products
                  </span>
                </div>
                <div className="overflow-x-auto" style={{ backgroundColor: CARD, border: `1px solid rgba(96,165,250,0.15)`, borderRadius: '8px' }}>
                  <table className="w-full">
                    <thead><tr>{['Product','Source','Category','Price','Stock','Rating','Actions'].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                    <tbody>{sellerGroups[email].products.map(p => <ProductRow key={p._id} product={p} />)}</tbody>
                  </table>
                </div>
              </div>
            ))}

            {products.length === 0 && !loading && (
              <div className="text-center py-16" style={{ color: 'rgba(255,255,255,0.25)' }}>
                <p className="font-body text-sm">No products found.</p>
              </div>
            )}
          </>
        ) : (
          // Filtered view: single table
          <div className="overflow-x-auto" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '8px' }}>
            <table className="w-full">
              <thead>
                <tr>{['Product','Source','Category','Price','Stock','Rating','Actions'].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {loading
                  ? [...Array(5)].map((_,i) => <tr key={i}>{[...Array(7)].map((_,j)=><td key={j} style={tdStyle}><div className="skeleton h-4 rounded" /></td>)}</tr>)
                  : visibleProducts.map(p => <ProductRow key={p._id} product={p} />)
                }
              </tbody>
            </table>
            {!loading && visibleProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>No products in this category.</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {[...Array(pagination.pages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className="w-8 h-8 text-sm font-body transition-all"
                style={{
                  backgroundColor: page === i + 1 ? GOLD : 'transparent',
                  color:           page === i + 1 ? '#fff' : 'rgba(255,255,255,0.4)',
                  border:          `1px solid ${page === i + 1 ? GOLD : BORDER}`,
                  borderRadius:    '4px',
                }}>{i + 1}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}