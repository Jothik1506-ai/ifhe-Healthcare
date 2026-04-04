import React, { useState, useEffect } from "react";
import { privateAxios } from "../api/axios";
import "../Styles/DoctorAssigningAutomatic.css";

export default function DoctorAssigningAutomatic() {
  const [formData, setFormData] = useState({
    bookNumber: "",
    doctor_names: [],
  });
  const [doctors, setDoctors] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  useEffect(() => {
    const fetchDoctors = async () => {
      setIsLoading(true); // Set loading to true while fetching doctors
      try {
        const response = await privateAxios.get("/api/doctor-assign/get_doctors");
        setDoctors(response.data);
        setError('');
      } catch (err) {
        console.error("Error fetching doctors:", err);
        setError(err.response?.data?.message || "Error fetching doctors");
      } finally {
        setIsLoading(false); // Set loading back to false after fetching
      }
    };
    fetchDoctors();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      const setNames = new Set(prev.doctor_names);
      if (checked) setNames.add(value);
      else setNames.delete(value);
      return { ...prev, doctor_names: Array.from(setNames) };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setIsLoading(true); // Set loading to true when submitting starts

    if (!formData.bookNumber) {
      setError("Please enter a book number.");
      setIsLoading(false); // Reset loading state
      return;
    }
    if (formData.doctor_names.length === 0) {
      setError("Please select at least one doctor.");
      setIsLoading(false); // Reset loading state
      return;
    }

    const payload = {
      book_no: parseInt(formData.bookNumber, 10),
      doctor_names: formData.doctor_names,
    };

    try {
      const response = await privateAxios.post("/api/queue/add", payload);
      setMessage(response.data.message || "Queue entry created successfully!");
      setError("");
      setFormData({ bookNumber: "", doctor_names: [] });
      window.scrollTo(0, 0);
    } catch (err) {
      console.error("Submission error:", err.response || err);
      const errMsg = err.response?.data?.message || err.message || "An error occurred";
      setError(errMsg);
    } finally {
      setIsLoading(false); // Set loading back to false after submission
    }
  };

  return (
    <div className="doctor-assigning-automatic-container">
      <h1 className="doctor-assigning-automatic-title">
        Doctor Assigning Automatic
      </h1>

      {message && <div className="doctor-assigning-automatic-success-msg">{message}</div>}
      {error && <div className="doctor-assigning-automatic-error-msg">{error}</div>}

      <form onSubmit={handleSubmit} className="doctor-assigning-automatic-form">
        <div className="doctor-assigning-automatic-form-group">
          <label>Book Number</label>
          <input
            type="number"
            name="bookNumber"
            value={formData.bookNumber}
            onChange={handleChange}
            required
            disabled={isLoading} // Disable input while loading
          />
        </div>

        <div className="doctor-assigning-automatic-form-group">
          <label>Select Doctor(s)</label>
          <div className="doctor-assigning-automatic-checkbox-group">
            {doctors.length > 0 ? (
              doctors.map((doctor) => (
                <label key={doctor._id}>
                  <input
                    type="checkbox"
                    name="doctor_names"
                    value={doctor.doctor_name}
                    checked={formData.doctor_names.includes(doctor.doctor_name)}
                    onChange={handleCheckboxChange}
                    disabled={isLoading} // Disable checkbox while loading
                  />
                  {doctor.doctor_name} ({doctor.specialization})
                </label>
              ))
            ) : (
              <p>No doctors available</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="doctor-assigning-automatic-submit-btn"
          disabled={isLoading} // Disable button while loading
        >
          {isLoading ? 'Submitting...' : 'Submit'} {/* Show loading text */}
        </button>
      </form>
    </div>
  );
}