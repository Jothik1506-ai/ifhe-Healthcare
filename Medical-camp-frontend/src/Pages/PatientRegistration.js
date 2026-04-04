
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom"; // Import useLocation and useNavigate
import { z } from "zod";
import { privateAxios } from "../api/axios";
import PatientIDCard from "../Components/PatientIDCard";
import { useQrScanner } from '../Context/QrScannerContext'; // Import useQrScanner hook
import '../Styles/PatientRegistration.css';

const CHRONIC_CONDITIONS = [
  "High Blood Pressure (BP / Tension)",
  "Sugar / Diabetes (Sugar / Injections)",
  "Heart Trouble (Heart attack / Stents)",
  "Breathing (Asthma / Pumps / Inhalers)",
  "Fits / Seizures (Fainting / Shaking)",
  "Thyroid (Goiter / Neck swelling)",
  "Kidney Issues (Dialysis / Swelling in feet)"
];

// ---------------------- ZOD VALIDATION --------------------------
const patientSchema = z.object({
  bookNumber: z.string()
    .min(1, "Book number is required")
    .trim(),

  name: z.string()
    .min(3, "Name must be at least 3 characters")
    .refine((v) => /^[A-Za-z\s]+$/.test(v), {
      message: "Name can contain letters and spaces only",
    })
    .transform((s) => s.trim())
    .refine(val => val.replace(/\s/g, '').length >= 3, {
      message: "Name must have at least 3 actual characters (excluding spaces)"
    }),

  phoneNumber: z.string()
    .refine((v) => /^[0-9\s+()-]+$/.test(v), {
      message: "Invalid characters in phone number",
    })
    .transform((s) => s.replace(/\s+/g, "").replace(/\D/g, ""))
    .refine((d) => d.length === 10 || d.length === 12, {
      message: "Phone must be 10 digits (or include country code)",
    })
    .refine((digits) => {
      if (digits.length === 12) {
        return digits.startsWith("91") && /^[6-9]/.test(digits.slice(2));
      }
      return /^[6-9]/.test(digits);
    }, {
      message: "Phone number must start with 6–9",
    })
    .transform((digits) => {
      if (digits.length === 10) return digits; // Keep 10 digits for consistency with existing data
      if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2); // Strip 91 to store 10 digits
      return digits;
    }),

  age: z.string()
    .min(1, "Age is required")
    .refine((v) => {
      const n = parseFloat(v);
      return !isNaN(n) && n >= 0.1 && n <= 120;
    }, "Age must be between 0.1 and 120"),

  gender: z.enum(['male', 'female'], {
    errorMap: () => ({ message: "Please select a gender" })
  }),

  area: z.string()
    .min(3, "Area must be at least 3 characters")
    .max(200, "Area must not exceed 200 characters")
    .transform((s) => s.trim())
    .refine(val => !/^[^a-zA-Z0-9]*$/.test(val), {
      message: "Area cannot contain only symbols"
    })
    .refine(val => val.replace(/\s/g, '').length >= 3, {
      message: "Area must have at least 3 actual characters"
    }),

  chronicHistory: z.array(z.string()).optional(),
  otherHistory: z.string().optional(),
  visitType: z.enum(['First Time', 'Follow-up Visit'], {
    errorMap: () => ({ message: "Please select a visit type" })
  }),
  followUpType: z.string().optional()
}).superRefine((data, ctx) => {
  if (data.visitType === 'Follow-up Visit' && !data.followUpType) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please select a follow-up type",
      path: ["followUpType"]
    });
  }
});

// Schema for book number only
const bookNumberSchema = z.object({
  bookNumber: z.string()
    .min(1, "Book number is required")
    .trim()
});

function PatientRegistration({ initialBookNumber = '', initialGender = '' }) {
  const [isBookNumberSubmitted, setIsBookNumberSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registeredPatient, setRegisteredPatient] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // 🔹 Area state
  const [areas, setAreas] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef(null);
  const location = useLocation(); // Initialize useLocation
  const navigate = useNavigate(); // Initialize useNavigate

  // 🔹 Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilterType, setSearchFilterType] = useState('all');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // ------------------ REACT HOOK FORM ------------------
  const { openScanner } = useQrScanner();

  const handleQrScan = (bookNumber) => {
    console.log(`QR Code detected: ${bookNumber}`);
    setValue('bookNumber', bookNumber, { shouldValidate: true });
    // Optionally trigger form submission here if desired
  };

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    trigger,
    control,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(isBookNumberSubmitted ? patientSchema : bookNumberSchema),
    defaultValues: {
      bookNumber: initialBookNumber,
      name: '',
      phoneNumber: '',
      age: '',
      gender: initialGender,
      area: '',
      chronicHistory: [],
      otherHistory: '',
      visitType: 'First Time',
      followUpType: ''
    },
    mode: "onBlur"
  });

  const selectedVisitType = useWatch({ control, name: 'visitType' });

  useEffect(() => {
    if (initialGender) {
      setValue('gender', initialGender);
    }
  }, [initialGender, setValue]);

  // Effect to handle bookNumber from dashboard scan
  useEffect(() => {
    if (location.state?.bookNumber) {
      setValue('bookNumber', location.state.bookNumber, { shouldValidate: true });
    }
  }, [location.state, setValue]);

  // Debug: Log errors
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log("Current Form Errors:", errors);
    }
  }, [errors]);

  // ------------------ SEARCH PATIENT ------------------
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError('');
    setHasSearched(true);

    try {
      const response = await privateAxios.get(`/api/patients/search?q=${encodeURIComponent(searchQuery)}&type=${searchFilterType}`);
      setSearchResults(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch search results. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPatient = (patient) => {
    reset({
      bookNumber: patient.book_no,
      name: patient.patient_name || '',
      phoneNumber: patient.patient_phone_no || '',
      age: patient.patient_age ? String(patient.patient_age) : '',
      gender: patient.patient_sex || initialGender || '',
      area: patient.patient_area || '',
      area: patient.patient_area || '',
      chronicHistory: patient.chronic_history || [],
      otherHistory: patient.other_history || '',
      visitType: patient.visit_type || 'First Time',
      followUpType: patient.follow_up_type || ''
    });
    setIsBookNumberSubmitted(true);
    setShowSearch(false);
    setSearchResults([]);
    setHasSearched(false);
    setSearchQuery('');
    setMessage('Patient details loaded from search.');
  };


  // ------------------ AREA FETCH ------------------
  const fetchAreas = async (query) => {
    if (query.length < 3) {
      setAreas([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const res = await privateAxios.get(`/api/patients/patient-areas?q=${query}`);
      setAreas(res.data);
      setShowSuggestions(res.data.length > 0);
    } catch (err) {
      console.error("Error fetching areas", err);
      setShowSuggestions(false);
    }
  };

  const handleAreaChange = (e) => {
    const value = e.target.value;
    setValue('area', value);

    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchAreas(value), 300);
  };

  const handleSuggestionClick = (area) => {
    setValue('area', area);
    setShowSuggestions(false);
    trigger('area');
  };

  // ------------------ BOOK NUMBER SUBMIT ------------------
  const handleBookNumberSubmit = async (data) => {
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await privateAxios.get(`/api/patients/${data.bookNumber}`);
      if (response.data) {
        // Populate form with existing data
        reset({
          bookNumber: response.data.book_no,
          name: response.data.patient_name || '',
          phoneNumber: response.data.patient_phone_no || '',
          age: response.data.patient_age ? String(response.data.patient_age) : '',
          gender: response.data.patient_sex || initialGender || '',
          area: response.data.patient_area || '',
          chronicHistory: response.data.chronic_history || [],
          otherHistory: response.data.other_history || '',
          visitType: response.data.visit_type || 'First Time',
          followUpType: response.data.follow_up_type || ''
        });
        setMessage('Patient data loaded successfully!');
      }
      setIsBookNumberSubmitted(true);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setMessage('No patient found. Please fill out the form.');
        // Reset form but keep book number
        reset({
          bookNumber: data.bookNumber,
          name: '',
          phoneNumber: '',
          age: '',
          gender: initialGender || '',
          area: '',
          chronicHistory: [],
          otherHistory: '',
          visitType: 'First Time',
          followUpType: ''
        });
        setIsBookNumberSubmitted(true);
      } else {
        setError(error.response?.data?.message || 'An error occurred while fetching patient data.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------ SAVE PATIENT ------------------
  const onSubmitPatient = async (data) => {
    setIsLoading(true);
    setError('');
    setMessage('');

    console.log("📤 Sending Patient Data:", {
      book_no: data.bookNumber,
      patient_name: data.name,
      patient_age: parseFloat(data.age),
      patient_sex: data.gender,
      patient_phone_no: data.phoneNumber,
      patient_area: data.area,
      chronic_history: data.chronicHistory,
      other_history: data.otherHistory,
      visit_type: data.visitType,
      follow_up_type: data.visitType === 'Follow-up Visit' ? data.followUpType : ''
    });

    try {
      const response = await privateAxios.post('/api/patients', {
        book_no: data.bookNumber,
        patient_name: data.name,
        patient_age: parseFloat(data.age),
        patient_sex: data.gender,
        patient_phone_no: data.phoneNumber,
        patient_area: data.area,
        chronic_history: data.chronicHistory || [],
        other_history: data.otherHistory || "",
        visit_type: data.visitType || "First Time",
        follow_up_type: data.visitType === 'Follow-up Visit' ? data.followUpType : ''
      });
      setMessage(response.data.message || 'Patient data saved successfully!');

      if (response.data.patient) {
        setRegisteredPatient(response.data.patient);
      }
    } catch (error) {
      console.error("Submission Error:", error);
      setError(error.response?.data?.message || 'An error occurred while saving patient data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterNext = () => {
    setRegisteredPatient(null);
    setMessage('');
    setError('');
    setShowSearch(false);
    setSearchResults([]);
    setHasSearched(false);
    setIsBookNumberSubmitted(false);
    reset({
      bookNumber: '',
      name: '',
      phoneNumber: '',
      age: '',
      gender: initialGender || '',
      area: '',
      chronicHistory: [],
      otherHistory: '',
      visitType: 'First Time',
      followUpType: ''
    });
  };

  // ------------------ RENDER ------------------
  return (
    <div className="patient-registration-container">
      {registeredPatient ? (
        <div className="registration-success-view">
          <div className="success-card">
            <div className="success-icon">✅</div>
            <h2>Registration Successful!</h2>
            <div className="patient-summary">
              <p>Book Number: <strong>{registeredPatient.book_no}</strong></p>
              <p>Patient Name: <strong>{registeredPatient.patient_name}</strong></p>
            </div>
            <div className="action-buttons">
              <button className="btn-register-next" onClick={handleRegisterNext}>Register Next Patient</button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <button
            className="back-icon-btn"
            onClick={() => {
              if (isBookNumberSubmitted) {
                setIsBookNumberSubmitted(false);
                setMessage('');
                setError('');
                reset({
                  bookNumber: '',
                  name: '',
                  phoneNumber: '',
                  age: '',
                  gender: initialGender || '',
                  area: '',
                  chronicHistory: [],
                  otherHistory: '',
                  visitType: 'First Time',
                  followUpType: ''
                });
              } else {
                navigate('/dashboard');
              }
            }}
          >
            <svg fill="#000000" xmlns="http://www.w3.org/2000/svg"
              width="24px" height="24px" viewBox="0 0 52 52" enableBackground="new 0 0 52 52">
              <path d="M48.6,23H15.4c-0.9,0-1.3-1.1-0.7-1.7l9.6-9.6c0.6-0.6,0.6-1.5,0-2.1l-2.2-2.2c-0.6-0.6-1.5-0.6-2.1,0
                L2.5,25c-0.6,0.6-0.6,1.5,0,2.1L20,44.6c0.6,0.6,1.5,0.6,2.1,0l2.1-2.1c0.6-0.6,0.6-1.5,0-2.1l-9.6-9.6C14,30.1,14.4,29,15.3,29
                h33.2c0.8,0,1.5-0.6,1.5-1.4v-3C50,23.8,49.4,23,48.6,23z"/>
            </svg>
          </button>

          <h1 className="patient-registration-title">Patient Registration</h1>

          <div className="registration-top-actions">
            <button
              className={`btn-toggle-search ${showSearch ? 'active' : ''}`}
              onClick={() => {
                setShowSearch(!showSearch);
                if (!showSearch) {
                  setError('');
                  setMessage('');
                }
              }}
            >
              {showSearch ? "Close Search" : "Search Existing Patient"}
            </button>
          </div>

          {showSearch && (
            <div className="patient-search-section">
              <form onSubmit={handleSearch} className="search-input-group">
                <select
                  value={searchFilterType}
                  onChange={(e) => setSearchFilterType(e.target.value)}
                  className="search-filter-select"
                >
                  <option value="all">All</option>
                  <option value="name">Name</option>
                  <option value="phone">Mobile</option>
                  <option value="book_no">Book No</option>
                </select>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, phone, or book no..."
                  className="search-input"
                />
                <button type="submit" className="search-btn" disabled={isSearching}>
                  {isSearching ? '...' : 'Search'}
                </button>
              </form>

              {hasSearched && searchResults.length === 0 && !isSearching && (
                <div className="no-results-msg">No patients found.</div>
              )}

              {searchResults.length > 0 && (
                <div className="search-results-table-container">
                  <table className="search-results-table">
                    <thead>
                      <tr>
                        <th>Book No</th>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.map((patient) => (
                        <tr key={patient.book_no}>
                          <td>{patient.book_no}</td>
                          <td>{patient.patient_name}</td>
                          <td>{patient.patient_phone_no}</td>
                          <td>
                            <button
                              className="btn-select-patient"
                              onClick={() => handleSelectPatient(patient)}
                            >
                              Select
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {message && <div className="patient-registration-success-msg">{message}</div>}
          {error && <div className="patient-registration-error-msg">{error}</div>}

          {
            !isBookNumberSubmitted ? (
              <form onSubmit={handleSubmit(handleBookNumberSubmit)} className="patient-registration-form">
                <div className="patient-registration-form-group">
                  <label>
                    Book Number <span className="required">*</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="text"
                      {...register("bookNumber")}
                      className={errors.bookNumber ? "error-input" : ""}
                      placeholder="Enter patient book number"
                      style={{ flexGrow: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => openScanner(handleQrScan)}
                      className="scan-btn"
                      title="Scan QR Code"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#FFFFFF"><g><rect fill="none" height="24" width="24" /></g><g><g><path d="M3,11h8V3H3V11z M5,5h4v4H5V5z" /><path d="M3,21h8v-8H3V21z M5,15h4v4H5V15z" /><path d="M13,3v8h8V3H13z M19,9h-4V5h4V9z" /><rect height="2" width="2" x="13" y="13" /><rect height="2" width="2" x="17" y="17" /><rect height="2" width="2" x="19" y="19" /><rect height="2" width="2" x="13" y="19" /><rect height="2" width="2" x="19" y="13" /><rect height="2" width="2" x="15" y="15" /><rect height="2" width="2" x="17" y="13" /><rect height="2" width="2" x="15" y="19" /></g></g></svg>
                    </button>
                  </div>
                  {errors.bookNumber && <div className="field-error">{errors.bookNumber.message}</div>}
                </div>
                <button
                  type="submit"
                  className="patient-registration-submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Submit"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit(onSubmitPatient, (errors) => console.log("Validation Errors:", errors))} className="patient-registration-form">
                <div className="patient-registration-form-group">
                  <label>Book Number</label>
                  <input
                    type="text"
                    {...register("bookNumber")}
                    disabled
                  />
                  {errors.bookNumber && <div className="field-error">{errors.bookNumber.message}</div>}
                </div>

                <div className="patient-registration-form-group">
                  <label>
                    Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("name")}
                    className={errors.name ? "error-input" : ""}
                    placeholder="Enter patient name"
                  />
                  {errors.name && <div className="field-error">{errors.name.message}</div>}
                </div>

                <div className="patient-registration-form-group">
                  <label>
                    Phone Number <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    {...register("phoneNumber")}
                    maxLength="12"
                    placeholder="Enter phone number"
                    className={errors.phoneNumber ? "error-input" : ""}
                  />
                  {errors.phoneNumber && <div className="field-error">{errors.phoneNumber.message}</div>}
                </div>

                <div className="patient-registration-form-group">
                  <label>
                    Age <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("age")}
                    placeholder="Enter patient age (0.1 - 120)"
                    className={errors.age ? "error-input" : ""}
                  />
                  {errors.age && <div className="field-error">{errors.age.message}</div>}
                </div>

                <div className="patient-registration-form-group">
                  <label>
                    Gender <span className="required">*</span>
                  </label>
                  <div className="patient-registration-radio-group">
                    <label>
                      <input
                        type="radio"
                        value="male"
                        {...register("gender")}
                      />
                      Male
                    </label>
                    <label>
                      <input
                        type="radio"
                        value="female"
                        {...register("gender")}
                      />
                      Female
                    </label>
                  </div>
                  {errors.gender && <div className="field-error">{errors.gender.message}</div>}
                </div>

                <div className="patient-registration-form-group">
                  <label>
                    Visit Type <span className="required">*</span>
                  </label>
                  <div className="patient-registration-radio-group">
                    <label>
                      <input
                        type="radio"
                        value="First Time"
                        {...register("visitType")}
                      />
                      First Time
                    </label>
                    <label>
                      <input
                        type="radio"
                        value="Follow-up Visit"
                        {...register("visitType")}
                      />
                      Follow-up Visit
                    </label>
                  </div>
                  {errors.visitType && <div className="field-error">{errors.visitType.message}</div>}

                  {selectedVisitType === 'Follow-up Visit' && (
                    <div style={{ marginTop: '10px', paddingLeft: '20px', borderLeft: '3px solid #007bff' }}>
                      <label style={{ fontSize: '0.9rem', marginBottom: '8px', display: 'block', color: '#555' }}>
                        Follow-up Action <span className="required">*</span>
                      </label>
                      <div className="patient-registration-radio-group" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                        <label>
                          <input
                            type="radio"
                            value="Book Consultation"
                            {...register("followUpType")}
                          />
                          Book Consultation
                        </label>
                        <label>
                          <input
                            type="radio"
                            value="Repeat Medicine"
                            {...register("followUpType")}
                          />
                          Repeat Medicine
                        </label>
                      </div>
                      {errors.followUpType && <div className="field-error">{errors.followUpType.message}</div>}
                    </div>
                  )}
                </div>

                <div className="patient-registration-form-group">
                  <label>
                    Area <span className="required">*</span>
                  </label>
                  <div className="area-input">
                    <input
                      type="text"
                      {...register("area")}
                      onChange={(e) => {
                        register("area").onChange(e);
                        handleAreaChange(e);
                      }}
                      onBlur={(e) => {
                        register("area").onBlur(e);
                        setTimeout(() => setShowSuggestions(false), 300);
                      }}
                      placeholder="Enter area"
                      autoComplete="off"
                      className={errors.area ? "error-input" : ""}
                    />
                    {showSuggestions && (
                      <ul className="suggestions-dropdown">
                        {areas.length > 0 ? (
                          areas.map((area, i) => (
                            <li key={i} onClick={() => handleSuggestionClick(area)}>
                              {area}
                            </li>
                          ))
                        ) : (
                          <li className="no-results">No results found</li>
                        )}
                      </ul>
                    )}
                  </div>
                  {errors.area && <div className="field-error">{errors.area.message}</div>}
                </div>

                <div className="patient-registration-form-group">
                  <label>
                    Chronic History <span className="helper-text">(select all that apply based on what the patient tells you)</span>
                  </label>
                  <div className="chronic-history-grid">
                    {CHRONIC_CONDITIONS.map((condition) => (
                      <label key={condition} className="checkbox-label">
                        <input
                          type="checkbox"
                          value={condition}
                          {...register("chronicHistory")}
                        />
                        {condition}
                      </label>
                    ))}
                    <label className="checkbox-label other-checkbox-label">
                      <span>Other:</span>
                      <input
                        type="text"
                        {...register("otherHistory")}
                        placeholder="Short Text Input"
                        className="other-history-input"
                      />
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="patient-registration-submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save"}
                </button>
              </form>
            )
          }
        </>
      )}
    </div>
  );
}

export default PatientRegistration;
