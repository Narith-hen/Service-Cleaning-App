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
import { fetchCleanerEarnings, fetchCleanerEarningsSummary } from '../services/earningsService';

const MIN_CHART_BAR_HEIGHT = 18;
const DAY_VIEW_HIGHLIGHT_BUCKET = 16;
const daySlotDefinitions = [
  { label: '8 AM', periodLabel: 'Morning', bucket: 8, hours: [8, 9, 10, 11] },
  { label: '12 PM', periodLabel: 'Afternoon', bucket: 12, hours: [12, 13, 14, 15] },
  { label: '4 PM', periodLabel: 'Evening', bucket: 16, hours: [16, 17, 18, 19] },
  { label: '8 PM', periodLabel: 'Night', bucket: 20, hours: [20, 21, 22, 23] }
];
const weekdayDefinitions = [
  { label: 'Mon', bucket: 2 },
  { label: 'Tue', bucket: 3 },
  { label: 'Wed', bucket: 4 },
  { label: 'Thu', bucket: 5 },
  { label: 'Fri', bucket: 6 },
  { label: 'Sat', bucket: 7 },
  { label: 'Sun', bucket: 1 }
];
const earningsViewOptions = [
  {
    value: 'day',
    label: 'Day',
    title: 'Daily Earnings',
    subtitle: "Today's earnings by time",
    note: 'Today'
  },
  {
    value: 'week',
    label: 'Week',
    title: 'Weekly Earnings',
    subtitle: 'This week from Monday to Sunday',
    note: 'This week'
  },
  {
    value: 'month',
    label: 'Month',
    title: 'Monthly Earnings',
    subtitle: 'This month by calendar day',
    note: 'This month'
  },
  {
    value: 'total',
    label: 'Total All',
    title: 'Total Earnings',
    subtitle: 'All-time earnings trend',
    note: 'All time'
  }
];

const buildDailySeries = (rows = []) => {
  const totalsByHour = new Map(
    (rows || []).map((row) => [Number(row?.bucket ?? -1), Number(row?.total || 0)])
  );

  return daySlotDefinitions.map((slot) => ({
    label: slot.label,
    periodLabel: slot.periodLabel,
    bucket: slot.bucket,
    earnings: slot.hours.reduce((sum, hour) => sum + Number(totalsByHour.get(hour) || 0), 0)
  }));
};

const buildWeeklySeries = (rows = []) => {
  const totalsByBucket = new Map(
    (rows || []).map((row) => [Number(row?.bucket ?? 0), Number(row?.total || 0)])
  );

  return weekdayDefinitions.map((dayItem) => ({
    label: dayItem.label,
    bucket: dayItem.bucket,
    earnings: Number(totalsByBucket.get(dayItem.bucket) || 0)
  }));
};

const buildMonthlySeries = (rows = []) => {
  const totalsByDay = new Map(
    (rows || []).map((row) => [Number(row?.bucket ?? 0), Number(row?.total || 0)])
  );
  const daysInMonth = dayjs().daysInMonth();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const dayNumber = index + 1;
    return {
      label: String(dayNumber),
      bucket: dayNumber,
      earnings: Number(totalsByDay.get(dayNumber) || 0)
    };
  });
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

const buildChartSeries = (view, rows = []) => {
  if (view === 'day') return buildDailySeries(rows);
  if (view === 'week') return buildWeeklySeries(rows);
  if (view === 'total') return buildTotalSeries(rows);
  return buildMonthlySeries(rows);
};

const getChartMeta = (view) => {
  const activeView = earningsViewOptions.find((option) => option.value === view) || earningsViewOptions[2];
  return {
    title: activeView.title,
    subtitle: activeView.subtitle,
    note: activeView.note,
    series: buildChartSeries(view)
  };
};

const getRangeStartForView = (view) => {
  const start = dayjs().startOf('day');

  if (view === 'day') return start.toDate();

  if (view === 'week') {
    const weekdayOffset = start.day() === 0 ? 6 : start.day() - 1;
    return start.subtract(weekdayOffset, 'day').toDate();
  }

  if (view === 'month') return start.startOf('month').toDate();

  return null;
};

const getActiveChartBucket = (view) => {
  const now = dayjs();

  if (view === 'day') return DAY_VIEW_HIGHLIGHT_BUCKET;

  if (view === 'week') {
    const dayOfWeekBucket = now.day() === 0 ? 1 : now.day() + 1;
    return dayOfWeekBucket;
  }

  if (view === 'month') return now.date();
  if (view === 'total') return now.year();

  return null;
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
  const [selectedEarningsTotal, setSelectedEarningsTotal] = useState(cleanerEarningsSummary.total);
  const [earningsSeries, setEarningsSeries] = useState(() => getChartMeta('month').series);

  useEffect(() => {
    let isMounted = true;

    const loadEarnings = async () => {
      const from = getRangeStartForView(earningsView);
      const earningsParams = from
        ? {
            from: from.toISOString(),
            to: new Date().toISOString()
          }
        : undefined;

      try {
        const [earningsData, summaryData] = await Promise.all([
          fetchCleanerEarnings(earningsParams),
          fetchCleanerEarningsSummary({ view: earningsView === 'month' ? 'month_days' : earningsView })
        ]);

        if (!isMounted) return;

        setSelectedEarningsTotal(Number(earningsData?.total_earnings) || 0);
        setEarningsSeries(buildChartSeries(earningsView, summaryData));
      } catch (error) {
        console.error('Failed to fetch cleaner earnings page data:', error);
        if (!isMounted) return;
        setSelectedEarningsTotal(cleanerEarningsSummary.total);
        setEarningsSeries(getChartMeta(earningsView).series);
      }
    };

    loadEarnings();

    return () => {
      isMounted = false;
    };
  }, [earningsView]);

  const chartMeta = useMemo(() => getChartMeta(earningsView), [earningsView]);

  const chartBarItems = useMemo(() => {
    const peakEarnings = earningsSeries.reduce(
      (maxValue, item) => Math.max(maxValue, Number(item?.earnings) || 0),
      0
    );
    const chartScale = peakEarnings > 0 ? peakEarnings : 1;
    const activeBucket = getActiveChartBucket(earningsView);
    const hasActiveBucket = earningsSeries.some((item) => item?.bucket === activeBucket);

    return earningsSeries.map((item, index) => {
      const earningsValue = Number(item?.earnings) || 0;
      const heightPercentage = (earningsValue / chartScale) * 100;

      return {
        key: `${earningsView}-${item?.bucket ?? index}-${index}`,
        label: String(item?.label || ''),
        periodLabel: String(item?.periodLabel || ''),
        earnings: earningsValue,
        barHeight: `${Math.max(heightPercentage, earningsValue > 0 ? MIN_CHART_BAR_HEIGHT : 8)}%`,
        isCurrentPeriod: hasActiveBucket ? item?.bucket === activeBucket : index === earningsSeries.length - 1
      };
    });
  }, [earningsSeries, earningsView]);

  const handleApplyFilters = () => {
    setAppliedFilters({
      sortBy,
      paymentStatus,
      dateFrom,
      dateTo
    });
  };

  const filteredTransactions = useMemo(() => {
    const filtered = cleanerTransactions.filter((item) => {
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
  }, [appliedFilters]);

  return (
    <div className="cleaner-earnings-page">
      <div className="earnings-headline">
        <h1>Earnings Overview</h1>
        <p>Track your income and payment history.</p>
      </div>

      <section className="earnings-stats-panel">
        <div className="earnings-total-card">
          <span className="earnings-total-label">{chartMeta.title}</span>
          <span className="earnings-total-value">{formatMoney(selectedEarningsTotal)}</span>
          <span className="earnings-total-note">{chartMeta.note}</span>
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
                    title={`${item.label}: ${formatMoney(item.earnings)}`}
                  />
                </div>
                {earningsView === 'day' && item.periodLabel ? (
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
