import { unparse } from 'papaparse';

// Generic CSV download function
const downloadCSV = (data, filename, fields) => {
  const csv = unparse({
    fields: fields,
    data: data
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export volunteers to CSV
export const exportVolunteersToCSV = (volunteers, month) => {
  const data = volunteers.map(volunteer => ({
    'ID': volunteer.user_id,
    'Name': volunteer.user_name,
    'Email': volunteer.user_email,
    'Phone': volunteer.user_phone_no,
    'Age': volunteer.user_age,
  }));

  downloadCSV(data, `volunteers_${month || 'all'}.csv`,
    ['ID', 'Name', 'Email', 'Phone', 'Age']);
};

// Export patients to CSV with vitals data
export const exportPatientsToCSV = (patients, month, vitals = []) => {
  const data = patients.map(patient => {
    // Find vitals for this patient matching the book_no
    const patientVitals = vitals.find(v => v.book_no === patient.book_no);

    return {
      'Book No': patient.book_no,
      'Name': patient.patient_name || '',
      'Age': patient.patient_age || '',
      'Gender': patient.patient_sex || '',
      'Phone': patient.patient_phone_no || '',
      'Area': patient.patient_area || '',
      'BP': patientVitals?.bp || '',
      'Pulse': patientVitals?.pulse || '',
      'RBS': patientVitals?.rbs || '',
      'Weight (kg)': patientVitals?.weight || '',
      'Height (cm)': patientVitals?.height || '',
      'Extra Notes': patientVitals?.extra_note || ''
    };
  });

  downloadCSV(data, `patients_${month || 'all'}.csv`,
    ['Book No', 'Name', 'Age', 'Gender', 'Phone', 'Area', 'BP', 'Pulse', 'RBS', 'Weight (kg)', 'Height (cm)', 'Extra Notes']);
};

// Export camp summary to CSV
export const exportCampSummaryToCSV = (filteredPatients, doctors, medicines) => {
  const data = [
    ['Total Patients', filteredPatients.length],
    ['Total Doctors', doctors.length],
    ['Total Medicines', medicines.length],
  ];

  downloadCSV(data, 'camp_summary.csv', ['Metric', 'Value']);
};

// Export doctor-patient ratio to CSV
export const exportDoctorPatientRatioToCSV = (doctorPatientData) => {
  const data = doctorPatientData.map(item => ({
    'Doctor': item.name,
    'Patients Visited': item.patients,
  }));

  downloadCSV(data, 'doctor_patient_ratio.csv', ['Doctor', 'Patients Visited']);
};

// Export medicine distribution to CSV
export const exportMedicineDistributionToCSV = (medicineDistributionData) => {
  const data = medicineDistributionData.map(item => ({
    'Medicine ID': item.medicine_id,
    'Distributed Quantity': item.distributed_quantity,
  }));

  downloadCSV(data, 'medicine_distribution.csv', ['Medicine ID', 'Distributed Quantity']);
};

// Export medicine inventory to CSV
export const exportMedicineInventoryToCSV = (medicines, month, patientHistories) => {
  // Format month for headers (e.g., "2025-01" becomes "Jan 2025")
  const formatMonthForHeader = (month) => {
    if (!month || month === 'All') return 'Month';

    const [year, monthNum] = month.split('-');
    if (!year || !monthNum) return 'Month';

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const monthName = monthNames[parseInt(monthNum) - 1] || 'Month';
    return `${monthName} ${year}`;
  };

  const monthDisplay = formatMonthForHeader(month);

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

  // Calculate month before stock and after stock
  const inventoryData = medicines.map(medicine => {
    const dispensed = dispensedQuantities[medicine.medicine_id] || 0;  // Use medicine_id instead of _id
    const monthAfterStock = medicine.total_quantity || 0; // Current stock
    const monthBeforeStock = parseInt(monthAfterStock) + parseInt(dispensed); // Before = After + Dispensed

    // Create dynamic headers based on selected month
    const dynamicHeaders = {};
    dynamicHeaders[`Medicine ID`] = medicine.medicine_id;
    dynamicHeaders[`Formulation`] = medicine.medicine_formulation || '';
    dynamicHeaders[`${monthDisplay} Before Stock`] = monthBeforeStock;
    dynamicHeaders[`${monthDisplay} After Stock`] = monthAfterStock;
    dynamicHeaders[`Dispensed in ${monthDisplay}`] = dispensed;

    return dynamicHeaders;
  });

  // Sort by Medicine ID using natural sort order
  const sortedData = inventoryData.sort((a, b) => {
    const valA = a['Medicine ID'] ? String(a['Medicine ID']) : '';
    const valB = b['Medicine ID'] ? String(b['Medicine ID']) : '';
    return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
  });

  // Create dynamic field names for CSV
  const fields = [
    'Medicine ID',
    'Formulation',
    `${monthDisplay} Before Stock`,
    `${monthDisplay} After Stock`,
    `Dispensed in ${monthDisplay}`
  ];

  downloadCSV(sortedData, `medicine_inventory_${month || 'all'}.csv`, fields);
};