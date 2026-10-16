#!/usr/bin/env ts-node
import 'reflect-metadata';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '../src/config/configuration';
import argon2 from 'argon2';

async function main() {
  // load and validate env early
  const cfg = ConfigService.loadAndValidate();
  const prisma = new PrismaClient();

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment to run the seed.');
    process.exit(2);
  }

  console.log('Seeding admin user...', adminEmail);

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log('Admin user already exists. Skipping creation.');
  } else {
    const passwordHash = await argon2.hash(adminPassword);
    const user = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        emailVerified: true,
        isAdmin: true,
        locale: process.env.DEFAULT_LOCALE ?? 'fr'
      }
    });
    console.log('Created admin user id=' + user.id);
  }

  // Providers: create Provider records for any provider with credentials in env
  const providersToCheck: { name: string; envKeys: Record<string, string | undefined> }[] = [
    {
      name: 'TWILIO',
      envKeys: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN
      }
    },
    {
      name: 'VONAGE',
      envKeys: {
        apiKey: process.env.VONAGE_API_KEY,
        apiSecret: process.env.VONAGE_API_SECRET
      }
    },
    {
      name: 'TELNYX',
      envKeys: {
        apiKey: process.env.TELNYX_API_KEY,
        messagingProfileId: process.env.TELNYX_MESSAGING_PROFILE_ID
      }
    },
    {
      name: 'AFRICASTALKING',
      envKeys: {
        username: process.env.AFRICASTALKING_USERNAME,
        apiKey: process.env.AFRICASTALKING_API_KEY
      }
    }
  ];

  for (const p of providersToCheck) {
    const anyKeyPresent = Object.values(p.envKeys).some((v) => v && v.length > 0);
    if (!anyKeyPresent) {
      console.log(`No credentials for provider ${p.name} found in env. Skipping provider record creation.`);
      continue;
    }

    const existingProvider = await prisma.provider.findFirst({ where: { name: p.name as any } });
    if (existingProvider) {
      console.log(`Provider ${p.name} already exists (id=${existingProvider.id}). Updating apiConfig.`);
      await prisma.provider.update({
        where: { id: existingProvider.id },
        data: { apiConfig: p.envKeys }
      });
      continue;
    }

    const prov = await prisma.provider.create({
      data: {
        name: p.name as any,
        apiConfig: p.envKeys
      }
    });
    console.log(`Created provider ${p.name} id=${prov.id}`);
  }

  // Optional: seed provider countries from env var PROVIDER_COUNTRY_SEED (JSON array)
  const providerCountrySeed = process.env.PROVIDER_COUNTRY_SEED;
  if (providerCountrySeed) {
    let parsed: any;
    try {
      parsed = JSON.parse(providerCountrySeed);
      if (!Array.isArray(parsed)) throw new Error('PROVIDER_COUNTRY_SEED must be a JSON array');
    } catch (err: any) {
      console.error('Failed to parse PROVIDER_COUNTRY_SEED:', err.message || err);
      process.exit(3);
    }

    for (const entry of parsed) {
      const { provider, countryCode, smsEnabled = true, available = true, pricePerMessage = 0 } = entry;
      if (!provider || !countryCode) {
        console.warn('Skipping provider-country entry missing provider or countryCode:', entry);
        continue;
      }
      const providerRow = await prisma.provider.findFirst({ where: { name: provider as any } });
      if (!providerRow) {
        console.warn(`Provider ${provider} not found, skipping ProviderCountry seed for ${countryCode}`);
        continue;
      }
      const existingPC = await prisma.providerCountry.findFirst({
        where: { providerId: providerRow.id, countryCode }
      });
      if (existingPC) {
        console.log(`ProviderCountry for ${provider}/${countryCode} already exists. Updating.`);
        await prisma.providerCountry.update({
          where: { id: existingPC.id },
          data: { smsEnabled, available, pricePerMessage: Number(pricePerMessage) }
        });
      } else {
        await prisma.providerCountry.create({
          data: { providerId: providerRow.id, countryCode, smsEnabled, available, pricePerMessage: Number(pricePerMessage) }
        });
        console.log(`Created ProviderCountry ${provider}/${countryCode}`);
      }
    }
  } else {
    console.log('No PROVIDER_COUNTRY_SEED provided — skipping ProviderCountry seeding.');
  }

  console.log('Seeding complete.');
  await prisma.$disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed', err);
  process.exit(1);
});
