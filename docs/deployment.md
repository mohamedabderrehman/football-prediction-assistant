# Deployment and troubleshooting

## Historical status

Football data and AI analysis application. A heuristic estimate is not a validated predictive model.

تطبيق بيانات كرة قدم وتحليل بالذكاء الاصطناعي. التقدير الاستدلالي ليس نموذج توقع مُثبتاً.

## Local release environment

Use fresh configuration, a disposable database/corpus and independently installed dependencies. This release never needs retired production services. Keep credentials, uploaded files, sessions, caches and signing material outside the public source. Credential removal does not revoke a provider key.

## Troubleshooting

### Keys required at startup

Set FIXTURE_MODE=1 for local demonstration, or supply both real keys privately.

### No current season data

Provider plans differ; the response can contain a documented fallback season.

### Unknown team

Use Demo United and Sample City in fixture mode; missing-data responses are expected.

### Frontend cannot reach backend

Set NEXT_PUBLIC_API_URL before starting/building Next.js.

## Current limits

No historical accuracy percentage. Live season access depends on provider plan. Redis URL is declared historically, but the shown clients use process-local Maps; do not claim Redis caching is integrated.

لا توجد نسبة دقة تاريخية موثقة. يعتمد الوصول للمواسم على خطة المزود. تستخدم العملاء Map محلية؛ وجود REDIS_URL لا يثبت تكامل Redis.
