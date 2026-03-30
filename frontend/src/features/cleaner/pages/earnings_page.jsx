import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  CalendarOutlined,
  CloseOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  FilterOutlined,
  SortAscendingOutlined
} from '@ant-design/icons';
import { Select, DatePicker, Button } from 'antd';
import '../../../styles/cleaner/earnings.scss';
import {
  cleanerEarningsSummary,
  cleanerTransactions,
  formatMoney,
  parseMoneyAmount
} from '../data/earnings_data';
import {
  fetchCleanerEarnings,
  fetchCleanerEarningsRollups,
  fetchCleanerEarningsSummary
} from '../services/earningsService';

const AUTO_REFRESH_INTERVAL_MS = 15 * 1000;
const MIN_CHART_BAR_HEIGHT = 18;
const DAILY_HISTORY_LENGTH = 7;
const WEEKLY_HISTORY_LENGTH = 4;
const DAYS_PER_WEEK = 7;

const earningsViewOptions = [
  {
    value: 'day',
    label: 'Day',
    title: 'Daily Earnings',
    subtitle: 'Hourly totals for jobs completed today',
    note: 'Updates when you finish a job'
  },
  {
    value: 'week',
    label: 'Week',
    title: 'Weekly Earnings',
    subtitle: 'Latest 7 daily totals from completed jobs',
    note: 'Rolling 7 days'
  },
  {
    value: 'month',
    label: 'Month',
    title: 'Monthly Earnings',
    subtitle: 'Latest 4 weekly totals from completed jobs',
    note: 'Rolling 4 weeks'
  },
  {
    value: 'total',
    label: 'Total All',
    title: 'Total Earnings',
    subtitle: 'All-time earnings trend',
    note: 'All time'
  }
];

const buildDefaultDailyBreakdown = () => {
  return Array.from({ length: 24 }, (_, index) => {
    const hour = index;
    return {
      bucket: hour,
      label: dayjs().hour(hour).minute(0).second(0).format('h A'),
      total: 0
    };
  });
};

const buildDefaultWeeklyBreakdown = () => {
  return Array.from({ length: DAILY_HISTORY_LENGTH }, (_, index) => {
    const day = dayjs().startOf('day').subtract(DAILY_HISTORY_LENGTH - 1 - index, 'day');
    return {
      bucket: index + 1,
      label: day.format('ddd'),
      period_label: day.format('MMM D'),
      total: 0
    };
  });
};

const buildDefaultMonthlyBreakdown = () => {
  const firstDay = dayjs().startOf('day').subtract((DAILY_HISTORY_LENGTH * WEEKLY_HISTORY_LENGTH) - 1, 'day');

  return Array.from({ length: WEEKLY_HISTORY_LENGTH }, (_, index) => {
    const weekStart = firstDay.add(index * DAYS_PER_WEEK, 'day');
    const weekEnd = weekStart.add(DAYS_PER_WEEK - 1, 'day');

    return {
      bucket: index + 1,
      label: `Week ${index + 1}`,
      period_label: `${weekStart.format('MMM D')} - ${weekEnd.format('MMM D')}`,
      total: 0
    };
  });
};

const getDefaultRollupData = () => ({
  collection_window: {
    start_label: '12:00 AM',
    end_label: '11:59 PM',
    is_active: true
  },
  daily_total: 0,
  today_window_total: 0,
  weekly_total: 0,
  monthly_total: 0,
  daily_breakdown: buildDefaultDailyBreakdown(),
  weekly_breakdown: buildDefaultWeeklyBreakdown(),
  monthly_breakdown: buildDefaultMonthlyBreakdown(),
  last_updated_at: null
});

const normalizeRollupData = (data = {}) => {
  const defaults = getDefaultRollupData();

  return {
    ...defaults,
    ...data,
    collection_window: {
      ...defaults.collection_window,
      ...(data?.collection_window || {})
    },
    daily_breakdown:
      Array.isArray(data?.daily_breakdown) && data.daily_breakdown.length
        ? data.daily_breakdown
        : defaults.daily_breakdown,
    weekly_breakdown:
      Array.isArray(data?.weekly_breakdown) && data.weekly_breakdown.length
        ? data.weekly_breakdown
        : defaults.weekly_breakdown,
    monthly_breakdown:
      Array.isArray(data?.monthly_breakdown) && data.monthly_breakdown.length
        ? data.monthly_breakdown
        : defaults.monthly_breakdown
  };
};

const buildSeriesFromRows = (rows = []) => {
  return (rows || []).map((row, index) => ({
    label: String(row?.label || ''),
    periodLabel: String(row?.period_label || ''),
    bucket: Number(row?.bucket ?? index + 1),
    earnings: Number(row?.total || 0)
  }));
};

const buildTotalSeries = (rows = []) => {
  const currentYear = dayjs().year();
  const totalsByYear = new Map(
    (rows || []).map((row) => [Number(row?.bucket ?? 0), Number(row?.total || 0)])
  );

  return Array.from({ length: 7 }, (_, index) => {
    const year = currentYear - 6 + index;
    return {
      label: String(year),
      bucket: year,
      earnings: Number(totalsByYear.get(year) || 0)
    };
  });
};

const buildChartSeries = (view, rollupData, totalSeries) => {
  if (view === 'day') return buildSeriesFromRows(rollupData?.daily_breakdown);
  if (view === 'week') return buildSeriesFromRows(rollupData?.weekly_breakdown);
  if (view === 'month') return buildSeriesFromRows(rollupData?.monthly_breakdown);
  return totalSeries;
};

const getSelectedTotalForView = (view, rollupData, allTimeTotal) => {
  if (view === 'day') return Number(rollupData?.daily_total || 0);
  if (view === 'week') return Number(rollupData?.weekly_total || 0);
  if (view === 'month') return Number(rollupData?.monthly_total || 0);
  return Number(allTimeTotal || 0);
};

const getChartMeta = (view, rollupData) => {
  const activeView = earningsViewOptions.find((option) => option.value === view) || earningsViewOptions[2];
  const windowStart = rollupData?.collection_window?.start_label || '12:00 AM';
  const windowEnd = rollupData?.collection_window?.end_label || '11:59 PM';

  if (view === 'day') {
    return {
      title: activeView.title,
      subtitle: `Hourly totals from ${windowStart} to ${windowEnd}. Completed jobs are added immediately, then this total resets for the next day.`,
      note: 'Resets daily'
    };
  }

  return {
    title: activeView.title,
    subtitle: activeView.subtitle,
    note: activeView.note
  };
};

const getActiveChartBucket = (view) => {
  const now = dayjs();

  if (view === 'day') {
    return now.hour();
  }

  if (view === 'week') return DAILY_HISTORY_LENGTH;
  if (view === 'month') return WEEKLY_HISTORY_LENGTH;
  if (view === 'total') return now.year();

  return null;
};

const buildSummaryCards = (rollupData) => {
  const windowStart = rollupData?.collection_window?.start_label || '12:00 AM';
  const windowEnd = rollupData?.collection_window?.end_label || '11:59 PM';
  const dailyNote = `Counts completed jobs from ${windowStart} to ${windowEnd}, then starts again from 0`;

  return [
    {
      key: 'daily',
      tone: 'completed',
      label: 'Daily Total',
      value: formatMoney(rollupData?.daily_total || 0),
      note: dailyNote
    },
    {
      key: 'weekly',
      tone: 'pending',
      label: 'Weekly Total',
      value: formatMoney(rollupData?.weekly_total || 0),
      note: 'Rolling total of the latest 7 completed days'
    },
    {
      key: 'monthly',
      tone: 'monthly',
      label: 'Monthly Total',
      value: formatMoney(rollupData?.monthly_total || 0),
      note: 'Rolling total of the latest 4 completed weeks'
    }
  ];
};

const printRollupTotals = (rollupData) => {
  const windowStart = rollupData?.collection_window?.start_label || '12:00 AM';
  const windowEnd = rollupData?.collection_window?.end_label || '11:59 PM';
  const timestamp = rollupData?.last_updated_at
    ? dayjs(rollupData.last_updated_at).format('YYYY-MM-DD HH:mm:ss')
    : dayjs().format('YYYY-MM-DD HH:mm:ss');

  console.log(`[Cleaner Earnings] Updated at ${timestamp}`);
  console.log(`[Cleaner Earnings] Daily total (${windowStart} - ${windowEnd}): ${formatMoney(rollupData?.daily_total || 0)}`);
  console.log(`[Cleaner Earnings] Weekly total (latest 7 days): ${formatMoney(rollupData?.weekly_total || 0)}`);
  console.log(`[Cleaner Earnings] Monthly total (latest 4 weeks): ${formatMoney(rollupData?.monthly_total || 0)}`);
};

const getTransactionStatusMeta = (value) => {
  const normalized = String(value || '').trim().toLowerCase();

  if (normalized === 'completed' || normalized === 'paid') {
    return {
      status: 'PAID',
      statusType: 'completed',
      payoutMethod: 'Confirmed Payment',
      amountType: 'positive'
    };
  }

  if (normalized === 'receipt_submitted' || normalized === 'awaiting_receipt' || normalized === 'payment_required') {
    return {
      status: 'PENDING',
      statusType: 'pending',
      payoutMethod: 'Pending Receipt Review',
      amountType: 'default'
    };
  }

  return {
    status: 'COMPLETED',
    statusType: 'completed',
    payoutMethod: 'Service Completed',
    amountType: 'positive'
  };
};

const mapRecentEarningsToTransactions = (rows = []) => {
  return (rows || []).map((row, index) => {
    const bookingId = Number(row?.booking?.booking_id || row?.booking_id || index + 1);
    const amount = Number(row?.amount || 0);
    const recordedAt = row?.created_at || row?.booking?.booking_date || null;
    const statusMeta = getTransactionStatusMeta(row?.payment_status);
    const fallbackImage = cleanerTransactions[index % cleanerTransactions.length]?.image || cleanerTransactions[0]?.image || '';

    return {
      id: `earning-${bookingId}-${index}`,
      date: recordedAt ? dayjs(recordedAt).format('YYYY-MM-DD') : '',
      status: statusMeta.status,
      statusType: statusMeta.statusType,
      transactionId: `#BOOK-${String(bookingId).padStart(5, '0')}`,
      title: row?.booking?.service?.name || 'Cleaning Service',
      subtitle: row?.booking?.user?.username
        ? `Customer: ${row.booking.user.username}`
        : 'Completed cleaner service',
      amount: `+${formatMoney(amount)}`,
      amountType: statusMeta.amountType,
      image: fallbackImage,
      payoutMethod: statusMeta.payoutMethod,
      serviceAddress: row?.booking?.address || 'Address unavailable',
      meta: [
        {
          label: 'DATE',
          value: recordedAt ? dayjs(recordedAt).format('MMM D, YYYY h:mm A') : '-'
        }
      ]
    };
  });
};

const EarningsPage = () => {
  const [earningsView, setEarningsView] = useState('month');
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
  const [earningsRollups, setEarningsRollups] = useState(() => getDefaultRollupData());
  const [allTimeTotal, setAllTimeTotal] = useState(cleanerEarningsSummary.total);
  const [allTimeSeries, setAllTimeSeries] = useState(() => buildTotalSeries());
  const [transactionHistory, setTransactionHistory] = useState(() => cleanerTransactions);

  useEffect(() => {
    let isMounted = true;

    const loadEarnings = async () => {
      const requests = [
        fetchCleanerEarningsRollups(),
        fetchCleanerEarnings(),
        earningsView === 'total'
          ? fetchCleanerEarningsSummary({ view: 'total' })
          : Promise.resolve(null)
      ];

      const [rollupResult, earningsResult, totalSummaryResult] = await Promise.allSettled(requests);

      if (!isMounted) return;

      if (rollupResult.status === 'fulfilled') {
        const normalizedRollups = normalizeRollupData(rollupResult.value);
        setEarningsRollups(normalizedRollups);
        printRollupTotals(normalizedRollups);
      } else {
        console.error('Failed to fetch cleaner earnings rollups:', rollupResult.reason);
        setEarningsRollups(getDefaultRollupData());
      }

      if (earningsResult.status === 'fulfilled') {
        const earningsData = earningsResult.value || {};
        setAllTimeTotal(Number(earningsData?.total_earnings) || 0);
        const liveTransactions = mapRecentEarningsToTransactions(earningsData?.recent_payments);
        setTransactionHistory(liveTransactions.length ? liveTransactions : cleanerTransactions);
      } else {
        console.error('Failed to fetch cleaner earnings totals:', earningsResult.reason);
        setAllTimeTotal(cleanerEarningsSummary.total);
        setTransactionHistory(cleanerTransactions);
      }

      if (earningsView === 'total') {
        if (totalSummaryResult.status === 'fulfilled') {
          setAllTimeSeries(buildTotalSeries(totalSummaryResult.value));
        } else {
          console.error('Failed to fetch all-time cleaner earnings summary:', totalSummaryResult.reason);
          setAllTimeSeries(buildTotalSeries());
        }
      }
    };

    loadEarnings().catch((error) => {
      console.error('Failed to fetch cleaner earnings page data:', error);
      if (!isMounted) return;
      setEarningsRollups(getDefaultRollupData());
      setAllTimeTotal(cleanerEarningsSummary.total);
      setAllTimeSeries(buildTotalSeries());
      setTransactionHistory(cleanerTransactions);
    });

    const intervalId = window.setInterval(() => {
      loadEarnings().catch((error) => {
        console.error('Failed to refresh cleaner earnings page data:', error);
      });
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [earningsView]);

  const selectedEarningsTotal = useMemo(() => {
    return getSelectedTotalForView(earningsView, earningsRollups, allTimeTotal);
  }, [earningsView, earningsRollups, allTimeTotal]);

  const earningsSeries = useMemo(() => {
    return buildChartSeries(earningsView, earningsRollups, allTimeSeries);
  }, [earningsView, earningsRollups, allTimeSeries]);

  const chartMeta = useMemo(() => getChartMeta(earningsView, earningsRollups), [earningsView, earningsRollups]);

  const chartBarItems = useMemo(() => {
    const peakEarnings = earningsSeries.reduce(
      (maxValue, item) => Math.max(maxValue, Number(item?.earnings) || 0),
      0
    );
    const chartScale = peakEarnings > 0 ? peakEarnings : 1;
    const activeBucket = getActiveChartBucket(earningsView);
    const hasActiveBucket =
      activeBucket !== null && earningsSeries.some((item) => item?.bucket === activeBucket);

    return earningsSeries.map((item, index) => {
      const earningsValue = Number(item?.earnings) || 0;
      const heightPercentage = (earningsValue / chartScale) * 100;
      const titlePrefix = item?.periodLabel ? `${item.periodLabel} ${item.label}` : item?.label;

      return {
        key: `${earningsView}-${item?.bucket ?? index}-${index}`,
        label: String(item?.label || ''),
        periodLabel: String(item?.periodLabel || ''),
        earnings: earningsValue,
        barHeight: `${Math.max(heightPercentage, earningsValue > 0 ? MIN_CHART_BAR_HEIGHT : 8)}%`,
        isCurrentPeriod: hasActiveBucket ? item?.bucket === activeBucket : index === earningsSeries.length - 1,
        title: `${titlePrefix}: ${formatMoney(earningsValue)}`
      };
    });
  }, [earningsSeries, earningsView]);

  const summaryCards = useMemo(() => buildSummaryCards(earningsRollups), [earningsRollups]);

  const lastUpdatedLabel = useMemo(() => {
    return earningsRollups?.last_updated_at
      ? dayjs(earningsRollups.last_updated_at).format('MMM D, YYYY h:mm:ss A')
      : 'Waiting for first refresh';
  }, [earningsRollups]);

  const handleApplyFilters = () => {
    setAppliedFilters({
      sortBy,
      paymentStatus,
      dateFrom,
      dateTo
    });
  };

  const filteredTransactions = useMemo(() => {
    const filtered = transactionHistory.filter((item) => {
      const normalizedStatus = String(item.status || '').toLowerCase();
      const matchesCompleted =
        appliedFilters.paymentStatus === 'completed'
          && ['completed', 'paid'].includes(normalizedStatus);
      const statusMatch =
        appliedFilters.paymentStatus === 'all' ||
        matchesCompleted ||
        normalizedStatus === appliedFilters.paymentStatus;

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
  }, [appliedFilters, transactionHistory]);

  return (
    <div className="cleaner-earnings-page">
      <div className="earnings-headline">
        <h1>Earnings Overview</h1>
        <p>Track your income and payment history. Completed jobs are added automatically, daily totals reset each new day, weekly totals roll across 7 days, and monthly totals roll across 4 weeks.</p>
        <div className="earnings-live-meta">
          <span>
            Completed Jobs Counted: {earningsRollups?.collection_window?.start_label || '12:00 AM'} to {earningsRollups?.collection_window?.end_label || '11:59 PM'}
          </span>
          <span>Last Updated: {lastUpdatedLabel}</span>
        </div>
      </div>

      <section className="earnings-stats-panel">
        <div className="earnings-total-card">
          <span className="earnings-total-label">{chartMeta.title}</span>
          <span className="earnings-total-value">{formatMoney(selectedEarningsTotal)}</span>
          <span className="earnings-total-note">{chartMeta.note}</span>
        </div>

        <div className="earnings-stat-cards">
          {summaryCards.map((item) => (
            <article key={item.key} className={`earnings-stat-card ${item.tone}`}>
              <span className="stat-label">{item.label}</span>
              <span className="stat-value">{item.value}</span>
              <span className="stat-note">{item.note}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="earnings-chart-panel">
        <div className="chart-header">
          <div className="chart-heading">
            <h2>{chartMeta.title}</h2>
            <p className="chart-description">{chartMeta.subtitle}</p>
          </div>
          <label className="chart-range-select">
            <span>View</span>
            <Select
              value={earningsView}
              onChange={setEarningsView}
              options={earningsViewOptions.map((option) => ({
                value: option.value,
                label: option.label
              }))}
              popupMatchSelectWidth={false}
            />
          </label>
        </div>
        <div
          className="chart-container earnings-chart-canvas"
          role="img"
          aria-label={`${chartMeta.title} bar chart`}
        >
          <div
            className="earnings-bars"
            style={{
              '--earnings-bar-count': chartBarItems.length,
              '--earnings-bar-min-width': `${Math.max(chartBarItems.length * 42, 520)}px`
            }}
          >
            {chartBarItems.map((item) => (
              <div key={item.key} className={`earnings-bar-item${chartBarItems.length > 14 ? ' compact' : ''}`}>
                <div className="earnings-bar-rail">
                  <div
                    className={`earnings-bar${item.isCurrentPeriod ? ' current' : ''}`}
                    style={{ height: item.barHeight }}
                    title={item.title}
                  />
                </div>
                {item.periodLabel ? (
                  <div className="earnings-bar-label-group">
                    <span className="earnings-bar-period">{item.periodLabel}</span>
                    <span className="earnings-bar-label">{item.label}</span>
                  </div>
                ) : (
                  <span className="earnings-bar-label">{item.label}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

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
