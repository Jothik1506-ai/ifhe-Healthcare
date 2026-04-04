const crypto = require('crypto');
const axios = require('axios');
const https = require('https');

// Create HTTPS agent that ignores SSL certificate issues (for development only)
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

const generateOtp = () => {
    // 6 digit OTP
    return crypto.randomInt(100000, 999999).toString();
};

const generateExpiryTime = () => {
    const now = new Date();
    // OTP expires in 5 minutes
    now.setMinutes(now.getMinutes() + 5);
    return now;
};

const sendOtpRequest = async (otp, mobile) => {
    // Clean phone number by removing +91 if present
    const cleanPhone = mobile.replace("+91", "").trim();

    // Format the SMS text using the template from env
    const smsText = process.env.OTP_SMS_TEXT?.replace("{otp}", otp) ||
        `Your OTP is: ${otp}. Valid for 5 minutes.`;

    // Prepare the payload for Fast2SMS API
    const payload = {
        route: "dlt_manual",
        sender_id: process.env.OTP_SENDER_ID,
        template_id: process.env.OTP_TEMPLATE_ID,
        message: smsText,
        entity_id: process.env.OTP_ENTITY_ID,
        numbers: cleanPhone,
    };

    // Prepare headers with authorization
    const headers = {
        "authorization": process.env.OTP_API_KEY,
        "Content-Type": "application/json",
    };

    console.log(`Sending OTP SMS to ${mobile} via ${process.env.OTP_SERVICE_URL}`);
    console.log(`Debug: ${cleanPhone}`);

    try {
        const response = await axios.post(process.env.OTP_SERVICE_URL, payload, {
            headers,
            timeout: 30000,
            httpsAgent: httpsAgent,
        });

        const result = response.data;

        // Check if response indicates success
        if (
            result.return === true ||
            (result.request && result.request.id) ||
            (result.message && result.message.toLowerCase().includes("success"))
        ) {
            console.log(`SMS sent successfully. Response:`, result);
            return { status: "success", response: result };
        } else {
            console.error(`SMS service error:`, result);
            return { status: "error", response: result };
        }
    } catch (error) {
        if (error.response) {
            // Server responded with error status
            console.error(`SMS API request failed with status code: ${error.response.status}`);
            console.error(`Response:`, error.response.data);
            return { status: "error", response: error.response.data };
        } else if (error.request) {
            // Request made but no response received
            console.error("No response from SMS API:", error.message);
            return null;
        } else {
            // Error setting up request
            console.error("Error sending OTP:", error.message);
            return null;
        }
    }
};

module.exports = {
    generateOtp,
    generateExpiryTime,
    sendOtpRequest
};
