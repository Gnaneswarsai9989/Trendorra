const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const User = require('../models/User');
const { sendOfferSMS, sendRawSMS } = require('../utils/smsService');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY || 're_test_key');

// @desc  Send bulk SMS to all customers
// @route POST /api/notifications/bulk-sms
router.post('/bulk-sms', protect, admin, async (req, res) => {
  try {
    const { message, offer, targetAll = true, phones = [] } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

    let targetPhones = phones;
    if (targetAll) {
      const users = await User.find({ phone: { $exists: true, $ne: '' }, role: 'user' }).select('phone name');
      targetPhones = users.filter(u => u.phone).map(u => u.phone);
    }

    if (targetPhones.length === 0)
      return res.status(400).json({ success: false, message: 'No phone numbers found' });

    // Send in batches of 10 to avoid rate limits
    const results = [];
    for (let i = 0; i < targetPhones.length; i += 10) {
      const batch = targetPhones.slice(i, i + 10);
      const batchResults = await Promise.all(batch.map(phone => sendRawSMS(phone, message)));
      results.push(...batchResults);
      if (i + 10 < targetPhones.length) await new Promise(r => setTimeout(r, 500)); // 500ms delay
    }

    const sent = results.filter(r => r.success).length;
    res.json({ success: true, message: `SMS sent to ${sent}/${targetPhones.length} numbers`, sent, total: targetPhones.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc  Get customer phone count
// @route GET /api/notifications/stats
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const withPhone  = await User.countDocuments({ role: 'user', phone: { $exists: true, $ne: '' } });
    const withEmail  = await User.countDocuments({ role: 'user', email: { $exists: true, $ne: '' } });
    res.json({ success: true, stats: { totalUsers, withPhone, withEmail } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// @desc Send bulk email to all customers via Resend
router.post('/bulk-email', protect, admin, async (req, res) => {
  try {
    const { subject, message, couponCode, discount } = req.body;
    if (!subject || !message) return res.status(400).json({ success: false, message: 'Subject and message required' });

    const users = await User.find({ email: { $exists: true, $ne: '' }, role: 'user' }).select('name email');
    if (users.length === 0) return res.status(400).json({ success: false, message: 'No users found' });

    if (!process.env.RESEND_API_KEY) {
      return res.status(400).json({ success: false, message: 'Resend not configured in .env' });
    }

    const htmlTemplate = (name) => `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px 0">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #eee">
  <div style="background:#111;padding:24px 40px;text-align:center">
    <h1 style="color:#C9A84C;font-size:20px;letter-spacing:4px;margin:0;font-weight:300">TRENDORRA</h1>
  </div>
  <div style="padding:32px 40px">
    <p style="font-size:15px;color:#333;margin-bottom:8px">Hi ${name?.split(' ')[0] || 'there'}! 👋</p>
    <div style="font-size:14px;color:#555;line-height:1.7;white-space:pre-line">${message}</div>
    ${couponCode ? `
    <div style="background:#f9f9f9;border:2px dashed #C9A84C;border-radius:8px;padding:20px;text-align:center;margin:24px 0">
      <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#999;margin-bottom:8px">Your Exclusive Coupon Code</p>
      <p style="font-size:28px;font-weight:700;color:#C9A84C;letter-spacing:4px;margin:0">${couponCode}</p>
      ${discount ? `<p style="font-size:13px;color:#666;margin-top:6px">Save ${discount}</p>` : ''}
    </div>
    <div style="text-align:center;margin:20px 0">
      <a href="${process.env.CLIENT_URL}/shop" style="background:#C9A84C;color:#fff;text-decoration:none;padding:14px 32px;font-size:12px;letter-spacing:2px;text-transform:uppercase;border-radius:4px;display:inline-block">Shop Now</a>
    </div>` : ''}
  </div>
  <div style="background:#111;padding:20px 40px;text-align:center">
    <p style="color:rgba(255,255,255,.3);font-size:11px;margin:4px 0">© 2026 Trendorra Fashion Pvt. Ltd.</p>
    <p style="color:rgba(255,255,255,.2);font-size:10px;margin:4px 0">To unsubscribe, reply with STOP</p>
  </div>
</div>
</body></html>`;

    let lastError = null;
    // Send in parallel for efficiency
    const out = await Promise.all(users.map(async (user) => {
      try {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'Trendorra <onboarding@resend.dev>',
          to: user.email,
          subject: subject,
          html: htmlTemplate(user.name),
        });
        return { success: true };
      } catch (e) {
        lastError = e.message;
        console.error(`📧 Resend bulk failed for ${user.email}:`, e.message);
        return { success: false };
      }
    }));

    const sent = out.filter(x => x.success).length;

    if (sent === 0 && users.length > 0) {
      return res.status(500).json({ 
        success: false, 
        message: `Failed to send all ${users.length} emails via Resend. Reason: ${lastError || 'Unknown API error'}`
      });
    }

    res.json({ success: true, message: `Email sent to ${sent}/${users.length} customers via Resend`, sent, total: users.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;