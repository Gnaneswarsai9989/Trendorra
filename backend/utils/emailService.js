const { Resend } = require('resend');

// Simple Resend Setup
const resend = new Resend(process.env.RESEND_API_KEY);

const templates = {
  // Simple HTML order confirmation
  orderConfirmed: (order, user) => ({
    subject: `Order Confirmed: #${order._id.toString().slice(-8).toUpperCase()}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Thank you for your order, ${user.name}!</h2>
        <p>Your order <strong>#${order._id}</strong> has been confirmed.</p>
        <p><strong>Total Amount:</strong> ₹${order.totalPrice}</p>
        <p>We'll notify you when it's shipped.</p>
        <hr />
        <p style="font-size: 12px; color: #666;">Trendorra Fashion</p>
      </div>
    `
  })
};

const sendEmail = async (to, template) => {
  try {
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: to,
      subject: template.subject,
      html: template.html,
    });
    console.log(`Email sent to ${to}: ${data.id}`);
    return data;
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err.message);
    throw err;
  }
};

module.exports = {
  sendOrderConfirmedEmail: (order, user) => sendEmail(user.email, templates.orderConfirmed(order, user)),
  sendEmail
};