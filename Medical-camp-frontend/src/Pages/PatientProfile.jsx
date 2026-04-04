import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { privateAxios } from '../api/axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ProfileHeader from '../Components/ProfileHeader';
import '../Styles/PatientProfile.css';

// Helper function to display empty values consistently
const displayValue = (value, fallbackText = 'N/A') => {
  if (value === null || value === undefined || value === '') {
    return <span className="empty-field">{fallbackText}</span>;
  }
  return value;
};

function PatientProfile() {
  const [patient, setPatient] = useState(null);
  const [editablePatient, setEditablePatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [analytics, setAnalytics] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatientData();
    fetchPatientAnalytics();
  }, [id]);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      const response = await privateAxios.get(`/api/admin/get_patient/${id}`);
      setPatient(response.data);
      setEditablePatient(response.data);
    } catch (error) {
      console.error('Error fetching patient:', error);
      alert('Error fetching patient information');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientAnalytics = async () => {
    try {
      const response = await privateAxios.get(`/api/admin/patient_analytics/${id}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching patient analytics:', error);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditablePatient(patient);
      setValidationErrors({});
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditablePatient({
      ...editablePatient,
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

    if (!editablePatient.patient_name || editablePatient.patient_name.trim() === '') {
      errors.patient_name = "Name is required";
    }

    if (!editablePatient.patient_age) {
      errors.patient_age = "Age is required";
    }

    if (!editablePatient.patient_sex) {
      errors.patient_sex = "Sex is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const response = await privateAxios.post(
        `/api/admin/edit_patient/${id}`,
        editablePatient
      );

      setPatient(response.data.patient);
      setIsEditing(false);
      alert('Patient information updated successfully');
    } catch (error) {
      console.error('Error updating patient:', error);
      alert('Failed to update patient information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
      try {
        await privateAxios.post(`/api/admin/delete_patient/${id}`);
        alert('Patient deleted successfully');
        navigate('/view-patients');
      } catch (error) {
        console.error('Error deleting patient:', error);
        alert('Failed to delete patient. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading patient information...</p>
      </div>
    );
  }

  if (!patient) {
    return <div className="error">Patient not found</div>;
  }

  return (
    <div className="patient-profile-container">
      <ProfileHeader
        name={patient.patient_name}
        gender={patient.patient_sex}
        phone={patient.patient_phone_no}
        role="Patient"
        attendanceCount={analytics?.visitCount}
        isEditing={isEditing}
        onEdit={handleEditToggle}
        onDelete={handleDelete}
        onSave={handleSave}
        onCancel={handleEditToggle}
        saving={saving}
      />

      <div className="patient-profile-card">
        {!isEditing ? (
          <>
            <div className="patient-details-container">
              <div className="patient-detail">
                <strong>Book Number:</strong>
                <span>{displayValue(patient.book_no)}</span>
              </div>
              <div className="patient-detail">
                <strong>Age:</strong>
                <span>{displayValue(patient.patient_age)}</span>
              </div>
              <div className="patient-detail">
                <strong>Area:</strong>
                <span>{displayValue(patient.patient_area)}</span>
              </div>

              {analytics && (
                <div className="patient-analytics-section">
                  <h3 className="analytics-title">Clinic Visit History</h3>

                  {analytics.bpData && analytics.bpData.length > 0 && (
                    <>
                      <h3 className="analytics-title">Blood Pressure Trends</h3>
                      <div className="bp-chart">
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={analytics.bpData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="timestamp"
                              tickFormatter={(timestamp) => {
                                const [year, month] = timestamp.split('-');
                                return `${month}/${year.slice(2)}`;
                              }}
                            />
                            <YAxis domain={[60, 180]} />
                            <Tooltip
                              labelFormatter={(timestamp) => {
                                const [year, month] = timestamp.split('-');
                                return `${month}/${year}`;
                              }}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="systolic"
                              stroke="#8884d8"
                              name="Systolic"
                              dot={{ r: 4 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="diastolic"
                              stroke="#82ca9d"
                              name="Diastolic"
                              dot={{ r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="patient-edit-form">
            <div className="form-group">
              <label>Name <span className="required">*</span></label>
              <input
                name="patient_name"
                value={editablePatient.patient_name || ''}
                onChange={handleInputChange}
                className={`form-control ${validationErrors.patient_name ? 'error-input' : ''}`}
              />
              {validationErrors.patient_name && (
                <div className="error-message">{validationErrors.patient_name}</div>
              )}
            </div>
            <div className="form-group">
              <label>Age <span className="required">*</span></label>
              <input
                name="patient_age"
                type="number"
                value={editablePatient.patient_age || ''}
                onChange={handleInputChange}
                className={`form-control ${validationErrors.patient_age ? 'error-input' : ''}`}
              />
              {validationErrors.patient_age && (
                <div className="error-message">{validationErrors.patient_age}</div>
              )}
            </div>
            <div className="form-group">
              <label>Sex <span className="required">*</span></label>
              <select
                name="patient_sex"
                value={editablePatient.patient_sex || ''}
                onChange={handleInputChange}
                className={`form-control ${validationErrors.patient_sex ? 'error-input' : ''}`}
              >
                <option value="">Select Sex</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {validationErrors.patient_sex && (
                <div className="error-message">{validationErrors.patient_sex}</div>
              )}
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                name="patient_phone_no"
                value={editablePatient.patient_phone_no || ''}
                onChange={handleInputChange}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>Area</label>
              <input
                name="patient_area"
                value={editablePatient.patient_area || ''}
                onChange={handleInputChange}
                className="form-control"
              />
            </div>
          </div>
        )}
      </div>
      <div className="nav-actions">
        <button
          onClick={() => {
            navigate('/patient-status'); // Navigate to the base patient status page
          }}
          className="view-status-button"
        >
          View Patient Status
        </button>
        <button onClick={() => navigate('/view-patients')} className="back-button">
          Back to Patients List
        </button>
      </div>
    </div>
  );
}

export default PatientProfile;
