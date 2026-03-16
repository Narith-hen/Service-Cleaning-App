<<<<<<< HEAD
// Run this script with: node create_test_booking.js
const prisma = require('./src/config/database');

async function createBooking() {
  console.log('🔄 Connecting to database...');

  try {
    // 1. Find a valid Service ID (we need at least one service in the DB)
    // We check for 'service_id' or 'id' depending on your schema naming
    const service = await prisma.service.findFirst();
    
    if (!service) {
      console.error('❌ Error: No services found in the database. Please create a service first.');
      return;
    }

    const serviceId = service.service_id || service.id;
    console.log(`✅ Found Service: ${service.name} (ID: ${serviceId})`);

    // 2. Create the Booking
    // We explicitly set User 3 (Customer) and User 11 (Cleaner)
    const newBooking = await prisma.booking.create({
      data: {
        user_id: 3,              // Customer ID
        cleaner_id: 11,          // Cleaner ID
        service_id: serviceId,
        booking_status: 'confirmed', // Must be confirmed for chat to usually work
        booking_date: new Date(new Date().setDate(new Date().getDate() + 1)), // Tomorrow
        booking_time: '09:00 AM',
        address: '123 Real Data Blvd, Phnom Penh',
        total_price: 50.00,
        payment_status: 'paid',
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    console.log('\n🎉 Booking Created Successfully!');
    console.log('-----------------------------------');
    console.log(`Booking ID:   ${newBooking.booking_id}`);
    console.log(`Status:       ${newBooking.booking_status}`);
    console.log('-----------------------------------');

  } catch (error) {
    console.error('❌ Failed to create booking:', error);
=======
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
>>>>>>> develop
  } finally {
    await prisma.$disconnect();
  }
}

<<<<<<< HEAD
createBooking();
=======
main().catch(e => {
  console.error(e);
  process.exit(1);
});
>>>>>>> develop
