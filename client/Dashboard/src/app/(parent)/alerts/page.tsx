"use client";

import { useEffect, useState, useMemo } from "react";
import {
  AlertTriangle,
  Filter,
  Search,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShieldCheck,
  X,
  RotateCcw,
} from "lucide-react";
import { api } from "@/lib/api";
import { normalizeArabicText } from "@/lib/utils";

interface AlertItem {
  id: string;
  child_id: string;
  category: string;
  content_snippet: string;
  confidence: number;
  verdict: string;
  context_app: string | null;
  web_push_sent?: boolean;
  created_at: string;
}

interface ChildItem {
  id: string;
  full_name: string;
  nickname: string | null;
}

const CATEGORY_MAP: Record<string, { label: string; color: string; bgColor: string }> = {
  CYBERBULLYING: { label: "تنمر إلكتروني", color: "#7455aa", bgColor: "#f1eef6" },
  VIOLENCE: { label: "عنف وتحريض", color: "#f0a83d", bgColor: "#fef8ee" },
  SEXUAL: { label: "محتوى غير لائق", color: "#e33a0a", bgColor: "#fdece7" },
  HATE_SPEECH: { label: "خطاب كراهية", color: "#0b518e", bgColor: "#e7f3fd" },
  BLOCKED_APP: { label: "تطبيق محظور", color: "#be123c", bgColor: "#ffe4e6" },
  BLACKLISTED_URL: { label: "موقع محظور", color: "#b45309", bgColor: "#fef3c7" },
  BEDTIME: { label: "وقت النوم", color: "#4338ca", bgColor: "#e0e7ff" },
  SCREEN_TIME: { label: "تجاوز وقت الشاشة", color: "#0f766e", bgColor: "#ccfbf1" },
  SAFE: { label: "محتوى آمن", color: "#2abe50", bgColor: "#eaf9ef" },
};

function formatAlertDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [childrenList, setChildrenList] = useState<ChildItem[]>([]);
  const [childrenMap, setChildrenMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [selectedChildId, setSelectedChildId] = useState("");
  const [search, setSearch] = useState("");

  const fetchAlertsData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filter !== "ALL") params.category = filter;
      if (selectedChildId) params.child_id = selectedChildId;

      const [alertsRes, childrenRes] = await Promise.allSettled([
        api.get("/alerts", { params }),
        api.get("/auth/children"),
      ]);

      if (childrenRes.status === "fulfilled" && childrenRes.value.data?.children) {
        const list: ChildItem[] = childrenRes.value.data.children;
        setChildrenList(list);
        const map: Record<string, string> = {};
        list.forEach((c: ChildItem) => {
          map[c.id] = c.full_name || c.nickname || "طفل";
        });
        setChildrenMap(map);
      }

      if (alertsRes.status === "fulfilled" && Array.isArray(alertsRes.value.data)) {
        setAlerts(alertsRes.value.data);
      } else {
        setAlerts([]);
      }
    } catch (err) {
      console.error("Failed to load alerts feed:", err);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertsData();
  }, [filter, selectedChildId]);

  useEffect(() => {
    const handleLiveUpdate = () => {
      fetchAlertsData();
    };
    window.addEventListener("skg-alerts-updated", handleLiveUpdate);
    return () => window.removeEventListener("skg-alerts-updated", handleLiveUpdate);
  }, [filter, selectedChildId]);

  const resetFilters = () => {
    setFilter("ALL");
    setSelectedChildId("");
    setSearch("");
  };

  const hasActiveFilters = filter !== "ALL" || Boolean(selectedChildId) || Boolean(search.trim());

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      // Child filter
      if (selectedChildId && alert.child_id !== selectedChildId) {
        return false;
      }

      const childName = childrenMap[alert.child_id] || "طفل";
      const catConfig = CATEGORY_MAP[alert.category] || { label: alert.category };
      const term = normalizeArabicText(search);

      if (!term) return true;

      const normChild = normalizeArabicText(childName);
      const normCat = normalizeArabicText(catConfig.label);
      const normSnippet = normalizeArabicText(alert.content_snippet);
      const normApp = normalizeArabicText(alert.context_app);

      return (
        normChild.includes(term) ||
        normCat.includes(term) ||
        normSnippet.includes(term) ||
        normApp.includes(term)
      );
    });
  }, [alerts, childrenMap, selectedChildId, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#07365f]">سجل التنبيهات والمخاطر المرصودة</h1>
          <p className="text-sm text-[#387b94] mt-1">
            كافة المحتويات المصنفة كتهديد بواسطة نماذج الذكاء الاصطناعي مع إجراءات الحماية المتخذة
          </p>
        </div>
        <button
          onClick={fetchAlertsData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#b5d7e3] text-xs font-bold text-[#07365f] hover:bg-[#edf5f8] transition cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#1bc3e4]" : ""}`} />
          <span>تحديث السجل</span>
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-[#b5d7e3]/40 shadow-sm">
        {/* Left Side: Child Filter & Category Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Child Select Dropdown */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#b5d7e3] bg-[#edf5f8]/50 text-xs font-semibold text-[#07365f] outline-none cursor-pointer focus:border-[#1bc3e4]"
            >
              <option value="">جميع الأطفال</option>
              {childrenList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name || c.nickname}
                </option>
              ))}
            </select>
          </div>

          <div className="h-5 w-px bg-gray-200 hidden sm:block" />

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "ALL", label: "الكل" },
              { id: "CYBERBULLYING", label: "تنمر إلكتروني" },
              { id: "SEXUAL", label: "محتوى غير لائق" },
              { id: "VIOLENCE", label: "عنف وتحريض" },
              { id: "HATE_SPEECH", label: "خطاب كراهية" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  filter === tab.id
                    ? "bg-[#07365f] text-white shadow-sm"
                    : "bg-gray-100 text-[#387b94] hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Search & Reset */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالنص، الطفل، أو التطبيق..."
              className="w-full px-3 py-2 pr-8 pl-8 rounded-xl border border-[#b5d7e3] text-xs text-[#07365f] outline-none focus:border-[#1bc3e4] bg-[#f8fafc]"
            />
            <Search className="w-4 h-4 text-[#387b94] absolute right-2.5 top-2.5" />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute left-2.5 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                title="مسح البحث"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition flex items-center gap-1 whitespace-nowrap cursor-pointer"
              title="إعادة ضبط كل عوامل التصفية"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">إعادة ضبط</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerts Table / Feed */}
      <div className="bg-white rounded-2xl border border-[#b5d7e3]/40 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[#387b94]">
            <Loader2 className="w-8 h-8 animate-spin text-[#1bc3e4] mb-3" />
            <p className="text-xs font-semibold">جاري جلب سجل التنبيهات من الخادم...</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#eaf9ef] text-[#2abe50] flex items-center justify-center mb-3">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#07365f]">لا توجد تنبيهات مرصودة</h3>
            <p className="text-xs text-[#387b94] mt-1 max-w-sm">
              {hasActiveFilters
                ? "لا توجد نتائج تطابق معايير البحث أو التصفية المحددة."
                : "جميع أنشطة أجهزتكم محمية ولم يتم رصد أي محتوى ضار حتى الآن."}
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-[#07365f] bg-[#edf5f8] hover:bg-[#b5d7e3]/40 transition cursor-pointer"
              >
                إلغاء التصفية وعرض الكل
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-[#edf5f8] text-[#07365f] font-bold text-xs border-b border-[#b5d7e3]/50">
                <tr>
                  <th className="p-4">الطفل</th>
                  <th className="p-4">تصنيف التهديد</th>
                  <th className="p-4">المحتوى المرصود</th>
                  <th className="p-4">التطبيق</th>
                  <th className="p-4">نسبة الثقة</th>
                  <th className="p-4">الإجراء الوقائي</th>
                  <th className="p-4">التاريخ والوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#b5d7e3]/30">
                {filteredAlerts.map((alert) => {
                  const cat = CATEGORY_MAP[alert.category] || {
                    label: alert.category,
                    color: "#07365f",
                    bgColor: "#edf5f8",
                  };
                  const childName = childrenMap[alert.child_id] || "جهاز طفل";

                  return (
                    <tr key={alert.id} className="hover:bg-[#edf5f8]/30 transition">
                      <td className="p-4 font-bold text-[#07365f] whitespace-nowrap">
                        {childName}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span
                          className="px-2.5 py-1 rounded-lg text-xs font-bold"
                          style={{ backgroundColor: cat.bgColor, color: cat.color }}
                        >
                          {cat.label}
                        </span>
                      </td>
                      <td
                        className="p-4 text-xs text-[#07365f] max-w-xs truncate"
                        title={alert.content_snippet}
                      >
                        {alert.content_snippet}
                      </td>
                      <td className="p-4 text-xs text-[#387b94] whitespace-nowrap">
                        {alert.context_app || "غير محدد"}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="font-semibold text-xs text-[#07365f]">
                          {(alert.confidence > 1 ? alert.confidence : alert.confidence * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#feebe6] text-[#e33a0a]">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          تم الحظر فورياً
                        </span>
                      </td>
                      <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
                        {formatAlertDate(alert.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
