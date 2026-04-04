import React from 'react';

const FilterControls = ({
  monthOptions,
  selectedMonth,
  setSelectedMonth,
  handleSubmit,
  handleReset,
  setView,
  view,
  appliedFilters
}) => {
  return (
    <>
      {/* Filters */}
      <div className="filters">
        <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
          {monthOptions.map(month => <option key={month} value={month}>{month}</option>)}
        </select>

        <button type="button" onClick={handleSubmit}>Apply Filters</button>
        <button type="button" onClick={handleReset}>Reset</button>
        <button
          onClick={() => setView(v => v === 'graph' ? 'table' : 'graph')}
          disabled={!appliedFilters.hasSubmitted}
          aria-disabled={!appliedFilters.hasSubmitted}
        >
          Toggle View
        </button>
      </div>
    </>
  );
};

export default FilterControls;