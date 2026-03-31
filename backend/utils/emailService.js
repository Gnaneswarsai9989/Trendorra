const sendEmailHelper = require('./sendEmail');

const templates = {
  orderConfirmed: (order, user) => ({
    subject: `Order Confirmed: #${order._id.toString().slice(-8).toUpperCase()}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Thank you for your order, ${user.name}!</h2>
        <p>Your order <strong>#${order._id}</strong> has been confirmed.</p>
        <p><strong>Total Amount:</strong> ₹${order.totalPrice}</p>
        <p>We'll notify you when it's shipped.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">Trendorra Fashion</p>
      </div>
    `
  })
};

const sendEmail = async (to, template) => {
  const result = await sendEmailHelper({
    to,
    subject: template.subject,
    html: template.html
  });
  
  if (!result.success) {
    throw new Error(result.error);
  }
  
  return result.data;
};

module.exports = {
  sendOrderConfirmedEmail: (order, user) => sendEmail(user.email, templates.orderConfirmed(order, user)),
  sendEmail
};