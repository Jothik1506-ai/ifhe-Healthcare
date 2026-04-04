import React, { useState, useEffect } from "react";
import { publicAxios } from "../api/axios";
import { useNavigate } from "react-router-dom";

const LoginOTP = () => {
    const [phone, setPhone] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        if (!message) return;

        const timer = setTimeout(() => {
            setMessage(""); // auto clear message
        }, 3000); // disappear after 3 sec

        return () => clearTimeout(timer); // cleanup
    }, [message]); // runs every time message changes

    const sendOtp = async () => {
        if (!phone) {
            setMessage("Please enter mobile number");
            return;
        }

        try {
            const res = await publicAxios.post("/api/auth/send-otp", {
                user_phone_no: phone
            });

            if (res.data.message) {
                localStorage.setItem("otpContact", phone);
                navigate("/verify-otp");
            }
        } catch (err) {
            setMessage(err.response?.data?.message || "Error sending OTP");
        }
    };

    return (
        <div className="login-container">
            <h2>Login with OTP</h2>

            {message && <div className="error-message">{message}</div>}

            <input
                type="text"
                placeholder="Enter mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
            />

            <button className="login-button" onClick={sendOtp}>
                Send OTP
            </button>
            <button className="back-button" onClick={() => navigate(-1)}>
                ⬅ Back
            </button>
        </div>
    );
};

export default LoginOTP;
