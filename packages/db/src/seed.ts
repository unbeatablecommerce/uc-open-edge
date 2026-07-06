/**
 * Database seed script.
 *
 * Run with: pnpm db:seed
 *
 * Requires ADMIN_EMAIL and ADMIN_PASSWORD environment variables.
 * If they are not set, the script will print setup instructions and exit
 * without creating any data. There are NO insecure default credentials.
 */
import { PrismaClient } from '@prisma/client';
import { hash } from '@node-rs/argon2';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env['ADMIN_EMAIL'];
  const adminPassword = process.env['ADMIN_PASSWORD'];

  if (!adminEmail || !adminPassword) {
    console.error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UC Open Edge — Admin Setup Required
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To create the initial admin user, set the following
environment variables before running this script:

  ADMIN_EMAIL=your@email.local
  ADMIN_PASSWORD=your-secure-password-here

Password requirements:
  - Minimum 12 characters
  - Use a strong, unique password

Example (copy .env.example to .env and edit it):
  cp .env.example .env
  # Edit .env and set ADMIN_EMAIL and ADMIN_PASSWORD
  pnpm db:seed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
    process.exit(1);
  }

  if (adminPassword.length < 12) {
    console.error('ADMIN_PASSWORD must be at least 12 characters.');
    process.exit(1);
  }

  console.log(`Seeding admin user: ${adminEmail}`);

  const passwordHash = await hash(adminPassword, {
    memoryCost: 65536,
    timeCost: 3,
    outputLen: 32,
    parallelism: 1,
  });

  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: 'admin',
      active: true,
    },
    create: {
      email: adminEmail,
      name: 'Administrator',
      passwordHash,
      role: 'admin',
      active: true,
    },
  });

  console.log(`Admin user created/updated: ${user.id} (${user.email})`);

  // Seed default app settings
  const defaultSettings = [
    { key: 'site.name', value: 'UC Open Edge' },
    { key: 'site.timezone', value: 'UTC' },
    { key: 'delivery.maxRetries', value: 5 },
    { key: 'delivery.initialDelayMs', value: 5000 },
    { key: 'delivery.maxDelayMs', value: 300000 },
  ];

  for (const s of defaultSettings) {
    await prisma.appSetting.upsert({
      where: { key: s.key },
      update: {},
      create: { key: s.key, value: s.value },
    });
  }

  console.log('Default app settings seeded.');
  console.log('\n✓ Seed complete. You can now log in at the admin UI.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
