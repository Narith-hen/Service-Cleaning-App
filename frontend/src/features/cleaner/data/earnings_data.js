import homeImage from '../../../assets/home.png';
import windowImage from '../../../assets/window.png';
import officeImage from '../../../assets/office.png';

export const cleanerTransactions = [
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
  }
];

export const cleanerMonthlyEarningsData = [
  { month: 'Apr', earnings: 320 },
  { month: 'May', earnings: 450 },
  { month: 'Jun', earnings: 380 },
  { month: 'Jul', earnings: 520 },
  { month: 'Aug', earnings: 480 },
  { month: 'Sep', earnings: 610 },
  { month: 'Oct', earnings: 515 }
];

export const parseMoneyAmount = (value) => Number(String(value).replace(/[^0-9.-]/g, '')) || 0;

export const formatMoney = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value || 0);

export const cleanerEarningsSummary = cleanerTransactions.reduce(
  (summary, transaction) => {
    const amount = parseMoneyAmount(transaction.amount);
    summary.total += amount;
    if (transaction.status === 'COMPLETED') {
      summary.completed += amount;
    }
    if (transaction.status === 'PENDING') {
      summary.pending += amount;
    }
    return summary;
  },
  {
    total: 0,
    completed: 0,
    pending: 0
  }
);
