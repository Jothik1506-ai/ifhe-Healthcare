import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { privateAxios } from '../api/axios';
import ProfileHeader from '../Components/ProfileHeader';
import '../Styles/VolunteerProfile.css';

// Helper function to display empty values consistently
const displayValue = (value, fallbackText = 'N/A') => {
  if (value === null || value === undefined || value === '') {
    return <span className="empty-field">{fallbackText}</span>;
  }
  return value;
};

function VolunteerProfile() {
  const [volunteer, setVolunteer] = useState(null);
  const [editableVolunteer, setEditableVolunteer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [analytics, setAnalytics] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchVolunteerData();
    fetchVolunteerAnalytics();
  }, [id]);

  const fetchVolunteerData = async () => {
    setLoading(true);
    try {
      const response = await privateAxios.get(`/api/admin/get_volunteer/${id}`);
      setVolunteer(response.data);
      setEditableVolunteer(response.data);
    } catch (error) {
      console.error('Error fetching volunteer:', error);
      alert('Error fetching volunteer information');
    } finally {
      setLoading(false);
    }
  };

  const fetchVolunteerAnalytics = async () => {
    try {
      const response = await privateAxios.get(`/api/admin/volunteer_analytics/${id}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching volunteer analytics:', error);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditableVolunteer(volunteer);
      setValidationErrors({});
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableVolunteer({
      ...editableVolunteer,
      [name]: value
    });
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: null
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!editableVolunteer.user_name || editableVolunteer.user_name.trim() === '') {
      errors.user_name = "Username is required";
    }
    if (!editableVolunteer.user_email || editableVolunteer.user_email.trim() === '') {
      errors.user_email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(editableVolunteer.user_email)) {
      errors.user_email = "Email format is invalid";
    }
    if (!editableVolunteer.user_phone_no || editableVolunteer.user_phone_no.trim() === '') {
      errors.user_phone_no = "Phone number is required";
    } else if (!/^\d{10}$/.test(editableVolunteer.user_phone_no)) {
      errors.user_phone_no = "Phone number must be exactly 10 digits";
    }
    if (!editableVolunteer.user_age || isNaN(editableVolunteer.user_age) || editableVolunteer.user_age < 18) {
      errors.user_age = "Age must be at least 18";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const response = await privateAxios.post(`/api/admin/edit_volunteer/${id}`, editableVolunteer);
      setVolunteer(response.data.volunteer);
      setIsEditing(false);
      alert('Volunteer information updated successfully');
    } catch (error) {
      console.error('Error updating volunteer:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update volunteer information. Please try again.';
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this volunteer?')) {
      try {
        await privateAxios.post(`/api/admin/delete_volunteer/${id}`);
        alert('Volunteer deleted successfully');
        navigate('/get-volunteers');
      } catch (error) {
        console.error('Error deleting volunteer:', error);
        alert('Failed to delete volunteer.');
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
        <p>Loading volunteer information...</p>
      </div>
    );
  }

  if (!volunteer) return <div className="error">Volunteer not found</div>;

  return (
    <div className="volunteer-profile-container">
      <ProfileHeader
        name={volunteer.user_name}
        gender="N/A" // Volunteer object doesn't seem to have gender
        phone={volunteer.user_phone_no}
        role="Volunteer"
        attendanceCount={analytics?.visitCount}
        isEditing={isEditing}
        onEdit={handleEditToggle}
        onDelete={handleDelete}
        onSave={handleSave}
        onCancel={handleEditToggle}
        saving={saving}
      />

      <div className="volunteer-profile-card">
        {isEditing ? (
          <div className="volunteer-edit-form">
            <div className="form-group">
              <label htmlFor="user_name">Name:</label>
              <input
                type="text"
                id="user_name"
                name="user_name"
                value={editableVolunteer.user_name || ''}
                onChange={handleInputChange}
                className={validationErrors.user_name ? 'error' : ''}
              />
              {validationErrors.user_name && <div className="error-message">{validationErrors.user_name}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="user_email">Email:</label>
              <input
                type="email"
                id="user_email"
                name="user_email"
                value={editableVolunteer.user_email || ''}
                onChange={handleInputChange}
                className={validationErrors.user_email ? 'error' : ''}
              />
              {validationErrors.user_email && <div className="error-message">{validationErrors.user_email}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="user_phone_no">Phone Number:</label>
              <input
                type="text"
                id="user_phone_no"
                name="user_phone_no"
                value={editableVolunteer.user_phone_no || ''}
                onChange={handleInputChange}
                className={validationErrors.user_phone_no ? 'error' : ''}
                pattern="^(\d{10})?$"
                title="Phone number must be exactly 10 digits or empty"
                maxLength="10"
              />
              {validationErrors.user_phone_no && <div className="error-message">{validationErrors.user_phone_no}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="user_age">Age:</label>
              <input
                type="number"
                id="user_age"
                name="user_age"
                value={editableVolunteer.user_age || ''}
                onChange={handleInputChange}
                className={validationErrors.user_age ? 'error' : ''}
              />
              {validationErrors.user_age && <div className="error-message">{validationErrors.user_age}</div>}
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="text"
                name="user_password"
                value={editableVolunteer.user_password || ''}
                onChange={handleInputChange}
                className="form-control"
              />
            </div>
          </div>
        ) : (
          <>
            <div className="volunteer-details-container">
              <div className="volunteer-detail"><strong>User ID:</strong><span>{displayValue(volunteer.user_id)}</span></div>
              <div className="volunteer-detail"><strong>Email:</strong><span>{displayValue(volunteer.user_email)}</span></div>
              <div className="volunteer-detail"><strong>Age:</strong><span>{displayValue(volunteer.user_age)}</span></div>
              <div className="volunteer-detail">
                <strong>Password:</strong>
                <span>{displayValue(volunteer.user_password)}</span>
              </div>
            </div>
            {analytics && (
              <div className="volunteer-analytics-section">
                <h3 className="analytics-title">Camp Visit History</h3>
                {analytics.visits && analytics.visits.length > 0 ? (
                  <div className="visit-timeline">
                    {analytics.visits
                      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
                      .map((visit, index) => (
                        <div key={index} className="visit-entry">
                          {formatMonthYear(visit.timestamp)}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="no-visits-message">No camp visits recorded yet.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <div className="nav-actions">
        <button onClick={() => navigate('/get-volunteers')} className="back-button">Back to Volunteers List</button>
      </div>
    </div>
  );
}

export default VolunteerProfile;
