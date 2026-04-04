import React, { useState } from 'react';
import { privateAxios } from '../api/axios';
import '../Styles/PatientSearch.css';

function PatientSearch() {
    const [query, setQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError('');
        setHasSearched(true);

        try {
            const response = await privateAxios.get(`/api/patients/search?q=${encodeURIComponent(query)}&type=${filterType}`);
            setResults(response.data);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch results. Please try again.');
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="patient-search-container">
            <h1 className="search-title">Search Patients</h1>

            <form onSubmit={handleSearch} className="search-input-group">
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="search-filter-select"
                >
                    <option value="all">All</option>
                    <option value="name">Name</option>
                    <option value="phone">Mobile Number</option>
                    <option value="book_no">Book Number</option>
                </select>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter Name or Mobile Number"
                />
                <button type="submit" className="search-btn" disabled={loading}>
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </form>

            {error && <div className="error-msg">{error}</div>}

            {hasSearched && results.length === 0 && !loading && !error && (
                <div className="no-results">No patients found matching "{query}"</div>
            )}

            {results.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                    <table className="results-table">
                        <thead>
                            <tr>
                                <th>Book No</th>
                                <th>Name</th>
                                <th>Phone</th>
                                <th>Age</th>
                                <th>Sex</th>
                                <th>Area</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((patient) => (
                                <tr key={patient.book_no}>
                                    <td>{patient.book_no}</td>
                                    <td>{patient.patient_name}</td>
                                    <td>{patient.patient_phone_no}</td>
                                    <td>{patient.patient_age}</td>
                                    <td>{patient.patient_sex}</td>
                                    <td>{patient.patient_area}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default PatientSearch;
