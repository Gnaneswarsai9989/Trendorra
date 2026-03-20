import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { couponAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiPlus, FiTrash2, FiTag } from 'react-icons/fi';

const BG = '#0a0a0a'; const CARD = '#1a1a1a';
const BORDER = 'rgba(255,255,255,0.08)'; const GOLD = '#C9A84C';

const inputStyle = { backgroundColor: '#050505', border: `1px solid rgba(255,255,255,0.1)`, color: '#fff', width: '100%', padding: '0.65rem 0.875rem', fontSize: '13px', borderRadius: '6px', outline: 'none' };
const labelStyle = { display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' };

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', description: '', discountType: 'percentage', discountValue: '', minOrderValue: '', maxDiscount: '', usageLimit: '', validTill: '' });

  const fetchCoupons = () => { couponAPI.getAll().then(r => setCoupons(r.coupons || [])).finally(() => setLoading(false)); };
  useEffect(() => { fetchCoupons(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await couponAPI.create({ ...form, code: form.code.toUpperCase() });
      toast.success('Coupon created!');
      setShowForm(false);
      setForm({ code: '', description: '', discountType: 'percentage', discountValue: '', minOrderValue: '', maxDiscount: '', usageLimit: '', validTill: '' });
      fetchCoupons();
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete coupon ${code}?`)) return;
    try { await couponAPI.delete(id); toast.success('Deleted'); fetchCoupons(); }
    catch { toast.error('Failed'); }
  };

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const isExpired = (date) => new Date(date) < new Date();

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>
      <div className="px-6 py-5 flex items-center justify-between" style={{ backgroundColor: '#050505', borderBottom: `1px solid ${BORDER}` }}>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>Admin Panel</p>
          <h1 style={{ color: GOLD, fontFamily: 'Cinzel, serif', fontSize: '18px', letterSpacing: '0.2em' }}>Coupons</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/admin" className="flex items-center gap-1 font-body text-xs hover:text-gold" style={{ color: 'rgba(255,255,255,0.4)' }}><FiArrowLeft size={13}/> Dashboard</Link>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 text-xs font-body tracking-wider text-white" style={{ backgroundColor: GOLD, borderRadius: '6px' }}>
            <FiPlus size={14}/> New Coupon
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Create form */}
        {showForm && (
          <form onSubmit={handleCreate} className="p-6 mb-8" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px' }}>
            <h2 className="font-display text-xl font-light text-white mb-6">Create Coupon</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label style={labelStyle}>Code *</label>
                <input value={form.code} onChange={set('code')} style={inputStyle} placeholder="SAVE20" required
                  onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}/>
              </div>
              <div>
                <label style={labelStyle}>Discount Type *</label>
                <select value={form.discountType} onChange={set('discountType')} style={inputStyle}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Discount Value *</label>
                <input type="number" value={form.discountValue} onChange={set('discountValue')} style={inputStyle} placeholder={form.discountType === 'percentage' ? '20' : '100'} required
                  onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}/>
              </div>
              <div>
                <label style={labelStyle}>Min Order (₹)</label>
                <input type="number" value={form.minOrderValue} onChange={set('minOrderValue')} style={inputStyle} placeholder="499"
                  onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}/>
              </div>
              <div>
                <label style={labelStyle}>Max Discount (₹)</label>
                <input type="number" value={form.maxDiscount} onChange={set('maxDiscount')} style={inputStyle} placeholder="500 (optional)"
                  onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}/>
              </div>
              <div>
                <label style={labelStyle}>Usage Limit</label>
                <input type="number" value={form.usageLimit} onChange={set('usageLimit')} style={inputStyle} placeholder="100 (blank = unlimited)"
                  onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}/>
              </div>
              <div>
                <label style={labelStyle}>Valid Till *</label>
                <input type="date" value={form.validTill} onChange={set('validTill')} style={inputStyle} required
                  onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}/>
              </div>
              <div className="col-span-2">
                <label style={labelStyle}>Description</label>
                <input value={form.description} onChange={set('description')} style={inputStyle} placeholder="e.g. Weekend Sale - 20% OFF"
                  onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}/>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button type="submit" className="px-8 py-2.5 font-body text-sm tracking-wider uppercase text-white" style={{ backgroundColor: GOLD, borderRadius: '6px' }}>Create</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-8 py-2.5 font-body text-sm tracking-wider uppercase" style={{ border: `1px solid ${BORDER}`, color: 'rgba(255,255,255,0.5)', borderRadius: '6px' }}>Cancel</button>
            </div>
          </form>
        )}

        {/* Coupons list */}
        {loading ? <div className="skeleton h-48 rounded-xl" /> : coupons.length === 0 ? (
          <div className="text-center py-16">
            <FiTag size={48} className="mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.1)' }}/>
            <p className="font-display text-xl font-light text-white mb-2">No coupons yet</p>
            <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Create your first coupon to offer discounts</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coupons.map(coupon => (
              <div key={coupon._id} className="p-5 relative" style={{ backgroundColor: CARD, border: `1px solid ${isExpired(coupon.validTill) ? 'rgba(248,113,113,0.2)' : BORDER}`, borderRadius: '12px' }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-body font-bold text-base tracking-widest" style={{ color: GOLD }}>{coupon.code}</span>
                      <span className="text-[10px] font-body px-2 py-0.5" style={{ backgroundColor: isExpired(coupon.validTill) ? 'rgba(248,113,113,0.1)' : 'rgba(74,222,128,0.1)', color: isExpired(coupon.validTill) ? '#f87171' : '#4ade80', borderRadius: '4px' }}>
                        {isExpired(coupon.validTill) ? 'Expired' : 'Active'}
                      </span>
                    </div>
                    {coupon.description && <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{coupon.description}</p>}
                  </div>
                  <button onClick={() => handleDelete(coupon._id, coupon.code)} className="text-red-400 hover:text-red-300 transition-colors p-1">
                    <FiTrash2 size={15}/>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-body">
                  {[
                    { l: 'Discount', v: coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}` },
                    { l: 'Min Order', v: coupon.minOrderValue ? `₹${coupon.minOrderValue}` : 'No minimum' },
                    { l: 'Max Discount', v: coupon.maxDiscount ? `₹${coupon.maxDiscount}` : 'No limit' },
                    { l: 'Used / Limit', v: `${coupon.usedCount} / ${coupon.usageLimit || '∞'}` },
                    { l: 'Valid Till', v: new Date(coupon.validTill).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
                  ].map(row => (
                    <div key={row.l}>
                      <span style={{ color: 'rgba(255,255,255,0.35)' }}>{row.l}: </span>
                      <span style={{ color: '#fff' }}>{row.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}