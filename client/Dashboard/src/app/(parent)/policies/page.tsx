"use client";

import { useEffect, useState } from "react";
import {
  Sliders,
  Shield,
  ShieldAlert,
  Clock,
  Smartphone,
  Globe,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";

interface Child {
  id: string;
  email: string;
  full_name: string;
  age?: number;
}

interface Policy {
  id?: string;
  child_id: string;
  age_level: number;
  block_violence: boolean;
  block_sexual: boolean;
  block_cyberbullying: boolean;
  block_hate_speech: boolean;
  sensitivity_threshold: number;
  custom_blacklist_urls: string[];
  blocked_apps: string[];
  screen_time_daily_limit_mins: number;
  bedtime_start: string | null;
  bedtime_end: string | null;
}

const POPULAR_APPS = [
  { name: "تيك توك (TikTok)", pkg: "com.zhiliaoapp.musically" },
  { name: "إنستغرام (Instagram)", pkg: "com.instagram.android" },
  { name: "سناب شات (Snapchat)", pkg: "com.snapchat.android" },
  { name: "روبلوكس (Roblox)", pkg: "com.roblox.client" },
  { name: "يوتيوب كيدز (YouTube Kids)", pkg: "com.google.android.apps.youtube.kids" },
];

export default function PoliciesPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Input states for blacklists
  const [newUrl, setNewUrl] = useState("");
  const [newApp, setNewApp] = useState("");

  // Load children list
  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.get("/auth/children");
        const list = res.data?.children || [];
        setChildren(list);
        if (list.length > 0) {
          setSelectedChildId(list[0].id);
        }
      } catch (err) {
        console.error("Failed to load children", err);
        // Fallback for demonstration
        const fallback = [
          { id: "11111111-1111-1111-1111-111111111111", email: "saad@test.com", full_name: "سعد عمر", age: 10 },
          { id: "22222222-2222-2222-2222-222222222222", email: "noura@test.com", full_name: "نورة عمر", age: 14 },
        ];
        setChildren(fallback);
        setSelectedChildId(fallback[0].id);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Load policy whenever selected child changes
  useEffect(() => {
    if (!selectedChildId) return;

    async function loadPolicy() {
      setLoading(true);
      setMessage(null);
      try {
        const res = await api.get(`/policies/${selectedChildId}`);
        setPolicy(res.data);
      } catch (err) {
        console.error("Failed to fetch policy, setting defaults", err);
        setPolicy({
          child_id: selectedChildId,
          age_level: 1,
          block_violence: true,
          block_sexual: true,
          block_cyberbullying: true,
          block_hate_speech: true,
          sensitivity_threshold: 0.75,
          custom_blacklist_urls: [],
          blocked_apps: ["com.zhiliaoapp.musically"],
          screen_time_daily_limit_mins: 120,
          bedtime_start: "21:00",
          bedtime_end: "06:00",
        });
      } finally {
        setLoading(false);
      }
    }
    loadPolicy();
  }, [selectedChildId]);

  const handleApplyPreset = (level: number) => {
    if (!policy) return;
    if (level === 1) {
      // Child (6-11)
      setPolicy({
        ...policy,
        age_level: 1,
        block_violence: true,
        block_sexual: true,
        block_cyberbullying: true,
        block_hate_speech: true,
        sensitivity_threshold: 0.70,
        screen_time_daily_limit_mins: 90,
        bedtime_start: "20:30",
        bedtime_end: "06:30",
      });
    } else if (level === 2) {
      // Teen (12-17)
      setPolicy({
        ...policy,
        age_level: 2,
        block_violence: false,
        block_sexual: true,
        block_cyberbullying: true,
        block_hate_speech: true,
        sensitivity_threshold: 0.85,
        screen_time_daily_limit_mins: 180,
        bedtime_start: "22:30",
        bedtime_end: "06:00",
      });
    } else {
      setPolicy({ ...policy, age_level: 3 });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policy || !selectedChildId) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await api.put(`/policies/${selectedChildId}`, policy);
      setPolicy(res.data);
      setMessage({ type: "success", text: "تم تحديث سياسة الحماية وتطبيقها على جهاز الطفل بنجاح!" });
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.detail || "فشل حفظ السياسة، يرجى المحاولة مرة أخرى",
      });
    } finally {
      setSaving(false);
    }
  };

  const addUrl = () => {
    if (!newUrl.trim() || !policy) return;
    const clean = newUrl.trim().toLowerCase().replace(/^https?:\/\//, "");
    if (!policy.custom_blacklist_urls.includes(clean)) {
      setPolicy({
        ...policy,
        custom_blacklist_urls: [...policy.custom_blacklist_urls, clean],
      });
    }
    setNewUrl("");
  };

  const removeUrl = (url: string) => {
    if (!policy) return;
    setPolicy({
      ...policy,
      custom_blacklist_urls: policy.custom_blacklist_urls.filter((u) => u !== url),
    });
  };

  const toggleBlockedApp = (pkg: string) => {
    if (!policy) return;
    const exists = policy.blocked_apps.includes(pkg);
    setPolicy({
      ...policy,
      blocked_apps: exists
        ? policy.blocked_apps.filter((p) => p !== pkg)
        : [...policy.blocked_apps, pkg],
    });
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#07365f] flex items-center gap-2.5">
            <Sliders className="w-7 h-7 text-[#159cb7]" />
            <span>سياسات الحماية وضوابط المحتوى</span>
          </h1>
          <p className="text-sm text-[#387b94] mt-1">
            خصص حساسية الذكاء الاصطناعي وحدود استخدام التطبيقات وأوقات النوم لكل طفل.
          </p>
        </div>

        {/* Child Selector */}
        {children.length > 0 && (
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-[#b5d7e3]/40 shadow-sm">
            <span className="text-xs font-bold text-[#07365f]">الطفل:</span>
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="bg-transparent text-sm font-bold text-[#0b518e] outline-none cursor-pointer"
            >
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} {c.age ? `(${c.age} سنة)` : ""}
                </option>
              ))}
            </select>
          </div>
        )}
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

      {loading && !policy ? (
        <div className="p-12 text-center text-[#387b94]">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#159cb7]" />
          <span>جارٍ تحميل السياسة الحالية...</span>
        </div>
      ) : policy ? (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Preset Profiles */}
          <div className="p-6 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-[#07365f] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#e5820a]" />
              <span>قوالب الحماية الذكية الجاهزة</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => handleApplyPreset(1)}
                className={`p-4 rounded-xl border text-right transition cursor-pointer ${
                  policy.age_level === 1
                    ? "border-[#159cb7] bg-[#edf5f8] shadow-sm ring-2 ring-[#159cb7]/20"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="font-bold text-[#07365f] text-sm mb-1">أطفال (6 - 11 سنة)</div>
                <p className="text-xs text-[#387b94] leading-relaxed">
                  حماية قصوى لكافة التهديدات، حساسية عالية (70%)، وقت شاشة 90 دقيقة.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset(2)}
                className={`p-4 rounded-xl border text-right transition cursor-pointer ${
                  policy.age_level === 2
                    ? "border-[#159cb7] bg-[#edf5f8] shadow-sm ring-2 ring-[#159cb7]/20"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="font-bold text-[#07365f] text-sm mb-1">يافعين (12 - 17 سنة)</div>
                <p className="text-xs text-[#387b94] leading-relaxed">
                  توازن بين الخصوصية والحماية، حظر المحتوى الجنسي والكراهية، وقت أوسع.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset(3)}
                className={`p-4 rounded-xl border text-right transition cursor-pointer ${
                  policy.age_level === 3
                    ? "border-[#159cb7] bg-[#edf5f8] shadow-sm ring-2 ring-[#159cb7]/20"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="font-bold text-[#07365f] text-sm mb-1">تخصيص يدوي متقدم</div>
                <p className="text-xs text-[#387b94] leading-relaxed">
                  تحكم كامل في كل فئة، نسبة الحساسية، والقوائم البيضاء والسوداء.
                </p>
              </button>
            </div>
          </div>

          {/* AI Category Toggles */}
          <div className="p-6 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#07365f] flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-[#e33a0a]" />
                  <span>فئات المحتوى الخاضعة للحظر التلقائي (AraBERT + CAMeLBERT)</span>
                </h2>
                <p className="text-xs text-[#387b94] mt-0.5">
                  عند رصد هذه الفئات على شاشة الطفل، يتم حجبها فوراً وإشعار الوالد.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Cyberbullying */}
              <label className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-[#edf5f8]/40 hover:bg-[#edf5f8] transition cursor-pointer">
                <div>
                  <div className="font-bold text-sm text-[#07365f]">التنمر الإلكتروني والسب</div>
                  <div className="text-xs text-[#387b94]">الإهانات، التهديد، الشتائم باللهجات العربية</div>
                </div>
                <input
                  type="checkbox"
                  checked={policy.block_cyberbullying}
                  onChange={(e) => setPolicy({ ...policy, block_cyberbullying: e.target.checked })}
                  className="w-5 h-5 accent-[#159cb7] cursor-pointer"
                />
              </label>

              {/* Sexual Content */}
              <label className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-[#edf5f8]/40 hover:bg-[#edf5f8] transition cursor-pointer">
                <div>
                  <div className="font-bold text-sm text-[#07365f]">المحتوى غير اللائق والإباحي</div>
                  <div className="text-xs text-[#387b94]">المحتوى الإباحي، التلميحات الجنسية الصريحة</div>
                </div>
                <input
                  type="checkbox"
                  checked={policy.block_sexual}
                  onChange={(e) => setPolicy({ ...policy, block_sexual: e.target.checked })}
                  className="w-5 h-5 accent-[#159cb7] cursor-pointer"
                />
              </label>

              {/* Violence */}
              <label className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-[#edf5f8]/40 hover:bg-[#edf5f8] transition cursor-pointer">
                <div>
                  <div className="font-bold text-sm text-[#07365f]">العنف والترهيب الجسدي</div>
                  <div className="text-xs text-[#387b94]">القتل، الأسلحة، التحريض على إيذاء النفس</div>
                </div>
                <input
                  type="checkbox"
                  checked={policy.block_violence}
                  onChange={(e) => setPolicy({ ...policy, block_violence: e.target.checked })}
                  className="w-5 h-5 accent-[#159cb7] cursor-pointer"
                />
              </label>

              {/* Hate Speech */}
              <label className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-[#edf5f8]/40 hover:bg-[#edf5f8] transition cursor-pointer">
                <div>
                  <div className="font-bold text-sm text-[#07365f]">خطاب الكراهية والعنصرية</div>
                  <div className="text-xs text-[#387b94]">التمييز الديني، العرقي، والتحريض المجتمعي</div>
                </div>
                <input
                  type="checkbox"
                  checked={policy.block_hate_speech}
                  onChange={(e) => setPolicy({ ...policy, block_hate_speech: e.target.checked })}
                  className="w-5 h-5 accent-[#159cb7] cursor-pointer"
                />
              </label>
            </div>

            {/* Sensitivity Slider */}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#07365f]">حساسية قرار الذكاء الاصطناعي:</span>
                <span className="font-mono font-bold text-[#159cb7] bg-[#159cb7]/10 px-2 py-0.5 rounded">
                  {Math.round(policy.sensitivity_threshold * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.50"
                max="0.95"
                step="0.05"
                value={policy.sensitivity_threshold}
                onChange={(e) => setPolicy({ ...policy, sensitivity_threshold: parseFloat(e.target.value) })}
                className="w-full accent-[#159cb7] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-[#387b94]">
                <span>أكثر صرامة (حظر أكبر 50%)</span>
                <span>الموصى به (75%)</span>
                <span>تساهل وتجنب الإنذار الخاطئ (95%)</span>
              </div>
            </div>
          </div>

          {/* Screen Time & Bedtime */}
          <div className="p-6 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-[#07365f] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#159cb7]" />
              <span>إدارة وقت الشاشة وفترة النوم</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-[#07365f] mb-1.5">
                  الحد اليومي المسموح لاستخدام الشاشة (بالدقائق)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="1440"
                    step="15"
                    value={policy.screen_time_daily_limit_mins}
                    onChange={(e) =>
                      setPolicy({ ...policy, screen_time_daily_limit_mins: parseInt(e.target.value) || 0 })
                    }
                    className="w-32 px-3 py-2 rounded-xl border border-[#b5d7e3] text-sm text-[#07365f] font-mono outline-none"
                  />
                  <span className="text-xs text-[#387b94]">
                    ({(policy.screen_time_daily_limit_mins / 60).toFixed(1)} ساعة يومياً)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#07365f] mb-1.5">
                  فترة النوم (حظر الجهاز ليلاً)
                </label>
                <div className="flex items-center gap-2 text-xs text-[#07365f]">
                  <span>من</span>
                  <input
                    type="time"
                    value={policy.bedtime_start || "21:00"}
                    onChange={(e) => setPolicy({ ...policy, bedtime_start: e.target.value })}
                    className="px-2.5 py-1.5 rounded-lg border border-[#b5d7e3] font-mono outline-none"
                  />
                  <span>إلى</span>
                  <input
                    type="time"
                    value={policy.bedtime_end || "06:00"}
                    onChange={(e) => setPolicy({ ...policy, bedtime_end: e.target.value })}
                    className="px-2.5 py-1.5 rounded-lg border border-[#b5d7e3] font-mono outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Blocked Apps & Custom URL Blacklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Apps Restrictions */}
            <div className="p-6 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-[#07365f] flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#0b518e]" />
                <span>حظر التطبيقات</span>
              </h2>

              <div className="space-y-2">
                {POPULAR_APPS.map((app) => {
                  const isBlocked = policy.blocked_apps.includes(app.pkg);
                  return (
                    <div
                      key={app.pkg}
                      onClick={() => toggleBlockedApp(app.pkg)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition ${
                        isBlocked
                          ? "bg-red-50/60 border-red-200 text-red-900"
                          : "bg-white border-gray-100 hover:bg-gray-50 text-[#07365f]"
                      }`}
                    >
                      <span className="font-semibold">{app.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          isBlocked ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {isBlocked ? "محظور" : "مسموح"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* URL Blacklist */}
            <div className="p-6 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-[#07365f] flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#159cb7]" />
                <span>القائمة السوداء للمواقع (URLs)</span>
              </h2>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="مثال: badwebsite.com"
                  dir="ltr"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
                  className="flex-1 px-3 py-2 rounded-xl border border-[#b5d7e3] text-xs font-mono outline-none"
                />
                <button
                  type="button"
                  onClick={addUrl}
                  className="px-3 py-2 rounded-xl bg-[#159cb7] text-white hover:opacity-90 transition text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة</span>
                </button>
              </div>

              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {policy.custom_blacklist_urls.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4 text-center">لا توجد مواقع مضافة للقائمة السوداء</p>
                ) : (
                  policy.custom_blacklist_urls.map((url) => (
                    <div
                      key={url}
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100 text-xs font-mono"
                    >
                      <span className="text-[#07365f] truncate">{url}</span>
                      <button
                        type="button"
                        onClick={() => removeUrl(url)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[#159cb7] to-[#1bc3e4] hover:opacity-95 shadow-md shadow-[#159cb7]/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>حفظ وتطبيق السياسة</span>
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
