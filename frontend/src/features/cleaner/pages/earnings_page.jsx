import React, { useMemo, useState } from 'react';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  CloseOutlined
} from '@ant-design/icons';
import homeImage from '../../../assets/home.png';
import windowImage from '../../../assets/window.png';
import officeImage from '../../../assets/office.png';
import '../../../styles/cleaner/earnings.scss';

const transactions = [
  {
    id: 1,
    date: '2024-10-24',
    status: 'COMPLETED',
    statusType: 'completed',
    transactionId: '#TRN-8821',
    title: 'Full Apartment Deep Clean',
    subtitle: 'Payment received via Direct Deposit',
    amount: '+$180.00',
    amountType: 'positive',
    image: homeImage,
    payoutMethod: 'Direct Deposit',
    serviceAddress: '1200 Lakeview Towers, #402',
    meta: [
      { label: 'DATE', value: 'Oct 24, 2024', icon: <CalendarOutlined /> }
    ]
  },
  {
    id: 2,
    date: '2024-10-25',
    status: 'PENDING',
    statusType: 'pending',
    transactionId: '#TRN-8845',
    title: 'Standard Recurring Clean',
    subtitle: 'Processing for next payout cycle',
    amount: '+$95.00',
    amountType: 'default',
    image: windowImage,
    payoutMethod: 'Weekly Batch Payout',
    serviceAddress: '88 Pine St, Suite 10',
    meta: [
      { label: 'PROCESSED ON', value: 'Today, 2:30 PM', icon: <ClockCircleOutlined /> }
    ]
  },
  {
    id: 3,
    date: '2024-10-21',
    status: 'COMPLETED',
    statusType: 'completed',
    transactionId: '#TRN-8790',
    title: 'Move-out Sanitation',
    subtitle: 'Payment received via Direct Deposit',
    amount: '+$240.00',
    amountType: 'positive',
    image: officeImage,
    payoutMethod: 'Direct Deposit',
    serviceAddress: '14 Riverside Blvd, Unit 9',
    meta: [
      { label: 'DATE', value: 'Oct 21, 2024', icon: <CalendarOutlined /> }
    ]
  }
];

const EarningsPage = () => {
  const [sortBy, setSortBy] = useState('most_recent');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    sortBy: 'most_recent',
    paymentStatus: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const handleApplyFilters = () => {
    setAppliedFilters({
      sortBy,
      paymentStatus,
      dateFrom,
      dateTo
    });
  };

  const filteredTransactions = useMemo(() => {
    const filtered = transactions.filter((item) => {
      const statusMatch =
        appliedFilters.paymentStatus === 'all' ||
        item.status.toLowerCase() === appliedFilters.paymentStatus;

      const fromMatch = !appliedFilters.dateFrom || item.date >= appliedFilters.dateFrom;
      const toMatch = !appliedFilters.dateTo || item.date <= appliedFilters.dateTo;

      return statusMatch && fromMatch && toMatch;
    });

    return [...filtered].sort((a, b) => {
      if (appliedFilters.sortBy === 'oldest') {
        return new Date(a.date) - new Date(b.date);
      }

      if (appliedFilters.sortBy === 'highest_amount') {
        const amountA = Number(String(a.amount).replace(/[^0-9.-]/g, ''));
        const amountB = Number(String(b.amount).replace(/[^0-9.-]/g, ''));
        return amountB - amountA;
      }

      return new Date(b.date) - new Date(a.date);
    });
  }, [appliedFilters]);

  return (
    <div className="cleaner-earnings-page">
      <div className="earnings-headline">
        <h1>Earnings Overview</h1>
        <p>Track your income and payment history.</p>
      </div>

      <div className="earnings-summary-grid">
        <div className="summary-card">
          <div className="summary-label">TOTAL EARNED</div>
          <div className="summary-main-row">
            <strong>$4,250.00</strong>
            <span className="summary-change">+12% vs last month</span>
          </div>
          <div className="summary-progress"><span /></div>
        </div>

        <div className="summary-card with-icon">
          <div className="summary-icon blue"><CalendarOutlined /></div>
          <div className="summary-content">
            <div className="summary-label">NEXT PAYOUT DATE</div>
            <strong>Nov 01, 2024</strong>
            <p className="green">In 5 days</p>
          </div>
        </div>
      </div>

      <div className="earnings-filter-bar">
        <div className="filter-item">
          <label>SORT BY</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="most_recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="highest_amount">Highest Amount</option>
          </select>
        </div>

        <div className="filter-item">
          <label>PAYMENT STATUS</label>
          <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
            <option value="all">All Payments</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div className="filter-item date-range">
          <label>DATE RANGE</label>
          <div className="date-inputs">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              max={dateTo || undefined}
              aria-label="Start date"
            />
            <span>to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              min={dateFrom || undefined}
              aria-label="End date"
            />
          </div>
        </div>

        <button className="earnings-filter-btn" type="button" aria-label="filter" onClick={handleApplyFilters}>
          <svg className="earnings-filter-icon" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M2 4h12M4 8h8M6 12h4" />
          </svg>
          <span>Filter</span>
        </button>
      </div>

      <div className="transactions-list">
        {filteredTransactions.map((item) => (
          <article
            className="transaction-card"
            key={item.id}
            onClick={() => setSelectedTransaction(item)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedTransaction(item);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="transaction-image-wrap">
              <span className={`status-chip ${item.statusType}`}>{item.status}</span>
              <img src={item.image} alt={item.title} />
            </div>

            <div className="transaction-body">
              <div className="transaction-top">
                <div>
                  <span className="transaction-id">TRANSACTION ID: {item.transactionId}</span>
                  <h3>{item.title}</h3>
                  <p>{item.subtitle}</p>
                </div>
                <span className={`amount ${item.amountType}`}>{item.amount}</span>
              </div>

              <div className="transaction-meta-grid">
                {item.meta.map((meta, index) => (
                  <div className="meta-item" key={`${item.id}-meta-${index}`}>
                    <span className="label">{meta.label}</span>
                    <p>
                      {meta.icon} {meta.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </article>
        ))}
        {filteredTransactions.length === 0 && (
          <article className="transaction-card">
            <div className="transaction-body">
              <div className="transaction-top">
                <div>
                  <h3>No transactions found</h3>
                  <p>Try a different status or date range.</p>
                </div>
              </div>
            </div>
          </article>
        )}
      </div>

      {selectedTransaction && (
        <div className="transaction-modal-overlay" onClick={() => setSelectedTransaction(null)}>
          <div className="transaction-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="transaction-modal-close"
              onClick={() => setSelectedTransaction(null)}
              aria-label="Close details"
            >
              <CloseOutlined />
            </button>

            <div className="transaction-modal-image-wrap">
              <span className={`status-chip ${selectedTransaction.statusType}`}>{selectedTransaction.status}</span>
              <img src={selectedTransaction.image} alt={selectedTransaction.title} />
            </div>

            <div className="transaction-modal-body">
              <span className="transaction-id">TRANSACTION ID: {selectedTransaction.transactionId}</span>
              <h3>{selectedTransaction.title}</h3>
              <p>{selectedTransaction.subtitle}</p>

              <div className="transaction-modal-grid">
                <div className="meta-item">
                  <span className="label">AMOUNT</span>
                  <p>{selectedTransaction.amount}</p>
                </div>
                <div className="meta-item">
                  <span className="label">STATUS</span>
                  <p>{selectedTransaction.status}</p>
                </div>
                <div className="meta-item">
                  <span className="label">PAYOUT METHOD</span>
                  <p>{selectedTransaction.payoutMethod}</p>
                </div>
                <div className="meta-item">
                  <span className="label">{selectedTransaction.meta?.[0]?.label || 'DATE'}</span>
                  <p>{selectedTransaction.meta?.[0]?.value || '-'}</p>
                </div>
                <div className="meta-item">
                  <span className="label">SERVICE ADDRESS</span>
                  <p>{selectedTransaction.serviceAddress}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EarningsPage;
