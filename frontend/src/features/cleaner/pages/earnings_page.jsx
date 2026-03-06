import React from 'react';
import {
  WalletOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  BankOutlined,
  CreditCardOutlined
} from '@ant-design/icons';
import homeImage from '../../../assets/home.png';
import windowImage from '../../../assets/window.png';
import officeImage from '../../../assets/office.png';
import '../../../styles/cleaner/earnings.scss';

const transactions = [
  {
    id: 1,
    status: 'COMPLETED',
    statusType: 'completed',
    transactionId: '#TRN-8821',
    title: 'Full Apartment Deep Clean',
    subtitle: 'Payment received via Direct Deposit',
    amount: '+$180.00',
    amountType: 'positive',
    image: homeImage,
    meta: [
      { label: 'DATE', value: 'Oct 24, 2024', icon: <CalendarOutlined /> },
      { label: 'METHOD', value: 'Bank Transfer', icon: <CreditCardOutlined /> }
    ]
  },
  {
    id: 2,
    status: 'PENDING',
    statusType: 'pending',
    transactionId: '#TRN-8845',
    title: 'Standard Recurring Clean',
    subtitle: 'Processing for next payout cycle',
    amount: '+$95.00',
    amountType: 'default',
    image: windowImage,
    meta: [
      { label: 'PROCESSED ON', value: 'Today, 2:30 PM', icon: <ClockCircleOutlined /> },
      { label: 'METHOD', value: 'Digital Wallet', icon: <WalletOutlined /> }
    ]
  },
  {
    id: 3,
    status: 'COMPLETED',
    statusType: 'completed',
    transactionId: '#TRN-8790',
    title: 'Move-out Sanitation',
    subtitle: 'Payment received via Direct Deposit',
    amount: '+$240.00',
    amountType: 'positive',
    image: officeImage,
    meta: [
      { label: 'DATE', value: 'Oct 21, 2024', icon: <CalendarOutlined /> },
      { label: 'METHOD', value: 'Bank Transfer', icon: <BankOutlined /> }
    ]
  }
];

const EarningsPage = () => {
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
          <div className="summary-icon"><WalletOutlined /></div>
          <div className="summary-content">
            <div className="summary-label">AVAILABLE FOR PAYOUT</div>
            <strong>$515.00</strong>
            <p>Ready to withdraw</p>
          </div>
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
          <label>PAYMENT STATUS</label>
          <select defaultValue="all">
            <option value="all">All Payments</option>
          </select>
        </div>

        <div className="filter-item date-range">
          <label>DATE RANGE</label>
          <div className="date-inputs">
            <input type="text" placeholder="mm/dd/yyyy" />
            <span>to</span>
            <input type="text" placeholder="mm/dd/yyyy" />
          </div>
        </div>

        <button className="earnings-filter-btn" type="button" aria-label="filter">
          <svg className="earnings-filter-icon" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M2 4h12M4 8h8M6 12h4" />
          </svg>
        </button>
      </div>

      <div className="transactions-list">
        {transactions.map((item) => (
          <article className="transaction-card" key={item.id}>
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
      </div>
    </div>
  );
};

export default EarningsPage;
