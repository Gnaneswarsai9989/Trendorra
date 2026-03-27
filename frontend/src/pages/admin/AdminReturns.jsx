// pages/admin/AdminReturns.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
    FiArrowLeft, FiRotateCcw, FiCheck, FiX, FiRefreshCw,
    FiImage, FiUser, FiCalendar, FiPackage,
} from 'react-icons/fi';

const BG = '#0a0a0a';
const CARD = '#1a1a1a';
const BORDER = 'rgba(255,255,255,0.08)';
const GOLD = '#C9A84C';

const rStyle = (s) => ({
    Pending: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)' },
    Approved: { color: '#4ade80', bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.3)' },
    Rejected: { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)' },
}[s] || { color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)', border: BORDER });

// ── Image lightbox ────────────────────────────────────────────────
function ImageModal({ src, onClose }) {
    if (!src) return null;
    return (
        <div onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <img src={src} alt="Return evidence" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }} />
            <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', color: '#fff', cursor: 'pointer', fontSize: '16px' }}>✕</button>
        </div>
    );
}

// ── Action modal (approve / reject) ──────────────────────────────
function ActionModal({ open, order, action, onClose, onConfirm, loading }) {
    const [note, setNote] = useState('');
    useEffect(() => { if (open) setNote(''); }, [open]);
    if (!open || !order) return null;

    const isApprove = action === 'approve';
    const refund = order.totalPrice || 0;
    const orderId = order._id.slice(-8).toUpperCase();

    return (
        <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ backgroundColor: '#1a1a1a', border: `1px solid ${isApprove ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`, borderRadius: '14px', padding: '28px', maxWidth: '460px', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: isApprove ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${isApprove ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {isApprove ? <FiCheck size={20} style={{ color: '#4ade80' }} /> : <FiX size={20} style={{ color: '#f87171' }} />}
                    </div>
                    <div>
                        <h3 style={{ color: isApprove ? '#4ade80' : '#f87171', fontSize: '15px', fontFamily: 'Cinzel, serif', margin: '0 0 3px' }}>
                            {isApprove ? 'Approve Return' : 'Reject Return'}
                        </h3>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', margin: 0 }}>Order #{orderId}</p>
                    </div>
                </div>

                {isApprove && (
                    <div style={{ backgroundColor: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>Refund to Customer</p>
                        <p style={{ color: '#4ade80', fontSize: '24px', fontWeight: '700', margin: '0 0 4px' }}>₹{refund.toLocaleString('en-IN')}</p>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', margin: 0 }}>Will be processed within 5–7 business days</p>
                    </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>
                        {isApprove ? 'Message to Customer (Optional)' : 'Reason for Rejection (Required)'}
                    </p>
                    <textarea
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        rows={3}
                        placeholder={isApprove ? 'e.g. Return pickup will be arranged within 24 hours...' : 'e.g. Item shows signs of use and is not eligible for return...'}
                        style={{ width: '100%', backgroundColor: '#0d0d0d', border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                        onFocus={e => e.target.style.borderColor = GOLD}
                        onBlur={e => e.target.style.borderColor = BORDER}
                    />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '11px', backgroundColor: 'transparent', border: `1px solid ${BORDER}`, borderRadius: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer' }}>
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(action, note)}
                        disabled={loading || (!isApprove && !note.trim())}
                        style={{ flex: 2, padding: '11px', backgroundColor: loading ? 'rgba(201,168,76,0.3)' : GOLD, border: 'none', borderRadius: '6px', color: '#000', fontSize: '13px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
                        {loading
                            ? <><FiRefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</>
                            : isApprove ? <><FiCheck size={13} /> Approve & Notify Customer</> : <><FiX size={13} /> Reject & Notify Customer</>
                        }
                    </button>
                </div>
                {!isApprove && !note.trim() && (
                    <p style={{ color: '#f87171', fontSize: '11px', margin: '8px 0 0', textAlign: 'center' }}>Please provide a reason for rejection</p>
                )}
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function AdminReturns() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Pending');
    const [actModal, setActModal] = useState({ open: false, order: null, action: null });
    const [actLoad, setActLoad] = useState(false);
    const [imgSrc, setImgSrc] = useState(null);

    const fetchReturns = async () => {
        setLoading(true);
        try {
            const res = await orderAPI.getReturns({ status: filter || undefined, limit: 100 });
            setOrders(res.orders || []);
        } catch (e) {
            toast.error(e?.message || 'Failed to load returns');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReturns(); }, [filter]);

    const handleAction = async (action, note) => {
        if (!actModal.order) return;
        setActLoad(true);
        try {
            const res = await orderAPI.handleReturn(actModal.order._id, action, note);
            toast.success(res.message || (action === 'approve' ? 'Return approved!' : 'Return rejected'));
            setActModal({ open: false, order: null, action: null });
            fetchReturns();
        } catch (e) {
            toast.error(e?.message || 'Action failed');
        } finally {
            setActLoad(false);
        }
    };

    const thS = { color: 'rgba(255,255,255,0.35)', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '12px 16px', textAlign: 'left', borderBottom: `1px solid ${BORDER}`, backgroundColor: '#050505' };
    const tdS = { padding: '14px 16px', borderBottom: `1px solid ${BORDER}`, verticalAlign: 'top' };

    const counts = { Pending: 0, Approved: 0, Rejected: 0 };
    orders.forEach(o => { if (o.returnRequest?.status) counts[o.returnRequest.status] = (counts[o.returnRequest.status] || 0) + 1; });

    return (
        <div className="min-h-screen" style={{ backgroundColor: BG }}>
            <ImageModal src={imgSrc} onClose={() => setImgSrc(null)} />
            <ActionModal
                open={actModal.open}
                order={actModal.order}
                action={actModal.action}
                onClose={() => setActModal({ open: false, order: null, action: null })}
                onConfirm={handleAction}
                loading={actLoad}
            />

            <style>{`
                @media (max-width: 768px) {
                    .admin-returns-card { display: block !important; }
                    .admin-returns-card thead { display: none !important; }
                    .admin-returns-card tbody { display: block !important; }
                    .admin-returns-card tr { display: block !important; border: 1px solid rgba(255,255,255,0.08) !important; border-radius: 12px !important; margin-bottom: 12px !important; padding: 12px !important; background: #0a0a0a !important; }
                    .admin-returns-card td { display: block !important; border: none !important; padding: 4px 0 !important; }
                    .admin-returns-card td:first-child p { font-size: 14px !important; }
                    .admin-returns-wrap { overflow-x: auto !important; padding: 0 12px !important; }
                    .admin-returns-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
                }
            `}</style>

            {/* Header */}
            <div className="admin-returns-header" style={{ padding: '16px 24px', borderBottom: `1px solid ${BORDER}`, backgroundColor: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 2px' }}>Admin Panel</p>
                    <h1 style={{ color: GOLD, fontFamily: 'Cinzel, serif', fontSize: '18px', letterSpacing: '0.1em', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FiRotateCcw size={16} /> Return Requests
                    </h1>
                </div>
                <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '12px', textDecoration: 'none' }}>
                    <FiArrowLeft size={13} /> Dashboard
                </Link>
            </div>

            <div className="admin-returns-wrap" style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px' }}>

                {/* Filter tabs */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    {[
                        { key: '', label: `All (${orders.length})`, color: GOLD },
                        { key: 'Pending', label: `Pending (${counts.Pending || 0})`, color: '#fbbf24' },
                        { key: 'Approved', label: `Approved (${counts.Approved || 0})`, color: '#4ade80' },
                        { key: 'Rejected', label: `Rejected (${counts.Rejected || 0})`, color: '#f87171' },
                    ].map(tab => (
                        <button key={tab.key} onClick={() => setFilter(tab.key)}
                            style={{ padding: '8px 18px', borderRadius: '6px', fontSize: '12px', fontFamily: 'Jost, sans-serif', fontWeight: filter === tab.key ? '700' : '400', cursor: 'pointer', transition: 'all 0.15s', backgroundColor: filter === tab.key ? tab.color : 'transparent', color: filter === tab.key ? '#000' : 'rgba(255,255,255,0.45)', border: `1px solid ${filter === tab.key ? tab.color : BORDER}` }}>
                            {tab.label}
                        </button>
                    ))}
                    <button onClick={fetchReturns} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: 'transparent', border: `1px solid ${BORDER}`, borderRadius: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '12px', cursor: 'pointer' }}>
                        <FiRefreshCw size={12} /> Refresh
                    </button>
                </div>

                {/* Table */}
                <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
                    {loading ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>Loading...</div>
                    ) : orders.length === 0 ? (
                        <div style={{ padding: '64px', textAlign: 'center' }}>
                            <FiRotateCcw size={40} style={{ color: 'rgba(255,255,255,0.08)', display: 'block', margin: '0 auto 14px' }} />
                            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '14px' }}>No return requests found.</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="admin-returns-card" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                                <thead>
                                    <tr>
                                        {['Order', 'Customer', 'Reason', 'Evidence', 'Requested', 'Status', 'Actions'].map(h => (
                                            <th key={h} style={thS}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(order => {
                                        const rr = order.returnRequest;
                                        const rs = rStyle(rr?.status);
                                        const orderId = order._id.slice(-8).toUpperCase();
                                        const isPending = rr?.status === 'Pending';

                                        return (
                                            <tr key={order._id}
                                                onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                                                onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>

                                                {/* Order */}
                                                <td style={tdS}>
                                                    <Link to={`/admin/orders`} style={{ color: GOLD, fontSize: '13px', fontWeight: '600', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '3px' }}>
                                                        #{orderId}
                                                    </Link>
                                                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '3px 0 0' }}>
                                                        ₹{order.totalPrice?.toLocaleString('en-IN')}
                                                    </p>
                                                </td>

                                                {/* Customer */}
                                                <td style={tdS}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: `${GOLD}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                            <FiUser size={12} style={{ color: GOLD }} />
                                                        </div>
                                                        <div>
                                                            <p style={{ color: '#fff', fontSize: '13px', fontWeight: '500', margin: '0 0 2px' }}>{order.user?.name}</p>
                                                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0 }}>{order.user?.email}</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Reason */}
                                                <td style={tdS}>
                                                    <p style={{ color: '#fff', fontSize: '12px', fontWeight: '500', margin: '0 0 4px' }}>{rr?.reasonLabel || rr?.reason || '—'}</p>
                                                    {rr?.note && (
                                                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {rr.note}
                                                        </p>
                                                    )}
                                                    {rr?.upiId && (
                                                        <p style={{ color: GOLD, fontSize: '11px', margin: '4px 0 0', fontWeight: '500' }}>
                                                            UPI: {rr.upiId}
                                                        </p>
                                                    )}
                                                </td>

                                                {/* Photos */}
                                                <td style={tdS}>
                                                    {rr?.images?.length > 0 ? (
                                                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                                            {rr.images.map((img, i) => (
                                                                <img key={i} src={img.url} alt="" onClick={() => setImgSrc(img.url)}
                                                                    style={{ width: '36px', height: '44px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: `1px solid ${BORDER}` }}
                                                                    title="Click to enlarge"
                                                                />
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <FiImage size={11} /> None
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Date */}
                                                <td style={tdS}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                        <FiCalendar size={11} style={{ color: 'rgba(255,255,255,0.25)' }} />
                                                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                                                            {rr?.requestedAt ? new Date(rr.requestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td style={tdS}>
                                                    <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', color: rs.color, backgroundColor: rs.bg, border: `1px solid ${rs.border}`, fontWeight: '600' }}>
                                                        {rr?.status || '—'}
                                                    </span>
                                                    {rr?.status === 'Approved' && rr?.refundAmount > 0 && (
                                                        <p style={{ color: '#4ade80', fontSize: '11px', margin: '5px 0 0', fontWeight: '600' }}>
                                                            Refund: ₹{rr.refundAmount.toLocaleString('en-IN')}
                                                        </p>
                                                    )}
                                                    {rr?.resolutionNote && (
                                                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', margin: '4px 0 0', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {rr.resolutionNote}
                                                        </p>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td style={tdS}>
                                                    {isPending ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                            <button
                                                                onClick={() => setActModal({ open: true, order, action: 'approve' })}
                                                                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', backgroundColor: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '6px', color: '#4ade80', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                                                <FiCheck size={11} /> Approve
                                                            </button>
                                                            <button
                                                                onClick={() => setActModal({ open: true, order, action: 'reject' })}
                                                                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', backgroundColor: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '6px', color: '#f87171', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                                                <FiX size={11} /> Reject
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>
                                                            {rr?.status === 'Approved' ? '✓ Resolved' : '✕ Closed'}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}