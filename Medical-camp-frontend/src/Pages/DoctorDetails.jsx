import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
// import axios from 'axios';
import '../Styles/DoctorDetails.css';
import { privateAxios } from '../api/axios';

function DoctorDetails() {
    const { id } = useParams(); // Get doctor ID from the URL
    const [doctor, setDoctor] = useState(null);

    useEffect(() => {
        // axios.get(`${process.env.REACT_APP_BACKEND}/api/admin/get_doctor/${id}`)
        privateAxios.get(`/api/admin/get_doctor/${id}`)
            .then((response) => {
                setDoctor(response.data);
            })
            .catch((error) => {
                console.log(error);
            });
    }, [id]);

    if (!doctor) {
        return <p>Loading doctor details...</p>;
    }

    return (
        <div className="doctor-details-container">
            <h1>Doctor Details</h1>
            <p><strong>Name:</strong> {doctor.doctor_name}</p>
            <p><strong>Specialization:</strong> {doctor.specialization || 'General Practice'}</p>
            <p><strong>Email:</strong> {doctor.doctor_email}</p>
            <p><strong>Phone:</strong> {doctor.doctor_phone_no}</p>
            <p><strong>Availability:</strong> {doctor.doctor_availability ? 'Available' : 'Not Available'}</p>
        </div>
    );
}

export default DoctorDetails;