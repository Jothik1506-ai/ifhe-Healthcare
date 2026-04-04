import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../Styles/DoctorPrescription.css';
import { privateAxios } from '../api/axios';
import { useQrScanner } from '../Context/QrScannerContext'; // Import useQrScanner hook

function DoctorPrescription() {
  const navigate = useNavigate();
  const location = useLocation(); // Initialize useLocation
  const { openScanner } = useQrScanner();
  const [bookNo, setBookNo] = useState('');
  const [prescriptions, setPrescriptions] = useState([
    { medicine_id: '', days: 0, morning: false, afternoon: false, night: false, quantity: 0, isMedicine: true }
  ]);
  const [medicineDetails, setMedicineDetails] = useState([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const debounceTimeout = useRef(null);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true); // State to disable submit button
  const [quantityExceedsError, setQuantityExceedsError] = useState(''); // State to show quantity exceeds error
  const [medicines, setMedicines] = useState([]); // State to store all medicines
  const [previousPrescriptions, setPreviousPrescriptions] = useState([]);
  const [debouncedBookNo, setDebouncedBookNo] = useState('');
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Function to validate quantities and update submit button state
  const validateQuantities = () => {
    // Validation logic removed as per user request - stock is managed via status flags
    setIsSubmitDisabled(false);
    setQuantityExceedsError('');
  };

  // Call validateQuantities whenever prescriptions or medicineDetails change
  React.useEffect(() => {
    validateQuantities();
  }, [prescriptions, medicineDetails]);

  /* Fix for stale closure in polling interval */
  const prescriptionsRef = useRef(prescriptions);
  useEffect(() => {
    prescriptionsRef.current = prescriptions;
  }, [prescriptions]);

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const response = await privateAxios.get('/api/inventory/get-all-medicine');
        const medicineList = response.data;

        setMedicines(medicineList);

        // Refresh stock inside medicineDetails (for selected medicines)
        setMedicineDetails(prevDetails =>
          prevDetails.map((details, index) => {
            if (!details) return null;

            // Use ref to access latest prescriptions
            const currentPrescriptions = prescriptionsRef.current;
            if (!currentPrescriptions[index]) return details;

            // Find updated medicine
            const updated = medicineList.find(
              m => m.medicine_id.toString() === currentPrescriptions[index].medicine_id
            );

            if (!updated) return details;

            // Optional: log updated quantity for debugging
            // console.log("updated quantity: ", updated.total_quantity);

            return {
              ...details,
              total_quantity: updated.total_quantity,
              medicine_name: updated.medicine_details[0].medicine_name,
              medicine_formulation:
                `${updated.medicine_details[0].medicine_name} (${updated.medicine_formulation})`
            };
          })
        );
      } catch (error) {
        console.error('Failed to fetch medicines:', error);
      }
    };

    fetchMedicines();

    const interval = setInterval(fetchMedicines, 30000);

    return () => clearInterval(interval);

  }, []);

  useEffect(() => {
    // Set bookNo from location.state if navigating from Dashboard
    if (location.state?.bookNumber) {
      setBookNo(location.state.bookNumber);
    }
  }, [location.state]);

  const handleQrScan = (scannedBookNumber) => {
    setBookNo(scannedBookNumber);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedBookNo(bookNo);
    }, 600);
    return () => clearTimeout(handler);
  }, [bookNo]);

  useEffect(() => {
    const fetchPreviousPrescriptions = async () => {
      if (!debouncedBookNo) {
        setPreviousPrescriptions([]);
        return;
      }
      try {
        setIsHistoryLoading(true);
        console.log(`Fetching history for: ${debouncedBookNo}`);
        const response = await privateAxios.get(`/api/patient-history/${debouncedBookNo}/previous-prescriptions`);
        const data = response.data;

        console.log('History data received:', data);

        let normalized = [];
        if (data.visits && Array.isArray(data.visits)) {
          normalized = data.visits.map(visit => ({
            ...visit,
            medicines: visit.medicines.map(m => ({
              ...m,
              isMedicine: m.isMedicine !== undefined ? m.isMedicine : (Number(m.days) > 0 || !!m.morning || !!m.afternoon || !!m.night)
            }))
          }));
        } else if (data.previous_prescriptions && Array.isArray(data.previous_prescriptions)) {
          // Handle legacy format by wrapping it in a pseudo-visit
          normalized = [{
            timestamp: 'Average (Last 3 Months)',
            medicines: data.previous_prescriptions.map(m => {
              const days = Number(m.days) || 0;
              const morning = !!m.morning;
              const afternoon = !!m.afternoon;
              const night = !!m.night;
              return {
                medicine_id: m.medicine_id?.toString() || '',
                quantity: Number(m.quantity) || 0,
                days,
                morning,
                afternoon,
                night,
                isMedicine: days > 0 || morning || afternoon || night
              };
            })
          }];
        }

        console.log('Normalized history:', normalized);
        setPreviousPrescriptions(normalized);
      } catch (err) {
        console.error('Failed to fetch previous prescriptions:', err);
        setPreviousPrescriptions([]);
      } finally {
        setIsHistoryLoading(false);
      }
    };

    fetchPreviousPrescriptions();
  }, [debouncedBookNo]);

  const fetchMedicineInfo = async (index, medicineId) => {
    if (!medicineId) {
      const detailsCopy = [...medicineDetails];
      detailsCopy[index] = null;
      setMedicineDetails(detailsCopy);
      return;
    }

    try {
      setIsLoading(true);
      const response = await privateAxios.get(`/api/inventory/${medicineId}`);
      setMedicineDetails(prev => {
        const copy = [...prev];
        copy[index] = response.data;
        return copy;
      });
    } catch (err) {
      setMedicineDetails(prev => {
        const copy = [...prev];
        copy[index] = { error: 'Item not found' };
        return copy;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPrescription = (med) => {
    console.log('Copying medicine:', med);
    let targetIndex;

    const firstPrescription = prescriptions[0];
    const isFirstRowEmpty = prescriptions.length === 1 &&
      !firstPrescription.medicine_id &&
      firstPrescription.quantity === 0 &&
      !firstPrescription.morning &&
      !firstPrescription.afternoon &&
      !firstPrescription.night;

    const hasDosageInfo = Number(med.days) > 0 || !!med.morning || !!med.afternoon || !!med.night;
    const newPrescriptionItem = {
      medicine_id: (med.medicine_id || '').toString(),
      days: Number(med.days) || 0,
      morning: !!med.morning,
      afternoon: !!med.afternoon,
      night: !!med.night,
      quantity: Number(med.quantity) || 0,
      isMedicine: hasDosageInfo ? true : (med.isMedicine !== undefined ? med.isMedicine : false)
    };

    if (isFirstRowEmpty) {
      targetIndex = 0;
      setPrescriptions([newPrescriptionItem]);
    } else {
      targetIndex = prescriptions.length;
      setPrescriptions(prev => [...prev, newPrescriptionItem]);
      // Also need to add a slot in medicineDetails to keep indices aligned
      setMedicineDetails(prev => [...prev, null]);
    }

    // Fetch medicine info for the row
    fetchMedicineInfo(targetIndex, newPrescriptionItem.medicine_id);
  };

  const handlePrescriptionChange = async (index, field, value) => {
    const updatedPrescriptions = prescriptions.map((prescription, i) => {
      if (i === index) {
        const updated = { ...prescription, [field]: value };

        // Only calculate quantity for medicine items (not non-medicine items)
        if (updated.isMedicine && field !== 'quantity') {
          const trueCount =
            (updated.morning ? 1 : 0) +
            (updated.afternoon ? 1 : 0) +
            (updated.night ? 1 : 0);
          updated.quantity = updated.days * trueCount;
        }

        return updated;
      }
      return prescription;
    });

    setPrescriptions(updatedPrescriptions);

    // Fetch medicine info when ID changes (for both medicine and non-medicine items)
    if (field === 'medicine_id') {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      if (value !== '') {
        debounceTimeout.current = setTimeout(() => {
          fetchMedicineInfo(index, value);
        }, 500); // Debounce for 500ms
      } else {
        fetchMedicineInfo(index, '');
      }
    }
  };

  const handlePrescriptionTypeChange = (index, isMedicine) => {
    const updatedPrescriptions = prescriptions.map((prescription, i) => {
      if (i === index) {
        // Reset fields based on type
        if (isMedicine) {
          return {
            ...prescription,
            isMedicine: true,
            medicine_id: '',
            days: 0,
            morning: false,
            afternoon: false,
            night: false,
            quantity: 0
          };
        } else {
          return {
            ...prescription,
            isMedicine: false,
            medicine_id: '',
            quantity: 0,
            // Don't need these for non-medicine items
            days: 0,
            morning: false,
            afternoon: false,
            night: false
          };
        }
      }
      return prescription;
    });

    // Clear medicine details for this row
    const updatedMedicineDetails = [...medicineDetails];
    updatedMedicineDetails[index] = null;

    setPrescriptions(updatedPrescriptions);
    setMedicineDetails(updatedMedicineDetails);
  };

  const addPrescriptionRow = () => {
    setPrescriptions([
      ...prescriptions,
      { medicine_id: '', days: 0, morning: false, afternoon: false, night: false, quantity: 0, isMedicine: true }
    ]);
    setMedicineDetails([...medicineDetails, null]);
  };

  const removePrescriptionRow = (index) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
    setMedicineDetails(medicineDetails.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); // Clear any previous messages immediately
    setIsLoading(true); // Set loading to true when submitting starts

    // Format the prescriptions for the backend
    const formattedPrescriptions = prescriptions.map(p => {
      if (p.isMedicine) {
        return {
          medicine_id: p.medicine_id.toString(),
          dosage_schedule: {
            days: Number(p.days),
            morning: p.morning,
            afternoon: p.afternoon,
            night: p.night,
          },
          quantity: p.quantity,
        };
      } else {
        return {
          medicine_id: p.medicine_id || "NON-MED", // Special identifier for non-medicines
          quantity: Number(p.quantity),
          is_medicine: false
        };
      }
    });

    const payload = {
      book_no: bookNo,
      prescriptions: formattedPrescriptions
    };

    try {
      const response = await privateAxios.post(
        `/api/patient-history/doctor-prescription`,
        payload
      );
      if (response.status >= 200 && response.status < 300) {
        setMessage('Prescription submitted successfully!');
        setTimeout(() => setMessage(''), 10000); // Clear success message after 10 seconds
        setBookNo('');
        setPrescriptions([
          { medicine_id: '', days: 0, morning: false, afternoon: false, night: false, quantity: 0, isMedicine: true }
        ]);
        setMedicineDetails([]);
      } else {
        setMessage('Failed to submit prescription.');
        setTimeout(() => setMessage(''), 10000); // Clear generic failure message after 10 seconds
      }
    } catch (error) {
      let errorMessage = 'Failed to submit prescription.';
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Error: Prescription not found for the given Book No.';
        } else if (error.response.data && error.response.data.message) {
          errorMessage = 'Error: ' + error.response.data.message;
        }
      } else {
        errorMessage = 'Error: ' + error.message;
      }

      if (error.response && error.response.status === 404) {
        setMessage(errorMessage); // Set 404 message directly, no timeout
      } else {
        setMessage(errorMessage);
        setTimeout(() => setMessage(''), 10000); // Clear generic failure message after 10 seconds
      }
    } finally {
      setIsLoading(false); // Set loading back to false after submission
    }
  };

  return (
    <div className="doctor-prescription-container-fluid">
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
      <h1 className="doctor-prescription-page-title">Doctor Prescription</h1>

      <div className="doctor-prescription-content-layout">
        <div className="doctor-prescription-main-column">
          <div className="doctor-prescription-card">
            <form onSubmit={handleSubmit} className="doctor-prescription-form">
              <div className="doctor-prescription-form-group">
                <label>Book Number</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="text"
                    value={bookNo}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBookNo(val);
                    }}
                    required
                    placeholder="Enter Book No"
                    disabled={isLoading} // Disable input while loading
                    style={{ flexGrow: 1 }}
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
              </div>
              <h3 className="doctor-prescription-subheading">Medicines</h3>
              {prescriptions.map((prescription, index) => (
                <div key={index} className="doctor-prescription-row">
                  <div className="prescription-type-toggle">
                    <div className={`toggle-option ${prescription.isMedicine ? 'active' : ''}`}
                      onClick={() => handlePrescriptionTypeChange(index, true)}>
                      By Dosing Schedule
                    </div>
                    <div className={`toggle-option ${!prescription.isMedicine ? 'active' : ''}`}
                      onClick={() => handlePrescriptionTypeChange(index, false)}>
                      By Quantity
                    </div>
                  </div>

                  <div className="doctor-prescription-form-group">
                    <label>Medicine ID</label>
                    <input
                      type="text"
                      value={prescription.medicine_id}
                      onChange={(e) =>
                        handlePrescriptionChange(index, 'medicine_id', e.target.value)
                      }
                      required
                      placeholder="e.g. 101"
                    />
                    {medicineDetails[index] && (
                      <div className="doctor-prescription-medicine-info">
                        {medicineDetails[index].error ? (
                          <p style={{ color: 'red' }}>{medicineDetails[index].error}</p>
                        ) : (
                          <>
                            <p><strong>{prescription.isMedicine ? "Formulation" : "Item"}:</strong> {medicineDetails[index].medicine_formulation}</p>
                            <p><strong>Available Stock:</strong> {medicineDetails[index].total_quantity}</p> {/* Display total_quantity */}
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {prescription.isMedicine ? (
                    <>
                      <div className="doctor-prescription-form-group">
                        <label>Days</label>
                        <input
                          type="number"
                          value={prescription.days === 0 ? '' : prescription.days}
                          onChange={(e) =>
                            handlePrescriptionChange(index, 'days', Number(e.target.value))
                          }
                          onWheel={(e) => e.target.blur()} // Disable scroll sensitivity
                          required
                          placeholder="e.g. 3"
                          disabled={isLoading} // Disable input while loading
                        />
                      </div>

                      <div className="doctor-prescription-form-group doctor-prescription-checkbox-group">
                        <label>
                          <input
                            type="checkbox"
                            checked={prescription.morning}
                            onChange={(e) =>
                              handlePrescriptionChange(index, 'morning', e.target.checked)
                            }
                            disabled={isLoading} // Disable checkbox while loading
                          />
                          Morning
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            checked={prescription.afternoon}
                            onChange={(e) =>
                              handlePrescriptionChange(index, 'afternoon', e.target.checked)
                            }
                            disabled={isLoading} // Disable checkbox while loading
                          />
                          Afternoon
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            checked={prescription.night}
                            onChange={(e) =>
                              handlePrescriptionChange(index, 'night', e.target.checked)
                            }
                            disabled={isLoading} // Disable checkbox while loading
                          />
                          Night
                        </label>
                      </div>

                      <div className="doctor-prescription-form-group">
                        <strong>Calculated Quantity:</strong> {prescription.quantity}
                      </div>
                    </>
                  ) : (
                    <div className="doctor-prescription-form-group">
                      <label>Quantity</label>
                      <input
                        type="number"
                        value={prescription.quantity === 0 ? '' : prescription.quantity}
                        onChange={(e) =>
                          handlePrescriptionChange(index, 'quantity', Number(e.target.value))
                        }
                        required
                        placeholder="Enter quantity"
                        onWheel={(e) => e.target.blur()}
                        disabled={isLoading} // Disable input while loading
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    className="doctor-prescription-remove-btn"
                    onClick={() => removePrescriptionRow(index)}
                    disabled={isLoading} // Disable button while loading
                  >
                    Remove
                  </button>
                </div>
              ))}

              <div className="doctor-prescription-btn-container">
                <button
                  type="button"
                  className="doctor-prescription-add-btn"
                  onClick={addPrescriptionRow}
                  disabled={isLoading} // Disable button while loading
                >
                  Add Item
                </button>
              </div>

              <div className="doctor-prescription-btn-container">
                {quantityExceedsError && (
                  <p className="error-message" style={{ color: 'red', marginBottom: '10px' }}>
                    {quantityExceedsError}
                  </p>
                )}
                <button
                  type="submit"
                  className="doctor-prescription-submit-btn"
                  disabled={isLoading || isSubmitDisabled} // Disable button while loading or if validation fails
                >
                  {isLoading ? 'Submitting...' : 'Submit Prescription'} {/* Show loading text */}
                </button>
              </div>
            </form>
          </div>
        </div>

        {debouncedBookNo && (
          <div className="previous-prescriptions-aside">
            <div className="doctor-prescription-card">
              <h3 className="previous-prescriptions-title">Recent History</h3>
              <p className="previous-prescriptions-subtitle">Last 2 visit records</p>

              {isHistoryLoading ? (
                <div className="history-status-msg">Loading history...</div>
              ) : previousPrescriptions.length === 0 ? (
                <div className="history-status-msg">No previous visits found.</div>
              ) : (
                <div className="previous-prescriptions-visits-container">
                  {previousPrescriptions.map((visit, vIdx) => (
                    <div key={vIdx} className="previous-visit-group">
                      <h4 className="visit-timestamp">{visit.timestamp}</h4>
                      <div className="previous-prescriptions-table-container">
                        <table className="previous-prescriptions-table">
                          <thead>
                            <tr>
                              <th>Med ID</th>
                              <th>Dose / Qty</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {visit.medicines.map((med, mIdx) => (
                              <tr key={mIdx}>
                                <td>{med.medicine_id}</td>
                                <td>
                                  {med.isMedicine ? (
                                    <span className="dosage-badge">
                                      {med.morning ? '1' : '0'}-{med.afternoon ? '1' : '0'}-{med.night ? '1' : '0'} × {med.days}d
                                    </span>
                                  ) : (
                                    <span className="qty-badge">Qty: {med.quantity}</span>
                                  )}
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="copy-prescription-btn"
                                    onClick={() => handleCopyPrescription(med)}
                                    title="Copy to prescription"
                                  >
                                    Copy
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {message && (
        <div className="doctor-prescription-popup-overlay">
          <div className="doctor-prescription-popup">
            <p>{message}</p>
            <button className="doctor-prescription-close-popup" onClick={() => setMessage('')}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorPrescription;
