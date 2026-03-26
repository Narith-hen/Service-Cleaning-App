import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  FrownOutlined,
  SearchOutlined,
  SmileOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Modal, Select } from 'antd';
import '../../../styles/admin/bookings_page.css';
import { bookingService } from '../services/bookingService';
import { useTranslation } from '../../../contexts/translation_context';

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const apiHost = rawApiBaseUrl.endsWith('/api') ? rawApiBaseUrl.slice(0, -4) : rawApiBaseUrl;
const STATUS_ORDER = ['Pending', 'Booked', 'Confirmed', 'Started', 'In Progress', 'Payment Required', 'Completed', 'Cancelled'];
const PAGE_SIZE_OPTIONS = [10, 20, 50, 'all'];
const BOOKING_REVIEW_RANGE_OPTIONS = [
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'total', label: 'All' }
];

const toAbsoluteImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith('data:')) return imageUrl;
  return `${apiHost}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
};

const extractBookingRows = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

const extractPagination = (response) => {
  if (response?.pagination && typeof response.pagination === 'object') return response.pagination;
  if (response?.data?.pagination && typeof response.data.pagination === 'object') return response.data.pagination;
  return {};
};

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getInitials = (name) => {
  if (!name || name === 'Unassigned') return 'U';
  const [first = '', last = ''] = String(name).trim().split(/\s+/);
  return `${first[0] || ''}${last[0] || ''}`.toUpperCase() || 'U';
};

const formatCurrency = (value) => `$${toSafeNumber(value).toFixed(2)}`;

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

const formatStatusLabel = (value) => String(value || 'pending')
  .replace(/_/g, ' ')
  .replace(/\b\w/g, (char) => char.toUpperCase());

const resolveRangeStart = (range) => {
  const normalized = String(range || 'total').trim().toLowerCase();
  if (normalized === 'total') return null;

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  if (normalized === 'week') {
    const day = start.getDay();
    const offset = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - offset);
    return start;
  }

  if (normalized === 'month') {
    start.setDate(1);
    return start;
  }

  return null;
};

const normalizeStatusKey = (value) => String(value || 'pending')
  .trim()
  .toLowerCase()
  .replace(/\s+/g, '_')
  .replace(/-/g, '_');

const toTimestamp = (value) => {
  if (!value) return Date.now();
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : Date.now();
};

const formatBookingDate = (value) => {
  if (!value) return 'Date pending';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatBookingTime = (value) => {
  const text = String(value || '').trim();
  if (!text) return 'Time pending';

  const firstSegment = text.split('-')[0].trim();
  const normalized = firstSegment.toUpperCase();
  if (normalized.includes('AM') || normalized.includes('PM')) return firstSegment;

  const match = firstSegment.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) {
    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) return text;
    return parsed.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  const hours24 = Number(match[1]);
  const minutes = match[2];
  if (!Number.isFinite(hours24)) return firstSegment;
  const meridiem = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${minutes} ${meridiem}`;
};

const resolveDisplayStatus = (row) => {
  const bookingStatus = normalizeStatusKey(row?.booking_status || row?.status || 'pending');
  const serviceStatus = normalizeStatusKey(row?.service_status || '');

  if (bookingStatus === 'cancelled' || serviceStatus === 'cancelled') {
    return { key: 'cancelled', label: 'Cancelled' };
  }

  if (serviceStatus === 'completed') {
    return { key: 'completed', label: 'Completed' };
  }

  if (serviceStatus === 'in_progress') {
    return { key: 'in_progress', label: 'In Progress' };
  }

  if (serviceStatus === 'started') {
    return { key: 'started', label: 'Started' };
  }

  if (serviceStatus === 'booked') {
    return { key: 'booked', label: 'Booked' };
  }

  if (bookingStatus === 'payment_required') {
    return { key: 'payment_required', label: 'Payment Required' };
  }

  if (bookingStatus === 'completed') {
    return { key: 'completed', label: 'Completed' };
  }

  if (bookingStatus === 'in_progress') {
    return { key: 'in_progress', label: 'In Progress' };
  }

  if (bookingStatus === 'confirmed') {
    return { key: 'confirmed', label: 'Confirmed' };
  }

  if (bookingStatus === 'pending') {
    return { key: 'pending', label: 'Pending' };
  }

  const fallbackStatus = serviceStatus || bookingStatus || 'pending';
  return {
    key: fallbackStatus,
    label: formatStatusLabel(fallbackStatus)
  };
};

const mapBookingRow = (row) => {
  const bookingId = row?.booking_id ?? row?.id ?? null;
  const displayStatus = resolveDisplayStatus(row);
  const cleanerName = row?.cleaner_display_name || row?.cleaner_name || row?.cleaner_username || '';
  const bookingTimeSource = row?.booking_time || row?.start_time || row?.created_at;
  const bookingDateSource = row?.booking_date || row?.created_at;

  return {
    id: String(bookingId || ''),
    bookingId: bookingId ? `#${bookingId}` : 'N/A',
    customerName: row?.customer_name || row?.user_name || row?.customer_username || 'Customer',
    customerEmail: row?.customer_email || row?.user_email || row?.email || 'No email provided',
    customerAvatar: toAbsoluteImageUrl(row?.customer_avatar || row?.user_avatar || ''),
    serviceType: row?.service_name || row?.service?.name || 'Cleaning Service',
    cleanerName: cleanerName || 'Unassigned',
    cleanerEmail: row?.cleaner_email || row?.company_email || '',
    cleanerAvatar: toAbsoluteImageUrl(row?.cleaner_avatar || row?.cleaner?.avatar || ''),
    date: formatBookingDate(bookingDateSource),
    time: formatBookingTime(bookingTimeSource),
    dateRaw: bookingDateSource || null,
    createdAt: row?.created_at || null,
    amount: toSafeNumber(row?.negotiated_price ?? row?.total_price ?? row?.payment_amount),
    status: displayStatus.label,
    statusKey: displayStatus.key,
    inProgressStartedAt: ['started', 'in_progress'].includes(displayStatus.key)
      ? toTimestamp(row?.updated_at || row?.service_started_at || row?.created_at)
      : null
  };
};

const dedupeBookingRows = (items) => {
  const uniqueRows = new Map();

  items.forEach((item) => {
    const key = String(item?.booking_id ?? item?.id ?? '');
    if (!key) return;
    uniqueRows.set(key, item);
  });

  return Array.from(uniqueRows.values());
};

const InProgressStatus = ({ startedAt, label = 'In Progress' }) => {
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
      <span>{label}</span>
      <ClockCircleOutlined />
      <span className="status-timer">{formatDuration(elapsedSeconds)}</span>
    </span>
  );
};

const PendingStatus = () => {
  return (
    <span className="status-pill status-pending animated" aria-label="Pending booking">
      <span className="pending-dot" />
      <span>Pending</span>
    </span>
  );
};

const ConfirmedStatus = ({ label = 'Confirmed' }) => {
  return (
    <span className="status-pill status-confirmed animated" aria-label="Confirmed booking">
      <SmileOutlined />
      <span>{label}</span>
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

const PaymentRequiredStatus = () => {
  return (
    <span className="status-pill status-pending animated" aria-label="Payment required booking">
      <ClockCircleOutlined />
      <span>Payment Required</span>
    </span>
  );
};

const renderStatus = (row) => {
  if (row.statusKey === 'confirmed') return <ConfirmedStatus />;
  if (row.statusKey === 'booked') return <ConfirmedStatus label="Booked" />;
  if (row.statusKey === 'in_progress') return <InProgressStatus startedAt={row.inProgressStartedAt || Date.now()} />;
  if (row.statusKey === 'started') return <InProgressStatus startedAt={row.inProgressStartedAt || Date.now()} label="Started" />;
  if (row.statusKey === 'completed') return <CompletedStatus />;
  if (row.statusKey === 'cancelled') return <CancelledStatus />;
  if (row.statusKey === 'payment_required') return <PaymentRequiredStatus />;
  if (row.statusKey === 'pending') return <PendingStatus />;

  return (
    <span className={`status-pill status-${row.statusKey.replace(/_/g, '-')}`}>
      {row.status}
    </span>
  );
};

const fetchAllBookings = async () => {
  const limit = 100;
  let currentPage = 1;
  let totalPages = 1;
  const rows = [];

  while (currentPage <= totalPages) {
    const response = await bookingService.getBookings({ page: currentPage, limit });
    const pageRows = extractBookingRows(response);
    const pagination = extractPagination(response);
    rows.push(...pageRows);

    const reportedPages = Number(pagination?.pages || pagination?.total_pages || 1);
    totalPages = Number.isFinite(reportedPages) && reportedPages > 0 ? reportedPages : 1;

    if (!pageRows.length || currentPage >= totalPages) {
      break;
    }

    currentPage += 1;
  }

  return rows;
};

const BookingsPage = () => {
  const { ta } = useTranslation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [serviceFilter, setServiceFilter] = useState('All');
  const [bookingReviewRange, setBookingReviewRange] = useState('total');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    let cancelled = false;

    const loadBookings = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        const bookingRows = dedupeBookingRows(await fetchAllBookings());
        if (!cancelled) {
          setRows(bookingRows.map(mapBookingRow));
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch admin bookings:', error);
          setRows([]);
          setErrorMessage('Unable to load booking data right now.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadBookings();

    return () => {
      cancelled = true;
    };
  }, []);

  const serviceOptions = useMemo(() => {
    const services = Array.from(new Set(
      rows
        .map((row) => row.serviceType)
        .filter(Boolean)
    ));

    return ['All', ...services];
  }, [rows]);

  const statusOptions = useMemo(() => {
    const statuses = new Set(rows.map((row) => row.status).filter(Boolean));
    return ['All', ...STATUS_ORDER.filter((status) => statuses.has(status))];
  }, [rows]);

  const handleCancel = async (row) => {
    if (row.statusKey === 'cancelled' || row.statusKey === 'completed') return;

    try {
      await bookingService.cancelBooking(row.id, 'Cancelled by admin');
      setRows((prevRows) => prevRows.map((item) => (
        item.id === row.id
          ? { ...item, status: 'Cancelled', statusKey: 'cancelled' }
          : item
      )));
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      Modal.error({
        title: 'Unable to cancel booking',
        content: 'The booking could not be cancelled right now. Please try again.'
      });
      throw error;
    }
  };

  const openCancelConfirm = (row) => {
    if (row.statusKey === 'cancelled' || row.statusKey === 'completed') return;

    Modal.confirm({
      title: `Cancel ${row.bookingId}?`,
      content: 'This action cannot be undone.',
      okText: 'Cancel Booking',
      okButtonProps: { danger: true },
      onOk: () => handleCancel(row),
    });
  };

  const filteredRows = useMemo(() => {
    const normalizedQuery = searchText.toLowerCase().trim();

    return rows.filter((row) => {
      const target = `${row.bookingId} ${row.customerName} ${row.customerEmail} ${row.cleanerName} ${row.cleanerEmail || ''} ${row.serviceType}`.toLowerCase();
      const matchesSearch = !normalizedQuery || target.includes(normalizedQuery);
      const matchesStatus = statusFilter === 'All' || row.status === statusFilter;
      const matchesService = serviceFilter === 'All' || row.serviceType === serviceFilter;
      return matchesSearch && matchesStatus && matchesService;
    });
  }, [rows, searchText, statusFilter, serviceFilter]);

  const bookingStats = useMemo(() => {
    const rangeStart = resolveRangeStart(bookingReviewRange);
    const scopedRows = rangeStart
      ? rows.filter((row) => {
          const parsedDate = new Date(row.createdAt || row.dateRaw || '');
          if (Number.isNaN(parsedDate.getTime())) return false;
          return parsedDate >= rangeStart;
        })
      : rows;

    const total = scopedRows.length;
    const confirmed = scopedRows.filter((row) => row.statusKey === 'confirmed').length;
    const completed = scopedRows.filter((row) => row.statusKey === 'completed').length;
    const cancelled = scopedRows.filter((row) => row.statusKey === 'cancelled').length;

    return {
      total,
      confirmed,
      completed,
      cancelled,
    };
  }, [rows, bookingReviewRange]);

  const isShowingAllRows = pageSize === 'all';
  const effectivePageSize = isShowingAllRows ? Math.max(filteredRows.length, 1) : Number(pageSize);
  const totalPages = isShowingAllRows ? 1 : Math.max(1, Math.ceil(filteredRows.length / effectivePageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = isShowingAllRows
    ? filteredRows
    : filteredRows.slice((currentPage - 1) * effectivePageSize, currentPage * effectivePageSize);
  const pageStart = filteredRows.length === 0 ? 0 : isShowingAllRows ? 1 : (currentPage - 1) * effectivePageSize + 1;
  const pageEnd = filteredRows.length === 0
    ? 0
    : isShowingAllRows
      ? filteredRows.length
      : Math.min(currentPage * effectivePageSize, filteredRows.length);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <section className="admin-bookings-page">
      <header className="admin-bookings-header">
        <div>
          <h1 className="admin-page-title">{ta('Manage Bookings')}</h1>
          <p className="admin-page-subtitle">{ta('Manage, track and coordinate all cleaning appointments.')}</p>
        </div>

        <label className="admin-bookings-review-select">
          <span>{ta('Booking Review')}</span>
          <Select
            value={bookingReviewRange}
            onChange={setBookingReviewRange}
            options={BOOKING_REVIEW_RANGE_OPTIONS.map((option) => ({
              ...option,
              label: ta(option.label)
            }))}
            popupMatchSelectWidth={false}
          />
        </label>
      </header>

      <section className="admin-bookings-kpi-grid">
        <article className="admin-bookings-kpi-card">
          <div className="kpi-icon tone-blue"><FileTextOutlined /></div>
          <span className="kpi-label">{ta('TOTAL BOOKINGS')}</span>
          <h3>{bookingStats.total.toLocaleString()}</h3>
        </article>
        <article className="admin-bookings-kpi-card">
          <div className="kpi-icon tone-emerald"><SmileOutlined /></div>
          <span className="kpi-label">{ta('CONFIRMED')}</span>
          <h3>{bookingStats.confirmed.toLocaleString()}</h3>
        </article>
        <article className="admin-bookings-kpi-card">
          <div className="kpi-icon tone-green"><CheckCircleOutlined /></div>
          <span className="kpi-label">{ta('COMPLETED')}</span>
          <h3>{bookingStats.completed.toLocaleString()}</h3>
        </article>
        <article className="admin-bookings-kpi-card">
          <div className="kpi-icon tone-rose"><CloseCircleOutlined /></div>
          <span className="kpi-label">{ta('CANCELLED')}</span>
          <h3>{bookingStats.cancelled.toLocaleString()}</h3>
        </article>
      </section>

      <section className="admin-bookings-filter-row">
        <div className="search-field">
          <SearchOutlined />
          <input
            type="text"
            placeholder={ta('Search by Booking ID, Customer...')}
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
              {status === 'All' ? ta('Status: All') : ta(status)}
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
              {service === 'All' ? ta('Service Type') : service}
            </option>
          ))}
        </select>
      </section>

      <section className="admin-bookings-table-panel">
        <div className="table-scroll-wrap">
          <table className="bookings-table">
            <thead>
              <tr>
                <th>{ta('BOOKING ID')}</th>
                <th>{ta('CUSTOMER')}</th>
                <th>{ta('SERVICE TYPE')}</th>
                <th>{ta('CLEANER')}</th>
                <th>{ta('DATE & TIME')}</th>
                <th>{ta('AMOUNT')}</th>
                <th>{ta('STATUS')}</th>
                <th>{ta('ACTIONS')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="empty-row" colSpan={8}>
                    {ta('Loading booking data...')}
                  </td>
                </tr>
              ) : errorMessage ? (
                <tr>
                  <td className="empty-row" colSpan={8}>
                    {errorMessage}
                  </td>
                </tr>
              ) : visibleRows.length > 0 ? (
                visibleRows.map((row) => (
                  <tr key={row.id || row.bookingId}>
                    <td className="booking-id">{row.bookingId}</td>
                    <td>
                      <div className="cell-user">
                        <span className="avatar-chip">
                          {row.customerAvatar ? (
                            <img src={row.customerAvatar} alt={row.customerName} className="avatar-chip-image" />
                          ) : (
                            getInitials(row.customerName)
                          )}
                        </span>
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
                          <span className="avatar-chip">
                            {row.cleanerAvatar ? (
                              <img src={row.cleanerAvatar} alt={row.cleanerName} className="avatar-chip-image" />
                            ) : (
                              getInitials(row.cleanerName)
                            )}
                          </span>
                          <div>
                            <p>{row.cleanerName}</p>
                            <span>{row.cleanerEmail || 'No email provided'}</span>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="date-time-cell">
                      <p>{row.date}</p>
                      <span>{row.time}</span>
                    </td>
                    <td className="amount-cell">{formatCurrency(row.amount)}</td>
                    <td>{renderStatus(row)}</td>
                    <td>
                      {row.statusKey === 'cancelled' || row.statusKey === 'completed' ? (
                        <span className="no-action">-</span>
                      ) : (
                        <div className="action-group">
                          <button
                            className="plain-icon-btn action-cancel"
                            title="Cancel booking"
                            type="button"
                            aria-label={`Cancel ${row.bookingId}`}
                            onClick={() => openCancelConfirm(row)}
                          >
                            <CloseCircleOutlined />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="empty-row" colSpan={8}>
                    {ta('No bookings match the current filters.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="bookings-pagination">
          <span>{ta('Showing')} {pageStart}-{pageEnd} {ta('of')} {filteredRows.length} {ta('results')}</span>
          <div className="pager-actions">
            <label className="rows-label">
              {ta('Rows per page')}
              <select
                value={pageSize}
                onChange={(event) => {
                  const nextValue = event.target.value === 'all' ? 'all' : Number(event.target.value);
                  setPageSize(nextValue);
                  setPage(1);
                }}
              >
                {PAGE_SIZE_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value === 'all' ? ta('All') : value}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="next"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={isShowingAllRows || currentPage === totalPages}
            >
              {ta('Next')}
            </button>
          </div>
        </footer>
      </section>
    </section>
  );
};

export default BookingsPage;
