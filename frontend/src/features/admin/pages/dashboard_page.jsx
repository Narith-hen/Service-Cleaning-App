import React, { useEffect, useMemo, useState } from 'react';
import { Select } from 'antd';
import { Line } from '@ant-design/charts';
import {
  ApartmentOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  RiseOutlined,
  StarFilled,
  TeamOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons';
import '../../../styles/admin/dashboard_page.css';
import { useTheme } from '../../../contexts/theme_context';
import { useTranslation } from '../../../contexts/translation_context';
import { bookingRows } from '../data/bookings_data';
import { starterCleaners } from '../data/cleaners_data';
import { adminService } from '../services/adminService';
import { getCleanerDisplayName } from '../utils/cleanerProfile';

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const apiHost = rawApiBaseUrl.endsWith('/api') ? rawApiBaseUrl.slice(0, -4) : rawApiBaseUrl;

const toAbsoluteImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith('data:')) return imageUrl;
  return `${apiHost}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
};

const extractTopCleanerRows = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

const extractDashboardPayload = (response) => {
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

const mapTopCleaner = (cleaner) => ({
  id: String(cleaner?.id || cleaner?.cleaner_id || cleaner?.cleanerCode || cleaner?.cleaner_code || ''),
  name: getCleanerDisplayName(cleaner, 'Cleaner'),
  profileImage: toAbsoluteImageUrl(cleaner?.profileImage || cleaner?.profile_image || cleaner?.avatar || ''),
  totalJobs: toSafeNumber(cleaner?.totalJobs ?? cleaner?.total_jobs),
  rating: toSafeNumber(cleaner?.rating ?? cleaner?.avg_rating),
  reviews: toSafeNumber(cleaner?.reviews ?? cleaner?.total_reviews),
});

const mapRecentBooking = (booking) => ({
  id: booking?.booking_id ? `#${booking.booking_id}` : 'N/A',
  customer: booking?.customer_name || booking?.customer || 'Customer',
  customerAvatar: toAbsoluteImageUrl(
    booking?.customer_avatar || booking?.customerAvatar || booking?.user?.avatar || booking?.avatar || ''
  ),
  serviceName:
    booking?.service?.name ||
    booking?.service_name ||
    booking?.serviceType ||
    booking?.service ||
    booking?.title ||
    'Cleaning Service',
  cleaner: getCleanerDisplayName(booking, booking?.cleaner_id ? 'Cleaner' : 'Unassigned'),
  cleanerAvatar: toAbsoluteImageUrl(
    booking?.cleaner_avatar || booking?.cleanerAvatar || booking?.cleaner?.avatar || ''
  ),
  status: String(booking?.booking_status || booking?.status || 'Pending')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase()),
  amount: `${toSafeNumber(booking?.negotiated_price ?? booking?.total_price).toFixed(2)}`
});

const getTopServiceVisual = (name, index) => {
  const normalized = String(name || '').toLowerCase();

  if (normalized.includes('deep')) {
    return { tone: 'green', icon: <ToolOutlined /> };
  }
  if (normalized.includes('office')) {
    return { tone: 'blue', icon: <ApartmentOutlined /> };
  }
  if (normalized.includes('window')) {
    return { tone: 'amber', icon: <AppstoreOutlined /> };
  }

  const fallback = [
    { tone: 'green', icon: <ToolOutlined /> },
    { tone: 'blue', icon: <ApartmentOutlined /> },
    { tone: 'amber', icon: <AppstoreOutlined /> }
  ];

  return fallback[index % fallback.length];
};

const mapTopService = (service, index, maxBookings) => {
  const bookings = toSafeNumber(service?.bookings_count ?? service?.bookings);
  const { tone, icon } = getTopServiceVisual(service?.service_name || service?.name, index);
  const width = maxBookings > 0 ? Math.max(16, Math.round((bookings / maxBookings) * 100)) : 16;

  return {
    name: service?.service_name || service?.name || 'Cleaning Service',
    image: toAbsoluteImageUrl(service?.service_image || service?.image || ''),
    bookings,
    width,
    tone,
    icon
  };
};

const getRelativeTimeLabel = (value) => {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getInitials = (name) => (
  String(name || '')
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'RV'
);

const mapLatestReview = (review, index) => ({
  name: review?.reviewer_name || 'Customer',
  avatar: toAbsoluteImageUrl(review?.reviewer_avatar || review?.avatar || ''),
  time: getRelativeTimeLabel(review?.created_at),
  text: review?.comment || 'No written comment provided.',
  rating: Math.max(0, Math.min(5, Math.round(toSafeNumber(review?.rating)))),
  tone: ['teal', 'gold', 'blue', 'green'][index % 4]
});

const dashboardViewOptions = [
  { value: 'week', label: 'This Week', note: 'This week', bookingSubtitle: 'Bookings this week' },
  { value: 'month', label: 'This Month', note: 'This month', bookingSubtitle: 'Bookings this month' },
  { value: 'total', label: 'All Time', note: 'All time', bookingSubtitle: 'All booking records' }
];

const DashboardPage = () => {
  const { darkMode } = useTheme();
  const { ta } = useTranslation();
  const [topCleaners, setTopCleaners] = useState([]);
  const [dashboardPayload, setDashboardPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardView, setDashboardView] = useState('total');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashboardResponse, topCleanerResponse] = await Promise.all([
          adminService.getDashboardStats(dashboardView),
          adminService.getTopCleaners(3)
        ]);
        const dashboardData = extractDashboardPayload(dashboardResponse);
        const rows = extractTopCleanerRows(topCleanerResponse).map(mapTopCleaner).filter((cleaner) => cleaner.id);
        setDashboardPayload(dashboardData);
        setTopCleaners(rows);
      } catch (error) {
        console.error('Failed to fetch admin dashboard data:', error);
        setDashboardPayload(null);
        setTopCleaners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [dashboardView]);

  const currentDashboardMeta = dashboardViewOptions.find((option) => option.value === dashboardView) || dashboardViewOptions[2];
  const totalBookings = toSafeNumber(dashboardPayload?.stats?.total_bookings, bookingRows.length);
  const monthlyRevenue = toSafeNumber(
    dashboardPayload?.stats?.total_revenue,
    bookingRows
      .filter((booking) => booking.status !== 'Cancelled')
      .reduce((sum, booking) => sum + booking.amount, 0)
  );
  const customerComplaints = toSafeNumber(dashboardPayload?.stats?.customer_complaints, 0);
  const urgentComplaints = toSafeNumber(dashboardPayload?.stats?.urgent_complaints, 0);
  const activeCleanersCount = starterCleaners.filter((cleaner) => cleaner.status === 'Active').length;
  const recentBookings = Array.isArray(dashboardPayload?.recent_bookings) && dashboardPayload.recent_bookings.length > 0
    ? dashboardPayload.recent_bookings.slice(0, 5).map(mapRecentBooking)
    : [...bookingRows]
        .sort((a, b) => new Date(`${b.date} ${b.time}`) - new Date(`${a.date} ${a.time}`))
        .slice(0, 5)
        .map((booking) => ({
          id: booking.bookingId,
          customer: booking.customerName,
          customerAvatar: '',
          serviceName: booking.serviceType || 'Cleaning Service',
          cleaner: booking.cleanerName,
          cleanerAvatar: '',
          status: booking.status,
          amount: `${booking.amount.toFixed(2)}`,
        }));

  const kpiCards = [
    {
      title: 'TOTAL BOOKINGS',
      value: String(totalBookings),
      icon: <CalendarOutlined />,
      tone: 'blue',
      subtitle: currentDashboardMeta.bookingSubtitle,
    },
    {
      title: 'ACTIVE CLEANERS',
      value: String(activeCleanersCount),
      icon: <TeamOutlined />,
      tone: 'green',
      subtitle: '2 currently on-site',
    },
    {
      title: 'TOTAL EARNINGS',
      value: `$${monthlyRevenue.toFixed(2)}`,
      icon: <DollarOutlined />,
      tone: 'amber',
      subtitle: currentDashboardMeta.note,
    },
    {
      title: 'CUSTOMER COMPLAINTS',
      value: String(customerComplaints),
      icon: <ClockCircleOutlined />,
      tone: 'red',
      subtitle: `${urgentComplaints} require urgent response`,
    },
  ];

  const currentBookingVolumeMeta = {
    week: 'Current week performance by day',
    month: 'Current year performance by month',
    total: 'Last 7 years performance by year'
  }[dashboardView] || 'Current year performance by month';
  const rawBookingVolume = Array.isArray(dashboardPayload?.booking_volume?.items)
    ? dashboardPayload.booking_volume.items
    : [
        { label: 'Jan', value: 44 },
        { label: 'Feb', value: 52 },
        { label: 'Mar', value: 61 },
        { label: 'Apr', value: 58 },
        { label: 'May', value: 66 },
        { label: 'Jun', value: 54 },
        { label: 'Jul', value: 63 },
        { label: 'Aug', value: 69 },
        { label: 'Sep', value: 57 },
        { label: 'Oct', value: 62 },
        { label: 'Nov', value: 71 },
        { label: 'Dec', value: 74 },
      ];
  const bookingVolumeTrend = useMemo(
    () => rawBookingVolume.map((item) => ({
      label: item?.label || '',
      value: toSafeNumber(item?.bookings_count ?? item?.value)
    })),
    [rawBookingVolume]
  );
  const bookingChartConfig = useMemo(() => ({
    data: bookingVolumeTrend,
    xField: 'label',
    yField: 'value',
    smooth: true,
    autoFit: true,
    height: 320,
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
        name: 'Bookings',
        value: `${toSafeNumber(datum?.value)}`
      })
    },
    animation: false
  }), [bookingVolumeTrend, darkMode]);

  const topServicesRows = Array.isArray(dashboardPayload?.top_services) ? dashboardPayload.top_services : [];
  const maxServiceBookings = topServicesRows.reduce(
    (max, item) => Math.max(max, toSafeNumber(item?.bookings_count ?? item?.bookings)),
    0
  );
  const servicePerformance = topServicesRows.length > 0
    ? topServicesRows.map((service, index) => mapTopService(service, index, maxServiceBookings))
    : [
        { name: 'Deep Cleaning', bookings: 450, width: 84, tone: 'green', icon: <ToolOutlined /> },
        { name: 'Office Maintenance', bookings: 320, width: 64, tone: 'blue', icon: <ApartmentOutlined /> },
        { name: 'Window Washing', bookings: 280, width: 56, tone: 'amber', icon: <AppstoreOutlined /> },
      ];

  const latestReviewsRows = Array.isArray(dashboardPayload?.latest_reviews) ? dashboardPayload.latest_reviews : [];
  const latestReviews = latestReviewsRows.length > 0
    ? latestReviewsRows.map(mapLatestReview)
    : [
        {
          name: 'Monica Geller',
          time: '2 hours ago',
          text: 'The team did an absolutely amazing job with our kitchen. It has never looked this clean. Highly recommended.',
          rating: 5,
          tone: 'teal',
        },
        {
          name: 'Chandler Bing',
          time: '5 hours ago',
          text: 'Professional service and very punctual. Only minor issue was a missed spot behind the sofa, but otherwise great.',
          rating: 4,
          tone: 'gold',
        },
      ];

  return (
    <section className={`admin-dashboard-page ${darkMode ? 'dark-mode' : ''}`}>
      <div className="dashboard-header-row">
        <div>
          <h1 className="admin-page-title">{ta('Admin Dashboard')}</h1>
          <p className="admin-page-subtitle">{ta('View platform activity, bookings, and performance insights.')}</p>
        </div>

        <label className="dashboard-earnings-select">
          <span>{ta('Dashboard View')}</span>
          <Select
            value={dashboardView}
            onChange={setDashboardView}
            options={dashboardViewOptions.map((option) => ({
              value: option.value,
              label: ta(option.label)
            }))}
            popupMatchSelectWidth={false}
          />
        </label>
      </div>

      <div className="dashboard-kpi-grid">
        {kpiCards.map((card) => (
          <article key={card.title} className={`dashboard-kpi-card tone-${card.tone}`}>
            <div className="kpi-card-icon">{card.icon}</div>
            <p className="kpi-card-title">{card.title}</p>
            <h2 className="kpi-card-value">{card.value}</h2>
            <p className="kpi-card-subtitle">{card.subtitle}</p>
            {card.delta ? (
              <span className={`kpi-card-delta ${card.delta.startsWith('+') ? 'positive' : 'negative'}`}>
                <RiseOutlined />
                {card.delta}
              </span>
            ) : null}
          </article>
        ))}
      </div>

      <div className="dashboard-content-grid">
        <section className="dashboard-panel">
          <div className="panel-head">
            <h3>{ta('Recent Bookings')}</h3>
            <a href="/admin/bookings">{ta('View all')}</a>
          </div>
          <div className="table-scroll">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Cleaner</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.id}</td>
                    <td>
                      <div className="table-user-cell">
                        <span className="table-user-avatar">
                          {booking.customerAvatar ? (
                            <img src={booking.customerAvatar} alt={booking.customer} className="table-user-avatar-image" />
                          ) : (
                            <UserOutlined />
                          )}
                        </span>
                        <span>{booking.customer}</span>
                      </div>
                    </td>
                    <td>{booking.serviceName}</td>
                    <td>
                      <div className="table-user-cell">
                        <span className="table-user-avatar">
                          {booking.cleanerAvatar ? (
                            <img src={booking.cleanerAvatar} alt={booking.cleaner} className="table-user-avatar-image" />
                          ) : (
                            <UserOutlined />
                          )}
                        </span>
                        <span>{booking.cleaner}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-chip ${booking.status.toLowerCase().replace(' ', '-')}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td>{booking.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="panel-head">
            <h3>{ta('Top Cleaners')}</h3>
            <a href="/admin/cleaners">{ta('View all')}</a>
          </div>
          <div className="top-cleaners-list">
            {loading ? (
              <div className="cleaner-row">
                <div className="cleaner-identity">
                  <span>Loading top cleaners...</span>
                </div>
              </div>
            ) : topCleaners.length > 0 ? (
              topCleaners.map((cleaner) => (
                <div key={cleaner.id} className="cleaner-row">
                  <div className="cleaner-identity">
                    <div className="cleaner-avatar">
                      {cleaner.profileImage ? (
                        <img src={cleaner.profileImage} alt={cleaner.name} className="cleaner-avatar-img" />
                      ) : (
                        <UserOutlined />
                      )}
                    </div>
                    <div>
                      <p className="cleaner-name">{cleaner.name}</p>
                      <span>{Number(cleaner.totalJobs)} jobs completed</span>
                    </div>
                  </div>
                  <div className="cleaner-stats">
                    <span>{parseFloat(cleaner.rating).toFixed(1)} rating</span>
                    <span>{Number(cleaner.reviews)} reviews</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="cleaner-row">
                <div className="cleaner-identity">
                  <span>No top cleaners found</span>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
      
      <section className="dashboard-panel booking-volume-panel">
        <div className="panel-head booking-head">
          <div>
            <h3>{ta('Booking Performance')}</h3> 
            <p>{currentBookingVolumeMeta}</p>
          </div>
        </div>
        <div className="dashboard-chart-shell">
          <Line {...bookingChartConfig} />
          </div>
      </section>

      <div className="dashboard-insights-grid">
        <section className="dashboard-panel">
          <div className="panel-head">
            <h3>Top Services</h3>
            <a href="/admin/services">View all</a>
          </div>
          <div className="service-performance-list">
            {servicePerformance.map((item) => (
              <article key={item.name} className="service-performance-row">
                <div className={`service-icon tone-${item.tone}`}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="service-icon-image" />
                  ) : (
                    item.icon
                  )}
                </div>
                <div className="service-metrics">
                  <div className="service-meta">
                    <strong>{item.name}</strong>
                    <span>{item.bookings} {ta('Bookings')}</span>
                  </div>
                  <div className="service-bar">
                    <div className={`service-bar-fill tone-${item.tone}`} style={{ width: `${item.width}%` }} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="panel-head">
            <h3>{ta('Latest Reviews')}</h3>
            <a href="/admin/reviews">View all</a>
          </div>
          <div className="latest-review-list">
            {latestReviews.map((review) => (
              <article key={review.name} className="review-row">
                <header>
                  <div className="review-user">
                    <span className={`review-avatar tone-${review.tone}`}>
                      {review.avatar ? (
                        <img src={review.avatar} alt={review.name} className="review-avatar-image" />
                      ) : (
                        getInitials(review.name)
                      )}
                    </span>
                    <div>
                      <strong>{review.name}</strong>
                      <span>{review.time}</span>
                    </div>
                  </div>
                  <div className="review-stars">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <StarFilled key={index} className={index < review.rating ? 'active' : ''} />
                    ))}
                  </div>
                </header>
                <p>"{review.text}"</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
};

export default DashboardPage;
