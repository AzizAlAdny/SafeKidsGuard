# Safe Kids Guard — Complete Real-World Testing Guide (Phone, Server & Dashboard) 🛡️📱🖥️

This guide provides step-by-step instructions, exact URLs, and copy-paste Arabic test examples to verify **every use case and requirement** of **Safe Kids Guard** across:
1. **FastAPI AI & Policy Backend (`server/`)**
2. **Next.js Parent & Admin Dashboard (`client/Dashboard/`)**
3. **Android Child Monitoring Application (`client/child_monitoring_app/`)** on a **Real Android Phone** or **Android Emulator**.

---

## 📑 Table of Contents
1. [Phase 1: Starting the Server, Dashboard & Phone Connection](#phase-1-starting-the-server-dashboard--phone-connection)
2. [Phase 2: Complete URL Directory (Dashboard & Server APIs)](#phase-2-complete-url-directory-dashboard--server-apis)
3. [Phase 3: Step-by-Step Test Cases (All 12 Scenarios with Examples & URLs)](#phase-3-step-by-step-test-cases-all-12-scenarios-with-examples--urls)
   - [Case 1: Parent Registration, Child Creation & 6-Digit PIN Pairing](#case-1-parent-registration-child-creation--6-digit-pin-pairing-uc-p1-uc-p2-uc-c1)
   - [Case 2: Safe Content & False-Positive Immunity (Sports, Medical, Education)](#case-2-safe-content--false-positive-immunity-safe)
   - [Case 3: Cyberbullying & Dialectal/Arabizi Harassment](#case-3-cyberbullying--dialectalarabizi-harassment-cyberbullying)
   - [Case 4: Violence, Weapons & Self-Harm Threats](#case-4-violence-weapons--self-harm-threats-violence)
   - [Case 5: Sexual & Inappropriate Content](#case-5-sexual--inappropriate-content-sexual)
   - [Case 6: Hate Speech & Incitement](#case-6-hate-speech--incitement-hate_speech)
   - [Case 7: Custom Blacklisted Websites / URLs](#case-7-custom-blacklisted-websites--urls-blacklisted_url)
   - [Case 8: Blocked Android Applications (App Blacklist)](#case-8-blocked-android-applications-blocked_app)
   - [Case 9: Bedtime Schedule & Daily Screen-Time Limit](#case-9-bedtime-schedule--daily-screen-time-limit-bedtime--screen_time)
   - [Case 10: Child Access Appeal (`UC-C5`) & Admin Review (`UC-A4`)](#case-10-child-access-appeal-uc-c5--admin-review-uc-a4)
   - [Case 11: Analytics, Arabic BiDi PDF Report & Push Notification Test](#case-11-analytics-arabic-bidi-pdf-report--push-notification-test-uc-p6-uc-p7)
   - [Case 12: Tamper Protection & Parent-Password Unpairing](#case-12-tamper-protection--parent-password-unpairing-fr7)

---

## Phase 1: Starting the Server, Dashboard & Phone Connection

### 1. Find Your Computer's Local Wi-Fi IP Address (For Real Phone Testing)
Ensure your computer and your Android phone are connected to the **same Wi-Fi network** (or mobile hotspot). Run in PowerShell:
```powershell
ipconfig
```
Look for **IPv4 Address** under your active Wi-Fi adapter (for example: `192.168.1.50`).

* **On a Real Android Phone:** Use `http://192.168.1.50:8000/` (replace with your PC's IPv4).
* **On an Android Emulator:** Use `http://10.0.2.2:8000/`.

---

### 2. Start the FastAPI Backend Server (`Port 8000`)
Open **Terminal 1 (PowerShell)**:
```powershell
cd server
.\.venv\Scripts\Activate.ps1
alembic upgrade head
python create_admin.py
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
> **Note:** `--host 0.0.0.0` is required so your physical Android phone can reach the server over Wi-Fi.

Verify the server is live by opening:
* **Health Check:** `http://localhost:8000/api/v1/health`
* **Swagger Interactive API Docs:** `http://localhost:8000/docs`

---

### 3. Start the Next.js Parent & Admin Dashboard (`Port 3000`)
Open **Terminal 2 (PowerShell)**:
```powershell
cd client/Dashboard
npm run dev
```
Open your browser at:
* **Dashboard Home:** `http://localhost:3000`

---

### 4. Install & Launch the Android Child App on Phone or Emulator
The compiled Debug APK is located at:
`client/child_monitoring_app/app/build/outputs/apk/debug/app-debug.apk`

To install directly via USB (`adb`) or Emulator:
```powershell
cd client/child_monitoring_app
adb install -r app/build/outputs/apk/debug/app-debug.apk
```
To watch real-time monitoring logs from the phone in your terminal:
```powershell
adb logcat -s SafeKidsGuard_Monitor SafeKidsGuard_Api
```

---

## Phase 2: Complete URL Directory (Dashboard & Server APIs)

### 🖥️ Next.js Web Dashboard URLs (`http://localhost:3000`)

| Role | Feature / Page | Full URL |
| :--- | :--- | :--- |
| **Public** | Sign In (Parent & Admin) | `http://localhost:3000/login` |
| **Public** | Parent Account Registration | `http://localhost:3000/register` |
| **Parent** | Main Safety Overview Dashboard | `http://localhost:3000/dashboard` |
| **Parent** | Child Accounts & 6-Digit PIN Generator | `http://localhost:3000/children` |
| **Parent** | Protection Policies (Sensitivity, Apps, URLs, Bedtime) | `http://localhost:3000/policies` |
| **Parent** | Real-Time Threat Alerts Feed | `http://localhost:3000/alerts` |
| **Parent** | Live Activity Audit Log (Allowed & Blocked) | `http://localhost:3000/activity` |
| **Parent** | Safety Analytics & Arabic PDF Export | `http://localhost:3000/reports` |
| **Parent** | Web Push Notification Preferences & Test | `http://localhost:3000/notifications` |
| **Admin** | System Overview & Macro Telemetry | `http://localhost:3000/admin` |
| **Admin** | User Account Management (`UC-A1`) | `http://localhost:3000/admin/users` |
| **Admin** | AI Models Status (`AraBERTv2` + `CAMeLBERT`) | `http://localhost:3000/admin/models` |
| **Admin** | Flagged Content & Child Appeals Review (`UC-A4`) | `http://localhost:3000/admin/flagged` |
| **Admin** | Global AI Threshold & System Settings (`UC-A5`) | `http://localhost:3000/admin/settings` |

---

### ⚙️ FastAPI Server Endpoints (`http://localhost:8000`)

| Method | Full Endpoint URL | Used By | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `http://localhost:8000/docs` | Browser / Tester | Interactive Swagger UI for direct API testing |
| `GET` | `http://localhost:8000/api/v1/health` | All | Health & version status check |
| `POST` | `http://localhost:8000/api/v1/auth/register` | Dashboard | Register parent account |
| `POST` | `http://localhost:8000/api/v1/auth/login` | Dashboard | Authenticate parent or admin |
| `POST` | `http://localhost:8000/api/v1/auth/children` | Dashboard | Create child profile |
| `POST` | `http://localhost:8000/api/v1/auth/children/{child_id}/pairing-pin` | Dashboard | Generate 6-digit pairing PIN |
| `POST` | `http://localhost:8000/api/v1/auth/pair-device` | Android Phone | Pair child device with 6-digit PIN |
| `POST` | `http://localhost:8000/api/v1/auth/refresh` | Android / Web | Rotate expired JWT access token |
| `POST` | `http://localhost:8000/api/v1/auth/unpair-device` | Android Phone | Verify parent password & unpair device |
| `POST` | `http://localhost:8000/api/v1/classification/predict` | Android Phone | Classify on-screen Arabic text via AI & policies |
| `GET` | `http://localhost:8000/api/v1/policies/{child_id}` | Android / Web | Fetch child's active protection policy |
| `PUT` | `http://localhost:8000/api/v1/policies/{child_id}` | Dashboard | Update child's protection policy |
| `POST` | `http://localhost:8000/api/v1/activity` | Android Phone | Log local policy blocks & activity events |
| `GET` | `http://localhost:8000/api/v1/activity` | Dashboard | Paginated activity logs with filters |
| `GET` | `http://localhost:8000/api/v1/alerts` | Dashboard | List threat alerts for parent |
| `POST` | `http://localhost:8000/api/v1/alerts/request-access` | Android Phone | Submit child access appeal (`UC-C5`) |
| `GET` | `http://localhost:8000/api/v1/reports/summary` | Dashboard | Safety score & category breakdown |
| `GET` | `http://localhost:8000/api/v1/reports/export-pdf` | Dashboard | Download Arabic BiDi PDF report |
| `GET` | `http://localhost:8000/api/v1/admin/flagged` | Admin Portal | List flagged alerts & pending appeals |
| `PATCH` | `http://localhost:8000/api/v1/admin/flagged/{alert_id}` | Admin Portal | Approve false positive or confirm threat |

---

## Phase 3: Step-by-Step Test Cases (All 12 Scenarios with Examples & URLs)

### Case 1: Parent Registration, Child Creation & 6-Digit PIN Pairing (`UC-P1`, `UC-P2`, `UC-C1`)

1. **Dashboard — Register or Log In:**
   - Open `http://localhost:3000/register` and create a parent account:
     - **Full Name:** `أحمد العتيبي`
     - **Email:** `parent@test.com`
     - **Phone:** `0501234567` (automatically normalized to `966501234567`)
     - **Password:** `Parent@123456`
2. **Dashboard — Create Child & Generate PIN:**
   - Go to `http://localhost:3000/children`.
   - Click **إضافة طفل (Add Child)** → Enter Name: `سارة` and Age: `10`.
   - Click **توليد رمز اقتران (Generate Pairing PIN)** on Sarah's card.
   - Copy the generated 6-digit PIN (e.g., `482-915`).
3. **Android Phone — Configure Server URL & Pair Device:**
   - Open **حارس الأطفال الآمن (Safe Kids Guard)** on the phone.
   - Tap **إعدادات اتصال الخادم (للمطورين)** at the bottom:
     - Emulator: `http://10.0.2.2:8000/`
     - Real Phone: `http://<YOUR_PC_WIFI_IP>:8000/`
   - Enter the 6-digit PIN (`482-915`) and tap **ربط وتفعيل الحماية**.
4. **Android Phone — Enable Permissions:**
   - Notice the status banner initially warns in amber: `"الجهاز مقترن — يرجى تفعيل إمكانية الوصول"`.
   - Tap **إعدادات إمكانية الوصول (غير مفعل ⚠️ - اضغط للتفعيل)** → Find **حارس الأطفال الآمن** in Android Accessibility Settings and toggle it **ON**.
   - Tap **إذن إحصائيات استخدام التطبيقات** → Toggle **ON** for **حارس الأطفال الآمن**.
   - Return to the app: the banner immediately turns green (`"الحماية مفعلة ونشطة (سارة)"`) and both buttons show `(مفعل ✓)`.

---

### Case 2: Safe Content & False-Positive Immunity (`SAFE`)

**Goal:** Verify that normal Arabic browsing and tricky words containing substrings like `دم` (blood) or `مخدرات` (drugs in awareness context) are **ALLOWED** without interrupting the child.

* **Where to test on Phone:** Open Chrome, Notes, WhatsApp, or YouTube search and type or view any of these texts:

| Sub-Case | Arabic Test Text to Type / View on Phone | Expected Verdict | Category | Phone Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Normal Study Text** | `بسم الله الرحمن الرحيم، درس العلوم للصف الخامس الابتدائي` | `ALLOWED` | `SAFE` | Normal usage continues |
| **Sports (`القدم` / `القادم`)** | `مباراة كرة القدم ستقام الأسبوع القادم في مدينة جدة` | `ALLOWED` | `SAFE` | Normal usage continues (no false positive on `دم`) |
| **Medical (`تبرع بالدم`)** | `حملة التبرع بالدم وفحص فصيلة الدم في المستشفى الجامعي` | `ALLOWED` | `SAFE` | Normal usage continues |
| **Awareness (`مكافحة المخدرات`)** | `ندوة مدرسية حول الوقاية من المخدرات ومكافحة التنمر` | `ALLOWED` | `SAFE` | Normal usage continues |

* **Where to verify on Dashboard:**
  - Open `http://localhost:3000/activity` → You will see `ALLOWED` (`آمن`) activity entries with `[SAFE_CONTENT_REDACTED]` to protect the child's privacy!

---

### Case 3: Cyberbullying & Dialectal/Arabizi Harassment (`CYBERBULLYING`)

**Goal:** Verify real-time detection and immediate screen blocking across Modern Standard Arabic (MSA), Gulf, Egyptian, Levantine dialects, and Arabizi.

* **Where to test on Phone:** Open any app (e.g., Chrome, Messages, Notes) and type any of the following phrases:

| Dialect / Style | Arabic Test Text to Type on Phone | Expected Verdict | Confidence |
| :--- | :--- | :--- | :--- |
| **MSA (فصحى)** | `أنت غبي وفاشل ولا أحد يحبك في المدرسة` | `BLOCKED` | `~94%` |
| **Gulf (خليجي)** | `وش ذا الغباء اذلف يا حمار محد يحبك` | `BLOCKED` | `~94%` |
| **Egyptian (مصري)** | `انت عيل فاشل ومحدش بيحبك وهضربك` | `BLOCKED` | `~94%` |
| **Arabizi + Elongation** | `انت غبيييييي و يا 7mar محد يحبك` | `BLOCKED` | `~94%` |
| **Severe Bullying** | `بفضحك وبنشر صورك والكل يكرهك روح انتحر` | `BLOCKED` | `~94%` |

* **Expected Result on Phone:**
  1. Within ~1.5 seconds, the phone automatically exits the current app (`GLOBAL_ACTION_HOME`).
  2. Launches the red **Safe Kids Guard Block Screen**: `"⚠️ تم إيقاف المحتوى لحمايتك من التنمر والإساءة"`.
* **Expected Result on Dashboard:**
  1. Open `http://localhost:3000/alerts` → New `CYBERBULLYING` (`تنمر إلكتروني`) alert appears with the text snippet and app package name.
  2. Open `http://localhost:3000/activity` → Logged as `BLOCKED` (`محظور`).

---

### Case 4: Violence, Weapons & Self-Harm Threats (`VIOLENCE`)

**Goal:** Verify immediate blocking when violent threats, weapons, or self-harm phrases appear on screen.

* **Where to test on Phone:** Type or view any of the following phrases in any app on the phone:

| Threat Type | Arabic Test Text to Type on Phone | Expected Verdict | Category |
| :--- | :--- | :--- | :--- |
| **Direct Weapon Threat** | `سأقتلك بالسكين اليوم واكسر راسك` | `BLOCKED` | `VIOLENCE` (`0.93`) |
| **Dialectal Assault Threat** | `والله لبذبحك واضربك ضرب مبرح بالميدان` | `BLOCKED` | `VIOLENCE` (`0.93`) |
| **Explosives / Armed Attack** | `تهديد بالقتل وتفجير قنبلة وهجوم مسلح` | `BLOCKED` | `VIOLENCE` (`0.93`) |
| **Self-Harm (`انتحار`)** | `أنا تعبت وبدي انتحر واخلص من حياتي` | `BLOCKED` | `VIOLENCE` (`0.93`) |

* **Verify at:**
  - Phone shows `"⚠️ تم إيقاف المحتوى لحمايتك من مشاهد العنف والتهديد"`.
  - Dashboard Alerts: `http://localhost:3000/alerts?category=VIOLENCE`

---

### Case 5: Sexual & Inappropriate Content (`SEXUAL`)

**Goal:** Verify immediate blocking of explicit or grooming content.

* **Where to test on Phone:** Type or search any of the following in Chrome or any messaging app:

| Sub-Case | Arabic Test Text to Type on Phone | Expected Verdict | Category |
| :--- | :--- | :--- | :--- |
| **Explicit Media** | `مشاهدة افلام اباحية ومقاطع اباحية للكبار` | `BLOCKED` | `SEXUAL` (`0.96`) |
| **Online Grooming** | `تعال خاص نتعرى وارسل صور عارية وخاصة` | `BLOCKED` | `SEXUAL` (`0.96`) |

* **Verify at:**
  - Phone dismisses the app immediately and displays `"⚠️ تم إيقاف المحتوى غير اللائق لحمايتك"`.
  - Dashboard Alerts: `http://localhost:3000/alerts`

---

### Case 6: Hate Speech & Incitement (`HATE_SPEECH`)

**Goal:** Verify detection of racial, sectarian, or dehumanizing hate speech.

* **Where to test on Phone:** Type or view any of the following:

| Sub-Case | Arabic Test Text to Type on Phone | Expected Verdict | Category |
| :--- | :--- | :--- | :--- |
| **Dehumanization** | `هذول حثالة واطردوهم ما يستاهلون يعيشون معنا` | `BLOCKED` | `HATE_SPEECH` (`0.91`) |
| **Sectarian / Racial** | `خطاب كراهية وعنصرية وطائفية ضد الجميع` | `BLOCKED` | `HATE_SPEECH` (`0.91`) |

* **Verify at:**
  - Phone displays `"⚠️ تم إيقاف المحتوى لاحتوائه على خطاب كراهية"`.
  - Dashboard Alerts: `http://localhost:3000/alerts`

---

### Case 7: Custom Blacklisted Websites / URLs (`BLACKLISTED_URL`)

**Goal:** Verify that parent-defined blacklisted domains are blocked both locally on the phone (<50ms) and by the server, and logged to the Parent Dashboard.

1. **Configure on Dashboard (`http://localhost:3000/policies`):**
   - Select child `سارة`.
   - Under **قائمة المواقع والروابط المحظورة (Blacklisted URLs)**, add:
     - `badsite.com`
     - `unsafe-game.net`
     - `example.org`
   - Click **حفظ السياسات (Save Policies)**.
2. **Sync Policy on Phone:**
   - Either wait for the automatic sync or re-open the Safe Kids Guard app on the phone.
3. **Test on Phone:**
   - Open Chrome (or any app) and type `https://www.badsite.com/play` or `example.org`.
4. **Expected Result:**
   - The phone immediately navigates Home and shows the block overlay: `"الرابط محظور بواسطة إعدادات الحماية: badsite.com"`.
   - Open `http://localhost:3000/activity` → A new `BLACKLISTED_URL` (`BLOCKED`) entry is recorded in the activity table!

---

### Case 8: Blocked Android Applications (`BLOCKED_APP`)

**Goal:** Verify instant app blocking when a child opens a restricted application.

1. **Configure on Dashboard (`http://localhost:3000/policies`):**
   - Under **حظر التطبيقات (Blocked Applications)**, toggle or add any installed app package on your test phone, for example:
     - **YouTube:** `com.google.android.youtube`
     - **TikTok:** `com.zhiliaoapp.musically`
     - **Instagram:** `com.instagram.android`
     - **Roblox:** `com.roblox.client`
   - Click **حفظ السياسات (Save Policies)**.
2. **Test on Phone:**
   - Try to open the blocked app (e.g., YouTube or TikTok) on the phone.
3. **Expected Result:**
   - Within `<50ms`, the app is dismissed to the Home screen and Safe Kids Guard displays:
     `"هذا التطبيق محظور بواسطة إعدادات العائلة"`.
   - Open `http://localhost:3000/activity` → Shows `BLOCKED_APP` (`BLOCKED`) with the app's package name.

---

### Case 9: Bedtime Schedule & Daily Screen-Time Limit (`BEDTIME` & `SCREEN_TIME`)

**Goal:** Verify offline-capable time restrictions on the child's phone.

1. **Configure on Dashboard (`http://localhost:3000/policies`):**
   - Set **وقت النوم (Bedtime Start / End)** so that the **current time** falls inside the window (for example, if it is currently `19:00`, set Bedtime from `18:00` to `06:00`).
   - Or set **الحد اليومي للشاشة (Daily Screen Time Limit)** to `1` minute.
   - Click **حفظ السياسات (Save Policies)**.
2. **Test on Phone:**
   - Open any app (e.g., Chrome or Gallery).
3. **Expected Result:**
   - Phone immediately blocks access and displays `"🌙 حان وقت النوم المحدد من قِبل والديك"` (or `"⏳ انتهى الوقت اليومي المسموح لاستخدام الجهاز"`).
   - Logged automatically to `http://localhost:3000/activity`.
   - *(Remember to reset Bedtime back to `21:00` – `06:00` and Screen Time to `120` mins after testing!)*

---

### Case 10: Child Access Appeal (`UC-C5`) & Admin Review (`UC-A4`)

**Goal:** Test the complete false-positive appeal workflow from the Child Phone → Parent Alerts → System Administrator Review.

1. **On the Android Phone (After any block in Cases 3–8):**
   - On the red **"تم حظر المحتوى لحمايتك"** card in Safe Kids Guard, tap the button:
     **`طلب السماح (Appeal)`**
   - A toast confirms: `"تم إرسال طلب المراجعة لولي الأمر بنجاح"`, and the button changes to `"تم إرسال الطلب ✓"`.
2. **On the Parent Dashboard (`http://localhost:3000/alerts`):**
   - Refresh `http://localhost:3000/alerts` → The alert badge updates to **`طلب سماح بالوصول (ACCESS_REQUESTED)`**.
3. **On the Admin Dashboard (`http://localhost:3000/admin/flagged`):**
   - Log in as Admin at `http://localhost:3000/login`:
     - **Email:** `admin@safekidsguard.com`
     - **Password:** `Admin@123456`
   - Navigate to `http://localhost:3000/admin/flagged`.
   - Locate the child's appeal and click **قبول (إيجابية خاطئة / Approve False Positive)** or **تأكيد التهديد (Confirm Threat)**.

---

### Case 11: Analytics, Arabic BiDi PDF Report & Push Notification Test (`UC-P6`, `UC-P7`)

1. **Test Instant Security Notification (`http://localhost:3000/notifications`):**
   - Log in as Parent and open `http://localhost:3000/notifications`.
   - Enable Web Push Notifications and click **إرسال إشعار تجريبي (Send Test Notification)**.
   - Verify the instant browser/in-app alert appears.
2. **Test Safety Analytics & Arabic PDF Export (`http://localhost:3000/reports`):**
   - Open `http://localhost:3000/reports`.
   - Inspect the **Digital Safety Score (مؤشر الأمان الرقمي)** and category breakdown charts.
   - Click **تصدير تقرير PDF (Export PDF Report)** (calls `GET http://localhost:8000/api/v1/reports/export-pdf`).
   - Open the downloaded PDF file and verify the Arabic RTL text and tables render properly.

---

### Case 12: Tamper Protection & Parent-Password Unpairing (`FR7`)

**Goal:** Verify that a child cannot tamper with the server URL or unpair the device without the parent's password.

1. **Test Server URL Tamper Lock on Phone:**
   - While the phone is paired, tap **إعدادات اتصال الخادم (للمطورين)** at the bottom of the phone screen.
   - Verify the URL text field is **locked (`readOnly`)** with the message:
     `"🔒 لا يمكن تعديل عنوان الخادم أثناء اقتران الجهاز (يتطلب إلغاء الاقتران بكلمة مرور ولي الأمر)"`.
2. **Test Wrong Parent Password on Unpair:**
   - Tap **إلغاء الاقتران (يتطلب كلمة مرور ولي الأمر)**.
   - Enter a wrong password (e.g., `wrong123`) and tap **تأكيد الإلغاء**.
   - Verify the server rejects it (`HTTP 401`) and the phone shows `"كلمة مرور ولي الأمر غير صحيحة"`, keeping protection active.
3. **Test Valid Parent Password on Unpair:**
   - Enter the real parent password (`Parent@123456`) and tap **تأكيد الإلغاء**.
   - Verify the device unpairs cleanly and returns to the 6-digit PIN pairing screen.
