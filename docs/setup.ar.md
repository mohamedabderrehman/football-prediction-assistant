# الإعداد الكامل

استخدم Node 20 أو أحدث. انسخ backend/.env.example إلى backend/.env وفعل FIXTURE_MODE=1 وPORT=3333. ضع NEXT_PUBLIC_API_URL=http://localhost:3333 في frontend/.env.local قبل التشغيل أو البناء. تستخدم العينات Demo United وSample City وتاريخاً ثابتاً. يحتاج الوضع الحي مفاتيح الرياضة والذكاء الاصطناعي في مثال الخادم ولا يحتاج التقييم نداءات مدفوعة.

## الأوامر

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

## جرد الإعداد

| المتغير | موضع الاستخدام | قاعدة الإعداد |
|---|---|---|
| `API_FOOTBALL_KEY` | `backend/src/config/env.ts` | استخدم المثال المحلي أو افتراضي الشيفرة واضبطه للبيئة المؤقتة. |
| `CACHE_TTL_SECONDS` | `backend/src/config/env.ts` | استخدم المثال المحلي أو افتراضي الشيفرة واضبطه للبيئة المؤقتة. |
| `CORS_ORIGINS` | `backend/src/config/env.ts` | استخدم المثال المحلي أو افتراضي الشيفرة واضبطه للبيئة المؤقتة. |
| `FIXTURE_MODE` | `backend/src/config/env.ts` | استخدم المثال المحلي أو افتراضي الشيفرة واضبطه للبيئة المؤقتة. |
| `GROK_API_KEY` | `backend/src/config/env.ts` | قدم القيمة بصورة خاصة عند تفعيل التكامل، دون سر افتراضي. |
| `GROK_MODEL` | `backend/src/config/env.ts` | استخدم المثال المحلي أو افتراضي الشيفرة واضبطه للبيئة المؤقتة. |
| `NEXT_PUBLIC_API_URL` | `frontend/next.config.js` | استخدم المثال المحلي أو افتراضي الشيفرة واضبطه للبيئة المؤقتة. |
| `NODE_ENV` | `backend/src/config/env.ts` | استخدم المثال المحلي أو افتراضي الشيفرة واضبطه للبيئة المؤقتة. |
| `PORT` | `backend/src/config/env.ts` | استخدم المثال المحلي أو افتراضي الشيفرة واضبطه للبيئة المؤقتة. |
| `RATE_LIMIT_MAX_REQUESTS` | `backend/src/config/env.ts` | استخدم المثال المحلي أو افتراضي الشيفرة واضبطه للبيئة المؤقتة. |
| `RATE_LIMIT_WINDOW_MS` | `backend/src/config/env.ts` | استخدم المثال المحلي أو افتراضي الشيفرة واضبطه للبيئة المؤقتة. |
| `REDIS_URL` | `backend/src/config/env.ts` | استخدم المثال المحلي أو افتراضي الشيفرة واضبطه للبيئة المؤقتة. |

ليست كل متغيرات الجرد إلزامية. تحدد الفقرة الأولى قيم التشغيل الأساسية، وتلزم قيم المزود للتكامل الحي المفعل فقط. تتجاوز DEMO_API_URL هدف الفحص المحلي عند دعمه. لا توجه أوامر التعبئة والاستعادة والفحص لقاعدة إنتاج. لا تُحمّل أمثلة البيئة نفسها تلقائياً؛ جهز بيئة العملية أو dotenv حيث يستخدمه المكون.

## المكونات

| المكون | المسؤولية |
|---|---|
| `backend/src/providers/` | عملاء بيانات الرياضة وتفسير الذكاء الاصطناعي |
| `backend/src/prediction/` | بناء الخصائص والحساب الترجيحي |
| `backend/src/routes/` | مسارات الدردشة والدوريات والصحة |
| `backend/tests/` | فحوص المسارات والحساب الموجودة |
| `frontend/` | واجهة Next.js |
