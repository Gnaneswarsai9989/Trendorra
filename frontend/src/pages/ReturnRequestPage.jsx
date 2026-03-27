// pages/ReturnRequestPage.jsx
import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { orderAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiCheck, FiUpload, FiX, FiAlertCircle, FiRotateCcw } from 'react-icons/fi';

const BG = '#111111';
const BG2 = '#0a0a0a';
const BORDER = 'rgba(255,255,255,0.08)';
const GOLD = '#C9A84C';

const RETURN_REASONS = [
    { id: 'wrong_size', label: "Wrong Size / Doesn't Fit", desc: 'Too big, too small, or sizing is off' },
    { id: 'wrong_item', label: 'Wrong Item Received', desc: 'I received a different product than ordered' },
    { id: 'defective', label: 'Defective / Damaged Product', desc: 'Arrived with tears, holes, or defects' },
    { id: 'poor_quality', label: 'Poor Quality', desc: "Material quality doesn't match the listing" },
    { id: 'not_as_desc', label: 'Not as Described', desc: 'Looks different from photos or description' },
    { id: 'color_mismatch', label: 'Color / Shade Mismatch', desc: 'Color received differs from what was shown' },
    { id: 'missing_parts', label: 'Incomplete / Missing Parts', desc: 'Parts of the product or accessories missing' },
    { id: 'changed_mind', label: 'Changed My Mind', desc: 'I no longer need this item' },
    { id: 'duplicate', label: 'Ordered by Mistake / Duplicate', desc: 'I accidentally placed a duplicate order' },
    { id: 'late_delivery', label: 'Arrived Too Late', desc: 'Item arrived much later than expected' },
];

export default function ReturnRequestPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedReason, setSelected] = useState('');
    const [additionalNote, setNote] = useState('');
    const [upiId, setUpiId] = useState('');
    const [images, setImages] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        orderAPI.getById(id)
            .then(res => setOrder(res.order))
            .catch(() => toast.error('Could not load order'))
            .finally(() => setLoading(false));
    }, [id]);

    const handleImageAdd = (e) => {
        const files = Array.from(e.target.files);
        if (images.length + files.length > 4) { toast.error('Max 4 images'); return; }
        const newImgs = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
        setImages(prev => [...prev, ...newImgs]);
        e.target.value = '';
    };

    const removeImage = (idx) => {
        setImages(prev => { URL.revokeObjectURL(prev[idx].preview); return prev.filter((_, i) => i !== idx); });
    };

    const handleSubmit = async () => {
        if (!selectedReason) { toast.error('Please select a return reason'); return; }
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('reason', selectedReason);
            formData.append('reasonLabel', RETURN_REASONS.find(r => r.id === selectedReason)?.label || '');
            formData.append('note', additionalNote);
            formData.append('upiId', upiId);
            images.forEach(img => formData.append('images', img.file));
            await orderAPI.requestReturn(id, formData);
            setSubmitted(true);
            toast.success('Return request submitted!');
        } catch (err) {
            toast.error(err.message || 'Failed to submit. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Loading skeleton
    if (loading) return (
        <div className="min-h-screen" style={{ backgroundColor: BG }}>
            <div className="max-w-2xl mx-auto px-6 py-16 space-y-4">
                <div className="skeleton h-6 w-32 rounded" />
                <div className="skeleton h-16 rounded" />
                <div className="skeleton h-96 rounded" />
            </div>
        </div>
    );

    // Order not found
    if (!order) return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: BG }}>
            <div className="text-center">
                <FiAlertCircle size={52} className="mx-auto mb-5" style={{ color: '#f87171' }} />
                <h2 className="font-display text-2xl font-light text-white mb-2">Order Not Found</h2>
                <p className="font-body text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    We couldn't find this order in your account.
                </p>
                <Link to="/orders" className="font-body text-sm px-6 py-2.5 inline-block"
                    style={{ border: `1px solid ${GOLD}`, color: GOLD, borderRadius: '4px' }}>
                    Back to Orders
                </Link>
            </div>
        </div>
    );

    // Success screen
    if (submitted) return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: BG }}>
            <div className="text-center max-w-md w-full">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8"
                    style={{ backgroundColor: 'rgba(74,222,128,0.08)', border: '2px solid rgba(74,222,128,0.25)' }}>
                    <FiCheck size={36} style={{ color: '#4ade80' }} />
                </div>
                <p className="font-body text-xs tracking-[0.2em] uppercase mb-3" style={{ color: GOLD }}>Request Submitted</p>
                <h2 className="font-display text-3xl font-light text-white mb-4">We Got Your Request</h2>
                <p className="font-body text-sm mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Your return request for order{' '}
                    <span style={{ color: '#fff', fontWeight: 600 }}>#{order._id.slice(-8).toUpperCase()}</span>{' '}
                    has been sent to the seller.
                </p>
                <p className="font-body text-sm mb-10" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    You'll receive a response within 24–48 business hours via your registered email.
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                    <Link to="/orders" className="font-body text-sm px-7 py-2.5"
                        style={{ border: `1px solid ${GOLD}`, color: GOLD, borderRadius: '4px' }}>
                        My Orders
                    </Link>
                    <Link to="/" className="font-body text-sm px-7 py-2.5 font-semibold"
                        style={{ backgroundColor: GOLD, color: '#000', borderRadius: '4px' }}>
                        Go Home
                    </Link>
                </div>
            </div>
        </div>
    );

    // Main form
    return (
        <div className="min-h-screen py-12 px-4 sm:px-6" style={{ backgroundColor: BG }}>
            <div className="max-w-2xl mx-auto">

                <Link to={`/orders/${id}`}
                    className="font-body text-sm inline-flex items-center gap-2 mb-10 transition-opacity hover:opacity-60"
                    style={{ color: 'rgba(255,255,255,0.4)' }}>
                    <FiArrowLeft size={14} /> Back to Order
                </Link>

                <div className="mb-8">
                    <p className="font-body text-xs tracking-[0.2em] uppercase mb-2" style={{ color: GOLD }}>Return &amp; Refund</p>
                    <h1 className="font-display text-3xl font-light text-white mb-1">Request a Return</h1>
                    <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        Order #{order._id.slice(-8).toUpperCase()} &nbsp;·&nbsp;
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>

                {/* Items preview */}
                <div className="mb-8 p-5 rounded-xl" style={{ backgroundColor: BG2, border: `1px solid ${BORDER}` }}>
                    <p className="font-body text-xs tracking-[0.15em] uppercase mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Items in this Order</p>
                    <div className="space-y-3">
                        {order.orderItems?.map(item => (
                            <div key={item._id} className="flex items-center gap-4">
                                <img src={item.image} alt={item.name} className="w-12 h-14 object-cover flex-shrink-0" style={{ border: `1px solid ${BORDER}` }} />
                                <div className="flex-1 min-w-0">
                                    <p className="font-body text-sm font-medium text-white truncate">{item.name}</p>
                                    <p className="font-body text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                        {item.size && `Size: ${item.size}`}{item.color && ` • Color: ${item.color}`}{` • Qty: ${item.quantity}`}
                                    </p>
                                </div>
                                <p className="font-body text-sm text-white flex-shrink-0">₹{(item.price * item.quantity).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* STEP 1 — Reason */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-5">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: GOLD, color: '#000' }}>1</span>
                        <h2 className="font-body text-sm font-semibold text-white tracking-wide">Select a Return Reason</h2>
                    </div>

                    <div className="space-y-2">
                        {RETURN_REASONS.map((reason, i) => {
                            const active = selectedReason === reason.id;
                            return (
                                <button key={reason.id} onClick={() => setSelected(reason.id)}
                                    className="w-full text-left p-4 rounded-lg transition-all"
                                    style={{ backgroundColor: active ? `${GOLD}10` : BG2, border: `1px solid ${active ? GOLD : BORDER}`, cursor: 'pointer' }}>
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-start gap-3 flex-1">
                                            <span className="font-body text-xs flex-shrink-0 mt-0.5"
                                                style={{ color: active ? GOLD : 'rgba(255,255,255,0.2)', fontWeight: 600, minWidth: '18px' }}>
                                                {String(i + 1).padStart(2, '0')}
                                            </span>
                                            <div>
                                                <p className="font-body text-sm font-medium" style={{ color: active ? '#fff' : 'rgba(255,255,255,0.75)' }}>{reason.label}</p>
                                                <p className="font-body text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{reason.desc}</p>
                                            </div>
                                        </div>
                                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: active ? GOLD : 'transparent', border: `2px solid ${active ? GOLD : 'rgba(255,255,255,0.15)'}`, transition: 'all 0.15s' }}>
                                            {active && <FiCheck size={11} color="#000" strokeWidth={3} />}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* STEP 2 — Photos */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-5">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: GOLD, color: '#000' }}>2</span>
                        <div>
                            <h2 className="font-body text-sm font-semibold text-white tracking-wide">
                                Upload Photos <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>(Optional · max 4)</span>
                            </h2>
                            <p className="font-body text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Photos help us resolve your return faster</p>
                        </div>
                    </div>

                    <div className="flex gap-3 flex-wrap">
                        {images.map((img, idx) => (
                            <div key={idx} className="relative w-20 h-24 flex-shrink-0"
                                style={{ border: `1px solid ${BORDER}`, borderRadius: '6px', overflow: 'hidden' }}>
                                <img src={img.preview} alt="" className="w-full h-full object-cover" />
                                <button onClick={() => removeImage(idx)}
                                    className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}>
                                    <FiX size={10} color="#fff" />
                                </button>
                            </div>
                        ))}
                        {images.length < 4 && (
                            <label className="w-20 h-24 flex flex-col items-center justify-center cursor-pointer flex-shrink-0 transition-all"
                                style={{ border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.02)' }}
                                onMouseOver={e => e.currentTarget.style.borderColor = GOLD}
                                onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}>
                                <FiUpload size={18} style={{ color: 'rgba(255,255,255,0.25)', marginBottom: '4px' }} />
                                <span className="font-body text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Add Photo</span>
                                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageAdd} />
                            </label>
                        )}
                    </div>
                </div>

                {/* STEP 3 — Note */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-5">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: GOLD, color: '#000' }}>3</span>
                        <h2 className="font-body text-sm font-semibold text-white tracking-wide">
                            Additional Details <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>(Optional)</span>
                        </h2>
                    </div>
                    <textarea value={additionalNote} onChange={e => setNote(e.target.value)} maxLength={500} rows={4}
                        placeholder="Describe the issue in more detail… e.g. 'The stitching came apart on the left sleeve after one wash'"
                        className="w-full font-body text-sm resize-none outline-none"
                        style={{ backgroundColor: BG2, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '14px 16px', color: '#fff', caretColor: GOLD }}
                        onFocus={e => e.target.style.borderColor = `${GOLD}50`}
                        onBlur={e => e.target.style.borderColor = BORDER} />
                    <p className="font-body text-xs mt-1.5 text-right" style={{ color: 'rgba(255,255,255,0.2)' }}>
                        {additionalNote.length}/500
                    </p>
                </div>

                {/* STEP 4 — Refund Details */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-5">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: GOLD, color: '#000' }}>4</span>
                        <div>
                            <h2 className="font-body text-sm font-semibold text-white tracking-wide">Refund Details</h2>
                            <p className="font-body text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Enter your UPI ID to receive the refund</p>
                        </div>
                    </div>
                    <input type="text" value={upiId} onChange={e => setUpiId(e.target.value)}
                        placeholder="e.g. yourname@upi"
                        className="w-full font-body text-sm outline-none"
                        style={{ backgroundColor: BG2, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '14px 16px', color: '#fff', caretColor: GOLD }}
                        onFocus={e => e.target.style.borderColor = `${GOLD}50`}
                        onBlur={e => e.target.style.borderColor = BORDER} />
                    <p className="font-body text-xs mt-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        ✨ The amount will be credited to this account within 7 days of approval.
                    </p>
                </div>

                {/* Info banner */}
                <div className="mb-8 p-4 rounded-lg flex gap-3"
                    style={{ backgroundColor: `${GOLD}08`, border: `1px solid ${GOLD}20` }}>
                    <FiRotateCcw size={13} style={{ color: GOLD, marginTop: '2px', flexShrink: 0 }} />
                    <p className="font-body text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        Your request will be sent directly to the seller and our support team. You'll receive a response
                        within <strong style={{ color: 'rgba(255,255,255,0.65)' }}>24–48 business hours</strong>. Once approved,
                        a free pickup will be arranged for defective or wrong items.
                    </p>
                </div>

                {/* Submit */}
                <button onClick={handleSubmit} disabled={submitting || !selectedReason || !upiId.trim()}
                    className="w-full py-4 font-body font-semibold text-sm tracking-widest uppercase transition-all"
                    style={{
                        backgroundColor: (selectedReason && upiId.trim()) ? GOLD : 'rgba(255,255,255,0.04)',
                        color: (selectedReason && upiId.trim()) ? '#000' : 'rgba(255,255,255,0.15)',
                        borderRadius: '6px',
                        cursor: (selectedReason && upiId.trim() && !submitting) ? 'pointer' : 'not-allowed',
                        opacity: submitting ? 0.65 : 1,
                        border: `1px solid ${(selectedReason && upiId.trim()) ? GOLD : 'rgba(255,255,255,0.06)'}`,
                    }}>
                    {submitting ? 'Submitting Request…' : 'Submit Return Request'}
                </button>

                <p className="font-body text-xs text-center mt-4" style={{ color: 'rgba(255,255,255,0.18)' }}>
                    By submitting, you agree to our{' '}
                    <Link to="/refund-policy" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'underline' }}>
                        Return &amp; Refund Policy
                    </Link>
                </p>

            </div>
        </div>
    );
}