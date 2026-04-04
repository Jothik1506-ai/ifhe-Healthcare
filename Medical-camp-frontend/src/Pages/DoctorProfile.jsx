import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { privateAxios } from '../api/axios';
import ProfileHeader from '../Components/ProfileHeader';
import '../Styles/DoctorProfile.css';

// Add this function at the top level of your component or in a utilities file
const displayValue = (value, fallbackText = 'N/A') => {
  if (value === null || value === undefined || value === '') {
    return <span className="empty-field">{fallbackText}</span>;
  }
  return value;
};

const DoctorProfile = () => {
  const [doctor, setDoctor] = useState(null);
  const [editableDoctor, setEditableDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [analytics, setAnalytics] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();

  const BACKEND_URL = 'https://be-medical-camp.apps.swecha.org';

  useEffect(() => {
    fetchDoctorData();
    fetchDoctorAnalytics();
  }, [id]);

  const fetchDoctorData = async () => {
    setLoading(true);
    try {
      // const response = await axios.get(`${BACKEND_URL}/api/admin/get_doctor/${id}`);
      const response = await privateAxios.get(`/api/admin/get_doctor/${id}`);
      console.log(response.data);
      setDoctor(response.data);
      setEditableDoctor(response.data);
    } catch (error) {
      console.error('Error fetching doctor:', error);
      alert('Error fetching doctor information');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorAnalytics = async () => {
    try {
      const response = await privateAxios.get(`/api/admin/doctor_analytics/${id}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching doctor analytics:', error);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - revert to original data
      setEditableDoctor(doctor);
      setValidationErrors({});
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Fix: Map the form field names to the correct property names
    const fieldMapping = {
      name: 'doctor_name',
      specialization: 'specialization',
      phone: 'doctor_phone_no',
      email: 'doctor_email',
      age: 'doctor_age',
      sex: 'doctor_sex'
    };

    const fieldName = fieldMapping[name] || name;

    setEditableDoctor({
      ...editableDoctor,
      [fieldName]: value
    });

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: null
      });
    }
  };

  // Function to display validation errors temporarily
  const showTemporaryError = (field, message) => {
    setValidationErrors(prev => ({
      ...prev,
      [field]: message
    }));

    // Clear the error message after 5 seconds
    setTimeout(() => {
      setValidationErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }, 5000);

    return false; // Return false to indicate validation failure
  };

  const validateForm = () => {
    let isValid = true;

    // Name validation - required field with minimum length
    if (!editableDoctor.doctor_name || editableDoctor.doctor_name.trim() === '') {
      isValid = showTemporaryError('name', "Name is required");
    } else if (editableDoctor.doctor_name.trim().length < 2) {
      isValid = showTemporaryError('name', "Name must be at least 2 characters");
    }

    // Specialization validation - required field
    if (!editableDoctor.specialization || editableDoctor.specialization.trim() === '') {
      isValid = showTemporaryError('specialization', "Specialization is required");
    }

    // Phone number validation - must be 10 digits if provided
    if (editableDoctor.doctor_phone_no && editableDoctor.doctor_phone_no.trim() !== '') {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(editableDoctor.doctor_phone_no.trim())) {
        isValid = showTemporaryError('phone', "Phone number must be 10 digits");
      }
    }

    // Email validation - valid email format if provided
    if (editableDoctor.doctor_email && editableDoctor.doctor_email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editableDoctor.doctor_email.trim())) {
        isValid = showTemporaryError('email', "Please enter a valid email address");
      }
    }

    // Age validation - must be a reasonable number if provided
    if (editableDoctor.doctor_age) {
      const age = parseInt(editableDoctor.doctor_age);
      if (isNaN(age) || age <= 0 || age > 130) {
        isValid = showTemporaryError('age', "Age must be between 0 and 130");
      }
    }

    return isValid;
  };

  const handleSave = async () => {
    // Validate form before submitting
    if (!validateForm()) {
      return; // Stop submission if validation fails
    }

    setSaving(true);
    try {
      // Fix 1: Change the field names to match expected backend field names
      const doctorToUpdate = {
        doctor_name: editableDoctor.doctor_name,
        specialization: editableDoctor.specialization,
        doctor_phone_no: editableDoctor.doctor_phone_no,
        doctor_email: editableDoctor.doctor_email,
        doctor_age: editableDoctor.doctor_age,
        doctor_sex: editableDoctor.doctor_sex
      };

      // Fix 2: Use the correct HTTP method (PUT instead of POST if your API expects PUT)
      const response = await privateAxios.put(
        `/api/admin/edit_doctor/${id}`,
        doctorToUpdate
      );

      setDoctor(response.data);
      setIsEditing(false);
      alert('Doctor information updated successfully');
    } catch (error) {
      console.error('Error updating doctor:', error);

      if (error.response && error.response.data && error.response.data.message) {
        alert('Update failed: ' + error.response.data.message);
      } else {
        alert('Failed to update doctor information. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Add delete functionality here
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this doctor? This action cannot be undone.')) {
      try {
        // await axios.delete(`${BACKEND_URL}/api/admin/delete_doctor/${id}`);
        await privateAxios.delete(`/api/admin/delete_doctor/${id}`);
        alert('Doctor deleted successfully');
        navigate('/get-doctors');
      } catch (error) {
        console.error('Error deleting doctor:', error);
        alert('Failed to delete doctor. Please try again.');
      }
    }
  };

  const formatMonthYear = (timestamp) => {
    const [year, month] = timestamp.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading doctor information...</p>
      </div>
    );
  }

  if (!doctor) {
    return <div className="error">Doctor not found</div>;
  }

  return (
    <div className="doctor-profile-container">
      <ProfileHeader
        name={doctor.doctor_name}
        gender={doctor.doctor_sex}
        phone={doctor.doctor_phone_no}
        role="Doctor"
        attendanceCount={analytics?.visitCount}
        isEditing={isEditing}
        onEdit={handleEditToggle}
        onDelete={handleDelete}
        onSave={handleSave}
        onCancel={handleEditToggle}
        saving={saving}
      />

      <div className="doctor-profile-card">
        {isEditing ? (
          // Edit mode
          <div className="doctor-edit-form">
            <div className="form-group">
              <label>Name <span className="required">*</span></label>
              <input
                name="name"
                value={editableDoctor.doctor_name || ''}
                onChange={handleInputChange}
                className={`form-control ${validationErrors.name ? 'error-input' : ''}`}
              />
              {validationErrors.name && (
                <div className="error-message">{validationErrors.name}</div>
              )}
            </div>
            <div className="form-group">
              <label>Specialization <span className="required">*</span></label>
              <input
                name="specialization"
                value={editableDoctor.specialization || ''}
                onChange={handleInputChange}
                className={`form-control ${validationErrors.specialization ? 'error-input' : ''}`}
              />
              {validationErrors.specialization && (
                <div className="error-message">{validationErrors.specialization}</div>
              )}
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                name="phone"
                value={editableDoctor.doctor_phone_no || ''}
                onChange={handleInputChange}
                className={`form-control ${validationErrors.phone ? 'error-input' : ''}`}
                placeholder="10-digit number"
              />
              {validationErrors.phone && (
                <div className="error-message">{validationErrors.phone}</div>
              )}
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                name="email"
                value={editableDoctor.doctor_email || ''}
                onChange={handleInputChange}
                className={`form-control ${validationErrors.email ? 'error-input' : ''}`}
                type="email"
              />
              {validationErrors.email && (
                <div className="error-message">{validationErrors.email}</div>
              )}
            </div>
            <div className="form-group">
              <label>Age</label>
              <input
                name="age"
                value={editableDoctor.doctor_age || ''}
                onChange={handleInputChange}
                className={`form-control ${validationErrors.age ? 'error-input' : ''}`}
                type="number"
              />
              {validationErrors.age && (
                <div className="error-message">{validationErrors.age}</div>
              )}
            </div>
            <div className="form-group">
              <label>Sex</label>
              <select
                name="sex"
                value={editableDoctor.doctor_sex || ''}
                onChange={handleInputChange}
                className="form-control"
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        ) : (
          // View mode
          <>
            <div className="doctor-details-container">
              <div className="doctor-detail">
                <strong>Specialization:</strong>
                <span>{displayValue(doctor.specialization)}</span>
              </div>
              <div className="doctor-detail">
                <strong>Email:</strong>
                <span>{displayValue(doctor.doctor_email)}</span>
              </div>
              <div className="doctor-detail">
                <strong>Age:</strong>
                <span>{displayValue(doctor.doctor_age)}</span>
              </div>

              {/* Add Analytics Section */}
              {analytics && (
                <div className="doctor-analytics-section">
                  <h3 className="analytics-title">Camp Visit History</h3>
                  <div className="visit-timeline">
                    {analytics.visits
                      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
                      .map((visit, index) => (
                        <div key={index} className="visit-entry">
                          {formatMonthYear(visit.timestamp)}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <div className="nav-actions">
        <button onClick={() => navigate('/doctor-availability')} className="back-button">
          Back to Doctors Availability Page
        </button>
        <button onClick={() => navigate('/get-doctors')} className="back-button back-button-spacing">
          Back to View Doctors Page
        </button>
      </div>
    </div>
  );
}

export default DoctorProfile;