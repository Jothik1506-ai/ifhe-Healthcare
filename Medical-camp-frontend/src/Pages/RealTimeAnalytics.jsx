import React, { useState, useEffect, useCallback } from 'react';
import { useAnalyticsSocket } from '../hooks/useSocket';
import axios from 'axios';
import { BACKEND_URL } from '../config/api';
import '../Styles/RealTimeAnalytics.css';

const RealTimeAnalytics = () => {
  // Real-time analytics state
  const [realTimeData, setRealTimeData] = useState({
    totalPatients: 0,
    activeConsultations: 0,
    prescriptionsGenerated: 0,
    medicinesReceived: 0,
    vitalsRecorded: 0,
    completedConsultations: 0,
    repeatMedicinePatients: []
  });

  // State for medicine inventory
  const [medicineInventory, setMedicineInventory] = useState({});

  // Fetch today's analytics data on component mount
  useEffect(() => {
    const fetchTodayAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${BACKEND_URL}/api/analytics/today`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        // Initialize with today's actual counts from database
        setRealTimeData({
          totalPatients: response.data.totalPatients || 0,
          vitalsRecorded: response.data.vitalsRecorded || 0,
          activeConsultations: response.data.activeConsultations || 0,
          completedConsultations: response.data.completedConsultations || 0,
          prescriptionsGenerated: response.data.prescriptionsGenerated || 0,
          medicinesReceived: response.data.medicinesReceived || 0,
          repeatMedicinePatients: response.data.repeatMedicinePatients || []
        });

        // Initialize medicine inventory with dispensed medicines only
        setMedicineInventory(response.data.dispensedMedicines || {});

        console.log('📊 Today\'s analytics loaded:', response.data);
      } catch (error) {
        console.error('Error fetching today\'s analytics:', error);
      }
    };

    fetchTodayAnalytics();
  }, []);

  // WebSocket handler for real-time analytics updates
  const handleAnalyticsUpdate = useCallback((eventType, data) => {
    console.log('Analytics update received:', eventType, data);

    // Update real-time analytics based on event type
    setRealTimeData(prev => {
      switch (eventType) {
        case 'patient-registered':
          const isRepeatMedicine = data.visit_type === 'Follow-up Visit' && data.follow_up_type === 'Repeat Medicine';
          return {
            ...prev,
            totalPatients: prev.totalPatients + 1,
            repeatMedicinePatients: isRepeatMedicine
              ? [...prev.repeatMedicinePatients, { book_no: data.book_no, patient_name: data.patient_name }]
              : prev.repeatMedicinePatients
          };
        case 'vitals-recorded':
          return { ...prev, vitalsRecorded: prev.vitalsRecorded + 1 };
        case 'medicine-received':
          return { ...prev, medicinesReceived: prev.medicinesReceived + 1 };
        case 'prescription-generated':
          return { ...prev, prescriptionsGenerated: prev.prescriptionsGenerated + 1 };
        case 'consultation-started':
          return { ...prev, activeConsultations: prev.activeConsultations + 1 };
        case 'consultation-completed':
          return {
            ...prev,
            activeConsultations: Math.max(0, prev.activeConsultations - 1),
            completedConsultations: prev.completedConsultations + 1
          };
        default:
          return prev;
      }
    });

    // Update medicine inventory if it's a medicine distribution event
    if (eventType === 'medicine-distributed' && data) {
      setMedicineInventory(prev => {
        const medicineId = data.medicine_id || 'Unknown';
        const currentMedicine = prev[medicineId] || { totalQuantity: 0, dispensedQuantity: 0 };

        return {
          ...prev,
          [medicineId]: {
            totalQuantity: currentMedicine.totalQuantity,
            dispensedQuantity: (currentMedicine.dispensedQuantity || 0) + (data.quantity || 0)
          }
        };
      });
    }

    // Update medicine inventory when medicines are dispensed to patients
    if (eventType === 'medicine-dispensed' && data) {
      setMedicineInventory(prev => {
        const medicineId = data.medicine_id || 'Unknown';
        const currentMedicine = prev[medicineId] || { totalQuantity: 0, dispensedQuantity: 0 };

        return {
          ...prev,
          [medicineId]: {
            totalQuantity: currentMedicine.totalQuantity, // Keep total unchanged
            dispensedQuantity: (currentMedicine.dispensedQuantity || 0) + (data.quantity || 0)
          }
        };
      });
    }
  }, []);

  // Initialize WebSocket connection for analytics
  const { isConnected } = useAnalyticsSocket(handleAnalyticsUpdate);

  return (
    <div className="real-time-analytics-container">
      <h1>Real-time Analytics Dashboard</h1>
      <div className={`connection-status-banner ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? '🟢 Real-time analytics active' : '🔴 Connecting to real-time updates...'}
      </div>

      <div className="real-time-analytics-grid">
        <div className="real-time-card">
          <div className="real-time-item">
            <span className="label">Patients Registered</span>
            <span className="value">{realTimeData.totalPatients}</span>
          </div>
        </div>

        <div className="real-time-card">
          <div className="real-time-item">
            <span className="label">Vitals Recorded</span>
            <span className="value">{realTimeData.vitalsRecorded}</span>
          </div>
        </div>

        <div className="real-time-card">
          <div className="real-time-item">
            <span className="label">Active Consultations</span>
            <span className="value">{realTimeData.activeConsultations}</span>
          </div>
        </div>

        <div className="real-time-card">
          <div className="real-time-item">
            <span className="label">Completed Consultations</span>
            <span className="value">{realTimeData.completedConsultations}</span>
          </div>
        </div>

        <div className="real-time-card">
          <div className="real-time-item">
            <span className="label">Prescriptions Generated</span>
            <span className="value">{realTimeData.prescriptionsGenerated}</span>
          </div>
        </div>

        <div className="real-time-card">
          <div className="real-time-item">
            <span className="label">Medicines Received</span>
            <span className="value">{realTimeData.medicinesReceived}</span>
          </div>
        </div>
      </div>

      {/* Priority Patients Table - Blinking */}
      {realTimeData.repeatMedicinePatients.length > 0 && (
        <div className="priority-patients-container blinking-border">
          <h3 className="blinking-text">⚠️ Priority: Repeat Medicines</h3>
          <div className="table-responsive">
            <table className="priority-patients-table">
              <thead>
                <tr>
                  <th>Book No</th>
                  <th>Patient Name</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {realTimeData.repeatMedicinePatients.map((patient, index) => (
                  <tr key={`${patient.book_no}-${index}`}>
                    <td>{patient.book_no}</td>
                    <td>{patient.patient_name}</td>
                    <td>Repeat Medicine</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Medicine Inventory Table - Shows only dispensed medicines */}
      <div className="medicine-inventory-table-container">
        <h3>Medicines Dispensed Today</h3>
        <div className="table-responsive">
          <table className="medicine-inventory-table">
            <thead>
              <tr>
                <th>Medicine ID</th>
                <th>Dispensed Today</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(medicineInventory).length > 0 ? (
                Object.entries(medicineInventory)
                  .map(([medicineId, details]) => ({
                    medicineId,
                    dispensedToday: details.dispensedQuantity || 0,
                    remaining: (details.totalQuantity || 0) - (details.dispensedQuantity || 0)
                  }))
                  .sort((a, b) => b.dispensedToday - a.dispensedToday) // Sort by dispensed quantity (descending)
                  .map((record) => (
                    <tr key={record.medicineId}>
                      <td>{record.medicineId}</td>
                      <td>{record.dispensedToday}</td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan="2" className="no-data">No medicines dispensed today</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RealTimeAnalytics;