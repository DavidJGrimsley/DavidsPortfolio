# DJ's Portfolio

Expo Router portfolio app for web/mobile with public API docs, project showcases, and Quantum API self-serve authentication tooling.

## Current Status

- Quantum API dashboard supports Supabase-authenticated key lifecycle:
  - list keys
  - create key (one-time reveal)
  - rotate key
  - revoke key
  - delete revoked keys
- IBM Credentials section supports BYO profile management through Quantum API bearer endpoints:
  - list/create/edit/delete profile
  - verify profile
  - set default profile
- Quantum animation supports simulator mode and IBM hardware mode through Quantum API runtime endpoints.
- Simulator usage remains available without IBM credentials.

## Tech Stack

- Expo Router
- React Native + React Native Web
- TypeScript
- Supabase Auth (browser client)
- Jest + jest-expo
- Uniwind/Tailwind utility styling

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create local env file (`.env`) with at least:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_QUANTUM_API_BASE_URL=https://davidjgrimsley.com/public-facing/api/quantum/v1
EXPO_PUBLIC_QUANTUM_API_KEY=...
```

3. Start the app:

```bash
npm run web
```

## Useful Commands

```bash
npm run lint
npx tsc --noEmit
npm test -- --runInBand
```

## Notes

- IBM secrets are not written directly from frontend to Supabase.
- IBM profile CRUD uses Quantum API bearer-authenticated endpoints.
- Hardware jobs use API-key-authenticated Quantum API runtime endpoints.
