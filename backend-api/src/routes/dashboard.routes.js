const express = require('express');
const { query } = require('express-validator');
const { 
  customer,
  cleaner,
  admin 
} = require('../controllers'); // Import from index.js
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Customer dashboard
router.get('/customer', authorize('customer'), customer.getCustomerDashboard);
router.get('/customer/bookings', authorize('customer'), customer.getCustomerBookings);
router.put('/customer/profile', authorize('customer'), customer.updateCustomerProfile);

// Cleaner dashboard
router.get('/cleaner', authorize('cleaner'), [
  query('period').optional().isIn(['day', 'week', 'month', 'year'])
], validate, cleaner.getCleanerDashboard);

router.get('/cleaner/jobs', authorize('cleaner'), cleaner.getCleanerJobs);
router.patch('/cleaner/jobs/:id/status', authorize('cleaner'), cleaner.updateJobStatus);
router.get('/cleaner/earnings', authorize('cleaner'), cleaner.getEarnings);
router.get('/cleaner/earnings/summary', authorize('cleaner'), cleaner.getEarningsSummary);

// Admin dashboard
router.get('/admin', authorize('admin'), admin.getAdminDashboard);
router.get('/admin/health', authorize('admin'), admin.getSystemHealth);

module.exports = router;