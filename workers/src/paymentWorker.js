const prisma = require('./config/database');
const redis = require('./config/redis');

class PaymentWorker {
  constructor() {
    this.queueName = 'payment_queue';
    this.processing = false;
  }

  async start() {
    console.log('🚀 Payment worker started');
    this.processing = true;
    
    while (this.processing) {
      try {
        const jobString = await redis.rpop(this.queueName);
        
        if (jobString) {
          const job = JSON.parse(jobString);
          await this.processJob(job);
        } else {
          await this.sleep(1000);
        }
      } catch (error) {
        console.error('❌ Payment worker error:', error);
        await this.sleep(5000);
      }
    }
  }

  async processJob(job) {
    console.log(`📦 Processing payment job: ${job.id}`);

    switch (job.data.type) {
      case 'process_payment':
        await this.processPayment(job.data);
        break;
      case 'process_refund':
        await this.processRefund(job.data);
        break;
      case 'verify_payment':
        await this.verifyPayment(job.data);
        break;
      default:
        console.log(`Unknown job type: ${job.data.type}`);
    }
  }

  async processPayment(data) {
    const { bookingId, amount, paymentMethod } = data;
    
    try {
      // Simulate payment processing
      console.log(`Processing payment of $${amount} for booking #${bookingId}`);
      
      // Here you would integrate with actual payment gateway
      const paymentResult = {
        success: true,
        transactionId: `TXN-${Date.now()}`,
        timestamp: new Date().toISOString()
      };

      if (paymentResult.success) {
        // Update booking and payment status
        await prisma.$transaction([
          prisma.booking.update({
            where: { booking_id: bookingId },
            data: { payment_status: 'paid' }
          }),
          prisma.payment.create({
            data: {
              amount,
              payment_method: paymentMethod,
              payment_status: 'completed',
              booking_id: bookingId
            }
          })
        ]);

        // Send confirmation
        await redis.publish('notification:new', JSON.stringify({
          bookingId,
          title: 'Payment Successful',
          message: `Your payment of $${amount} has been processed`,
          type: 'payment'
        }));
      }
    } catch (error) {
      console.error('Payment processing failed:', error);
      
      // Handle failed payment
      await prisma.booking.update({
        where: { booking_id: bookingId },
        data: { payment_status: 'failed' }
      });

      // Re-queue for retry
      if (data.attempts < 3) {
        data.attempts = (data.attempts || 0) + 1;
        await redis.lpush(this.queueName, JSON.stringify({
          id: `payment-retry-${Date.now()}`,
          data
        }));
      }
    }
  }

  async processRefund(data) {
    const { bookingId } = data;
    
    const payment = await prisma.payment.findUnique({
      where: { booking_id: bookingId }
    });

    if (payment) {
      console.log(`Processing refund of $${payment.amount} for booking #${bookingId}`);
      
      // Process refund with payment gateway
      // Update payment status
      await prisma.payment.update({
        where: { payment_id: payment.payment_id },
        data: { payment_status: 'refunded' }
      });

      await redis.publish('notification:new', JSON.stringify({
        bookingId,
        title: 'Refund Processed',
        message: `Your refund of $${payment.amount} has been processed`,
        type: 'payment'
      }));
    }
  }

  async verifyPayment(data) {
    const { transactionId, bookingId } = data;
    
    // Verify payment with gateway
    console.log(`Verifying payment for transaction ${transactionId}`);
    
    // Update verification status
    await prisma.booking.update({
      where: { booking_id: bookingId },
      data: { payment_status: 'verified' }
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    this.processing = false;
    console.log('🛑 Payment worker stopped');
  }
}

// Start worker if run directly
if (require.main === module) {
  const worker = new PaymentWorker();
  worker.start().catch(console.error);
}

module.exports = PaymentWorker;