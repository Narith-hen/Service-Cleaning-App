const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const messages = await prisma.message.findMany();
  console.log('Messages:', JSON.stringify(messages, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));

  const bookings = await prisma.booking.findMany();
  console.log('Bookings:', JSON.stringify(bookings, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
