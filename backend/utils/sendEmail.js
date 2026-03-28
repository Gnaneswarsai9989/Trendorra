// backend/utils/sendEmail.js
const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // Use STARTTLS
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: `"Trendorra" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });

        console.log(`✅ Email sent to ${to}`);
    } catch (err) {
        console.error('❌ Email send failed:', err.message);
        // Don't throw — email failure shouldn't crash the app
    }
};

module.exports = sendEmail;

