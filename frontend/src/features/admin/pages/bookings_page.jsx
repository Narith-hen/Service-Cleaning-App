import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  FrownOutlined,
  SearchOutlined,
  SmileOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import '../../../styles/admin/bookings_page.css';
import { bookingRows } from '../data/bookings_data';

const statusOptions = ['All', 'Confirmed', 'Pending', 'In Progress', 'Completed', 'Cancelled'];
const serviceOptions = ['All', 'Deep Cleaning', 'Office Setup', 'Standard', 'Window Washing'];

const getInitials = (name) => {
  if (!name || name === 'Unassigned') return 'U';
  const [first = '', last = ''] = name.split(' ');
  return `${first[0] || ''}${last[0] || ''}`.toUpperCase();
};

const formatCurrency = (value) => `$${value.toFixed(2)}`;

const formatDuration = (totalSeconds) => {
  const safe = Math.max(0, totalSeconds);
  const monthSeconds = 30 * 24 * 60 * 60;
  const weekSeconds = 7 * 24 * 60 * 60;
  const daySeconds = 24 * 60 * 60;
  const hourSeconds = 60 * 60;

  let remaining = safe;
  const months = Math.floor(remaining / monthSeconds);
  remaining %= monthSeconds;
  const weeks = Math.floor(remaining / weekSeconds);
  remaining %= weekSeconds;
  const days = Math.floor(remaining / daySeconds);
  remaining %= daySeconds;
  const hours = Math.floor(remaining / hourSeconds);
  remaining %= hourSeconds;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const leadingUnits = [];
  if (months > 0) leadingUnits.push(`${months}mo`);
  if (weeks > 0 || months > 0) leadingUnits.push(`${weeks}w`);
  if (days > 0 || weeks > 0 || months > 0) leadingUnits.push(`${days}d`);

  const timePart = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return leadingUnits.length ? `${leadingUnits.join(' ')} ${timePart}` : timePart;
};

const InProgressStatus = ({ startedAt }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(
    Math.floor((Date.now() - startedAt) / 1000),
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [startedAt]);

  return (
    <span className="status-pill status-in-progress animated" aria-label="In progress booking">
      <SyncOutlined className="progress-spin-icon" />
      <span>In Progress</span>
      <ClockCircleOutlined />
      <span className="status-timer">{formatDuration(elapsedSeconds)}</span>
    </span>
  );
};

const PendingStatus = ({ startedAt }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(
    Math.floor((Date.now() - startedAt) / 1000),
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [startedAt]);

  return (
    <span className="status-pill status-pending animated" aria-label="Pending booking">
      <span className="pending-dot" />
      <span>Pending</span>
      <ClockCircleOutlined />
      <span className="status-timer">{formatDuration(elapsedSeconds)}</span>
    </span>
  );
};

const ConfirmedStatus = () => {
  return (
    <span className="status-pill status-confirmed animated" aria-label="Confirmed booking">
      <SmileOutlined />
      <span>Confirmed</span>
    </span>
  );
};

const CompletedStatus = () => {
  return (
    <span className="status-pill status-completed animated" aria-label="Completed booking">
      <CheckCircleOutlined />
      <span>Completed</span>
    </span>
  );
};

const CancelledStatus = () => {
  return (
    <span className="status-pill status-cancelled animated" aria-label="Cancelled booking">
      <FrownOutlined />
      <span>Cancelled</span>
    </span>
  );
};

const BookingsPage = () => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [serviceFilter, setServiceFilter] = useState('All');
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const filteredRows = useMemo(() => {
    return bookingRows.filter((row) => {
      const target = `${row.bookingId} ${row.customerName} ${row.customerEmail}`.toLowerCase();
      const matchesSearch = target.includes(searchText.toLowerCase());
      const matchesStatus = statusFilter === 'All' || row.status === statusFilter;
      const matchesService = serviceFilter === 'All' || row.serviceType === serviceFilter;
      return matchesSearch && matchesStatus && matchesService;
    });
  }, [searchText, statusFilter, serviceFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <section className="admin-bookings-page">
      <header className="admin-bookings-header">
        <h1 className="admin-page-title">Manage Bookings</h1>
        <p className="admin-page-subtitle">Manage, track and coordinate all cleaning appointments.</p>
      </header>

      <section className="admin-bookings-kpi-grid">
        <article className="admin-bookings-kpi-card">
          <div className="kpi-icon tone-blue"><FileTextOutlined /></div>
          <span className="kpi-label">TOTAL BOOKINGS</span>
          <h3>1,240</h3>
        </article>
        <article className="admin-bookings-kpi-card">
          <div className="kpi-icon tone-green"><SyncOutlined /></div>
          <span className="kpi-label">ONGOING NOW</span>
          <h3>24</h3>
        </article>
        <article className="admin-bookings-kpi-card">
          <div className="kpi-icon tone-rose"><CloseCircleOutlined /></div>
          <span className="kpi-label">CANCELLATION RATE</span>
          <h3>1.8%</h3>
        </article>
      </section>

      <section className="admin-bookings-filter-row">
        <div className="search-field">
          <SearchOutlined />
          <input
            type="text"
            placeholder="Search by Booking ID, Customer..."
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(1);
          }}
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status === 'All' ? 'Status: All' : status}
            </option>
          ))}
        </select>

        <select
          value={serviceFilter}
          onChange={(event) => {
            setServiceFilter(event.target.value);
            setPage(1);
          }}
        >
          {serviceOptions.map((service) => (
            <option key={service} value={service}>
              {service === 'All' ? 'Service Type' : service}
            </option>
          ))}
        </select>
      </section>

      <section className="admin-bookings-table-panel">
        <div className="table-scroll-wrap">
          <table className="bookings-table">
            <thead>
              <tr>
                <th>BOOKING ID</th>
                <th>CUSTOMER</th>
                <th>SERVICE TYPE</th>
                <th>CLEANER</th>
                <th>DATE & TIME</th>
                <th>AMOUNT</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.length > 0 ? (
                visibleRows.map((row) => (
                  <tr key={row.bookingId}>
                    <td className="booking-id">{row.bookingId}</td>
                    <td>
                      <div className="cell-user">
                        <span className="avatar-chip">{getInitials(row.customerName)}</span>
                        <div>
                          <p>{row.customerName}</p>
                          <span>{row.customerEmail}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="service-chip">{row.serviceType}</span>
                    </td>
                    <td>
                      {row.cleanerName === 'Unassigned' ? (
                        <span className="service-chip muted">UNASSIGNED</span>
                      ) : (
                        <div className="cell-user compact">
                          <span className="avatar-chip">{getInitials(row.cleanerName)}</span>
                          <div>
                            <p>{row.cleanerName}</p>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="date-time-cell">
                      <p>{row.date}</p>
                      <span>{row.time}</span>
                    </td>
                    <td className="amount-cell">{formatCurrency(row.amount)}</td>
                    <td>
                      {row.status === 'Confirmed' ? (
                        <ConfirmedStatus />
                      ) : row.status === 'Pending' ? (
                        <PendingStatus startedAt={row.pendingStartedAt || Date.now()} />
                      ) : row.status === 'In Progress' ? (
                        <InProgressStatus startedAt={row.inProgressStartedAt || Date.now()} />
                      ) : row.status === 'Completed' ? (
                        <CompletedStatus />
                      ) : row.status === 'Cancelled' ? (
                        <CancelledStatus />
                      ) : (
                        <span className={`status-pill status-${row.status.toLowerCase().replace(' ', '-')}`}>
                          {row.status}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="action-group">
                        <button
                          className="plain-icon-btn action-view"
                          title="View booking"
                          type="button"
                          aria-label={`View ${row.bookingId}`}
                        >
                          <EyeOutlined />
                        </button>
                        <button
                          className="plain-icon-btn action-edit"
                          title="Edit booking"
                          type="button"
                          aria-label={`Edit ${row.bookingId}`}
                        >
                          <EditOutlined />
                        </button>
                        <button
                          className="plain-icon-btn action-delete"
                          title="Delete booking"
                          type="button"
                          aria-label={`Delete ${row.bookingId}`}
                        >
                          <DeleteOutlined />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="empty-row" colSpan={8}>
                    No bookings match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="bookings-pagination">
          <span>Showing {visibleRows.length} of {filteredRows.length} results</span>
          {/* <div className="pager-actions">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <button
              type="button"
              className="next"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <CheckOutlined />
            </button>
          </div> */}
        </footer>
      </section>
    </section>
  );
};

export default BookingsPage;
