const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const messages = await prisma.message.findMany({
      where: { booking_id: 1 },
      orderBy: { created_at: 'asc' },
      include: {
        sender: {
          select: {
            user_id: true,
            username: true,
            email: true,
            role: { select: { role_name: true } }
          }
        },
        receiver: {
          select: {
            user_id: true,
            username: true,
            email: true,
            role: { select: { role_name: true } }
          }
        }
      }
    });
    console.log('API representation of messages:', JSON.stringify(messages, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));
  } catch (err) {
    console.error('Prisma Error:', err.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
