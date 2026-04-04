import React, { useState, useEffect } from "react";
import { privateAxios } from "../api/axios";
import { useNavigate } from "react-router-dom";
import "../Styles/UpdateMedicineStock.css";

function UpdateMedicineStock() {
  const navigate = useNavigate();
  const [medicineId, setMedicineId] = useState("");
  const [medicines, setMedicines] = useState([]);
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatedQuantities, setUpdatedQuantities] = useState({});
  const [updatedExpiryDates, setUpdatedExpiryDates] = useState({});
  const [newEntry, setNewEntry] = useState({
    medicine_name: "",
    expiry_date: "",
    quantity: ""
  });
  const [showNewEntryForm, setShowNewEntryForm] = useState(false);
  const [notification, setNotification] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    medicineId: "",
    medicine_name: "",
    expiry_date: "",
    quantity: ""
  });

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        setLoading(true);
        const response = await privateAxios.get("/api/admin/get_medicines");
        setMedicines(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching medicines:", err);
        setError("Failed to load medicines list");
        setLoading(false);
      }
    };

    fetchMedicines();
  }, []);

  const validateField = (name, value) => {
    let error = "";

    if (value === null || value === undefined || value.toString().trim() === "") {
      error = `This field is required`;
    } else if (name === "quantity" && parseInt(value, 10) < 0) {
      error = "Quantity cannot be negative";
    }

    return error;
  };

  const handleFetchMedicine = async (e) => {
    e.preventDefault();

    const idError = validateField("medicineId", medicineId);
    if (idError) {
      setFieldErrors({ ...fieldErrors, medicineId: idError });
      setError("Please select a medicine from the dropdown");
      return;
    }

    setLoading(true);
    setError("");
    setFieldErrors({ ...fieldErrors, medicineId: "" });

    try {
      const foundMedicine = medicines.find(med => med.medicine_id === medicineId);

      if (!foundMedicine) {
        throw new Error("Medicine not found with the given ID");
      }

      setMedicine(foundMedicine);

      const quantities = {};
      foundMedicine.medicine_details.forEach((detail, index) => {
        quantities[index] = detail.quantity;
      });
      setUpdatedQuantities(quantities);

    } catch (error) {
      console.error("Error fetching medicine:", error);
      setError(error.message || "Medicine not found or an error occurred while fetching data.");
      setMedicine(null);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (index, value) => {
    if (value !== "" && parseInt(value, 10) < 0) {
      setNotification("Quantity cannot be negative!");
      setTimeout(() => setNotification(""), 3000);
      return;
    }

    setUpdatedQuantities({
      ...updatedQuantities,
      [index]: value === "" ? "" : parseInt(value, 10)
    });
  };

  const handleExpiryDateChange = (index, value) => {
    const dateError = validateField("expiry_date", value);
    if (dateError) {
      setNotification(dateError);
      setTimeout(() => setNotification(""), 3000);
    }

    setUpdatedExpiryDates({
      ...updatedExpiryDates,
      [index]: value
    });
  };

  const handleUpdateExpiryDate = async (index) => {
    const selectedDetail = medicine.medicine_details[index];
    const newExpiryDate = updatedExpiryDates[index];

    const dateError = validateField("expiry_date", newExpiryDate);
    if (dateError) {
      setError(dateError);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const oldFormattedDate = new Date(selectedDetail.expiry_date).toISOString().split('T')[0];
      const newFormattedDate = new Date(newExpiryDate).toISOString().split('T')[0];

      await privateAxios.post(
        "/api/admin/update_medicine_expiry_date",
        {
          medicine_id: medicineId,
          old_expiry_date: oldFormattedDate,
          new_expiry_date: newFormattedDate
        }
      );

      const updatedMedicine = { ...medicine };
      updatedMedicine.medicine_details[index].expiry_date = newExpiryDate;

      setMedicine(updatedMedicine);
      setMedicines(prev =>
        prev.map(med => med.medicine_id === medicineId ? updatedMedicine : med)
      );

      setSuccess("Expiry date updated successfully!");
    } catch (error) {
      console.error("Error updating expiry date:", error);
      setError(error.response?.data || "Failed to update expiry date");
    } finally {
      setLoading(false);
    }
  };

  const handleNewEntryChange = (e) => {
    const { name, value } = e.target;

    const fieldError = validateField(name, value);
    setFieldErrors({
      ...fieldErrors,
      [name]: fieldError
    });

    if (name === "quantity" && fieldError === "Quantity cannot be negative") {
      setNotification("Quantity cannot be negative!");
      setTimeout(() => setNotification(""), 3000);
      return;
    }

    setNewEntry({
      ...newEntry,
      [name]: name === "quantity" ? (value === "" ? "" : parseInt(value, 10)) : value
    });
  };

  const handleUpdateBatch = async (index) => {
    const selectedDetail = medicine.medicine_details[index];

    const quantityError = validateField("quantity", updatedQuantities[index]);
    if (quantityError) {
      setError(quantityError);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const formattedDate = new Date(selectedDetail.expiry_date).toISOString().split('T')[0];

      await privateAxios.post(
        "/api/admin/update_medicine_stock",
        {
          medicine_id: medicineId,
          expiry_date: formattedDate,
          quantity: updatedQuantities[index]
        }
      );

      const updatedMedicine = { ...medicine };
      updatedMedicine.medicine_details[index].quantity = updatedQuantities[index];
      updatedMedicine.total_quantity = updatedMedicine.medicine_details.reduce(
        (total, detail) => total + detail.quantity, 0
      );

      setMedicine(updatedMedicine);
      setMedicines(prev =>
        prev.map(med => med.medicine_id === medicineId ? updatedMedicine : med)
      );

      setSuccess("Batch updated successfully!");
    } catch (error) {
      console.error("Error updating batch:", error);
      setError(error.response?.data || "Failed to update batch");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewEntry = async () => {
    const nameError = validateField("medicine_name", newEntry.medicine_name);
    const dateError = validateField("expiry_date", newEntry.expiry_date);
    const quantityError = validateField("quantity", newEntry.quantity);

    const newFieldErrors = {
      medicine_name: nameError,
      expiry_date: dateError,
      quantity: quantityError
    };

    setFieldErrors({ ...fieldErrors, ...newFieldErrors });

    if (nameError || dateError || quantityError) {
      setError("Please fill in all required fields correctly");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const formattedDate = new Date(newEntry.expiry_date).toISOString().split('T')[0];

      const payload = {
        medicine_id: medicineId,
        medicine_name: newEntry.medicine_name,
        expiry_date: formattedDate,
        quantity: newEntry.quantity
      };

      console.log("Adding new batch with payload:", payload);

      const response = await privateAxios.post(
        "/api/admin/add_new_medicine_details",
        payload
      );

      console.log("Response from adding new batch:", response.data);

      const foundMedicine = medicines.find(med => med.medicine_id === medicineId);
      if (foundMedicine) {
        const updatedMedicine = { ...foundMedicine };
        updatedMedicine.medicine_details.push({
          medicine_name: newEntry.medicine_name,
          expiry_date: newEntry.expiry_date,
          quantity: newEntry.quantity
        });

        updatedMedicine.total_quantity = updatedMedicine.medicine_details.reduce(
          (total, detail) => total + detail.quantity, 0
        );

        setMedicine(updatedMedicine);
        setMedicines(prev =>
          prev.map(med => med.medicine_id === medicineId ? updatedMedicine : med)
        );

        const quantities = {};
        updatedMedicine.medicine_details.forEach((detail, index) => {
          quantities[index] = detail.quantity;
        });
        setUpdatedQuantities(quantities);
      }

      setSuccess("New batch added successfully!");

      setNewEntry({
        medicine_name: "",
        expiry_date: "",
        quantity: ""
      });

      setFieldErrors({
        ...fieldErrors,
        medicine_name: "",
        expiry_date: "",
        quantity: ""
      });

      setShowNewEntryForm(false);

    } catch (error) {
      console.error("Error adding new batch:", error);
      setError(
        error.response?.data ||
        "An error occurred while adding new batch."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="update-medicine-container">
      <button
        className="back-icon-btn"
        onClick={() => {
          if (medicine) {
            setMedicine(null);
            setMedicineId("");
            setFieldErrors({ ...fieldErrors, medicineId: "" });
          } else {
            navigate('/dashboard');
          }
        }}
        title="Back"
      >
        <svg fill="#000000" xmlns="http://www.w3.org/2000/svg"
          width="24px" height="24px" viewBox="0 0 52 52" enableBackground="new 0 0 52 52">
          <path d="M48.6,23H15.4c-0.9,0-1.3-1.1-0.7-1.7l9.6-9.6c0.6-0.6,0.6-1.5,0-2.1l-2.2-2.2c-0.6-0.6-1.5-0.6-2.1,0
            L2.5,25c-0.6,0.6-0.6,1.5,0,2.1L20,44.6c0.6,0.6,1.5,0.6,2.1,0l2.1-2.1c0.6-0.6,0.6-1.5,0-2.1l-9.6-9.6C14,30.1,14.4,29,15.3,29
            h33.2c0.8,0,1.5-0.6,1.5-1.4v-3C50,23.8,49.4,23,48.6,23z"/>
        </svg>
      </button>
      <h2>Update Medicine Stock</h2>

      {error && <div className="update-medicine-error">{error}</div>}

      {notification && (
        <div className="update-medicine-popup-overlay">
          <div className="update-medicine-popup">
            <p>{notification}</p>
            <button className="update-medicine-close-popup" onClick={() => setNotification("")}>
              Close
            </button>
          </div>
        </div>
      )}

      {(!medicine) ? (
        <form onSubmit={handleFetchMedicine} className="medicine-id-form">
          <div className="form-group">
            <label htmlFor="medicine_id">
              Select Medicine <span className="required">*</span>
            </label>
            <select
              id="medicine_id"
              value={medicineId}
              onChange={(e) => {
                setMedicineId(e.target.value);
                setFieldErrors({ ...fieldErrors, medicineId: "" });
              }}
              className={fieldErrors.medicineId ? "form-control error-input" : "form-control"}
            >
              <option value="">-- Select a Medicine --</option>
              {medicines.map(med => (
                <option key={med.medicine_id} value={med.medicine_id}>
                  {med.medicine_id} - {med.medicine_formulation}
                </option>
              ))}
            </select>
            {fieldErrors.medicineId && <div className="error-message">{fieldErrors.medicineId}</div>}
          </div>
          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? "Loading..." : "Fetch Medicine"}
          </button>
        </form>
      ) : (
        <div className="medicine-details">
          <div className="medicine-info">
            <h3>{medicine.medicine_formulation}</h3>
            <p><strong>Medicine ID:</strong> {medicine.medicine_id}</p>
            <p><strong>Total Quantity:</strong> {medicine.total_quantity}</p>
          </div>

          <h4>Medicine Batches</h4>
          <div className="table-container">
            <table className="medicine-table">
              <thead>
                <tr>
                  <th>Medicine Name</th>
                  <th>Expiry Date</th>
                  <th>Quantity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {medicine.medicine_details.map((detail, index) => (
                  <tr key={index}>
                    <td>{detail.medicine_name}</td>
                    <td>
                      <div className="expiry-date-container">
                        <span>{formatDate(detail.expiry_date)}</span>
                        <input
                          type="date"
                          value={updatedExpiryDates[index] || ''}
                          onChange={(e) => handleExpiryDateChange(index, e.target.value)}
                          className="expiry-date-input"
                        />
                        <button
                          className="action-btn update-date-btn"
                          onClick={() => handleUpdateExpiryDate(index)}
                          disabled={!updatedExpiryDates[index]}
                        >
                          Update Date
                        </button>
                      </div>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={updatedQuantities[index]}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        min="0"
                        className="quantity-input"
                      />
                    </td>
                    <td>
                      <button
                        className="action-btn update-btn"
                        onClick={() => handleUpdateBatch(index)}
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showNewEntryForm ? (
            <div className="new-entry-form">
              <h4>Add New Batch</h4>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="medicine_name">
                    Medicine Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="medicine_name"
                    name="medicine_name"
                    value={newEntry.medicine_name}
                    onChange={handleNewEntryChange}
                    placeholder="Enter medicine name"
                    required
                    className={fieldErrors.medicine_name ? "form-control error-input" : "form-control"}
                  />
                  {fieldErrors.medicine_name && <div className="error-message">{fieldErrors.medicine_name}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="expiry_date">
                    Expiry Date <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    id="expiry_date"
                    name="expiry_date"
                    value={newEntry.expiry_date}
                    onChange={handleNewEntryChange}
                    required
                    className={fieldErrors.expiry_date ? "form-control error-input" : "form-control"}
                  />
                  {fieldErrors.expiry_date && <div className="error-message">{fieldErrors.expiry_date}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="quantity">
                    Quantity <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={newEntry.quantity}
                    onChange={handleNewEntryChange}
                    placeholder="Enter quantity"
                    min="1"
                    required
                    className={fieldErrors.quantity ? "form-control error-input" : "form-control"}
                  />
                  {fieldErrors.quantity && <div className="error-message">{fieldErrors.quantity}</div>}
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowNewEntryForm(false);
                    setNewEntry({
                      medicine_name: "",
                      expiry_date: "",
                      quantity: ""
                    });
                    setFieldErrors({
                      ...fieldErrors,
                      medicine_name: "",
                      expiry_date: "",
                      quantity: ""
                    });
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="submit-btn"
                  onClick={handleAddNewEntry}
                  disabled={loading}
                >
                  {loading ? "Adding..." : "Add Batch"}
                </button>
              </div>
            </div>
          ) : (
            <button
              className="add-entry-btn"
              onClick={() => setShowNewEntryForm(true)}
            >
              Add New Batch
            </button>
          )}

          <div className="navigation-buttons">
            <button
              className="back-btn"
              onClick={() => {
                setMedicine(null);
                setMedicineId("");
                setFieldErrors({ ...fieldErrors, medicineId: "" });
              }}
            >
              Back to Medicine Selection
            </button>
            <button
              className="inventory-btn"
              onClick={() => navigate("/get-medicines")}
            >
              Return to Inventory
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="update-medicine-popup-overlay">
          <div className="update-medicine-popup">
            <p>{success}</p>
            <button className="update-medicine-close-popup" onClick={() => setSuccess("")}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UpdateMedicineStock;
