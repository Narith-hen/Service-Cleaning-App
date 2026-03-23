import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  FilterOutlined,
  SortAscendingOutlined
} from '@ant-design/icons';
import { Select, DatePicker, Button, Input, Alert } from 'antd';
import { Line } from '@ant-design/charts';
import '../../../styles/cleaner/earnings.scss';
import {
  cleanerEarningsSummary,
  cleanerMonthlyEarningsData,
  cleanerTransactions,
  formatMoney,
  parseMoneyAmount
} from '../data/earnings_data';
import { fetchCleanerEarnings, fetchCleanerEarningsSummary } from '../services/earningsService';

const CONFIRMED_MY_JOBS_STORAGE_KEY = 'cleaner_confirmed_my_jobs';

const mapCompletedJobToTransaction = (job) => {
  const amount = parseMoneyAmount(job.price);
  const dateLabel = job.monthYear && job.day ? `${job.monthYear}-${job.day}` : dayjs().format('YYYY-MM-DD');

  return {
    id: `job-${job.sourceRequestId || job.id || job.jobId}`,
    date: dayjs(dateLabel).format('YYYY-MM-DD'),
    status: 'COMPLETED',
    statusType: 'completed',
    transactionId: job.jobId || `#JOB-${job.sourceRequestId || job.id}`,
    title: job.title || 'Completed Job',
    subtitle: job.location || 'Service completed',
    amount: `+$${amount.toFixed(2)}`,
    amountType: 'positive',
    image: job.image,
    payoutMethod: 'Job Payout',
    serviceAddress: job.location || '-'
  };
};

const loadCompletedJobsTransactions = () => {
  try {
    const raw = localStorage.getItem(CONFIRMED_MY_JOBS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((job) => String(job.status || '').toLowerCase() === 'completed')
      .map(mapCompletedJobToTransaction);
  } catch {
    return [];
  }
};

const summarizeTransactions = (list) =>
  list.reduce(
    (acc, tx) => {
      const amount = parseMoneyAmount(tx.amount);
      acc.total += amount;
      if (tx.status?.toLowerCase() === 'completed') {
        acc.completed += amount;
      }
      if (tx.status?.toLowerCase() === 'pending') {
        acc.pending += amount;
      }
      return acc;
    },
    { total: 0, completed: 0, pending: 0 }
  );

const EarningsPage = () => {
  const [sortBy, setSortBy] = useState('most_recent');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [notification, setNotification] = useState(null);
  const [appliedFilters, setAppliedFilters] = useState({
    sortBy: 'most_recent',
    paymentStatus: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [earningsSummary, setEarningsSummary] = useState(cleanerEarningsSummary);
  const [transactions, setTransactions] = useState(() => {
    const completedFromJobs = loadCompletedJobsTransactions();
    const deduped = new Map();
    [...completedFromJobs, ...cleanerTransactions].forEach((tx) => {
      const key = tx.id || `${tx.transactionId}-${tx.date}`;
      if (!deduped.has(key)) deduped.set(key, tx);
    });
    return Array.from(deduped.values());
  });
  const [monthlyEarnings, setMonthlyEarnings] = useState(cleanerMonthlyEarningsData);

  useEffect(() => {
    let isMounted = true;

    const loadEarnings = async () => {
      try {
        const [earningsData, monthlyData] = await Promise.all([
          fetchCleanerEarnings(),
          fetchCleanerEarningsSummary()
        ]);

        if (!isMounted) return;

        setEarningsSummary((prev) => ({
          ...prev,
          total: Number(earningsData.total_earnings) || 0
        }));

        if (Array.isArray(monthlyData) && monthlyData.length > 0) {
          setMonthlyEarnings(
            monthlyData.map((item) => ({
              month: item.month ? dayjs(`${item.month}-01`).format('MMM') : '',
              earnings: Number(item.total) || 0
            }))
          );
        }
      } catch (error) {
        console.error('Failed to fetch cleaner earnings page data:', error);
      }
    };

    loadEarnings();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleStorageSync = () => {
      const completedFromJobs = loadCompletedJobsTransactions();
      setTransactions((prev) => {
        const merged = new Map();
        [...completedFromJobs, ...prev].forEach((tx) => {
          const key = tx.id || `${tx.transactionId}-${tx.date}`;
          if (!merged.has(key)) merged.set(key, tx);
        });
        return Array.from(merged.values());
      });
    };

    window.addEventListener('storage', handleStorageSync);
    window.addEventListener('cleaner-earnings-updated', handleStorageSync);

    return () => {
      window.removeEventListener('storage', handleStorageSync);
      window.removeEventListener('cleaner-earnings-updated', handleStorageSync);
    };
  }, []);

  useEffect(() => {
    setEarningsSummary((prev) => ({
      ...prev,
      ...summarizeTransactions(transactions)
    }));
  }, [transactions]);

  const chartConfig = {
    data: monthlyEarnings,
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

  const handleWithdraw = () => {
    const amount = parseMoneyAmount(withdrawAmount);

    if (!amount) {
      setNotification({ type: 'error', message: 'Enter an amount greater than 0.' });
      return;
    }

    if (amount > (earningsSummary.total || 0)) {
      setNotification({ type: 'error', message: 'Withdrawal exceeds available balance.' });
      return;
    }

    const now = dayjs();
    const withdrawalEntry = {
      id: `wd-${now.valueOf()}`,
      date: now.format('YYYY-MM-DD'),
      status: 'COMPLETED',
      statusType: 'completed',
      transactionId: `#WD-${now.format('HHmmss')}`,
      title: 'Withdrawal',
      subtitle: 'Funds transferred to your payout method',
      amount: `-$${amount.toFixed(2)}`,
      amountType: 'negative',
      image: transactions[0]?.image,
      payoutMethod: 'Default Payout',
      serviceAddress: '-'
    };

    setTransactions((prev) => [withdrawalEntry, ...prev]);
    setEarningsSummary((prev) => ({
      ...prev,
      total: Math.max((prev.total || 0) - amount, 0)
    }));
    setWithdrawAmount('');
    setNotification({
      type: 'success',
      message: `Withdrawal of ${formatMoney(amount)} processed.`
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
        const amountA = parseMoneyAmount(a.amount);
        const amountB = parseMoneyAmount(b.amount);
        return amountB - amountA;
      }

      return new Date(b.date) - new Date(a.date);
    });
  }, [appliedFilters, transactions]);

  return (
    <div className="cleaner-earnings-page">
      <div className="earnings-headline">
        <h1>Earnings Overview</h1>
        <p>Track your income and payment history.</p>
      </div>

      {notification && (
        <div className="earnings-notification">
          <Alert
            message={notification.message}
            type={notification.type}
            showIcon
            closable
            onClose={() => setNotification(null)}
          />
        </div>
      )}

      <section className="earnings-stats-panel">
        <div className="earnings-total-card">
          <span className="earnings-total-label">Total Earnings</span>
          <span className="earnings-total-value">{formatMoney(earningsSummary.total)}</span>
          <span className="earnings-total-note">This month</span>
        </div>
        <div className="earnings-stat-cards">
          <div className="earnings-stat-card completed">
            <span className="stat-label">Completed</span>
            <span className="stat-value">{formatMoney(earningsSummary.completed)}</span>
          </div>
          <div className="earnings-stat-card pending">
            <span className="stat-label">Pending</span>
            <span className="stat-value">{formatMoney(earningsSummary.pending)}</span>
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

      <section className="earnings-filters-panel">
        <div className="filter-group withdraw-group">
          <Input
            type="number"
            min={0}
            prefix="$"
            placeholder="Withdraw amount"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
          />
          <Button type="primary" onClick={handleWithdraw}>Withdraw</Button>
        </div>
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
            value={dateFrom ? dayjs(dateFrom) : null}
            onChange={(date, dateString) => setDateFrom(dateString)}
          />
          <span>to</span>
          <DatePicker
            placeholder="To Date"
            value={dateTo ? dayjs(dateTo) : null}
            onChange={(date, dateString) => setDateTo(dateString)}
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
          )}
        </div>
      </section>

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
