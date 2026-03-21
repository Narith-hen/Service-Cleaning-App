<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
=======
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from '@ant-design/charts';
import { Select } from 'antd';
>>>>>>> rathana
import {
  DollarCircleOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  StarOutlined,
  DollarOutlined
} from '@ant-design/icons';
import api from '../../../services/api';
import '../../../styles/cleaner/dashboard.scss';
import { cleanerEarningsSummary, formatMoney } from '../data/earnings_data';
import { fetchCleanerEarnings } from '../services/earningsService';

const CONFIRMED_MY_JOBS_STORAGE_KEY = 'cleaner_confirmed_my_jobs';
const FALLBACK_COMPLETED_JOBS = 2;
const FALLBACK_PENDING_REQUESTS = 1;

<<<<<<< HEAD
const CleanerDashboardPage = () => {
  const [totalEarnings, setTotalEarnings] = useState(cleanerEarningsSummary.total);
  const [completedJobs, setCompletedJobs] = useState(FALLBACK_COMPLETED_JOBS);
  const [pendingRequests, setPendingRequests] = useState(FALLBACK_PENDING_REQUESTS);

  useEffect(() => {
    let isMounted = true;

    const loadEarnings = async () => {
      try {
        const data = await fetchCleanerEarnings();
        if (!isMounted) return;
        setTotalEarnings(Number(data.total_earnings) || 0);
      } catch (error) {
        console.error('Failed to fetch cleaner earnings for dashboard:', error);
      }
    };

    loadEarnings();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const syncCompletedJobs = () => {
      try {
        const raw = localStorage.getItem(CONFIRMED_MY_JOBS_STORAGE_KEY);
        if (!raw) {
          setCompletedJobs(FALLBACK_COMPLETED_JOBS);
          setPendingRequests(FALLBACK_PENDING_REQUESTS);
          return;
        }

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          setCompletedJobs(FALLBACK_COMPLETED_JOBS);
          setPendingRequests(FALLBACK_PENDING_REQUESTS);
          return;
        }

        const nextCompletedCount = parsed.filter((job) => job?.status === 'completed').length;
        const nextPendingCount = parsed.filter(
          (job) => !job?.status || job.status === 'upcoming' || job.status === 'pending'
        ).length;
        setCompletedJobs(nextCompletedCount);
        setPendingRequests(nextPendingCount);
      } catch (error) {
        console.error('Failed to read completed jobs from My Jobs storage:', error);
        setCompletedJobs(FALLBACK_COMPLETED_JOBS);
        setPendingRequests(FALLBACK_PENDING_REQUESTS);
      }
    };

    syncCompletedJobs();

    window.addEventListener('storage', syncCompletedJobs);
    window.addEventListener('focus', syncCompletedJobs);

    return () => {
      window.removeEventListener('storage', syncCompletedJobs);
      window.removeEventListener('focus', syncCompletedJobs);
    };
  }, []);

  const stats = [
    {
      key: 'earnings',
      title: 'Total Earnings',
      value: formatMoney(totalEarnings),
      note: '+12% vs last month',
      icon: <DollarCircleOutlined />,
      tone: 'success'
    },
    {
      key: 'completed',
      title: 'Jobs Completed',
      value: String(completedJobs),
      note: '+5 new today',
      icon: <SyncOutlined />,
      tone: 'success'
    },
    {
      key: 'pending',
      title: 'Pending Requests',
      value: String(pendingRequests),
      note: 'Action required',
      icon: <ClockCircleOutlined />,
      tone: 'warning'
    },
    {
      key: 'rating',
      title: 'Average Rating',
      value: '4.9 / 5.0',
      note: '',
      icon: <StarOutlined />,
      tone: 'rating'
    }
  ];
=======
const earningsViewOptions = [
  { value: 'week', label: 'Weekly Earnings', note: 'This week' },
  { value: 'month', label: 'Monthly Earnings', note: 'This month' },
  { value: 'total', label: 'Total Earnings', note: 'All time' }
];
>>>>>>> rathana

const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fallbackStats = [
  {
    key: 'earnings',
    title: 'Total Earnings',
    value: '$0.00',
    note: '0 jobs today',
    icon: <DollarCircleOutlined />,
    tone: 'success'
  },
  {
    key: 'completed',
    title: 'Jobs Completed',
    value: '0',
    note: '0 scheduled today',
    icon: <SyncOutlined />,
    tone: 'success'
  },
  {
    key: 'rating',
    title: 'Average Rating',
    value: '0.0 / 5.0',
    note: '',
    icon: <StarOutlined />,
    tone: 'rating'
  }
];

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const formatCurrency = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '$0.00';
  return currencyFormatter.format(numeric);
};

const formatRating = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '0.0 / 5.0';
  return `${numeric.toFixed(1)} / 5.0`;
};

const buildWeeklySeries = (rows) => {
  const totalsByBucket = new Map(
    (rows || []).map((row) => [Number(row?.bucket || 0), Number(row?.total || 0)])
  );

  const bucketByIndex = [2, 3, 4, 5, 6, 7, 1];

  return weekdayLabels.map((label, index) => ({
    label,
    earnings: Number(totalsByBucket.get(bucketByIndex[index]) || 0)
  }));
};

const buildMonthlySeries = (rows) => {
  const totalsByBucket = new Map(
    (rows || []).map((row) => [Number(row?.bucket || 0), Number(row?.total || 0)])
  );

  return monthLabels.map((label, index) => ({
    label,
    earnings: Number(totalsByBucket.get(index + 1) || 0)
  }));
};

const buildTotalSeries = (rows) => {
  const currentYear = new Date().getFullYear();
  const totalsByBucket = new Map(
    (rows || []).map((row) => [Number(row?.bucket || 0), Number(row?.total || 0)])
  );

  return Array.from({ length: 7 }, (_, index) => {
    const year = currentYear - 6 + index;

    return {
      label: String(year),
      earnings: Number(totalsByBucket.get(year) || 0)
    };
  });
};

const buildChartSeries = (view, rows) => {
  if (view === 'week') return buildWeeklySeries(rows);
  if (view === 'total') return buildTotalSeries(rows);
  return buildMonthlySeries(rows);
};

const getChartMeta = (view) => {
  if (view === 'week') {
    return {
      title: 'Weekly Earnings',
      subtitle: 'Current week performance',
      series: buildWeeklySeries([])
    };
  }

  if (view === 'total') {
    return {
      title: 'Total Earnings',
      subtitle: 'Last 7 years performance',
      series: buildTotalSeries([])
    };
  }

  return {
    title: 'Monthly Earnings',
    subtitle: 'Current year performance',
    series: buildMonthlySeries([])
  };
};

const getRangeStartForView = (view) => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (view === 'week') {
    const day = start.getDay();
    const offset = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - offset);
    return start;
  }

  if (view === 'month') {
    start.setDate(1);
    return start;
  }

  return null;
};

const formatBookingTimeParts = (bookingDate, bookingTime) => {
  const rawTime = String(bookingTime || '').trim();
  if (rawTime) {
    const startTime = rawTime.split('-').map((part) => part.trim()).filter(Boolean)[0] || rawTime;
    const match = startTime.match(/^(\d{1,2}:\d{2})\s*([AaPp][Mm])$/);
    if (match) {
      return {
        time: match[1],
        meridiem: match[2].toUpperCase()
      };
    }
  }

  const date = new Date(bookingDate);
  if (Number.isNaN(date.getTime())) return { time: 'TBD', meridiem: '' };

  const parts = date
    .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    .split(' ');

  return {
    time: parts[0] || 'TBD',
    meridiem: parts[1] || ''
  };
};

const formatTimeParts = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return { time: 'TBD', meridiem: '' };

  const parts = date
    .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    .split(' ');

  return {
    time: parts[0] || 'TBD',
    meridiem: parts[1] || ''
  };
};

const formatBookingStatus = (status) => {
  const normalized = String(status || '').toLowerCase().replace(/_/g, '-');
  if (normalized === 'in-progress') return 'IN PROGRESS';
  if (normalized === 'confirmed') return 'UPCOMING';
  if (normalized === 'pending') return 'PENDING';
  if (normalized === 'completed') return 'COMPLETED';
  return 'UPCOMING';
};

const getStatusClassName = (statusLabel) => {
  if (statusLabel === 'IN PROGRESS') return 'in-progress';
  return 'upcoming';
};

const mapUpcomingJob = (job) => {
  const { time, meridiem } = formatBookingTimeParts(job?.booking_date, job?.booking_time);
  const customerName = job?.user?.username ? `Customer: ${job.user.username}` : 'Customer details unavailable';

  return {
    time,
    meridiem,
    title: job?.service?.name || 'Cleaning Service',
    location: customerName,
    duration: job?.booking_time || 'Scheduled service',
    amount: formatCurrency(job?.total_price),
    status: formatBookingStatus(job?.booking_status)
  };
};

const CleanerDashboardPage = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [earningsView, setEarningsView] = useState('total');
  const [selectedEarningsValue, setSelectedEarningsValue] = useState(null);
  const [earningsSeries, setEarningsSeries] = useState(() => getChartMeta('total').series);

  useEffect(() => {
    let active = true;

    const loadCleanerDashboard = async () => {
      const dashboardResponse = await api.get('/dashboard/cleaner');

      if (!active) return;

      try {
        setDashboardData(dashboardResponse?.data?.data || null);
      } catch (error) {
        console.error('Failed to load cleaner dashboard:', error);
        setDashboardData(null);
      }
    };

    loadCleanerDashboard().catch((error) => {
      console.error('Failed to load cleaner dashboard:', error);
      if (!active) return;
      setDashboardData(null);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadSelectedEarnings = async () => {
      const from = getRangeStartForView(earningsView);

      try {
        const [earningsResponse, summaryResponse] = await Promise.all([
          api.get('/dashboard/cleaner/earnings', {
            params: from
              ? {
                  from: from.toISOString(),
                  to: new Date().toISOString()
                }
              : undefined
          }),
          api.get('/dashboard/cleaner/earnings/summary', {
            params: { view: earningsView }
          })
        ]);

        if (!active) return;
        setSelectedEarningsValue(Number(earningsResponse?.data?.data?.total_earnings ?? 0));
        setEarningsSeries(buildChartSeries(earningsView, summaryResponse?.data?.data));
      } catch (error) {
        console.error('Failed to load selected cleaner earnings:', error);
        if (!active) return;
        setSelectedEarningsValue(null);
        setEarningsSeries(getChartMeta(earningsView).series);
      }
    };

    loadSelectedEarnings();

    return () => {
      active = false;
    };
  }, [earningsView]);

  const stats = useMemo(() => {
    const statsPayload = dashboardData?.stats;
    const currentEarningsMeta = earningsViewOptions.find((option) => option.value === earningsView) || earningsViewOptions[2];
    const fallbackEarningsValue =
      selectedEarningsValue !== null && Number.isFinite(selectedEarningsValue)
        ? selectedEarningsValue
        : Number(statsPayload?.total_earnings || 0);

    if (!statsPayload) {
      return fallbackStats.map((item) =>
        item.key === 'earnings'
          ? {
              ...item,
              title: currentEarningsMeta.label,
              value: formatCurrency(fallbackEarningsValue),
              note: currentEarningsMeta.note
            }
          : item
      );
    }

    const todayJobs = Number(statsPayload.today_jobs || 0);

    return [
      {
        key: 'earnings',
        title: currentEarningsMeta.label,
        value: formatCurrency(fallbackEarningsValue),
        note: currentEarningsMeta.note,
        icon: <DollarCircleOutlined />,
        tone: 'success'
      },
      {
        key: 'completed',
        title: 'Jobs Completed',
        value: String(statsPayload.completed_jobs ?? 0),
        note: `${todayJobs} scheduled today`,
        icon: <SyncOutlined />,
        tone: 'success'
      },
      {
        key: 'rating',
        title: 'Average Rating',
        value: formatRating(statsPayload.average_rating),
        note: '',
        icon: <StarOutlined />,
        tone: 'rating'
      }
    ];
  }, [dashboardData, earningsView, selectedEarningsValue]);

  const todaySchedule = useMemo(() => {
    const upcomingJobs = Array.isArray(dashboardData?.upcoming_jobs) ? dashboardData.upcoming_jobs : [];
    return upcomingJobs.map(mapUpcomingJob);
  }, [dashboardData]);

  const chartMeta = useMemo(() => getChartMeta(earningsView), [earningsView]);

  const chartConfig = useMemo(() => ({
    data: earningsSeries,
    xField: 'label',
    yField: 'earnings',
    smooth: false,
    autoFit: true,
    height: 300,
    theme: {
      colors10: ['#32c753'],
      colors20: ['#32c753']
    },
    scale: {
      color: {
        range: ['#32c753']
      }
    },
    color: '#32c753',
    style: {
      stroke: '#32c753',
      lineWidth: 2
    },
    lineStyle: {
      lineWidth: 2,
      stroke: '#32c753'
    },
    point: {
      size: 4,
      shape: 'circle',
      style: {
        fill: '#32c753',
        stroke: '#32c753',
        lineWidth: 2
      }
    },
    xAxis: {
      label: {
        style: {
          fill: '#94a3b8',
          fontSize: 12
        }
      },
      line: {
        style: {
          stroke: '#eef2f7'
        }
      },
      tickLine: null
    },
    yAxis: {
      label: {
        style: {
          fill: '#94a3b8',
          fontSize: 12
        },
        formatter: (value) => `${Math.round(Number(value) || 0)}`
      },
      grid: {
        line: {
          style: {
            stroke: '#edf2f7',
            lineDash: [3, 4]
          }
        }
      }
    },
    tooltip: {
      formatter: (datum) => ({
        name: datum.label,
        value: `${Math.round(Number(datum.earnings) || 0)}`
      })
    },
    legend: false
  }), [earningsSeries]);

  return (
    <div className="cleaner-dashboard">
      <div className="dashboard-toolbar">
        <div className="dashboard-toolbar-heading">
          <h1>Dashboard</h1>
        </div>
        <label className="dashboard-earnings-select">
          <span>Earnings View</span>
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

      <div className="dashboard-stat-grid">
        {stats.map((item) => (
          <article key={item.key} className="dashboard-stat-card">
            <div className="stat-card-top">
              <span className={`stat-icon ${item.tone}`}>{item.icon}</span>
              {item.note ? (
                <span className={`stat-note ${item.tone}`}>{item.note}</span>
              ) : (
                <StarOutlined className="stat-star" />
              )}
            </div>
            <p className="stat-title">{item.title}</p>
            <p className="stat-value">{item.value}</p>
          </article>
        ))}
      </div>

      <section className="dashboard-earnings-panel">
        <div className="dashboard-chart-header">
          <h2>{chartMeta.title}</h2>
          <span className="dashboard-chart-subtitle">{chartMeta.subtitle}</span>
        </div>
        <div className="dashboard-chart-shell">
          <Line {...chartConfig} />
        </div>
      </section>

      <section className="today-schedule-panel">
        <div className="schedule-head">
          <h2>Today&apos;s Schedule</h2>
          {/* <button type="button" className="view-calendar-btn" onClick={() => navigate('/cleaner/schedule')}>
            View Calendar
          </button> */}
        </div>

        <div className="schedule-list">
          {todaySchedule.length ? (
            todaySchedule.map((job) => (
              <article key={`${job.time}-${job.title}-${job.location}`} className="schedule-row">
                <div className="job-time">
                  <span className="time-main">{job.time}</span>
                  <span className="time-ampm">{job.meridiem}</span>
                </div>

                <div className="job-content">
                  <h3>{job.title}</h3>
                  <p>{job.location}</p>
                  <div className="job-meta">
                    <span><ClockCircleOutlined /> {job.duration}</span>
                    <span><DollarOutlined /> {job.amount}</span>
                  </div>
                </div>

                <span className={`job-status ${getStatusClassName(job.status)}`}>
                  {job.status}
                </span>
              </article>
            ))
          ) : (
            <div className="schedule-empty-state">
              <h3>No services scheduled for today</h3>
              <p>When a booking is assigned for today, it will appear here automatically.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CleanerDashboardPage;
