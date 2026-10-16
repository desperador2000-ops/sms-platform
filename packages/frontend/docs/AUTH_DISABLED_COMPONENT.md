# Frontend: auth disabled banner component

This is a small React component you can integrate into your frontend to hide Login/Register links and show a site-wide banner while authentication is disabled.

Copy this file into your frontend app and render <AuthDisabledBanner /> near the top of your layout.

```tsx
// packages/frontend/src/components/AuthDisabledBanner.tsx
import React from 'react';

export default function AuthDisabledBanner() {
  const disabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === '1';
  if (!disabled) return null;
  return (
    <div style={{ background: '#fff3cd', color: '#856404', padding: '12px', textAlign: 'center' }}>
      Authentification temporairement désactivée — nous travaillons à une remise en service sécurisée.
    </div>
  );
}
```
