import React, { useState } from "react";
import { privateAxios } from "../api/axios";
import { useNavigate } from "react-router-dom";
import "../Styles/AddMedicine.css";

function AddMedicine() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    medicine_id: "",
    medicine_formulation: "",
    medicine_name: "",
    expiry_date: "",
    quantity: ""
  });
  
  const [fieldErrors, setFieldErrors] = useState({
    medicine_id: "",
    medicine_formulation: "",
    medicine_name: "",
    expiry_date: "",
    quantity: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validateField = (name, value) => {
    let errorMessage = "";
    
    if (!value.toString().trim()) {
      return "This field is required";
    }
    
    switch (name) {
      case "quantity":
        const qty = parseInt(value);
        if (isNaN(qty) || qty <= 0) {
          errorMessage = "Quantity must be a positive number";
        }
        break;
      default:
        break;
    }
    
    return errorMessage;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "quantity" ? (value === "" ? "" : parseInt(value, 10)) : value
    });
    
    // Clear field error when user starts typing
    setFieldErrors({
      ...fieldErrors,
      [name]: ""
    });
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    
    // Validate each field
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });
    
    setFieldErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      setError("Please correct the errors before submitting");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await privateAxios.post(
        `/api/admin/add_new_medicine`,
        formData
      );

      setSuccess("Medicine added successfully!");
      setFormData({
        medicine_id: "",
        medicine_formulation: "",
        medicine_name: "",
        expiry_date: "",
        quantity: ""
      });
    } catch (error) {
      console.error("Error adding medicine:", error);
      setError(
        error.response?.data?.message || 
        "An error occurred while adding the medicine."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-medicine-page">
      <h2>Add New Medicine</h2>
      
      {error && <div className="add-medicine-error">{error}</div>}
      {success && <div className="add-medicine-success">{success}</div>}
      
      <form onSubmit={handleSubmit} className="add-medicine-form">
        <div className="add-medicine-group">
          <label htmlFor="add-medicine-id">
            Medicine ID <span className="required">*</span>
          </label>
          <input
            type="text"
            id="add-medicine-id"
            name="medicine_id"
            value={formData.medicine_id}
            onChange={handleChange}
            placeholder="Enter unique medicine ID"
            className={fieldErrors.medicine_id ? "error-input" : ""}
          />
          {fieldErrors.medicine_id && <div className="field-error">{fieldErrors.medicine_id}</div>}
        </div>
        
        <div className="add-medicine-group">
          <label htmlFor="add-medicine-formulation">
            Medicine Formulation <span className="required">*</span>
          </label>
          <input
            type="text"
            id="add-medicine-formulation"
            name="medicine_formulation"
            value={formData.medicine_formulation}
            onChange={handleChange}
            placeholder="Enter medicine formulation (e.g., Tablet, Syrup)"
            className={fieldErrors.medicine_formulation ? "error-input" : ""}
          />
          {fieldErrors.medicine_formulation && <div className="field-error">{fieldErrors.medicine_formulation}</div>}
        </div>

        <div className="add-medicine-group">
          <label htmlFor="add-medicine-name">
            Medicine Name <span className="required">*</span>
          </label>
          <input
            type="text"
            id="add-medicine-name"
            name="medicine_name"
            value={formData.medicine_name}
            onChange={handleChange}
            placeholder="Enter medicine name"
            className={fieldErrors.medicine_name ? "error-input" : ""}
          />
          {fieldErrors.medicine_name && <div className="field-error">{fieldErrors.medicine_name}</div>}
        </div>

        <div className="add-medicine-group">
          <label htmlFor="add-expiry-date">
            Expiry Date <span className="required">*</span>
          </label>
          <input
            type="date"
            id="add-expiry-date"
            name="expiry_date"
            value={formData.expiry_date}
            onChange={handleChange}
            className={fieldErrors.expiry_date ? "error-input" : ""}
          />
          {fieldErrors.expiry_date && <div className="field-error">{fieldErrors.expiry_date}</div>}
        </div>

        <div className="add-medicine-group">
          <label htmlFor="add-quantity">
            Quantity <span className="required">*</span>
          </label>
          <input
            type="number"
            id="add-quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            placeholder="Enter quantity"
            min="1"
            className={fieldErrors.quantity ? "error-input" : ""}
          />
          {fieldErrors.quantity && <div className="field-error">{fieldErrors.quantity}</div>}
        </div>

        <div className="add-medicine-actions">
          <button 
            type="submit" 
            className="add-medicine-submit" 
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Medicine"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddMedicine;
