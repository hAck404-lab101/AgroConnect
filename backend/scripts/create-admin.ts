/**
 * One-off script to create an admin user.
 * Run from backend: npx tsx scripts/create-admin.ts
 * Uses ADMIN_EMAIL and ADMIN_PASSWORD from env, or defaults for local dev.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/bcrypt.util';

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@agroconnect.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) {
    if (existing.role === 'ADMIN') {
      console.log(`Admin already exists: ${ADMIN_EMAIL}`);
      return;
    }
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: 'ADMIN' },
    });
    console.log(`Updated user to ADMIN: ${ADMIN_EMAIL}`);
    return;
  }

  const hashed = await hashPassword(ADMIN_PASSWORD);
  await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      password: hashed,
      role: 'ADMIN',
      isVerified: true,
      profile: {
        create: { firstName: 'Admin', lastName: 'User' },
      },
    },
  });
  console.log(`Admin created: ${ADMIN_EMAIL}`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
  console.log('Log in at /login, then open /admin/dashboard.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
