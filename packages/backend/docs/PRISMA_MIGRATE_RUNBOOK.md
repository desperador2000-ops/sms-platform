# Runbook: Apply Prisma migrations and seed (backend)

1) Ensure DATABASE_URL is set (pointing to your Render Postgres or local Postgres).
2) Install deps and generate client:

cd packages/backend
npm install
npx prisma generate

3) Apply migrations (production):

npx prisma migrate deploy

4) (Optional) Seed admin user (ensure ADMIN_EMAIL & ADMIN_PASSWORD env set):

ADMIN_EMAIL=admin@exemple.com ADMIN_PASSWORD='Secret123!' npm run seed

Notes:
- If your Render service cannot run `npx prisma migrate deploy` in the container, run it locally against the DATABASE_URL provided by Render.
- After migrations are applied, restart the backend service.
