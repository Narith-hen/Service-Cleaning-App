const BookingWorker = require('./bookingWorker');
const NotificationWorker = require('./notificationWorker');
const PaymentWorker = require('./paymentWorker');
const AnalyticsWorker = require('./analyticsWorker');

class WorkerManager {
  constructor() {
    this.workers = {
      booking: new BookingWorker(),
      notification: new NotificationWorker(),
      payment: new PaymentWorker(),
      analytics: new AnalyticsWorker()
    };
  }

  async startAll() {
    console.log('🚀 Starting all workers...');
    
    const promises = Object.values(this.workers).map(worker => 
      worker.start().catch(error => {
        console.error('Worker failed to start:', error);
      })
    );

    await Promise.all(promises);
    console.log('✅ All workers started');
  }

  async stopAll() {
    console.log('🛑 Stopping all workers...');
    
    Object.values(this.workers).forEach(worker => {
      if (worker.stop) worker.stop();
    });
    
    console.log('✅ All workers stopped');
  }
}

// Start all workers if run directly
if (require.main === module) {
  const manager = new WorkerManager();
  
  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    await manager.stopAll();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await manager.stopAll();
    process.exit(0);
  });

  manager.startAll().catch(console.error);
}

module.exports = WorkerManager;