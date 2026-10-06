# Dependency audit

Recorded 2026-10-06 after a successful Next.js 15.5.27 production build. Production dependency audit counts: `{"info": 0, "low": 0, "moderate": 0, "high": 5, "critical": 0, "total": 5}`.

Remaining advisory chains involve braces, micromatch, fast-glob, chokidar and Tailwind CSS build tooling. The suggested fix requires a Tailwind major migration; that migration was not applied without an interface regression review. Source-controlled pattern configuration is used in the demonstration. This is not an assertion that the dependency graph is vulnerability-free.

PostCSS and selector-parser overrides address confirmed compatible dependency issues. The lockfile records the resolved versions. Run `npm audit` in both frontend and backend to refresh the report; advisories change. Provider fixtures require no paid calls.

## العربية

سجل التدقيق بعد نجاح بناء Next.js 15.5.27. الأعداد هي `{"info": 0, "low": 0, "moderate": 0, "high": 5, "critical": 0, "total": 5}`. تبقى سلاسل تنبيهات أدوات Tailwind ومطابقة الأنماط، والإصلاح المقترح يحتاج ترقية رئيسية لم تُطبق دون مراجعة الواجهة. لا ندعي خلو جميع الاعتماديات من الثغرات. تحفظ الأقفال الإصدارات ويجب تحديث التدقيق محلياً. لا تتطلب العينات اتصالاً بمزود مدفوع.
