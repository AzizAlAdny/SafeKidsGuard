"use client";

import { useState } from "react";
import {
  MessageCircle,
  Bell,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

export default function NotificationsPage() {
  const { user } = useAuthStore();

  const [whatsappPhone, setWhatsappPhone] = useState("966501234567");
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [webPushEnabled, setWebPushEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingWa, setTestingWa] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    // Mock API call to update notification preferences
    setTimeout(() => {
      setSaving(false);
      setMessage({ type: "success", text: "تم حفظ تفضيلات الإشعارات بنجاح!" });
    }, 600);
  };

  const handleTestWhatsApp = async () => {
    setTestingWa(true);
    setMessage(null);

    // Mock sending test WhatsApp message via Meta Cloud API
    setTimeout(() => {
      setTestingWa(false);
      setMessage({
        type: "success",
        text: `تم إرسال رسالة تجريبية بنجاح إلى الرقم +${whatsappPhone} عبر WhatsApp Business API`,
      });
    }, 1200);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#07365f]">إعدادات الإشعارات والتنبيهات</h1>
        <p className="text-sm text-[#387b94] mt-1">
          حدد قنوات استلام التنبيهات الفورية عند اكتشاف محتوى غير آمن على أجهزة الأطفال.
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

      {/* WhatsApp Business API Section (Primary Channel) */}
      <div className="p-6 md:p-8 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#eaf9ef] text-[#2abe50] flex items-center justify-center">
              <MessageCircle className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#07365f]">إشعارات الواتساب (القناة الأساسية)</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#1bc3e4]/15 text-[#107589]">
                  الأكثر موثوقية في السعودية
                </span>
              </div>
              <p className="text-xs text-[#387b94] mt-0.5">
                تصلك التنبيهات الرسمية والموثوقة عبر Meta WhatsApp Business Cloud API
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={whatsappEnabled}
              onChange={(e) => setWhatsappEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2abe50]"></div>
          </label>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#07365f] mb-1.5 text-right">
              رقم هاتف الواتساب المعتمد
            </label>
            <div className="relative">
              <input
                type="tel"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="966501234567"
                dir="ltr"
                className="w-full px-4 py-3 rounded-xl border border-[#b5d7e3] focus:border-[#2abe50] focus:ring-2 focus:ring-[#2abe50]/20 outline-none transition text-sm text-[#07365f] font-mono"
              />
            </div>
            <p className="text-xs text-[#387b94] mt-1.5">
              الصيغة المعتمدة: الرمز الدولي 966 متبوعاً بـ 9 أرقام (مثال: 966501234567).
            </p>
          </div>

          {/* Template Preview Card */}
          <div className="p-4 rounded-xl bg-[#edf5f8]/50 border border-[#b5d7e3]/40 text-xs text-[#07365f] space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-[#07365f]">
              <ShieldAlert className="w-4 h-4 text-[#e33a0a]" />
              <span>نموذج الرسالة المعتمدة من ميتا (safe_kids_alert):</span>
            </div>
            <p className="p-3 bg-white rounded-lg border border-[#b5d7e3]/30 font-mono text-[11px] leading-relaxed text-[#07365f] text-right">
              ⚠️ <strong>حارس الأطفال الآمن</strong>: تم رصد محتوى <strong>تنمر إلكتروني</strong> على جهاز <strong>سعد</strong> بنسبة ثقة <strong>94%</strong>. تم اتخاذ الإجراء الوقائي فوراً.
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
              onClick={handleTestWhatsApp}
              disabled={testingWa || !whatsappEnabled}
              className="px-4 py-2.5 rounded-xl font-semibold text-[#07365f] bg-[#eaf9ef] hover:bg-[#c6eed1] border border-[#2abe50]/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
            >
              {testingWa ? <Loader2 className="w-4 h-4 animate-spin text-[#2abe50]" /> : <Send className="w-4 h-4 text-[#2abe50]" />}
              <span>إرسال رسالة تجريبية لواتساب</span>
            </button>
          </div>
        </form>
      </div>

      {/* Web Push Fallback Section */}
      <div className="p-6 md:p-8 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#e7f3fd] text-[#0b518e] flex items-center justify-center">
              <Bell className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#07365f]">إشعارات المتصفح (قناة احتياطية)</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                  FCM Web Push
                </span>
              </div>
              <p className="text-xs text-[#387b94] mt-0.5">
                تفعيل الإشعارات الفورية على هذا المتصفح في حال عدم توفر واتساب
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

        <p className="text-xs text-[#387b94] leading-relaxed">
          عند تفعيل إشعارات المتصفح، سيطلب منك النظام الإذن بعرض الإشعارات. حتى في حالة إغلاق التبويب، سيعمل Service Worker في الخلفية لإيصال التنبيهات العاجلة.
        </p>
      </div>
    </div>
  );
}
