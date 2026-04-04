import React from 'react';

const CSVDownloadButtons = ({
  handleExportVolunteers,
  handleExportPatients,
  handleExportMedicineDistribution,
  handleExportMedicineInventory,
  appliedFilters,
  filteredVolunteers,
  filteredPatients,
  medicines,
  medicineDistributionData,
  dataLoadErrors = {} // Track which data failed to load
}) => {
  // Helper to get button title (tooltip) based on state
  const getButtonTitle = (dataKey, hasData) => {
    if (dataLoadErrors[dataKey]) {
      return '⚠️ Failed to load data - please retry';
    }
    if (!appliedFilters.hasSubmitted) {
      return 'Apply filters first';
    }
    if (!hasData) {
      return 'No data available for selected filters';
    }
    return 'Download CSV';
  };

  return (
    <div className="csv-buttons">
      <button
        onClick={handleExportVolunteers}
        disabled={!appliedFilters.hasSubmitted || filteredVolunteers.length === 0 || dataLoadErrors.volunteers}
        aria-disabled={!appliedFilters.hasSubmitted || filteredVolunteers.length === 0 || dataLoadErrors.volunteers}
        title={getButtonTitle('volunteers', filteredVolunteers.length > 0)}
      >
        Download Volunteers CSV
        {dataLoadErrors.volunteers && ' ⚠️'}
      </button>
      <button
        onClick={handleExportPatients}
        disabled={!appliedFilters.hasSubmitted || filteredPatients.length === 0 || dataLoadErrors.patients || dataLoadErrors.vitals}
        aria-disabled={!appliedFilters.hasSubmitted || filteredPatients.length === 0 || dataLoadErrors.patients || dataLoadErrors.vitals}
        title={dataLoadErrors.patients ? '⚠️ Failed to load patient data' : dataLoadErrors.vitals ? '⚠️ Failed to load vitals data' : getButtonTitle('patients', filteredPatients.length > 0)}
      >
        Download Patients CSV
        {(dataLoadErrors.patients || dataLoadErrors.vitals) && ' ⚠️'}
      </button>
      <button
        onClick={handleExportMedicineDistribution}
        disabled={!appliedFilters.hasSubmitted || medicineDistributionData.length === 0 || dataLoadErrors.patientHistories}
        aria-disabled={!appliedFilters.hasSubmitted || medicineDistributionData.length === 0 || dataLoadErrors.patientHistories}
        title={getButtonTitle('patientHistories', medicineDistributionData.length > 0)}
      >
        Download Medicine Distribution CSV
        {dataLoadErrors.patientHistories && ' ⚠️'}
      </button>
      <button
        onClick={handleExportMedicineInventory}
        disabled={!appliedFilters.hasSubmitted || medicines.length === 0 || dataLoadErrors.medicines}
        aria-disabled={!appliedFilters.hasSubmitted || medicines.length === 0 || dataLoadErrors.medicines}
        title={getButtonTitle('medicines', medicines.length > 0)}
      >
        Download Medicine Inventory CSV
        {dataLoadErrors.medicines && ' ⚠️'}
      </button>
    </div>
  );
};

export default CSVDownloadButtons;