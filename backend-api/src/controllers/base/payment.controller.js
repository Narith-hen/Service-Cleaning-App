const prisma = require('../../config/database');
const AppError = require('../../utils/error.util');

const createPayment = async (req, res, next) => {
  try {
    const { booking_id, amount, payment_method } = req.body;

    const payment = await prisma.payment.create({
      data: {
        amount: parseFloat(amount),
        payment_method,
        payment_status: 'pending',
        booking_id: parseInt(booking_id)
      },
      include: {
        booking: true
      }
    });

    res.status(201).json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

const processPayment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { payment_id: parseInt(id) },
      include: { booking: true }
    });

    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }

    const updatedPayment = await prisma.payment.update({
      where: { payment_id: parseInt(id) },
      data: { payment_status: 'completed' }
    });

    await prisma.booking.update({
      where: { booking_id: payment.booking_id },
      data: { payment_status: 'paid' }
    });

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      data: updatedPayment
    });
  } catch (error) {
    next(error);
  }
};

const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { payment_id: parseInt(id) },
      include: {
        booking: {
          include: {
            user: true,
            service: true
          }
        }
      }
    });

    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPayment,
  processPayment,
  getPaymentById
};