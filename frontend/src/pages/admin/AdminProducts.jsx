import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiStar, FiArrowLeft } from 'react-icons/fi';

const BG = '#0a0a0a';
const CARD = '#1a1a1a';
const BORDER = 'rgba(255,255,255,0.08)';
const GOLD = '#C9A84C';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productAPI.getAll({ search, page, limit: 10 });
      setProducts(res.products);
      setPagination(res.pagination);
    } finally { setLoading(false); }
  };
  useEffect(() => { fetchProducts(); }, [search, page]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    setDeleting(id);
    try { await productAPI.delete(id); toast.success('Product deleted'); fetchProducts(); }
    catch { toast.error('Failed to delete'); } finally { setDeleting(null); }
  };

  const thStyle = { color: 'rgba(255,255,255,0.35)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '1rem 1.5rem', textAlign: 'left', borderBottom: `1px solid ${BORDER}`, backgroundColor: '#050505' };
  const tdStyle = { padding: '1rem 1.5rem', borderBottom: `1px solid ${BORDER}` };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>
      <div className="px-6 py-5 flex items-center justify-between" style={{ backgroundColor: '#050505', borderBottom: `1px solid ${BORDER}` }}>
        <div>
          <p className="font-body text-xs tracking-[0.2em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Admin Panel</p>
          <h1 className="font-accent text-xl tracking-[0.2em]" style={{ color: GOLD }}>Products</h1>
        </div>
        <div className="flex gap-4 items-center">
          <Link to="/admin" className="font-body text-xs tracking-wider hover:text-gold transition-colors flex items-center gap-1"
            style={{ color: 'rgba(255,255,255,0.4)' }}><FiArrowLeft size={13} /> Dashboard</Link>
          <Link to="/admin/products/new"
            className="flex items-center gap-2 px-4 py-2 text-xs font-body tracking-wider text-white transition-colors"
            style={{ backgroundColor: GOLD }}>
            <FiPlus size={14} /> Add Product
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <input type="text" placeholder="Search products..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="px-4 py-2.5 text-sm font-body w-64 focus:outline-none"
            style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: '#fff' }} />
          <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>{pagination.total} products</p>
        </div>

        <div className="overflow-x-auto" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
          <table className="w-full">
            <thead>
              <tr>
                {['Product', 'Category', 'Price', 'Stock', 'Rating', 'Actions'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(5)].map((_, i) => (
                <tr key={i}>{[...Array(6)].map((_, j) => <td key={j} style={tdStyle}><div className="skeleton h-4 rounded w-full" /></td>)}</tr>
              )) : products.map(product => (
                <tr key={product._id} className="transition-colors" style={{}} onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={tdStyle}>
                    <div className="flex items-center gap-3">
                      <img src={product.images?.[0]?.url} alt="" className="w-12 h-14 object-cover flex-shrink-0" style={{ backgroundColor: '#0a0a0a' }} />
                      <div>
                        <p className="font-body font-medium text-sm text-white line-clamp-1">{product.name}</p>
                        <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{product.brand}</p>
                        <div className="flex gap-1 mt-1">
                          {product.isFeatured && <span className="badge-gold text-[9px]">Featured</span>}
                          {product.isNewArrival && <span className="badge-black text-[9px]">New</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}><span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{product.category}</span></td>
                  <td style={tdStyle}>
                    <p className="font-body text-sm font-medium text-white">₹{(product.discountPrice || product.price)?.toLocaleString()}</p>
                    {product.discountPrice && <p className="font-body text-xs line-through" style={{ color: 'rgba(255,255,255,0.3)' }}>₹{product.price?.toLocaleString()}</p>}
                  </td>
                  <td style={tdStyle}>
                    <span className="font-body text-sm font-medium"
                      style={{ color: product.stock === 0 ? '#f87171' : product.stock < 10 ? '#fbbf24' : '#4ade80' }}>
                      {product.stock}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div className="flex items-center gap-1">
                      <FiStar size={12} style={{ color: GOLD }} className="fill-current" />
                      <span className="font-body text-sm text-white">{product.ratings || 0}</span>
                      <span className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>({product.numReviews})</span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div className="flex items-center gap-2">
                      <Link to={`/admin/products/${product._id}/edit`}
                        className="w-8 h-8 flex items-center justify-center transition-all"
                        style={{ border: `1px solid ${BORDER}`, color: 'rgba(255,255,255,0.4)' }}
                        onMouseOver={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
                        onMouseOut={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}>
                        <FiEdit2 size={13} />
                      </Link>
                      <button onClick={() => handleDelete(product._id)} disabled={deleting === product._id}
                        className="w-8 h-8 flex items-center justify-center transition-all"
                        style={{ border: `1px solid ${BORDER}`, color: 'rgba(255,255,255,0.4)' }}
                        onMouseOver={e => { e.currentTarget.style.borderColor = '#f87171'; e.currentTarget.style.color = '#f87171'; }}
                        onMouseOut={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}>
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {[...Array(pagination.pages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className="w-8 h-8 text-sm font-body transition-all"
                style={{
                  backgroundColor: page === i + 1 ? GOLD : 'transparent',
                  color: page === i + 1 ? '#fff' : 'rgba(255,255,255,0.4)',
                  border: `1px solid ${page === i + 1 ? GOLD : BORDER}`,
                }}>{i + 1}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
