import React, { useState, useEffect } from 'react';
import { privateAxios } from '../api/axios';
import '../Styles/PatientStatusPage.css';

const PatientStatusPage = () => {
  const [inputBookNumber, setInputBookNumber] = useState('');
  const [currentBookNumber, setCurrentBookNumber] = useState('');
  const [patientStatus, setPatientStatus] = useState(null);
  const [loading, setLoading] = useState(false); // Start as false, as no initial fetch
  const [error, setError] = useState('');

  const fetchPatientStatus = async (bookNo) => {
    if (!bookNo) {
      setError('Please enter a Book Number.');
      setPatientStatus(null);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setPatientStatus(null); // Clear previous status
      const response = await privateAxios.get(`/api/patient-status/${bookNo}`);
      setPatientStatus(response.data.status);
      setCurrentBookNumber(bookNo); // Store the book number for which status is displayed
    } catch (err) {
      console.error('Error fetching patient status:', err);
      setError('Failed to fetch patient status. Please check the Book Number and try again.');
      setPatientStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setInputBookNumber(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchPatientStatus(inputBookNumber);
  };

  return (
    <div className="patient-status-container">
      <h2 className="patient-status-title">Patient Status Tracker</h2>

      <form onSubmit={handleSubmit} className="book-number-form">
        <input
          type="text"
          placeholder="Enter Patient Book Number"
          value={inputBookNumber}
          onChange={handleInputChange}
          className="book-number-input"
        />
        <button type="submit" className="get-status-button" disabled={loading}>
          {loading ? 'Fetching...' : 'Get Status'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {loading && <div className="loading-message">Loading patient status...</div>}

      {patientStatus && (
        <>
          <h3 className="status-for-book-no">Status for Book Number: {currentBookNumber}</h3>
          <div className="status-checklist">
            {[
              { label: 'Doctor Assigned', key: 'doctorAssigned' },
              { label: 'Vitals Recorded', key: 'vitalsRecorded' },
              { label: 'Medicines Prescribed', key: 'medicinesPrescribed' },
              { label: 'Medicines Given', key: 'medicinesGiven' },
              { label: 'Counselling Done', key: 'counsellingDone' },
            ].map((item) => (
              <div key={item.key} className={`checklist-item ${patientStatus[item.key] ? 'completed' : 'pending'}`}>
                <span className="checklist-icon">
                  {patientStatus[item.key] ? '✅' : '⏳'}
                </span>
                <span className="checklist-label">{item.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PatientStatusPage;
