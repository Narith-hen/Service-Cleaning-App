const { PrismaClient } = require('@prisma/client');
const { getResolvedDatabaseUrl } = require('./db-options');

const resolvedDatabaseUrl = getResolvedDatabaseUrl();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: resolvedDatabaseUrl
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

module.exports = prisma;
