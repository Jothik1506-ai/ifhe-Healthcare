import React, { useState, useEffect } from 'react';
import '../Styles/LabTests.css';
import { privateAxios } from '../api/axios';

const LabTestsPage = () => {
  const [labTests, setLabTests] = useState([]); // State to store fetched lab tests
  const [selectedTests, setSelectedTests] = useState([]);
  const [bookNo, setBookNo] = useState('');
  const [submissionMessage, setSubmissionMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const [doctorAssigned, setDoctorAssigned] = useState(false);
  const [isLoadingDoctorAssignment, setIsLoadingDoctorAssignment] = useState(false);
  const [doctorAssignmentStatusMessage, setDoctorAssignmentStatusMessage] = useState('');
  const [doctorAssignmentMessageTimeoutId, setDoctorAssignmentMessageTimeoutId] = useState(null);

  useEffect(() => {
    const fetchAvailableLabTests = async () => {
      try {
        const response = await privateAxios.get('/api/admin/labtests'); // Fetch from admin endpoint
        setLabTests(response.data.labTests);
      } catch (error) {
        console.error('Error fetching available lab tests:', error.response?.data || error.message);
        // Optionally show an error message to the user
      }
    };
    fetchAvailableLabTests();
  }, []); // Empty dependency array means this runs once on mount

  const handleCheckboxChange = (testName) => {
    setSelectedTests((prevSelectedTests) =>
      prevSelectedTests.includes(testName)
        ? prevSelectedTests.filter((t) => t !== testName)
        : [...prevSelectedTests, testName]
    );
  };

  const handleBookNoChange = (e) => {
    setBookNo(e.target.value);
    setDoctorAssigned(false); // Reset doctor assignment status on bookNo change
    setDoctorAssignmentStatusMessage('');
    if (doctorAssignmentMessageTimeoutId) {
      clearTimeout(doctorAssignmentMessageTimeoutId);
      setDoctorAssignmentMessageTimeoutId(null);
    }
  };

  useEffect(() => {
    if (doctorAssignmentMessageTimeoutId) {
      clearTimeout(doctorAssignmentMessageTimeoutId);
      setDoctorAssignmentMessageTimeoutId(null);
    }

    const checkDoctorAssignment = async () => {
      if (bookNo) {
        setIsLoadingDoctorAssignment(true);
        setDoctorAssignmentStatusMessage('Checking for doctor assignment...');
        try {
          const response = await privateAxios.get(`/api/patient-history/check-doctor-assignment/${bookNo}`);
          setDoctorAssigned(response.data.hasDoctorAssigned);
          setDoctorAssignmentStatusMessage(response.data.message);
          const timeoutId = setTimeout(() => {
            setDoctorAssignmentStatusMessage('');
          }, 10000);
          setDoctorAssignmentMessageTimeoutId(timeoutId);
        } catch (error) {
          console.error('Error checking doctor assignment:', error.response?.data || error.message);
          setDoctorAssigned(false);
          setDoctorAssignmentStatusMessage(`Error checking doctor assignment: ${error.response?.data?.message || error.message}`);
          const timeoutId = setTimeout(() => {
            setDoctorAssignmentMessageTimeoutId(timeoutId);
          }, 10000);
          setDoctorAssignmentMessageTimeoutId(timeoutId);
        } finally {
          setIsLoadingDoctorAssignment(false);
        }
      } else {
        setDoctorAssigned(false);
        setDoctorAssignmentStatusMessage('');
      }
    };

    const handler = setTimeout(checkDoctorAssignment, 500); // Debounce API call
    return () => {
      clearTimeout(handler);
      if (doctorAssignmentMessageTimeoutId) {
        clearTimeout(doctorAssignmentMessageTimeoutId);
        setDoctorAssignmentMessageTimeoutId(null);
      }
    };
  }, [bookNo]);

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    setSubmissionMessage(null); // Clear previous messages
    setMessageType(null);

    if (!bookNo) {
      setSubmissionMessage('Please enter a Book No.');
      setMessageType('error');
      return;
    }
    if (!doctorAssigned) {
      setSubmissionMessage('A doctor must be assigned to the patient before submitting lab tests.');
      setMessageType('error');
      return;
    }
    if (selectedTests.length === 0) {
      setSubmissionMessage('Please select at least one lab test.');
      setMessageType('error');
      return;
    }

    try {
      const response = await privateAxios.post('/api/labtests', {
        book_no: bookNo, // Send as book_no
        labTests: selectedTests,
      });
      console.log('Lab test results submitted:', response.data);
      setSubmissionMessage(response.data.message); // Use the message from the backend
      setMessageType('success');
      // Optionally clear the form
      setBookNo('');
      setSelectedTests([]);

      // Clear the message after 10 seconds
      setTimeout(() => {
        setSubmissionMessage(null);
        setMessageType(null);
      }, 10000); // 10 seconds
    } catch (error) {
      console.error('Error submitting lab test results:', error.response?.data || error.message);
      setSubmissionMessage(`Failed to submit lab test records: ${error.response?.data?.message || error.message}`);
      setMessageType('error');

      // Clear the error message after 10 seconds
      setTimeout(() => {
        setSubmissionMessage(null);
        setMessageType(null);
      }, 10000); // 10 seconds
    }
  };

  return (
    <div className="lab-tests-container">
      <h2>Select Lab Tests</h2>
      <form onSubmit={handleSubmit}> {/* Add onSubmit handler */}
        {submissionMessage && (
          <div className={`submission-message ${messageType}`}>
            {submissionMessage}
          </div>
        )}
        <div className="book-no-input-group">
          <label htmlFor="bookNo">Book No:</label>
          <input
            type="text"
            id="bookNo"
            value={bookNo}
            onChange={handleBookNoChange}
            placeholder="Enter Book No"
          />
        </div>
        {isLoadingDoctorAssignment && <div className="prescription-status-message loading">Checking doctor assignment...</div>}
        {!isLoadingDoctorAssignment && doctorAssignmentStatusMessage && (
          <div className={`prescription-status-message ${doctorAssigned ? 'success' : 'error'}`}>
            {doctorAssignmentStatusMessage}
          </div>
        )}
        {labTests.map((test) => (
          <div key={test._id} className="lab-test-item">
            <input
              type="checkbox"
              id={`test-${test._id}`}
              name={test.name}
              checked={selectedTests.includes(test.name)}
              onChange={() => handleCheckboxChange(test.name)}
            />
            <label htmlFor={`test-${test._id}`}>{test.name}</label>
          </div>
        ))}
        <button type="submit" className="submit-button" disabled={isLoadingDoctorAssignment || !doctorAssigned}>
          Submit Lab Tests
        </button>
      </form>
    </div>
  );
};

export default LabTestsPage;
