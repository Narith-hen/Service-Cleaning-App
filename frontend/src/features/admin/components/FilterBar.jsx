import React from 'react';
import { FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import './FilterBar.scss';

const FilterBar = ({ filters, onFilterChange, onReset, onApply }) => {
  return (
    <div className="filter-bar">
      <div className="filter-group">
        {filters.map((filter, index) => (
          <div key={index} className="filter-item">
            <label>{filter.label}</label>
            {filter.type === 'select' ? (
              <select
                value={filter.value}
                onChange={(e) => onFilterChange(filter.key, e.target.value)}
              >
                {filter.options.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : filter.type === 'date' ? (
              <input
                type="date"
                value={filter.value}
                onChange={(e) => onFilterChange(filter.key, e.target.value)}
              />
            ) : (
              <input
                type="text"
                placeholder={filter.placeholder}
                value={filter.value}
                onChange={(e) => onFilterChange(filter.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      <div className="filter-actions">
        <button className="reset-btn" onClick={onReset}>
          <ReloadOutlined /> Reset
        </button>
        <button className="apply-btn" onClick={onApply}>
          <FilterOutlined /> Apply Filters
        </button>
      </div>
    </div>
  );
};

export default FilterBar;