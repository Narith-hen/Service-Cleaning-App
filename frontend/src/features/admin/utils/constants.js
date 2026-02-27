export const USER_ROLES = {
  ADMIN: 'admin',
  CLEANER: 'cleaner',
  CUSTOMER: 'customer'
};

export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  SUSPENDED: 'suspended'
};

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show'
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

export const SERVICE_TYPES = {
  REGULAR: 'regular-maintenance',
  DEEP_CLEANING: 'deep-cleaning',
  MOVE_OUT: 'move-out',
  MOVE_IN: 'move-in',
  WINDOW: 'window-cleaning',
  CARPET: 'carpet-cleaning',
  POST_CONSTRUCTION: 'post-construction'
};

export const DATE_RANGES = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  THIS_WEEK: 'this-week',
  LAST_WEEK: 'last-week',
  THIS_MONTH: 'this-month',
  LAST_MONTH: 'last-month',
  THIS_YEAR: 'this-year',
  CUSTOM: 'custom'
};

export const CHART_COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#8b5cf6',
  gray: '#6b7280'
};

export const TABLE_COLUMNS = {
  USERS: [
    { key: 'name', title: 'Name' },
    { key: 'email', title: 'Email' },
    { key: 'role', title: 'Role' },
    { key: 'status', title: 'Status' },
    { key: 'joinedDate', title: 'Joined' },
    { key: 'actions', title: 'Actions' }
  ],
  BOOKINGS: [
    { key: 'id', title: 'Booking ID' },
    { key: 'customer', title: 'Customer' },
    { key: 'service', title: 'Service' },
    { key: 'date', title: 'Date' },
    { key: 'amount', title: 'Amount' },
    { key: 'status', title: 'Status' }
  ]
};