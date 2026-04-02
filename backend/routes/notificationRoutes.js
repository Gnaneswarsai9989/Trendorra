const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { sendBulkPush } = require('../utils/pushNotificationService');

// Send bulk email using Nodemailer
router.post('/bulk-email', protect, admin, async (req, res) => {
  try {
    const { subject, message, toAll = true, customerEmail = '' } = req.body;
    
    let targets = [];
    if (toAll) {
      const users = await User.find({ role: 'user' }).select('email');
      targets = users.map(u => u.email);
    } else {
      targets = [customerEmail];
    }

    if (targets.length === 0) return res.status(400).json({ success: false, message: 'No target emails found' });

    console.log(`[Email Debug] 📨 Sending to ${targets.length} targets using Gmail...`);

    const results = await Promise.all(targets.map(async (email) => {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #111; border-top: 4px solid #C9A84C;">
          <h1 style="color: #C9A84C; font-size: 20px; letter-spacing: 2px;">TRENDORRA</h1>
          <div style="margin-top: 20px; font-size: 16px; line-height: 1.6;">
            ${message}
          </div>
          <p style="margin-top: 30px; font-size: 12px; color: #999;">Explore luxury at trendorra.in</p>
        </div>
      `;

      return await sendEmail({
        to: email,
        subject,
        html: htmlContent
      });
    }));

    const sent = results.filter(r => r.success).length;
    res.json({ success: true, message: `Sent ${sent}/${targets.length} emails`, sent, total: targets.length });
  } catch (err) {
    console.error(`[Email Global Error] 🚨: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Send bulk push using Firebase
router.post('/bulk-sms', protect, admin, async (req, res) => {
  try {
    const { message, title = 'Trendorra Update', targetAll = true, customerEmail = '', imageUrl } = req.body;

    let targets = [];
    if (targetAll) {
      const users = await User.find({ fcmToken: { $exists: true, $ne: null } }).select('fcmToken');
      targets = users.map(u => u.fcmToken).filter(Boolean);
    } else {
      if (customerEmail) {
        const user = await User.findOne({ email: customerEmail, fcmToken: { $exists: true, $ne: null } });
        if (user) targets = [user.fcmToken];
      }
    }

    if (targets.length === 0) return res.status(400).json({ success: false, message: 'No target devices found with notification access' });

    console.log(`[Push Debug] 🔔 Sending to ${targets.length} devices with image: ${!!imageUrl}`);

    const result = await sendBulkPush(targets, { title, body: message, imageUrl });

    res.json({ success: true, message: `Sent ${result.sent}/${targets.length} push notifications successfully`, sent: result.sent, total: targets.length });
  } catch (err) {
    console.error(`[Push Global Error] 🚨: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Save FCM Token
router.post('/save-fcm-token', protect, async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) return res.status(400).json({ success: false, message: 'Token is required' });

    await User.findByIdAndUpdate(req.user._id, { fcmToken });
    res.json({ success: true, message: 'Token saved' });
  } catch (err) {
    console.error(`[FCM Save Error] 🚨: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/stats', protect, admin, async (req, res) => {
  const total = await User.countDocuments({ role: 'user' });
  const withPush = await User.countDocuments({ fcmToken: { $exists: true, $ne: null } });
  res.json({ success: true, stats: { totalUsers: total, withEmail: total, withPhone: withPush } });
});

module.exports = router;