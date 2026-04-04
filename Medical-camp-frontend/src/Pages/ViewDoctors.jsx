import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Styles/ViewDoctor.css';
import { privateAxios } from '../api/axios';

function ViewDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [specializations, setSpecializations] = useState([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = () => {
    setIsLoading(true);
    setError('');

    privateAxios.get('/api/admin/get_doctors')
      .then(response => {
        setDoctors(response.data);

        // Extract unique specializations for filter dropdown
        const uniqueSpecializations = [...new Set(
          response.data
            .map(doctor => doctor.specialization)
            .filter(specialization => specialization) // Remove undefined/empty values
        )];
        setSpecializations(uniqueSpecializations);
      })
      .catch(error => {
        console.error('Error fetching doctors:', error);
        setError('Failed to load doctors. Please try again later.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleRowClick = (doctorId) => {
    // Navigate to doctor profile page
    navigate(`/doctor/${doctorId}`);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSpecializationChange = (e) => {
    setSelectedSpecialization(e.target.value);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSpecialization('');
  };

  // Filter doctors based on search query and selected specialization
  const filteredDoctors = doctors.filter(doctor => {
    const nameMatch = (doctor.doctor_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const specializationMatch = selectedSpecialization === '' || doctor.specialization === selectedSpecialization;
    return nameMatch && specializationMatch;
  });

  return (
    <div className="doctor-container">
      <h1>Doctors</h1>

      {error && <div className="error-message">{error}</div>}

      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading doctors...</p>
        </div>
      ) : (
        <>
          <div className="doctor-filters">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search by doctor name"
                value={searchQuery}
                onChange={handleSearchChange}
                className="doctor-search-input"
              />
            </div>

            <div className="filter-container">
              <select
                value={selectedSpecialization}
                onChange={handleSpecializationChange}
                className="specialization-filter"
              >
                <option value="">All Specializations</option>
                {specializations.map((specialization, index) => (
                  <option key={index} value={specialization}>
                    {specialization}
                  </option>
                ))}
              </select>

              <button onClick={resetFilters} className="reset-filters-btn">
                Reset Filters
              </button>
            </div>
          </div>

          {filteredDoctors.length > 0 ? (
            <div className="doctors-grid">
              {filteredDoctors.map((doctor, index) => (
                <div
                  key={doctor._id || index}
                  className="doctor-card"
                  onClick={() => handleRowClick(doctor._id || index)}
                >
                  <div className="doctor-card-header">
                    <span className="doctor-icon">👨‍⚕️</span>
                  </div>
                  <div className="doctor-info">
                    <p className="doctor-name">{doctor.doctor_name}</p>
                    <p className="doctor-details">Gender: {doctor.doctor_sex || 'N/A'}</p>
                    <p className="doctor-details">Phone: {doctor.doctor_phone_no}</p>
                    <p className="doctor-details">Role: Doctor</p>
                    <p className="doctor-details">Attendance: {doctor.list_of_visits ? doctor.list_of_visits.length : 0}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">No doctors found matching your criteria</div>
          )}
        </>
      )}
    </div>
  );
}

export default ViewDoctors;