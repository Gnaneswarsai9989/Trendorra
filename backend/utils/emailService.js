const nodemailer = require('nodemailer');

const createTransporter = () => nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const baseHeader = `
<div style="background:#111;padding:24px 40px;text-align:center">
  <h1 style="color:#C9A84C;font-size:20px;letter-spacing:4px;margin:0;font-weight:300">TRENDORRA</h1>
  <p style="color:rgba(255,255,255,.4);font-size:10px;letter-spacing:2px;margin:4px 0 0;text-transform:uppercase">Premium Fashion Store</p>
</div>`;

const baseFooter = `
<div style="background:#111;padding:20px 40px;text-align:center">
  <p style="color:rgba(255,255,255,.3);font-size:11px;margin:4px 0">Questions? <a href="mailto:trendorashoppingsai@gmail.com" style="color:#C9A84C">trendorashoppingsai@gmail.com</a> | +91 6304000624</p>
  <p style="color:rgba(255,255,255,.2);font-size:10px;margin:4px 0">© 2026 Trendorra Fashion Pvt. Ltd., Nellore – 524004, Andhra Pradesh</p>
</div>`;

const wrap = (content) => `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px 0">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.1)">
${baseHeader}${content}${baseFooter}
</div></body></html>`;

const itemsHTML = (items) => items?.map(item => `
<div style="display:flex;align-items:center;padding:12px 0;border-bottom:1px solid #f0f0f0;gap:12px">
  <img src="${item.image||''}" style="width:52px;height:64px;object-fit:cover;border-radius:4px;background:#f0f0f0;flex-shrink:0"/>
  <div style="flex:1">
    <div style="font-size:13px;font-weight:600;color:#111;margin-bottom:3px">${item.name}</div>
    <div style="font-size:11px;color:#888">${[item.size&&`Size: ${item.size}`,item.color&&item.color,`Qty: ${item.quantity}`].filter(Boolean).join(' · ')}</div>
  </div>
  <div style="font-size:13px;font-weight:600;color:#C9A84C;flex-shrink:0">₹${(item.price*item.quantity).toLocaleString()}</div>
</div>`).join('') || '';

const summaryHTML = (order) => `
<div style="background:#f9f9f9;border-radius:6px;padding:16px;margin:16px 0">
  <div style="display:flex;justify-content:space-between;font-size:13px;color:#666;padding:3px 0"><span>Subtotal</span><span>₹${order.subtotal?.toLocaleString()||0}</span></div>
  <div style="display:flex;justify-content:space-between;font-size:13px;color:#666;padding:3px 0"><span>Shipping</span><span>${order.shippingPrice===0?'FREE':'₹'+order.shippingPrice}</span></div>
  <div style="display:flex;justify-content:space-between;font-size:13px;color:#666;padding:3px 0"><span>GST (18%)</span><span>₹${order.taxPrice?.toLocaleString()||0}</span></div>
  <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:700;padding-top:10px;margin-top:6px;border-top:2px solid #C9A84C"><span>Total</span><span style="color:#C9A84C">₹${order.totalPrice?.toLocaleString()}</span></div>
</div>`;

const addrHTML = (addr) => `
<div style="border:1px solid #e5e5e5;border-radius:6px;padding:14px;margin:16px 0">
  <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;margin-bottom:8px">Delivery Address</div>
  <div style="font-size:13px;color:#555;line-height:1.8">${addr?.fullName}<br/>${addr?.addressLine1}${addr?.addressLine2?', '+addr.addressLine2:''}<br/>${addr?.city}, ${addr?.state} – ${addr?.pincode}<br/>📞 ${addr?.phone}</div>
</div>`;

const btn = (href, text, outline=false) => `<a href="${href}" style="display:inline-block;${outline?'background:transparent;border:1px solid #111;color:#111':'background:#C9A84C;color:#fff'};text-decoration:none;padding:13px 28px;font-size:11px;letter-spacing:2px;text-transform:uppercase;border-radius:4px;margin:6px 4px">${text}</a>`;

const timeline = (activeStep) => {
  const steps = [['✓','Confirmed'],['📦','Processing'],['🚚','Shipped'],['🏠','Delivered']];
  return `<div style="display:flex;justify-content:space-between;margin:20px 0;padding:0 8px">
  ${steps.map((s,i)=>`<div style="text-align:center;flex:1">
    <div style="width:32px;height:32px;border-radius:50%;margin:0 auto 6px;display:flex;align-items:center;justify-content:center;font-size:13px;${i<=activeStep?'background:#C9A84C;color:#fff':'background:#f0f0f0;color:#999'}">${s[0]}</div>
    <div style="font-size:9px;letter-spacing:1px;text-transform:uppercase;${i<=activeStep?'color:#C9A84C;font-weight:700':'color:#bbb'}">${s[1]}</div>
  </div>`).join('')}
  </div>`;
};

const templates = {
  orderConfirmed: (order, user) => ({
    subject: `✅ Order Confirmed – #${order._id.toString().slice(-8).toUpperCase()} | Trendorra`,
    html: wrap(`
<div style="background:linear-gradient(135deg,#1a1a1a,#0a0a0a);padding:28px 40px;text-align:center">
  <div style="font-size:44px;margin-bottom:10px">✅</div>
  <h2 style="color:#fff;font-size:22px;font-weight:300;margin:0 0 6px">Order Confirmed!</h2>
  <p style="color:rgba(255,255,255,.55);font-size:13px;margin:0">Thank you ${user.name?.split(' ')[0]||''}! Your order is being prepared.</p>
</div>
<div style="padding:28px 40px">
  <div style="background:#f9f9f9;border-left:3px solid #C9A84C;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#333">
    Order <strong style="color:#C9A84C">#${order._id.toString().slice(-8).toUpperCase()}</strong> &nbsp;·&nbsp;
    ${new Date(order.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})} &nbsp;·&nbsp;
    ${order.paymentMethod}
  </div>
  ${timeline(0)}
  <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#999;margin:20px 0 12px">Items Ordered</p>
  ${itemsHTML(order.orderItems)}
  ${summaryHTML(order)}
  ${addrHTML(order.shippingAddress)}
  <div style="text-align:center;margin:20px 0">
    ${btn(`${process.env.CLIENT_URL}/orders/${order._id}`,'Track Order')}
    ${btn(`${process.env.CLIENT_URL}/shop`,'Continue Shopping',true)}
  </div>
</div>`),
  }),

  orderShipped: (order, user) => ({
    subject: `🚚 Your Order is Shipped! – #${order._id.toString().slice(-8).toUpperCase()} | Trendorra`,
    html: wrap(`
<div style="background:linear-gradient(135deg,#1a1a1a,#0a0a0a);padding:28px 40px;text-align:center">
  <div style="font-size:44px;margin-bottom:10px">🚚</div>
  <h2 style="color:#fff;font-size:22px;font-weight:300;margin:0 0 6px">Your Order is on the Way!</h2>
  <p style="color:rgba(255,255,255,.55);font-size:13px;margin:0">Great news ${user.name?.split(' ')[0]||''}! Your package is heading to you.</p>
</div>
<div style="padding:28px 40px">
  <p style="font-size:13px;color:#555;text-align:center;margin-bottom:20px">Order <strong>#${order._id.toString().slice(-8).toUpperCase()}</strong> has been shipped.</p>
  ${timeline(2)}
  ${order.trackingNumber ? `
  <div style="background:#f9f9f9;border:2px solid #C9A84C;border-radius:8px;padding:20px;text-align:center;margin:20px 0">
    <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#999;margin-bottom:6px">Tracking Number</div>
    <div style="font-size:22px;font-weight:700;color:#C9A84C;letter-spacing:3px">${order.trackingNumber}</div>
    <div style="font-size:12px;color:#888;margin-top:4px">via ${order.courierPartner||'Courier Partner'}</div>
  </div>` : `<div style="background:#f9f9f9;border-radius:8px;padding:16px;text-align:center;margin:20px 0;font-size:13px;color:#888">Tracking details will be updated soon.</div>`}
  <div style="text-align:center;margin:16px 0">
    ${btn(`${process.env.CLIENT_URL}/orders/${order._id}`,'Track My Order')}
  </div>
  <p style="font-size:12px;color:#888;text-align:center">Estimated delivery: <strong style="color:#111">2–5 business days</strong></p>
</div>`),
  }),

  orderDelivered: (order, user) => ({
    subject: `🎉 Delivered! How was your Trendorra order? – #${order._id.toString().slice(-8).toUpperCase()}`,
    html: wrap(`
<div style="background:linear-gradient(135deg,#1a1a1a,#0a0a0a);padding:28px 40px;text-align:center">
  <div style="font-size:44px;margin-bottom:10px">🎉</div>
  <h2 style="color:#fff;font-size:22px;font-weight:300;margin:0 0 6px">Order Delivered!</h2>
  <p style="color:rgba(255,255,255,.55);font-size:13px;margin:0">Hope you love your new Trendorra pieces, ${user.name?.split(' ')[0]||''}!</p>
</div>
<div style="padding:28px 40px;text-align:center">
  ${timeline(3)}
  <p style="font-size:14px;color:#555;margin:20px 0 8px">How was your experience?</p>
  <div style="font-size:28px;letter-spacing:6px;margin:8px 0">⭐⭐⭐⭐⭐</div>
  <p style="font-size:13px;color:#888;margin:8px 0 20px">Your feedback helps us improve and helps other shoppers!</p>
  ${btn(`${process.env.CLIENT_URL}/product/${order.orderItems?.[0]?.product}`,'Write a Review')}
  ${btn(`${process.env.CLIENT_URL}/shop`,'Shop Again',true)}
  <div style="background:#fff8e7;border:1px solid #fbbf24;border-radius:6px;padding:14px;margin-top:24px;font-size:13px;color:#555">
    Not happy? <a href="${process.env.CLIENT_URL}/refund-policy" style="color:#C9A84C">Initiate a return</a> within 30 days.
  </div>
</div>`),
  }),
};


const welcomeTemplate = (user) => {
  const firstName = user.name?.split(' ')[0] || 'there';
  const shopUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const catLinks = [['Men','👔'],['Women','👗'],['Streetwear','🧢'],['Accessories','👜']]
    .map(([cat,emoji]) => `<a href="${shopUrl}/shop/${cat.toLowerCase()}" style="background:#f5f5f5;text-decoration:none;padding:10px 16px;border-radius:6px;font-size:12px;color:#333;display:inline-block;margin:4px">${emoji} ${cat}</a>`)
    .join('');

  return {
    subject: `🎉 Welcome to Trendorra, ${firstName}! Here is 10% OFF your first order`,
    html: wrap(`
<div style="background:linear-gradient(135deg,#1a1a1a,#0a0a0a);padding:32px 40px;text-align:center">
  <div style="font-size:48px;margin-bottom:12px">🎉</div>
  <h2 style="color:#fff;font-size:24px;font-weight:300;margin:0 0 8px">Welcome to Trendorra!</h2>
  <p style="color:rgba(255,255,255,.6);font-size:14px;margin:0">Hi ${firstName}, your account is ready.</p>
</div>
<div style="padding:32px 40px">
  <p style="font-size:14px;color:#555;line-height:1.7;margin-bottom:20px">
    Thank you for joining Trendorra — your premium fashion destination. We are excited to have you!
  </p>
  <div style="background:#f9f9f9;border:2px dashed #C9A84C;border-radius:8px;padding:24px;text-align:center;margin:20px 0">
    <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#999;margin-bottom:8px">Your Welcome Gift</p>
    <p style="font-size:32px;font-weight:700;color:#C9A84C;letter-spacing:4px;margin:0">WELCOME10</p>
    <p style="font-size:13px;color:#666;margin-top:8px">10% OFF your first order — no minimum!</p>
  </div>
  <div style="text-align:center;margin:24px 0">${catLinks}</div>
  <div style="text-align:center;margin:24px 0">
    <a href="${shopUrl}/shop" style="background:#C9A84C;color:#fff;text-decoration:none;padding:14px 32px;font-size:12px;letter-spacing:2px;text-transform:uppercase;border-radius:4px;display:inline-block">Shop Now and Use WELCOME10</a>
  </div>
  <div style="border-top:1px solid #eee;padding-top:20px;margin-top:20px">
    <p style="font-size:12px;color:#888;text-align:center">
      Free shipping above Rs.999 | 30-day returns | 100% authentic products
    </p>
  </div>
</div>`),
  };
};

const sendEmail = async (to, template) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`📧 [Email skipped - not configured] To: ${to} | Subject: ${template.subject}`);
    return;
  }
  try {
    const transporter = createTransporter();
    await transporter.sendMail({ from: `"Trendorra Fashion" <${process.env.EMAIL_USER}>`, to, subject: template.subject, html: template.html });
    console.log(`📧 Email sent → ${to}`);
  } catch (err) {
    console.error('📧 Email failed:', err.message);
  }
};

module.exports = {
  sendOrderConfirmedEmail: (order, user) => sendEmail(user.email, templates.orderConfirmed(order, user)),
  sendOrderShippedEmail:   (order, user) => sendEmail(user.email, templates.orderShipped(order, user)),
  sendOrderDeliveredEmail: (order, user) => sendEmail(user.email, templates.orderDelivered(order, user)),
  sendWelcomeEmail: (user) => sendEmail(user.email, welcomeTemplate(user)),
};