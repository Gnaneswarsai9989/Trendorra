const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const User = require('../models/User');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Send bulk email using Resend
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

    console.log(`Sending bulk to: ${targets.join(', ')}`);
    
    // Using simple parallel sending (Warning: Resend sandbox only allows your own email)
    const results = await Promise.all(targets.map(email => 
      resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject,
        html: `<p>${message}</p>`
      }).then(r => ({ success: true, id: r.id }))
        .catch(e => {
           console.error(`Failed to send to ${email}:`, e.message);
           return { success: false, error: e.message };
        })
    ));

    const sent = results.filter(r => r.success).length;
    res.json({ success: true, message: `Email sent to ${sent}/${targets.length} from Resend`, sent, total: targets.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Stats for admin
router.get('/stats', protect, admin, async (req, res) => {
  const total = await User.countDocuments({ role: 'user' });
  res.json({ success: true, stats: { withEmail: total } });
});

module.exports = router;