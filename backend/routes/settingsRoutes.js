// ═══════════════════════════════════════════════════════════════════
// routes/settingsRoutes.js
// GET  /api/settings   → public (seller dashboard needs commission)
// PUT  /api/settings   → admin only
// ═══════════════════════════════════════════════════════════════════
const express  = require('express');
const router   = express.Router();
const Settings = require('../models/Settings');
const { protect, admin } = require('../middleware/auth');

// ── GET /api/settings  (public) ────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const settings = await Settings.getPlatformSettings();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/settings  (admin only) ───────────────────────────────
router.put('/', protect, admin, async (req, res) => {
  try {
    const { commissionRate, fixedCharge, fixedSlabs } = req.body;

    if (commissionRate === undefined && fixedCharge === undefined && fixedSlabs === undefined)
      return res.status(400).json({ success: false, message: 'Provide at least one field to update' });

    const current = await Settings.getPlatformSettings();

    // Validate slabs if provided
    if (fixedSlabs !== undefined) {
      if (!Array.isArray(fixedSlabs))
        return res.status(400).json({ success: false, message: 'fixedSlabs must be an array' });
      for (const s of fixedSlabs) {
        if (typeof s.fee !== 'number' || s.fee < 0)
          return res.status(400).json({ success: false, message: 'Each slab fee must be a non-negative number' });
      }
    }

    const updated = {
      ...current,
      ...(commissionRate !== undefined && { commissionRate: Math.max(0, Math.min(100, Number(commissionRate))) }),
      ...(fixedCharge    !== undefined && { fixedCharge:    Math.max(0, Number(fixedCharge)) }),
      ...(fixedSlabs     !== undefined && { fixedSlabs }),
      updatedBy: req.user._id,
      updatedAt: new Date(),
    };

    await Settings.findOneAndUpdate(
      { key: 'platform' },
      { value: updated },
      { upsert: true, new: true }
    );

    console.log(`⚙️  Settings updated: commission=${updated.commissionRate}%, slabs=${JSON.stringify(updated.fixedSlabs)}`);
    res.json({ success: true, settings: updated, message: 'Settings saved successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;