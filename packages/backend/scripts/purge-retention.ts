#!/usr/bin/env ts-node
import 'reflect-metadata';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '../src/config/configuration';

async function main() {
  ConfigService.loadAndValidate();
  const prisma = new PrismaClient();
  try {
    const defaultRetentionDays = Number(process.env.DEFAULT_RETENTION_DAYS ?? 30);
    console.log('Running retention purge for users deleted before:', defaultRetentionDays, 'days');
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - defaultRetentionDays);

    const users = await prisma.user.findMany({
      where: {
        deletedAt: { not: null },
        updatedAt: { lt: cutoff }
      }
    });

    console.log('Users to purge:', users.length);
    for (const u of users) {
      await prisma.user.delete({ where: { id: u.id } });
      await prisma.auditLog.create({
        data: { userId: u.id, action: 'privacy.retention_purge', meta: { retentionDays: defaultRetentionDays } }
      });
      console.log('Purged user', u.id);
    }
  } catch (err) {
    console.error('Retention purge failed', err);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
