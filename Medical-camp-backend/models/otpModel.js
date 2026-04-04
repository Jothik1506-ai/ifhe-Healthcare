const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
    // We identify the record by phone number, not a user_id
    phone_number: {
        type: String,
        required: true,
        unique: true // Good practice to ensure only one OTP per number
    },
    otp: {
        type: String,
        required: true
    },
    // FIX: Temporarily store user data here instead of requiring a user_id
    userData: {
        user_name: { type: String, required: false },
        user_email: { type: String, required: false },
        user_age: { type: Number, required: false },
        user_password: { type: String, required: false }, // This will be the HASHED password
    },
    createdAt: {
        type: Date,
        default: Date.now,
        // The document will be automatically deleted after 5 minutes (300 seconds)
        expires: 300
    }
});

const OTP = mongoose.model('OTP', OTPSchema);

module.exports = OTP;
