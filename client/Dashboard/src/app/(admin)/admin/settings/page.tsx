"use client";

import { useEffect, useState } from "react";
import { Settings, Save, CheckCircle2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function AdminSettingsPage() {
  const [threshold, setThreshold] = useState<number>(0.75);
  const [enableTransformers, setEnableTransformers] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await api.get("/admin/settings");
        if (res.data) {
          setThreshold(res.data.ai_confidence_threshold ?? 0.75);
          setEnableTransformers(Boolean(res.data.ai_enable_transformers));
        }
      } catch (err) {
        console.error("Failed to load admin settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg(null);
    try {
      const res = await api.put("/admin/settings", {
        ai_confidence_threshold: threshold,
        ai_enable_transformers: enableTransformers,
      });
      setThreshold(res.data.ai_confidence_threshold);
      setEnableTransformers(res.data.ai_enable_transformers);
      setSavedMsg("تم تحديث إعدادات النظام والأمان بنجاح!");
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#1bc3e4]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[#07365f]">
          إعدادات النظام والأمان الشاملة (FR12, UC-A6)
        </h1>
        <p className="text-sm text-[#387b94] mt-1">
          ضبط معايير الذكاء الاصطناعي والعتبة الافتراضية للحظر على مستوى النظام
        </p>
      </div>

      {savedMsg && (
        <div className="p-4 rounded-xl bg-[#eaf9ef] border border-[#2abe50]/30 text-[#1a6f2f] text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-[#2abe50]" />
          <span>{savedMsg}</span>
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="p-6 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm space-y-6"
      >
        <div>
          <label className="block text-sm font-bold text-[#07365f] mb-2">
            عتبة الثقة الافتراضية للذكاء الاصطناعي (Global AI Confidence Threshold):{" "}
            <span className="text-[#159cb7] font-mono">{(threshold * 100).toFixed(0)}%</span>
          </label>
          <input
            type="range"
            min={0.5}
            max={0.95}
            step={0.05}
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-full accent-[#1bc3e4]"
          />
          <p className="text-xs text-[#387b94] mt-1">
            القيم الأقل تزيد من تشدد الفلتر، بينما القيم الأعلى تقلل من الإنذارات الكاذبة.
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-[#07365f]">
              تفعيل نماذج Transformers العصبية (AraBERTv2 + CAMeLBERT)
            </h3>
            <p className="text-xs text-[#387b94]">
              تشغيل الاستدلال العميق بجانب محرك القواعد العربية السريع
            </p>
          </div>
          <input
            type="checkbox"
            checked={enableTransformers}
            onChange={(e) => setEnableTransformers(e.target.checked)}
            className="w-5 h-5 accent-[#1bc3e4]"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-[#159cb7] to-[#1bc3e4] hover:opacity-95 transition flex items-center gap-2 text-sm cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>حفظ إعدادات النظام</span>
        </button>
      </form>
    </div>
  );
}
