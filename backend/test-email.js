const dotenv = require('dotenv');
const { sendOrderConfirmedEmail } = require('./utils/emailService');

dotenv.config();

const testUser = {
  name: 'Test User',
  email: process.env.EMAIL_USER, // Send to self
};

const testOrder = {
  _id: '69bfe1a72c51a3ce3b0cade3',
  createdAt: new Date(),
  paymentMethod: 'COD',
  subtotal: 1000,
  shippingPrice: 0,
  taxPrice: 180,
  totalPrice: 1180,
  orderItems: [
    { name: 'Test Product', price: 1000, quantity: 1, size: 'M', color: 'Black' }
  ],
  shippingAddress: {
    fullName: 'Test User',
    addressLine1: '123 Test St',
    city: 'Test City',
    state: 'Test State',
    pincode: '123456',
    phone: '1234567890'
  }
};

console.log('🚀 Starting email test...');
console.log('EMAIL_USER:', process.env.EMAIL_USER);

sendOrderConfirmedEmail(testOrder, testUser)
  .then(() => console.log('✅ Test finished (check logs above for result)'))
  .catch(err => console.error('❌ Test failed:', err));
