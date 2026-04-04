import React, { useState } from "react";
import { privateAxios } from "../api/axios";
import { useNavigate } from "react-router-dom";
import '../Styles/Doctor.css';

function AddDoctor() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        doctor_name: '',
        doctor_email: '',
        doctor_phone_no: '',
        doctor_age: '',
        specialization: '',
        doctor_sex: ''
    });

    const [fieldErrors, setFieldErrors] = useState({
        doctor_name: '',
        doctor_email: '',
        doctor_phone_no: '',
        doctor_age: '',
        specialization: '',
        doctor_sex: ''
    });

    const validateField = (name, value) => {
        let errorMessage = '';
        
        // Not all fields are required
        if (!value && (name === 'doctor_name' || name === 'doctor_phone_no' || name === 'specialization')) {
            return 'This field is required';
        }
        
        switch (name) {
            case 'doctor_email':
                if (value && !/\S+@\S+\.\S+/.test(value)) {
                    errorMessage = 'Please enter a valid email address';
                }
                break;
            case 'doctor_phone_no':
                if (!/^\d{10}$/.test(value)) {
                    errorMessage = 'Phone number must be exactly 10 digits';
                }
                break;
            case 'doctor_age':
                if (value) {
                    const age = parseInt(value);
                    if (isNaN(age) || age <= 0) {
                        errorMessage = 'Age must be a positive number';
                    }
                }
                break;
            default:
                break;
        }
        
        return errorMessage;
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        const fieldName = id === 'addDoctorName' ? 'doctor_name' :
            id === 'addDoctorEmail' ? 'doctor_email' :
                id === 'addDoctorPhone' ? 'doctor_phone_no' :
                    id === 'addDoctorAge' ? 'doctor_age' :
                        id === 'addDoctorSpecialization' ? 'specialization' :
                            id === 'addDoctorSex' ? 'doctor_sex' : id;
        
        setFormData({
            ...formData,
            [fieldName]: value
        });
        
        // Clear field error when user starts typing
        setFieldErrors({
            ...fieldErrors,
            [fieldName]: ''
        });
    };

    const validateForm = () => {
        const newErrors = {};
        let isValid = true;
        
        // Validate required fields and field formats
        Object.keys(formData).forEach(key => {
            const error = validateField(key, formData[key]);
            if (error) {
                newErrors[key] = error;
                isValid = false;
            }
        });
        
        setFieldErrors(newErrors);
        return isValid;
    };

    const addDoctor = () => {
        setError('');
        setSuccess('');
        
        // Validate form before submission
        if (!validateForm()) {
            setError('Please correct the errors before submitting');
            return;
        }
        
        setIsLoading(true);

        privateAxios.post('/api/admin/add_doctor', formData)
            .then((response) => {
                if (response.data) {
                    setSuccess('Doctor added successfully');
                    setFormData({
                        doctor_name: '',
                        doctor_email: '',
                        doctor_phone_no: '',
                        doctor_age: '',
                        specialization: '',
                        doctor_sex: ''
                    });
                } else {
                    setError('Received invalid response from server');
                }
            })
            .catch((error) => {
                console.log(error);
                if (error.response && error.response.status === 400 && error.response.data) {
                    // Display the specific error message from the server
                    setError(error.response.data);
                } else {
                    // Use the fallback message for other errors
                    setError(error.response?.data?.message || 'Error while adding a doctor');
                }
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    return (
        <div className="add-doctor-page">
            <header className="add-doctor-header">
                <h1>Add New Doctor</h1>
            </header>

            <div className="add-doctor-content">
                <div className="add-doctor-form-section">
                    <h2>Doctor Information</h2>
                    <div className="add-doctor-form">
                        {error && <div className="add-doctor-error">{error}</div>}
                        {success && <div className="add-doctor-success">{success}</div>}
                        
                        <div className="add-doctor-group">
                            <label htmlFor="addDoctorName">
                                Name <span className="required">*</span>
                            </label>
                            <input
                                id="addDoctorName"
                                type="text"
                                placeholder="Name"
                                value={formData.doctor_name}
                                onChange={handleInputChange}
                                className={fieldErrors.doctor_name ? "error-input" : ""}
                            />
                            {fieldErrors.doctor_name && <div className="field-error">{fieldErrors.doctor_name}</div>}
                        </div>
                        
                        <div className="add-doctor-group">
                            <label htmlFor="addDoctorEmail">Email</label>
                            <input
                                id="addDoctorEmail"
                                type="email"
                                placeholder="Email"
                                value={formData.doctor_email}
                                onChange={handleInputChange}
                                className={fieldErrors.doctor_email ? "error-input" : ""}
                            />
                            {fieldErrors.doctor_email && <div className="field-error">{fieldErrors.doctor_email}</div>}
                        </div>
                        
                        <div className="add-doctor-group">
                            <label htmlFor="addDoctorPhone">
                                Phone <span className="required">*</span>
                            </label>
                            <input
                                id="addDoctorPhone"
                                type="text"
                                placeholder="Phone (10 digits)"
                                value={formData.doctor_phone_no}
                                onChange={handleInputChange}
                                maxLength="10"
                                className={fieldErrors.doctor_phone_no ? "error-input" : ""}
                            />
                            {fieldErrors.doctor_phone_no && <div className="field-error">{fieldErrors.doctor_phone_no}</div>}
                        </div>
                        
                        <div className="add-doctor-group">
                            <label htmlFor="addDoctorAge">Age</label>
                            <input
                                id="addDoctorAge"
                                type="number"
                                placeholder="Age"
                                value={formData.doctor_age}
                                onChange={handleInputChange}
                                className={fieldErrors.doctor_age ? "error-input" : ""}
                            />
                            {fieldErrors.doctor_age && <div className="field-error">{fieldErrors.doctor_age}</div>}
                        </div>
                        
                        <div className="add-doctor-group">
                            <label htmlFor="addDoctorSpecialization">
                                Specialization <span className="required">*</span>
                            </label>
                            <input
                                id="addDoctorSpecialization"
                                type="text"
                                placeholder="Specialization"
                                value={formData.specialization}
                                onChange={handleInputChange}
                                className={fieldErrors.specialization ? "error-input" : ""}
                            />
                            {fieldErrors.specialization && <div className="field-error">{fieldErrors.specialization}</div>}
                        </div>
                        
                        <div className="add-doctor-group">
                            <label htmlFor="addDoctorSex">Sex</label>
                            <select
                                id="addDoctorSex"
                                value={formData.doctor_sex}
                                onChange={handleInputChange}
                                className={fieldErrors.doctor_sex ? "error-input" : ""}
                            >
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                            {fieldErrors.doctor_sex && <div className="field-error">{fieldErrors.doctor_sex}</div>}
                        </div>
                        
                        <button
                            className="add-doctor-btn"
                            onClick={addDoctor}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Adding...' : 'Add Doctor'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddDoctor;
