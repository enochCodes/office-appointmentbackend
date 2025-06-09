import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client
// Add log level for development debugging if needed
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

export default prisma;
