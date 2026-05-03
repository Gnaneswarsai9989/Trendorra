const admin = require('firebase-admin');

let _db = null;

const getFirestore = () => {
  if (!admin.apps.length) {
    const serviceAccount = require('../firebase-service-account.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  if (!_db) {
    _db = admin.firestore();
  }
  return _db;
};

/**
 * Save notification to MongoDB + Firestore
 * MongoDB = primary (works in all browsers including Edge)
 * Firestore = bonus for Chrome real-time updates
 *
 * @param {string} userId  - MongoDB _id of the user
 * @param {string} title
 * @param {string} message
 * @param {string} type    - 'offer' | 'order' | 'alert' | 'info'
 */
const saveNotificationToFirestore = async (userId, title, message, type = 'info') => {
  // ✅ PRIMARY: Save to MongoDB — works in ALL browsers, no tracking prevention issues
  try {
    const Notification = require('../models/Notification');
    await Notification.create({
      userId,
      title,
      message,
      type,
      isRead: false,
    });
    console.log(`[MongoDB] ✅ Notification saved for user ${userId}`);
  } catch (err) {
    console.error(`[MongoDB Notification Error] 🚨: ${err.message}`);
  }

  // ✅ SECONDARY: Also save to Firestore for Chrome real-time bell updates
  try {
    const db = getFirestore();
    await db.collection('notifications').add({
      target: userId.toString(),
      title,
      message,
      type,
      read: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`[Firestore] ✅ Notification saved for user ${userId}`);
  } catch (err) {
    // Silent — Firestore is bonus only, not critical
    console.error(`[Firestore Notification Error] 🚨: ${err.message}`);
  }
};

module.exports = { saveNotificationToFirestore };