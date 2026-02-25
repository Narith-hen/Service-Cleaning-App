const nodemailer = require('nodemailer');
const queueService = require('./queue.service');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendEmail(to, subject, html) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@samaeat.com',
        to,
        subject,
        html
      };

      // Queue email for workers to process
      await queueService.addJob('email', {
        type: 'send_email',
        data: mailOptions
      });

      return { queued: true, to, subject };
    } catch (error) {
      console.error('Error queueing email:', error);
      throw error;
    }
  }

  async sendBookingConfirmation(email, bookingDetails) {
    const subject = 'Booking Confirmation - Samaeat';
    const html = `
      <h1>Booking Confirmed!</h1>
      <p>Your booking has been confirmed with ID: #${bookingDetails.booking_id}</p>
      <p>Service: ${bookingDetails.service.name}</p>
      <p>Date: ${new Date(bookingDetails.booking_date).toLocaleDateString()}</p>
      <p>Total Price: $${bookingDetails.total_price}</p>
    `;

    return await this.sendEmail(email, subject, html);
  }

  async sendPasswordReset(email, resetToken) {
    const subject = 'Password Reset Request - Samaeat';
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const html = `
      <h1>Password Reset</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
    `;

    return await this.sendEmail(email, subject, html);
  }
}

module.exports = new EmailService();