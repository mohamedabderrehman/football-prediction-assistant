# Synthetic demonstration

User asks about standings or a match → teams/league are resolved → provider data is assembled → features and heuristic score are calculated → AI explains the supplied evidence → response reports provider usage.

## Walkthrough

1. Start with deterministic fixtures and no paid provider keys.
2. Ask for a supported league table and a synthetic match analysis.
3. Submit invalid/missing team input and inspect rejection.
4. Exercise provider errors, malformed AI output and fallback metadata in checks.

## Acceptance checklist

- [ ] Type checking and existing Vitest checks
- [ ] Fixture standings and match analysis
- [ ] Actual-route rate limiting
- [ ] Fallback/provider metadata and output parser

## Evidence discipline

Screenshots must come from the running application with synthetic records. Record the component, viewport and configuration. A storyboard is not a recorded walkthrough. Benchmark only generated data and include hardware, input size, configuration, elapsed time and cache conditions.

No historical accuracy percentage. Live season access depends on provider plan. Redis URL is declared historically, but the shown clients use process-local Maps; do not claim Redis caching is integrated.
