const db = require('./config/database');
const redis = require('./config/redis');

class PaymentWorker {
  constructor() {
    this.queueName = 'payment_queue';
    this.processing = false;
  }

  async start() {
    console.log('Payment worker started');
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
        console.error('Payment worker error:', error);
        await this.sleep(5000);
      }
    }
  }

  async processJob(job) {
    console.log(`Processing payment job: ${job.id}`);

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
      console.log(`Processing payment of $${amount} for booking #${bookingId}`);

      const paymentResult = {
        success: true,
        transactionId: `TXN-${Date.now()}`,
        timestamp: new Date().toISOString()
      };

      if (paymentResult.success) {
        const connection = await db.promise().getConnection();
        try {
          await connection.beginTransaction();
          await connection.query(
            'UPDATE bookings SET payment_status = ? WHERE booking_id = ?',
            ['paid', bookingId]
          );
          await connection.query(
            `
              INSERT INTO payments (amount, payment_method, payment_status, booking_id)
              VALUES (?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE
                amount = VALUES(amount),
                payment_method = VALUES(payment_method),
                payment_status = VALUES(payment_status)
            `,
            [amount, paymentMethod, 'completed', bookingId]
          );
          await connection.commit();
        } catch (transactionError) {
          await connection.rollback();
          throw transactionError;
        } finally {
          connection.release();
        }

        await redis.publish('notification:new', JSON.stringify({
          bookingId,
          title: 'Payment Successful',
          message: `Your payment of $${amount} has been processed`,
          type: 'payment'
        }));
      }
    } catch (error) {
      console.error('Payment processing failed:', error);

      await db.promise().query(
        'UPDATE bookings SET payment_status = ? WHERE booking_id = ?',
        ['failed', bookingId]
      );

      const attempts = Number(data.attempts || 0);
      if (attempts < 3) {
        await redis.lpush(this.queueName, JSON.stringify({
          id: `payment-retry-${Date.now()}`,
          data: {
            ...data,
            attempts: attempts + 1
          }
        }));
      }
    }
  }

  async processRefund(data) {
    const { bookingId } = data;
    const [rows] = await db.promise().query(
      `
        SELECT payment_id, amount
        FROM payments
        WHERE booking_id = ?
        LIMIT 1
      `,
      [bookingId]
    );

    const payment = rows?.[0];
    if (payment) {
      console.log(`Processing refund of $${payment.amount} for booking #${bookingId}`);

      await db.promise().query(
        'UPDATE payments SET payment_status = ? WHERE payment_id = ?',
        ['refunded', payment.payment_id]
      );

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
    console.log(`Verifying payment for transaction ${transactionId}`);

    await db.promise().query(
      'UPDATE bookings SET payment_status = ? WHERE booking_id = ?',
      ['verified', bookingId]
    );
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  stop() {
    this.processing = false;
    console.log('Payment worker stopped');
  }
}

if (require.main === module) {
  const worker = new PaymentWorker();
  worker.start().catch(console.error);
}

module.exports = PaymentWorker;
