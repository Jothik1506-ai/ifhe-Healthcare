import React, { useEffect, useState } from 'react';
import { privateAxios } from '../api/axios';
import { useNavigate } from 'react-router-dom';
import '../Styles/ViewVolunteer.css';

function ViewVolunteers() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const fetchVolunteers = async () => {
    setLoading(true);
    try {
      const response = await privateAxios.get('/api/admin/get_volunteers');
      setVolunteers(response.data);
    } catch (error) {
      console.error('Error fetching volunteers:', error);
      alert('Error fetching volunteers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (volunteerId) => {
    // Navigate to volunteer profile page
    navigate(`/volunteer/${volunteerId}`);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Filter volunteers based on search query
  const filteredVolunteers = volunteers.filter(volunteer =>
    (volunteer.user_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="volunteer-container">
      <h1>Volunteers</h1>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading volunteers...</p>
        </div>
      ) : volunteers.length === 0 ? (
        <div className="no-data-container">
          <i className="fas fa-user-times fa-3x"></i>
          <p>No volunteers found.</p>
          <button
            className="add-volunteer-button"
            onClick={() => navigate('/add-volunteer')}
          >
            Add New Volunteer
          </button>
        </div>
      ) : (
        <>
          <div className="actions-bar">
            <div className="volunteer-search-box">
              <input
                type="text"
                placeholder="Search volunteers by name..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="volunteer-search-input"
              />
            </div>
            <button
              className="add-volunteer-button"
              onClick={() => navigate('/add-volunteer')}
            >
              Add New Volunteer
            </button>
          </div>

          {filteredVolunteers.length > 0 ? (
            <div className="volunteers-grid">
              {filteredVolunteers.map((volunteer) => (
                <div
                  key={volunteer._id}
                  className="volunteer-card"
                  onClick={() => handleRowClick(volunteer._id)}
                >
                  <div className="volunteer-card-header">
                    <span className="volunteer-icon">👥</span>
                  </div>
                  <div className="volunteer-info">
                    <p className="volunteer-name">{volunteer.user_name}</p>
                    <p className="volunteer-details">Gender: N/A</p>
                    <p className="volunteer-details">Phone: {volunteer.user_phone_no || '-'}</p>
                    <p className="volunteer-details">Role: Volunteer</p>
                    <p className="volunteer-details">Attendance: {volunteer.list_of_visits ? volunteer.list_of_visits.length : 0}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">No volunteers found matching your search</div>
          )}
        </>
      )}
    </div>
  );
}

export default ViewVolunteers;