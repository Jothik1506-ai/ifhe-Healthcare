import React, { useEffect, useState } from 'react';
import { privateAxios } from '../api/axios';
import { useNavigate } from 'react-router-dom';
import '../Styles/DoctorAvailability.css';

function DoctorAvailability() {
    const [doctorList, setDoctorList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingDoctor, setUpdatingDoctor] = useState(null); // Track which doctor is being updated
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchDoctors();
    }, []);
    
    const fetchDoctors = () => {
        setIsLoading(true);
        privateAxios.get('/api/admin/get_doctors')
            .then((response) => {
                setDoctorList(response.data);
            })
            .catch((error) => {
                console.log(error);
                alert('Error fetching doctors. Please try again.');
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const handleDoctorClick = (id) => {
        navigate(`/doctor/${id}`); // Navigate to the doctor details page
    };

    const toggleDoctorAvailability = (id) => {
        const doctor = doctorList.find((doc) => doc._id === id);
        const updatedAvailability = !doctor.doctor_availability;
        
        // Set the updating state for this doctor
        setUpdatingDoctor(id);
        // Clear any previous success message
        setSuccessMessage('');
        
        privateAxios.put(`/api/admin/update_doctor_availability/${id}`, { 
            doctor_availability: updatedAvailability 
        })
        .then((response) => {
            setDoctorList(doctorList.map((doc) =>
                doc._id === id ? response.data : doc
            ));
            
            // Show success message
            const doctorName = response.data.doctor_name;
            const status = updatedAvailability ? 'available' : 'unavailable';
            setSuccessMessage(`Dr. ${doctorName} has been marked as ${status}`);
            
            // Hide success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
        })
        .catch((error) => {
            console.log(error);
            alert('Failed to update doctor availability. Please try again.');
        })
        .finally(() => {
            // Clear the updating state for this doctor
            setUpdatingDoctor(null);
        });
    }

    return (
        <div className="doctor-availability-container">
            <header className="doctor-availability-header">
                <h1>Doctor Availability</h1>
            </header>

            {successMessage && (
                <div className="success-message">
                    {successMessage}
                </div>
            )}
            
            <main className="doctor-availability-main">
                {isLoading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading doctors...</p>
                    </div>
                ) : doctorList.length > 0 ? (
                    <table className="doctor-availability-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Specialization</th>
                                <th>Availability</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {doctorList.map((doctor) => (
                                <tr
                                    key={doctor._id}
                                    className="doctor-row"
                                    onClick={() => handleDoctorClick(doctor._id)}
                                >
                                    <td>{doctor.doctor_name}</td>
                                    <td>{doctor.specialization || 'General Practice'}</td>
                                    <td className={`doctor-availability-status ${doctor.doctor_availability ? 'available' : 'unavailable'}`}>
                                        {doctor.doctor_availability ? 'Available' : 'Not Available'}
                                    </td>
                                    <td>
                                        <button
                                            className={`toggle-availability-btn ${updatingDoctor === doctor._id ? 'updating-btn' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent row click
                                                toggleDoctorAvailability(doctor._id);
                                            }}
                                            disabled={updatingDoctor === doctor._id}
                                        >
                                            {updatingDoctor === doctor._id ? 
                                                'Updating...' : 
                                                (doctor.doctor_availability ? 'Mark Unavailable' : 'Mark Available')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="no-doctors-message">No doctors found.</p>
                )}
            </main>
        </div>
    );
};

export default DoctorAvailability;
