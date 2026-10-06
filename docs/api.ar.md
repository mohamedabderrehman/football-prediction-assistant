# الواجهات ومسارات التنفيذ

سؤال عن ترتيب أو مباراة ← تحديد الفرق والدوري ← تجميع بيانات المزود ← حساب الخصائص والنتيجة الاستدلالية ← تفسير الذكاء الاصطناعي للأدلة ← بيان استخدام المزود.

تحتاج المسارات المحلية للموجه إلى بادئة الخادم. تستخدم مسارات PHP الملفات الفعلية ما لم توجد إعادة كتابة. المتحكمات والوسطاء في الشيفرة مرجع الحقول والصلاحيات. فحوص tools/check-demo تمثل طلبات حقيقية ببيانات اصطناعية وليست مزوداً وهمياً.

## مراجع التنفيذ

- [backend/src/config/env.ts](../backend/src/config/env.ts)
- [backend/src/server.ts](../backend/src/server.ts)
- [backend/src/routes/chat.ts](../backend/src/routes/chat.ts)
- [backend/src/prediction/featureBuilder.ts](../backend/src/prediction/featureBuilder.ts)
- [backend/src/providers/apiFootball/client.ts](../backend/src/providers/apiFootball/client.ts)

## حدود التكامل

الدرجة الترجيحية تقريبية وغير معايرة؛ لا ندعي دقة تاريخية أو نتيجة رهان آمنة. لم نستخدم نداءات مزود مدفوعة. تبقى نتائج تدقيق اعتماديات أدوات البناء؛ راجع ملاحظة التدقيق.


## جرد المسارات

| الطريقة | المسار المحلي للموجه | الشيفرة |
|---|---|---|
| POST | `/` | `backend/src/routes/chat.ts` |
| GET | `/` | `backend/src/routes/health.ts` |
| GET | `/` | `backend/src/routes/leagues.ts` |

## مثال الاستخدام

يسمح وضع العينات بالتقييم دون مفاتيح مدفوعة. تفصل الردود بيانات العينات عن استخدام المزود؛ ليست الدرجة التقريبية احتمالاً مثبتاً. يخضع /chat و/leagues لحد الطلبات بينما /health للحالة.

```sh
curl http://localhost:3333/health
curl http://localhost:3333/leagues
curl -X POST http://localhost:3333/chat -H 'Content-Type: application/json' -d '{"query":"Demo United vs Sample City prediction"}' 
```
