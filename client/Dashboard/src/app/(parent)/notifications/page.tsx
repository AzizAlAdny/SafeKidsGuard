"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  Loader2,
  ShieldAlert,
  Volume2,
  ShieldCheck,
  Shield,
  Info,
  Check,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/utils";

function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    // Gentle two-tone chime (F5 -> A5)
    osc.frequency.setValueAtTime(698.46, ctx.currentTime);
    osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.48);
  } catch {
    // Ignore audio restrictions
  }
}

export default function NotificationsPage() {
  const { user } = useAuthStore();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [webPushEnabled, setWebPushEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | "unsupported">("default");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingPush, setTestingPush] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    // Check browser notification permission
    if (typeof window !== "undefined") {
      if ("Notification" in window) {
        setBrowserPermission(Notification.permission);
      } else {
        setBrowserPermission("unsupported");
      }

      // Restore local sound setting if exists
      const savedSound = localStorage.getItem("skg_sound_alerts_enabled");
      if (savedSound !== null) {
        setSoundEnabled(savedSound === "true");
      }
    }

    async function loadPreferences() {
      try {
        const res = await api.get("/notifications/preferences");
        if (res.data) {
          setPhoneNumber(res.data.phone_number || res.data.whatsapp_phone || "");
          setWebPushEnabled(res.data.web_push_enabled ?? true);
        }
      } catch (err: any) {
        console.error("Failed to load preferences:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPreferences();
  }, []);

  const requestBrowserPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setBrowserPermission(perm);
        if (perm === "granted") {
          setMessage({ type: "success", text: "تم تفعيل إذن إشعارات المتصفح بنجاح!" });
        } else if (perm === "denied") {
          setMessage({
            type: "error",
            text: "تم حظر إذن الإشعارات من إعدادات المتصفح. يمكنك تفعيله من أيقونة القفل في شريط العنوان.",
          });
        }
      } catch (e) {
        console.error("Error requesting permission:", e);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await api.put("/notifications/preferences", {
        phone_number: phoneNumber.trim() || null,
        web_push_enabled: webPushEnabled,
        notifications_enabled: webPushEnabled,
      });

      // Persist sound preference locally
      localStorage.setItem("skg_sound_alerts_enabled", String(soundEnabled));

      if (res.data) {
        setPhoneNumber(res.data.phone_number || res.data.whatsapp_phone || "");
        setMessage({ type: "success", text: "تم حفظ تفضيلات الإشعارات بنجاح!" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: extractErrorMessage(err, "فشل حفظ تفضيلات الإشعارات، يرجى التأكد من صحة رقم الهاتف") });
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    setTestingPush(true);
    setMessage(null);

    // Play chime if enabled
    if (soundEnabled) {
      playNotificationSound();
    }

    try {
      const res = await api.post("/notifications/test-notification", {
        phone_number: phoneNumber.trim() || undefined,
      });

      setMessage({
        type: "success",
        text: res.data?.message || "تم إرسال إشعار التنبيه التجريبي بنجاح عبر نظام الإشعارات الفورية",
      });

      // Also trigger native desktop notification if permitted
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification("⚠️ Safe Kids Guard — تنبيه أمان تجريبي", {
            body: "نظام الإشعارات الفورية يعمل بكفاءة وأمان لحماية أجهزتكم.",
            icon: "/logo.jpeg",
          });
        } else if (Notification.permission !== "denied") {
          Notification.requestPermission().then((permission) => {
            setBrowserPermission(permission);
            if (permission === "granted") {
              new Notification("⚠️ Safe Kids Guard — تنبيه أمان تجريبي", {
                body: "نظام الإشعارات الفورية يعمل بكفاءة وأمان لحماية أجهزتكم.",
                icon: "/logo.jpeg",
              });
            }
          });
        }
      }
    } catch (err: any) {
      setMessage({ type: "error", text: extractErrorMessage(err, "فشل إرسال إشعار التنبيه التجريبي") });
    } finally {
      setTestingPush(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="animate-pulse space-y-2">
          <div className="h-7 bg-gray-200 rounded-xl w-72"></div>
          <div className="h-4 bg-gray-100 rounded-lg w-96"></div>
        </div>
        <div className="p-8 bg-white rounded-2xl border border-[#b5d7e3]/40 shadow-sm space-y-6 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
              <div className="space-y-2">
                <div className="h-5 bg-gray-200 rounded w-48"></div>
                <div className="h-3 bg-gray-100 rounded w-64"></div>
              </div>
            </div>
            <div className="w-11 h-6 bg-gray-200 rounded-full"></div>
          </div>
          <div className="h-10 bg-gray-100 rounded-xl"></div>
          <div className="h-16 bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#07365f]">إعدادات الإشعارات والتنبيهات الأمنية</h1>
          <p className="text-sm text-[#387b94] mt-1">
            إدارة قنوات التنبيه الفوري وإشعارات المتصفح لحماية أجهزة الأطفال فور رصد أي نشاط غير آمن.
          </p>
        </div>

        {/* Browser Permission Badge / Button */}
        <div>
          {browserPermission === "granted" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>إذن إشعارات المتصفح مفعّل</span>
            </span>
          )}
          {browserPermission === "denied" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-50 text-red-700 border border-red-200 shadow-sm" title="يمكنك إلغاء الحظر من إعدادات المتصفح">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span>الإشعارات محظورة بالمتصفح</span>
            </span>
          )}
          {browserPermission === "default" && (
            <button
              type="button"
              onClick={requestBrowserPermission}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition cursor-pointer shadow-sm"
            >
              <Bell className="w-3.5 h-3.5 text-amber-600" />
              <span>طلب إذن المتصفح</span>
            </button>
          )}
        </div>
      </div>

      {/* Success/Error Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm transition-all ${
            message.type === "success"
              ? "bg-[#eaf9ef] border-[#2abe50]/30 text-[#1a6f2f]"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-[#2abe50] flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-[#e33a0a] flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Primary Push Notifications Section */}
      <div className="p-6 md:p-8 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#edf5f8] text-[#159cb7] flex items-center justify-center flex-shrink-0 shadow-inner">
              <Bell className="w-6 h-6 text-[#159cb7]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-[#07365f]">إشعارات المتصفح والتطبيق اللحظية (Push Alerts)</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#1bc3e4]/15 text-[#107589]">
                  فورية ومجانية
                </span>
              </div>
              <p className="text-xs text-[#387b94] mt-0.5">
                تصلك تنبيهات الحظر الفورية مباشرة على هذا الجهاز فور رصد أي خطر على جهاز الطفل
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <label dir="ltr" className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input
              type="checkbox"
              checked={webPushEnabled}
              onChange={(e) => setWebPushEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1bc3e4]"></div>
          </label>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Emergency / Contact Phone Field */}
          <div>
            <label className="block text-sm font-semibold text-[#07365f] mb-1.5 text-right">
              رقم هاتف الطوارئ والتواصل بالأهل (اختياري)
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+966501234567 أو +201012345678 أو 0501234567"
                dir="ltr"
                className="w-full px-4 py-3 pl-11 rounded-xl border border-[#b5d7e3] focus:border-[#1bc3e4] focus:ring-2 focus:ring-[#1bc3e4]/20 outline-none transition text-sm text-[#07365f] font-mono bg-[#edf5f8]/30 placeholder:text-gray-400"
              />
              <Smartphone className="w-5 h-5 text-[#387b94] absolute left-3.5 top-3.5" />
            </div>
            <p className="text-xs text-[#387b94] mt-1.5">
              الصيغة المعتمدة: الرمز الدولي للدولة متبوعاً برقم الهاتف (مثال: +966501234567 أو 0501234567).
            </p>
          </div>

          {/* Sound Alert Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#edf5f8]/40 border border-[#b5d7e3]/30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-[#b5d7e3]/40 flex items-center justify-center text-[#159cb7] shadow-sm">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#07365f]">تفعيل صوت التنبيه للحالات عالية الخطورة</p>
                <p className="text-[11px] text-[#387b94]">تشغيل نغمة تنبيه صوتية عند اكتشاف تهديد بنسبة ثقة تتجاوز 85%</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="w-4 h-4 accent-[#1bc3e4] cursor-pointer"
            />
          </div>

          {/* Threat Categories Covered */}
          <div className="p-4 rounded-xl bg-white border border-[#b5d7e3]/30 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#07365f]">
              <ShieldCheck className="w-4 h-4 text-[#159cb7]" />
              <span>فئات المحتوى المشمولة بالحماية والتنبيه التلقائي:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#387b94]">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#edf5f8]/40 border border-[#b5d7e3]/20">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span className="font-semibold text-[#07365f]">التنمر الإلكتروني (Cyberbullying)</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#edf5f8]/40 border border-[#b5d7e3]/20">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span className="font-semibold text-[#07365f]">المحتوى غير اللائق والبالغين (Adult)</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#edf5f8]/40 border border-[#b5d7e3]/20">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span className="font-semibold text-[#07365f]">خطاب الكراهية والتمييز (Hate Speech)</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#edf5f8]/40 border border-[#b5d7e3]/20">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span className="font-semibold text-[#07365f]">التهديدات والعنف (Threat & Violence)</span>
              </div>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="p-4 rounded-xl bg-[#edf5f8]/50 border border-[#b5d7e3]/40 text-xs text-[#07365f] space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-[#07365f]">
              <ShieldAlert className="w-4 h-4 text-[#e33a0a]" />
              <span>معاينة إشعار الأمان الفوري:</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-[#b5d7e3]/30 text-xs leading-relaxed text-[#07365f] text-right shadow-sm">
              ⚠️ <strong>حارس الأطفال الآمن</strong>: تم رصد وحظر محتوى <strong>تنمر إلكتروني</strong> على جهاز <strong>سعد</strong> بنسبة ثقة <strong>94%</strong>. تم اتخاذ الإجراء الوقائي فوراً وحجب المحتوى.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-[#159cb7] to-[#1bc3e4] hover:opacity-95 shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>حفظ الإعدادات</span>
            </button>

            <button
              type="button"
              onClick={handleTestNotification}
              disabled={testingPush || !webPushEnabled}
              className="px-4 py-2.5 rounded-xl font-semibold text-[#07365f] bg-[#edf5f8] hover:bg-[#b5d7e3]/40 border border-[#b5d7e3] transition flex items-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
            >
              {testingPush ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#159cb7]" />
              ) : (
                <Send className="w-4 h-4 text-[#159cb7]" />
              )}
              <span>إرسال إشعار تجريبي فوري</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
