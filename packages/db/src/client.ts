import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env['NODE_ENV'] === 'production') {
  prisma = new PrismaClient({
    log: ['error'],
  });
} else {
  if (!globalThis.__prisma) {
    globalThis.__prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  }
  prisma = globalThis.__prisma;
}

export { prisma };
export type { PrismaClient };
export * from '@prisma/client';
