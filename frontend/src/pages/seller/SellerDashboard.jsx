import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productAPI, orderAPI, authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import {
  FiPackage, FiShoppingBag, FiDollarSign, FiTrendingUp,
  FiPlus, FiEdit2, FiTrash2, FiLogOut, FiUser,
  FiArrowRight, FiStar, FiAlertCircle, FiMapPin,
  FiCreditCard, FiPercent, FiTruck, FiSave,
  FiBarChart2, FiX, FiCheck, FiRefreshCw, FiAlertTriangle,
  FiArrowLeft, FiClock, FiFileText, FiShield,
} from 'react-icons/fi';

const BG     = '#0a0a0a';
const CARD   = '#111111';
const BORDER = 'rgba(255,255,255,0.08)';
const GOLD   = '#C9A84C';

const COMMISSION_RATE = 0.10;
const FIXED_FEE = (price) => {
  if (price <= 500)    return 20;
  if (price <= 1000)   return 30;
  if (price <= 5000)   return 40;
  if (price <= 10000)  return 80;
  if (price <= 50000)  return 120;
  if (price <= 100000) return 150;
  return 200;
};
const calcEarnings = (price) => {
  const p = Number(price) || 0;
  const commission = Math.round(p * COMMISSION_RATE);
  const fixed = FIXED_FEE(p);
  return { commission, fixed, total_deduction: commission + fixed, earnings: p - commission - fixed };
};

const DELIVERY_ZONES = [
  { zone: 'Zone 1', label: 'Same City',    charge: 40,  icon: '🏙️', days: '1–2 days' },
  { zone: 'Zone 2', label: 'Same State',   charge: 60,  icon: '🗺️', days: '2–3 days' },
  { zone: 'Zone 3', label: 'Nearby State', charge: 80,  icon: '🚚', days: '3–5 days' },
  { zone: 'Zone 4', label: 'Far State',    charge: 100, icon: '✈️', days: '5–7 days' },
];

const ORDER_STATUSES = ['Processing', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

const statusStyle = (s) => ({
  Processing:         { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
  Confirmed:          { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  Shipped:            { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  'Out for Delivery': { color: '#fb923c', bg: 'rgba(251,146,60,0.12)'  },
  Delivered:          { color: '#4ade80', bg: 'rgba(74,222,128,0.12)'  },
  Cancelled:          { color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
}[s] || { color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)' });

const NAV = [
  { id: 'overview',   label: 'Overview',    icon: FiTrendingUp  },
  { id: 'products',   label: 'My Products', icon: FiPackage     },
  { id: 'orders',     label: 'My Orders',   icon: FiShoppingBag },
  { id: 'tracking',   label: 'Delivery',    icon: FiTruck       },
  { id: 'analytics',  label: 'Analytics',   icon: FiBarChart2   },
  { id: 'commission', label: 'Commission',  icon: FiPercent     },
  { id: 'profile',    label: 'My Profile',  icon: FiUser        },
];

// ── Legal Documents Content ───────────────────────────────────────
const LEGAL_DOCS = {
  seller_agreement: {
    title: 'Seller Agreement & Terms of Service',
    icon: '📋',
    sections: [
      {
        heading: '1. Introduction',
        content: `This Seller Agreement ("Agreement") is entered into between Trendorra ("Platform", "we", "us") and you ("Seller", "you"). By registering as a seller on Trendorra, you agree to be bound by these terms. Please read this agreement carefully before listing any products.`,
      },
      {
        heading: '2. Seller Eligibility',
        content: `To sell on Trendorra, you must:\n• Be at least 18 years of age\n• Have a valid bank account for payouts\n• Provide accurate business and personal information\n• Obtain any required licenses or permits for selling your products\n• Not be prohibited by any applicable law from participating in e-commerce`,
      },
      {
        heading: '3. Product Listings',
        content: `Sellers are responsible for:\n• Ensuring all product descriptions, images, and pricing are accurate and not misleading\n• Maintaining adequate stock levels and updating listings promptly\n• Complying with all applicable laws regarding product safety, labeling, and intellectual property\n• Not listing counterfeit, prohibited, or restricted items\n• Ensuring product images are original or licensed for commercial use`,
      },
      {
        heading: '4. Order Fulfillment',
        content: `Upon receiving an order, sellers must:\n• Confirm and pack the order within 24 hours\n• Mark the order as "Ready for Pickup" within 48 hours\n• Ensure products are properly packaged to prevent damage during transit\n• Include the correct items as listed in the order\n• Notify Trendorra immediately of any stock unavailability`,
      },
      {
        heading: '5. Seller Conduct',
        content: `Sellers agree not to:\n• Engage in price manipulation or artificial inflation\n• Contact buyers directly to bypass the platform\n• Solicit reviews, ratings, or feedback in exchange for incentives\n• Use the platform for any fraudulent or illegal activity\n• Violate any third-party intellectual property rights`,
      },
      {
        heading: '6. Account Suspension & Termination',
        content: `Trendorra reserves the right to suspend or permanently terminate a seller account for:\n• Repeated violations of these terms\n• Selling counterfeit or prohibited goods\n• Fraudulent activity or misrepresentation\n• Consistently poor performance metrics (cancellation rate, return rate)\n• Non-compliance with applicable laws\n\nUpon termination, any pending payouts may be withheld pending investigation.`,
      },
      {
        heading: '7. Amendments',
        content: `Trendorra reserves the right to modify these terms at any time. Sellers will be notified of significant changes via email. Continued use of the platform after changes constitutes acceptance of the new terms.`,
      },
    ],
  },
  commission_policy: {
    title: 'Commission & Fee Policy',
    icon: '💰',
    sections: [
      {
        heading: '1. Commission Structure',
        content: `Trendorra charges a flat 10% commission on the selling price of every successfully delivered order. This commission is automatically deducted before payout to the seller.\n\nExample: If you sell a product for ₹1,000, Trendorra retains ₹100 (10%) as commission.`,
      },
      {
        heading: '2. Fixed Platform Fee',
        content: `In addition to commission, a fixed platform fee is charged per order based on the order value:\n\n• Up to ₹500        →  ₹20 fixed fee\n• ₹501 – ₹1,000    →  ₹30 fixed fee\n• ₹1,001 – ₹5,000  →  ₹40 fixed fee\n• ₹5,001 – ₹10,000 →  ₹80 fixed fee\n• ₹10,001 – ₹50,000 → ₹120 fixed fee\n• ₹50,001 – ₹1,00,000 → ₹150 fixed fee\n• Above ₹1,00,000  → ₹200 fixed fee\n\nThis fee covers payment processing, platform maintenance, and customer support costs.`,
      },
      {
        heading: '3. Earnings Calculation',
        content: `Your earnings per sale are calculated as:\n\nSeller Earnings = Selling Price − 10% Commission − Fixed Platform Fee\n\nExample for ₹2,000 product:\n• Selling Price: ₹2,000\n• Commission (10%): −₹200\n• Fixed Fee: −₹40\n• Your Earnings: ₹1,760\n\nYou can use the Earnings Calculator in your Commission tab to calculate earnings for any price.`,
      },
      {
        heading: '4. No Hidden Fees',
        content: `Trendorra does not charge any additional fees including:\n• No listing fees\n• No monthly subscription fees\n• No fees for uploading product images\n• No fees for creating or editing product listings\n\nYou only pay when you make a sale.`,
      },
      {
        heading: '5. Fee Changes',
        content: `Trendorra reserves the right to revise commission rates or fixed fees with 30 days advance notice to sellers. Fee changes will not apply to orders placed before the effective date of the change.`,
      },
    ],
  },
  return_policy: {
    title: 'Return & Refund Policy for Sellers',
    icon: '🔄',
    sections: [
      {
        heading: '1. Return Window',
        content: `Customers are eligible to initiate a return within 7 days of delivery for the following reasons:\n• Product received is damaged or defective\n• Product does not match the listing description\n• Wrong product delivered\n• Product is missing components or accessories as listed\n\nReturns are NOT accepted for:\n• Change of mind after delivery\n• Products that have been used or washed\n• Products damaged by the customer`,
      },
      {
        heading: '2. Seller Responsibilities',
        content: `When a return is initiated:\n• Sellers will be notified via email and dashboard notification\n• Sellers must respond to return requests within 48 hours\n• If the return is valid, the product will be picked up from the customer and returned to the seller's address\n• Sellers must inspect returned products within 24 hours of receipt`,
      },
      {
        heading: '3. Impact on Seller Payouts',
        content: `For valid returns:\n• The full payout for that order will be reversed if not yet paid\n• If already paid out, the amount will be deducted from future payouts\n• Platform commission and fixed fee are also reversed for returned orders\n\nFor invalid return claims (e.g., customer misuse):\n• Trendorra will investigate and may side with the seller\n• Sellers can raise a dispute within 48 hours of return delivery`,
      },
      {
        heading: '4. Return Rate Monitoring',
        content: `Trendorra monitors seller return rates. A return rate above 10% may result in:\n• Account review and warning\n• Temporary listing suspension\n• Requirement to improve product descriptions or quality\n\nSellers with consistently high return rates may have their accounts suspended.`,
      },
      {
        heading: '5. Dispute Resolution',
        content: `If you believe a return is fraudulent or invalid:\n• Contact Trendorra support within 48 hours of return delivery\n• Provide evidence (photos, order details, product condition)\n• Trendorra will review and respond within 5 business days\n• Trendorra's decision on disputes is final`,
      },
    ],
  },
  payout_policy: {
    title: 'Payment & Payout Policy',
    icon: '🏦',
    sections: [
      {
        heading: '1. Payout Eligibility',
        content: `Payouts are processed only for orders that have reached "Delivered" status. An order becomes payout-eligible when:\n• The customer confirms delivery, OR\n• The delivery partner marks the order as delivered\n• No active return or dispute is pending on the order`,
      },
      {
        heading: '2. Payout Process',
        content: `Trendorra processes payouts on a weekly basis (every Monday) for all eligible orders from the previous week. The process:\n1. Admin reviews all eligible orders\n2. Earnings are calculated (selling price minus commission and fixed fee)\n3. Amount is transferred to your registered bank account\n4. Payout confirmation is sent via email\n5. Transaction is recorded in your Payout History`,
      },
      {
        heading: '3. Bank Account Requirements',
        content: `To receive payouts, sellers must provide:\n• Valid Indian bank account number\n• Correct IFSC code\n• Account holder name matching your registered name\n• Active bank account (not dormant)\n\nPayouts to incorrect bank details are the seller's responsibility. Trendorra is not liable for failed transfers due to incorrect account information.`,
      },
      {
        heading: '4. Minimum Payout Threshold',
        content: `Payouts are processed when your pending earnings balance reaches a minimum of ₹100. Balances below this threshold are carried forward to the next payout cycle.`,
      },
      {
        heading: '5. Payout Holds & Deductions',
        content: `Payouts may be held or reduced in the following situations:\n• Active return or dispute on an order\n• Suspected fraudulent activity\n• Account under review or suspended\n• Chargebacks from payment gateway\n• Outstanding dues (e.g., reversed payouts from returns)\n\nTrendorra will notify sellers of any payout holds with a reason.`,
      },
      {
        heading: '6. Tax Responsibilities',
        content: `Sellers are solely responsible for:\n• Declaring income from Trendorra sales for tax purposes\n• Compliance with GST regulations if applicable\n• Filing income tax returns\n\nTrendorra provides payout statements in your dashboard for tax record-keeping purposes. Trendorra does not deduct TDS unless required by law.`,
      },
    ],
  },
};

// ── Legal Document Modal ──────────────────────────────────────────
function LegalModal({ open, docKey, onClose }) {
  if (!open || !docKey) return null;
  const doc = LEGAL_DOCS[docKey];
  if (!doc) return null;
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
    >
      <div style={{ backgroundColor: '#111', border: `1px solid ${BORDER}`, borderRadius: '14px', maxWidth: '680px', width: '100%', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, backgroundColor: '#0d0d0d' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '22px' }}>{doc.icon}</span>
            <div>
              <p style={{ color: GOLD, fontFamily: 'Cinzel, serif', fontSize: '14px', letterSpacing: '0.08em', margin: '0 0 2px' }}>{doc.title}</p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontFamily: 'inherit', margin: 0, letterSpacing: '0.05em' }}>TRENDORRA SELLER POLICIES</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px' }}>
            <FiX size={18} />
          </button>
        </div>
        {/* Content */}
        <div style={{ overflowY: 'auto', padding: '24px', flex: 1 }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontFamily: 'inherit', marginBottom: '24px', lineHeight: '1.6' }}>
            Last updated: March 2026 &nbsp;·&nbsp; Effective for all Trendorra sellers
          </p>
          {doc.sections.map((section, i) => (
            <div key={i} style={{ marginBottom: '28px' }}>
              <p style={{ color: GOLD, fontSize: '12px', fontWeight: '700', letterSpacing: '0.05em', margin: '0 0 10px', fontFamily: 'inherit' }}>{section.heading}</p>
              <div style={{ backgroundColor: '#0d0d0d', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '16px' }}>
                {section.content.split('\n').map((line, j) => (
                  <p key={j} style={{
                    color: line.startsWith('•') ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.75)',
                    fontSize: '13px', lineHeight: '1.8', margin: '0 0 4px',
                    fontFamily: 'inherit',
                    paddingLeft: line.startsWith('•') ? '8px' : '0',
                  }}>{line}</p>
                ))}
              </div>
            </div>
          ))}
          <div style={{ backgroundColor: `${GOLD}08`, border: `1px solid ${GOLD}25`, borderRadius: '8px', padding: '16px', marginTop: '8px' }}>
            <p style={{ color: GOLD, fontSize: '12px', fontWeight: '600', margin: '0 0 6px', fontFamily: 'inherit' }}>📌 Questions?</p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', lineHeight: '1.6', margin: 0, fontFamily: 'inherit' }}>
              For any questions about this policy, contact Trendorra Seller Support at <span style={{ color: GOLD }}>trendorashoppingsai@gmail.com</span>
            </p>
          </div>
        </div>
        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${BORDER}`, backgroundColor: '#0d0d0d', flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 22px', backgroundColor: GOLD, border: 'none', borderRadius: '6px', color: '#000', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Seller Footer ─────────────────────────────────────────────────
function SellerFooter({ onOpenLegal }) {
  return (
    <div style={{ borderTop: `1px solid ${BORDER}`, backgroundColor: '#050505', padding: '20px 28px', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: GOLD, fontFamily: 'Cinzel, serif', fontSize: '13px', letterSpacing: '0.2em' }}>TRENDORRA</span>
          <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '11px', fontFamily: 'inherit' }}>Seller Platform</span>
        </div>
        {/* Legal links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          {[
            { key: 'seller_agreement', label: 'Seller Agreement'   },
            { key: 'commission_policy', label: 'Commission Policy'  },
            { key: 'return_policy',     label: 'Return Policy'      },
            { key: 'payout_policy',     label: 'Payout Policy'      },
          ].map(({ key, label }, i, arr) => (
            <span key={key} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => onOpenLegal(key)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', padding: '2px 4px', transition: 'color 0.15s' }}
                onMouseOver={e => e.currentTarget.style.color = GOLD}
                onMouseOut={e  => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
              >
                {label}
              </button>
              {i < arr.length - 1 && <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: '10px' }}>·</span>}
            </span>
          ))}
        </div>
        {/* Copyright */}
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', fontFamily: 'inherit', margin: 0 }}>
          © {new Date().getFullYear()} Trendorra. All rights reserved.
        </p>
      </div>
    </div>
  );
}

// ── Danger Modal ─────────────────────────────────────────────────
function DangerModal({ open, onClose, onConfirm, loading, title, subtitle, lines }) {
  const [typed, setTyped] = useState('');
  useEffect(() => { if (!open) setTyped(''); }, [open]);
  if (!open) return null;
  const ready = typed === 'DELETE' && !loading;
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(248,113,113,0.4)', borderRadius: '14px', padding: '32px', maxWidth: '460px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.33)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FiAlertTriangle size={22} style={{ color: '#f87171' }} />
          </div>
          <div>
            <p style={{ color: '#f87171', fontFamily: 'Cinzel, serif', fontSize: '15px', letterSpacing: '0.1em', marginBottom: '3px' }}>{title}</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontFamily: 'inherit' }}>{subtitle}</p>
          </div>
        </div>
        <div style={{ backgroundColor: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '8px', padding: '16px', marginBottom: '22px' }}>
          {lines.map((line, i) => <p key={i} style={{ color: i === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.45)', fontSize: i === 0 ? '13px' : '12px', lineHeight: '1.75', marginTop: i > 0 ? '8px' : 0, fontFamily: 'inherit' }}>{line}</p>)}
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(248,113,113,0.2)', display: 'flex', gap: '8px' }}>
            <span>🚫</span>
            <p style={{ color: '#f87171', fontSize: '12px', fontWeight: '600', fontFamily: 'inherit', lineHeight: '1.5', margin: 0 }}>Once deleted, this data can NEVER be recovered.</p>
          </div>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', marginBottom: '8px', fontFamily: 'inherit' }}>Type <strong style={{ color: '#f87171' }}>DELETE</strong> to confirm</p>
          <input autoFocus type="text" value={typed} onChange={e => setTyped(e.target.value)} placeholder="Type DELETE here…"
            style={{ width: '100%', backgroundColor: '#0d0d0d', border: `1px solid ${typed === 'DELETE' ? '#f87171' : 'rgba(255,255,255,0.1)'}`, borderRadius: '6px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'rgba(255,255,255,0.45)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={() => ready && onConfirm()} disabled={!ready}
            style={{ flex: 1, padding: '11px', backgroundColor: ready ? '#f87171' : 'rgba(248,113,113,0.15)', border: `1px solid ${ready ? '#f87171' : 'rgba(248,113,113,0.25)'}`, borderRadius: '6px', color: ready ? '#fff' : 'rgba(248,113,113,0.4)', fontSize: '13px', fontWeight: '700', cursor: ready ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            {loading ? <><FiRefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Deleting…</> : <><FiTrash2 size={13} /> Delete Forever</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Profile Modal ────────────────────────────────────────────
function EditModal({ open, onClose, user, onSave }) {
  const [form, setForm] = useState({ name: '', phone: '', businessName: '', gstin: '', addressLine: '', city: '', state: '', pincode: '', bankName: '', accountName: '', bankAccount: '', ifsc: '', freeDelivery: false });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (open && user) {
      setForm({
        name: user.name || '', phone: user.phone || '',
        businessName: user.sellerInfo?.businessName || '', gstin: user.sellerInfo?.gstin || '',
        addressLine: user.sellerInfo?.address?.line || '', city: user.sellerInfo?.address?.city || '',
        state: user.sellerInfo?.address?.state || '', pincode: user.sellerInfo?.address?.pincode || '',
        bankName: user.sellerInfo?.bank?.bankName || '', accountName: user.sellerInfo?.bank?.name || '',
        bankAccount: user.sellerInfo?.bank?.account || '', ifsc: user.sellerInfo?.bank?.ifsc || '',
        freeDelivery: user.sellerInfo?.freeDelivery || false,
      });
    }
  }, [open, user]);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  if (!open) return null;
  const handleSave = async () => { setSaving(true); try { await onSave(form); onClose(); } finally { setSaving(false); } };
  const inp = { width: '100%', boxSizing: 'border-box', backgroundColor: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'inherit', marginBottom: '12px' };
  const lbl = { display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'inherit' };
  const sec = { color: GOLD, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '20px 0 12px', fontFamily: 'inherit', fontWeight: '600' };
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ backgroundColor: '#1a1a1a', border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '32px', maxWidth: '560px', width: '100%', maxHeight: '88vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ color: GOLD, fontFamily: 'Cinzel, serif', fontSize: '16px', letterSpacing: '0.1em', margin: 0 }}>Edit Profile</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><FiX size={18} /></button>
        </div>
        <p style={sec}>Account</p>
        <label style={lbl}>Full Name</label><input style={inp} value={form.name} onChange={e => set('name', e.target.value)} onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        <label style={lbl}>Phone</label><input style={inp} value={form.phone} onChange={e => set('phone', e.target.value)} onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        <p style={sec}>Business</p>
        <label style={lbl}>Business Name</label><input style={inp} value={form.businessName} onChange={e => set('businessName', e.target.value)} onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        <label style={lbl}>GSTIN</label><input style={inp} value={form.gstin} onChange={e => set('gstin', e.target.value)} onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        <p style={sec}>Pickup Address</p>
        <label style={lbl}>Street</label><input style={inp} value={form.addressLine} onChange={e => set('addressLine', e.target.value)} onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div><label style={lbl}>City</label><input style={inp} value={form.city} onChange={e => set('city', e.target.value)} onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} /></div>
          <div><label style={lbl}>Pincode</label><input style={inp} value={form.pincode} onChange={e => set('pincode', e.target.value)} onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} /></div>
        </div>
        <label style={lbl}>State</label><input style={inp} value={form.state} onChange={e => set('state', e.target.value)} onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        <p style={sec}>Bank</p>
        <label style={lbl}>Account Holder</label><input style={inp} value={form.accountName} onChange={e => set('accountName', e.target.value)} onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        <label style={lbl}>Bank Name</label><input style={inp} value={form.bankName} onChange={e => set('bankName', e.target.value)} onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        <label style={lbl}>Account Number</label><input style={inp} value={form.bankAccount} onChange={e => set('bankAccount', e.target.value)} onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        <label style={lbl}>IFSC</label><input style={inp} value={form.ifsc} onChange={e => set('ifsc', e.target.value.toUpperCase())} onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        <p style={sec}>Delivery</p>
        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '20px' }}>
          <div onClick={() => set('freeDelivery', !form.freeDelivery)}
            style={{ width: '18px', height: '18px', borderRadius: '4px', backgroundColor: form.freeDelivery ? GOLD : 'transparent', border: `2px solid ${form.freeDelivery ? GOLD : 'rgba(255,255,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            {form.freeDelivery && <FiCheck size={11} style={{ color: '#000' }} />}
          </div>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontFamily: 'inherit' }}>Offer <strong style={{ color: GOLD }}>Free Delivery</strong></span>
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', backgroundColor: 'transparent', border: `1px solid ${BORDER}`, borderRadius: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '11px', backgroundColor: saving ? `${GOLD}80` : GOLD, border: 'none', borderRadius: '6px', color: '#000', fontSize: '13px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {saving ? 'Saving…' : <><FiSave size={13} /> Save</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Commission Calculator ─────────────────────────────────────────
function CommissionCalc() {
  const [price, setPrice] = useState('1000');
  const p = Number(price) || 0;
  const { commission, fixed, total_deduction, earnings } = calcEarnings(p);
  return (
    <div style={{ backgroundColor: '#0d0d0d', border: `1px solid ${GOLD}30`, borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
      <p style={{ color: GOLD, fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '14px', fontFamily: 'inherit' }}>💰 Earnings Calculator</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontFamily: 'inherit', flexShrink: 0 }}>Price ₹</span>
        <input type="number" value={price} onChange={e => setPrice(e.target.value)}
          style={{ flex: 1, backgroundColor: '#1a1a1a', border: `1px solid ${GOLD}40`, borderRadius: '6px', padding: '8px 14px', color: '#fff', fontSize: '16px', fontWeight: '600', outline: 'none', fontFamily: 'inherit' }} />
      </div>
      {p > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { label: 'Selling Price',      value: `₹${p.toLocaleString()}`,                  color: '#fff'    },
            { label: 'Commission (10%)',    value: `- ₹${commission.toLocaleString()}`,        color: '#f87171' },
            { label: 'Fixed Fee',          value: `- ₹${fixed.toLocaleString()}`,             color: '#fbbf24' },
            { label: 'Total Deducted',     value: `- ₹${total_deduction.toLocaleString()}`,   color: '#fb923c' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ backgroundColor: '#1a1a1a', borderRadius: '8px', padding: '12px 14px' }}>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: '0 0 4px', fontFamily: 'inherit' }}>{label}</p>
              <p style={{ color, fontSize: '16px', fontWeight: '600', margin: 0, fontFamily: 'inherit' }}>{value}</p>
            </div>
          ))}
          <div style={{ gridColumn: '1 / -1', backgroundColor: `${GOLD}15`, border: `1px solid ${GOLD}40`, borderRadius: '8px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ color: GOLD, fontSize: '14px', margin: 0, fontFamily: 'inherit', fontWeight: '600' }}>🎉 You Receive</p>
            <p style={{ color: GOLD, fontSize: '24px', fontWeight: '700', margin: 0, fontFamily: 'inherit' }}>₹{earnings.toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────
export default function SellerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showResetOrders,  setShowResetOrders]  = useState(false);
  const [showResetRevenue, setShowResetRevenue] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [markingReady, setMarkingReady] = useState(null);
  const [legalDoc, setLegalDoc] = useState(null); // key of open legal doc

  useEffect(() => {
    if (!user || user.role !== 'seller') { navigate('/login'); return; }
    setCurrentUser(user);
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, orderRes] = await Promise.all([
        productAPI.getMine().catch(() => ({ products: [] })),
        orderAPI.getMyOrders().catch(() => ({ orders: [] })),
      ]);
      setProducts(prodRes.products || []);
      setOrders(orderRes.orders || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const u = currentUser || user;
  const validOrders     = orders.filter(o => o.orderStatus !== 'Cancelled');
  const grossRevenue    = validOrders.reduce((s, o) => s + (o.totalPrice || 0), 0);
  const netEarnings     = validOrders.reduce((s, o) => s + calcEarnings(o.totalPrice || 0).earnings, 0);
  const totalCommission = validOrders.reduce((s, o) => s + calcEarnings(o.totalPrice || 0).commission, 0);
  const totalFixed      = validOrders.reduce((s, o) => s + calcEarnings(o.totalPrice || 0).fixed, 0);

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try { await productAPI.delete(id); toast.success('Deleted'); loadData(); }
    catch { toast.error('Failed'); }
  };

  const handleSaveProfile = async (form) => {
    try {
      await authAPI.updateProfile({ name: form.name, phone: form.phone });
      await authAPI.updateSellerInfo({
        businessName: form.businessName, gstin: form.gstin, freeDelivery: form.freeDelivery,
        address: { line: form.addressLine, city: form.city, state: form.state, pincode: form.pincode },
        bank:    { name: form.accountName, bankName: form.bankName, account: form.bankAccount, ifsc: form.ifsc },
      });
      const res = await authAPI.getMe();
      setCurrentUser(res.user);
      toast.success('Profile updated!');
    } catch (e) { toast.error(e?.message || 'Update failed'); throw e; }
  };

  const handleMarkReady = async (orderId) => {
    setMarkingReady(orderId);
    try {
      const token = localStorage.getItem('trendora_token');
      const res = await axios.post(
        `/api/delivery/ready/${orderId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data.waybill
        ? `📦 Pickup scheduled! Tracking: ${res.data.waybill}`
        : '✅ Order marked as ready for pickup');
      loadData();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to schedule pickup');
    } finally { setMarkingReady(null); }
  };

  // ── ✅ FIXED: Reset Orders — permanently deletes from DB ─────────
  const handleResetOrders = async () => {
    setResetLoading(true);
    try {
      await orderAPI.deleteMyOrders();
      setOrders([]);
      setShowResetOrders(false);
      toast.success('All orders permanently deleted');
    } catch (e) {
      toast.error(e?.message || 'Failed to delete orders');
    } finally { setResetLoading(false); }
  };

  // ── ✅ FIXED: Reset Revenue — zeroes revenue locally ─────────────
  const handleResetRevenue = async () => {
    setResetLoading(true);
    try {
      setOrders(prev => prev.map(o => ({ ...o, totalPrice: 0, subtotal: 0 })));
      setShowResetRevenue(false);
      toast.success('Revenue reset to zero');
    } catch (e) {
      toast.error(e?.message || 'Failed to reset revenue');
    } finally { setResetLoading(false); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: BG, display: 'flex', flexDirection: 'column' }}>

      {/* Legal Modal */}
      <LegalModal open={!!legalDoc} docKey={legalDoc} onClose={() => setLegalDoc(null)} />

      {/* ── ✅ FIXED Modals ── */}
      <DangerModal
        open={showResetOrders}
        onClose={() => setShowResetOrders(false)}
        onConfirm={handleResetOrders}
        loading={resetLoading}
        title="Delete All Orders"
        subtitle="My Orders"
        lines={['⚠️ This will permanently delete ALL your orders from the database.', 'Orders will NOT come back after deletion.', 'This action cannot be undone.']}
      />
      <DangerModal
        open={showResetRevenue}
        onClose={() => setShowResetRevenue(false)}
        onConfirm={handleResetRevenue}
        loading={resetLoading}
        title="Reset Revenue"
        subtitle="Analytics"
        lines={['⚠️ This will reset all revenue figures to zero.', 'This cannot be undone.']}
      />
      <EditModal open={editOpen} onClose={() => setEditOpen(false)} user={u} onSave={handleSaveProfile} />

      {/* ── Top bar ── */}
      <div style={{ backgroundColor: '#050505', borderBottom: `1px solid ${BORDER}`, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: GOLD, fontFamily: 'Cinzel, serif', fontSize: '15px', letterSpacing: '0.2em' }}>TRENDORRA</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Seller Panel</span>
        </div>
        <Link to="/"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontFamily: 'inherit', textDecoration: 'none', padding: '6px 12px', border: `1px solid ${BORDER}`, borderRadius: '6px', transition: 'all 0.2s' }}
          onMouseOver={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
          onMouseOut={e  => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}>
          <FiArrowLeft size={13} /> Back to Trendorra
        </Link>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Sidebar */}
        <div style={{ width: '200px', flexShrink: 0, backgroundColor: '#0d0d0d', borderRight: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', position: 'sticky', top: '52px' }}>
          <div style={{ padding: '14px', borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: `${GOLD}25`, border: `1px solid ${GOLD}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: GOLD, fontSize: '14px', fontWeight: '700' }}>{u?.name?.charAt(0).toUpperCase()}</span>
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ color: '#fff', fontSize: '12px', fontWeight: '500', fontFamily: 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 0 2px' }}>{u?.name}</p>
                <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '20px', fontFamily: 'inherit',
                  color: u?.sellerInfo?.status === 'approved' ? '#4ade80' : '#fbbf24',
                  backgroundColor: u?.sellerInfo?.status === 'approved' ? 'rgba(74,222,128,0.1)' : 'rgba(251,191,36,0.1)' }}>
                  {(u?.sellerInfo?.status || 'PENDING').toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          <nav style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
            {NAV.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 10px', borderRadius: '6px', marginBottom: '3px', backgroundColor: activeTab === id ? `${GOLD}15` : 'transparent', border: `1px solid ${activeTab === id ? `${GOLD}30` : 'transparent'}`, color: activeTab === id ? GOLD : 'rgba(255,255,255,0.4)', fontSize: '12px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </nav>
          <div style={{ padding: '10px', borderTop: `1px solid ${BORDER}` }}>
            <button onClick={() => setEditOpen(true)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 10px', borderRadius: '6px', marginBottom: '4px', backgroundColor: `${GOLD}10`, border: `1px solid ${GOLD}25`, color: GOLD, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
              <FiEdit2 size={13} /> Edit Profile
            </button>
            <button onClick={handleLogout}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 10px', borderRadius: '6px', backgroundColor: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}
              onMouseOver={e => e.currentTarget.style.color = '#f87171'}
              onMouseOut={e  => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
              <FiLogOut size={13} /> Sign Out
            </button>
          </div>
        </div>

        {/* Main content area */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* Sticky header */}
          <div style={{ padding: '15px 28px', borderBottom: `1px solid ${BORDER}`, backgroundColor: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '2px', fontFamily: 'inherit' }}>
                {NAV.find(n => n.id === activeTab)?.label}
              </p>
              <h2 style={{ color: '#fff', fontFamily: 'Cinzel, serif', fontSize: '15px', letterSpacing: '0.08em', margin: 0 }}>
                {activeTab === 'overview'   ? `Welcome back, ${u?.name?.split(' ')[0]}` :
                 activeTab === 'products'   ? 'My Products' :
                 activeTab === 'orders'     ? 'My Orders' :
                 activeTab === 'tracking'   ? 'Delivery & Tracking' :
                 activeTab === 'analytics'  ? 'Analytics' :
                 activeTab === 'commission' ? 'Commission & Fees' : 'My Profile'}
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {(activeTab === 'orders' || activeTab === 'overview') && (
                <button onClick={() => setShowResetOrders(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', backgroundColor: 'transparent', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '5px', color: '#f87171', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <FiTrash2 size={11} /> Reset Orders
                </button>
              )}
              {(activeTab === 'analytics' || activeTab === 'overview') && (
                <button onClick={() => setShowResetRevenue(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', backgroundColor: 'transparent', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '5px', color: '#f87171', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <FiTrash2 size={11} /> Reset Revenue
                </button>
              )}
              {activeTab === 'products' && (
                <Link to="/seller/products/new"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: GOLD, border: 'none', borderRadius: '6px', padding: '8px 14px', color: '#000', fontSize: '12px', fontWeight: '700', textDecoration: 'none', fontFamily: 'inherit' }}>
                  <FiPlus size={13} /> Add Product
                </Link>
              )}
            </div>
          </div>

          <div style={{ padding: '24px 28px', flex: 1 }}>

            {/* ══ OVERVIEW ══ */}
            {activeTab === 'overview' && (
              <>
                {u?.sellerInfo?.status !== 'approved' && (
                  <div style={{ backgroundColor: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '10px', padding: '14px 18px', marginBottom: '22px', display: 'flex', gap: '12px' }}>
                    <FiAlertCircle size={18} style={{ color: '#fbbf24', flexShrink: 0, marginTop: '1px' }} />
                    <div>
                      <p style={{ color: '#fbbf24', fontSize: '13px', fontWeight: '600', margin: '0 0 4px', fontFamily: 'inherit' }}>Account Pending Approval</p>
                      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', lineHeight: '1.6', margin: 0, fontFamily: 'inherit' }}>Your seller account is under review. Products can be set up but sales go live once admin approves. Usually 24–48 hours.</p>
                    </div>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '22px' }}>
                  {[
                    { label: 'Net Earnings',  value: `₹${netEarnings.toLocaleString()}`, icon: FiDollarSign,  color: '#4ade80', sub: 'After all deductions' },
                    { label: 'Total Orders',  value: orders.length,                       icon: FiShoppingBag, color: '#60a5fa', sub: 'All time'             },
                    { label: 'My Products',   value: products.length,                     icon: FiPackage,     color: GOLD,      sub: 'Listed'               },
                    { label: 'Pending',       value: orders.filter(o => o.orderStatus === 'Processing').length, icon: FiAlertCircle, color: '#fbbf24', sub: 'Need action' },
                  ].map(({ label, value, icon: Icon, color, sub }) => (
                    <div key={label} style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '18px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}><Icon size={15} style={{ color }} /></div>
                      <p style={{ color: '#fff', fontSize: '22px', fontWeight: '700', fontFamily: 'inherit', margin: '0 0 2px' }}>{value}</p>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'inherit', margin: '0 0 1px' }}>{label}</p>
                      <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', fontFamily: 'inherit', margin: 0 }}>{sub}</p>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', backgroundColor: color, opacity: 0.4 }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '22px' }}>
                  {[
                    { label: 'Add New Product',  icon: FiPlus,        id: 'products',  color: GOLD      },
                    { label: 'View Orders',       icon: FiShoppingBag, id: 'orders',    color: '#60a5fa' },
                    { label: 'Delivery Tracking', icon: FiTruck,       id: 'tracking',  color: '#4ade80' },
                  ].map(({ label, icon: Icon, id, color }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.borderColor = color}
                      onMouseOut={e  => e.currentTarget.style.borderColor = BORDER}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '6px', backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={14} style={{ color }} /></div>
                        <span style={{ color: '#fff', fontSize: '13px', fontWeight: '500', fontFamily: 'inherit' }}>{label}</span>
                      </div>
                      <FiArrowRight size={14} style={{ color: 'rgba(255,255,255,0.2)' }} />
                    </button>
                  ))}
                </div>
                {/* Recent orders */}
                <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ padding: '13px 18px', borderBottom: `1px solid ${BORDER}`, backgroundColor: '#0d0d0d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'inherit', margin: 0 }}>Recent Orders</p>
                    <button onClick={() => setActiveTab('orders')} style={{ color: GOLD, fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>View All</button>
                  </div>
                  {orders.length === 0 ? (
                    <div style={{ padding: '36px', textAlign: 'center' }}>
                      <FiShoppingBag size={28} style={{ color: 'rgba(255,255,255,0.1)', display: 'block', margin: '0 auto 10px' }} />
                      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px', fontFamily: 'inherit' }}>No orders yet. Add products to start selling!</p>
                    </div>
                  ) : orders.slice(0, 5).map(order => {
                    const { earnings } = calcEarnings(order.totalPrice || 0);
                    const s = statusStyle(order.orderStatus);
                    return (
                      <div key={order._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: `1px solid ${BORDER}` }}>
                        <div>
                          <p style={{ color: '#fff', fontSize: '12px', fontWeight: '500', fontFamily: 'inherit', margin: '0 0 2px' }}>#{order._id.slice(-8).toUpperCase()}</p>
                          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontFamily: 'inherit', margin: 0 }}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ color: '#fff', fontSize: '12px', fontFamily: 'inherit', margin: '0 0 1px' }}>₹{order.totalPrice?.toLocaleString()}</p>
                            <p style={{ color: '#4ade80', fontSize: '11px', fontFamily: 'inherit', margin: 0 }}>You earn: ₹{earnings.toLocaleString()}</p>
                          </div>
                          <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '20px', color: s.color, backgroundColor: s.bg, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>{order.orderStatus}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ══ PRODUCTS ══ */}
            {activeTab === 'products' && (
              <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
                {loading ? (
                  <div style={{ padding: '48px', textAlign: 'center' }}><p style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'inherit' }}>Loading…</p></div>
                ) : products.length === 0 ? (
                  <div style={{ padding: '48px', textAlign: 'center' }}>
                    <FiPackage size={36} style={{ color: 'rgba(255,255,255,0.1)', display: 'block', margin: '0 auto 14px' }} />
                    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '14px', marginBottom: '18px', fontFamily: 'inherit' }}>No products yet.</p>
                    <Link to="/seller/products/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', backgroundColor: GOLD, padding: '10px 22px', borderRadius: '6px', color: '#000', fontSize: '13px', fontWeight: '700', textDecoration: 'none', fontFamily: 'inherit' }}>
                      <FiPlus size={14} /> Add First Product
                    </Link>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>
                      {['Product', 'Category', 'Price', 'Commission', 'Fixed Fee', 'You Earn', 'Stock', 'Actions'].map(h => (
                        <th key={h} style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 14px', textAlign: 'left', borderBottom: `1px solid ${BORDER}`, backgroundColor: '#0d0d0d', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {products.map(p => {
                        const { commission, fixed, earnings } = calcEarnings(p.price || 0);
                        const imgSrc = p.images?.[0]?.url || p.images?.[0] || p.image;
                        return (
                          <tr key={p._id}>
                            <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}` }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img src={imgSrc} alt="" style={{ width: '36px', height: '44px', objectFit: 'cover', borderRadius: '4px', backgroundColor: '#0d0d0d', flexShrink: 0 }} />
                                <p style={{ color: '#fff', fontSize: '12px', fontWeight: '500', fontFamily: 'inherit', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{p.name}</p>
                              </div>
                            </td>
                            <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}` }}><span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', fontFamily: 'inherit' }}>{p.category}</span></td>
                            <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}` }}><span style={{ color: '#fff', fontSize: '13px', fontWeight: '500', fontFamily: 'inherit' }}>₹{p.price?.toLocaleString()}</span></td>
                            <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}` }}><span style={{ color: '#f87171', fontSize: '12px', fontFamily: 'inherit' }}>-₹{commission}</span></td>
                            <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}` }}><span style={{ color: '#fbbf24', fontSize: '12px', fontFamily: 'inherit' }}>-₹{fixed}</span></td>
                            <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}` }}><span style={{ color: '#4ade80', fontSize: '13px', fontWeight: '700', fontFamily: 'inherit' }}>₹{earnings}</span></td>
                            <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}` }}><span style={{ color: p.stock > 0 ? '#4ade80' : '#f87171', fontSize: '11px', fontFamily: 'inherit' }}>{p.stock > 0 ? p.stock : 'Out'}</span></td>
                            <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}` }}>
                              <div style={{ display: 'flex', gap: '10px' }}>
                                <Link to={`/seller/products/${p._id}/edit`} style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', textDecoration: 'none', fontFamily: 'inherit' }}><FiEdit2 size={11} /> Edit</Link>
                                <button onClick={() => handleDeleteProduct(p._id)} style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}><FiTrash2 size={11} /> Del</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* ══ ORDERS ══ */}
            {activeTab === 'orders' && (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                  {ORDER_STATUSES.map(status => {
                    const count = orders.filter(o => o.orderStatus === status).length;
                    const s = statusStyle(status);
                    return (
                      <div key={status} style={{ padding: '6px 14px', borderRadius: '20px', backgroundColor: s.bg, border: `1px solid ${s.color}30` }}>
                        <span style={{ color: s.color, fontSize: '12px', fontFamily: 'inherit', fontWeight: '500' }}>{status}: <strong>{count}</strong></span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
                  {orders.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center' }}>
                      <FiShoppingBag size={36} style={{ color: 'rgba(255,255,255,0.1)', display: 'block', margin: '0 auto 12px' }} />
                      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '14px', fontFamily: 'inherit' }}>No orders yet.</p>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr>
                        {['Order ID', 'Date', 'Sale Price', '-Commission', '-Fixed', 'You Earn', 'Tracking', 'Status', 'Action'].map(h => (
                          <th key={h} style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 14px', textAlign: 'left', borderBottom: `1px solid ${BORDER}`, backgroundColor: '#0d0d0d', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {orders.map(order => {
                          const { commission, fixed, earnings } = calcEarnings(order.totalPrice || 0);
                          const s = statusStyle(order.orderStatus);
                          const canMarkReady = order.orderStatus === 'Processing';
                          return (
                            <tr key={order._id}>
                              <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}` }}><span style={{ color: GOLD, fontSize: '12px', fontFamily: 'inherit' }}>#{order._id.slice(-8).toUpperCase()}</span></td>
                              <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}` }}><span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontFamily: 'inherit' }}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span></td>
                              <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}` }}><span style={{ color: '#fff', fontSize: '13px', fontWeight: '500', fontFamily: 'inherit' }}>₹{order.totalPrice?.toLocaleString()}</span></td>
                              <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}` }}><span style={{ color: '#f87171', fontSize: '12px', fontFamily: 'inherit' }}>-₹{commission}</span></td>
                              <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}` }}><span style={{ color: '#fbbf24', fontSize: '12px', fontFamily: 'inherit' }}>-₹{fixed}</span></td>
                              <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}` }}><span style={{ color: '#4ade80', fontSize: '13px', fontWeight: '700', fontFamily: 'inherit' }}>₹{earnings}</span></td>
                              <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}` }}>
                                {order.trackingId
                                  ? <span style={{ color: '#60a5fa', fontSize: '11px', fontFamily: 'inherit' }}>{order.trackingId}</span>
                                  : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', fontFamily: 'inherit' }}>—</span>}
                              </td>
                              <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}` }}><span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '20px', color: s.color, backgroundColor: s.bg, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>{order.orderStatus}</span></td>
                              <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}` }}>
                                {canMarkReady && (
                                  <button onClick={() => handleMarkReady(order._id)} disabled={markingReady === order._id}
                                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', backgroundColor: `${GOLD}18`, border: `1px solid ${GOLD}35`, borderRadius: '5px', color: GOLD, fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                                    {markingReady === order._id ? <FiRefreshCw size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <FiTruck size={10} />}
                                    {markingReady === order._id ? 'Scheduling…' : 'Ready for Pickup'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}

            {/* ══ DELIVERY & TRACKING ══ */}
            {activeTab === 'tracking' && (
              <div style={{ maxWidth: '700px' }}>
                {/* Active shipments */}
                <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
                  <div style={{ padding: '13px 18px', borderBottom: `1px solid ${BORDER}`, backgroundColor: '#0d0d0d' }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'inherit', margin: 0 }}>Active Shipments</p>
                  </div>
                  {orders.filter(o => o.trackingId && !['Delivered', 'Cancelled'].includes(o.orderStatus)).length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center' }}>
                      <FiTruck size={28} style={{ color: 'rgba(255,255,255,0.1)', display: 'block', margin: '0 auto 10px' }} />
                      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px', fontFamily: 'inherit' }}>No active shipments. Mark orders as "Ready for Pickup" to start shipping.</p>
                    </div>
                  ) : orders.filter(o => o.trackingId && !['Delivered', 'Cancelled'].includes(o.orderStatus)).map(order => {
                    const s = statusStyle(order.orderStatus);
                    return (
                      <div key={order._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid ${BORDER}` }}>
                        <div>
                          <p style={{ color: '#fff', fontSize: '13px', fontWeight: '500', fontFamily: 'inherit', margin: '0 0 3px' }}>#{order._id.slice(-8).toUpperCase()}</p>
                          <p style={{ color: '#60a5fa', fontSize: '11px', fontFamily: 'inherit', margin: 0 }}>Tracking: {order.trackingId}</p>
                        </div>
                        <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', color: s.color, backgroundColor: s.bg, fontFamily: 'inherit' }}>{order.orderStatus}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Delivery zone reference */}
                <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
                  <div style={{ padding: '13px 18px', borderBottom: `1px solid ${BORDER}`, backgroundColor: '#0d0d0d' }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'inherit', margin: 0 }}>Delivery Zone Charges</p>
                  </div>
                  <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px' }}>
                    {DELIVERY_ZONES.map(({ zone, label, charge, icon, days }) => (
                      <div key={zone} style={{ backgroundColor: '#0d0d0d', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '18px' }}>{icon}</span>
                          <div>
                            <p style={{ color: GOLD, fontSize: '11px', fontWeight: '600', margin: 0, fontFamily: 'inherit' }}>{zone} — {label}</p>
                          </div>
                        </div>
                        <p style={{ color: '#4ade80', fontSize: '20px', fontWeight: '700', margin: '0 0 2px', fontFamily: 'inherit' }}>₹{charge}</p>
                        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', margin: 0, fontFamily: 'inherit' }}>{days}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order tracking flow */}
                <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '20px' }}>
                  <p style={{ color: GOLD, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 14px', fontFamily: 'inherit' }}>📦 Automatic Delhivery Integration</p>
                  <div style={{ backgroundColor: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
                    <p style={{ color: '#4ade80', fontSize: '12px', fontWeight: '600', margin: '0 0 8px', fontFamily: 'inherit' }}>✅ Automatic Status Updates</p>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', lineHeight: '1.7', margin: 0, fontFamily: 'inherit' }}>
                      When you click "Ready for Pickup" → Delhivery is automatically notified → They pickup from your address → As they update status (Picked Up, In Transit, Delivered) → Your dashboard updates automatically via webhook.
                    </p>
                  </div>
                  {[
                    { step: '1', status: 'Processing',      desc: 'New order — pack your product & click "Ready for Pickup"', color: '#fbbf24' },
                    { step: '2', status: 'Confirmed',        desc: 'Delhivery pickup scheduled automatically',                color: '#60a5fa' },
                    { step: '3', status: 'Shipped',          desc: 'Delhivery picked up from your address',                  color: '#a78bfa' },
                    { step: '4', status: 'Out for Delivery', desc: 'Package on its way to the customer',                     color: '#fb923c' },
                    { step: '5', status: 'Delivered',        desc: 'Delivered! Payout becomes available in admin panel',     color: '#4ade80' },
                    { step: '6', status: 'Cancelled',        desc: 'Order cancelled — stock restored automatically',         color: '#f87171' },
                  ].map(({ step, status, desc, color }) => (
                    <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '12px 0', borderBottom: `1px solid ${BORDER}` }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: `${color}20`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ color, fontSize: '11px', fontWeight: '700', fontFamily: 'inherit' }}>{step}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', color, backgroundColor: `${color}15`, fontFamily: 'inherit', display: 'inline-block', marginBottom: '3px' }}>{status}</span>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: 0, fontFamily: 'inherit' }}>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ ANALYTICS ══ */}
            {activeTab === 'analytics' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '20px' }}>
                  {[
                    { label: 'Gross Revenue',   value: `₹${grossRevenue.toLocaleString()}`,    color: '#fff',    icon: FiDollarSign  },
                    { label: 'Net Earnings',     value: `₹${netEarnings.toLocaleString()}`,     color: '#4ade80', icon: FiTrendingUp  },
                    { label: 'Total Orders',     value: orders.length,                          color: '#60a5fa', icon: FiShoppingBag },
                    { label: 'Delivered',        value: orders.filter(o => o.orderStatus === 'Delivered').length, color: '#4ade80', icon: FiCheck },
                    { label: 'Commission Paid',  value: `₹${totalCommission.toLocaleString()}`, color: '#f87171', icon: FiPercent     },
                    { label: 'Fixed Fees Paid',  value: `₹${totalFixed.toLocaleString()}`,      color: '#fbbf24', icon: FiAlertCircle },
                  ].map(({ label, value, color, icon: Icon }) => (
                    <div key={label} style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={16} style={{ color }} />
                      </div>
                      <div>
                        <p style={{ color: '#fff', fontSize: '20px', fontWeight: '700', fontFamily: 'inherit', margin: '0 0 3px' }}>{value}</p>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'inherit', margin: 0 }}>{label}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '20px' }}>
                  <p style={{ color: GOLD, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 16px', fontFamily: 'inherit' }}>Revenue Breakdown</p>
                  {[
                    { label: 'Gross Revenue (Total Sales)', value: `₹${grossRevenue.toLocaleString()}`,    color: '#fff'    },
                    { label: '– Commission (10%)',           value: `₹${totalCommission.toLocaleString()}`, color: '#f87171' },
                    { label: '– Fixed Platform Fees',        value: `₹${totalFixed.toLocaleString()}`,      color: '#fbbf24' },
                    { label: '= Your Net Earnings',          value: `₹${netEarnings.toLocaleString()}`,     color: '#4ade80' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${BORDER}` }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontFamily: 'inherit' }}>{label}</span>
                      <span style={{ color, fontSize: '14px', fontWeight: color === '#4ade80' ? '700' : '500', fontFamily: 'inherit' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ══ COMMISSION ══ */}
            {activeTab === 'commission' && (
              <div style={{ maxWidth: '700px' }}>
                <CommissionCalc />
                <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
                  <div style={{ padding: '13px 18px', borderBottom: `1px solid ${BORDER}`, backgroundColor: '#0d0d0d' }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'inherit', margin: 0 }}>Fixed Fee Per Order + Example Earnings</p>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>
                      {['Price Range', 'Fixed Fee', 'Commission (10%)', 'Total Deducted', 'You Receive'].map(h => (
                        <th key={h} style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '11px 14px', textAlign: 'left', borderBottom: `1px solid ${BORDER}`, backgroundColor: '#0d0d0d' }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {[{ range: '≤ ₹500', price: 500 }, { range: '≤ ₹1,000', price: 1000 }, { range: '≤ ₹5,000', price: 5000 }, { range: '≤ ₹10,000', price: 10000 }, { range: '≤ ₹50,000', price: 50000 }, { range: '≤ ₹1,00,000', price: 100000 }, { range: '> ₹1,00,000', price: 150000 }].map(({ range, price }) => {
                        const { commission, fixed, total_deduction, earnings } = calcEarnings(price);
                        return (
                          <tr key={range}>
                            <td style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, color: '#fff', fontSize: '12px', fontFamily: 'inherit' }}>{range}</td>
                            <td style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, color: '#fbbf24', fontSize: '12px', fontFamily: 'inherit' }}>₹{fixed}</td>
                            <td style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, color: '#f87171', fontSize: '12px', fontFamily: 'inherit' }}>₹{commission.toLocaleString()}</td>
                            <td style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, color: '#fb923c', fontSize: '12px', fontFamily: 'inherit' }}>₹{total_deduction.toLocaleString()}</td>
                            <td style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, color: '#4ade80', fontSize: '13px', fontWeight: '700', fontFamily: 'inherit' }}>₹{earnings.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══ PROFILE ══ */}
            {activeTab === 'profile' && (
              <div style={{ maxWidth: '580px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
                  <button onClick={() => setEditOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '7px', backgroundColor: GOLD, border: 'none', borderRadius: '6px', padding: '9px 16px', color: '#000', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <FiEdit2 size={13} /> Edit Profile
                  </button>
                </div>
                {[
                  { title: 'Account', rows: [{ label: 'Name', value: u?.name }, { label: 'Email', value: u?.email }, { label: 'Phone', value: u?.phone || '—' }, { label: 'Status', value: u?.sellerInfo?.status || 'pending', highlight: true }] },
                  { title: 'Business', rows: [{ label: 'Business Name', value: u?.sellerInfo?.businessName || '—', highlight: true }, { label: 'Type', value: u?.sellerInfo?.businessType || '—' }, { label: 'Category', value: u?.sellerInfo?.category || '—' }, { label: 'GSTIN', value: u?.sellerInfo?.gstin || 'Not provided' }, { label: 'Free Delivery', value: u?.sellerInfo?.freeDelivery ? 'Yes' : 'No' }] },
                  { title: 'Pickup Address', rows: [{ label: 'Street', value: u?.sellerInfo?.address?.line || '—' }, { label: 'City', value: u?.sellerInfo?.address?.city || '—' }, { label: 'State', value: u?.sellerInfo?.address?.state || '—' }, { label: 'Pincode', value: u?.sellerInfo?.address?.pincode || '—' }] },
                  { title: 'Bank Account', rows: [{ label: 'Account Holder', value: u?.sellerInfo?.bank?.name || '—' }, { label: 'Bank', value: u?.sellerInfo?.bank?.bankName || '—' }, { label: 'Account No.', value: u?.sellerInfo?.bank?.account ? `****${u.sellerInfo.bank.account.slice(-4)}` : '—' }, { label: 'IFSC', value: u?.sellerInfo?.bank?.ifsc || '—', highlight: true }] },
                ].map(({ title, rows }) => (
                  <div key={title} style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '20px', marginBottom: '12px' }}>
                    <p style={{ color: GOLD, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 12px', fontFamily: 'inherit' }}>{title}</p>
                    {rows.map(({ label, value, highlight }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${BORDER}` }}>
                        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', fontFamily: 'inherit' }}>{label}</span>
                        <span style={{ color: highlight ? GOLD : '#fff', fontSize: '13px', fontFamily: 'inherit', fontWeight: highlight ? '600' : '400', textAlign: 'right' }}>{value}</span>
                      </div>
                    ))}
                  </div>
                ))}
                {u?.sellerInfo?.payoutHistory?.length > 0 && (
                  <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '20px' }}>
                    <p style={{ color: GOLD, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 12px', fontFamily: 'inherit' }}>Payout History</p>
                    {u.sellerInfo.payoutHistory.map((p, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${BORDER}` }}>
                        <div>
                          <p style={{ color: '#4ade80', fontSize: '15px', fontWeight: '600', margin: '0 0 2px', fontFamily: 'inherit' }}>₹{Number(p.amount).toLocaleString()}</p>
                          {p.note && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0, fontFamily: 'inherit' }}>{p.note}</p>}
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', fontFamily: 'inherit', margin: 0 }}>{new Date(p.processedAt).toLocaleDateString('en-IN')}</p>
                      </div>
                    ))}
                    <div style={{ marginTop: '12px', padding: '12px 14px', backgroundColor: `${GOLD}08`, border: `1px solid ${GOLD}20`, borderRadius: '8px' }}>
                      <p style={{ color: GOLD, fontSize: '13px', fontWeight: '600', margin: 0, fontFamily: 'inherit' }}>Total Received: ₹{(u.sellerInfo.totalPaidOut || 0).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* ── Seller Footer with Legal Links ── */}
          <SellerFooter onOpenLegal={setLegalDoc} />

        </div>
      </div>
    </div>
  );
}