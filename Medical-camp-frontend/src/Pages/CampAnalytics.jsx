// src/Pages/CampAnalytics.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { privateAxios } from '../api/axios';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { format } from 'date-fns';
import '../Styles/CampAnalytics.css';
import {
  exportVolunteersToCSV,
  exportPatientsToCSV,
  exportCampSummaryToCSV,
  exportDoctorPatientRatioToCSV,
  exportMedicineDistributionToCSV,
  exportMedicineInventoryToCSV
} from '../api/csvService';
import { fetchCampAnalyticsData, fetchFilterOptionsData } from '../api/dataService';
import FilterControls from '../Components/FilterControls';
import CSVDownloadButtons from '../Components/CSVDownloadButtons';

const TableView = ({ data, columns }) => (
  <div className="table-responsive">
    <table>
      <thead>
        <tr>
          {columns.map(col => <th key={col.key}>{col.title}</th>)}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {columns.map(col => <td key={col.key}>{row[col.key]}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const CampAnalytics = () => {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [patientHistories, setPatientHistories] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [allPatientHistoriesForMonths, setAllPatientHistoriesForMonths] = useState([]);
  const [allDoctorsForMonths, setAllDoctorsForMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('graph');

  // Track which data failed to load (for CSV download validation)
  const [dataLoadErrors, setDataLoadErrors] = useState({
    patients: false,
    doctors: false,
    medicines: false,
    volunteers: false,
    patientHistories: false,
    vitals: false
  });

  const navigate = useNavigate();
  const location = useLocation();

  const [selectedMonth, setSelectedMonth] = useState('All');

  const [appliedFilters, setAppliedFilters] = useState({
    month: 'All',
    hasSubmitted: true, // Changed to true to display data on initial load
  });

  // On initial load, sync from URL params
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const month = queryParams.get('month') || 'All';

    if (month !== 'All') {
      setSelectedMonth(month);
      setAppliedFilters({ month, hasSubmitted: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Sync URL with applied filters
  useEffect(() => {
    if (!appliedFilters.hasSubmitted) return;
    const params = new URLSearchParams();
    if (appliedFilters.month !== 'All') params.set('month', appliedFilters.month);
    navigate({ search: params.toString() }, { replace: true });
  }, [appliedFilters, navigate]);

  // Build unique, sorted options for filters (from all data)
  const { monthOptions, doctorOptions } = useMemo(() => {
    const monthSet = new Set();
    const doctorSet = new Set();

    // Use allPatientHistoriesForMonths to get all available months
    allPatientHistoriesForMonths.forEach(history => {
      history.visits.forEach(visit => {
        if (visit?.timestamp) monthSet.add(visit.timestamp);
      });
    });

    // Use allDoctorsForMonths to get all available doctors
    allDoctorsForMonths.forEach(d => {
      if (d?.doctor_name) doctorSet.add(d.doctor_name);
    });

    const months = ['All', ...Array.from(monthSet).sort((a, b) => a.localeCompare(b))];
    const drs = ['All', ...Array.from(doctorSet).sort((a, b) => a.localeCompare(b))];

    console.log('Generated month options:', months);
    console.log('Generated doctor options:', drs);

    return { monthOptions: months, doctorOptions: drs };
  }, [allPatientHistoriesForMonths, allDoctorsForMonths]); // Depend on all data for options

  // Validate current selections against available options
  useEffect(() => {
    if (!monthOptions.includes(selectedMonth)) setSelectedMonth('All');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthOptions]);

  // Apply filters
  const filteredPatients = useMemo(() => {
    const { month } = appliedFilters;
    if (!appliedFilters.hasSubmitted) return [];

    console.log('Filtering patients with:', { month }); // Debug log
    console.log('Patients before filtering:', patients); // Debug log
    console.log('Patient Histories for filtering:', patientHistories); // Debug log

    const filtered = patients.filter(p => {
      // Month match: Check patient's createdAt OR patient's history visits
      const monthMatch =
        month === 'All' ||
        (p.createdAt && format(new Date(p.createdAt), 'yyyy-MM') === month) ||
        (patientHistories.some(history =>
          history.book_no === p.book_no &&
          history.visits.some(visit => visit.timestamp === month)
        ));

      return monthMatch;
    });
    console.log('Patients after filtering:', filtered); // Debug log
    return filtered;
  }, [patients, appliedFilters, patientHistories]);

  // Filter volunteers based on month
  const filteredVolunteers = useMemo(() => {
    const { month } = appliedFilters;
    if (!appliedFilters.hasSubmitted) return [];

    const filtered = volunteers.filter(volunteer => {
      // Month match: Check volunteer's list_of_visits
      return month === 'All' ||
        volunteer.list_of_visits.some(visit => visit.timestamp === month);
    });

    console.log('Volunteers after filtering:', filtered);
    return filtered;
  }, [volunteers, appliedFilters]);

  // Charts/tables data (keep hooks above any return)
  const genderData = useMemo(() => {
    const maleCount = filteredPatients.filter(p => p.patient_sex && p.patient_sex.toLowerCase() === 'male').length;
    const femaleCount = filteredPatients.filter(p => p.patient_sex && p.patient_sex.toLowerCase() === 'female').length;
    const otherCount = filteredPatients.filter(p => p.patient_sex && p.patient_sex.toLowerCase() === 'other').length;

    return [
      { name: 'Male', value: maleCount },
      { name: 'Female', value: femaleCount },
    ];
  }, [filteredPatients]);


  const doctorPatientData = useMemo(() => {
    const doctorVisitCounts = new Map();

    patientHistories.forEach(history => {
      history.visits.forEach(visit => {
        if (visit.doctor_id) {
          doctorVisitCounts.set(visit.doctor_id, (doctorVisitCounts.get(visit.doctor_id) || 0) + 1);
        }
      });
    });

    const data = Array.from(doctorVisitCounts.entries())
      .map(([doctorId, count]) => {
        // Match doctor_id from patient history visits with doctor.doctor_id (numeric ID)
        const doctor = allDoctorsForMonths.find(d => d.doctor_id === doctorId);
        return {
          name: doctor ? doctor.doctor_name : `Unknown Doctor (ID: ${doctorId})`,
          patients: count
        };
      })
      .filter(d => d.patients > 0);

    console.log('Doctor-Patient Ratio Data:', data); // Final debug log
    return data;
  }, [allDoctorsForMonths, patientHistories]);

  const medicineDistributionData = useMemo(() => {
    const aggregatedMedicines = new Map();

    patientHistories.forEach(history => {
      history.visits.forEach(visit => {
        if (visit.medicines_given) {
          visit.medicines_given.forEach(givenMed => {
            const medId = givenMed.medicine_id;
            aggregatedMedicines.set(
              medId,
              (aggregatedMedicines.get(medId) || 0) + givenMed.quantity
            );
          });
        }
      });
    });

    const data = Array.from(aggregatedMedicines.entries()).map(([medicine_id, distributed_quantity]) => ({
      medicine_id,
      distributed_quantity,
    }));

    return data.sort((a, b) => {
      // Natural sort for Medicine IDs (handles numbers and alphanumerics like 81A, 4A)
      const idA = a.medicine_id ? String(a.medicine_id) : '';
      const idB = b.medicine_id ? String(b.medicine_id) : '';
      return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [patientHistories]);

  const medicineInventoryData = useMemo(() => {
    // Format month for headers (e.g., "2025-01" becomes "Jan 2025")
    const formatMonthForHeader = (month) => {
      if (!month || month === 'All') {
        // Use current month and year if no filter is applied
        const now = new Date();
        const monthNames = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        const monthName = monthNames[now.getMonth()];
        const year = now.getFullYear();
        return `${monthName} ${year}`;
      }

      const [year, monthNum] = month.split('-');
      if (!year || !monthNum) return 'Month';

      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];

      const monthName = monthNames[parseInt(monthNum) - 1] || 'Month';
      return `${monthName} ${year}`;
    };

    const monthDisplay = formatMonthForHeader(appliedFilters.month);

    // Calculate dispensed quantity per medicine from patient histories
    const dispensedQuantities = {};

    patientHistories.forEach(history => {
      history.visits.forEach(visit => {
        if (visit.medicines_given) {
          visit.medicines_given.forEach(givenMed => {
            const medId = givenMed.medicine_id;
            dispensedQuantities[medId] = (dispensedQuantities[medId] || 0) + givenMed.quantity;
          });
        }
      });
    });

    // Create inventory data with current stock, dispensed, and calculated before stock
    const inventoryData = medicines.map(medicine => {
      const dispensed = dispensedQuantities[medicine.medicine_id] || 0;
      const currentStock = medicine.total_quantity || 0;
      const beforeStock = parseInt(currentStock) + parseInt(dispensed);

      // Create dynamic keys based on the selected month
      const dynamicData = {};
      dynamicData[`before_stock_${appliedFilters.month}`] = beforeStock;
      dynamicData[`current_stock_${appliedFilters.month}`] = currentStock;
      dynamicData[`dispensed_${appliedFilters.month}`] = dispensed;

      return {
        medicine_id: medicine.medicine_id,
        formulation: medicine.medicine_formulation || '',
        ...dynamicData, // Spread the dynamic properties
        monthDisplay: monthDisplay // Store the formatted month for column headers
      };
    });

    return inventoryData.sort((a, b) => {
      // Natural sort for Medicine IDs (handles numbers and alphanumerics like 81A, 4A)
      const idA = a.medicine_id ? String(a.medicine_id) : '';
      const idB = b.medicine_id ? String(b.medicine_id) : '';
      return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [medicines, patientHistories, appliedFilters.month]);


  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  const handleSubmit = () => {
    setAppliedFilters({
      month: selectedMonth,
      hasSubmitted: true
    });
  };

  const handleReset = () => {
    setSelectedMonth('All');
    setAppliedFilters({ month: 'All', hasSubmitted: false });
    navigate({ search: '' }, { replace: true });
  };

  const handleExport = () => {
    exportCampSummaryToCSV(filteredPatients, doctors, medicines);
  };

  const handleExportMedicineDistribution = () => {
    exportMedicineDistributionToCSV(medicineDistributionData);
  };

  const handleExportDoctorPatientRatio = () => {
    exportDoctorPatientRatioToCSV(doctorPatientData);
  };

  const handleExportVolunteers = () => {
    exportVolunteersToCSV(filteredVolunteers, appliedFilters.month);
  };

  const handleExportPatients = () => {
    exportPatientsToCSV(filteredPatients, appliedFilters.month, vitals);
  };

  const handleExportMedicineInventory = () => {
    exportMedicineInventoryToCSV(medicines, appliedFilters.month, patientHistories);
  };

  // Fetch all data for month/doctor options once on mount
  useEffect(() => {
    const fetchAllOptionsData = async () => {
      try {
        const { allDoctors, allPatientHistories } = await fetchFilterOptionsData();
        setAllDoctorsForMonths(allDoctors);
        setAllPatientHistoriesForMonths(allPatientHistories);
      } catch (error) {
        console.error('Error fetching all data for options:', error);
      }
    };
    fetchAllOptionsData();
  }, []); // Run only once on mount

  // Fetch filtered data based on applied filters
  useEffect(() => {
    const fetchData = async () => {
      if (!appliedFilters.hasSubmitted) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { patients, doctors, medicines, volunteers, patientHistories, vitals } = await fetchCampAnalyticsData(appliedFilters.month);

        // Track which data failed to load
        setDataLoadErrors({
          patients: patients === null,
          doctors: doctors === null,
          medicines: medicines === null,
          volunteers: volunteers === null,
          patientHistories: patientHistories === null,
          vitals: vitals === null
        });

        // Set data - null means API failed, [] means no records (both are valid states)
        setPatients(patients ?? []);
        setDoctors(doctors ?? []);
        setMedicines(medicines ?? []);
        setVolunteers(volunteers ?? []);
        setPatientHistories(patientHistories ?? []);
        setVitals(vitals ?? []);

        console.log('Fetched Patients:', patients);
        console.log('Fetched Doctors:', doctors);
        console.log('Fetched Medicines:', medicines);
        console.log('Fetched Volunteers:', volunteers);
        console.log('Fetched Patient Histories:', patientHistories);
        console.log('Fetched Vitals:', vitals);

        // Log warnings for failed API calls
        if (patients === null) console.warn('⚠️ Patients API failed - CSV download should be disabled');
        if (doctors === null) console.warn('⚠️ Doctors API failed');
        if (medicines === null) console.warn('⚠️ Medicines API failed');
        if (volunteers === null) console.warn('⚠️ Volunteers API failed');
        if (patientHistories === null) console.warn('⚠️ Patient Histories API failed');
        if (vitals === null) console.warn('⚠️ Vitals API failed - CSV may have incomplete data');
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [appliedFilters]); // Re-run when appliedFilters change

  return (
    <div className="analytics-container">
      <h1>Camp Analytics Dashboard</h1>

      <FilterControls
        monthOptions={monthOptions}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        handleSubmit={handleSubmit}
        handleReset={handleReset}
        setView={setView}
        view={view}
        appliedFilters={appliedFilters}
      />

      {/* Loading / Content */}
      {loading ? (
        <div>Loading...</div>
      ) : !appliedFilters.hasSubmitted ? (
        <div className="empty-state">
          <h2>Select filters and click “Apply Filters” to see results.</h2>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="summary-cards">
            <div className="card">
              <h3>Total Patients</h3>
              <p>{filteredPatients.length}</p>
            </div>
            <div className="card">
              <h3>Total Doctors</h3>
              <p>{doctors.length}</p>
            </div>
            <div className="card">
              <h3>Total Medicines</h3>
              <p>{medicines.length}</p>
            </div>
          </div>

          {/* CSV Download Buttons */}
          <CSVDownloadButtons
            handleExportVolunteers={handleExportVolunteers}
            handleExportPatients={handleExportPatients}
            handleExportMedicineInventory={handleExportMedicineInventory}
            handleExportMedicineDistribution={handleExportMedicineDistribution}
            appliedFilters={appliedFilters}
            filteredVolunteers={filteredVolunteers}
            filteredPatients={filteredPatients}
            medicines={medicines}
            medicineDistributionData={medicineDistributionData}
            dataLoadErrors={dataLoadErrors}
          />

          {/* Charts or tables */}
          <div className="charts-container">
            {filteredPatients.length === 0 ? (
              <div className="empty-state">
                <h2>No data available for the selected filters.</h2>
              </div>
            ) : (
              <>
                {view === 'graph' && (
                  <>
                    <div className="chart">
                      <h3>Gender Distribution</h3>
                      <BarChart width={300} height={300} data={genderData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" name="Count">
                          {genderData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </div>


                    <div className="chart">
                      <h3>Doctor-Patient Ratio</h3>
                      <button
                        onClick={handleExportDoctorPatientRatio}
                        disabled={!appliedFilters.hasSubmitted || doctorPatientData.length === 0}
                        aria-disabled={!appliedFilters.hasSubmitted || doctorPatientData.length === 0}
                        className="inline-csv-button"
                      >
                        Export Doctor-Patient Ratio to CSV
                      </button>
                      <TableView
                        data={doctorPatientData}
                        columns={[{ title: 'Doctor', key: 'name' }, { title: 'Patients Visited', key: 'patients' }]}
                      />
                    </div>


                    <div className="chart">
                      <h3>Medicine Inventory</h3>
                      <button
                        onClick={handleExportMedicineInventory}
                        disabled={!appliedFilters.hasSubmitted || medicines.length === 0}
                        aria-disabled={!appliedFilters.hasSubmitted || medicines.length === 0}
                        className="inline-csv-button"
                      >
                        Export Medicine Inventory to CSV
                      </button>
                      <TableView
                        data={medicineInventoryData}
                        columns={[
                          { title: 'Medicine ID', key: 'medicine_id' },
                          { title: 'Formulation', key: 'formulation' },
                          { title: `${medicineInventoryData[0]?.monthDisplay} Before Stock`, key: `before_stock_${appliedFilters.month}` },
                          { title: `${medicineInventoryData[0]?.monthDisplay} After Stock`, key: `current_stock_${appliedFilters.month}` },
                          { title: `Dispensed in ${medicineInventoryData[0]?.monthDisplay}`, key: `dispensed_${appliedFilters.month}` }
                        ]}
                      />
                    </div>
                  </>
                )}

                {view === 'table' && (
                  <div>
                    <h3>Gender Distribution</h3>
                    <TableView
                      data={genderData}
                      columns={[{ title: 'Gender', key: 'name' }, { title: 'Count', key: 'value' }]}
                    />


                    <h3>Doctor-Patient Ratio</h3>
                    <button
                      onClick={handleExportDoctorPatientRatio}
                      disabled={!appliedFilters.hasSubmitted || doctorPatientData.length === 0}
                      aria-disabled={!appliedFilters.hasSubmitted || doctorPatientData.length === 0}
                      className="inline-csv-button"
                    >
                      Export Doctor-Patient Ratio to CSV
                    </button>
                    <TableView
                      data={doctorPatientData}
                      columns={[{ title: 'Doctor', key: 'name' }, { title: 'Patients', key: 'patients' }]}
                    />

                    <h3>Medicine Distribution</h3>
                    <p>No visualization available. Download the data using the main buttons above.</p>

                    <h3>Medicine Inventory</h3>
                    <button
                      onClick={handleExportMedicineInventory}
                      disabled={!appliedFilters.hasSubmitted || medicines.length === 0}
                      aria-disabled={!appliedFilters.hasSubmitted || medicines.length === 0}
                      className="inline-csv-button"
                    >
                      Export Medicine Inventory to CSV
                    </button>
                    <TableView
                      data={medicineInventoryData}
                      columns={[
                        { title: 'Medicine ID', key: 'medicine_id' },
                        { title: 'Formulation', key: 'formulation' },
                        { title: `${medicineInventoryData[0]?.monthDisplay} Before Stock`, key: `before_stock_${appliedFilters.month}` },
                        { title: `${medicineInventoryData[0]?.monthDisplay} After Stock`, key: `current_stock_${appliedFilters.month}` },
                        { title: `Dispensed in ${medicineInventoryData[0]?.monthDisplay}`, key: `dispensed_${appliedFilters.month}` }
                      ]}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CampAnalytics;