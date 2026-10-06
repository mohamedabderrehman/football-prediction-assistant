# Clean setup

Use Node 20+. Copy backend/.env.example to backend/.env and enable FIXTURE_MODE=1, PORT=3333. Put NEXT_PUBLIC_API_URL=http://localhost:3333 in frontend/.env.local before startup/build. Fixture analysis uses Demo United and Sample City and a fixed timestamp. Live mode requires the sports and AI keys from the backend example; paid calls are unnecessary for evaluation.

## Commands

```sh
cd backend
npm ci
npm run typecheck
npm test -- --run
npm run dev
# Separate terminal:
cd ../frontend
npm ci
npm run dev
npm run build
```

## Complete configuration inventory

Use Node 20+ and npm. Install independently in `backend/` and `frontend/`. Backend environment lives in `backend/.env`; frontend public API URL lives in `frontend/.env.local`. Run `npm run dev` in each component. Use fixture mode for demonstration and checks; real provider credentials are optional only when fixture mode is enabled. Run backend `npm run typecheck`, `npm test -- --run` and `npm run build`.

## Environment variables read by source

| Variable | Source consumer | Configuration rule |
|---|---|---|
| `API_FOOTBALL_KEY` | `backend/src/config/env.ts` | Use the local example/source default; adapt to your disposable environment. |
| `CACHE_TTL_SECONDS` | `backend/src/config/env.ts` | Use the local example/source default; adapt to your disposable environment. |
| `CORS_ORIGINS` | `backend/src/config/env.ts` | Use the local example/source default; adapt to your disposable environment. |
| `FIXTURE_MODE` | `backend/src/config/env.ts` | Use the local example/source default; adapt to your disposable environment. |
| `GROK_API_KEY` | `backend/src/config/env.ts` | Supply privately when enabling its integration; no secret default. |
| `GROK_MODEL` | `backend/src/config/env.ts` | Use the local example/source default; adapt to your disposable environment. |
| `NEXT_PUBLIC_API_URL` | `frontend/next.config.js` | Use the local example/source default; adapt to your disposable environment. |
| `NODE_ENV` | `backend/src/config/env.ts` | Use the local example/source default; adapt to your disposable environment. |
| `PORT` | `backend/src/config/env.ts` | Use the local example/source default; adapt to your disposable environment. |
| `RATE_LIMIT_MAX_REQUESTS` | `backend/src/config/env.ts` | Use the local example/source default; adapt to your disposable environment. |
| `RATE_LIMIT_WINDOW_MS` | `backend/src/config/env.ts` | Use the local example/source default; adapt to your disposable environment. |
| `REDIS_URL` | `backend/src/config/env.ts` | Use the local example/source default; adapt to your disposable environment. |

Environment examples do not load themselves. Node dotenv modules read local `.env` where configured; PHP uses its process/hosting environment. Keep provider integrations disconnected for demos. Generate a new secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` or equivalent, then store it privately.

## Declared component commands

### `backend/package.json`

```json
{
  "dev": "tsx watch src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "test": "vitest",
  "lint": "eslint src/**/*.ts",
  "typecheck": "tsc --noEmit"
}
```

### `frontend/package.json`

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit"
}
```

## Source boundaries

| Component | Responsibility |
|---|---|
| `backend/src/providers/` | Sports and AI provider clients |
| `backend/src/prediction/` | Features and scoring |
| `backend/src/routes/` | Chat, leagues and health |
| `backend/tests/` | Existing route/scoring checks |
| `frontend/` | Next.js interface |


Variables in the inventory are not all mandatory: the preceding prerequisites identify the required core values. Provider variables are required only for their enabled live integration. Tests may use DEMO_API_URL to override the local target. Never point bootstrap/reset/check scripts at a production database.
