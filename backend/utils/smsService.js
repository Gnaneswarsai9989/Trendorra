// smsService.js — SMS removed. Fast2SMS replaced by Firebase Push Notifications.
// All functions are kept as no-ops so existing call sites don't crash.
// See utils/pushNotificationService.js for the new notification system.

const noop = async () => ({ success: false, reason: 'SMS removed — using push notifications' });

module.exports = {
  sendOrderConfirmedSMS:  noop,
  sendOrderShippedSMS:    noop,
  sendOrderDeliveredSMS:  noop,
  sendOrderCancelledSMS:  noop,
  sendWelcomeSMS:         noop,
  sendOfferSMS:           noop,
  sendRawSMS:             noop,
};