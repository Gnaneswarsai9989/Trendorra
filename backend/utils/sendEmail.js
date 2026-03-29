const { Resend } = require('resend');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY || 're_test_key');

const sendEmail = async ({ to, subject, html }) => {
    try {
        const data = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'Trendorra <onboarding@resend.dev>',
            to,
            subject,
            html,
        });
        console.log(`📧 Standalone Email sent via Resend → ${to} | ID: ${data.id}`);
        return { success: true, data };
    } catch (error) {
        console.error('❌ Resend standalone failed:', error.message);
        return { success: false, error: error.message };
    }
};

module.exports = sendEmail;
