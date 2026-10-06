# Current release verification

Recorded on 2026-10-06 using disposable local data. Historical deployment is a separate owner-provided fact.

## Passed locally

All 21 backend tests, TypeScript checking and frontend production build passed. Browser fixture analysis returned generated data and explicitly stated that no provider was contacted. Next.js was updated to 15.5.24 for confirmed security advisories; remaining dependency audit findings are recorded separately.

## Checks and commands

```sh
cd backend
npm ci
npm run typecheck
npm test -- --run
npm run dev
# Separate terminal:
cd frontend
npm ci
npm run dev
npm run build
```

## CI status

The configured GitHub Actions workflows are registered, but the initial runs ended with startup_failure before any jobs or check annotations were created. Local results above are independent of CI. No passing CI badge is shown; the service supplied no further diagnostic message through the available API.

## Remaining platform and coverage limits

The weighted score is heuristic and uncalibrated; no historical prediction accuracy or safe betting outcome is asserted. Paid provider calls were not used. Build-tool dependency audit findings remain; see the audit note.

PHP checks used PHP 8.4.26; Node builds used Node 24.19; Python checks used Python 3.12.10 where applicable. This record does not claim production hardening, paid provider verification or tests on every platform.
