import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarOutlined,
  CloseCircleOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { Select } from 'antd';
import { Line } from '@ant-design/charts';
import '../../../styles/admin/reports_page.css';
import { useTranslation } from '../../../contexts/translation_context';
import { useTheme } from '../../../contexts/theme_context';
import { reportService } from '../services/reportService';
import { getCleanerDisplayName } from '../utils/cleanerProfile';

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const apiHost = rawApiBaseUrl.endsWith('/api') ? rawApiBaseUrl.slice(0, -4) : rawApiBaseUrl;
const rangeOptions = [
  { value: 'week', label: 'This Week', subtitle: 'Last 7 days' },
  { value: 'month', label: 'This Month', subtitle: 'Jan - Dec this year' },
  { value: 'total', label: 'All Time', subtitle: 'Last 7 years' }
];

const toAbsoluteImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith('data:')) return imageUrl;
  return `${apiHost}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
};

const getInitials = (value, fallback = 'NA') => {
  const parts = String(value || '').trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const initials = parts.map((part) => part.charAt(0).toUpperCase()).join('');
  return initials || fallback;
};

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

const toServiceKey = (value) => String(value || '').trim().toLowerCase();

const formatCurrency = (value) => `$${toSafeNumber(value).toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}`;

const formatDateTime = (value) => {
  if (!value) return 'Not recorded';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Not recorded';
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const ReportsPage = () => {
  const { ta } = useTranslation();
  const { darkMode } = useTheme();
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
        const response = await reportService.getRevenueReport({ range });
        if (cancelled) return;
        setReport(extractReportPayload(response));
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to load admin revenue report:', error);
        setReport({});
        setErrorMessage(error?.response?.data?.message || 'Unable to load revenue analysis right now.');
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
  const topServices = Array.isArray(report?.top_services) ? report.top_services : [];
  const recentTransactions = Array.isArray(report?.recent_transactions) ? report.recent_transactions : [];
  const selectedRange = rangeOptions.find((item) => item.value === range) || rangeOptions[1];
  const highestServiceRevenue = topServices.reduce(
    (max, item) => Math.max(max, toSafeNumber(item?.total_revenue)),
    0
  );
  const serviceImageByName = useMemo(() => {
    const imageMap = new Map();
    recentTransactions.forEach((transaction) => {
      const key = toServiceKey(transaction?.service_name);
      if (!key || !transaction?.service_image || imageMap.has(key)) return;
      imageMap.set(key, transaction.service_image);
    });
    return imageMap;
  }, [recentTransactions]);

  const revenueChartData = useMemo(
    () => timeline.map((item) => ({
      label: item?.label || '',
      value: toSafeNumber(item?.revenue)
    })),
    [timeline]
  );

  const revenueChartConfig = useMemo(() => ({
    data: revenueChartData,
    xField: 'label',
    yField: 'value',
    smooth: true,
    autoFit: true,
    height: 300,
    theme: darkMode ? 'classicDark' : 'classic',
    color: '#16a34a',
    scale: {
      color: {
        range: ['#16a34a']
      }
    },
    lineStyle: {
      lineWidth: 2,
      stroke: '#16a34a'
    },
    line: {
      style: {
        lineWidth: 2,
        stroke: '#16a34a'
      }
    },
    padding: [24, 20, 48, 48],
    point: {
      size: 4,
      shape: 'circle',
      style: {
        fill: darkMode ? '#0f1b33' : '#ffffff',
        stroke: '#16a34a',
        lineWidth: 2
      }
    },
    area: {
      style: {
        fill: darkMode
          ? 'l(270) 0:rgba(34,197,94,0.28) 1:rgba(14,23,42,0)'
          : 'l(270) 0:#dcfce7 1:#ffffff'
      }
    },
    xAxis: {
      label: {
        style: {
          fill: darkMode ? '#a9b7cc' : '#64748b',
          fontSize: 12
        }
      },
      line: {
        style: {
          stroke: darkMode ? '#2b4a37' : '#cfe9d7'
        }
      }
    },
    yAxis: {
      label: {
        formatter: (value) => `$${Number(value).toLocaleString('en-US')}`,
        style: {
          fill: darkMode ? '#a9b7cc' : '#64748b',
          fontSize: 12
        }
      },
      grid: {
        line: {
          style: {
            stroke: darkMode ? '#2b4a37' : '#e5f5ea',
            lineDash: [4, 4]
          }
        }
      }
    },
    tooltip: {
      formatter: (datum) => ({
        name: 'Revenue',
        value: formatCurrency(datum?.value)
      })
    },
    animation: false
  }), [revenueChartData, darkMode]);

  const kpiCards = [
    {
      title: 'TOTAL REVENUE',
      value: formatCurrency(stats?.total_revenue),
      note: `${selectedRange.subtitle} revenue`,
      tone: 'green',
      icon: <DollarOutlined />
    },
    {
      title: 'PAID BOOKINGS',
      value: String(toSafeNumber(stats?.paid_bookings)),
      note: 'Bookings with completed payments',
      tone: 'blue',
      icon: <CalendarOutlined />
    },
    {
      title: 'CANCELLED BOOKINGS',
      value: String(toSafeNumber(stats?.cancelled_bookings)),
      note: 'Bookings cancelled in this range',
      tone: 'rose',
      icon: <CloseCircleOutlined />
    }
  ];

  return (
    <section className={`admin-reports-page ${darkMode ? 'dark-mode' : ''}`}>
      <header className="admin-reports-header">
        <div>
          <h1 className="admin-page-title">{ta('Revenue Analysis')}</h1>
          <p className="admin-page-subtitle">{ta('Track revenue flow, paid bookings, and the services driving income.')}</p>
        </div>

        <label className="admin-report-range-select">
          <span>{ta('Report Range')}</span>
          <Select
            value={range}
            onChange={setRange}
            options={rangeOptions.map((option) => ({
              value: option.value,
              label: ta(option.label)
            }))}
            popupMatchSelectWidth={false}
          />
        </label>
      </header>

      <section className="admin-reports-kpi-grid">
        {kpiCards.map((card) => (
          <article key={card.title} className={`admin-reports-kpi-card tone-${card.tone}`}>
            <div className="report-kpi-icon">{card.icon}</div>
            <span>{card.title}</span>
            <strong>{card.value}</strong>
            <p>{card.note}</p>
          </article>
        ))}
      </section>

      <section className="admin-reports-layout">
        <article className="reports-panel reports-chart-panel">
          <div className="reports-panel-head">
            <div>
              <h3>Revenue Trend</h3>
              <p>Income generated across the selected reporting window.</p>
            </div>
          </div>

          {loading ? (
            <div className="reports-empty-state">Loading revenue chart...</div>
          ) : errorMessage ? (
            <div className="reports-empty-state">{errorMessage}</div>
          ) : revenueChartData.length > 0 ? (
            <div className="reports-chart-shell">
              <Line {...revenueChartConfig} />
            </div>
          ) : (
            <div className="reports-empty-state">No paid revenue has been recorded for this period.</div>
          )}
        </article>

        <article className="reports-panel reports-service-panel">
          <div className="reports-panel-head">
            <div>
              <h3>Top Revenue Services</h3>
              <p>Highest earning service categories in this range.</p>
            </div>
          </div>

          <div className="revenue-service-list">
            {loading ? (
              <div className="reports-empty-state small">Loading services...</div>
            ) : topServices.length > 0 ? (
              topServices.map((service) => {
                const revenue = toSafeNumber(service?.total_revenue);
                const serviceImage = service?.service_image || serviceImageByName.get(toServiceKey(service?.service_name)) || '';
                const width = highestServiceRevenue > 0 ? Math.max(14, Math.round((revenue / highestServiceRevenue) * 100)) : 14;
                return (
                  <article key={`${service?.service_id || service?.service_name}`} className="revenue-service-item">
                    <div className="revenue-service-topline">
                      <div className="revenue-service-meta">
                        <span className="report-entity-avatar service">
                          {serviceImage ? (
                            <img
                              src={toAbsoluteImageUrl(serviceImage)}
                              alt={service?.service_name || 'Cleaning Service'}
                              className="report-entity-image"
                            />
                          ) : (
                            getInitials(service?.service_name, 'SV')
                          )}
                        </span>
                        <div className="revenue-service-copy">
                          <strong>{service?.service_name || 'Cleaning Service'}</strong>
                          <span>{toSafeNumber(service?.bookings_count)} paid bookings</span>
                        </div>
                      </div>
                      <b>{formatCurrency(revenue)}</b>
                    </div>
                    <div className="revenue-service-bar">
                      <div className="revenue-service-bar-fill" style={{ width: `${width}%` }} />
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="reports-empty-state small">No revenue services found in this range.</div>
            )}
          </div>
        </article>
      </section>

      <section className="reports-panel reports-table-panel">
        <div className="reports-panel-head">
          <div>
            <h3>Recent Transactions</h3>
            <p>Latest successful payments and the bookings tied to them.</p>
          </div>
        </div>

        <div className="table-scroll">
          <table className="reports-table">
            <thead>
              <tr>
                <th>BOOKING</th>
                <th>SERVICE</th>
                <th>CUSTOMER</th>
                <th>CLEANER</th>
                <th>AMOUNT</th>
                <th>PAID AT</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="empty-row" colSpan={6}>Loading transactions...</td>
                </tr>
              ) : errorMessage ? (
                <tr>
                  <td className="empty-row" colSpan={6}>{errorMessage}</td>
                </tr>
              ) : recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => {
                  const cleanerName = getCleanerDisplayName(transaction, transaction?.cleaner_id ? 'Cleaner' : 'Cleaner pending');
                  return (
                    <tr key={`${transaction?.booking_id}-${transaction?.paid_at}`}>
                      <td>#{toSafeNumber(transaction?.booking_id)}</td>
                      <td>
                        <div className="report-entity-cell">
                          <span className="report-entity-avatar service">
                            {transaction?.service_image ? (
                              <img
                                src={toAbsoluteImageUrl(transaction.service_image)}
                                alt={transaction?.service_name || 'Cleaning Service'}
                                className="report-entity-image"
                              />
                            ) : (
                              getInitials(transaction?.service_name, 'SV')
                            )}
                          </span>
                          <div className="report-primary-cell">
                            <strong>{transaction?.service_name || 'Cleaning Service'}</strong>
                            <span>{String(transaction?.payment_method || 'Unknown method').replace(/_/g, ' ')}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="report-entity-cell">
                          <span className="report-entity-avatar">
                            {transaction?.customer_avatar ? (
                              <img
                                src={toAbsoluteImageUrl(transaction.customer_avatar)}
                                alt={transaction?.customer_name || 'Customer'}
                                className="report-entity-image"
                              />
                            ) : (
                              getInitials(transaction?.customer_name, 'CU')
                            )}
                          </span>
                          <div className="report-primary-cell">
                            <strong>{transaction?.customer_name || 'Customer'}</strong>
                            <span>{transaction?.customer_email || 'No email provided'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                          <div className="report-entity-cell">
                            <span className="report-entity-avatar">
                              {transaction?.cleaner_avatar ? (
                                <img
                                  src={toAbsoluteImageUrl(transaction.cleaner_avatar)}
                                  alt={cleanerName}
                                  className="report-entity-image"
                                />
                              ) : (
                                getInitials(cleanerName, 'CL')
                              )}
                            </span>
                            <div className="report-primary-cell">
                              <strong>{cleanerName}</strong>
                              <span>{transaction?.cleaner_email || 'No email provided'}</span>
                            </div>
                          </div>
                      </td>
                      <td className="report-amount-cell">{formatCurrency(transaction?.amount)}</td>
                      <td>{formatDateTime(transaction?.paid_at)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="empty-row" colSpan={6}>No completed payments found for this range.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
};

export default ReportsPage;
