# Safe Kids Guard (حارس الأطفال الآمن) 🛡️👨‍👩‍👧‍👦

> **منصة متكاملة قائمة على الذكاء الاصطناعي للرقابة الأبوية وحماية الأطفال من المحتوى الضار باللغة العربية**  
> *مشروع تخرج — جامعة جدة (كلية علوم وهندسة الحاسب — قسم تقنية المعلومات / الأمن السيبراني والذكاء الاصطناعي) 2026/2027*

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_Python_3.11-009688.svg)](server/)
[![Next.js](https://img.shields.io/badge/Dashboard-Next.js_16_Turbopack-black.svg)](client/Dashboard/)
[![Tailwind](https://img.shields.io/badge/CSS-Tailwind_v4_RTL-38B2AC.svg)](client/Dashboard/)
[![Android](https://img.shields.io/badge/Client-Android_Kotlin_Compose-green.svg)](client/child_monitoring_app/)
[![PyTorch](https://img.shields.io/badge/AI_Engine-PyTorch_%2B_Transformers-EE4C2C.svg)](server/)
[![Meta WhatsApp](https://img.shields.io/badge/WhatsApp-Cloud_API_v21.0-25D366.svg)](server/)
[![Tests](https://img.shields.io/badge/Pytest-29%2F29_Passed_(100%25)-brightgreen.svg)](server/)
[![Build](https://img.shields.io/badge/Next.js_Build-13_Static_Routes_Passed-brightgreen.svg)](client/Dashboard/)

---

## 🌟 نبذة عن المشروع (Project Overview)

مع تزايد استخدام الأطفال في العالم العربي للهواتف الذكية ومنصات التواصل الاجتماعي، برزت تحديات كبرى تتعلق بالتعرض لـ **التنمر الإلكتروني (Cyberbullying)**، **المحتوى الجنسي غير اللائق (Sexual Content)**، **العنف والتهديد (Violence)**، و**خطاب الكراهية والعنصرية (Hate Speech)**، خاصة مع وجود خصوصية لغوية معقدة تشمل (اللهجات الدارجة المحكية، إزالة التشكيل، التطويل، والأرابيزي / الفرانكو).

يهدف مشروع **Safe Kids Guard** إلى سد هذه الفجوة عبر تقديم منظومة ذكية متكاملة ثلاثية الأبعاد:
1. **تطبيق أندرويد على جهاز الطفل (`client/child_monitoring_app/`):** يرصد النصوص المعروضة على الشاشة لحظياً عبر خدمة الوصول (`AccessibilityService`) مع نافذة تهدئة ذكية (**2-Second Debounce & Deduplication**) لمنع استنزاف البطارية، حماية خصوصية الطفل بتخطي حقول كلمات المرور، وتدخل وقائي فوري بإغلاق التطبيق المخالف (`GLOBAL_ACTION_HOME`) فور رصد التهديد.
2. **خادم الذكاء الاصطناعي والوساطة (`server/`):** يعالج النصوص العربية عبر خط معالجة متقدم، ويفحصها باستخدام نموذج لغوي مزدوج (**AraBERT v2 + CAMeLBERT**) عبر مسارات غير معطلة للـ Event Loop (`asyncio.to_thread`)، محمي بنظام تقييد معدل الطلبات (**SlowAPI Rate Limiting**)، ويدعم مرونة قواعد البيانات (**SQLite** محلياً بدون إعداد، أو **XAMPP MySQL**، أو **PostgreSQL**).
3. **لوحة تحكم تفاعلية لولي الأمر (`client/Dashboard/`):** واجهة ويب تقدمية (PWA) مبنية بـ **Next.js 16** و **Tailwind v4** بخط **Cairo** العربي، متصلة **ببيانات حية مباشرة من الخادم** (الأجهزة المقترنة، الرسائل المفحوصة، التنبيهات اللحظية، وتصدير التقارير الرسمية PDF).

---

## 🏗️ الهيكل المعماري للنظام (System Architecture)

```
                            [ جهاز الطفل - Android Kotlin App ]
                     (MonitoringAccessibilityService + 2s Debounce)
                                           │
                                           │ 1. إرسال النص المعروض لحظياً
                                           ▼ (POST /api/v1/classification/predict)
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        خادم المنظومة (FastAPI Backend + SlowAPI)                       │
│                                                                                        │
│  [1. معالجة النصوص] ────▶ [2. كاش Redis] ────▶ [3. الذكاء الاصطناعي] ────▶ [4. السياسات]│
│  • تنظيف التشكيل          • بصمة SHA-256         • AraBERT v2 (الفصحى)     • حساسية AI  │
│  • إزالة التطويل          • استجابة < 1ms        • CAMeLBERT (اللهجات)     • حظر فئات   │
│  • تحويل الأرابيزي        • TTL 24 ساعة          • Fast-Path Heuristics    • حظر تطبيقات│
│  • فلترة حقول السرية      • Graceful Fallback    • Async Thread Executor   • Rate Limits│
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    ▼ (في حال رصد محتوى محظور)                       ▼ (تحديث السجلات والبيانات)
       [ شبكة التنبيهات الفورية ]                       [ قاعدة البيانات (SQLAlchemy 2.0 Async) ]
       • WhatsApp Business Cloud API (أساسي)             • SQLite (safekids_dev.db - افتراضي محلي)
       • FCM Web Push (احتياطي)                          • XAMPP MySQL أو PostgreSQL
       • إغلاق فوري للتطبيق بالطفل                       • المستخدمين، الأسر، والسياسات
                    │                                    • سجل الأنشطة والتهديدات (Alerts & Activity)
                    ▼                                                       │
       [ هاتف ولي الأمر المحمول ]                                            │
       (رسالة واتساب رسمية فورية)                                            ▼
                                                        [ لوحة تحكم ولي الأمر (Next.js Dashboard) ]
                                                        • متابعة حية ومباشرة للأنشطة وسجل التنبيهات
                                                        • تخصيص وضبط سياسات الأمان لكل طفل
                                                        • تحليلات ورسوم بيانية + تصدير تقارير PDF
```

---

## 📂 مكونات المستودع (Repository Components)

ينقسم المشروع إلى 3 مكونات برمجية رئيسية مستقلة ومتكاملة:

```
SafeKidsGuard/
├── server/                     # خادم الذكاء الاصطناعي وقواعد البيانات ومسارات الـ REST API
│   ├── app/                    # الكود المصدري (auth, ai_engine, content_filter, alerts, policies, activity, reports)
│   ├── alembic/                # ترحيل وإدارة بنية قاعدة البيانات
│   ├── tests/                  # حزمة الاختبارات الآلية (28 اختباراً ناجحاً بنسبة 100%)
│   └── README.md               # 📄 التوثيق الشامل للخادم ومتغيرات البيئة
│
├── client/
│   ├── Dashboard/              # لوحة تحكم ولي الأمر بـ Next.js 16 + React 19 + Tailwind v4 + Cairo RTL
│   │   ├── src/app/            # الصفحات (dashboard, alerts, children, activity, policies, reports, notifications)
│   │   ├── public/             # الأصول الثابتة، PWA Manifest، و Firebase Service Worker
│   │   └── README.md           # 📄 التوثيق الشامل للوحة التحكم ونظام الألوان
│   │
│   └── child_monitoring_app/   # تطبيق مراقبة وحماية جهاز الطفل بنظام Android (Kotlin + Compose M3)
│       ├── app/src/main/       # كود التطبيق، AccessibilityService، وواجهات Retrofit
│       └── README.md           # 📄 التوثيق الشامل لتطبيق أندرويد والأذونات
│
├── docs/                       # وثائق المشروع، المتطلبات الأكاديمية، والتقرير النهائي
├── docker-compose.yml          # ملف تشغيل المنظومة الكاملة محلياً (FastAPI + PostgreSQL + Redis + Dashboard)
└── .github/workflows/ci.yml    # خط أنابيب الفحص والاختبار الآلي المستمر (CI/CD)
```

---

## ⚡ التشغيل السريع للمنظومة (Quickstart)

يمكن تشغيل المنظومة بخيارين مرنين وفقاً لبيئة التطوير الخاصة بك:

### الخيار الأول: التشغيل المحلي السريع (بدون Docker وبقاعدة بيانات SQLite مدمجة)
هذا الخيار هو الأسهل والأسرع للمطورين ومناقشي المشروع على أنظمة Windows/macOS دون الحاجة لتثبيت برمجيات خارجية:

```bash
# 1. تشغيل خادم الـ FastAPI (يستخدم قاعدة safekids_dev.db الجاهزة تلقائياً):
cd server
.\.venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 2. في نافذة طرفية أخرى، تشغيل لوحة تحكم ولي الأمر:
cd client/Dashboard
npm run dev
```

> [!TIP]
> يدعم الخادم التبديل الفوري إلى **XAMPP MySQL** بتعديل سطر واحد فقط في `server/.env`:
> `DATABASE_URL=mysql+aiomysql://root:@localhost:3306/safekidsguard`

---

### الخيار الثاني: التشغيل الكامل عبر Docker Compose
لتشغيل بيئة الإنتاج الشاملة (FastAPI + PostgreSQL + Redis + Dashboard):

```bash
# 1. استنساخ المستودع والدخول لمجلده
git clone https://github.com/AzizAlAdny/SafeKidsGuard.git
cd SafeKidsGuard

# 2. تشغيل كافة الخدمات بحاويات معزولة
docker compose up --build
```

* **لوحة تحكم ولي الأمر (Next.js):** [http://localhost:3000](http://localhost:3000)
* **واجهة التوثيق التفاعلية للـ API (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)
* **المسار القياسي الموحد (API v1):** [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
* **فحص صحة الخادم (Health Check):** [http://localhost:8000/health](http://localhost:8000/health)

---

## 🧪 حالة الاختبارات والجودة (Testing & Quality Assurance)

تم إخضاع كافة وحدات النظام لاختبارات دقيقة تغطي جميع سيناريوهات الاستخدام والأمان:

### 1. الخادم والواجهة الخلفية (`server/tests`):
* **29 اختباراً من أصل 29 ناجحة بنسبة 100%**:
  * `test_auth.py` (10 اختبارات): التسجيل، تسجيل الدخول، أرقام الهواتف السعودية، تدوير رموز JWT، استرجاع أجهزة الأطفال `GET /auth/children`، فحص توافقية مسارات `/api/v1/`، واختبار نظام تقييد الطلبات (SlowAPI Rate Limiting - 429).
  * `test_preprocessing.py` (6 اختبارات): تنظيف النصوص العربية، التشكيل، الكشيدة، الأرابيزي، واختزال التكرار.
  * `test_classification.py` (6 اختبارات): دقة تصنيف الفئات الخمس، التنبيه التلقائي عبر الواتساب، والتحقق من صحة معرّف الطفل UUID.
  * `test_notifications.py` (3 اختبارات): تفضيلات التنبيهات واختبار رسائل الواتساب الرسمية.
  * `test_policies.py` (2 اختباران): سياسات الحظر، الحساسية، وصلاحيات الوصول.
  * `test_activity.py` (1 اختبار): تسجيل أحداث التصفح وتطبيق استثناءات السياسة.
  * `test_reports.py` (1 اختبار): الإحصائيات التحليلية وتصدير ملفات PDF صالحة وسليمة ثنائياً (`%PDF-`).

### 2. لوحة تحكم الويب (`client/Dashboard`):
* نجاح بناء وتوليد **13 مساراً وصفحة ثابتة** بنسبة 100% دون أي خطأ في TypeScript أو التصميم، مع اتصال كامل ببيانات الخادم الحية.

---

## 📑 روابط سريعة للتوثيق التفصيلي

* 📘 [دليل الخادم والذكاء الاصطناعي (Server README)](server/README.md)
* 💻 [دليل لوحة تحكم ولي الأمر (Dashboard README)](client/Dashboard/README.md)
* 📱 [دليل تطبيق أندرويد لرصد الشاشة (Android App README)](client/child_monitoring_app/README.md)
* 📋 [مستند المتطلبات الأكاديمية (Requirements)](docs/requerments.md)

---
