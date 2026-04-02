// ═══════════════════════════════════════════════════════════
// utils/pushNotificationService.js
// Firebase Cloud Messaging — replaces Fast2SMS
// ═══════════════════════════════════════════════════════════
const admin = require('firebase-admin');
const path  = require('path');

// ── Init Firebase Admin (singleton) ─────────────────────────
if (!admin.apps.length) {
  let serviceAccount;
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    // 1. Used in Production (Render)
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } else {
    // 2. Used in Local Development
    serviceAccount = require(path.join(__dirname, '../firebase-service-account.json'));
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const messaging = admin.messaging();

// ── Core send function ───────────────────────────────────────
const sendPush = async (fcmToken, { title, body, data = {} }) => {
  if (!fcmToken) {
    console.log(`🔔 [Push skipped] No FCM token`);
    return { success: false, reason: 'No FCM token' };
  }

  try {
    const result = await messaging.send({
      token: fcmToken,
      notification: { title, body },
      data: { ...data },
      webpush: {
        notification: {
          title,
          body,
          icon: '/logo.png',
          badge: '/logo.png',
          vibrate: [200, 100, 200],
        },
        fcmOptions: { link: data.url || 'https://trendorra.in' },
      },
    });
    console.log(`🔔 ✅ Push sent: ${result}`);
    return { success: true, messageId: result };
  } catch (err) {
    // Token expired/invalid — caller should clear it
    if (err.code === 'messaging/registration-token-not-registered' ||
        err.code === 'messaging/invalid-registration-token') {
      console.log(`🔔 ❌ Invalid FCM token — should be cleared`);
      return { success: false, reason: 'invalid-token' };
    }
    console.error(`🔔 ❌ Push error: ${err.message}`);
    return { success: false, reason: err.message };
  }
};

// ── Bulk send (multicast) ────────────────────────────────────
const sendBulkPush = async (fcmTokens, { title, body, imageUrl, data = {} }) => {
  const validTokens = fcmTokens.filter(Boolean);
  if (!validTokens.length) return { success: false, reason: 'No tokens' };

  try {
    const result = await messaging.sendEachForMulticast({
      tokens: validTokens,
      notification: { title, body, ...(imageUrl && { image: imageUrl }) },
      data: { ...data },
      webpush: {
        notification: {
          title,
          body,
          icon: '/logo.png', // Fallback to relative so it works anywhere
          ...(imageUrl && { image: imageUrl }),
          badge: '/logo.png',
        },
        fcmOptions: { link: data.url || '/' },
      },
    });
    console.log(`🔔 Bulk push: ${result.successCount}/${validTokens.length} sent`);
    return { success: true, sent: result.successCount, total: validTokens.length };
  } catch (err) {
    console.error(`🔔 ❌ Bulk push error: ${err.message}`);
    return { success: false, reason: err.message };
  }
};

// ── Notification Templates ───────────────────────────────────
module.exports = {
  sendOrderConfirmedPush: (order, user) => sendPush(user.fcmToken, {
    title: '✅ Order Confirmed!',
    body: `Your Trendorra order #${order._id.toString().slice(-8).toUpperCase()} is confirmed. Total: ₹${order.totalPrice?.toLocaleString()}`,
    data: { url: '/orders', orderId: order._id.toString(), type: 'order_confirmed' },
  }),

  sendOrderShippedPush: (order, user) => sendPush(user.fcmToken, {
    title: '🚚 Order Shipped!',
    body: `Trendorra order #${order._id.toString().slice(-8).toUpperCase()} is on its way!${order.trackingNumber ? ` Track: ${order.trackingNumber}` : ''}`,
    data: { url: `/orders/${order._id}`, orderId: order._id.toString(), type: 'order_shipped' },
  }),

  sendOrderDeliveredPush: (order, user) => sendPush(user.fcmToken, {
    title: '🎉 Order Delivered!',
    body: `Your Trendorra order #${order._id.toString().slice(-8).toUpperCase()} has been delivered! Hope you love it.`,
    data: { url: `/orders/${order._id}`, orderId: order._id.toString(), type: 'order_delivered' },
  }),

  sendOrderCancelledPush: (order, user) => sendPush(user.fcmToken, {
    title: '❌ Order Cancelled',
    body: `Trendorra order #${order._id.toString().slice(-8).toUpperCase()} cancelled. Refund in 5-7 days if paid online.`,
    data: { url: '/orders', orderId: order._id.toString(), type: 'order_cancelled' },
  }),

  sendWelcomePush: (user) => sendPush(user.fcmToken, {
    title: '👋 Welcome to Trendorra!',
    body: `Hey ${user.name?.split(' ')[0]}! Use code WELCOME10 for 10% OFF your first order.`,
    data: { url: '/shop', type: 'welcome' },
  }),

  sendBulkPush,
  sendPush,
};
