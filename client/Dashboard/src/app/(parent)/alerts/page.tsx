"use client";

import { useEffect, useState, useMemo } from "react";
import {
  AlertTriangle,
  MessageCircle,
  Filter,
  Search,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/lib/api";

interface AlertItem {
  id: string;
  child_id: string;
  category: string;
  content_snippet: string;
  confidence: number;
  verdict: string;
  context_app: string | null;
  whatsapp_sent: boolean;
  web_push_sent: boolean;
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
  const [childrenMap, setChildrenMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const fetchAlertsData = async () => {
    setLoading(true);
    try {
      const [alertsRes, childrenRes] = await Promise.allSettled([
        api.get("/alerts", {
          params: filter !== "ALL" ? { category: filter } : {},
        }),
        api.get("/auth/children"),
      ]);

      if (childrenRes.status === "fulfilled" && childrenRes.value.data?.children) {
        const map: Record<string, string> = {};
        childrenRes.value.data.children.forEach((c: ChildItem) => {
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
  }, [filter]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const childName = childrenMap[alert.child_id] || "طفل";
      const catConfig = CATEGORY_MAP[alert.category] || { label: alert.category };
      const term = search.trim().toLowerCase();

      if (!term) return true;

      return (
        childName.toLowerCase().includes(term) ||
        catConfig.label.toLowerCase().includes(term) ||
        alert.content_snippet.toLowerCase().includes(term) ||
        (alert.context_app && alert.context_app.toLowerCase().includes(term))
      );
    });
  }, [alerts, childrenMap, search]);

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

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-[#b5d7e3]/40 shadow-sm">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
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

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في السجل..."
            className="w-full px-3 py-2 pl-9 rounded-xl border border-[#b5d7e3] text-xs text-[#07365f] outline-none focus:border-[#1bc3e4]"
          />
          <Search className="w-4 h-4 text-[#387b94] absolute left-3 top-2.5" />
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
              {search || filter !== "ALL"
                ? "لا توجد نتائج تطابق معايير البحث أو التصفية المحددة."
                : "جميع أنشطة أجهزتكم محمية ولم يتم رصد أي محتوى ضار حتى الآن."}
            </p>
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
                  <th className="p-4">إشعار الواتساب</th>
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
                        {alert.whatsapp_sent ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#eaf9ef] text-[#2abe50]">
                            <MessageCircle className="w-3.5 h-3.5" />
                            تم الإرسال
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">غير مفعل</span>
                        )}
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
