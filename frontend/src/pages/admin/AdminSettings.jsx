import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { settingsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiSave, FiRefreshCw, FiPercent,
  FiDollarSign, FiInfo, FiShield, FiTrendingUp, FiLayers,
} from 'react-icons/fi';

const BG     = '#080808';
const CARD   = '#111111';
const CARD2  = '#161616';
const BORDER = 'rgba(255,255,255,0.07)';
const GOLD   = '#C9A84C';

const DEFAULT_SLABS = [
  { upTo: 500,    label: 'Up to ₹500',        fee: 0 },
  { upTo: 1000,   label: '₹501 – ₹1,000',     fee: 0 },
  { upTo: 5000,   label: '₹1,001 – ₹5,000',   fee: 0 },
  { upTo: 10000,  label: '₹5,001 – ₹10,000',  fee: 0 },
  { upTo: 20000,  label: '₹10,001 – ₹20,000', fee: 0 },
  { upTo: null,   label: 'Above ₹20,000',      fee: 0 },
];

// Pick fee for a given price from the sorted slab list
const getFeeForPrice = (price, slabs) => {
  if (!slabs || slabs.length === 0) return 0;
  const sorted = [...slabs].sort((a, b) => {
    if (a.upTo === null) return 1;
    if (b.upTo === null) return -1;
    return a.upTo - b.upTo;
  });
  for (const s of sorted) {
    if (s.upTo === null || price <= s.upTo) return Number(s.fee) || 0;
  }
  return 0;
};

// ── Live earnings preview ─────────────────────────────────────────
function EarningsPreview({ rate, slabs }) {
  const examples = [300, 800, 2000, 7000, 15000, 25000];
  return (
    <div style={{ backgroundColor: CARD2, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${BORDER}`, backgroundColor: '#0a0a0a', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FiTrendingUp size={13} style={{ color: GOLD }} />
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
          Live Earnings Preview — ₹60 delivery example
        </p>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
          <thead>
            <tr>
              {['Sale Price', '−Delivery', 'Product Val', `−Commission ${rate}%`, '−Fixed Fee (Slab)', 'Seller Earns'].map(h => (
                <th key={h} style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 14px', textAlign: 'left', borderBottom: `1px solid ${BORDER}`, backgroundColor: '#0a0a0a', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {examples.map(price => {
              const dc         = 60;
              const productVal = price - dc;
              const comm       = Math.round(productVal * (rate / 100));
              const fixed      = getFeeForPrice(price, slabs);
              const earn       = Math.max(0, productVal - comm - fixed);
              const slab       = [...(slabs || [])].sort((a, b) => a.upTo === null ? 1 : b.upTo === null ? -1 : a.upTo - b.upTo).find(s => s.upTo === null || price <= s.upTo);
              return (
                <tr key={price}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                  onMouseOut={e  => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}` }}>
                    <span style={{ color: '#fff', fontSize: '13px', fontWeight: '600' }}>₹{price.toLocaleString()}</span>
                  </td>
                  <td style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}` }}>
                    <span style={{ color: '#60a5fa', fontSize: '12px' }}>−₹{dc}</span>
                  </td>
                  <td style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}` }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>₹{productVal.toLocaleString()}</span>
                  </td>
                  <td style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}` }}>
                    <span style={{ color: rate > 0 ? '#f87171' : 'rgba(255,255,255,0.25)', fontSize: '12px' }}>
                      {rate > 0 ? `−₹${comm}` : '₹0'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}` }}>
                    <div>
                      <span style={{ color: fixed > 0 ? '#fbbf24' : 'rgba(255,255,255,0.25)', fontSize: '12px' }}>
                        {fixed > 0 ? `−₹${fixed}` : '₹0'}
                      </span>
                      {slab && (
                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', marginLeft: '6px' }}>
                          ({slab.label})
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}` }}>
                    <span style={{ color: '#4ade80', fontSize: '13px', fontWeight: '700' }}>₹{earn.toLocaleString()}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Slab Editor ───────────────────────────────────────────────────
function SlabEditor({ slabs, onChange }) {
  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '14px', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, backgroundColor: '#0a0a0a', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '10px', backgroundColor: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FiLayers size={15} style={{ color: '#fbbf24' }} />
        </div>
        <div>
          <p style={{ color: '#fff', fontSize: '14px', fontWeight: '600', margin: '0 0 1px' }}>Fixed Fee Slabs</p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0 }}>Set a different flat fee per price tier</p>
        </div>
      </div>

      <div style={{ padding: '6px 0' }}>
        {slabs.map((slab, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 20px',
            backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)',
            borderBottom: i < slabs.length - 1 ? `1px solid ${BORDER}` : 'none',
          }}>
            {/* Slab label */}
            <div style={{ flex: 1 }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>{slab.label}</span>
              {slab.upTo === null && (
                <span style={{ marginLeft: '8px', fontSize: '10px', padding: '1px 7px', borderRadius: '20px', backgroundColor: `${GOLD}15`, color: GOLD }}>No limit</span>
              )}
            </div>

            {/* Fee input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => { const v = Math.max(0, (Number(slab.fee) || 0) - 5); onChange(i, v); }}
                style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>−</button>
              <div style={{ position: 'relative', width: '110px' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#fbbf24', fontSize: '13px', fontWeight: '600', pointerEvents: 'none' }}>₹</span>
                <input
                  type="number" min="0" step="5"
                  value={slab.fee}
                  onChange={e => onChange(i, Math.max(0, Number(e.target.value) || 0))}
                  onFocus={e => e.target.style.borderColor = '#fbbf24'}
                  onBlur={e  => e.target.style.borderColor = BORDER}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0a0a0a', border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '7px 10px 7px 26px', color: '#fff', fontSize: '14px', fontWeight: '600', outline: 'none' }}
                />
              </div>
              <button
                onClick={() => onChange(i, (Number(slab.fee) || 0) + 5)}
                style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>+</button>

              {/* Zero pill */}
              {Number(slab.fee) === 0 && (
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', backgroundColor: 'rgba(74,222,128,0.08)', color: '#4ade80', whiteSpace: 'nowrap' }}>Free</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function AdminSettings() {
  const [settings,  setSettings]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);

  const [commRate, setCommRate] = useState('0');
  const [slabs,    setSlabs]    = useState(DEFAULT_SLABS);

  // Saved-to-DB copies for hasChanges check
  const [savedRate,  setSavedRate]  = useState(0);
  const [savedSlabs, setSavedSlabs] = useState(DEFAULT_SLABS);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await settingsAPI.get();
      const s   = res.settings;
      setSettings(s);
      const rate  = s.commissionRate ?? 0;
      const slabsData = s.fixedSlabs?.length ? s.fixedSlabs : DEFAULT_SLABS;
      setCommRate(String(rate));
      setSlabs(slabsData);
      setSavedRate(rate);
      setSavedSlabs(slabsData);
    } catch (e) { console.error(e); toast.error('Failed to load settings'); }
    finally { setLoading(false); }
  };

  const handleSlabChange = (index, newFee) => {
    setSlabs(prev => prev.map((s, i) => i === index ? { ...s, fee: newFee } : s));
  };

  const handleSave = async () => {
    const rate = parseFloat(commRate) || 0;
    if (rate < 0 || rate > 100) { toast.error('Commission must be 0–100%'); return; }
    setSaving(true);
    try {
      const res = await settingsAPI.update({
        commissionRate: rate,
        fixedSlabs: slabs.map(s => ({ ...s, fee: Number(s.fee) || 0 })),
      });
      setSettings(res.settings);
      setSavedRate(rate);
      setSavedSlabs(slabs);
      toast.success('✅ Settings saved! New orders will use these rates.');
    } catch (e) { toast.error(e?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const hasChanges = parseFloat(commRate) !== savedRate ||
    JSON.stringify(slabs) !== JSON.stringify(savedSlabs);

  const allSlabsFree = slabs.every(s => Number(s.fee) === 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: BG }}>

      {/* Header */}
      <div style={{ backgroundColor: '#050505', borderBottom: `1px solid ${BORDER}`, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 4px' }}>Admin Panel</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ color: GOLD, fontFamily: 'Cinzel, serif', fontSize: '18px', letterSpacing: '0.15em', margin: 0 }}>Platform Settings</h1>
            {!loading && settings && (
              <span style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '20px',
                color: (parseFloat(commRate) === 0 && allSlabsFree) ? '#4ade80' : GOLD,
                backgroundColor: (parseFloat(commRate) === 0 && allSlabsFree) ? 'rgba(74,222,128,0.1)' : `${GOLD}15` }}>
                {(parseFloat(commRate) === 0 && allSlabsFree) ? '🟢 Free for Sellers' : `${commRate}% commission + tiered fees`}
              </span>
            )}
          </div>
        </div>
        <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.35)', fontSize: '12px', textDecoration: 'none' }}>
          <FiArrowLeft size={13} /> Dashboard
        </Link>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 24px' }}>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[...Array(2)].map((_, i) => <div key={i} style={{ height: '180px', backgroundColor: CARD, borderRadius: '14px', opacity: 0.4 }} />)}
          </div>
        ) : (
          <>
            {/* Startup notice */}
            <div style={{ backgroundColor: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '14px' }}>
              <FiShield size={18} style={{ color: '#4ade80', flexShrink: 0, marginTop: '1px' }} />
              <div>
                <p style={{ color: '#4ade80', fontSize: '13px', fontWeight: '600', margin: '0 0 4px' }}>Startup Mode — Zero Charges by Default</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', lineHeight: '1.7', margin: 0 }}>
                  Commission and all slab fees are <strong style={{ color: '#fff' }}>₹0</strong> by default.
                  Set tiered fees per price slab below — changes apply to <strong style={{ color: '#fff' }}>new orders only</strong>.
                </p>
              </div>
            </div>

            {/* Commission Rate */}
            <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '24px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiPercent size={16} style={{ color: '#f87171' }} />
                </div>
                <div>
                  <p style={{ color: '#fff', fontSize: '14px', fontWeight: '600', margin: '0 0 2px' }}>Commission Rate</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0 }}>% of product value per order (applied on top of slab fees)</p>
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <input type="range" min="0" max="30" step="0.5"
                  value={commRate}
                  onChange={e => setCommRate(e.target.value)}
                  style={{ width: '100%', accentColor: '#f87171', cursor: 'pointer', height: '4px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px' }}>0%</span>
                  <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px' }}>30%</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button onClick={() => setCommRate(String(Math.max(0, parseFloat(commRate) - 0.5)))}
                  style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input type="number" min="0" max="100" step="0.5" value={commRate}
                    onChange={e => setCommRate(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0a0a0a', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '10px 40px 10px 14px', color: '#fff', fontSize: '20px', fontWeight: '700', outline: 'none', textAlign: 'center' }}
                    onFocus={e => e.target.style.borderColor = '#f87171'}
                    onBlur={e  => e.target.style.borderColor = BORDER} />
                  <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#f87171', fontSize: '14px', fontWeight: '600' }}>%</span>
                </div>
                <button onClick={() => setCommRate(String(Math.min(100, parseFloat(commRate) + 0.5)))}
                  style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>
              {parseFloat(commRate) === 0 && (
                <div style={{ marginTop: '12px', padding: '8px 12px', backgroundColor: 'rgba(74,222,128,0.06)', borderRadius: '6px', border: '1px solid rgba(74,222,128,0.15)' }}>
                  <p style={{ color: '#4ade80', fontSize: '11px', margin: 0 }}>✅ No commission — sellers keep 100% of product value (minus slab fee)</p>
                </div>
              )}
            </div>

            {/* Slab Editor */}
            <div style={{ marginBottom: '16px' }}>
              <SlabEditor slabs={slabs} onChange={handleSlabChange} />
            </div>

            {/* Summary + Save */}
            <div style={{ backgroundColor: CARD, border: `1px solid ${hasChanges ? `${GOLD}40` : BORDER}`, borderRadius: '14px', padding: '20px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 3px' }}>Commission</p>
                  <p style={{ color: parseFloat(commRate) > 0 ? '#f87171' : '#4ade80', fontSize: '22px', fontWeight: '700', margin: 0 }}>{commRate}%</p>
                </div>
                <div style={{ width: '1px', backgroundColor: BORDER, height: '36px' }} />
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 3px' }}>Fixed Slabs</p>
                  <p style={{ color: allSlabsFree ? '#4ade80' : '#fbbf24', fontSize: '13px', fontWeight: '600', margin: 0 }}>
                    {allSlabsFree ? 'All Free' : `₹${Math.min(...slabs.map(s => s.fee))} – ₹${Math.max(...slabs.map(s => s.fee))}`}
                  </p>
                </div>
                <div style={{ width: '1px', backgroundColor: BORDER, height: '36px' }} />
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 3px' }}>Status</p>
                  <p style={{ color: hasChanges ? GOLD : 'rgba(255,255,255,0.3)', fontSize: '13px', fontWeight: '600', margin: 0 }}>
                    {hasChanges ? '⚠️ Unsaved Changes' : '✅ Up to date'}
                  </p>
                </div>
                {settings?.updatedAt && (
                  <>
                    <div style={{ width: '1px', backgroundColor: BORDER, height: '36px' }} />
                    <div>
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 3px' }}>Last Updated</p>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: 0 }}>
                        {new Date(settings.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={fetchSettings}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '10px 16px', backgroundColor: 'transparent', border: `1px solid ${BORDER}`, borderRadius: '8px', color: 'rgba(255,255,255,0.35)', fontSize: '12px', cursor: 'pointer' }}>
                  <FiRefreshCw size={12} /> Reset
                </button>
                <button onClick={handleSave} disabled={saving || !hasChanges}
                  style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 22px', backgroundColor: hasChanges ? GOLD : `${GOLD}30`, border: 'none', borderRadius: '8px', color: hasChanges ? '#000' : `${GOLD}60`, fontSize: '13px', fontWeight: '700', cursor: hasChanges ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
                  {saving ? <><FiRefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : <><FiSave size={13} /> Save Settings</>}
                </button>
              </div>
            </div>

            {/* Live preview */}
            <EarningsPreview rate={parseFloat(commRate) || 0} slabs={slabs} />

            {/* Info */}
            <div style={{ backgroundColor: 'rgba(96,165,250,0.04)', border: '1px solid rgba(96,165,250,0.14)', borderRadius: '12px', padding: '16px 20px', marginTop: '16px', display: 'flex', gap: '12px' }}>
              <FiInfo size={15} style={{ color: '#60a5fa', flexShrink: 0, marginTop: '1px' }} />
              <div>
                <p style={{ color: '#60a5fa', fontSize: '12px', fontWeight: '600', margin: '0 0 6px' }}>How tiered fees work</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {[
                    'Each price slab has its own fixed fee — higher value orders pay more.',
                    'The slab is determined by the Sale Price (before delivery deduction).',
                    'Formula: Seller Earns = (Sale Price − Delivery) − Commission% − Slab Fixed Fee',
                    'If all slab fees are ₹0, sellers keep 100% of product value (minus commission).',
                    'Changes apply to NEW orders only. Existing orders are unaffected.',
                  ].map((t, i) => (
                    <p key={i} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>
                      <span style={{ color: '#60a5fa', marginRight: '6px' }}>•</span>{t}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}