import React, { useState, useEffect } from "react";
import { privateAxios } from "../api/axios";
import { useNavigate } from "react-router-dom";
import '../Styles/ViewPatients.css';

function ViewPatients() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const patientsPerPage = 20;
    const navigate = useNavigate();

    useEffect(() => {
        privateAxios
            .get("/api/admin/get_patients")
            .then((response) => {
                setPatients(response.data);
                setLoading(false);
            })
            .catch((error) => {
                console.log(error);
                setLoading(false);
            });
    }, []);

    const handlePatientClick = (patientId) => {
        navigate(`/patient/${patientId}`);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    // Filter patients based on search query
    const filteredPatients = patients.filter(patient =>
        (patient.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Reset to first page when search query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // Calculate current patients
    const indexOfLastPatient = currentPage * patientsPerPage;
    const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
    const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);

    // Change page
    const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredPatients.length / patientsPerPage)));
    const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div id="view-patients-container">
            <h1 id="page-title">View Patients</h1>

            <div className="search-box">
                <input
                    type="text"
                    placeholder="Search patients by name..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="patient-search-input"
                />
            </div>

            {filteredPatients.length > 0 ? (
                <>
                    <div id="patients-grid">
                        {currentPatients.map((patient) => (
                            <div
                                key={patient._id}
                                className="patient-card"
                                onClick={() => handlePatientClick(patient._id)}
                            >
                                <div className="patient-card-header">
                                    <span className="patient-icon">👤</span>
                                </div>
                                <div className="patient-info">
                                    <p className="patient-name">{patient.patient_name}</p>
                                    <p className="patient-details">Book #: {patient.book_no}</p>
                                    <p className="patient-details">Age: {patient.patient_age}</p>
                                    <p className="patient-details">Sex: {patient.patient_sex}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredPatients.length > patientsPerPage && (
                        <div className="pagination-container">
                            <button
                                onClick={prevPage}
                                disabled={currentPage === 1}
                                className="pagination-btn"
                            >
                                Previous
                            </button>
                            <span className="pagination-info">
                                Page {currentPage} of {Math.ceil(filteredPatients.length / patientsPerPage)}
                            </span>
                            <button
                                onClick={nextPage}
                                disabled={currentPage === Math.ceil(filteredPatients.length / patientsPerPage)}
                                className="pagination-btn"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="no-patients-found">
                    <p>No patients found matching your search criteria</p>
                </div>
            )}
        </div>
    );
}

export default ViewPatients;
