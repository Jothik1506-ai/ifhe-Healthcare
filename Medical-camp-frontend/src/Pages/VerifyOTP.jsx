import React, { useState, useEffect } from "react";
import { publicAxios } from "../api/axios";
import { useNavigate } from "react-router-dom";

const VerifyOTP = () => {
    const [otp, setOtp] = useState("");
    const [message, setMessage] = useState("");
    const phone_number = localStorage.getItem("otpContact");
    const navigate = useNavigate();

    useEffect(() => {
        if (!message) return;

        const timer = setTimeout(() => {
            setMessage(""); // auto clear message
        }, 3000); // disappear after 3 sec

        return () => clearTimeout(timer); // cleanup
    }, [message]); // runs every time message changes

    const verifyOtp = async () => {

        try {
            const res = await publicAxios.post("/api/auth/verify-otp", {
                phone_number,
                otp
            });

            const userType = res.data.user.userType;

            console.log("userType", userType);

            localStorage.setItem("authToken", res.data.token);
            localStorage.setItem("userType", userType);
            localStorage.removeItem("otpContact");

            console.log("localStorage", localStorage);

            if(userType === "volunteer"){
                navigate("/dashboard");
            }

            if(userType === "admin"){
                navigate("/dashboard-admin");
            }
        } catch (err) {
            setMessage(err.response?.data?.message || "Invalid OTP");
        }
    };

    return (
        <div className="login-container">
            <h2>Verify OTP</h2>

            {message && <div className="error-message">{message}</div>}

            <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
            />

            <button className="login-button" onClick={verifyOtp}>
                Verify OTP
            </button>
            <button className="back-button" onClick={() => navigate(-1)}>
                ⬅ Back
            </button>
        </div>
    );
};

export default VerifyOTP;
