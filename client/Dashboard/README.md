# Safe Kids Guard — لوحة تحكم ولي الأمر (Parent Dashboard) 🖥️🛡️

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.6_(Turbopack)-black.svg)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2.8-61DAFB.svg)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC.svg)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg)](https://www.typescriptlang.org/)
[![Recharts](https://img.shields.io/badge/Recharts-3.10.1-22c55e.svg)](https://recharts.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-purple.svg)](https://web.dev/progressive-web-apps/)
[![RTL Supported](https://img.shields.io/badge/Language-Arabic_RTL_(Cairo)-07365f.svg)](https://fonts.google.com/specimen/Cairo)

**Safe Kids Guard Dashboard** هي بوابة ويب تقدمية (PWA) حديثة تم بناؤها باستخدام **Next.js 16 (App Router)** و **React 19** و **Tailwind CSS v4**، مصممة خصيصاً لأولياء الأمور لإدارة وتخصيص سياسات أمان الأبناء، متابعة سجلات الأنشطة الحية، استلام إشعارات الواتساب الفورية، وتحليل مؤشرات الأمان الرقمي.

تمثل لوحة التحكم الواجهة البصرية الرئيسية لمشروع تخرج جامعة جدة (2026/2027)، ومصممة بأعلى معايير تجربة المستخدم (UI/UX) الداعمة كلياً للغة العربية (RTL) مع خط **Cairo** المعتمد.

---

## 📑 جدول المحتويات
1. [المزايا والصفحات المنجزة (Features & Pages)](#-المزايا-والصفحات-المنجزة)
2. [الهوية البصرية ونظام الألوان (Design System)](#-الهوية-البصرية-ونظام-الألوان)
3. [هيكلية مجلدات الواجهة (Project Structure)](#-هيكلية-مجلدات-الواجهة)
4. [المتطلبات الأساسية (Prerequisites)](#-المتطلبات-الأساسية)
5. [التثبيت والتشغيل المحلي (Quickstart)](#-التثبيت-والتشغيل-المحلي)
6. [متغيرات البيئة (.env.local)](#-متغيرات-البيئة)
7. [أوامر البناء والإنتاج (Build & Production)](#-أوامر-البناء-والإنتاج)
8. [تطبيق الويب التقدمي (PWA & Service Worker)](#-تطبيق-الويب-التقدمي)

---

## 🌟 المزايا والصفحات المنجزة

تحتوي لوحة التحكم على **13 صفحة ومساراً** تم بناؤها بنجاح واختبارها:

| المسار | الصفحة | الوظيفة والميزات |
|---|---|---|
| `/` | **بوابة الدخول الرئيسية** | توجيه ذكي للمستخدم بناءً على حالة تسجيل الدخول (Auth State). |
| `/login` | **تسجيل الدخول** | تسجيل دخول ولي الأمر عبر البريد وكلمة المرور مع حفظ رموز JWT. |
| `/register` | **إنشاء حساب ولي أمر** | تسجيل حساب جديد مع **حقل التحقق الصارم لرقم الواتساب السعودي** (`966XXXXXXXXX`). |
| `/dashboard` | **لوحة المؤشرات العامة** | بطاقات إحصائية للمؤشرات الحيوية، آخر التهديدات المرصودة، والأجهزة النشطة. |
| `/alerts` | **سجل التنبيهات والتهديدات** | جدول مفصل بالتنبيهات المحظورة، نسب الثقة، والسياق مع إمكانية التصفية. |
| `/children` | **إدارة حسابات الأبناء** | إضافة أطفال جدد، ربط أجهزتهم برمز الاقتران، واستعراض الأجهزة المرتبطة. |
| `/activity` | **سجل النشاط المباشر** | جدول حي لمتابعة جميع النصوص المفحوصة (المسموحة والمحظورة) والتطبيق المستخدم. |
| `/policies` | **سياسات الحماية وضوابط المحتوى** | قوالب جاهزة (أطفال/يافعين)، مفاتيح فئات الحظر، مزلاق حساسية AI، وحظر التطبيقات والمواقع. |
| `/reports` | **التقارير التحليلية وتصدير PDF** | رسوم بيانية تفاعلية (Recharts) لمعدل الأمان وتوزيع التهديدات + زر تحميل تقرير PDF. |
| `/notifications` | **إعدادات الإشعارات (واتساب)** | تحديث رقم الواتساب المعتمد وتجربة إرسال رسائل فحص حية عبر Meta Cloud API. |

---

## 🎨 الهوية البصرية ونظام الألوان (Design System)

تم استخراج نظام الألوان بدقة من شعار المشروع الرسمي (Safe Kids Guard Logo) وتم تعريفه في متغيرات CSS لـ **Tailwind CSS v4** (`@theme`):

* **الأزرق الداكن القيادي (Primary Navy):** `#07365f` و `#0b518e` (يعكس الأمان والاحترافية والوقار).
* **السماوي والتركواز الحيوي (Vibrant Cyan):** `#159cb7` و `#1bc3e4` و `#76dbef` (للأزرار التفاعلية والتركيز).
* **الأخضر الوقائي (Safe / Allowed):** `#2abe50` و `#eaf9ef` (للمحتوى السليم ومؤشرات الأمان العالية).
* **الأحمر التنبيهي (Threat / Blocked):** `#e33a0a` و `#feebe6` (للمحتوى المحظور والتنبيهات العاجلة).
* **البرتقالي التحذيري (Warning / Cyberbullying):** `#e5820a` و `#fff6eb` (للتنمر الإلكتروني والسب).
* **الوردي الداكن (Sexual Content):** `#d81b60` و `#fde8ef` (للمحتوى غير اللائق والإباحي).
* **الخلفيات الهادئة (Canvas):** `#f0fafc` و `#edf5f8` (مريحة للعين وتدعم القراءة الممتدة).

---

## 📁 هيكلية مجلدات الواجهة

```
client/Dashboard/
├── public/
│   ├── firebase-messaging-sw.js   # Service Worker لإشعارات المتصفح الفورية (FCM)
│   ├── manifest.json              # إعدادات تطبيق الويب التقدمي (PWA Manifest)
│   ├── logo.jpeg                  # شعار Safe Kids Guard الرسمي
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── (parent)/              # مجموعة مسارات ولي الأمر المحمية بـ Layout موحد
│   │   │   ├── layout.tsx         # شريط التنقل الجانبي (Sidebar) والهيدر ودعم RTL
│   │   │   ├── dashboard/page.tsx # لوحة التحكم الرئيسية
│   │   │   ├── alerts/page.tsx    # سجل التنبيهات
│   │   │   ├── children/page.tsx  # إدارة حسابات الأبناء
│   │   │   ├── activity/page.tsx  # سجل النشاط المباشر
│   │   │   ├── policies/page.tsx  # سياسات الرقابة الأبوية
│   │   │   ├── reports/page.tsx   # التقارير التحليلية وتصدير PDF
│   │   │   └── notifications/page.tsx # إعدادات الواتساب والتنبيهات
│   │   ├── login/page.tsx         # صفحة تسجيل الدخول
│   │   ├── register/page.tsx      # صفحة التسجيل والتحقق من الهاتف
│   │   ├── globals.css            # استيراد خط Cairo وقواعد Tailwind v4
│   │   ├── layout.tsx             # Root Layout مع تعيين dir="rtl" ولغة "ar"
│   │   └── page.tsx               # نقطة الدخول الذكية
│   └── lib/
│       ├── api.ts                 # عميل Axios مع معترض JWT والتجديد التلقائي للرموز
│       ├── auth-store.ts          # إدارة حالة المستخدم عبر Zustand مع الحفظ المحلي
│       └── utils.ts               # دوال المساعدة لدمج كلاسات Tailwind
├── next.config.ts                 # إعدادات Next.js و Turbopack
├── package.json                   # سجل الحزم والاعتمادات
├── postcss.config.mjs             # إعدادات معالج CSS لـ Tailwind v4
└── tsconfig.json                  # إعدادات مترجم TypeScript
```

---

## 💻 المتطلبات الأساسية

* **Node.js:** إصدار **20.x (LTS)** أو أحدث (يوصى بـ v20 أو v22).
* **NPM:** إصدار **10.x** أو أحدث.

---

## ⚡ التثبيت والتشغيل المحلي

### 1. الدخول لمجلد لوحة التحكم وتثبيت الحزم
```bash
cd client/Dashboard
npm install
```

### 2. إعداد ملف متغيرات البيئة (`.env.local`)
أنشئ ملفاً باسم `.env.local` في المجلد وأضف الآتي:
```env
# رابط خادم FastAPI
NEXT_PUBLIC_API_URL=http://localhost:8000

# مفاتيح Firebase للمتصفح (FCM Web Push)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. تشغيل خادم التطوير مع Turbopack
```bash
npm run dev
```
افتح المتصفح على: [http://localhost:3000](http://localhost:3000)

---

## 🔨 أوامر البناء والإنتاج

```bash
# فحص الأنواع واكتمال TypeScript وتوليد الصفحات الثابتة:
npm run build

# تشغيل النسخة المبنية للإنتاج:
npm run start

# فحص كود المشروع عبر ESLint:
npm run lint
```

---

## 📱 تطبيق الويب التقدمي (PWA & Service Worker)

* **التثبيت كتطبيق مستقل (Installable PWA):** يتيح ملف `manifest.json` للأب وأولياء الأمور تثبيت لوحة التحكم مباشرة كأيقونة تطبيق على الهواتف الذكية (iOS و Android) أو أجهزة سطح المكتب (Windows / Mac).
* **خدمة إشعارات الخلفية (`firebase-messaging-sw.js`):** تتيح استقبال التنبيهات الفورية حتى في حال إغلاق تبويب المتصفح، مما يضمن بقاء الوالد على اطلاع دائم.

---

## 👥 فريق العمل والمساهمة
مشروع تخرج لطلاب جامعة جدة (كلية علوم وهندسة الحاسب - قسم تقنية المعلومات / الذكاء الاصطناعي والأمن السيبراني).
* **إشراف:** قسم الأمن السيبراني وتقنية المعلومات - جامعة جدة.
* **رخصة الاستخدام:** ملكية أكاديمية وبحثية خاصة بمشروع التخرج 2026/2027.
