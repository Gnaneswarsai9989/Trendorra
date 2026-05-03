// src/firebase.js — Firebase SDK init + FCM helpers + Firestore

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
// ✅ Use initializeFirestore instead of getFirestore to fix
// Edge/Firefox "Tracking Prevention blocked access to storage" error
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// ✅ initializeFirestore with long polling fixes:
// — Edge "Tracking Prevention blocked access to storage" error
// — Firefox IndexedDB restrictions
// — Any browser with strict privacy settings
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,  // bypasses IndexedDB, uses HTTP long poll
  useFetchStreams: false,               // extra safety for Edge
});

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── Request permission + get FCM token ───────────────────────
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('🔔 Notification permission denied');
      return { granted: false };
    }

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log('🔔 FCM Token obtained:', token.slice(0, 20) + '...');
      await saveFcmToken(token);
      return { granted: true, token };
    }

    return { granted: true, token: null };
  } catch (err) {
    console.error('🔔 Permission/token error:', err.message);
    return { granted: false, error: err.message };
  }
};

// ── Save FCM token to backend ────────────────────────────────
export const saveFcmToken = async (token) => {
  try {
    const authToken = localStorage.getItem('trendora_token');
    if (!authToken) return; // Not logged in — skip
    await fetch(`${API_URL}/api/notifications/save-fcm-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ fcmToken: token }),
    });
    console.log('🔔 FCM token saved to backend');
  } catch (err) {
    console.error('🔔 Failed to save FCM token:', err.message);
  }
};

// ── Listen to foreground messages ───────────────────────────
export const onForegroundMessage = (callback) => {
  return onMessage(messaging, callback);
};

export { messaging };