// Base controllers
const authController = require('./base/auth.controller');
const baseBookingController = require('./base/booking.controller');
const paymentController = require('./base/payment.controller');
const notificationController = require('./base/notification.controller');
const reviewController = require('./base/review.controller');
const promotionController = require('./base/promotion.controller');

// Customer controllers
const customerDashboardController = require('./customer/dashboard.controller');

// Cleaner controllers
const cleanerDashboardController = require('./cleaner/dashboard.controller');
const earningsController = require('./cleaner/earnings.controller');

// Admin controllers
const adminUsersController = require('./admin/users.controller');
const adminServicesController = require('./admin/services.controller');
const adminBookingsController = require('./admin/bookings.controller');
const adminPromotionsController = require('./admin/promotions.controller');
const adminDashboardController = require('./admin/dashboard.controller');

// Combine all controllers for easy access
module.exports = {
  // Auth controllers
  ...authController,
  
  // Booking controllers
  ...baseBookingController,
  
  // Payment controllers
  ...paymentController,
  
  // Notification controllers
  ...notificationController,
  
  // Review controllers
  ...reviewController,
  
  // Promotion controllers
  ...promotionController,
  
  // Additional controller functions needed by routes
  getBookings: baseBookingController.getBookings,
  updateBooking: baseBookingController.updateBooking,
  deleteBooking: baseBookingController.deleteBooking,
  getBookingsByUser: baseBookingController.getBookingsByUser,
  getBookingsByCleaner: baseBookingController.getBookingsByCleaner,
  getBookingHistory: baseBookingController.getBookingHistory,
  
  // User controller functions
  updateProfile: (req, res, next) => {
    res.status(200).json({ message: 'Update profile endpoint - to be implemented' });
  },
  changePassword: (req, res, next) => {
    res.status(200).json({ message: 'Change password endpoint - to be implemented' });
  },
  uploadAvatar: (req, res, next) => {
    res.status(200).json({ message: 'Upload avatar endpoint - to be implemented' });
  },
  getUserSettings: (req, res, next) => {
    res.status(200).json({ message: 'Get user settings endpoint - to be implemented' });
  },
  updateSettings: (req, res, next) => {
    res.status(200).json({ message: 'Update settings endpoint - to be implemented' });
  },
  getUserBookings: (req, res, next) => {
    res.status(200).json({ message: 'Get user bookings endpoint - to be implemented' });
  },
  getUserReviews: (req, res, next) => {
    res.status(200).json({ message: 'Get user reviews endpoint - to be implemented' });
  },
  getCleaners: (req, res, next) => {
    res.status(200).json({ message: 'Get cleaners endpoint - to be implemented' });
  },
  getUsers: (req, res, next) => {
    res.status(200).json({ message: 'Get users endpoint - to be implemented' });
  },
  getUserById: (req, res, next) => {
    res.status(200).json({ message: 'Get user by ID endpoint - to be implemented' });
  },
  updateUser: (req, res, next) => {
    res.status(200).json({ message: 'Update user endpoint - to be implemented' });
  },
  deleteUser: (req, res, next) => {
    res.status(200).json({ message: 'Delete user endpoint - to be implemented' });
  },
  
  // Service controller functions
  getServices: (req, res, next) => {
    res.status(200).json({ message: 'Get services endpoint - to be implemented' });
  },
  getServiceById: (req, res, next) => {
    res.status(200).json({ message: 'Get service by ID endpoint - to be implemented' });
  },
  createService: (req, res, next) => {
    res.status(200).json({ message: 'Create service endpoint - to be implemented' });
  },
  updateService: (req, res, next) => {
    res.status(200).json({ message: 'Update service endpoint - to be implemented' });
  },
  deleteService: (req, res, next) => {
    res.status(200).json({ message: 'Delete service endpoint - to be implemented' });
  },
  uploadServiceImage: (req, res, next) => {
    res.status(200).json({ message: 'Upload service image endpoint - to be implemented' });
  },
  deleteServiceImage: (req, res, next) => {
    res.status(200).json({ message: 'Delete service image endpoint - to be implemented' });
  },
  getServiceReviews: (req, res, next) => {
    res.status(200).json({ message: 'Get service reviews endpoint - to be implemented' });
  },
  toggleServiceAvailability: (req, res, next) => {
    res.status(200).json({ message: 'Toggle service availability endpoint - to be implemented' });
  },
  getPopularServices: (req, res, next) => {
    res.status(200).json({ message: 'Get popular services endpoint - to be implemented' });
  },
  searchServices: (req, res, next) => {
    res.status(200).json({ message: 'Search services endpoint - to be implemented' });
  },
  
  // Additional review functions
  getReviewById: (req, res, next) => {
    res.status(200).json({ message: 'Get review by ID endpoint - to be implemented' });
  },
  updateReview: (req, res, next) => {
    res.status(200).json({ message: 'Update review endpoint - to be implemented' });
  },
  deleteReview: (req, res, next) => {
    res.status(200).json({ message: 'Delete review endpoint - to be implemented' });
  },
  getReviewsByUser: (req, res, next) => {
    res.status(200).json({ message: 'Get reviews by user endpoint - to be implemented' });
  },
  getReviewsByCleaner: (req, res, next) => {
    res.status(200).json({ message: 'Get reviews by cleaner endpoint - to be implemented' });
  },
  getReviewsByBooking: (req, res, next) => {
    res.status(200).json({ message: 'Get reviews by booking endpoint - to be implemented' });
  },
  markHelpful: (req, res, next) => {
    res.status(200).json({ message: 'Mark review helpful endpoint - to be implemented' });
  },
  reportReview: (req, res, next) => {
    res.status(200).json({ message: 'Report review endpoint - to be implemented' });
  },
  getReviewStats: (req, res, next) => {
    res.status(200).json({ message: 'Get review stats endpoint - to be implemented' });
  },
  
  // Additional payment functions
  getPayments: (req, res, next) => {
    res.status(200).json({ message: 'Get payments endpoint - to be implemented' });
  },
  refundPayment: (req, res, next) => {
    res.status(200).json({ message: 'Refund payment endpoint - to be implemented' });
  },
  verifyPayment: (req, res, next) => {
    res.status(200).json({ message: 'Verify payment endpoint - to be implemented' });
  },
  getUserPayments: (req, res, next) => {
    res.status(200).json({ message: 'Get user payments endpoint - to be implemented' });
  },
  getPaymentMethods: (req, res, next) => {
    res.status(200).json({ message: 'Get payment methods endpoint - to be implemented' });
  },
  addPaymentMethod: (req, res, next) => {
    res.status(200).json({ message: 'Add payment method endpoint - to be implemented' });
  },
  removePaymentMethod: (req, res, next) => {
    res.status(200).json({ message: 'Remove payment method endpoint - to be implemented' });
  },
  setDefaultPaymentMethod: (req, res, next) => {
    res.status(200).json({ message: 'Set default payment method endpoint - to be implemented' });
  },
  getPaymentHistory: (req, res, next) => {
    res.status(200).json({ message: 'Get payment history endpoint - to be implemented' });
  },
  
  // Additional notification functions
  getNotificationById: (req, res, next) => {
    res.status(200).json({ message: 'Get notification by ID endpoint - to be implemented' });
  },
  deleteNotification: (req, res, next) => {
    res.status(200).json({ message: 'Delete notification endpoint - to be implemented' });
  },
  getNotificationSettings: (req, res, next) => {
    res.status(200).json({ message: 'Get notification settings endpoint - to be implemented' });
  },
  updateNotificationSettings: (req, res, next) => {
    res.status(200).json({ message: 'Update notification settings endpoint - to be implemented' });
  },
  subscribeToTopic: (req, res, next) => {
    res.status(200).json({ message: 'Subscribe to topic endpoint - to be implemented' });
  },
  unsubscribeFromTopic: (req, res, next) => {
    res.status(200).json({ message: 'Unsubscribe from topic endpoint - to be implemented' });
  },
  sendNotification: (req, res, next) => {
    res.status(200).json({ message: 'Send notification endpoint - to be implemented' });
  },
  

  // Customer namespace
  customer: {
    getCustomerDashboard: customerDashboardController.getCustomerDashboard,
    getCustomerBookings: customerDashboardController.getCustomerBookings,
    updateCustomerProfile: customerDashboardController.updateCustomerProfile
  },
  
  // Cleaner namespace
  cleaner: {
    getCleanerDashboard: cleanerDashboardController.getCleanerDashboard,
    getCleanerJobs: cleanerDashboardController.getCleanerJobs,
    updateJobStatus: cleanerDashboardController.updateJobStatus,
    getEarnings: earningsController.getEarnings,
    getEarningsSummary: earningsController.getEarningsSummary
  },
  
  // Admin namespace
  admin: {
    getAllUsers: adminUsersController.getAllUsers,
    createUser: adminUsersController.createUser,
    updateUser: adminUsersController.updateUser,
    deleteUser: adminUsersController.deleteUser,
    
    getAllServices: adminServicesController.getAllServices,
    createService: adminServicesController.createService,
    updateService: adminServicesController.updateService,
    deleteService: adminServicesController.deleteService,
    
    getAllBookings: adminBookingsController.getAllBookings,
    assignCleaner: adminBookingsController.assignCleaner,
    getBookingStats: adminBookingsController.getBookingStats,
    
    getAllPromotions: adminPromotionsController.getAllPromotions,
    createPromotion: adminPromotionsController.createPromotion,
    updatePromotion: adminPromotionsController.updatePromotion,
    deletePromotion: adminPromotionsController.deletePromotion,
    
    getAdminDashboard: adminDashboardController.getAdminDashboard,
    getSystemHealth: adminDashboardController.getSystemHealth
  }
};