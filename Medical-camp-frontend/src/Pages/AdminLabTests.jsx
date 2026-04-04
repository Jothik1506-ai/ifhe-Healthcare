import React, { useState, useEffect } from 'react';
import { privateAxios } from '../api/axios';
import '../Styles/AdminAnalytics.css'; // Reusing some admin styles

const AdminLabTests = () => {
  const [labTests, setLabTests] = useState([]);
  const [newTestName, setNewTestName] = useState('');
  const [editingTestId, setEditingTestId] = useState(null);
  const [editingTestName, setEditingTestName] = useState('');
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null); // 'success' or 'error'

  useEffect(() => {
    fetchLabTests();
  }, []);

  const fetchLabTests = async () => {
    try {
      const response = await privateAxios.get('/api/admin/labtests');
      setLabTests(response.data.labTests);
    } catch (error) {
      console.error('Error fetching lab tests:', error.response?.data || error.message);
      showMessage(`Failed to fetch lab tests: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage(null);
      setMessageType(null);
    }, 5000); // Message disappears after 5 seconds
  };

  const handleAddTest = async (e) => {
    e.preventDefault();
    if (!newTestName.trim()) {
      showMessage('Lab test name cannot be empty.', 'error');
      return;
    }
    try {
      const response = await privateAxios.post('/api/admin/labtests', { name: newTestName });
      showMessage(response.data.message, 'success');
      setNewTestName('');
      fetchLabTests(); // Refresh the list
    } catch (error) {
      console.error('Error adding lab test:', error.response?.data || error.message);
      showMessage(`Failed to add lab test: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  const handleEditClick = (test) => {
    setEditingTestId(test._id);
    setEditingTestName(test.name);
  };

  const handleUpdateTest = async (e, id) => {
    e.preventDefault();
    if (!editingTestName.trim()) {
      showMessage('Lab test name cannot be empty.', 'error');
      return;
    }
    try {
      const response = await privateAxios.put(`/api/admin/labtests/${id}`, { name: editingTestName });
      showMessage(response.data.message, 'success');
      setEditingTestId(null);
      setEditingTestName('');
      fetchLabTests(); // Refresh the list
    } catch (error) {
      console.error('Error updating lab test:', error.response?.data || error.message);
      showMessage(`Failed to update lab test: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  const handleDeleteTest = async (id) => {
    if (window.confirm('Are you sure you want to delete this lab test?')) {
      try {
        const response = await privateAxios.delete(`/api/admin/labtests/${id}`);
        showMessage(response.data.message, 'success');
        fetchLabTests(); // Refresh the list
      } catch (error) {
        console.error('Error deleting lab test:', error.response?.data || error.message);
        showMessage(`Failed to delete lab test: ${error.response?.data?.message || error.message}`, 'error');
      }
    }
  };

  return (
    <div className="admin-analytics-container"> {/* Reusing container style */}
      <h2 className="admin-analytics-title">Manage Lab Tests</h2>

      {message && (
        <div className={`submission-message ${messageType}`}>
          {message}
        </div>
      )}

      <div className="admin-card"> {/* Reusing card style */}
        <h3>Add New Lab Test</h3>
        <form onSubmit={handleAddTest}>
          <div className="form-group">
            <label htmlFor="newTestName">Test Name:</label>
            <input
              type="text"
              id="newTestName"
              value={newTestName}
              onChange={(e) => setNewTestName(e.target.value)}
              placeholder="e.g., Blood Sugar"
              required
            />
          </div>
          <button type="submit" className="btn-primary">Add Test</button>
        </form>
      </div>

      <div className="admin-card mt-4"> {/* Reusing card style, mt-4 for margin-top */}
        <h3>Existing Lab Tests</h3>
        {labTests.length === 0 ? (
          <p>No lab tests added yet.</p>
        ) : (
          <ul className="list-group"> {/* Basic list styling */}
            {labTests.map((test) => (
              <li key={test._id} className="list-group-item d-flex justify-content-between align-items-center">
                {editingTestId === test._id ? (
                  <form onSubmit={(e) => handleUpdateTest(e, test._id)} className="d-flex w-100">
                    <input
                      type="text"
                      value={editingTestName}
                      onChange={(e) => setEditingTestName(e.target.value)}
                      className="form-control mr-2"
                      required
                    />
                    <button type="submit" className="btn btn-success btn-sm mr-1">Save</button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingTestId(null)}>Cancel</button>
                  </form>
                ) : (
                  <>
                    <span>{test.name}</span>
                    <div>
                      <button onClick={() => handleEditClick(test)} className="btn btn-info btn-sm mr-1">Edit</button>
                      <button onClick={() => handleDeleteTest(test._id)} className="btn btn-danger btn-sm">Delete</button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminLabTests;
