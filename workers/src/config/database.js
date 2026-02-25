const path = require('path');
const backendPrismaPath = path.join(__dirname, '../../../backend-api/node_modules/@prisma/client');
const { PrismaClient } = require(backendPrismaPath);

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
});

module.exports = prisma;