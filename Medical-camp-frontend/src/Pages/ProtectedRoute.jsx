import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({children , requiredType}) => {
    const authToken = localStorage.getItem('authToken');
    const userType = localStorage.getItem('userType');

    if (!authToken) {
        return <Navigate to="/" replace />;
    }

    // console.log("User Type:", userType);
    // console.log("Required Type:", requiredType);

    if (requiredType && userType !== requiredType) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default ProtectedRoute;