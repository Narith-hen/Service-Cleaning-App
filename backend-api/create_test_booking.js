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
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
