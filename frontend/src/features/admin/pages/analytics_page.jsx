import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StarOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Select } from 'antd';
import { Line } from '@ant-design/charts';
import '../../../styles/admin/analytics_page.css';
import { reportService } from '../services/reportService';

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const apiHost = rawApiBaseUrl.endsWith('/api') ? rawApiBaseUrl.slice(0, -4) : rawApiBaseUrl;

const rangeOptions = [
  { value: 'week', label: 'This Week', subtitle: 'Last 7 days' },
  { value: 'month', label: 'This Month', subtitle: 'Jan - Dec this year' },
  { value: 'total', label: 'All Time', subtitle: 'Last 7 years' }
];

const extractReportPayload = (response) => {
  if (response?.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
    return response.data;
  }
  if (response && typeof response === 'object' && !Array.isArray(response)) {
    return response;
  }
  return {};
};

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatCurrency = (value) => `$${toSafeNumber(value).toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}`;

const toAbsoluteImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith('data:')) return imageUrl;
  return `${apiHost}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
};

const getInitials = (name) => (
  String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'CL'
);

const AnalyticsPage = () => {
  const [range, setRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [report, setReport] = useState({});

  useEffect(() => {
    let cancelled = false;

    const loadReport = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        const response = await reportService.getPerformanceReport({ range });
        if (cancelled) return;
        setReport(extractReportPayload(response));
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to load admin performance report:', error);
        setReport({});
        setErrorMessage(error?.response?.data?.message || 'Unable to load performance analysis right now.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadReport();

    return () => {
      cancelled = true;
    };
  }, [range]);

  const stats = report?.stats || {};
  const timeline = Array.isArray(report?.timeline) ? report.timeline : [];
  const topCleaners = Array.isArray(report?.top_cleaners) ? report.top_cleaners : [];
  const servicePerformance = Array.isArray(report?.service_performance) ? report.service_performance : [];
  const statusBreakdown = Array.isArray(report?.status_breakdown) ? report.status_breakdown : [];
  const selectedRange = rangeOptions.find((item) => item.value === range) || rangeOptions[1];
  const maxStatusCount = statusBreakdown.reduce((max, item) => Math.max(max, toSafeNumber(item?.total)), 0);

  const timelineData = useMemo(() => timeline.flatMap((item) => ([
    { label: item?.label || '', metric: 'Bookings', value: toSafeNumber(item?.bookings) },
    { label: item?.label || '', metric: 'Completed', value: toSafeNumber(item?.completed) },
    { label: item?.label || '', metric: 'Cancelled', value: toSafeNumber(item?.cancelled) }
  ])), [timeline]);

  const performanceChartConfig = useMemo(() => ({
    data: timelineData,
    xField: 'label',
    yField: 'value',
    seriesField: 'metric',
    smooth: true,
    autoFit: true,
    height: 320,
    color: ['#0f172a', '#16a34a', '#ef4444'],
    padding: [24, 20, 48, 48],
    point: {
      size: 3,
      shape: 'circle'
    },
    legend: {
      position: 'top'
    },
    xAxis: {
      label: {
        style: {
          fill: '#64748b',
          fontSize: 12
        }
      }
    },
    yAxis: {
      label: {
        style: {
          fill: '#64748b',
          fontSize: 12
        }
      },
      grid: {
        line: {
          style: {
            stroke: '#eef4fb',
            lineDash: [4, 4]
          }
        }
      }
    },
    animation: false
  }), [timelineData]);

  const kpiCards = [
    {
      title: 'TOTAL BOOKINGS',
      value: String(toSafeNumber(stats?.total_bookings)),
      note: `${selectedRange.subtitle} booking flow`,
      tone: 'blue',
      icon: <CalendarOutlined />
    },
    {
      title: 'COMPLETION RATE',
      value: `${toSafeNumber(stats?.completion_rate).toFixed(1)}%`,
      note: `${toSafeNumber(stats?.completed_bookings)} jobs completed`,
      tone: 'green',
      icon: <CheckCircleOutlined />
    },
    {
      title: 'ACTIVE CLEANERS',
      value: String(toSafeNumber(stats?.active_cleaners)),
      note: `${toSafeNumber(stats?.open_bookings)} jobs still open`,
      tone: 'amber',
      icon: <TeamOutlined />
    },
    {
      title: 'AVERAGE RATING',
      value: toSafeNumber(stats?.average_rating).toFixed(1),
      note: `${toSafeNumber(stats?.cancelled_bookings)} cancellations in range`,
      tone: 'rose',
      icon: <StarOutlined />
    }
  ];

  return (
    <section className="admin-analytics-page">
      <header className="admin-analytics-header">
        <div>
          <h1 className="admin-page-title">Performance</h1>
          <p className="admin-page-subtitle">Monitor booking execution, cleaner output, and operational status trends.</p>
        </div>

        <label className="admin-analytics-range-select">
          <span>Performance Window</span>
          <Select
            value={range}
            onChange={setRange}
            options={rangeOptions.map((option) => ({
              value: option.value,
              label: option.label
            }))}
            popupMatchSelectWidth={false}
          />
        </label>
      </header>

      <section className="admin-analytics-kpi-grid">
        {kpiCards.map((card) => (
          <article key={card.title} className={`admin-analytics-kpi-card tone-${card.tone}`}>
            <div className="analytics-kpi-icon">{card.icon}</div>
            <span>{card.title}</span>
            <strong>{card.value}</strong>
            <p>{card.note}</p>
          </article>
        ))}
      </section>

      <section className="admin-analytics-main-grid">
        <article className="analytics-panel analytics-chart-panel">
          <div className="analytics-panel-head">
            <div>
              <h3>Operational Trend</h3>
              <p>Bookings created, completed, and cancelled through the selected window.</p>
            </div>
          </div>

          {loading ? (
            <div className="analytics-empty-state">Loading performance chart...</div>
          ) : errorMessage ? (
            <div className="analytics-empty-state">{errorMessage}</div>
          ) : timelineData.length > 0 ? (
            <div className="analytics-chart-shell">
              <Line {...performanceChartConfig} />
            </div>
          ) : (
            <div className="analytics-empty-state">No booking activity found for this range.</div>
          )}
        </article>

        <article className="analytics-panel analytics-status-panel">
          <div className="analytics-panel-head">
            <div>
              <h3>Status Breakdown</h3>
              <p>How jobs are distributed by current service state.</p>
            </div>
          </div>

          <div className="analytics-status-list">
            {loading ? (
              <div className="analytics-empty-state small">Loading statuses...</div>
            ) : statusBreakdown.length > 0 ? (
              statusBreakdown.map((status) => {
                const total = toSafeNumber(status?.total);
                const width = maxStatusCount > 0 ? Math.max(12, Math.round((total / maxStatusCount) * 100)) : 12;
                return (
                  <article key={status?.status_key || status?.status_label} className="analytics-status-item">
                    <div className="analytics-status-topline">
                      <strong>{status?.status_label || 'Pending'}</strong>
                      <span>{total}</span>
                    </div>
                    <div className="analytics-status-bar">
                      <div className="analytics-status-bar-fill" style={{ width: `${width}%` }} />
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="analytics-empty-state small">No status data available yet.</div>
            )}
          </div>
        </article>
      </section>

      <section className="admin-analytics-insight-grid">
        <article className="analytics-panel analytics-cleaners-panel">
          <div className="analytics-panel-head">
            <div>
              <h3>Top Cleaners</h3>
              <p>Best performers by completed jobs and customer rating.</p>
            </div>
          </div>

          <div className="analytics-cleaner-list">
            {loading ? (
              <div className="analytics-empty-state small">Loading cleaners...</div>
            ) : topCleaners.length > 0 ? (
              topCleaners.map((cleaner) => (
                <article key={cleaner?.cleaner_id} className="analytics-cleaner-item">
                  <div className="analytics-cleaner-main">
                    <span className="analytics-avatar">
                      {cleaner?.cleaner_avatar ? (
                        <img
                          src={toAbsoluteImageUrl(cleaner.cleaner_avatar)}
                          alt={cleaner?.cleaner_name || 'Cleaner'}
                          className="analytics-avatar-image"
                        />
                      ) : (
                        getInitials(cleaner?.cleaner_name)
                      )}
                    </span>
                    <div>
                      <strong>{cleaner?.cleaner_name || 'Cleaner'}</strong>
                      <span>{cleaner?.cleaner_email || 'No email provided'}</span>
                    </div>
                  </div>
                  <div className="analytics-cleaner-stats">
                    <span><CheckCircleOutlined /> {toSafeNumber(cleaner?.completed_jobs)} jobs</span>
                    <span><StarOutlined /> {toSafeNumber(cleaner?.average_rating).toFixed(1)}</span>
                    <span><ClockCircleOutlined /> {toSafeNumber(cleaner?.total_reviews)} reviews</span>
                  </div>
                </article>
              ))
            ) : (
              <div className="analytics-empty-state small">No cleaner performance data found.</div>
            )}
          </div>
        </article>

        <article className="analytics-panel analytics-services-panel">
          <div className="analytics-panel-head">
            <div>
              <h3>Service Performance</h3>
              <p>Booking volume, completion success, and service value by category.</p>
            </div>
          </div>

          <div className="table-scroll">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>SERVICE</th>
                  <th>BOOKINGS</th>
                  <th>COMPLETED</th>
                  <th>COMPLETION RATE</th>
                  <th>TOTAL VALUE</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="empty-row" colSpan={5}>Loading service performance...</td>
                  </tr>
                ) : errorMessage ? (
                  <tr>
                    <td className="empty-row" colSpan={5}>{errorMessage}</td>
                  </tr>
                ) : servicePerformance.length > 0 ? (
                  servicePerformance.map((service) => (
                    <tr key={service?.service_id || service?.service_name}>
                      <td>
                        <div className="analytics-service-cell">
                          <strong>{service?.service_name || 'Cleaning Service'}</strong>
                        </div>
                      </td>
                      <td>{toSafeNumber(service?.total_bookings)}</td>
                      <td>{toSafeNumber(service?.completed_bookings)}</td>
                      <td>{toSafeNumber(service?.completion_rate).toFixed(1)}%</td>
                      <td>{formatCurrency(service?.total_value)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="empty-row" colSpan={5}>No service performance data found for this range.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </section>
  );
};

export default AnalyticsPage;
