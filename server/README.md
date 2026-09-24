# Safe Kids Guard API — خادم حارس الأطفال الآمن 🛡️

[![Python 3.11](https://img.shields.io/badge/Python-3.11.9-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![SQLAlchemy 2.0](https://img.shields.io/badge/SQLAlchemy-2.0_Async-red.svg)](https://www.sqlalchemy.org/)
[![Alembic](https://img.shields.io/badge/Alembic-Migrations-orange.svg)](https://alembic.sqlalchemy.org/)
[![Redis](https://img.shields.io/badge/Redis-Cache-DC382D.svg)](https://redis.io/)
[![PyTorch](https://img.shields.io/badge/PyTorch-CPU_Optimized-EE4C2C.svg)](https://pytorch.org/)
[![Meta WhatsApp API](https://img.shields.io/badge/WhatsApp-Cloud_API_v21.0-25D366.svg)](https://developers.facebook.com/)
[![Tests](https://img.shields.io/badge/Pytest-28%2F28_Passed-brightgreen.svg)](https://docs.pytest.org/)

**Safe Kids Guard (حارس الأطفال الآمن)** هو خادم ذكي مبني باستخدام **FastAPI** وموجّه لحماية الأطفال من التهديدات والمحتوى الضار على الإنترنت في البيئة الرقمية العربية. يمثل الخادم العقل المدبر للمنظومة الثلاثية (تطبيق أندرويد لرصد شاشة الطفل + لوحة تحكم ويب تفاعلية لولي الأمر + خادم الذكاء الاصطناعي)، ويعد مشروع تخرج لجامعة جدة (University of Jeddah - 2026/2027).

---

## 📑 جدول المحتويات
1. [المزايا والقدرات الأساسية](#-المزايا-والقدرات-الأساسية)
2. [الهيكل المعماري للنظام (Architecture)](#-الهيكل-المعماري-للنظام)
3. [هيكلية مجلدات المشروع (Directory Structure)](#-هيكلية-مجلدات-المشروع)
4. [المتطلبات الأساسية (Prerequisites)](#-المتطلبات-الأساسية)
5. [التثبيت والإعداد السريع (Quickstart)](#-التثبيت-والإعداد-السريع)
6. [متغيرات البيئة (.env Configuration)](#-متغيرات-البيئة)
7. [قاعدة البيانات وترحيل الجداول (Migrations)](#-قاعدة-البيانات-وترحيل-الجداول)
8. [تشغيل الخادم (Running the Server)](#-تشغيل-الخادم)
9. [الاختبارات الآلية (Testing)](#-الاختبارات-الآلية)
10. [دليل نقاط النهاية البرمجية (API Reference)](#-دليل-نقاط-النهاية-البرمجية)

---

## 🚀 المزايا والقدرات الأساسية

### 1. محرك الذكاء الاصطناعي لمعالجة النصوص العربية (Dual-Model Ensemble)
* **المعالجة المسبقة الشاملة للنصوص العربية (`preprocessing.py`):**
  * إزالة التشكيل وعلامات الإعراب (Tashkeel Removal).
  * إزالة التطويل والكشيدة (Tatweel/Kashida Removal).
  * توحيد الحروف العربية (همزات الألف، الياء والألف المقصورة، التاء المربوطة والهاء).
  * اختزال التكرار المتعمد وتمديد الحروف (Elongation Reduction).
  * معالجة وتحويل الأرابيزي (Arabizi / Leetspeak Normalization) مثل تحويل `7mar` إلى `حمار`.
* **الدمج بين نموذجين لغويين (Dual Ensemble):**
  * **AraBERT v2 (`aubmindlab/bert-base-arabertv2`):** متخصص في اللغة العربية الفصحى (MSA).
  * **CAMeLBERT (`CAMeL-Lab/bert-base-arabic-camelbert-da` / `hossam87/bert-base-arabic-hate-speech`):** للتعامل مع اللهجات الدارجة المحكية (Saudi, Gulf, Levantine) وخطاب الكراهية.
  * فحص سريع مبكر (Heuristic Fast-Path) لحالات التهديد الصريحة وتقليل زمن الاستجابة إلى ما دون 100 ميلي ثانية.
* **فئات التصنيف الخمس:**
  * `SAFE`: محتوى آمن وسليم.
  * `CYBERBULLYING`: تنمر إلكتروني، سب وشتم وتهديد.
  * `SEXUAL`: محتوى إباحي وتلميحات غير لائقة.
  * `VIOLENCE`: عنف جسدي، قتل، أسلحة، تحريض على إيذاء النفس.
  * `HATE_SPEECH`: خطاب كراهية، عنصرية، تمييز طائفي أو قبلي.

### 2. التخزين المؤقت فائق السرعة عبر Redis (Cache Layer)
* تخزين قرارات التصنيف باستخدام بصمة SHA-256 الفريدة للنص المعالج.
* فترة استبقاء ذكية (TTL 24 ساعة) تقلل الضغط على نماذج الذكاء الاصطناعي وتتيح استجابة فورية (Sub-millisecond).
* وضع التراجع المرن (Graceful Degradation): استمرار الخادم بالعمل بكفاءة حتى في حال انقطاع اتصال Redis.

### 3. منظومة التنبيهات متعددة القنوات (Multi-Layer Alerting)
* **القناة الأساسية (WhatsApp Business Cloud API - Meta v21.0):**
  * إرسال تنبيهات واتساب رسمية فورية وموثوقة لولي الأمر عند رصد محتوى محظور.
  * معالجة وتحويل أرقام الهواتف السعودية تلقائياً للصيغة الدولية (`966XXXXXXXXX`).
* **القناة الاحتياطية (FCM Web Push):**
  * إرسال إشعارات المتصفح الفورية في حال عدم توفر الواتساب.

### 4. إدارة سياسات الرقابة الأبوية وضوابط الأمان (Parental Policies)
* تحديد حساسية الذكاء الاصطناعي (Sensitivity Threshold) لكل طفل بين 50% إلى 95%.
* مفاتيح تحكم مستقلة لتفعيل أو تعطيل حظر كل فئة من فئات التهديد.
* حظر التطبيقات عبر حزم أندرويد (مثل TikTok, Instagram, Snapchat, Roblox).
* القائمة السوداء المخصصة للمواقع غير المرغوبة (URL Blacklist).
* ضوابط وقت الشاشة (Screen Time Limit) وساعات النوم الإجبارية (Bedtime Window).

### 5. سجل الأنشطة المباشر وحماية الخصوصية (Activity Logging)
* تسجيل كل فحص نصي مع التطبيق والسياق وزمن الحدث.
* حماية خصوصية الطفل باقتطاع وحفظ أول 200 حرف فقط من النص المشبوه دون تخزين نصوص كاملة أو بيانات حساسة.

### 6. التقارير التحليلية وتصدير PDF (Analytics & Reports)
* حساب مؤشر الأمان الرقمي (Digital Safety Score) ونسب التهديدات اليومية.
* توليد وتصدير تقارير تنفيذية رسمية بصيغة **PDF** عبر محرك `ReportLab` تتضمن جداول التهديدات والرسوم الإحصائية.

---

## 🏛️ الهيكل المعماري للنظام

```
                     ┌───────────────────────────────────┐
                     │    Child Android Monitoring App   │
                     │  (AccessibilityService + Retrofit)│
                     └─────────────────┬─────────────────┘
                                       │ POST /classification/predict
                                       │ GET /policies/{child_id}
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             FastAPI Backend                                 │
│                                                                             │
│  ┌──────────────────────┐   ┌───────────────────────┐   ┌────────────────┐ │
│  │   Auth & Security    │   │ Content Filter Service│   │ Alert Service  │ │
│  │   JWT + Bcrypt       │──▶│ Policies + Activity   │──▶│ Meta WhatsApp  │ │
│  │   Role Authorization │   │ Decision Engine       │   │ FCM Web Push   │ │
│  └──────────────────────┘   └───────────┬───────────┘   └────────────────┘ │
│                                         │                                   │
│                     ┌───────────────────┴───────────────────┐               │
│                     ▼                                       ▼               │
│         ┌───────────────────────┐               ┌───────────────────────┐   │
│         │   Redis Cache Engine  │               │   AI Moderation Core  │   │
│         │   SHA-256 Hash Store  │               │   AraBERT + CAMeLBERT │   │
│         └───────────────────────┘               └───────────────────────┘   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ SQLAlchemy 2.0 (Async)
                                       ▼
                     ┌───────────────────────────────────┐
                     │  PostgreSQL (Supabase) / SQLite   │
                     │  users | policies | alerts        │
                     │  activity_events | preferences    │
                     └───────────────────────────────────┘
```

---

## 📁 هيكلية مجلدات المشروع

```
server/
├── app/
│   ├── activity/                # سجل النشاط المباشر وتتبع سلوك التصفح
│   │   ├── models.py            # نموذج ActivityEvent ORM
│   │   ├── router.py            # GET/POST /activity
│   │   ├── schemas.py           # نماذج Pydantic للأنشطة والترقيم
│   │   └── service.py           # منطق تسجيل واسترجاع أنشطة الأطفال
│   ├── ai_engine/               # محرك الذكاء الاصطناعي ومعالجة النصوص العربية
│   │   ├── cache.py             # التخزين المؤقت Redis مع fallback
│   │   ├── classifier.py        # نموذج الفحص المزدوج وفئات التهديد
│   │   ├── model.py             # محمل نماذج HuggingFace (Lazy Singleton)
│   │   └── preprocessing.py     # فلترة التشكيل، التطويل، الأرابيزي، والتوحيد
│   ├── alerts/                  # منظومة الإشعارات والتنبيهات
│   │   ├── router.py            # GET/PUT /notifications/preferences, test-whatsapp
│   │   ├── schemas.py           # نماذج التفضيلات والتحقق من الأرقام
│   │   └── whatsapp.py          # تكامل Meta WhatsApp Business Cloud API
│   ├── auth/                    # التوثيق وصلاحيات المستخدمين (أولياء أمور، أطفال)
│   │   ├── models.py            # User, Family, FamilyMember, NotificationPreferences
│   │   ├── router.py            # /auth/register, /login, /refresh, /children, /me
│   │   ├── schemas.py           # التحقق من المدخلات وكلمات المرور والهواتف
│   │   └── service.py           # تشفير Bcrypt وتدوير JWT Refresh Tokens
│   ├── content_filter/          # فلترة المحتوى والربط بين السياسات والتنبيهات
│   │   ├── models.py            # نموذج Alert ORM
│   │   ├── router.py            # POST /classification/predict, GET /alerts
│   │   ├── schemas.py           # طلب واستجابة الفحص
│   │   └── service.py           # فحص السياسات، تسجيل الأنشطة، وإطلاق التنبيهات
│   ├── core/                    # إعدادات النظام والبنية التحتية
│   │   ├── config.py            # Pydantic Settings لقراءة متغيرات البيئة
│   │   ├── database.py          # محرك SQLAlchemy AsyncSession وقاعدة البيانات
│   │   ├── dependencies.py      # دوال حقن التبعيات (get_current_user, get_db)
│   │   ├── redis.py             # إدارة اتصال وإغلاق Redis
│   │   └── security.py          # توليد وفك تشفير رموز JWT
│   ├── policies/                # سياسات الرقابة الأبوية وحظر التطبيقات
│   │   ├── models.py            # نموذج Policy ORM
│   │   ├── router.py            # GET/PUT /policies/{child_id}
│   │   ├── schemas.py           # مدخلات السياسات وحساسية الذكاء الاصطناعي
│   │   └── service.py           # التحقق من ملكية الوالد وتحديث السياسات
│   ├── reports/                 # التقارير والتحليلات وتصدير PDF
│   │   ├── router.py            # GET /reports/summary, GET /reports/export-pdf
│   │   ├── schemas.py           # هياكل مؤشرات الأمان وتوزيع التهديدات
│   │   └── service.py           # حساب الإحصائيات وتوليد PDF عبر ReportLab
│   └── main.py                  # نقطة انطلاق تطبيق FastAPI وربط المسارات وCORS
├── alembic/                     # ترحيل وإدارة بنية قاعدة البيانات
│   ├── versions/                # ملفات الترحيل المتتالية (Migrations)
│   └── env.py                   # تهيئة اتصال Alembic وتسجيل الموديلات
├── tests/                       # حزمة الاختبارات الشاملة (28 اختباراً)
│   ├── conftest.py              # إعدادات بيئة الاختبار وعزل قواعد البيانات
│   ├── test_activity.py         # اختبارات تسجيل الأنشطة وتطبيق السياسات
│   ├── test_auth.py             # اختبارات التسجيل، تسجيل الدخول، وأرقام الهواتف
│   ├── test_classification.py   # اختبارات تصنيف النصوص واستدعاء التنبيهات
│   ├── test_notifications.py    # اختبارات تفضيلات الإشعارات والواتساب
│   ├── test_policies.py         # اختبارات قراءة وتعديل سياسات الحماية
│   ├── test_preprocessing.py    # اختبارات خط معالجة النصوص العربية
│   └── test_reports.py          # اختبارات ملخص التقارير وتصدير ملفات PDF
├── .env.example                 # نموذج إرشادي لمتغيرات البيئة
├── alembic.ini                  # ملف إعدادات أداة Alembic
├── Dockerfile                   # ملف بناء حاوية الخادم للإنتاج
├── pytest.ini                   # إعدادات تشغيل Pytest بوضع Asyncio
└── requirements.txt             # حزم ومكتبات بايثون المطلوبة
```

---

## 💻 المتطلبات الأساسية

* **Python 3.11.9 (64-bit)**: الإصدار المعتمد والمتوافق 100% مع حزم `torch` و`transformers` المجمعة مسبقاً (Wheels) على أنظمة Windows وLinux.
* **Redis** (محلياً أو عبر Docker أو السحابة): اختياري للتطوير، أساسي للإنتاج.
* **Git** لإدارة الإصدارات.

---

## ⚡ التثبيت والإعداد السريع

### 1. استنساخ المستودع والدخول لمجلد الخادم
```bash
cd server
```

### 2. إنشاء وتفعيل البيئة الافتراضية
```bash
# إنشاء البيئة باستخدام بايثون 3.11
py -3.11 -m venv .venv

# التفعيل على نظام Windows (PowerShell):
.\.venv\Scripts\Activate.ps1

# التفعيل على أنظمة Linux / macOS:
source .venv/bin/activate
```

### 3. تثبيت الاعتمادات والحزم البرمجية
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. إعداد ملف البيئة
```bash
cp .env.example .env
```
قم بفتح ملف `.env` وضبط المفاتيح بما يناسب بيئة العمل (انظر القسم التالي).

---

## 🔐 متغيرات البيئة

| المتغير | القيمة الافتراضية | الوصف |
|---|---|---|
| `DATABASE_URL` | `sqlite+aiosqlite:///./safekids_dev.db` | رابط الاتصال بقاعدة البيانات (SQLite محلياً أو PostgreSQL/Supabase للإنتاج) |
| `REDIS_URL` | `redis://localhost:6379/0` | عنوان خادم Redis للكاش |
| `JWT_SECRET_KEY` | *(مفتاح عشوائي طويل)* | مفتاح التشفير السري لرموز JWT |
| `JWT_ALGORITHM` | `HS256` | خوارزمية تشفير الرموز |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | `15` | مدة صلاحية رمز الوصول (Access Token) بالدقائق |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | `7` | مدة صلاحية رمز التجديد (Refresh Token) بالأيام |
| `WA_PHONE_NUMBER_ID` | `""` | معرّف رقم هاتف واتساب من بوابة مطوري Meta |
| `WA_ACCESS_TOKEN` | `""` | رمز الوصول الدائم (System User Token) لـ Meta Cloud API |
| `AI_CONFIDENCE_THRESHOLD` | `0.75` | الحد الأدنى لنسبة ثقة الذكاء الاصطناعي لحظر المحتوى (0.0 إلى 1.0) |
| `APP_ENV` | `development` | بيئة التطبيق (`development` تتيح `/docs` و`/redoc`) |
| `APP_CORS_ORIGINS` | `http://localhost:3000,...` | النطاقات المصرح لها بالتواصل عبر CORS |

---

## 🗄️ قاعدة البيانات وترحيل الجداول

يستخدم الخادم أداة **Alembic** لإدارة ترقيات بنية قاعدة البيانات تلقائياً:

```bash
# تطبيق جميع الترحيلات المعلقة حتى أحدث إصدار:
alembic upgrade head

# إنشاء ترحيل جديد تلقائياً عند تعديل أي نموذج (Model):
alembic revision --autogenerate -m "وصف التعديل"
```

---

## 🏃 تشغيل الخادم

### وضع التطوير المحلي (Local Development)
```bash
# تشغيل الخادم مع ميزة التحديث التلقائي عند حفظ الملفات:
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
* **واجهة التوثيق التفاعلية (Swagger UI):** [http://localhost:8000/docs](http://localhost:8000/docs)
* **واجهة التوثيق البديلة (ReDoc):** [http://localhost:8000/redoc](http://localhost:8000/redoc)
* **فحص صحة الخدمة (Health Check):** [http://localhost:8000/health](http://localhost:8000/health)

### التشغيل عبر Docker
```bash
# بناء الحاوية:
docker build -t safekidsguard-server .

# تشغيل الحاوية:
docker run -p 8000:8000 --env-file .env safekidsguard-server
```

---

## 🧪 الاختبارات الآلية (Testing)

يحتوي الخادم على حزمة اختبارات شاملة معزولة بالكامل باستخدام قواعد بيانات SQLite مؤقتة في الذاكرة لتجنب التأثير على البيانات الحقيقية:

```bash
# تشغيل كامل حزمة الاختبارات:
python -m pytest tests/ -v
```

### ملخص نتائج الاختبارات (28 اختباراً ناجحاً بنسبة 100%):
* `tests/test_auth.py` (9 اختبارات): إنشاء الحسابات، التحقق من كلمات المرور، استخراج وتجديد رموز JWT، والتحقق الصارم من صحة أرقام الهواتف السعودية.
* `tests/test_preprocessing.py` (6 اختبارات): تنظيف النصوص العربية، إزالة التشكيل، التطويل، الأرابيزي، واختزال التكرار.
* `tests/test_classification.py` (6 اختبارات): دقة تصنيف النصوص إلى الفئات الخمس، وفحص مسار التدخل التلقائي وإطلاق التنبيهات.
* `tests/test_notifications.py` (3 اختبارات): قراءة وتحديث تفضيلات الإشعارات، وتجربة إرسال رسائل الواتساب.
* `tests/test_policies.py` (2 اختباران): استرجاع وتحديث سياسات الحماية للأبناء ومنع الوصول غير المصرح به.
* `tests/test_activity.py` (1 اختبار): تسجيل نشاط التصفح وتطبيق استثناءات السياسات الأبوية.
* `tests/test_reports.py` (1 اختبار): استخراج الإحصائيات الشاملة وتصدير ملفات PDF صالحة وسليمة ثنائياً (`%PDF-`).

---

## 📡 دليل نقاط النهاية البرمجية (API Reference)

### 1. التوثيق والمستخدمين (`/auth`)
| الدالة | المسار | الحماية | الوصف |
|---|---|---|---|
| `POST` | `/auth/register` | عام | تسجيل حساب ولي أمر جديد مع رقم الواتساب المعتمد |
| `POST` | `/auth/login` | عام | تسجيل الدخول واستخراج رمزي الوصول والتجديد (JWT) |
| `POST` | `/auth/refresh` | عام | تجديد رمز الوصول المنتهي باستخدام رمز التجديد |
| `GET` | `/auth/me` | Bearer Token | استرجاع الملف الشخصي للمستخدم الحالي |
| `POST` | `/auth/children` | ولي أمر | إنشاء حساب جديد للطفل وربطه بأسرة الوالد |
| `GET` | `/auth/children` | ولي أمر | عرض قائمة الأبناء المرتبطين بولي الأمر |

### 2. فحص المحتوى والتنبيهات (`/classification` & `/alerts`)
| الدالة | المسار | الحماية | الوصف |
|---|---|---|---|
| `POST` | `/classification/predict` | عام / Bearer | فحص النص المدخل بالذكاء الاصطناعي وتطبيق السياسة وإشعار الوالد عند الحظر |
| `GET` | `/alerts` | ولي أمر | استرجاع سجل التنبيهات مع إمكانية التصفية بحسب الفئة |

### 3. إعدادات الإشعارات (`/notifications`)
| الدالة | المسار | الحماية | الوصف |
|---|---|---|---|
| `GET` | `/notifications/preferences` | ولي أمر | قراءة تفضيلات قنوات التنبيه (واتساب، إشعارات الويب) |
| `PUT` | `/notifications/preferences` | ولي أمر | تحديث رقم الواتساب وتفعيل/تعطيل قنوات التنبيه |
| `POST` | `/notifications/test-whatsapp` | ولي أمر | إرسال رسالة تجريبية فورية للواتساب للتأكد من وصول التنبيهات |

### 4. سياسات الحماية (`/policies`)
| الدالة | المسار | الحماية | الوصف |
|---|---|---|---|
| `GET` | `/policies/{child_id}` | ولي أمر / الطفل | قراءة سياسة الحماية النشطة لجهاز الطفل |
| `PUT` | `/policies/{child_id}` | ولي أمر | تعديل الحساسية وفئات الحظر وقائمة التطبيقات والمواقع الممنوعة |

### 5. سجل النشاط المباشر (`/activity`)
| الدالة | المسار | الحماية | الوصف |
|---|---|---|---|
| `GET` | `/activity` | ولي أمر | استعراض سجل تصفح الأبناء المباشر مع التصفية والترقيم |
| `POST` | `/activity` | تطبيق الطفل | تسجيل حدث تصفح أو نص تم فحصه على شاشة جهاز الطفل |

### 6. التقارير والتحليلات (`/reports`)
| الدالة | المسار | الحماية | الوصف |
|---|---|---|---|
| `GET` | `/reports/summary` | ولي أمر | استخراج ملخص إحصائي لمؤشر الأمان والتهديدات المرصودة |
| `GET` | `/reports/export-pdf` | ولي أمر | تصدير وتحميل تقرير أمان تنفيذي بصيغة PDF |

---

## 👥 فريق العمل والمساهمة
مشروع تخرج لطلاب جامعة جدة (كلية علوم وهندسة الحاسب - قسم تقنية المعلومات / الذكاء الاصطناعي والأمن السيبراني).
* **إشراف:** قسم الأمن السيبراني وتقنية المعلومات - جامعة جدة.
* **رخصة الاستخدام:** ملكية أكاديمية وبحثية خاصة بمشروع التخرج 2026/2027.
