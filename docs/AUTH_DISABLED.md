# Authentication temporarily disabled

This repository has been updated to temporarily disable authentication endpoints while we fix the signup/OTP issues.

What changed:
- packages/backend/src/auth/auth.controller.ts now returns 503 Service Unavailable for:
  - POST /auth/send-otp
  - POST /auth/register
  - POST /auth/login

Why:
- To prevent further erroneous signups / OTP flows while we debug and stabilize the authentication system.

To re-enable authentication later:
- Restore or update packages/backend/src/auth/auth.controller.ts with the real logic.
- Re-deploy the backend service.
