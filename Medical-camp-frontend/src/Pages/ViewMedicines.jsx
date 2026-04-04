import React, { useState, useEffect } from "react";
// import axios from "axios";
import { privateAxios } from "../api/axios";
import { useNavigate } from "react-router-dom";
import '../Styles/ViewMedicines.css';

function ViewMedicines() {
    const navigate = useNavigate();
    const [medicines, setMedicines] = useState([]);
    const [showExpiredOnly, setShowExpiredOnly] = useState(false); // State to toggle expired medicines filter
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMedicines();
    }, []);

    const fetchMedicines = async () => {
        setLoading(true);
        try {
            // const response = await axios.get(`${process.env.REACT_APP_BACKEND}/api/admin/get_medicines`);
            const response = await privateAxios.get(`/api/admin/get_medicines`);
            const currentDate = new Date();

            // Process the data to identify expired batches
            const medicinesWithBatches = response.data.map(medicine => {
                const expiredBatches = medicine.medicine_details.filter(batch => {
                    const expiryDate = new Date(batch.expiry_date);
                    return expiryDate < currentDate;
                });
                const medicineNames = [...new Set(medicine.medicine_details.map(detail => detail.medicine_name))];

                return {
                    ...medicine,
                    expiredBatches: expiredBatches,
                    medicineNames: medicineNames // Add extracted names to the medicine object
                };
            });

            setMedicines(medicinesWithBatches);
        } catch (error) {
            console.error("Error fetching medicines:", error);
            alert("Failed to fetch medicines. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMedicine = async (medicineId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this medicine? This will delete ALL batches.");
        if (!confirmDelete) return;

        try {
            // await axios.post(`${process.env.REACT_APP_BACKEND}/api/admin/delete_medicine`, {
            //     medicine_id: medicineId,
            // });
            await privateAxios.post(`/api/admin/delete_medicine`, {
                medicine_id: medicineId,
            });

            alert("Medicine deleted successfully");
            fetchMedicines();
        } catch (error) {
            console.error("Error deleting medicine:", error);
            alert(`Error deleting medicine: ${error.message || "Unknown error"}`);
        }
    };

    const handleDeleteMedicineBatch = async (medicineId, expiryDate) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete the batch with expiry date ${new Date(expiryDate).toLocaleDateString()}?`);
        if (!confirmDelete) return;

        try {
            // await axios.post(`${process.env.REACT_APP_BACKEND}/api/admin/delete_medicine_batch`, {
            //     medicine_id: medicineId,
            //     expiry_date: expiryDate,
            // });
            await privateAxios.post(`/api/admin/delete_medicine_batch`, {
                medicine_id: medicineId,
                expiry_date: expiryDate,
            });

            alert("Medicine batch deleted successfully");
            fetchMedicines();
        } catch (error) {
            console.error("Error deleting medicine batch:", error);
            alert(`Error deleting medicine batch: ${error.message || "Unknown error"}`);
        }
    };

    // Filter medicines based on the "showExpiredOnly" state
    const filteredMedicines = showExpiredOnly
        ? medicines.filter(medicine => medicine.expiredBatches.length > 0)
        : medicines;

    return (
        <div className="expired-medicines-container">
            <div className="page-header">
                <h1>View Medicines</h1>
                <label htmlFor="expired-filter" className="filter-label">
                    <input
                        type="checkbox"
                        id="expired-filter"
                        checked={showExpiredOnly}
                        onChange={() => setShowExpiredOnly(!showExpiredOnly)}
                    />
                    Show Expired Medicines Only
                </label>
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading medicines...</p>
                </div>
            ) : filteredMedicines.length === 0 ? (
                <div className="no-data-container">
                    <i className="fas fa-box-open fa-3x"></i>
                    <p>No medicines found.</p>
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="expired-medicines-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Formulation</th>
                                <th>Batches</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMedicines.map((medicine) => (
                                <tr key={medicine.medicine_id}>
                                    <td className="medicine-id">{medicine.medicine_id}</td>
                                    <td className="medicine-formulation">{medicine.medicine_formulation}</td> {/* Formulation column */}
                                    <td className="expired-batches">
                                        {(showExpiredOnly ? medicine.expiredBatches : medicine.medicine_details).map((batch, index) => (
                                            <div key={index} className="batch-item">
                                                <div className="batch-details">
                                                    <span className="batch-medicine-name">
                                                        <i className="fas fa-pills"></i>
                                                        {batch.medicine_name}
                                                    </span>
                                                    <span className="batch-expiry">
                                                        <i className="fas fa-calendar-times"></i>
                                                        {new Date(batch.expiry_date).toLocaleDateString()}
                                                    </span>
                                                    <span className="batch-quantity">
                                                        <i className="fas fa-cubes"></i>
                                                        {batch.quantity} units
                                                    </span>
                                                </div>
                                                <button
                                                    className="delete-batch-btn"
                                                    onClick={() => handleDeleteMedicineBatch(medicine.medicine_id, batch.expiry_date)}
                                                >
                                                    <i className="fas fa-trash-alt"></i> Delete
                                                </button>
                                            </div>
                                        ))}
                                    </td>

                                    <td className="actions-cell">
                                        {!showExpiredOnly && ( // Only show the "Delete All" button if the filter is not selected
                                            <button
                                                className="delete-medicine-btn"
                                                onClick={() => handleDeleteMedicine(medicine.medicine_id)}
                                            >
                                                <i className="fas fa-trash"></i> Delete All
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default ViewMedicines;