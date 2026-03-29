const axios = require('axios');

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const sendEmail = async ({ to, subject, html }) => {
    try {
        const response = await axios.post(BREVO_API_URL, {
            sender: { name: "Trendorra", email: "trendorashoppingsai@gmail.com" },
            to: [{ email: to }],
            subject,
            htmlContent: html,
        }, {
            headers: {
                'api-key': process.env.BREVO_API_KEY,
                'content-type': 'application/json',
                'accept': 'application/json'
            }
        });
        console.log(`📧 Standalone Email sent via Brevo → ${to} | ID: ${response.data.messageId}`);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('❌ Brevo standalone failed:', error.response?.data?.message || error.message);
        return { success: false, error: error.message };
    }
};

module.exports = sendEmail;
