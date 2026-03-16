const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function main() {
  const prisma = new PrismaClient();

  try {
    // Create test customer
    const hashedPassword = await bcrypt.hash('password123', 10);
    const customer = await prisma.user.upsert({
      where: { email: 'test-customer@example.com' },
      update: {},
      create: {
        username: 'test-customer',
        email: 'test-customer@example.com',
        password: hashedPassword,
        phone_number: '+85512345678',
        role_id: 2, // assume customer role_id = 2
      },
    });

    // Test cleaner (narith)
    const cleanerHashed = await bcrypt.hash('password123', 10);
    const cleaner = await prisma.user.upsert({
      where: { username: 'narith-hen' },
      update: {},
      create: {
        username: 'narith-hen',
        email: 'narith@example.com',
        password: cleanerHashed,
        phone_number: '+85598765432',
        role_id: 3, // assume cleaner role_id = 3
      },
    });

    // Service
    const service = await prisma.service.upsert({
      where: { name: 'Deep House Cleaning' },
      update: {},
      create: {
        name: 'Deep House Cleaning',
        price: 50.0,
        description: 'Complete deep clean',
      },
    });

    // Booking
    const booking = await prisma.booking.upsert({
      where: { booking_id: 1 },
      update: {},
      create: {
        booking_id: 1,
        booking_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Schedule for tomorrow
        booking_status: 'confirmed',
        total_price: 50.0,
        payment_status: 'paid',
        user_id: customer.user_id,
        cleaner_id: cleaner.user_id,
        service_id: service.service_id,
      },
    });

// Messages - Fixed escape chars
    await prisma.message.createMany({
      data: [
        {
          booking_id: booking.booking_id,
          sender_id: cleaner.user_id,
          receiver_id: customer.user_id,
          message: "Hi! I've accepted your cleaning request for tomorrow. I'll be arriving around 9 AM.",
        },
        {
          booking_id: booking.booking_id,
          sender_id: customer.user_id,
          receiver_id: cleaner.user_id,
          message: "Great! Looking forward to it.",
        },
        {
          booking_id: booking.booking_id,
          sender_id: cleaner.user_id,
          receiver_id: customer.user_id,
          message: "See you tomorrow!",
        },
      ],
    });

    console.log('✅ Test data created!');
    console.log('Customer:', customer.username, customer.user_id);
    console.log('Cleaner:', cleaner.username, cleaner.user_id);
    console.log('Booking ID:', booking.booking_id);
    console.log('Login: email test-customer@example.com / password123');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
