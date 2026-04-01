import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { requestNotificationPermission } from '../firebase';

export default function NotificationPermissionModal() {
  const [showModal, setShowModal] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(Notification.permission);
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    // Show only if permission is default and user is logged in
    if (Notification.permission === 'default' && isLoggedIn) {
      setShowModal(true);
    }
  }, [isLoggedIn]);

  const handleAllow = async () => {
    const { granted } = await requestNotificationPermission();
    if (granted) {
      setPermissionStatus('granted');
      setShowModal(false);
    } else {
      setPermissionStatus('denied');
      setShowModal(false);
    }
  };

  const handleMaybeLater = () => {
    setShowModal(false);
  };

  if (!showModal || permissionStatus !== 'default') return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6" style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
      <div className="max-w-md w-full rounded-2xl shadow-2xl relative flex flex-col max-h-[85vh]" style={{ backgroundColor: '#161616', border: '1px solid #333' }}>
        
        {/* Top Gold Bar */}
        <div className="h-2 w-full flex-shrink-0 rounded-t-2xl" style={{ backgroundColor: '#C9A84C' }}></div>
        
        <div className="p-5 sm:p-8 text-center overflow-y-auto">
          <div className="w-14 h-14 sm:w-20 sm:h-20 mx-auto rounded-full flex items-center justify-center mb-4 sm:mb-6 flex-shrink-0" style={{ backgroundColor: 'rgba(201,168,76,0.1)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 sm:h-10 sm:w-10" fill="none" viewBox="0 0 24 24" stroke="#C9A84C">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          
          <h2 className="text-xl sm:text-2xl font-serif mb-2 sm:mb-3 tracking-wide" style={{ color: '#fff' }}>Never Miss an Update</h2>
          <p className="text-sm mb-6 sm:mb-8 leading-relaxed px-2" style={{ color: '#aaa' }}>
            Enable push notifications to stay ahead. Here's what you get:
          </p>

          <div className="space-y-5 sm:space-y-4 mb-8 text-left px-2 sm:px-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="#C9A84C"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div>
                <h4 className="font-medium text-[13px] sm:text-sm text-white">Exclusive Offers</h4>
                <p className="text-xs mt-0.5" style={{ color: '#888' }}>Early access to sales and promotions</p>
              </div>
            </div>
            <div className="flex items-start">
              <svg className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="#C9A84C"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
              <div>
                <h4 className="font-medium text-[13px] sm:text-sm text-white">Surprise Coupons</h4>
                <p className="text-xs mt-0.5" style={{ color: '#888' }}>Special discounts delivered instantly</p>
              </div>
            </div>
            <div className="flex items-start">
              <svg className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="#C9A84C"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
              <div>
                <h4 className="font-medium text-[13px] sm:text-sm text-white">Order Tracking</h4>
                <p className="text-xs mt-0.5" style={{ color: '#888' }}>Real-time updates on your deliveries</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 px-2 sm:px-4 pb-2">
            <button 
              onClick={handleAllow}
              className="w-full py-3 px-4 rounded font-medium tracking-wider transition-all"
              style={{ backgroundColor: '#C9A84C', color: '#111', fontSize: '13px' }}
            >
              ALLOW NOTIFICATIONS
            </button>
            <button 
              onClick={handleMaybeLater}
              className="w-full py-3 px-4 rounded font-medium tracking-wider transition-all hover:bg-white/5"
              style={{ color: '#aaa', fontSize: '13px', border: '1px solid #333' }}
            >
              MAYBE LATER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
