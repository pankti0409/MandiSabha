# Mandi Sabha

A farmer-first interface for comparing mandi prices, transport, weather, and risk with a panel of AI agents.

## Local setup

```bash
pnpm install
pnpm dev
```

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_BASE_URL`. The current frontend is designed to support a demo mode while the FastAPI contract is wired in.

## Deployment

Import the project into Vercel, add the variables from `.env.example`, and deploy with the Next.js preset.

## Data and API notes

The planned API uses the typed REST and SSE contract described in the product brief. The API should allow the deployed Vercel origin in CORS, allow `Content-Type`, `Authorization`, `Last-Event-ID`, and `X-Request-ID` headers, and expose credentials only for the BFF cookie endpoints. OpenStreetMap tiles require visible attribution.

## Adding locales and agents

Keep locale dictionaries under `locales/` and update the language switcher without changing route semantics. Agent display metadata belongs in `lib/agents.ts`; backend `agent_registered` events can override the display fallback safely.

## Demo mode

Use `NEXT_PUBLIC_DEMO_MODE=true` to keep the UI available while the API is offline. Demo responses should use internally consistent crop, mandi, freight, and net-profit values.
