import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { requestNotificationPermission } from '../firebase';

export default function NotificationPermissionModal() {
  const [showModal, setShowModal] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof Notification !== 'undefined' &&
        Notification.permission === 'default' &&
        isLoggedIn) {
        setShowModal(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [isLoggedIn]);

  const handleAllow = async () => {
    try {
      const result = await requestNotificationPermission();
      if (result?.granted) {
        setPermissionStatus('granted');
      } else {
        setPermissionStatus('denied');
      }
    } catch (e) {
      console.error('Notification permission error:', e);
    } finally {
      setShowModal(false);
    }
  };

  const handleMaybeLater = () => {
    setShowModal(false);
  };

  if (!showModal || permissionStatus !== 'default') return null;

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(6px)',
        pointerEvents: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleMaybeLater();
      }}
    >
      <div
        style={{
          maxWidth: '420px',
          width: '100%',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh',
          backgroundColor: '#161616',
          border: '1px solid #333',
          pointerEvents: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gold Bar — solid color to avoid Framer Motion gradient crash */}
        <div style={{
          height: '4px',
          width: '100%',
          flexShrink: 0,
          borderRadius: '16px 16px 0 0',
          backgroundColor: '#C9A84C',
        }} />

        <div style={{ padding: '28px 28px 24px', textAlign: 'center', overflowY: 'auto' }}>
          {/* Bell icon */}
          <div style={{
            width: '72px', height: '72px', margin: '0 auto 20px',
            borderRadius: '50%', backgroundColor: 'rgba(201,168,76,0.12)',
            border: '1px solid rgba(201,168,76,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#C9A84C">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>

          <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, marginBottom: '8px', letterSpacing: '0.02em' }}>
            Never Miss an Update
          </h2>
          <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '24px', lineHeight: 1.6 }}>
            Enable push notifications to stay ahead.
          </p>

          {/* Features list */}
          <div style={{ textAlign: 'left', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { title: 'Exclusive Offers', desc: 'Early access to sales and promotions' },
              { title: 'Surprise Coupons', desc: 'Special discounts delivered instantly' },
              { title: 'Order Tracking', desc: 'Real-time updates on your deliveries' },
            ].map(({ title, desc }) => (
              <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#C9A84C" style={{ flexShrink: 0, marginTop: '2px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p style={{ color: '#fff', fontSize: '13px', fontWeight: 500, margin: 0 }}>{title}</p>
                  <p style={{ color: '#888', fontSize: '11px', margin: '2px 0 0' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAllow();
              }}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#C9A84C',
                color: '#111',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                pointerEvents: 'auto',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              ALLOW NOTIFICATIONS
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMaybeLater();
              }}
              style={{
                width: '100%',
                padding: '13px 16px',
                borderRadius: '8px',
                border: '1px solid #333',
                backgroundColor: 'transparent',
                color: '#aaa',
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                pointerEvents: 'auto',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              MAYBE LATER
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}