# ترتيب الإعلام الجزائري حسب Domain Rating

صفحة عربية على GitHub Pages تعرض ترتيبًا استكشافيًا لمواقع الجهات الإعلامية الجزائرية وفق **Domain Rating** من Ahrefs. تعرض الصفحة القائمة التي اجتازت الفرز الأولي فقط، ولا تنشر ملف الجمع الخام.

## التحديث

يعمل GitHub Actions على تحديث `data/ratings.json` تقريبًا كل خمسة أيام عند الدقيقة 17 من الساعة 03:00 UTC، مع إمكانية تشغيل التحديث يدويًا عبر `workflow_dispatch`. يحتفظ السكربت بآخر قيمة ناجحة إذا تعذر الوصول إلى Ahrefs أو تعذر فحص نطاق واحد، ويضع الحقل `stale` على `true` بدل إسقاط البيانات كلها.

يجب حفظ المفتاح في إعدادات المستودع تحت:

`Settings → Secrets and variables → Actions → New repository secret`

واسم السر هو `AHREFS_API_KEY`. لا يوجد المفتاح في HTML أو JavaScript أو ملف JSON المنشور.

## الملفات

- `index.html`: الهيكل العربي للصفحة.
- `styles.css`: التصميم المتجاوب بطابع لوحة متصدرين.
- `app.js`: البحث والتصفية والترتيب وعرض الإحصاءات.
- `data/sites.seed.json`: قائمة المواقع التي دخلت مرحلة التحديث.
- `data/ratings.json`: البيانات المنشورة التي تقرؤها الصفحة.
- `scripts/fetch_ahrefs.py`: جالب بيانات Ahrefs مع التعامل مع الأخطاء والبيانات القديمة.
- `.github/workflows/update-ratings.yml`: مهمة التحديث الدورية.
- `.github/workflows/pages.yml`: مهمة نشر GitHub Pages.

## المصدر والترخيص

تظهر في الصفحة عبارة **Domain Rating by Ahrefs** مع رابط إلى Ahrefs وفق متطلبات النسبة. تُستخدم البيانات لعرض ترتيب محدود لمواقع إعلامية محددة، وليست قاعدة بيانات عامة شاملة أو منتجًا منافسًا لـ Ahrefs.

المراجع: [Ahrefs Domain Rating API](https://docs.ahrefs.com/en/api/reference/public/get-domain-rating-free)، [ترخيص Domain Rating](https://ahrefs.com/legal/domain-rating-license)، [GitHub Pages](https://docs.github.com/en/pages)، [GitHub Actions schedule](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule).
