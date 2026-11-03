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
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";

export default function NotificationsPage() {
  const { user } = useAuthStore();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [webPushEnabled, setWebPushEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingPush, setTestingPush] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
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
      if (res.data) {
        setPhoneNumber(res.data.phone_number || res.data.whatsapp_phone || "");
        setMessage({ type: "success", text: "تم حفظ تفضيلات الإشعارات بنجاح!" });
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const msg = typeof detail === "string" ? detail : "فشل حفظ التفضيلات، يرجى التأكد من صحة رقم الهاتف";
      setMessage({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    setTestingPush(true);
    setMessage(null);

    try {
      const res = await api.post("/notifications/test-notification", {
        phone_number: phoneNumber.trim() || undefined,
      });
      setMessage({
        type: "success",
        text: res.data?.message || `تم إرسال إشعار التنبيه التجريبي بنجاح إلى جهازك`,
      });

      // Also trigger browser desktop notification if permitted
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification("⚠️ Safe Kids Guard — تنبيه أمان تجريبي", {
            body: "نظام الإشعارات الفورية يعمل بكفاءة وأمان لحماية أجهزتكم.",
            icon: "/logo.jpeg",
          });
        } else if (Notification.permission !== "denied") {
          Notification.requestPermission().then((permission) => {
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
      const detail = err.response?.data?.detail;
      const msg = typeof detail === "string" ? detail : "فشل إرسال إشعار التنبيه التجريبي";
      setMessage({ type: "error", text: msg });
    } finally {
      setTestingPush(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#07365f]">إعدادات الإشعارات والتنبيهات الأمنية</h1>
        <p className="text-sm text-[#387b94] mt-1">
          حدد قنوات استلام التنبيهات الفورية وإشعارات المتصفح عند اكتشاف محتوى غير آمن على أجهزة الأطفال.
        </p>
      </div>

      {/* Success/Error Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
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
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#edf5f8] text-[#159cb7] flex items-center justify-center">
              <Bell className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
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

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={webPushEnabled}
              onChange={(e) => setWebPushEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1bc3e4]"></div>
          </label>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#07365f] mb-1.5 text-right">
              رقم هاتف الطوارئ والتواصل بالأهل
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+966501234567 أو +201012345678"
                dir="ltr"
                className="w-full px-4 py-3 rounded-xl border border-[#b5d7e3] focus:border-[#1bc3e4] focus:ring-2 focus:ring-[#1bc3e4]/20 outline-none transition text-sm text-[#07365f] font-mono"
              />
            </div>
            <p className="text-xs text-[#387b94] mt-1.5">
              الصيغة المعتمدة: الرمز الدولي للدولة متبوعاً برقم الهاتف (مثال: +966501234567 أو 0550123456).
            </p>
          </div>

          {/* Sound Alert Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#edf5f8]/40 border border-[#b5d7e3]/30">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-5 h-5 text-[#159cb7]" />
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

          {/* Template Preview Card */}
          <div className="p-4 rounded-xl bg-[#edf5f8]/50 border border-[#b5d7e3]/40 text-xs text-[#07365f] space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-[#07365f]">
              <ShieldAlert className="w-4 h-4 text-[#e33a0a]" />
              <span>معاينة إشعار الأمان الفوري:</span>
            </div>
            <p className="p-3 bg-white rounded-lg border border-[#b5d7e3]/30 text-xs leading-relaxed text-[#07365f] text-right">
              ⚠️ <strong>حارس الأطفال الآمن</strong>: تم رصد وحظر محتوى <strong>تنمر إلكتروني</strong> على جهاز <strong>سعد</strong> بنسبة ثقة <strong>94%</strong>. تم اتخاذ الإجراء الوقائي فوراً.
            </p>
          </div>

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
              {testingPush ? <Loader2 className="w-4 h-4 animate-spin text-[#159cb7]" /> : <Send className="w-4 h-4 text-[#159cb7]" />}
              <span>إرسال إشعار تجريبي فوري</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
