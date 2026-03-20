const https = require('https');

const sendSMS = async (phone, message) => {
  if (!process.env.FAST2SMS_API_KEY) {
    console.log(`📱 [SMS skipped] FAST2SMS_API_KEY not set in .env`);
    return { success: false, reason: 'SMS not configured' };
  }

  // Clean phone number
  const cleanPhone = phone.toString()
    .replace(/[\s\-\+]/g, '')
    .replace(/^91/, '')
    .slice(-10);

  if (cleanPhone.length !== 10) {
    console.log(`📱 Invalid phone number: "${phone}" → cleaned: "${cleanPhone}"`);
    return { success: false, reason: 'Invalid phone number' };
  }

  console.log(`📱 Sending SMS to: ${cleanPhone}`);

  // Fast2SMS API call
  const payload = JSON.stringify({
    route: 'q',
    message: message,
    language: 'english',
    flash: 0,
    numbers: cleanPhone,
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'www.fast2sms.com',
      path: '/dev/bulkV2',
      method: 'POST',
      headers: {
        'authorization': process.env.FAST2SMS_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log(`📱 Fast2SMS response:`, JSON.stringify(result));
          
          if (result.return === true) {
            console.log(`📱 ✅ SMS sent successfully to ${cleanPhone}`);
            resolve({ success: true });
          } else {
            console.log(`📱 ❌ SMS failed: ${result.message || JSON.stringify(result)}`);
            resolve({ success: false, reason: result.message || 'Unknown error' });
          }
        } catch (e) {
          console.log(`📱 ❌ SMS parse error: ${data}`);
          resolve({ success: false, reason: 'Parse error' });
        }
      });
    });

    req.on('error', (err) => {
      console.error(`📱 ❌ SMS request error: ${err.message}`);
      resolve({ success: false, reason: err.message });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ success: false, reason: 'Timeout' });
    });

    req.write(payload);
    req.end();
  });
};

// ── SMS Templates ──
const SMS_TEMPLATES = {
  orderConfirmed: (order, name) =>
    `Hi ${name.split(' ')[0]}! Your Trendorra order #${order._id.toString().slice(-8).toUpperCase()} confirmed. Total: Rs.${order.totalPrice?.toLocaleString()}. Track at trendorra.in`,

  orderShipped: (order, name) =>
    `Hi ${name.split(' ')[0]}! Trendorra order #${order._id.toString().slice(-8).toUpperCase()} shipped!${order.trackingNumber ? ` Tracking: ${order.trackingNumber}` : ''} Track at trendorra.in`,

  orderDelivered: (order, name) =>
    `Hi ${name.split(' ')[0]}! Trendorra order #${order._id.toString().slice(-8).toUpperCase()} delivered! Hope you love it. Review at trendorra.in`,

  orderCancelled: (order, name) =>
    `Hi ${name.split(' ')[0]}. Trendorra order #${order._id.toString().slice(-8).toUpperCase()} cancelled. Refund in 5-7 days if paid.`,

  welcome: (user) =>
    `Welcome to Trendorra ${user.name?.split(' ')[0]}! Use code WELCOME10 for 10% OFF first order. Shop: ${process.env.CLIENT_URL || 'trendorra.in'}`,

  offerAlert: (offer) =>
    `Trendorra SALE! ${offer.title}. Use code ${offer.code} for ${offer.discount}% OFF. Shop: ${process.env.CLIENT_URL || 'trendorra.in'}`,
};

module.exports = {
  sendOrderConfirmedSMS:  (order, user) => sendSMS(user.phone, SMS_TEMPLATES.orderConfirmed(order, user.name)),
  sendOrderShippedSMS:    (order, user) => sendSMS(user.phone, SMS_TEMPLATES.orderShipped(order, user.name)),
  sendOrderDeliveredSMS:  (order, user) => sendSMS(user.phone, SMS_TEMPLATES.orderDelivered(order, user.name)),
  sendOrderCancelledSMS:  (order, user) => sendSMS(user.phone, SMS_TEMPLATES.orderCancelled(order, user.name)),
  sendWelcomeSMS:         (user)        => sendSMS(user.phone, SMS_TEMPLATES.welcome(user)),
  sendOfferSMS:           (phones, offer) => Promise.all(phones.map(p => sendSMS(p, SMS_TEMPLATES.offerAlert(offer)))),
  sendRawSMS:             sendSMS,
};