"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  Smartphone,
  CheckCircle2,
  MessageCircle,
  ChevronLeft,
  Plus,
  Loader2,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";

interface ChildItem {
  id: string;
  full_name: string;
  nickname: string | null;
  email: string;
}

interface AlertItem {
  id: string;
  child_id: string;
  category: string;
  content_snippet: string;
  confidence: number;
  verdict: string;
  context_app: string | null;
  whatsapp_sent: boolean;
  created_at: string;
}

interface ReportSummary {
  total_events: number;
  blocked_events: number;
  allowed_events: number;
  safety_score: number;
}

const CATEGORY_MAP: Record<string, { label: string; color: string; bgColor: string }> = {
  CYBERBULLYING: { label: "تنمر إلكتروني", color: "#7455aa", bgColor: "#f1eef6" },
  VIOLENCE: { label: "عنف وتحريض", color: "#f0a83d", bgColor: "#fef8ee" },
  SEXUAL: { label: "محتوى غير لائق", color: "#e33a0a", bgColor: "#fdece7" },
  HATE_SPEECH: { label: "خطاب كراهية", color: "#0b518e", bgColor: "#e7f3fd" },
  SAFE: { label: "محتوى آمن", color: "#2abe50", bgColor: "#eaf9ef" },
};

function formatRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 60) return "الآن";
    if (diffSec < 3600) return `منذ ${Math.floor(diffSec / 60)} دقيقة`;
    if (diffSec < 86400) return `منذ ${Math.floor(diffSec / 3600)} ساعة`;
    return d.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMessagesAnalyzed: 0,
    threatsBlocked: 0,
    activeChildren: 0,
    whatsappEnabled: false,
    safetyScore: 100,
  });

  const [childrenList, setChildrenList] = useState<ChildItem[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [childrenRes, summaryRes, alertsRes, prefsRes] = await Promise.allSettled([
          api.get("/auth/children"),
          api.get("/reports/summary?days=7"),
          api.get("/alerts?limit=5"),
          api.get("/notifications/preferences"),
        ]);

        const children: ChildItem[] =
          childrenRes.status === "fulfilled" && childrenRes.value.data?.children
            ? childrenRes.value.data.children
            : [];
        setChildrenList(children);

        const summary: ReportSummary =
          summaryRes.status === "fulfilled" && summaryRes.value.data
            ? summaryRes.value.data
            : { total_events: 0, blocked_events: 0, allowed_events: 0, safety_score: 100 };

        const alerts: AlertItem[] =
          alertsRes.status === "fulfilled" && Array.isArray(alertsRes.value.data)
            ? alertsRes.value.data
            : [];
        setRecentAlerts(alerts);

        const isWhatsappActive =
          prefsRes.status === "fulfilled" && prefsRes.value.data?.whatsapp_enabled === true;

        setStats({
          totalMessagesAnalyzed: summary.total_events,
          threatsBlocked: summary.blocked_events,
          activeChildren: children.length,
          whatsappEnabled: isWhatsappActive,
          safetyScore: Math.round(summary.safety_score || 100),
        });
      } catch (err) {
        console.error("Failed to load dashboard live data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const childrenMap = childrenList.reduce<Record<string, string>>((acc, c) => {
    acc[c.id] = c.full_name || c.nickname || "طفل";
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="rounded-2xl p-6 md:p-8 bg-gradient-to-r from-[#07365f] via-[#0b518e] to-[#1bc3e4] text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-[#2abe50] animate-pulse"></span>
            نظام المراقبة الذكي نشط ويعمل بأمان
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">
            مرحباً بك، {user?.full_name || "ولي الأمر"} 👋
          </h1>
          <p className="text-sm md:text-base text-[#d1f3fa] mt-1 max-w-2xl leading-relaxed">
            محرك AraBERT v2 و CAMeLBERT يراقب المحتوى العربي واللهجات المحلية لحماية أطفالك على مدار الساعة.
          </p>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="p-5 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#387b94]">الأجهزة المقترنة</p>
            <h3 className="text-2xl font-bold text-[#07365f] mt-1">
              {loading ? "..." : `${stats.activeChildren} أجهزة`}
            </h3>
            <span className="text-[11px] text-[#2abe50] font-medium flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {stats.activeChildren > 0 ? "متصلة ومحمية" : "بانتظار الاقتران"}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#d1f3fa] flex items-center justify-center text-[#159cb7]">
            <Smartphone className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#387b94]">الرسائل المفحوصة (7 أيام)</p>
            <h3 className="text-2xl font-bold text-[#07365f] mt-1">
              {loading ? "..." : stats.totalMessagesAnalyzed}
            </h3>
            <span className="text-[11px] text-[#159cb7] font-medium mt-1 block">
              فحص لحظي بالذكاء الاصطناعي
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#e7f3fd] flex items-center justify-center text-[#0b518e]">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#387b94]">المحتوى المحظور</p>
            <h3 className="text-2xl font-bold text-[#e33a0a] mt-1">
              {loading ? "..." : `${stats.threatsBlocked} تهديد`}
            </h3>
            <span className="text-[11px] text-[#e33a0a] font-medium mt-1 block">
              مؤشر الأمان: {stats.safetyScore}%
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-[#e33a0a]">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#387b94]">تنبيهات الواتساب</p>
            <h3 className="text-2xl font-bold text-[#2abe50] mt-1">
              {stats.whatsappEnabled ? "مفعلة ✅" : "غير مفعلة ⚠️"}
            </h3>
            <Link
              href="/notifications"
              className="text-[11px] text-[#159cb7] hover:underline font-medium mt-1 block"
            >
              ضبط رقم واتساب للأهل
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#eaf9ef] flex items-center justify-center text-[#2abe50]">
            <MessageCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Children Overview Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#07365f]">أجهزة الأطفال قيد المراقبة</h2>
            <p className="text-xs text-[#387b94]">حالة الاتصال والحماية اللحظية للأجهزة</p>
          </div>
          <Link
            href="/children"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1bc3e4] text-[#07365f] text-xs font-bold hover:bg-[#48cfea] transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>ربط جهاز طفل جديد</span>
          </Link>
        </div>

        {loading ? (
          <div className="p-8 bg-white rounded-2xl border border-[#b5d7e3]/40 flex items-center justify-center text-[#387b94] text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-[#1bc3e4] ml-2" />
            جاري تحميل قائمة أجهزة الأطفال...
          </div>
        ) : childrenList.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl border border-[#b5d7e3]/40 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-[#edf5f8] text-[#07365f] flex items-center justify-center mb-2">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-[#07365f]">لم يتم ربط أجهزة أطفال بعد</h3>
            <p className="text-xs text-[#387b94] mt-1 max-w-sm">
              قم بإضافة حساب طفل للحصول على رمز الاقتران وتفعيل الرقابة الذكية على هاتفه.
            </p>
            <Link
              href="/children"
              className="mt-4 px-4 py-2 rounded-xl bg-[#07365f] text-white text-xs font-bold hover:bg-[#0b518e] transition"
            >
              إضافة طفل الآن
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {childrenList.map((child) => (
              <div
                key={child.id}
                className="p-5 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7455aa] to-[#1bc3e4] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                      {child.full_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#07365f]">
                        {child.full_name} {child.nickname ? `(${child.nickname})` : ""}
                      </h3>
                      <p className="text-xs text-[#387b94]">{child.email}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#eaf9ef] text-[#2abe50] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2abe50]"></span>
                    متصل ومحمي
                  </span>
                </div>

                <div className="mt-5 pt-4 border-t border-[#b5d7e3]/30 flex items-center justify-between text-xs text-[#387b94]">
                  <span>الجهاز: <strong>Android Smartphone</strong></span>
                  <Link
                    href={`/policies`}
                    className="text-[#107589] font-bold hover:underline"
                  >
                    تخصيص سياسة الحماية ⚙️
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Alerts Feed */}
      <div className="p-6 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-[#07365f]">آخر التنبيهات المرصودة</h2>
            <p className="text-xs text-[#387b94]">تم تحليلها وتصنيفها بالذكاء الاصطناعي</p>
          </div>
          <Link
            href="/alerts"
            className="text-xs font-bold text-[#107589] hover:text-[#1bc3e4] transition flex items-center gap-1"
          >
            <span>عرض السجل الكامل</span>
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="py-10 flex items-center justify-center text-xs text-[#387b94]">
            <Loader2 className="w-5 h-5 animate-spin text-[#1bc3e4] ml-2" />
            جاري تحميل التنبيهات الأخيرة...
          </div>
        ) : recentAlerts.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-[#eaf9ef] text-[#2abe50] flex items-center justify-center mb-2">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-[#07365f]">لا توجد تنبيهات مرصودة حديثاً</p>
            <p className="text-[11px] text-[#387b94] mt-0.5">
              لم يتم رصد أي محتوى ضار على أجهزة الأطفال في الفترة الأخيرة.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentAlerts.map((alert) => {
              const cat = CATEGORY_MAP[alert.category] || {
                label: alert.category,
                color: "#7455aa",
                bgColor: "#f1eef6",
              };
              const childName = childrenMap[alert.child_id] || "جهاز طفل";

              return (
                <div
                  key={alert.id}
                  className="p-4 rounded-xl border border-[#b5d7e3]/30 hover:border-[#1bc3e4]/50 bg-[#edf5f8]/20 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 text-[#e33a0a] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#07365f]">{childName}</span>
                        <span
                          className="px-2 py-0.5 rounded-md text-[11px] font-bold"
                          style={{ backgroundColor: cat.bgColor, color: cat.color }}
                        >
                          {cat.label}
                        </span>
                        <span className="text-[11px] text-[#387b94]">
                          نسبة الثقة: {(alert.confidence > 1 ? alert.confidence : alert.confidence * 100).toFixed(1)}%
                        </span>
                        {alert.context_app && (
                          <span className="text-[11px] text-[#387b94] bg-white px-2 py-0.5 rounded border border-[#b5d7e3]/40">
                            {alert.context_app}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#07365f] mt-1 line-clamp-1">
                        {alert.content_snippet}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                    {alert.whatsapp_sent && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2abe50] bg-[#eaf9ef] px-2 py-1 rounded-md whitespace-nowrap">
                        <MessageCircle className="w-3.5 h-3.5" />
                        أُرسل للواتساب
                      </span>
                    )}
                    <span className="text-gray-400 whitespace-nowrap">
                      {formatRelativeTime(alert.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
