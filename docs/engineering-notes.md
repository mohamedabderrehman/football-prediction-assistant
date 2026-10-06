## Turning structured football data into an explainable estimate

The TypeScript backend extracts teams, requests standings, handles season fallback and builds features before producing a weighted estimate and optional AI explanation. Separating the score from the explanation makes an important boundary visible: fluent language does not validate the estimate. A historical evaluation is still required before claiming prediction accuracy.

Provider caching, retries and response parsing influence how complete and fresh the inputs are. The release records fixture/provider use accurately and offers deterministic generated teams, so an evaluator can reproduce a standings or match-analysis response without paid API calls or current live fixtures.

## Configuration and middleware must match the real execution paths

Environment loading now runs before validation. Rate limiting covers the actual /chat, /leagues and /health routes rather than an unused /api prefix. These are small changes with practical effects: correct credentials should be read at startup, and the intended middleware should protect the routes the application mounts.

All 21 backend tests, type checking and the frontend production build passed locally. A focused Next.js update addresses confirmed advisories; remaining build-tool dependency findings are documented rather than erased through an unreviewed major styling migration. Provider outages, ambiguous inputs and malformed explanations remain explicit verification concerns.
