# Safe Kids Guard (حارس الأطفال الآمن) 🛡️👨‍👩‍👧‍👦

> **منصة متكاملة قائمة على الذكاء الاصطناعي للرقابة الأبوية وحماية الأطفال من المحتوى الضار باللغة العربية**  
> *مشروع تخرج — جامعة جدة (كلية علوم وهندسة الحاسب — قسم تقنية المعلومات / الأمن السيبراني والذكاء الاصطناعي) 2026/2027*

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_Python_3.11-009688.svg)](server/)
[![Next.js](https://img.shields.io/badge/Dashboard-Next.js_16_Turbopack-black.svg)](client/Dashboard/)
[![Tailwind](https://img.shields.io/badge/CSS-Tailwind_v4_RTL-38B2AC.svg)](client/Dashboard/)
[![Android](https://img.shields.io/badge/Client-Android_Kotlin_Compose-green.svg)](client/child_monitoring_app/)
[![PyTorch](https://img.shields.io/badge/AI_Engine-PyTorch_%2B_Transformers-EE4C2C.svg)](server/)
[![Meta WhatsApp](https://img.shields.io/badge/WhatsApp-Cloud_API_v21.0-25D366.svg)](server/)
[![Tests](https://img.shields.io/badge/Pytest-28%2F28_Passed_(100%25)-brightgreen.svg)](server/)
[![Build](https://img.shields.io/badge/Next.js_Build-13_Static_Routes_Passed-brightgreen.svg)](client/Dashboard/)

---

## 🌟 نبذة عن المشروع (Project Overview)

مع تزايد استخدام الأطفال في العالم العربي للهواتف الذكية ومنصات التواصل الاجتماعي، برزت تحديات كبرى تتعلق بالتعرض لـ **التنمر الإلكتروني (Cyberbullying)**، **المحتوى الجنسي غير اللائق (Sexual Content)**، **العنف والتهديد (Violence)**، و**خطاب الكراهية والعنصرية (Hate Speech)**، خاصة مع وجود خصوصية لغوية معقدة تشمل (اللهجات الدارجة المحكية، إزالة التشكيل، التطويل، والأرابيزي / الفرانكو).

يهدف مشروع **Safe Kids Guard** إلى سد هذه الفجوة عبر تقديم منظومة ذكية متكاملة ثلاثية الأبعاد:
1. **تطبيق أندرويد على جهاز الطفل (`client/child_monitoring_app/`):** يرصد النصوص المعروضة على الشاشة لحظياً عبر خدمة الوصول (`AccessibilityService`) مع حماية تامة لخصوصية الطفل وحقول كلمات المرور.
2. **خادم الذكاء الاصطناعي والوساطة (`server/`):** يعالج النصوص العربية عبر خط معالجة متقدم، ويفحصها باستخدام نموذج لغوي مزدوج (**AraBERT v2 + CAMeLBERT**)، ويخزن النتائج فائق السرعة عبر **Redis** مع تحكيم سياسات ولي الأمر.
3. **لوحة تحكم تفاعلية لولي الأمر (`client/Dashboard/`):** واجهة ويب تقدمية (PWA) مبنية بـ **Next.js 16** و **Tailwind v4** بخط **Cairo** العربي، تتيح للوالد تخصيص حساسية الرقابة، حظر التطبيقات، استلام تقارير دورية وPDF، وتلقي تنبيهات طارئة فورية عبر **واتساب الرسمي (Meta WhatsApp Business API)**.

---

## 🏗️ الهيكل المعماري للنظام (System Architecture)

```
                            [ جهاز الطفل - Android Kotlin App ]
                                (MonitoringAccessibilityService)
                                           │
                                           │ 1. إرسال النص المعروض لحظياً
                                           ▼ (POST /classification/predict)
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 خادم المنظومة (FastAPI Backend)                         │
│                                                                                        │
│  [1. معالجة النصوص] ────▶ [2. كاش Redis] ────▶ [3. الذكاء الاصطناعي] ────▶ [4. السياسات]│
│  • تنظيف التشكيل          • بصمة SHA-256         • AraBERT v2 (الفصحى)     • حساسية AI  │
│  • إزالة التطويل          • استجابة < 1ms        • CAMeLBERT (اللهجات)     • حظر فئات   │
│  • تحويل الأرابيزي        • TTL 24 ساعة          • Fast-Path Heuristics    • حظر تطبيقات│
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    ▼ (في حال رصد محتوى محظور)                       ▼ (تحديث السجلات والبيانات)
       [ شبكة التنبيهات الفورية ]                         [ قاعدة البيانات (SQLAlchemy 2.0) ]
       • WhatsApp Business Cloud API (أساسي)             • المستخدمين والأسر (Users & Families)
       • FCM Web Push (احتياطي)                          • سياسات الحماية (Policies)
                    │                                    • سجل الأنشطة والتهديدات (Alerts & Activity)
                    ▼                                                       │
       [ هاتف ولي الأمر المحمول ]                                            │
       (رسالة واتساب رسمية فورية)                                            ▼
                                                        [ لوحة تحكم ولي الأمر (Next.js Dashboard) ]
                                                        • متابعة حية للأنشطة وسجل التنبيهات
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

## ⚡ التشغيل السريع للمنظومة (Quickstart with Docker Compose)

يمكن تشغيل كامل بيئة المشروع (الخادم، قاعدة البيانات، الكاش، ولوحة التحكم) بأمر واحد:

```bash
# 1. استنساخ المستودع
git clone https://github.com/AzizAlAdny/SafeKidsGuard.git
cd SafeKidsGuard

# 2. تشغيل كافة الخدمات عبر Docker Compose
docker compose up --build
```

* **لوحة تحكم ولي الأمر (Next.js):** [http://localhost:3000](http://localhost:3000)
* **واجهة التوثيق التفاعلية للـ API (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)
* **فحص صحة الخادم (Health Check):** [http://localhost:8000/health](http://localhost:8000/health)

---

## 🧪 حالة الاختبارات والجودة (Testing & Quality Assurance)

تم إخضاع كافة وحدات النظام لاختبارات دقيقة تغطي جميع سيناريوهات الاستخدام والأمان:

### 1. الخادم والواجهة الخلفية (`server/tests`):
* **28 اختباراً من أصل 28 ناجحة بنسبة 100%**:
  * `test_auth.py` (9 اختبارات): التسجيل، تسجيل الدخول، أرقام الهواتف السعودية، وتدوير رموز JWT.
  * `test_preprocessing.py` (6 اختبارات): تنظيف النصوص العربية، التشكيل، الكشيدة، الأرابيزي، واختزال التكرار.
  * `test_classification.py` (6 اختبارات): دقة تصنيف الفئات الخمس والتنبيه التلقائي.
  * `test_notifications.py` (3 اختبارات): تفضيلات التنبيهات واختبار رسائل الواتساب.
  * `test_policies.py` (2 اختباران): سياسات الحظر، الحساسية، وصلاحيات الوصول.
  * `test_activity.py` (1 اختبار): تسجيل أحداث التصفح وتطبيق استثناءات السياسة.
  * `test_reports.py` (1 اختبار): الإحصائيات التحليلية وتصدير ملفات PDF صالحة وسليمة ثنائياً (`%PDF-`).

### 2. لوحة تحكم الويب (`client/Dashboard`):
* نجاح بناء وتوليد **13 مساراً وصفحة ثابتة** بنسبة 100% دون أي خطأ في TypeScript أو التصميم.

---

## 📑 روابط سريعة للتوثيق التفصيلي

* 📘 [دليل الخادم والذكاء الاصطناعي (Server README)](server/README.md)
* 💻 [دليل لوحة تحكم ولي الأمر (Dashboard README)](client/Dashboard/README.md)
* 📱 [دليل تطبيق أندرويد لرصد الشاشة (Android App README)](client/child_monitoring_app/README.md)
* 📋 [مستند المتطلبات الأكاديمية (Requirements)](docs/requerments.md)

---
