# SMS Platform International

This repository contains a production-oriented SMS platform for international inbound SMS reception and management.

See docs/ for architecture, deployment, provider setup and KYC guidance.

Quick start:

1. Copy `.env.example` to `.env` and fill values.
2. `docker-compose up --build`
3. Apply Prisma migrations and run seed scripts in `packages/backend`.

See docs/DEPLOYMENT.md for full instructions.
