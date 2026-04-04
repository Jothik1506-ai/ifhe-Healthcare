import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { privateAxios } from '../api/axios';
import '../Styles/Vitals.css';
import { useQrScanner } from '../Context/QrScannerContext'; // Import useQrScanner hook

function Vitals() {
  const VitalEmptyData = {
    bookNumber: '',
    bp: '',
    bp_digital: '',
    pulse: '',
    heart_rate: '',
    rbs: '',
    weight: '',
    height: '',
    extra_note: ''
  }
  const [formData, setFormData] = useState({
    ...VitalEmptyData
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [bpError, setBpError] = useState('');
  const [bookNumberError, setBookNumberError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // Initialize useLocation
  const { openScanner } = useQrScanner();
  const { book_no: urlBookNumber } = useParams(); // Get book_no from URL parameters
  const debounceTimer = useRef(null); // Add debounce timer ref

  const handleQrScan = (scannedBookNumber) => {
    setFormData((prev) => ({ ...prev, bookNumber: scannedBookNumber }));
  };

  const fetchVitals = async (value) => {
    console.log(value);
    setIsLoading(true);
    if (value !== '') {
      try {
        // Always fetch patient status first to check doctor assignment
        const patientStatusResponse = await privateAxios.get(`/api/patient-status/${value}`);
        if (!patientStatusResponse.data.status.doctorAssigned) {
          setFormData({ ...VitalEmptyData, bookNumber: value }); // Keep book number
          setError('Doctor assignment required before vitals entry.');
          setMessage('');
          setIsLoading(false);
          return; // Stop further execution if no doctor is assigned
        } else {
          setError(''); // Clear error if doctor is assigned
        }

        // If doctor is assigned, proceed to fetch vitals data
        const vitalsResponse = await privateAxios.get(`/api/vitals/${value}`);
        setFormData({
          ...vitalsResponse.data,
          bookNumber: value
        });
        setMessage('Vitals fetched successfully!');
        setError(''); // Clear any previous errors

      } catch (error) {
        setFormData({ ...VitalEmptyData, bookNumber: value }); // Retain book number on error
        setMessage(''); // Clear success message

        let currentError = error.response?.data?.message || 'An error occurred while fetching vitals';
        setError(currentError);

      } finally {
        setIsLoading(false);
      }
    } else {
      setFormData(VitalEmptyData);
      setMessage('');
      setError('');
      setIsLoading(false);
    }
  };

  // useEffect for debounced book number search
  useEffect(() => {
    // Clear the previous timer
    clearTimeout(debounceTimer.current);

    // Set a new timer for debouncing
    debounceTimer.current = setTimeout(() => {
      if (formData.bookNumber) {
        fetchVitals(formData.bookNumber);
      }
    }, 500);

    // Cleanup function to clear timer on unmount or when bookNumber changes
    return () => clearTimeout(debounceTimer.current);
  }, [formData.bookNumber]); // Trigger when bookNumber changes

  // Effect to pre-fill book number if available from URL
  useEffect(() => {
    if (urlBookNumber) {
      setFormData((prev) => ({ ...prev, bookNumber: urlBookNumber }));
    }
  }, [urlBookNumber]);

  // Effect to clear messages after a few seconds, but keep doctor assignment error
  useEffect(() => {
    if (message || (error && error !== 'Doctor assignment required before vitals entry.')) {
      const timer = setTimeout(() => {
        setMessage('');
        if (error !== 'Doctor assignment required before vitals entry.') {
          setError('');
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'bp') {
      if (value) {
        const parts = value.split('/');
        if (
          parts.length !== 2 ||
          isNaN(Number(parts[0])) ||
          isNaN(Number(parts[1]))
        ) {
          setBpError('BP must be in the format systolic/diastolic (e.g., 120/80)');
        } else {
          setBpError('');
        }
      } else {
        setBpError('');
      }
    } else if (name === 'bp_digital') {
      if (value) {
        const parts = value.split('/');
        if (
          parts.length !== 2 ||
          isNaN(Number(parts[0])) ||
          isNaN(Number(parts[1]))
        ) {
          setBpError('BP (Digital) must be in the format systolic/diastolic (e.g., 120/80)');
        } else {
          setBpError('');
        }
      } else {
        setBpError('');
      }
    } else if (name === 'bookNumber') {
      const regex = /^[0-9]*$/;
      if (!regex.test(value)) {
        setBookNumberError('Book Number must contain only digits');
      } else {
        setBookNumberError('');
      }
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await privateAxios.post('/api/vitals', {
        book_no: formData.bookNumber,
        rbs: formData.rbs || null,
        bp: formData.bp || null,
        bp_digital: formData.bp_digital || null,
        height: formData.height || null,
        weight: formData.weight || null,
        pulse: formData.pulse || null,
        heart_rate: formData.heart_rate || null,
        extra_note: formData.extra_note || null
      });
      setMessage(response.data.message || 'Vitals recorded successfully!');
      setError('');
      setFormData({
        bookNumber: '',
        bp: '',
        bp_digital: '',
        pulse: '',
        heart_rate: '',
        rbs: '',
        weight: '',
        height: '',
        extra_note: ''
      });
      window.scrollTo(0, 0);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'An error occurred';
      setError(errorMessage);
      setMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="vitals-container">
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
      <h1 className="vitals-title">Vitals</h1>
      {message && <div className="vitals-success-msg">{message}</div>}
      {error && error !== 'Doctor assignment required before vitals entry.' && (
        <div className="vitals-error-msg">{error}</div>
      )}
      {error === 'Doctor assignment required before vitals entry.' && formData.bookNumber && (
        <div className="doctor-assignment-prompt">
          <p>A doctor must be assigned before vitals can be entered.</p>
          <button
            className="doctor-assign-link"
            onClick={() => navigate('/doctor-assigning', { state: { bookNumber: formData.bookNumber } })}
          >
            Go to Doctor Assignment
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="vitals-form">
        <div className="vitals-form-group">
          <label>Book Number</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="text"
              name="bookNumber"
              value={formData.bookNumber}
              autoComplete='off'
              onChange={handleChange}
              required
              style={{ flexGrow: 1 }}
            />
            <button
              type="button"
              onClick={() => openScanner(handleQrScan)}
              className="scan-btn"
              title="Scan QR Code"
            >
              <svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#FFFFFF"><g><rect fill="none" height="24" width="24" /></g><g><g><path d="M3,11h8V3H3V11z M5,5h4v4H5V5z" /><path d="M3,21h8v-8H3V21z M5,15h4v4H5V15z" /><path d="M13,3v8h8V3H13z M19,9h-4V5h4V9z" /><rect height="2" width="2" x="13" y="13" /><rect height="2" width="2" x="17" y="17" /><rect height="2" width="2" x="19" y="19" /><rect height="2" width="2" x="13" y="19" /><rect height="2" width="2" x="19" y="13" /><rect height="2" width="2" x="15" y="15" /><rect height="2" width="2" x="17" y="13" /><rect height="2" width="2" x="15" y="19" /></g></g></svg>
            </button>
          </div>
          {bookNumberError && <div className="vitals-error-msg">{bookNumberError}</div>}
        </div>
        <div className="vitals-form-group">
          <label>BP Manual (systolic/diastolic)</label>
          <input type="text" name="bp" value={formData.bp} onChange={(e) => {
            handleChange(e);
          }} autoComplete='off' />
        </div>
        <div className="vitals-form-group">
          <label>BP (Digital) (systolic/diastolic)</label>
          <input type="text" name="bp_digital" value={formData.bp_digital} onChange={(e) => {
            handleChange(e);
          }} autoComplete='off' />
        </div>
        <div className="vitals-form-group">
          <label>Pulse</label>
          <input type="text" name="pulse" value={formData.pulse} onChange={(e) => {
            const regex = /^[0-9]+$/;
            if (regex.test(e.target.value) || e.target.value === '') {
              handleChange(e);
            }
          }} autoComplete='off' />
        </div>
        <div className="vitals-form-group">
          <label>Heart Rate</label>
          <input type="text" name="heart_rate" value={formData.heart_rate} onChange={(e) => {
            const regex = /^[0-9]+$/;
            if (regex.test(e.target.value) || e.target.value === '') {
              handleChange(e);
            }
          }} autoComplete='off' />
        </div>
        <div className="vitals-form-group">
          <label>RBS</label>
          <input type="text" name="rbs" value={formData.rbs} onChange={(e) => {
            const regex = /^[0-9]+$/;
            if (regex.test(e.target.value) || e.target.value === '') {
              handleChange(e);
            }
          }} autoComplete='off' />
        </div>
        <div className="vitals-form-group">
          <label>Weight (kg)</label>
          <input type="text" name="weight" value={formData.weight} onChange={(e) => {
            const regex = /^[0-9]+$/;
            if (regex.test(e.target.value) || e.target.value === '') {
              handleChange(e);
            }
          }} autoComplete='off' />
        </div>
        <div className="vitals-form-group">
          <label>Height (cm)</label>
          <input type="text" name="height" value={formData.height} onChange={(e) => {
            const regex = /^[0-9]+$/;
            if (regex.test(e.target.value) || e.target.value === '') {
              handleChange(e);
            }
          }} autoComplete='off' />
        </div>
        <div className="vitals-form-group">
          <label>Last Meal and Time (Optional)</label>
          <input type="text" name="extra_note" value={formData.extra_note} onChange={handleChange} autoComplete='off' />
        </div>
        <button
          type="submit"
          className="vitals-submit-btn"
          disabled={isLoading}
        >
          {isLoading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
}

export default Vitals;
