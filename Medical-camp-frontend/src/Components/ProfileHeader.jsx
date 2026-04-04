import React from 'react';
import '../Styles/ProfileHeader.css';

const ProfileHeader = ({
  name,
  gender,
  phone,
  role,
  attendanceCount,
  isEditing,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  saving
}) => {
  const displayValue = (value, fallbackText = 'N/A') => {
    if (value === null || value === undefined || value === '') {
      return <span className="empty-field">{fallbackText}</span>;
    }
    return value;
  };

  return (
    <div className="profile-header-container">
      <div className="profile-header-top">
        <h1>{role} Profile</h1>
        {!isEditing ? (
          <div className="header-actions">
            <button className="edit-button" onClick={onEdit}>
              Edit
            </button>
            <button className="delete-button" onClick={onDelete}>
              Delete
            </button>
          </div>
        ) : (
          <div className="action-buttons">
            <button 
              className="save-button" 
              onClick={onSave} 
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button className="cancel-button" onClick={onCancel}>
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="profile-common-info">
        <div className="profile-avatar">
          {name?.charAt(0).toUpperCase() || role.charAt(0)}
        </div>
        <div className="profile-info-grid">
          <div className="info-item">
            <span className="info-label">Name</span>
            <span className="info-value">{displayValue(name)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Gender</span>
            <span className="info-value">{displayValue(gender)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Phone</span>
            <span className="info-value">{displayValue(phone)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Role</span>
            <span className="info-value role-badge">{role}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Attendance</span>
            <span className="info-value highlight">{attendanceCount || 0} Camps</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
