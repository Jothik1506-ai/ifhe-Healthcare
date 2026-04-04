import React, { useState, useEffect } from 'react';
import { privateAxios } from '../api/axios';
import '../Styles/Log.css';

const Log = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
  const [userDetails, setUserDetails] = useState({});

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await privateAxios.get('/api/logs');
      console.log('Fetched logs:', response.data);
      setLogs(response.data);
      
      // Fetch user details for all unique user IDs in the logs
      // Updated to use user._id instead of user_id
      const userIds = [...new Set(response.data.map(log => log.user_id))].filter(Boolean);
      await fetchUserDetails(userIds);
      
      setError('');
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('Failed to fetch logs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userIds) => {
    try {
        console.log('Fetching user details for IDs:', userIds);
      // Fetch user info for all user IDs (could be optimized with a bulk endpoint)
      const userDetailsObj = {};
      
      for (const userId of userIds) {
        try {
          const response = await privateAxios.get(`/api/admin/user/${userId}`);
          console.log(`Fetched details for user ${userId}:`, response.data);
          userDetailsObj[userId] = response.data;
          console.log('User details object:', userDetailsObj);
        } catch (err) {
          console.log(`Could not fetch details for user ${userId}`);
          userDetailsObj[userId] = { user_name: 'Unknown User' };
        }
      }
      
      setUserDetails(userDetailsObj);
    } catch (err) {
      console.error('Error fetching user details:', err);
    }
  };

  // Format timestamp for better display
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const [datePart, timePart] = timestamp.split(' ');
    return `${datePart} at ${timePart}`;
  };

  // Request sort
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get sorted and filtered logs
  const getSortedAndFilteredLogs = () => {
    const filtered = logs.filter(log => {
      const matchesSearch = searchTerm === '' || 
        log.action.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDate = filterDate === '' || 
        log.timestamp.startsWith(filterDate);
      
      return matchesSearch && matchesDate;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filtered;
  };

  const sortedAndFilteredLogs = getSortedAndFilteredLogs();
  
  // Get current logs for pagination
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = sortedAndFilteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(sortedAndFilteredLogs.length / logsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="logs-container">
      <h1 className="logs-title">System Activity Logs</h1>
      
      <div className="logs-filters">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="logs-search-input"
          />
        </div>
        
        <div className="date-filter-container">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="logs-date-filter"
          />
          {filterDate && (
            <button 
              className="clear-date-btn"
              onClick={() => setFilterDate('')}
            >
              Clear Date
            </button>
          )}
        </div>
      </div>
      
      {error && <div className="logs-error">{error}</div>}
      
      {loading ? (
        <div className="logs-loading">
          <div className="loading-spinner"></div>
          <p>Loading logs...</p>
        </div>
      ) : sortedAndFilteredLogs.length === 0 ? (
        <div className="no-logs">
          <p>No logs found. {searchTerm || filterDate ? 'Try adjusting your filters.' : ''}</p>
        </div>
      ) : (
        <>
          <div className="logs-table-container">
            <table className="logs-table">
              <thead>
                <tr>
                  <th onClick={() => requestSort('timestamp')} className="sortable-header">
                    Timestamp {sortConfig.key === 'timestamp' && <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                  </th>
                  <th>User</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentLogs.map((log, index) => (
                  <tr key={log._id || index}>
                    <td>{formatDate(log.timestamp)}</td>
                    <td>
                      {log.user_id && userDetails[log.user_id] 
                        ? userDetails[log.user_id].user_name 
                        : log.user_id || 'Unknown User'}
                    </td>
                    <td>{log.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => paginate(currentPage - 1)} 
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                &laquo; Previous
              </button>
              
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              
              <button 
                onClick={() => paginate(currentPage + 1)} 
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next &raquo;
              </button>
            </div>
          )}
          
          <div className="logs-summary">
            Showing {indexOfFirstLog + 1}-{Math.min(indexOfLastLog, sortedAndFilteredLogs.length)} of {sortedAndFilteredLogs.length} logs
          </div>
        </>
      )}
    </div>
  );
};

export default Log;