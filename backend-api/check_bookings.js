const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bookings = await prisma.booking.findMany();
  console.log('Bookings:', JSON.stringify(bookings, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));
  
  const messages = await prisma.message.findMany();
  console.log('Messages:', JSON.stringify(messages, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));

  // If there are bookings, let's update the existing messages to use the first valid booking ID
  if (bookings.length > 0 && messages.some(m => !m.booking_id)) {
    console.log("Updating messages to have booking_id:", bookings[0].booking_id);
    await prisma.message.updateMany({
      where: { booking_id: null },
      data: { booking_id: bookings[0].booking_id, service_id: bookings[0].service_id }
    });
  }
}


main().catch(console.error).finally(() => prisma.$disconnect());
