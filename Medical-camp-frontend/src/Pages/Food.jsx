import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // Import useLocation
import { privateAxios } from '../api/axios';
import '../Styles/PatientSupport.css';
import { useQrScanner } from '../Context/QrScannerContext'; // Import useQrScanner hook


function PatientSupport() { // Renamed from Food to PatientSupport, assuming this is correct
  const location = useLocation(); // Initialize useLocation
  const { openScanner } = useQrScanner();
  const [bookNo, setBookNo] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [loading, setLoading] = useState(false);
  const [patientData, setPatientData] = useState(null); // New state for patient data

  const debounceTimeoutRef = useRef(null);

  const fetchPatientData = async (bookNumber) => {
    if (!bookNumber.trim()) {
      setPatientData(null);
      setMessage('');
      return;
    }
    try {
      const response = await privateAxios.get(`/api/patients/${bookNumber}`);
      setPatientData(response.data);
      setMessage('');
    } catch (error) {
      console.error('Error fetching patient data:', error);
      setPatientData(null);
      setMessage('Patient not found or error fetching data.');
      setMessageType('error');
    }
  };

  const handleBookNoChange = (e) => {
    const newBookNo = e.target.value;
    setBookNo(newBookNo);
    setMessage(''); // Clear message on input change
    setPatientData(null); // Clear patient data on input change

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      fetchPatientData(newBookNo);
    }, 500); // Debounce for 500ms
  };

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Set bookNo from location.state if navigating from Dashboard
    if (location.state?.bookNumber) {
      setBookNo(location.state.bookNumber);
    }
  }, [location.state]);

  const handleQrScan = (scannedBookNumber) => {
    setBookNo(scannedBookNumber);
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    // Directly fetch data after scan without debounce, as it's an explicit action
    fetchPatientData(scannedBookNumber);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bookNo.trim()) {
      setMessage('Book number cannot be empty.');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      const response = await privateAxios.post(`/api/patients/volunteer/patient-food`, {
        book_no: bookNo,
      });
      setMessage(response.data.message);
      setMessageType('success');
      setBookNo(''); // Clear input on success
    } catch (error) {
      console.error('Error submitting patient food form:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit book number. Please try again.';
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="patient-support-container">
      <h3>Patient Support</h3>
      <form onSubmit={handleSubmit} className="patient-support-form">
        <div className="form-group">
          <label htmlFor="bookNo">Book No:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="text"
              id="bookNo"
              value={bookNo}
              onChange={handleBookNoChange}
              placeholder="Enter patient book number"
              required
              className="book-no-input"
              style={{ flexGrow: 1 }}
            />
            <button
              type="button"
              onClick={() => openScanner(handleQrScan)}
              className="scan-btn"
              title="Scan QR Code"
            >
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#FFFFFF"><path d="M0 0h24v24H0z" fill="none"/><path d="M4 12V6H2v6c0 1.1.9 2 2 2h2v-2H4zm16 0V6h2v6c0 1.1-.9 2-2 2h-2v-2h2zM4 20v-6H2v6c0 1.1.9 2 2 2h2v-2H4zm16 0v-6h2v6c0 1.1-.9 2-2 2h-2v-2h2zM7 19h10V5H7v14zm2-2v-2h6v2H9zm0-4v-2h6v2H9zm0-4V7h6v2H9z"/></svg>
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Submitting...' : 'Submit Book No'}
        </button>
      </form>
      {message && (
        <div className={`message ${messageType === 'success' ? 'success-message' : 'error-message'}`}>
          {message}
        </div>
      )}

      {patientData && patientData.patient_photo_url && (
        <div className="patient-photo-section">
          <h4>Patient Photo:</h4>
          <img src={patientData.patient_photo_url} alt="Patient" className="patient-photo" />
        </div>
      )}
    </div>
  );
}

export default PatientSupport;
