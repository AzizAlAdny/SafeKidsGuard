# Safe Kids Guard — تطبيق مراقبة وحماية جهاز الطفل 📱🛡️

[![Platform](https://img.shields.io/badge/Platform-Android_8.0+_(API_26--35)-green.svg)](https://developer.android.com/)
[![Kotlin](https://img.shields.io/badge/Kotlin-2.0+-7F52FF.svg)](https://kotlinlang.org/)
[![Jetpack Compose](https://img.shields.io/badge/Jetpack_Compose-Material_3-4285F4.svg)](https://developer.android.com/jetpack/compose)
[![Architecture](https://img.shields.io/badge/Architecture-Clean_%2F_MVVM_%2B_Hilt-orange.svg)](https://developer.android.com/training/dependency-injection/hilt-android)
[![Networking](https://img.shields.io/badge/Networking-Retrofit_2_%2B_OkHttp-blue.svg)](https://square.github.io/retrofit/)
[![University](https://img.shields.io/badge/University_of_Jeddah-Graduation_Project-07365f.svg)](https://www.uj.edu.sa/)

**Safe Kids Guard Child Monitoring App** هو تطبيق أندرويد متطور مخصص للتثبيت على أجهزة الأطفال، يعمل كحارس أمني ذكي ومستمر لمراقبة المحتوى النصي المعروض على شاشة الجهاز وحماية الطفل فورياً من التنمر الإلكتروني، المحتوى غير اللائق، العنف، وخطاب الكراهية.

يعد التطبيق العميل الميداني لمنظومة مشروع تخرج جامعة جدة (2026/2027)، ويتكامل بصورة مباشرة مع خادم الذكاء الاصطناعي (**FastAPI**) ولوحة تحكم ولي الأمر (**Next.js Dashboard**).

---

## 📑 جدول المحتويات
1. [المزايا والقدرات التقنية](#-المزايا-والقدرات-التقنية)
2. [آلية الرصد والحماية (How It Works)](#-آلية-الرصد-والحماية)
3. [الأذونات المطلوبة وسياسة الخصوصية (Privacy & Permissions)](#-الأذونات-المطلوبة-وسياسة-الخصوصية)
4. [هيكلية مجلدات المشروع (Project Structure)](#-هيكلية-مجلدات-المشروع)
5. [المتطلبات التقنية وبيئة العمل (Prerequisites)](#-المتطلبات-التقنية-وبيئة-العمل)
6. [الإعداد والربط مع الخادم (Configuration)](#-الإعداد-والربط-مع-الخادم)
7. [البناء والتشغيل (Build & Run)](#-البناء-والتشغيل)
8. [سجل نقاط النهاية المتصلة (Network API Integration)](#-سجل-نقاط-النهاية-المتصلة)

---

## 🚀 المزايا والقدرات التقنية

* **خدمة الوصول المتقدمة للرصد الحي (`MonitoringAccessibilityService`):**
  * مراقبة تبدلات النصوص المعروضة داخل التطبيقات والمتصفحات (`TYPE_WINDOW_CONTENT_CHANGED` و `TYPE_VIEW_TEXT_CHANGED`).
  * تفتيش تكراري ذكي للشجرة البصرية لواجهة المستخدم (Accessibility Node Tree).
* **حماية صارمة للخصوصية (Privacy by Design):**
  * تجاهل واستثناء حقول كلمات المرور والبيانات الحساسة كلياً (`node.isPassword == true`).
  * عدم حفظ نصوص التصفح الشخصية؛ يقتصر الإرسال على عينات مقتطعة ومطابقة للتهديدات فقط.
* **التكامل اللحظي مع خادم الذكاء الاصطناعي:**
  * إرسال النصوص المشبوهة لمحرك الفحص المزدوج (**AraBERT v2 + CAMeLBERT**).
  * استلام القرار اللحظي (`ALLOWED` أو `BLOCKED`) بنسبة ثقة دقيقة خلال أقل من 100 ميلي ثانية.
* **مزامنة سياسات ولي الأمر محلياً:**
  * جلب وتطبيق قواعد الحظر الأبوية (فئات التهديد، حظر حزم تطبيقات معينة مثل TikTok أو Instagram، وحدود وقت الشاشة).
* **الاستمرارية والتشغيل التلقائي (`BootReceiver`):**
  * إعادة تفعيل خدمات الحماية والمراقبة تلقائياً عند إعادة تشغيل الهاتف (`BOOT_COMPLETED`).
* **واجهة مستخدم عصرية بـ Jetpack Compose Material 3:**
  * تصميم عربي مريح وداعم لـ RTL بألوان الهوية الرسمية (Navy Blue & Cyan).
  * شاشات سهلة لإرشاد ولي الأمر أثناء منح الصلاحيات وربط جهاز الطفل برمز الاقتران (PIN / Token).

---

## 🔍 آلية الرصد والحماية (How It Works)

```
       تطبيق على جهاز الطفل (تيك توك / يوتيوب / متصفح)
                             │
                             ▼ (حدث تغير النص على الشاشة)
             [MonitoringAccessibilityService]
                             │
                             ├─ هل الحقل كلمة مرور أو حساس؟ ──▶ [تجاهل فوري للخصوصية]
                             │
                             ▼ (نص عادي > 3 أحرف)
          اقتطاع النص وتجهيز سياق التطبيق (Context App)
                             │
                             ▼ (Retrofit POST /classification/predict)
                   [FastAPI AI Backend]
                             │
               ┌─────────────┴─────────────┐
               ▼                           ▼
        [قرار: ALLOWED]             [قرار: BLOCKED]
         استمرار التصفح          1. حجب المحتوى على شاشة الطفل
                                2. تسجيل الحدث في سجل الأنشطة
                                3. إرسال تنبيه واتساب فوري للوالد
```

---

## 🔒 الأذونات المطلوبة وسياسة الخصوصية

يطلب التطبيق حزمة محددة من أذونات أندرويد لضمان استمرارية الحماية دون انتهاك خصوصية الطفل:

| الإذن البرمجي | الغرض والوظيفة |
|---|---|
| `android.permission.INTERNET` | التواصل مع خادم الذكاء الاصطناعي وإرسال الأنشطة وتلقي القرارات. |
| `android.permission.BIND_ACCESSIBILITY_SERVICE` | قراءة محتوى الشاشة البريء واكتشاف النصوص المؤذية والمسيئة. |
| `android.permission.PACKAGE_USAGE_STATS` | تتبع معدل استخدام التطبيقات وحساب وقت الشاشة اليومي للطفل. |
| `android.permission.RECEIVE_BOOT_COMPLETED` | ضمان استئناف خدمة الحماية تلقائياً بمجرد إقلاع النظام. |
| `android.permission.FOREGROUND_SERVICE` | إبقاء التطبيق يعمل في الخلفية دون أن يوقفه نظام أندرويد لتوفير البطارية. |
| `android.permission.POST_NOTIFICATIONS` | إظهار إشعارات النظام الدائمة للمحافظة على شفافية العمل أمام الطفل والوالد. |

---

## 📁 هيكلية مجلدات المشروع

```
client/child_monitoring_app/
├── app/
│   ├── build.gradle.kts           # إعدادات الحزم، Compose، Hilt، والـ SDK
│   ├── proguard-rules.pro         # قواعد حماية وتقليص الكود للإنتاج
│   └── src/
│       └── main/
│           ├── AndroidManifest.xml # تسجيل الأنشطة، الخدمات، والأذونات
│           ├── java/sa/safekids/guard/
│           │   ├── SafeKidsGuardApp.kt  # فئة التطبيق الرئيسية وتهيئة Hilt
│           │   ├── network/
│           │   │   └── ApiService.kt    # واجهات Retrofit للتواصل مع الخادم
│           │   ├── receiver/
│           │   │   └── BootReceiver.kt  # مستقبل إعادة تشغيل الجهاز
│           │   ├── service/
│           │   │   └── MonitoringAccessibilityService.kt # خدمة رصد الشاشة
│           │   └── ui/
│           │       ├── MainActivity.kt  # واجهة Compose لحالة الحماية والربط
│           │       └── theme/           # ألوان وخطوط الهوية البصرية (Theme)
│           └── res/
│               ├── values/              # النصوص والألوان
│               └── xml/                 # إعدادات Accessibility Service
├── gradle/
│   └── libs.versions.toml         # سجل إصدارات الحزم الموحدة (Version Catalog)
├── build.gradle.kts               # إعدادات مشروع أندرويد العام
├── gradle.properties              # إعدادات ذاكرة Gradle وJVM
└── settings.gradle.kts            # ربط مستودعات Maven والموديولات
```

---

## 💻 المتطلبات التقنية وبيئة العمل

* **Android Studio:** إصدار **Ladybug (2024.2+)** أو **Meerkat** أو أحدث.
* **JDK:** إصدار **Java 17 (LTS)**.
* **Android SDK:**
  * **Compile SDK:** 35 (Android 15)
  * **Target SDK:** 35
  * **Min SDK:** 26 (Android 8.0 Oreo وما فوق - يغطي أكثر من 95% من الأجهزة النشطة).

---

## ⚙️ الإعداد والربط مع الخادم

يتم ضبط رابط خادم الـ Backend داخل إعدادات شبكة Retrofit في التطبيق:

### 1. أثناء التطوير على محاكي أندرويد (Android Emulator)
يشير المحاكي إلى جهاز الحاسب المضيف عبر العنوان الافتراضي:
```kotlin
const val BASE_URL = "http://10.0.2.2:8000/"
```

### 2. أثناء الفحص على هاتف أندرويد حقيقي عبر Wi-Fi
قم بوضع عنوان الـ IP المحلي لجهاز الكمبيوتر الذي يشغل خادم FastAPI (مثال):
```kotlin
const val BASE_URL = "http://192.168.1.50:8000/"
```

### 3. بيئة الإنتاج السحابية (Cloud Run / VPS)
```kotlin
const val BASE_URL = "https://api.safekidsguard.uj.edu.sa/"
```

---

## 🔨 البناء والتشغيل

### عبر موجه الأوامر (Terminal / Gradle Wrapper):
```bash
# الانتقال إلى مجلد التطبيق
cd client/child_monitoring_app

# بناء نسخة التطوير (Debug APK):
./gradlew assembleDebug

# تثبيت التطبيق مباشرة على المحاكي أو الهاتف المتصل:
./gradlew installDebug
```

### مراقبة سجلات الرصد الحية (Logcat Monitoring):
لمتابعة النصوص التي يتم رصدها وفحصها لحظياً:
```bash
adb logcat -s SafeKidsGuard_Monitor
```

---

## 📡 سجل نقاط النهاية المتصلة (Network API Integration)

يتواصل التطبيق مع خادم FastAPI عبر الواجهة المعرفة في `ApiService.kt`:

| الدالة | المسار (Endpoint) | وظيفة الاستدعاء في التطبيق |
|---|---|---|
| `POST` | `/auth/login` | تسجيل دخول حساب الطفل المخصص واستلام رمز الـ JWT. |
| `POST` | `/classification/predict` | إرسال النص المعروض على الشاشة للفحص اللحظي بالذكاء الاصطناعي. |
| `GET` | `/policies/{child_id}` | استرجاع سياسة الحماية المحددة من الوالد (التطبيقات الممنوعة، ساعات النوم). |
| `POST` | `/activity` | تسجيل الأنشطة اليومية في قاعدة البيانات ليتمكن الوالد من مراجعتها. |

---
