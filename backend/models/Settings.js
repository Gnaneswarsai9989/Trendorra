// ═══════════════════════════════════════════════════════════════════
// models/Settings.js
// Stores platform-wide config: commission%, tiered fixedSlabs
// Default: commission=0, all slab fees=0 (startup friendly)
// ═══════════════════════════════════════════════════════════════════
const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key:   { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);

// ── Default slab structure ─────────────────────────────────────────
const DEFAULT_SLABS = [
  { upTo: 500,    label: 'Up to ₹500',      fee: 0 },
  { upTo: 1000,   label: '₹501 – ₹1,000',   fee: 0 },
  { upTo: 5000,   label: '₹1,001 – ₹5,000', fee: 0 },
  { upTo: 10000,  label: '₹5,001 – ₹10,000',fee: 0 },
  { upTo: 20000,  label: '₹10,001 – ₹20,000',fee: 0 },
  { upTo: null,   label: 'Above ₹20,000',   fee: 0 }, // null = no upper limit
];

// ── Helper: get platform settings (with defaults) ─────────────────
Settings.getPlatformSettings = async () => {
  let doc = await Settings.findOne({ key: 'platform' });
  if (!doc) {
    doc = await Settings.create({
      key: 'platform',
      value: {
        commissionRate: 0,
        fixedCharge:    0,      // kept for backward compat
        fixedSlabs:     DEFAULT_SLABS,
        updatedBy:      'system',
        updatedAt:      new Date(),
      },
    });
    console.log('⚙️  Platform settings initialised with tiered slab defaults');
  }
  // Back-fill fixedSlabs for existing docs that don't have it
  if (!doc.value.fixedSlabs) {
    const updated = { ...doc.value, fixedSlabs: DEFAULT_SLABS };
    await Settings.findOneAndUpdate({ key: 'platform' }, { value: updated });
    return updated;
  }
  return doc.value;
};

// ── Helper: pick the correct fixed fee for a given product price ───
Settings.getFixedFeeForPrice = (price, slabs) => {
  if (!slabs || slabs.length === 0) return 0;
  const sorted = [...slabs].sort((a, b) => {
    if (a.upTo === null) return 1;
    if (b.upTo === null) return -1;
    return a.upTo - b.upTo;
  });
  for (const slab of sorted) {
    if (slab.upTo === null || price <= slab.upTo) return Number(slab.fee) || 0;
  }
  return 0;
};

module.exports = Settings;