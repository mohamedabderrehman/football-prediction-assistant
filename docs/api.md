# API and execution paths

This index is extracted from the current source. Router-local paths require their mount prefix from the server entry point. PHP endpoint paths map directly to files unless Apache rewrites them. Controllers and auth middleware are authoritative for request bodies and permissions.

| Method | Router-local path | Source |
|---|---|---|
| POST | `/` | `backend/src/routes/chat.ts` |
| GET | `/` | `backend/src/routes/health.ts` |
| GET | `/` | `backend/src/routes/leagues.ts` |

## Source entry points

- [backend/src/config/env.ts](../backend/src/config/env.ts)
- [backend/src/server.ts](../backend/src/server.ts)
- [backend/src/routes/chat.ts](../backend/src/routes/chat.ts)
- [backend/src/prediction/featureBuilder.ts](../backend/src/prediction/featureBuilder.ts)
- [backend/src/providers/apiFootball/client.ts](../backend/src/providers/apiFootball/client.ts)

## الاستخدام

المسارات المذكورة محلية للموجه وتحتاج بادئة الربط في الخادم. ملفات PHP هي مرجع المسارات ما لم تُعَد كتابتها. استخدم بيانات اصطناعية وفحوص الصلاحيات الموجودة في الشيفرة.


## Representative usage

Fixture mode permits evaluation without paid provider keys. Responses distinguish generated fixture evidence from real provider use; a heuristic score is not a validated probability. /chat and /leagues are rate-limited; /health is a status route.

```sh
curl http://localhost:3333/health
curl http://localhost:3333/leagues
curl -X POST http://localhost:3333/chat -H 'Content-Type: application/json' -d '{"query":"Demo United vs Sample City prediction"}' 
```
