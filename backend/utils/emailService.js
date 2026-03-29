const { Resend } = require('resend');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY || 're_test_key');

const baseHeader = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px 0">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #eee">
  <div style="background:#111;padding:24px 40px;text-align:center">
    <h1 style="color:#C9A84C;font-size:20px;letter-spacing:4px;margin:0;font-weight:300">TRENDORRA</h1>
  </div>`;

const baseFooter = `
  <div style="background:#111;padding:32px 40px;text-align:center">
    <p style="color:rgba(255,255,255,.3);font-size:11px;margin:4px 0">© 2026 Trendorra Fashion Pvt. Ltd.</p>
    <p style="color:rgba(255,255,255,.2);font-size:10px;margin:4px 0">You're receiving this because you're a registered Trendorra user.</p>
  </div>
</div></body></html>`;

const wrap = (content) => `${baseHeader}${content}${baseFooter}`;
const btn = (url, label) => `<a href="${url}" style="background:#C9A84C;color:#fff;text-decoration:none;padding:14px 32px;font-size:12px;letter-spacing:2px;text-transform:uppercase;border-radius:4px;display:inline-block;margin:20px 0">${label}</a>`;

const templates = {
  welcome: (user) => ({
    subject: `✨ Welcome to Trendorra, ${user.name?.split(' ')[0] || 'there'}!`,
    html: wrap(`
    <div style="padding:40px;text-align:center">
      <h2 style="color:#111;font-size:24px;margin-bottom:16px;font-weight:700">Experience Luxury Fashion</h2>
      <p style="color:#555;font-size:15px;line-height:1.7;margin-bottom:24px">We're thrilled to have you! Explore our curated collection of premium streetwear, ethnic wear, and luxury accessories.</p>
      ${btn(`${process.env.CLIENT_URL}/shop`, 'Start Shopping')}
    </div>`)
  }),

  orderConfirmed: (order, user) => ({
    subject: `✅ Order Confirmed — #${order._id.toString().slice(-8).toUpperCase()} | Trendorra`,
    html: wrap(`
    <div style="padding:40px">
      <h2 style="color:#111;font-size:20px;margin-bottom:24px;text-align:center">Your order is confirmed!</h2>
      <div style="background:#f9f9f9;border-radius:8px;padding:24px;margin-bottom:30px">
        <p style="font-size:13px;color:#999;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px">Order ID</p>
        <p style="font-size:16px;color:#111;font-weight:700;margin:0 mb:16px">#${order._id}</p>
        <div style="display:flex;justify-content:space-between;margin-top:16px">
          <div><p style="font-size:11px;color:#999;margin:0">Total Paid</p><p style="font-size:18px;color:#C9A84C;font-weight:700;margin:4px 0">₹${order.totalPrice}</p></div>
          <div style="text-align:right"><p style="font-size:11px;color:#999;margin:0">Method</p><p style="font-size:14px;color:#111;margin:4px 0">${order.paymentMethod}</p></div>
        </div>
      </div>
      <div style="text-align:center">
        ${btn(`${process.env.CLIENT_URL}/orders/${order._id}`, 'Track Your Order')}
      </div>
    </div>`)
  }),

  orderShipped: (order) => ({
    subject: `🚚 Your Trendorra Order #${order._id.toString().slice(-8).toUpperCase()} is on its way!`,
    html: wrap(`
    <div style="padding:40px;text-align:center">
      <h2 style="color:#111;font-size:20px;margin-bottom:16px">It's on the way!</h2>
      <p style="color:#555;font-size:15px;line-height:1.7">Your order has been shipped and is heading to you.</p>
      ${btn(`${process.env.CLIENT_URL}/orders/${order._id}`, 'Track Shipment')}
    </div>`)
  }),

  orderDelivered: (order) => ({
    subject: `🎁 Delivered! — #${order._id.toString().slice(-8).toUpperCase()} | Trendorra`,
    html: wrap(`
    <div style="padding:40px;text-align:center">
      <h2 style="color:#111;font-size:20px;margin-bottom:16px">Delivered!</h2>
      <p style="color:#555;font-size:15px;line-height:1.7">Your Trendorra order has been delivered. We hope you love your new pieces!</p>
      ${btn(`${process.env.CLIENT_URL}/orders/${order._id}/review`, 'Share Your Review')}
    </div>`)
  })
};

const sendEmail = async (to, template) => {
  if (!process.env.RESEND_API_KEY) {
    console.log(`📧 [Email skipped - No API Key] To: ${to} | Subject: ${template.subject}`);
    return;
  }
  try {
    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Trendorra <onboarding@resend.dev>',
      to,
      subject: template.subject,
      html: template.html,
    });
    console.log(`📧 Email sent via Resend → ${to} | ID: ${data.id}`);
    return data;
  } catch (err) {
    console.error(`❌ Resend failed for ${to}:`, err.message);
    throw err;
  }
};

module.exports = {
  sendWelcomeEmail: (user) => sendEmail(user.email, templates.welcome(user)),
  sendOrderConfirmedEmail: (order, user) => sendEmail(user.email, templates.orderConfirmed(order, user)),
  sendOrderShippedEmail: (order, user) => sendEmail(user.email, templates.orderShipped(order)),
  sendOrderDeliveredEmail: (order, user) => sendEmail(user.email, templates.orderDelivered(order)),
  sendEmail // General purpose
};