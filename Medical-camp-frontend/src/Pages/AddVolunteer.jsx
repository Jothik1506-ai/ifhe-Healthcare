import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { privateAxios, publicAxios } from "../api/axios";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const styles = {
    container: {
        padding: "20px",
        width: "100%",
        maxWidth: "500px",
        margin: "40px auto",
        backgroundColor: "#ffffff",
        borderRadius: "10px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        boxSizing: "border-box",
    },
    containerDesktop: {
        padding: "40px",
    },
    h2: {
        textAlign: "center",
        color: "#333",
        marginBottom: "25px",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    group: {
        display: "flex",
        flexDirection: "column",
    },
    label: {
        marginBottom: "8px",
        fontWeight: "600",
        color: "#555",
    },
    required: {
        color: "#d9534f",
        marginLeft: "4px",
    },
    input: {
        padding: "12px 15px",
        border: "1px solid #ccc",
        borderRadius: "6px",
        fontSize: "1rem",
        transition: "border-color 0.3s, box-shadow 0.3s",
    },
    errorInput: {
        borderColor: "#d9534f",
    },
    fieldError: {
        color: "#d9534f",
        fontSize: "0.875rem",
        marginTop: "5px",
    },
    messageBase: {
        padding: "15px",
        marginBottom: "20px",
        borderRadius: "6px",
        textAlign: "center",
    },
    successMessage: {
        backgroundColor: "#d4edda",
        color: "#155724",
        border: "1px solid #c3e6cb",
    },
    errorMessage: {
        backgroundColor: "#f8d7da",
        color: "#721c24",
        border: "1px solid #f5c6cb",
    },
    submitButton: {
        padding: "15px",
        width: "100%",
        fontSize: "1.1rem",
        fontWeight: "700",
        borderRadius: "6px",
        border: "none",
        backgroundColor: "#007bff",
        color: "#fff",
        cursor: "pointer",
        transition: "0.2s",
    },
    submitButtonHover: {
        backgroundColor: "#0056b3",
        transform: "translateY(-2px)",
    },
    submitButtonDisabled: {
        backgroundColor: "#a0c3e6",
        cursor: "not-allowed",
        transform: "none",
    },
};

const isAllSameChar = (s) => [...s].every((c) => c === s[0]);

// ---------------------- ZOD VALIDATION --------------------------
const signupSchema = z.object({
    user_name: z
        .string()
        .min(3, "Name must be at least 3 characters")
        .refine((v) => /^[A-Za-z ]+$/.test(v), {
            message: "Name can contain letters and spaces only",
        })
        .transform((s) => s.trim()),

    user_phone_no: z
        .string()
        .refine((v) => /^[0-9\s+()-]+$/.test(v), {
            message: "Invalid characters in phone number",
        })
        .transform((s) => s.replace(/\s+/g, "").replace(/\D/g, ""))
        .refine((d) => d.length === 10 || d.length === 12, {
            message: "Phone must be 10 digits (or include country code)",
        })
        .refine((digits) => {
            if (digits.length === 12) {
                return digits.startsWith("91") && /^[6-9]/.test(digits.slice(2));
            }
            return /^[6-9]/.test(digits);
        }, {
            message: "Phone number must start with 6–9",
        })
    // .transform((digits) => {
    //     if (digits.length === 10) return `+91${digits}`;
    //     return `+${digits}`;
    // })
    ,

    user_email: z
        .string()
        .email("Invalid email address")
        .transform((s) => s.trim().toLowerCase()),

    user_age: z
        .string()
        .refine((v) => {
            const n = Number(v);
            return n >= 0 && n <= 100;
        }, "Age must be between 0 and 100"),

    user_password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .refine((pw) => /[A-Za-z]/.test(pw) && /[0-9]/.test(pw), {
            message: "Password must include letters and numbers",
        })
        .refine((pw) => !isAllSameChar(pw), {
            message: "Password cannot be repeated characters",
        }),
});

const AddVolunteer = ({ fromLogin = false }) => {
    const {
        register,
        handleSubmit,
        getValues,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(signupSchema),
        mode: "onChange",
    });

    const [showOtpField, setShowOtpField] = useState(false);
    const [otp, setOtp] = useState("");
    const [otpError, setOtpError] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();

    // RESPONSIVE VIEW
    const [isButtonHovered, setIsButtonHovered] = useState(false);
    const [isDesktopView, setIsDesktopView] = useState(window.innerWidth >= 600);

    useEffect(() => {
        const resize = () => setIsDesktopView(window.innerWidth >= 600);
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, []);

    // ------------------ OTP Verification ------------------
    const handleOtpVerification = async () => {
        setOtpError("");
        setError("");
        if (!/^\d{6}$/.test(otp)) {
            setOtpError("OTP must be 6 digits");
            return;
        }
        setIsLoading(true);

        try {
            await publicAxios.post("/api/auth/signup-verify-otp", {
                phone_no: getValues("user_phone_no"),
                otp,
            });

            setMessage("Account created successfully!");
            setTimeout(() => navigate("/"), 2000);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to verify OTP");
        } finally {
            setIsLoading(false);
        }
    };

    // ----------------------- MAIN SUBMIT -----------------------
    const onSubmitForm = async (data) => {
        setError("");
        setMessage("");

        if (showOtpField) {
            return await handleOtpVerification();
        }

        setIsLoading(true);

        try {
            if (fromLogin) {
                await publicAxios.post("/api/auth/signup-send-otp", data);
                setShowOtpField(true);
                setMessage("OTP sent to your phone!");
            } else {
                await privateAxios.post("/api/admin/add_volunteer?verifyOtp=false", data);
                setMessage("Volunteer created successfully!");
                setTimeout(() => navigate("/get-volunteers"), 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const containerStyle = isDesktopView
        ? { ...styles.container, ...styles.containerDesktop }
        : styles.container;

    let buttonStyle = styles.submitButton;
    if (isLoading) buttonStyle = { ...buttonStyle, ...styles.submitButtonDisabled };
    else if (isButtonHovered) buttonStyle = { ...buttonStyle, ...styles.submitButtonHover };

    return (
        <div style={containerStyle}>
            <h2 style={styles.h2}>
                {fromLogin ? "Create Your Account" : "Add New Volunteer"}
            </h2>

            {message && (
                <div style={{ ...styles.messageBase, ...styles.successMessage }}>{message}</div>
            )}
            {error && (
                <div style={{ ...styles.messageBase, ...styles.errorMessage }}>{error}</div>
            )}

            <form onSubmit={handleSubmit(onSubmitForm)} style={styles.form} noValidate>
                {!showOtpField && (
                    <>
                        {/* USERNAME */}
                        <div style={styles.group}>
                            <label style={styles.label}>
                                Username <span style={styles.required}>*</span>
                            </label>
                            <input
                                type="text"
                                {...register("user_name")}
                                placeholder="Enter username"
                                style={errors.user_name ? { ...styles.input, ...styles.errorInput } : styles.input}
                            />
                            {errors.user_name && (
                                <div style={styles.fieldError}>{errors.user_name.message}</div>
                            )}
                        </div>

                        {/* EMAIL */}
                        <div style={styles.group}>
                            <label style={styles.label}>
                                Email <span style={styles.required}>*</span>
                            </label>
                            <input
                                type="email"
                                {...register("user_email")}
                                placeholder="Enter email"
                                style={errors.user_email ? { ...styles.input, ...styles.errorInput } : styles.input}
                            />
                            {errors.user_email && (
                                <div style={styles.fieldError}>{errors.user_email.message}</div>
                            )}
                        </div>

                        {/* PHONE */}
                        <div style={styles.group}>
                            <label style={styles.label}>
                                Phone Number <span style={styles.required}>*</span>
                            </label>
                            <input
                                type="tel"
                                {...register("user_phone_no")}
                                placeholder="Enter phone number"
                                style={errors.user_phone_no ? { ...styles.input, ...styles.errorInput } : styles.input}
                            />
                            {errors.user_phone_no && (
                                <div style={styles.fieldError}>{errors.user_phone_no.message}</div>
                            )}
                        </div>

                        {/* AGE */}
                        <div style={styles.group}>
                            <label style={styles.label}>
                                Age <span style={styles.required}>*</span>
                            </label>
                            <input
                                type="number"
                                {...register("user_age")}
                                placeholder="Enter age"
                                style={errors.user_age ? { ...styles.input, ...styles.errorInput } : styles.input}
                            />
                            {errors.user_age && (
                                <div style={styles.fieldError}>{errors.user_age.message}</div>
                            )}
                        </div>

                        {/* PASSWORD */}
                        <div style={styles.group}>
                            <label style={styles.label}>
                                Password <span style={styles.required}>*</span>
                            </label>
                            <input
                                type="password"
                                {...register("user_password")}
                                placeholder="Enter password"
                                style={errors.user_password ? { ...styles.input, ...styles.errorInput } : styles.input}
                            />
                            {errors.user_password && (
                                <div style={styles.fieldError}>{errors.user_password.message}</div>
                            )}
                        </div>
                    </>
                )}

                {/* OTP FIELD */}
                {showOtpField && (
                    <div style={styles.group}>
                        <label style={styles.label}>
                            OTP <span style={styles.required}>*</span>
                        </label>
                        <input
                            value={otp}
                            maxLength={6}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Enter OTP"
                            style={otpError ? { ...styles.input, ...styles.errorInput } : styles.input}
                        />
                        {otpError && <div style={styles.fieldError}>{otpError}</div>}
                    </div>
                )}

                <button
                    type="submit"
                    style={buttonStyle}
                    disabled={isLoading}
                    onMouseEnter={() => setIsButtonHovered(true)}
                    onMouseLeave={() => setIsButtonHovered(false)}
                >
                    {isLoading
                        ? showOtpField ? "Verifying..." : "Submitting..."
                        : showOtpField ? "Verify OTP" : fromLogin ? "Sign Up" : "Add Volunteer"}
                </button>
            </form>
        </div>
    );
};

export default AddVolunteer;
