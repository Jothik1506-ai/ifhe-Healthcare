import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { privateAxios } from '../api/axios';
import '../Styles/MedicinePickup.css';
import { useQrScanner } from '../Context/QrScannerContext';
import { toast, Toaster } from 'react-hot-toast';
import { Edit2, Trash2, Save, X, Scan, RefreshCcw } from 'lucide-react';

function MedicinePickup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { openScanner } = useQrScanner();
  const [bookNo, setBookNo] = useState('');
  const [prescribedMeds, setPrescribedMeds] = useState([]);
  // Removed error state, using toast instead
  const [message, setMessage] = useState('');
  const [updatedMeds, setUpdatedMeds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingMedIndex, setEditingMedIndex] = useState(null);
  const [editedQuantity, setEditedQuantity] = useState(0);

  // Status update modal states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalType, setStatusModalType] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [replacementMedicineId, setReplacementMedicineId] = useState('');
  const [replacementQuantity, setReplacementQuantity] = useState(0);
  const [statusNote, setStatusNote] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');


  const handleFetchPrescription = async () => {
    setMessage('');
    setPrescribedMeds([]);

    if (!bookNo) {
      toast.error('Please enter a valid Book No.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await privateAxios.get(
        `/api/patient-history/medicine-pickup/${bookNo}`
      );

      console.log(response.data);

      if (!response.data.medicines_prescribed || response.data.medicines_prescribed.length === 0) {
        toast.error('No medicines found for this patient.');
        return;
      }

      const medsWithInput = response.data.medicines_prescribed.map((med) => ({
        ...med,
        batches: med.batches.map((batch) => ({
          ...batch,
          quantity_taken: parseInt(med.quantity)
        }))
      }));

      setPrescribedMeds(medsWithInput);
      toast.success('Prescription fetched successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch prescription.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (location.state?.bookNumber) {
      setBookNo(location.state.bookNumber);
    }
  }, [location.state]);

  const handleQrScan = (scannedBookNumber) => {
    setBookNo(scannedBookNumber);
  };

  // Search logic for replacement medicine
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm && searchTerm.length >= 1) {
        setIsSearching(true);
        try {
          // Use the existing inventory route to search by ID
          const response = await privateAxios.get(`/api/inventory/${searchTerm}`);
          // The API returns a single object if found, or 404
          if (response.data) {
            // Adapt the response to match the structure we need
            setSearchResult({
              _id: response.data._id || searchTerm, // fallback ID
              medicine_id: searchTerm, // The endpoint returns details based on ID
              medicine_name: response.data.medicine_formulation, // Use formulation as name/desc
              medicine_formulation: response.data.medicine_formulation,
              total_quantity: response.data.total_quantity
            });
          }
        } catch (error) {
          setSearchResult(null);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResult(null);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleOpenStatusModal = (medicine, type) => {
    setSelectedMedicine(medicine);
    setStatusModalType(type);
    setShowStatusModal(true);
    setReplacementMedicineId('');
    setReplacementQuantity(medicine.quantity);
    setStatusNote('');
    setSearchTerm('');
    setSearchResult(null);
  };

  const handleCloseStatusModal = () => {
    setShowStatusModal(false);
    setSelectedMedicine(null);
    setStatusModalType('');
    setReplacementMedicineId('');
    setReplacementQuantity(0);
    setStatusNote('');
  };

  const handleSubmitStatusUpdate = () => {
    if (!selectedMedicine) return;

    if (statusModalType === 'replaced') {
      if (!replacementMedicineId || !replacementQuantity) {
        toast.error('Please select a replacement medicine and enter quantity.');
        return;
      }
    }

    setPrescribedMeds(prevMeds => prevMeds.map(med => {
      if (med._id === selectedMedicine._id) {
        return {
          ...med,
          status: statusModalType,
          status_note: statusNote,
          replacement_medicine_id: statusModalType === 'replaced' ? replacementMedicineId : undefined,
          replacement_quantity: statusModalType === 'replaced' ? replacementQuantity : undefined
        };
      }
      return med;
    }));

    handleCloseStatusModal();
    toast.success('Medicine status updated locally');
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'prescribed': return 'status-prescribed';
      case 'dispensed': return 'status-dispensed';
      case 'replaced': return 'status-replaced';
      case 'buy_outside': return 'status-buy-outside';
      case 'out_of_stock': return 'status-out-of-stock';
      default: return 'status-prescribed';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'prescribed': return 'Prescribed';
      case 'dispensed': return 'Dispensed';
      case 'replaced': return 'Replaced';
      case 'buy_outside': return 'Buy Outside';
      case 'out_of_stock': return 'Out of Stock';
      default: return 'Prescribed';
    }
  };

  const handleQuantityChange = (medIndex, batchIndex, value) => {
    setPrescribedMeds(prevMeds =>
      prevMeds.map((med, i) => {
        if (i === medIndex) {
          const updatedBatches = med.batches.map((batch, j) => {
            if (j === batchIndex) {
              return { ...batch, quantity_taken: value === '' ? '' : Math.max(0, parseInt(value)) };
            }
            return batch;
          });
          return { ...med, batches: updatedBatches };
        }
        return med;
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingMedIndex !== null) return;

    setMessage('');

    const quantityMismatch = prescribedMeds.filter(med => {
      if (med.status && med.status !== 'prescribed') return false;

      const totalGiven = med.batches.reduce((sum, batch) =>
        sum + (parseInt(batch.quantity_taken) || 0), 0);
      return totalGiven !== parseInt(med.quantity);
    });

    if (quantityMismatch.length > 0) {
      const mismatchItems = quantityMismatch.map(med =>
        `${med.medicine_id} (Prescribed: ${med.quantity}, Given: ${med.batches.reduce((sum, batch) =>
          sum + (parseInt(batch.quantity_taken) || 0), 0)})`
      ).join(', ');

      toast.error(`Quantity mismatch for: ${mismatchItems}. Total given must match prescribed.`, {
        duration: 5000,
        style: {
          border: '1px solid #ef4444',
          padding: '16px',
          color: '#713200',
        },
      });
      return;
    }

    const medicinesGiven = [];
    const statusUpdates = [];

    prescribedMeds.forEach((med) => {
      if (med.status && med.status !== 'prescribed' && med.status !== 'dispensed') {
        statusUpdates.push({
          medicine_id: med.medicine_id,
          status: med.status,
          status_note: med.status_note,
          replacement_medicine_id: med.replacement_medicine_id,
          replacement_quantity: med.replacement_quantity
        });
      }

      if (med.status === 'replaced') {
        if (med.replacement_medicine_id && med.replacement_quantity) {
          medicinesGiven.push({
            medicine_id: med.replacement_medicine_id,
            quantity: med.replacement_quantity
          });
        }
      } else if (!med.status || med.status === 'prescribed') {
        med.batches.forEach((batch) => {
          if (batch.quantity_taken > 0) {
            medicinesGiven.push({
              medicine_id: med.medicine_id,
              expiry_date: batch.expiry_date,
              quantity: batch.quantity_taken
            });
          }
        });
      }
    });

    if (medicinesGiven.length === 0 && statusUpdates.length === 0) {
      toast.error('No medicines action selected.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await privateAxios.post(
        '/api/patient-history/medicine-pickup',
        {
          book_no: bookNo,
          medicinesGiven,
          statusUpdates
        }
      );

      const newUpdatedMeds = (response.data.updated_quantities || []).map(item => ({
        medicine_id: item.medicine_id,
        picked_up_quantity: item.picked_up_quantity,
        before_quantity: item.before_quantity,
        after_quantity: item.after_quantity
      }));

      setUpdatedMeds(newUpdatedMeds);
      setMessage(`Successfully confirmed medicine pickup for Book #${bookNo}.`);
      setPrescribedMeds([]);
      toast.success('Confirmed! Medicines have been issued.');
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.insufficientStock) {
        toast.error(`${errorData.message}: ${errorData.insufficientStock.join(', ')}`, {
          duration: 6000,
          style: { border: '1px solid #ef4444', padding: '16px' }
        });
      } else {
        toast.error(errorData?.message || 'Failed to update medicines given.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePrescribedMedicine = async (prescriptionId) => {
    setMessage('');
    setIsLoading(true);

    try {
      const response = await privateAxios.delete(
        `/api/patient-history/${bookNo}/prescription/${prescriptionId}`
      );

      if (response.status === 200) {
        toast.success('Prescribed medicine deleted successfully!');
        setPrescribedMeds(prevMeds =>
          prevMeds.filter(med => med._id !== prescriptionId)
        );
      } else {
        toast.error(response.data.message || 'Failed to delete prescribed medicine.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete prescribed medicine.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPrescribedQuantity = (index, currentQuantity) => {
    setEditingMedIndex(index);
    setEditedQuantity(currentQuantity);
  };

  const handleCancelEdit = () => {
    setEditingMedIndex(null);
    setEditedQuantity(0);
  };

  const handleSavePrescribedQuantity = async (prescriptionId, newQuantity) => {
    setMessage('');
    setIsLoading(true);

    try {
      const response = await privateAxios.put(
        `/api/patient-history/${bookNo}/prescription/${prescriptionId}`,
        { new_quantity: newQuantity }
      );

      if (response.status === 200) {
        toast.success('Prescribed quantity updated successfully!');
        setPrescribedMeds(prevMeds =>
          prevMeds.map(med =>
            med._id === prescriptionId ? { ...med, quantity: newQuantity } : med
          )
        );
        handleCancelEdit();
      } else {
        toast.error(response.data.message || 'Failed to update prescribed quantity.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update prescribed quantity.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="medicine-pickup-container">
      <Toaster position="top-right" reverseOrder={false} />
      <div className="medicine-pickup-card">
        <h1 className="medicine-pickup-title">Stock Update</h1>

        <div className="medicine-pickup-form-group">
          <label>Book Number</label>
          <div className="medicine-pickup-input-wrapper">
            <input
              type="text"
              value={bookNo}
              onChange={(e) => setBookNo(e.target.value)}
              required
              placeholder="Enter Book No"
              disabled={isLoading || editingMedIndex !== null}
            />
            <button
              type="button"
              onClick={() => openScanner(handleQrScan)}
              className="scan-btn"
              title="Scan QR Code"
            >
              <Scan size={20} />
            </button>
          </div>
        </div>

        <div className="medicine-pickup-btn-container">
          <button
            type="button"
            className="medicine-pickup-fetch-btn"
            onClick={handleFetchPrescription}
            disabled={isLoading}
          >
            {isLoading ? 'Fetching...' : 'Fetch Prescription'}
          </button>
        </div>

        {prescribedMeds.length > 0 && (
          <form onSubmit={handleSubmit} className="medicine-pickup-form">
            <h3 className="medicine-pickup-subheading" style={{ textAlign: 'left', fontWeight: 'bold', fontSize: '1.25rem', margin: '30px 0 15px' }}>Prescribed Medicines</h3>

            {prescribedMeds.map((med, medIndex) => {
              const totalGiven = med.batches.reduce(
                (sum, batch) => sum + (parseInt(batch.quantity_taken) || 0),
                0
              );

              return (
                <div key={medIndex} className="medicine-block">
                  <div className="medicine-header">
                    <div className="medicine-info-group">
                      <div className="medicine-id">{med.medicine_id}</div>
                      <div className="medicine-meta">
                        Formulation: <span style={{ color: '#4b5563', fontWeight: 500 }}>{med.medicine_formulation || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="medicine-info-group" style={{ alignItems: 'flex-end', gap: '8px' }}>
                      <span className={`status-badge ${getStatusBadgeClass(med.status || 'prescribed')}`}>
                        {getStatusText(med.status || 'prescribed')}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="medicine-meta">Prescribed:</span>
                        {editingMedIndex === medIndex ? (
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <input
                              type="number"
                              min="0"
                              value={editedQuantity}
                              onChange={(e) => {
                                const value = e.target.value;
                                setEditedQuantity(value === '' ? '' : parseInt(value));
                              }}
                              disabled={isLoading}
                              style={{ width: '60px', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                            <button type="button" onClick={() => handleSavePrescribedQuantity(med._id, parseInt(editedQuantity) || 0)} disabled={isLoading} style={{ cursor: 'pointer', border: 'none', background: 'none', color: '#16a34a' }} title="Save"><Save size={18} /></button>
                            <button type="button" onClick={handleCancelEdit} disabled={isLoading} style={{ cursor: 'pointer', border: 'none', background: 'none', color: '#ef4444' }} title="Cancel"><X size={18} /></button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontWeight: '800', fontSize: '1.25rem', color: '#111827' }}>{med.quantity}</span>
                            <button type="button" title="Edit Quantity" onClick={() => handleEditPrescribedQuantity(medIndex, med.quantity)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.8, color: '#2563eb' }}><Edit2 size={16} /></button>
                            <button type="button" title="Delete Medicine" onClick={() => handleDeletePrescribedMedicine(med._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.8, color: '#ef4444' }}><Trash2 size={16} /></button>
                          </div>
                        )}
                      </div>

                      <span className={`quantity-badge ${totalGiven === parseInt(med.quantity) ? 'match' : 'mismatch'}`}>
                        Given: <strong style={{ marginLeft: '4px' }}>{totalGiven}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="medicine-body">
                    {/* Status Actions */}
                    <div className="status-actions">
                      <button
                        type="button"
                        className={`status-action-btn btn-replace ${med.status === 'replaced' ? 'active' : ''}`}
                        onClick={() => handleOpenStatusModal(med, 'replaced')}
                        disabled={isLoading}
                      >
                        REPLACE
                      </button>
                      <button
                        type="button"
                        className={`status-action-btn btn-buy-outside ${med.status === 'buy_outside' ? 'active' : ''}`}
                        onClick={() => handleOpenStatusModal(med, 'buy_outside')}
                        disabled={isLoading}
                      >
                        BUY OUTSIDE
                      </button>
                      <button
                        type="button"
                        className={`status-action-btn btn-out-of-stock ${med.status === 'out_of_stock' ? 'active' : ''}`}
                        onClick={() => handleOpenStatusModal(med, 'out_of_stock')}
                        disabled={isLoading}
                      >
                        OUT OF STOCK
                      </button>

                      {med.status && med.status !== 'prescribed' && (
                        <button
                          type="button"
                          className="status-action-btn btn-reset"
                          onClick={() => {
                            setPrescribedMeds(prevMeds => prevMeds.map(m => {
                              if (m._id === med._id) {
                                return {
                                  ...m,
                                  status: 'prescribed',
                                  status_note: '',
                                  replacement_medicine_id: undefined,
                                  replacement_quantity: undefined
                                };
                              }
                              return m;
                            }));
                          }}
                          disabled={isLoading}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}
                        >
                          <RefreshCcw size={14} /> RESET
                        </button>
                      )}
                    </div>

                    {/* Replacement / Status Info */}
                    {(med.status === 'replaced' || med.status_note) && (
                      <div className="replacement-info">
                        {med.status === 'replaced' && med.replacement_medicine_id && (
                          <div style={{ display: 'flex', gap: '20px', marginBottom: '8px' }}>
                            <div><strong>Replacement ID:</strong> {med.replacement_medicine_id}</div>
                            <div><strong>Qty:</strong> {med.replacement_quantity}</div>
                          </div>
                        )}
                        {med.status_note && (
                          <div>
                            <strong>Note:</strong> {med.status_note}
                          </div>
                        )}
                      </div>
                    )}

                    {med.status !== 'out_of_stock' && med.status !== 'buy_outside' && (
                      <>
                        {/* Batches Header */}
                        <div style={{ margin: '20px 0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inventory Batches</h4>
                        </div>

                        <div className="batches-container">
                          {med.batches.map((batch, batchIndex) => (
                            <div key={batchIndex} className="batch-card">
                              <div className="batch-header">
                                <div className="batch-info">
                                  <h4>Expiry: {new Date(batch.expiry_date).toLocaleDateString()}</h4>
                                </div>
                                <div className="stock-indicator">
                                  Available: {med.total_quantity}
                                </div>
                              </div>

                              <div className="input-give-group">
                                <label>Quantity to Give</label>
                                <input
                                  type="number"
                                  min="0"
                                  max={med.total_quantity}
                                  value={batch.quantity_taken}
                                  onChange={(e) =>
                                    handleQuantityChange(medIndex, batchIndex, e.target.value)
                                  }
                                  onWheel={(e) => e.target.blur()}
                                  disabled={isLoading}
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="medicine-pickup-btn-container">
              <button
                type="submit"
                className="medicine-pickup-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Submitting...' : 'Confirm Pickup'}
              </button>
            </div>
          </form>
        )}
      </div>

      {message && (
        <div className="medicine-pickup-popup-overlay">
          <div className="medicine-pickup-popup">
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: '#ecfdf5',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h2>Pickup Confirmed</h2>
              <p>{message}</p>
            </div>

            {updatedMeds.length > 0 && (
              <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '24px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Qty</th>
                      <th>Before</th>
                      <th>After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {updatedMeds.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: '600' }}>{item.medicine_id}</td>
                        <td style={{ color: '#2563eb', fontWeight: '700' }}>{item.picked_up_quantity}</td>
                        <td style={{ color: '#64748b' }}>{item.before_quantity}</td>
                        <td style={{ color: '#059669', fontWeight: '600' }}>{item.after_quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <button className="medicine-pickup-close-popup" onClick={() => setMessage('')}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="status-modal-overlay">
          <div className="status-modal">
            <div className="status-modal-header">
              <h3>
                {statusModalType === 'replaced' && 'Replace Medicine'}
                {statusModalType === 'buy_outside' && 'Buy Outside'}
                {statusModalType === 'out_of_stock' && 'Mark as Out of Stock'}
              </h3>
              <button
                className="status-modal-close-btn"
                onClick={handleCloseStatusModal}
                disabled={isLoading}
              >
                <X size={24} />
              </button>
            </div>

            <div className="status-modal-body">
              {selectedMedicine && (
                <div className="status-modal-info">
                  <p>
                    <span style={{ color: '#6b7280' }}>Medicine ID:</span>
                    <strong style={{ color: '#111827' }}>{selectedMedicine.medicine_id}</strong>
                  </p>
                  <p>
                    <span style={{ color: '#6b7280' }}>Prescribed Qty:</span>
                    <strong style={{ color: '#111827' }}>{selectedMedicine.quantity}</strong>
                  </p>
                </div>
              )}

              <div className="status-modal-form">
                {statusModalType === 'replaced' && (
                  <>
                    <label>
                      <span>Replacement Medicine</span>
                      <div className="medicine-search-container">
                        <input
                          type="text"
                          placeholder="Enter Medicine ID..."
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setReplacementMedicineId(e.target.value);
                          }}
                          className="medicine-search-input"
                          style={{
                            borderColor: !isSearching && searchResult ? '#10b981' : (searchTerm && !isSearching && !searchResult ? '#ef4444' : '')
                          }}
                        />

                        <div style={{ marginTop: '8px', minHeight: '20px' }}>
                          {isSearching && (
                            <div style={{ color: '#6b7280', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className="search-spinner"></span> Checking ID...
                            </div>
                          )}

                          {!isSearching && searchResult && (
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '10px 14px',
                              backgroundColor: '#f0f9ff',
                              border: '1px solid #bae6fd',
                              borderRadius: '8px',
                              marginTop: '4px'
                            }}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.8rem', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Selected Medicine</span>
                                <span style={{ fontSize: '1rem', color: '#0c4a6e', fontWeight: '700' }}>{searchResult.medicine_formulation}</span>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: '600', display: 'block' }}>Stock</span>
                                <span style={{
                                  fontSize: '0.95rem',
                                  fontWeight: '700',
                                  color: searchResult.total_quantity > 0 ? '#059669' : '#dc2626'
                                }}>
                                  {searchResult.total_quantity} Units
                                </span>
                              </div>
                            </div>
                          )}

                          {!isSearching && !searchResult && searchTerm.length >= 1 && (
                            <div style={{
                              color: '#dc2626',
                              fontSize: '0.85rem',
                              backgroundColor: '#fef2f2',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: '1px solid #fee2e2',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <i className="fas fa-exclamation-circle"></i> No medicine found with ID "{searchTerm}"
                            </div>
                          )}
                        </div>
                      </div>
                    </label>

                    <label>
                      <span>Replacement Quantity</span>
                      <input
                        type="number"
                        min="1"
                        value={replacementQuantity}
                        onChange={(e) => setReplacementQuantity(parseInt(e.target.value) || 0)}
                        onWheel={(e) => e.target.blur()}
                        placeholder="Enter quantity"
                        required
                      />
                    </label>
                  </>
                )}

                <label>
                  <span>Note (Optional)</span>
                  <textarea
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder={
                      statusModalType === 'buy_outside'
                        ? "E.g., Client prefers specific brand..."
                        : "Enter reason or additional notes..."
                    }
                  />
                </label>
              </div>
            </div>

            <div className="status-modal-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={handleCloseStatusModal}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-submit"
                onClick={handleSubmitStatusUpdate}
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default MedicinePickup;
