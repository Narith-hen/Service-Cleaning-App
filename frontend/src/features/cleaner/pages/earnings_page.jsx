import React, { useMemo, useState } from 'react';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  FilterOutlined,
  SortAscendingOutlined
} from '@ant-design/icons';
import { Select, DatePicker, Button } from 'antd';
import { Line } from '@ant-design/charts';
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

const monthlyEarningsData = [
  { month: 'Apr', earnings: 320 },
  { month: 'May', earnings: 450 },
  { month: 'Jun', earnings: 380 },
  { month: 'Jul', earnings: 520 },
  { month: 'Aug', earnings: 480 },
  { month: 'Sep', earnings: 610 },
  { month: 'Oct', earnings: 515 }
];

const EarningsPage = () => {
  const [sortBy, setSortBy] = useState('most_recent');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState(null);

<<<<<<< HEAD
=======
  const chartConfig = {
    data: monthlyEarningsData,
    xField: 'month',
    yField: 'earnings',
    smooth: true,
    height: 280,
    color: '#0f172a',
    areaStyle: {
      fill: 'l(270) 0:#ffffff 1:#0f172a20'
    },
    point: {
      size: 4,
      shape: 'circle',
      style: {
        fill: '#fff',
        stroke: '#0f172a',
        lineWidth: 2
      }
    },
    xAxis: {
      label: {
        style: {
          fill: '#64748b',
          fontSize: 12
        }
      },
      line: {
        style: {
          stroke: '#e2e8f0'
        }
      }
    },
    yAxis: {
      label: {
        style: {
          fill: '#64748b',
          fontSize: 12
        },
        formatter: (v) => `${v}`
      },
      grid: {
        line: {
          style: {
            stroke: '#f1f5f9',
            lineDash: [4, 4]
          }
        }
      }
    },
    tooltip: {
      formatter: (datum) => ({
        name: 'Earnings',
        value: `${datum.earnings}`
      })
    }
  };

  const handleApplyFilters = () => {
    setAppliedFilters({
      sortBy,
      paymentStatus,
      dateFrom,
      dateTo
    });
  };

>>>>>>> develop
  const filteredTransactions = useMemo(() => {
    const filtered = transactions.filter((item) => {
      const statusMatch =
        paymentStatus === 'all' ||
        item.status.toLowerCase() === paymentStatus;
      return statusMatch;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.date) - new Date(b.date);
      }

      if (sortBy === 'highest_amount') {
        const amountA = Number(String(a.amount).replace(/[^0-9.-]/g, ''));
        const amountB = Number(String(b.amount).replace(/[^0-9.-]/g, ''));
        return amountB - amountA;
      }

      return new Date(b.date) - new Date(a.date);
    });
  }, [paymentStatus, sortBy]);

  return (
    <div className="cleaner-earnings-page">
      <div className="earnings-headline">
        <h1>Earnings Overview</h1>
        <p>Track your income and payment history.</p>
      </div>

      <section className="earnings-stats-panel">
        <div className="earnings-total-card">
          <span className="earnings-total-label">Total Earnings</span>
          <span className="earnings-total-value">$515.00</span>
          <span className="earnings-total-note">This month</span>
        </div>
        <div className="earnings-stat-cards">
          <div className="earnings-stat-card completed">
            <span className="stat-label">Completed</span>
            <span className="stat-value">$420.00</span>
          </div>
          <div className="earnings-stat-card pending">
            <span className="stat-label">Pending</span>
            <span className="stat-value">$95.00</span>
          </div>
        </div>
      </section>

      <section className="earnings-chart-panel">
        <div className="chart-header">
          <h2>Monthly Earnings</h2>
          <span className="chart-subtitle">Last 7 months performance</span>
        </div>
        <div className="chart-container">
          <Line {...chartConfig} />
        </div>
      </section>

<<<<<<< HEAD
      </div>
=======
      <section className="earnings-filters-panel">
        <div className="filter-group">
          <FilterOutlined />
          <Select
            value={paymentStatus}
            onChange={setPaymentStatus}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'completed', label: 'Completed' },
              { value: 'pending', label: 'Pending' }
            ]}
          />
        </div>
        <div className="filter-group">
          <SortAscendingOutlined />
          <Select
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: 'most_recent', label: 'Most Recent' },
              { value: 'oldest', label: 'Oldest' },
              { value: 'highest_amount', label: 'Highest Amount' }
            ]}
          />
        </div>
        <div className="filter-group date-range">
          <DatePicker
            placeholder="From Date"
            value={dateFrom}
            onChange={(date) => setDateFrom(date ? date.format('YYYY-MM-DD') : '')}
          />
          <span>to</span>
          <DatePicker
            placeholder="To Date"
            value={dateTo}
            onChange={(date) => setDateTo(date ? date.format('YYYY-MM-DD') : '')}
          />
        </div>
        <Button type="primary" onClick={handleApplyFilters}>Apply Filters</Button>
      </section>

      <section className="transactions-list-panel">
        <h2>Transaction History</h2>
        <div className="transactions-list">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction) => (
              <article
                key={transaction.id}
                className="transaction-card"
                onClick={() => setSelectedTransaction(transaction)}
              >
                <aside className="transaction-image-wrap">
                  <img src={transaction.image} alt={transaction.title} />
                  <span className={`status-indicator ${transaction.statusType}`}>
                    {transaction.status}
                  </span>
                </aside>
>>>>>>> develop

                <section className="transaction-main">
                  <div className="transaction-header">
                    <div>
                      <h3>{transaction.title}</h3>
                      <p>{transaction.subtitle}</p>
                    </div>
                    <span className={`transaction-amount ${transaction.amountType}`}>
                      {transaction.amount}
                    </span>
                  </div>

                  <div className="transaction-meta">
                    <span><CalendarOutlined /> {transaction.meta?.[0]?.value || transaction.date}</span>
                    <span><EnvironmentOutlined /> {transaction.serviceAddress}</span>
                    <span><DollarOutlined /> {transaction.payoutMethod}</span>
                  </div>

                  <div className="transaction-id-row">
                    <small>{transaction.transactionId}</small>
                  </div>
                </section>
              </article>
            ))
          ) : (
            <div className="transactions-empty">
              <p>No transactions found matching your filters.</p>
            </div>
<<<<<<< HEAD
          </article>
        ))}
        {filteredTransactions.length === 0 && (
          <article className="transaction-card">
            <div className="transaction-body">
              <div className="transaction-top">
                <div>
                  <h3>No transactions found</h3>
                  <p>Try a different status filter.</p>
                </div>
              </div>
            </div>
          </article>
        )}
      </div>
=======
          )}
        </div>
      </section>
>>>>>>> develop

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
