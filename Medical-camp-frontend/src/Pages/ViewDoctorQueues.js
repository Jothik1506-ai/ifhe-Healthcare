
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { privateAxios } from '../api/axios';
import '../Styles/ViewDoctorQueues.css';
import { useSocket } from '../hooks/useSocket';



const ViewDoctorQueues = () => {
    const { type } = useParams();
    const navigate = useNavigate();

    // State for doctors list (for filter)
    const [doctors, setDoctors] = useState([]);

    // State for queue data
    const [allQueueData, setAllQueueData] = useState([]);
    const [filteredQueueData, setFilteredQueueData] = useState([]);

    // State for filter
    const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('');

    // UI states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // WebSocket connection
    const { socket, isConnected } = useSocket();

    const fetchDoctorsAndQueue = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // 1. Fetch all doctors for the dropdown
            const doctorsResponse = await privateAxios.get('/api/admin/get_doctors?month=All');
            setDoctors(doctorsResponse.data);

            // 2. Fetch the consolidated queue for the given type (sent without doctor_id)
            // The backend has been updated to return all queues if doctor_id is missing.
            const queueResponse = await privateAxios.post(`/api/patients/queue/${type}`, {});

            const queue = queueResponse.data.queue || [];
            setAllQueueData(queue);

            // Apply filter if one is selected
            if (selectedDoctorFilter) {
                const filtered = queue.filter(item => item.doctor_name === selectedDoctorFilter);
                setFilteredQueueData(filtered);
            } else {
                setFilteredQueueData(queue);
            }

        } catch (err) {
            console.error("Error fetching data", err);
            setError("Failed to load queue data.");
        } finally {
            setLoading(false);
        }
    }, [type, selectedDoctorFilter]);

    useEffect(() => {
        fetchDoctorsAndQueue();
    }, [fetchDoctorsAndQueue]);

    // WebSocket event listeners for real-time updates
    useEffect(() => {
        if (!socket) return;

        const handleDoctorAssigned = () => {
            console.log('🔄 Doctor assigned - refreshing queue...');
            fetchDoctorsAndQueue();
        };

        const handleQueueUpdated = () => {
            console.log('🔄 Queue updated - refreshing...');
            fetchDoctorsAndQueue();
        };

        const handleVitalsRecorded = () => {
            console.log('🔄 Vitals recorded - refreshing queue...');
            fetchDoctorsAndQueue();
        };

        const handleConsultationCompleted = () => {
            console.log('🔄 Consultation completed - refreshing queue...');
            fetchDoctorsAndQueue();
        };

        // Listen for events that affect doctor queues
        socket.on('queue:added', handleQueueUpdated);
        socket.on('queue:removed', handleQueueUpdated);
        socket.on('doctor:assigned', handleDoctorAssigned);
        socket.on('vitals:recorded', handleVitalsRecorded);
        socket.on('consultation:completed', handleConsultationCompleted);

        return () => {
            socket.off('queue:added', handleQueueUpdated);
            socket.off('queue:removed', handleQueueUpdated);
            socket.off('doctor:assigned', handleDoctorAssigned);
            socket.off('vitals:recorded', handleVitalsRecorded);
            socket.off('consultation:completed', handleConsultationCompleted);
        };
    }, [socket, fetchDoctorsAndQueue]);

    const handleDoctorFilterChange = (e) => {
        const doctorName = e.target.value;
        setSelectedDoctorFilter(doctorName);

        if (doctorName === '') {
            setFilteredQueueData(allQueueData);
        } else {
            const filtered = allQueueData.filter(item => item.doctor_name === doctorName);
            setFilteredQueueData(filtered);
        }
    };

    const formatTime = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="view-doctor-queues-container">
            <button className="back-btn-main" onClick={() => navigate(-1)}>
                &larr; Back to Dashboard
            </button>

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
                {isConnected ? '🟢 Real-time updates active' : '🔴 Connecting to real-time updates...'}
            </div>

            {/* Header Area */}
            <div className="queue-header-row">
                <h1 className="page-title">
                    {type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Doctor'} Queues
                </h1>

                {/* Doctor Filter Dropdown */}
                <div className="filter-wrapper">
                    <label htmlFor="doctorFilter">Filter by Doctor: </label>
                    <select
                        id="doctorFilter"
                        value={selectedDoctorFilter}
                        onChange={handleDoctorFilterChange}
                        className="doctor-filter-select"
                    >
                        <option value="">All Doctors</option>
                        {doctors.map(doc => (
                            <option key={doc._id} value={doc.doctor_name}>
                                {doc.doctor_name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            {loading ? (
                <div className="loading-spinner">Loading queue...</div>
            ) : (
                <div className="queue-detail-view">
                    <div className="selected-doctor-header">
                        <h2>
                            {selectedDoctorFilter ? `Queue for Dr. ${selectedDoctorFilter}` : 'All Queues'}
                        </h2>
                        <span className="queue-count-badge">
                            {filteredQueueData.length} Patients
                        </span>
                    </div>

                    {filteredQueueData.length > 0 ? (
                        <div className="queue-list-container">
                            <table className="queue-table">
                                <thead>
                                    <tr>
                                        <th>Position</th>
                                        <th>Book No</th>
                                        <th>Patient Name</th>
                                        <th>Assigned At</th>
                                        <th>Doctor Name</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredQueueData.map((item, index) => (
                                        <tr key={index}>
                                            <td>{index + 1}</td>
                                            <td>{item.book_no}</td>
                                            <td>{item.patient_name}</td>
                                            <td>{formatTime(item.assigned_at)}</td>
                                            <td>{item.doctor_name}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-queue-message">
                            <p>No patients currently in this queue.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ViewDoctorQueues;
