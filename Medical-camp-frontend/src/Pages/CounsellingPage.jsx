import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // Import useLocation
import { privateAxios } from '../api/axios';
import '../Styles/CounsellingPage.css'; // Assuming a new CSS file for styling
import { useQrScanner } from '../Context/QrScannerContext'; // Import useQrScanner hook

const CounsellingPage = () => {
  const location = useLocation(); // Initialize useLocation
  const { openScanner } = useQrScanner();
  const [bookNo, setBookNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' }); // For success/error messages

  const handleBookNoChange = (e) => {
    setBookNo(e.target.value);
  };

  useEffect(() => {
    // Set bookNo from location.state if navigating from Dashboard
    if (location.state?.bookNumber) {
      setBookNo(location.state.bookNumber);
    }
  }, [location.state]);

  const handleQrScan = (scannedBookNumber) => {
    setBookNo(scannedBookNumber);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' }); // Clear previous messages
    try {
      await privateAxios.post('/api/patient-history/counselling', { book_no: bookNo });
      setMessage({ text: 'Counselling status updated successfully!', type: 'success' });
      setBookNo('');
    } catch (error) {
      console.error('Error updating counselling status:', error);
      setMessage({ text: 'Failed to update counselling status.', type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 5000); // Clear message after 5 seconds
    }
  };

  return (
    <div className="counselling-container">
      <h2>Counselling Page</h2>
      <form onSubmit={handleSubmit} className="counselling-form">
        <div className="form-group">
          <label htmlFor="bookNo">Book Number:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="text"
              id="bookNo"
              value={bookNo}
              onChange={handleBookNoChange}
              placeholder="Enter Book Number"
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
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Mark as Counselled'}
        </button>
        {message.text && (
          <p className={`message ${message.type === 'success' ? 'success-message' : 'error-message'}`}>
            {message.text}
          </p>
        )}
      </form>
    </div>
  );
};

export default CounsellingPage;
