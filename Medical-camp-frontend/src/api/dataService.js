// Data service for Camp Analytics
import { privateAxios } from './axios';

// Helper function to safely extract data from settled promises for CSV downloads
// CRITICAL: Returns null on failure (not []) to prevent downloading empty files due to errors
const getDownloadData = (settledResult) => {
  if (settledResult.status === 'fulfilled') {
    return settledResult.value.data; // May be [], which is acceptable (no records found)
  }
  console.error('Download data fetch failed:', settledResult.reason);
  return null; // Explicit failure — UI must handle this and prevent download
};

// Fetch all data for analytics
export const fetchCampAnalyticsData = async (month) => {
  const monthParam = month && month !== 'All' ? `?month=${month}` : '';

  // Use Promise.allSettled instead of Promise.all for better error resilience
  // This ensures that if one API fails, others can still succeed
  const results = await Promise.allSettled([
    privateAxios.get(`/api/admin/get_patients${monthParam}`),
    privateAxios.get(`/api/admin/get_doctors${monthParam}`),
    privateAxios.get('/api/admin/get_medicines'), // Medicines are not month-specific
    privateAxios.get('/api/admin/get_volunteers'),
    privateAxios.get(`/api/patient-history/summary${monthParam}`),
    privateAxios.get(`/api/vitals/all${monthParam}`), // Fetch all vitals data
  ]);

  const [patientsRes, doctorsRes, medicinesRes, volunteersRes, patientHistoriesRes, vitalsRes] = results;

  return {
    patients: getDownloadData(patientsRes),
    doctors: getDownloadData(doctorsRes),
    medicines: getDownloadData(medicinesRes),
    volunteers: getDownloadData(volunteersRes),
    patientHistories: getDownloadData(patientHistoriesRes),
    vitals: getDownloadData(vitalsRes),
  };
};

// Fetch all data for filter options
export const fetchFilterOptionsData = async () => {
  // Use Promise.allSettled for consistency and error resilience
  const results = await Promise.allSettled([
    privateAxios.get('/api/admin/get_doctors'), // No month filter for options
    privateAxios.get('/api/patient-history/summary'), // No month filter for options
  ]);

  const [allDoctorsRes, allPatientHistoriesRes] = results;

  return {
    allDoctors: getDownloadData(allDoctorsRes),
    allPatientHistories: getDownloadData(allPatientHistoriesRes),
  };
};