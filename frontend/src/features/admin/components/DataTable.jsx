import React, { useState } from 'react';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import './DataTable.scss';

const DataTable = ({
  columns,
  data,
  onRowClick,
  onSearch,
  onFilter,
  loading = false,
  pagination = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    onSearch?.(e.target.value);
  };

  const paginatedData = pagination
    ? data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : data;

  return (
    <div className="data-table-container">
      <div className="table-header">
        <div className="search-box">
          <SearchOutlined />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <button className="filter-btn">
          <FilterOutlined /> Filter
        </button>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th key={index}>{col.title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="loading-cell">
                  Loading...
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="empty-cell">
                  No data found
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? 'clickable' : ''}
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            Previous
          </button>
          <span>Page {currentPage} of {Math.ceil(data.length / itemsPerPage)}</span>
          <button
            disabled={currentPage === Math.ceil(data.length / itemsPerPage)}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default DataTable;