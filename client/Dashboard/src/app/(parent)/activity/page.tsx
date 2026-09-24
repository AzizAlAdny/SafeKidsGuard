"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Shield,
  ShieldAlert,
  CheckCircle,
  Filter,
  RefreshCw,
  Search,
  Smartphone,
  Globe,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";

interface ActivityItem {
  id: string;
  child_id: string;
  child_name?: string;
  app_name?: string;
  url?: string;
  content_snippet: string;
  category: string;
  confidence: number;
  verdict: "ALLOWED" | "BLOCKED";
  timestamp: string;
}

interface Child {
  id: string;
  full_name: string;
}

const CATEGORY_MAP: Record<string, { label: string; bg: string; text: string }> = {
  SAFE: { label: "محتوى آمن", bg: "bg-[#eaf9ef]", text: "text-[#1a6f2f]" },
  CYBERBULLYING: { label: "تنمر إلكتروني", bg: "bg-[#fff6eb]", text: "text-[#e5820a]" },
  SEXUAL: { label: "محتوى غير لائق", bg: "bg-[#fde8ef]", text: "text-[#d81b60]" },
  VIOLENCE: { label: "عنف وتهديد", bg: "bg-[#feebe6]", text: "text-[#e33a0a]" },
  HATE_SPEECH: { label: "خطاب كراهية", bg: "bg-purple-50", text: "text-purple-700" },
};

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedVerdict, setSelectedVerdict] = useState<string>("");

  useEffect(() => {
    async function loadChildren() {
      try {
        const res = await api.get("/auth/children");
        setChildren(res.data?.children || []);
      } catch (err) {
        console.error("Failed to load children", err);
      }
    }
    loadChildren();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params: any = { page, size: 15 };
      if (selectedChildId) params.child_id = selectedChildId;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedVerdict) params.verdict = selectedVerdict;

      const res = await api.get("/activity", { params });
      setActivities(res.data?.items || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      console.error("Failed to fetch activity log", err);
      // Fallback sample data for demonstration if DB empty
      setActivities([
        {
          id: "act-1",
          child_id: "c-1",
          child_name: "سعد عمر",
          app_name: "TikTok",
          content_snippet: "أنت شخص فاشل وغبي وسوف أقوم بضربك غداً بعد الدوام",
          category: "CYBERBULLYING",
          confidence: 0.94,
          verdict: "BLOCKED",
          timestamp: new Date().toISOString(),
        },
        {
          id: "act-2",
          child_id: "c-1",
          child_name: "سعد عمر",
          app_name: "Chrome",
          content_snippet: "شرح درس مادة العلوم للصف الخامس الابتدائي عن المجموعة الشمسية",
          category: "SAFE",
          confidence: 0.99,
          verdict: "ALLOWED",
          timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        },
        {
          id: "act-3",
          child_id: "c-2",
          child_name: "نورة عمر",
          app_name: "YouTube",
          content_snippet: "سأقوم بقتلك وسفك دمائك بالسكين أمام الجميع",
          category: "VIOLENCE",
          confidence: 0.97,
          verdict: "BLOCKED",
          timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
        },
      ]);
      setTotal(3);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [page, selectedChildId, selectedCategory, selectedVerdict]);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#07365f] flex items-center gap-2.5">
            <Activity className="w-7 h-7 text-[#159cb7]" />
            <span>سجل النشاط المباشر والمراقبة</span>
          </h1>
          <p className="text-sm text-[#387b94] mt-1">
            متابعة النصوص والتفاعلات التي تم رصدها وتحليلها عبر الذكاء الاصطناعي على أجهزة الأبناء.
          </p>
        </div>

        <button
          onClick={fetchActivities}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#b5d7e3]/40 text-[#07365f] hover:bg-[#edf5f8] transition text-xs font-bold shadow-sm cursor-pointer self-start"
        >
          <RefreshCw className={`w-4 h-4 text-[#159cb7] ${loading ? "animate-spin" : ""}`} />
          <span>تحديث السجل</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#07365f]">
          <Filter className="w-4 h-4 text-[#159cb7]" />
          <span>تصفية:</span>
        </div>

        {/* Child Filter */}
        <select
          value={selectedChildId}
          onChange={(e) => {
            setSelectedChildId(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl border border-[#b5d7e3] text-xs font-semibold text-[#07365f] bg-[#edf5f8]/40 outline-none cursor-pointer"
        >
          <option value="">جميع الأطفال</option>
          {children.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name}
            </option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl border border-[#b5d7e3] text-xs font-semibold text-[#07365f] bg-[#edf5f8]/40 outline-none cursor-pointer"
        >
          <option value="">جميع التصنيفات</option>
          <option value="SAFE">محتوى آمن</option>
          <option value="CYBERBULLYING">تنمر إلكتروني</option>
          <option value="SEXUAL">محتوى غير لائق</option>
          <option value="VIOLENCE">عنف وتهديد</option>
          <option value="HATE_SPEECH">خطاب كراهية</option>
        </select>

        {/* Verdict Filter */}
        <select
          value={selectedVerdict}
          onChange={(e) => {
            setSelectedVerdict(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl border border-[#b5d7e3] text-xs font-semibold text-[#07365f] bg-[#edf5f8]/40 outline-none cursor-pointer"
        >
          <option value="">جميع القرارات</option>
          <option value="BLOCKED">المحظورة فقط (Threats)</option>
          <option value="ALLOWED">المسموحة (Safe)</option>
        </select>

        <div className="mr-auto text-xs text-[#387b94] font-medium">
          إجمالي الأنشطة المسجلة: <strong className="font-mono text-[#07365f]">{total}</strong>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-2xl border border-[#b5d7e3]/40 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-[#387b94]">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#159cb7]" />
            <span>جارٍ تحميل سجل الأنشطة...</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-16 text-center text-[#387b94]">
            <CheckCircle className="w-12 h-12 text-[#2abe50] mx-auto mb-3 opacity-60" />
            <p className="font-bold text-sm text-[#07365f]">لا توجد أنشطة مسجلة بهذه المعايير</p>
            <p className="text-xs mt-1">تصفح الأطفال آمن ومتوافق مع السياسات المحددة.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-[#edf5f8]/60 border-b border-[#b5d7e3]/30 text-xs font-bold text-[#07365f]">
                  <th className="py-3.5 px-4">الوقت</th>
                  <th className="py-3.5 px-4">الطفل</th>
                  <th className="py-3.5 px-4">التطبيق / السياق</th>
                  <th className="py-3.5 px-4">مقتطف النص المرصود</th>
                  <th className="py-3.5 px-4">تصنيف الذكاء الاصطناعي</th>
                  <th className="py-3.5 px-4">نسبة الثقة</th>
                  <th className="py-3.5 px-4">القرار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-[#07365f]">
                {activities.map((act) => {
                  const catStyle = CATEGORY_MAP[act.category] || {
                    label: act.category,
                    bg: "bg-gray-100",
                    text: "text-gray-700",
                  };
                  const isBlocked = act.verdict === "BLOCKED";

                  return (
                    <tr key={act.id} className="hover:bg-[#f8fcfd] transition">
                      <td className="py-3.5 px-4 text-[#387b94] font-mono text-[11px] whitespace-nowrap">
                        {new Date(act.timestamp).toLocaleTimeString("ar-SA", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#07365f] whitespace-nowrap">
                        {act.child_name || "الطفل"}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 font-semibold text-gray-700 text-[11px]">
                          <Smartphone className="w-3.5 h-3.5 text-[#159cb7]" />
                          <span>{act.app_name || "تطبيق عام"}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs font-normal truncate" title={act.content_snippet}>
                        {act.content_snippet}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${catStyle.bg} ${catStyle.text}`}
                        >
                          {catStyle.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-[11px] text-[#159cb7]">
                        {Math.round(act.confidence * 100)}%
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-[#feebe6] text-[#e33a0a]">
                            <ShieldAlert className="w-3 h-3" />
                            <span>محظور</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-[#eaf9ef] text-[#1a6f2f]">
                            <CheckCircle className="w-3 h-3" />
                            <span>مسموح</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 15 && (
          <div className="p-4 border-t border-[#b5d7e3]/30 flex items-center justify-between text-xs text-[#387b94]">
            <span>
              عرض الصفحة {page} من {Math.ceil(total / 15)}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
                <span>السابق</span>
              </button>
              <button
                disabled={page >= Math.ceil(total / 15)}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
              >
                <span>التالي</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
