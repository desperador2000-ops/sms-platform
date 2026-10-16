#!/usr/bin/env ts-node
import 'reflect-metadata';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '../src/config/configuration';
import crypto from 'crypto';

async function main() {
  ConfigService.loadAndValidate();
  const prisma = new PrismaClient();

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.error('ADMIN_EMAIL must be set in the environment to create the admin API key.');
    process.exit(2);
  }

  const user = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!user) {
    console.error(`Admin user ${adminEmail} not found. Run seed to create admin first.`);
    process.exit(3);
  }

  const apiKey = crypto.randomBytes(32).toString('hex');
  const record = await prisma.apiKey.create({
    data: {
      userId: user.id,
      key: apiKey,
      description: 'admin seed key'
    }
  });

  console.log('Admin API key created:');
  console.log('ID:', record.id);
  console.log('KEY (store it now, it will not be shown again):', apiKey);
  await prisma.$disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to create admin api key', err);
  process.exit(1);
});
