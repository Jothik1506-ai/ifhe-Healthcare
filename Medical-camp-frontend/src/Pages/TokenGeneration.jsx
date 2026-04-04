import React, { useState } from 'react';
import { privateAxios } from '../api/axios';
import PatientRegistration from './PatientRegistration';

const TokenGenerator = () => {
  const [step, setStep] = useState(1); // Step 1: gender select, Step 2: book ID
  const [gender, setGender] = useState('');
  const [bookNumber, setBookNumber] = useState('');
  const [tokenInfo, setTokenInfo] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);
  const [error, setError] = useState('');
  const [showRegistration, setShowRegistration] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenderSelect = (selectedGender) => {
    setGender(selectedGender);
    setStep(2);
  };

  const generateToken = async () => {
    if (!bookNumber) {
      setError('Please enter booking ID.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setPatientInfo(null);
      setTokenInfo(null);
      setShowRegistration(false);

      // 1. Fetch patient info
      const patientRes = await privateAxios.get(`/api/patients/${bookNumber}`);
      const patientGender = patientRes.data?.patient_sex?.toLowerCase();
      setPatientInfo(patientRes.data);

      // 2. Strict gender validation BEFORE token generation
      if (patientGender && patientGender !== gender.toLowerCase()) {
        setError(
          `❌ Gender mismatch: Booking ID ${bookNumber} is registered as "${patientRes.data.patient_sex}". ` +
          `Please go to the ${patientRes.data.patient_sex.toUpperCase()} sector. Token NOT generated.`
        );
        setTokenInfo(null); // ensure no token info is shown
        return; // stop here → token API not called
      }

      // 3. Generate token if gender matches
      const tokenRes = await privateAxios.post('/api/token', {
        bookNumber,
        gender,
      });

      setTokenInfo({
        bookNumber,
        gender,
        tokenNumber: tokenRes.data.tokenNumber,
        alreadyExists: tokenRes.data.alreadyExists || false,
      });

    } catch (err) {
      console.error('Error in generating token:', err);
      if (err.response?.status === 404) {
        setShowRegistration(true); // patient not found → show registration
      } else {
        setError('Failed to fetch patient or generate token.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Token Generator</h2>

      {/* Step 1: Gender selection */}
      {step === 1 && (
        <div style={styles.cardContainer}>
          <button
            onClick={() => handleGenderSelect('male')}
            style={{ ...styles.card, ...styles.maleCard }}
          >
            Male
          </button>
          <button
            onClick={() => handleGenderSelect('female')}
            style={{ ...styles.card, ...styles.femaleCard }}
          >
            Female
          </button>
        </div>
      )}

      {/* Step 2: Enter booking ID */}
      {step === 2 && (
        <div style={styles.formContainer}>
          <p style={styles.selectedGender}>
            Selected Gender: <strong>{gender.toUpperCase()}</strong>
          </p>
          <input
            type="text"
            placeholder="Enter Booking ID"
            value={bookNumber}
            onChange={(e) => setBookNumber(e.target.value)}
            style={styles.input}
          />
          <button
            onClick={generateToken}
            style={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Generate Token'}
          </button>
          <button
            onClick={() => {
              setStep(1);
              setGender('');
              setBookNumber('');
              setError('');
              setPatientInfo(null);
              setTokenInfo(null);
              setShowRegistration(false);
            }}
            style={styles.backButton}
          >
            ⬅ Back
          </button>
        </div>
      )}

      {error && <p style={styles.error}>{error}</p>}

      {/* Show patient and token info */}
      {patientInfo && tokenInfo && (
        <div style={styles.resultContainer}>
          <div style={styles.box}>
            <h4>Patient Info</h4>
            <p><strong>Name:</strong> {patientInfo.patient_name}</p>
            <p><strong>Age:</strong> {patientInfo.patient_age}</p>
            <p><strong>Phone:</strong> {patientInfo.patient_phone_no}</p>
          </div>
          <div style={styles.box}>
            <h4>Token Info</h4>
            <p><strong>Booking ID:</strong> {tokenInfo.bookNumber}</p>
            <p><strong>Gender:</strong> {tokenInfo.gender}</p>
          </div>
        </div>
      )}

      {/* Patient not found → registration */}
      {showRegistration && (
        <div style={styles.registrationContainer}>
          <p style={styles.notFoundMsg}>
            ❌ Patient not found for Booking ID <strong>{bookNumber}</strong>.  
            Please create a new record below.
          </p>
          <PatientRegistration initialBookNumber={bookNumber} hideEidField={true} initialGender={gender} />
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '1.5rem',
    maxWidth: '500px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif',
    textAlign: 'center',
  },
  heading: {
    marginBottom: '1.5rem',
  },
  cardContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
  },
  card: {
    flex: 1,
    padding: '2rem',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'transform 0.2s, opacity 0.2s',
  },
  maleCard: {
    backgroundColor: '#007bff',
  },
  femaleCard: {
    backgroundColor: '#28a745',
  },
  formContainer: {
    marginTop: '1rem',
  },
  selectedGender: {
    marginBottom: '0.5rem',
    fontSize: '1rem',
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    padding: '0.6rem',
    fontSize: '1rem',
    marginBottom: '1rem',
    border: '1px solid #ccc',
    borderRadius: '6px',
  },
  submitButton: {
    width: '100%',
    padding: '0.8rem',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    cursor: 'pointer',
    marginBottom: '0.5rem',
  },
  backButton: {
    width: '100%',
    padding: '0.6rem',
    backgroundColor: '#6c757d',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  error: {
    color: 'red',
    marginTop: '1rem',
  },
  resultContainer: {
    marginTop: '1.5rem',
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  box: {
    flex: '1 1 220px',
    padding: '1rem',
    backgroundColor: '#f1f1f1',
    borderRadius: '8px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
    textAlign: 'left',
  },
  registrationContainer: {
    marginTop: '2rem',
    padding: '1rem',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#fff3f3',
  },
  notFoundMsg: {
    color: '#d9534f',
    fontWeight: 'bold',
    marginBottom: '1rem',
    textAlign: 'center',
  },
};

export default TokenGenerator;
