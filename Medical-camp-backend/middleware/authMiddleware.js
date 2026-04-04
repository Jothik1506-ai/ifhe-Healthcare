const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Log = require('../models/logModel');
const User = require('../models/userModel');

const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer TOKEN"

        // Skip token validation for login/public routes
        if (req.path === '/api/auth/login' || req.path === "/api/auth/verify-otp" || req.path === "/api/auth/add-volunteer" || req.method === 'OPTIONS') {
            return next();
        }

        // If no token for protected routes
        if (!token) {
            // Just log and continue for now to maintain compatibility
            console.log("No auth token provided");
            return next();
            // return res.status(401).json({ message: 'No token, authorization denied' });
        }

        // Verify token
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                console.log("Invalid token:", err.message);
                // Just log for now to maintain compatibility
                return next();
                // return res.status(401).json({ message: 'Token is not valid' });
            }

            // Add user from payload to request
            req._user = decoded;
            console.log("Authenticated user:", decoded);
            next();
        });
    } catch (error) {
        console.error("Auth middleware error:", error);
        next(); // Continue to maintain compatibility
    }
};

module.exports = authMiddleware;
