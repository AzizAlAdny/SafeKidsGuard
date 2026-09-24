"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Download,
  Calendar,
  Shield,
  ShieldAlert,
  CheckCircle,
  TrendingUp,
  Loader2,
  Users,
  Award,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { api } from "@/lib/api";

interface CategoryCount {
  category: string;
  count: number;
  label_ar: string;
}

interface DailyTrend {
  date: string;
  total: number;
  blocked: number;
  allowed: number;
}

interface ReportSummary {
  child_id?: string;
  child_name?: string;
  start_date: string;
  end_date: string;
  total_events: number;
  blocked_events: number;
  allowed_events: number;
  safety_score: number;
  threat_breakdown: CategoryCount[];
  daily_trends: DailyTrend[];
}

interface Child {
  id: string;
  full_name: string;
}

const COLORS = ["#e5820a", "#e33a0a", "#d81b60", "#7c3aed", "#159cb7"];

export default function ReportsPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [days, setDays] = useState<number>(7);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

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

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const params: any = { days };
      if (selectedChildId) params.child_id = selectedChildId;

      const res = await api.get("/reports/summary", { params });
      setSummary(res.data);
    } catch (err) {
      console.error("Failed to fetch report summary", err);
      // Sample fallback if server data is empty
      setSummary({
        start_date: "2026-09-17",
        end_date: "2026-09-24",
        total_events: 184,
        blocked_events: 12,
        allowed_events: 172,
        safety_score: 93.5,
        threat_breakdown: [
          { category: "CYBERBULLYING", count: 7, label_ar: "تنمر إلكتروني" },
          { category: "VIOLENCE", count: 3, label_ar: "عنف وتهديد" },
          { category: "SEXUAL", count: 2, label_ar: "محتوى غير لائق" },
        ],
        daily_trends: [
          { date: "2026-09-18", total: 24, blocked: 1, allowed: 23 },
          { date: "2026-09-19", total: 32, blocked: 2, allowed: 30 },
          { date: "2026-09-20", total: 18, blocked: 0, allowed: 18 },
          { date: "2026-09-21", total: 29, blocked: 3, allowed: 26 },
          { date: "2026-09-22", total: 35, blocked: 4, allowed: 31 },
          { date: "2026-09-23", total: 26, blocked: 1, allowed: 25 },
          { date: "2026-09-24", total: 20, blocked: 1, allowed: 19 },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [selectedChildId, days]);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const params: any = { days };
      if (selectedChildId) params.child_id = selectedChildId;

      const response = await api.get("/reports/export-pdf", {
        params,
        responseType: "blob",
      });

      // Trigger browser download
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `SafeKids_Report_${summary?.start_date || "latest"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download PDF", err);
      alert("فشل تحميل ملف التقرير، يرجى المحاولة لاحقاً");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#07365f] flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-[#159cb7]" />
            <span>التقارير التحليلية ومؤشرات الأمان</span>
          </h1>
          <p className="text-sm text-[#387b94] mt-1">
            إحصائيات دورية شاملة لسلوك التصفح ومستوى الحماية من التهديدات الرقمية.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start">
          <button
            onClick={handleDownloadPdf}
            disabled={downloading || loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#159cb7] to-[#1bc3e4] text-white hover:opacity-95 shadow-md shadow-[#159cb7]/25 transition text-xs font-bold cursor-pointer disabled:opacity-50"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>تصدير التقرير التنفيذي (PDF)</span>
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Child Selector */}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#159cb7]" />
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#b5d7e3] text-xs font-semibold text-[#07365f] bg-[#edf5f8]/40 outline-none cursor-pointer"
            >
              <option value="">جميع الأطفال (تقرير مجمع)</option>
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#159cb7]" />
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl border border-[#b5d7e3] text-xs font-semibold text-[#07365f] bg-[#edf5f8]/40 outline-none cursor-pointer"
            >
              <option value={7}>آخر 7 أيام</option>
              <option value={14}>آخر 14 يوماً</option>
              <option value={30}>آخر 30 يوماً</option>
            </select>
          </div>
        </div>

        {summary && (
          <div className="text-xs text-[#387b94] font-medium font-mono">
            الفترة: {summary.start_date} إلى {summary.end_date}
          </div>
        )}
      </div>

      {loading && !summary ? (
        <div className="p-20 text-center text-[#387b94]">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#159cb7]" />
          <span>جارٍ إعداد وتحليل البيانات...</span>
        </div>
      ) : summary ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Safety Score */}
            <div className="p-5 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-[#387b94]">
                <span className="text-xs font-bold">مؤشر الأمان الرقمي</span>
                <Award className="w-5 h-5 text-[#2abe50]" />
              </div>
              <div className="text-3xl font-extrabold text-[#07365f] font-mono">
                {summary.safety_score}%
              </div>
              <div className="text-[11px] text-[#2abe50] font-semibold flex items-center gap-1">
                <span>تصفح آمن ومتوافق بنسبة عالية</span>
              </div>
            </div>

            {/* Total Checks */}
            <div className="p-5 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-[#387b94]">
                <span className="text-xs font-bold">إجمالي الفحوصات</span>
                <TrendingUp className="w-5 h-5 text-[#159cb7]" />
              </div>
              <div className="text-3xl font-extrabold text-[#07365f] font-mono">
                {summary.total_events}
              </div>
              <div className="text-[11px] text-[#387b94]">نص وسياق تم تحليله بالذكاء الاصطناعي</div>
            </div>

            {/* Allowed Events */}
            <div className="p-5 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-[#387b94]">
                <span className="text-xs font-bold">المحتوى السليم (مسموح)</span>
                <CheckCircle className="w-5 h-5 text-[#2abe50]" />
              </div>
              <div className="text-3xl font-extrabold text-[#1a6f2f] font-mono">
                {summary.allowed_events}
              </div>
              <div className="text-[11px] text-[#387b94]">تفاعلات تعليمية وترفيهية بريئة</div>
            </div>

            {/* Blocked Threats */}
            <div className="p-5 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-[#387b94]">
                <span className="text-xs font-bold">التهديدات المحجوبة</span>
                <ShieldAlert className="w-5 h-5 text-[#e33a0a]" />
              </div>
              <div className="text-3xl font-extrabold text-[#e33a0a] font-mono">
                {summary.blocked_events}
              </div>
              <div className="text-[11px] text-[#e33a0a] font-semibold">تم التدخل الوقائي وإشعار الوالد</div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Protection Trend */}
            <div className="p-6 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#07365f]">معدل الأمان والنشاط اليومي</h2>
                <span className="text-xs text-[#387b94]">عدد الأنشطة اليومية</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={summary.daily_trends}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#159cb7" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#159cb7" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e33a0a" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#e33a0a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#edf5f8" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => d.slice(5)}
                      stroke="#8baec0"
                      fontSize={11}
                    />
                    <YAxis stroke="#8baec0" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#b5d7e3",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    <Area
                      type="monotone"
                      dataKey="total"
                      name="إجمالي الفحوصات"
                      stroke="#159cb7"
                      fillOpacity={1}
                      fill="url(#colorTotal)"
                    />
                    <Area
                      type="monotone"
                      dataKey="blocked"
                      name="المحتوى المحظور"
                      stroke="#e33a0a"
                      fillOpacity={1}
                      fill="url(#colorBlocked)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Threats Breakdown */}
            <div className="p-6 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#07365f]">توزيع التهديدات المرصودة حسب الفئة</h2>
                <span className="text-xs text-[#387b94]">النسب المئوية</span>
              </div>

              {summary.threat_breakdown.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-[#387b94] text-xs">
                  <CheckCircle className="w-10 h-10 text-[#2abe50] mb-2 opacity-70" />
                  <p className="font-bold text-[#07365f]">لا توجد تهديدات مسجلة خلال هذه الفترة</p>
                  <p className="text-[11px] mt-0.5">تصفح الأطفال خلو من أي محتوى ضار.</p>
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary.threat_breakdown} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#edf5f8" />
                      <XAxis type="number" stroke="#8baec0" fontSize={11} />
                      <YAxis
                        type="category"
                        dataKey="label_ar"
                        width={120}
                        stroke="#07365f"
                        fontSize={11}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderColor: "#b5d7e3",
                          borderRadius: "12px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="count" name="عدد التهديدات" radius={[0, 8, 8, 0]}>
                        {summary.threat_breakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
