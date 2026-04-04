import React, { useState, useEffect, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom"; // Import useParams, useLocation and useNavigate
import { privateAxios } from "../api/axios";
import "../Styles/DoctorAssigning.css";
import { useQrScanner } from '../Context/QrScannerContext'; // Import useQrScanner hook
import { useSocket } from '../hooks/useSocket'; // Import WebSocket hook

function DoctorAssigning() {
  const { openScanner } = useQrScanner();
  const [formData, setFormData] = useState({ bookNumber: '', doc_name: '' });
  const [doctors, setDoctors] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [currentAssignment, setCurrentAssignment] = useState(null); // Store current assignment info
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const location = useLocation(); // Initialize useLocation hook
  const navigate = useNavigate(); // Initialize useNavigate hook

  // WebSocket connection
  const { socket, isConnected } = useSocket();

  const fetchDoctors = useCallback(async () => {
    setIsLoading(true); // Set loading to true while fetching doctors
    try {
      const response = await privateAxios.get('/api/doctor-assign/get_doctors');
      setDoctors(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setError('Error fetching doctors');
    } finally {
      setIsLoading(false); // Set loading back to false after fetching
    }
  }, []);

  useEffect(() => {
    // Check if bookNumber is passed via state from Vitals page
    if (location.state && location.state.bookNumber) {
      setFormData((prev) => ({ ...prev, bookNumber: location.state.bookNumber }));
    }

    fetchDoctors();
  }, [location.state, fetchDoctors]);

  // Check for existing assignment when bookNumber changes
  useEffect(() => {
    const checkAssignment = async () => {
      if (!formData.bookNumber || formData.bookNumber.length < 3) {
        setCurrentAssignment(null);
        return;
      }

      try {
        const response = await privateAxios.get(`/api/doctor-assign/status/${formData.bookNumber}`);
        if (response.data.assigned) {
          setCurrentAssignment(response.data);
          // Optional: Auto-select the currently assigned doctor
          // setFormData(prev => ({ ...prev, doc_name: response.data.doctor_name }));
        } else {
          setCurrentAssignment(null);
        }
      } catch (err) {
        console.error("Error checking assignment:", err);
      }
    };

    const debounceTimer = setTimeout(() => {
      checkAssignment();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [formData.bookNumber]);

  // WebSocket event listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleDoctorAssigned = () => {
      console.log('🔄 Doctor assigned - refreshing doctor list...');
      fetchDoctors();
    };

    const handleVitalsRecorded = () => {
      console.log('🔄 Vitals recorded - refreshing doctor list...');
      fetchDoctors();
    };

    // Listen for events that affect doctor queues
    socket.on('doctor:assigned', handleDoctorAssigned);
    socket.on('vitals:recorded', handleVitalsRecorded);

    return () => {
      socket.off('doctor:assigned', handleDoctorAssigned);
      socket.off('vitals:recorded', handleVitalsRecorded);
    };
  }, [socket, fetchDoctors]);

  const handleQrScan = (bookNumber) => {
    console.log(`QR Code detected: ${bookNumber}`);
    setFormData((prev) => ({ ...prev, bookNumber: bookNumber }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Set loading to true when submitting starts
    try {
      const response = await privateAxios.post('/api/doctor-assign', {
        book_no: formData.bookNumber,
        doc_name: formData.doc_name,
      });
      setMessage(response.data.message || 'Doctor-patient mapping successful!');
      setError('');
      setFormData({ bookNumber: '', doc_name: '' });
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.message || 'An error occurred');
      setMessage('');
    } finally {
      setIsLoading(false); // Set loading back to false after submission
    }
  };

  return (
    <div className="doctor-assigning-container">
      <button
        className="back-icon-btn"
        onClick={() => navigate('/dashboard')}
        title="Back to Dashboard"
      >
        <svg fill="#000000" xmlns="http://www.w3.org/2000/svg"
          width="24px" height="24px" viewBox="0 0 52 52" enableBackground="new 0 0 52 52">
          <path d="M48.6,23H15.4c-0.9,0-1.3-1.1-0.7-1.7l9.6-9.6c0.6-0.6,0.6-1.5,0-2.1l-2.2-2.2c-0.6-0.6-1.5-0.6-2.1,0
            L2.5,25c-0.6,0.6-0.6,1.5,0,2.1L20,44.6c0.6,0.6,1.5,0.6,2.1,0l2.1-2.1c0.6-0.6,0.6-1.5,0-2.1l-9.6-9.6C14,30.1,14.4,29,15.3,29
            h33.2c0.8,0,1.5-0.6,1.5-1.4v-3C50,23.8,49.4,23,48.6,23z"/>
        </svg>
      </button>
      <h1 className="doctor-assigning-title">Doctor Assigning</h1>

      {/* WebSocket Connection Status */}
      <div style={{
        padding: '8px 12px',
        margin: '10px 0',
        borderRadius: '4px',
        backgroundColor: isConnected ? '#d4edda' : '#f8d7da',
        color: isConnected ? '#155724' : '#721c24',
        fontSize: '14px',
        textAlign: 'center'
      }}>
        {isConnected ? '🟢 Real-time queue updates active' : '🔴 Connecting...'}
      </div>

      {message && <div className="doctor-assigning-success-msg">{message}</div>}
      {error && <div className="doctor-assigning-error-msg">{error}</div>}
      <form onSubmit={handleSubmit} className="doctor-assigning-form">
        <div className="doctor-assigning-form-group">
          <label>Book Number</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="text"
              name="bookNumber"
              value={formData.bookNumber}
              onChange={handleChange}
              required
              style={{ flexGrow: 1 }}
            // No longer disabled by isLoading for manual entry fallback
            />
            <button
              type="button"
              onClick={() => openScanner(handleQrScan)}
              className="scan-btn"
              title="Scan QR Code"
            >
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#FFFFFF"><path d="M0 0h24v24H0z" fill="none" /><path d="M4 12V6H2v6c0 1.1.9 2 2 2h2v-2H4zm16 0V6h2v6c0 1.1-.9 2-2 2h-2v-2h2zM4 20v-6H2v6c0 1.1.9 2 2 2h2v-2H4zm16 0v-6h2v6c0 1.1-.9 2-2 2h-2v-2h2zM7 19h10V5H7v14zm2-2v-2h6v2H9zm0-4v-2h6v2H9zm0-4V7h6v2H9z" /></svg>
            </button>
          </div>
          {currentAssignment && (
            <div className="doctor-assigning-warning-msg" style={{
              backgroundColor: '#fff3cd',
              color: '#856404',
              padding: '10px',
              marginTop: '10px',
              borderRadius: '5px',
              border: '1px solid #ffeeba',
              textAlign: 'center'
            }}>
              Currently assigned to: <strong>{currentAssignment.doctor_name}</strong>
              <br />
              <small>Selecting a different doctor will re-assign this patient.</small>
            </div>
          )}
        </div>
        <div className="doctor-assigning-form-group">
          <label>Doctor Assigned</label>
          <div className="doctor-assigning-radio-group">
            {doctors.length > 0 ? (
              doctors.map((doctor) => (
                <label key={doctor._id}>
                  <input
                    type="radio"
                    name="doc_name"
                    value={doctor.doctor_name}
                    checked={formData.doc_name === doctor.doctor_name}
                    onChange={handleChange}
                    required
                    disabled={isLoading} // Disable input while loading
                  />
                  {doctor.doctor_name} ({doctor.specialization}) - Queue: {doctor.patient_queue ? doctor.patient_queue.length : 0}
                </label>
              ))
            ) : (
              <p>No doctors available</p>
            )}
          </div>
        </div>
        <button
          type="submit"
          className="doctor-assigning-submit-btn"
          disabled={isLoading} // Disable button while loading
        >
          {isLoading ? 'Submitting...' : 'Submit'} {/* Show loading text */}
        </button>
      </form >
    </div >
  );
}

export default DoctorAssigning;
