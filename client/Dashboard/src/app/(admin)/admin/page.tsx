"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  BrainCircuit,
  Flag,
  ShieldAlert,
  CheckCircle2,
  Settings,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

export default function AdminOverviewPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [usersCount, setUsersCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const [metricsRes, usersRes] = await Promise.all([
          api.get("/admin/ai-metrics"),
          api.get("/admin/users"),
        ]);
        setMetrics(metricsRes.data);
        setUsersCount(Array.isArray(usersRes.data) ? usersRes.data.length : 0);
      } catch (err) {
        console.error("Failed to load admin overview:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3 text-[#387b94]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1bc3e4]" />
        <span>جاري تحميل إحصائيات النظام...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#07365f]">
          لوحة الإدارة المركزية — Safe Kids Guard
        </h1>
        <p className="text-sm text-[#387b94] mt-1">
          مراقبة أداء النظام، حسابات المستخدمين، دقة نماذج الذكاء الاصطناعي، ومراجعة البلاغات (FR10–FR13)
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#387b94]">إجمالي المستخدمين</span>
            <Users className="w-5 h-5 text-[#159cb7]" />
          </div>
          <p className="text-3xl font-bold text-[#07365f]">{usersCount}</p>
          <p className="text-xs text-[#2abe50]">أولياء أمور، أطفال، ومشرفين</p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#387b94]">إجمالي عمليات الفحص</span>
            <BrainCircuit className="w-5 h-5 text-[#7455aa]" />
          </div>
          <p className="text-3xl font-bold text-[#07365f]">
            {metrics?.total_predictions ?? 0}
          </p>
          <p className="text-xs text-[#387b94]">
            متوسط الثقة: {((metrics?.average_confidence ?? 0.98) * 100).toFixed(1)}%
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#387b94]">تهديدات تم حظرها</span>
            <ShieldAlert className="w-5 h-5 text-[#e33a0a]" />
          </div>
          <p className="text-3xl font-bold text-[#e33a0a]">{metrics?.total_blocked ?? 0}</p>
          <p className="text-xs text-[#387b94]">
            مسموح: {metrics?.total_allowed ?? 0}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#387b94]">بانتظار المراجعة</span>
            <Flag className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-[#07365f]">{metrics?.pending_reviews ?? 0}</p>
          <p className="text-xs text-[#2abe50]">
            بلاغات خاطئة مصححة: {metrics?.false_positives_approved ?? 0}
          </p>
        </div>
      </div>

      {/* Quick Admin Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/admin/users"
          className="p-6 rounded-2xl bg-white border border-[#b5d7e3]/40 hover:border-[#1bc3e4] shadow-sm transition space-y-2"
        >
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-[#159cb7]" />
            <h2 className="font-bold text-lg text-[#07365f]">إدارة حسابات المستخدمين (UC-A1)</h2>
          </div>
          <p className="text-xs text-[#387b94]">
            عرض وتفعيل أو تعطيل وحذف حسابات أولياء الأمور والأطفال وتعيين صلاحيات المشرفين.
          </p>
        </Link>

        <Link
          href="/admin/models"
          className="p-6 rounded-2xl bg-white border border-[#b5d7e3]/40 hover:border-[#1bc3e4] shadow-sm transition space-y-2"
        >
          <div className="flex items-center gap-3">
            <BrainCircuit className="w-6 h-6 text-[#7455aa]" />
            <h2 className="font-bold text-lg text-[#07365f]">
              مراقبة نماذج الذكاء الاصطناعي واللغة العربية (UC-A2, UC-A5)
            </h2>
          </div>
          <p className="text-xs text-[#387b94]">
            متابعة أداء AraBERTv2 و CAMeLBERT وتوزيع الفئات واختبار المصنف العربي مباشرة.
          </p>
        </Link>

        <Link
          href="/admin/flagged"
          className="p-6 rounded-2xl bg-white border border-[#b5d7e3]/40 hover:border-[#1bc3e4] shadow-sm transition space-y-2"
        >
          <div className="flex items-center gap-3">
            <Flag className="w-6 h-6 text-amber-500" />
            <h2 className="font-bold text-lg text-[#07365f]">
              مراجعة المحتوى المبلّغ وطلبات السماح (UC-A4)
            </h2>
          </div>
          <p className="text-xs text-[#387b94]">
            مراجعة التنبيهات المحظورة وطلبات الأطفال لتصحيح الإيجابيات الخاطئة (False Positives).
          </p>
        </Link>

        <Link
          href="/admin/settings"
          className="p-6 rounded-2xl bg-white border border-[#b5d7e3]/40 hover:border-[#1bc3e4] shadow-sm transition space-y-2"
        >
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-[#07365f]" />
            <h2 className="font-bold text-lg text-[#07365f]">
              إعدادات النظام والأمان الشاملة (UC-A6)
            </h2>
          </div>
          <p className="text-xs text-[#387b94]">
            ضبط عتبة الثقة الافتراضية للذكاء الاصطناعي وتفعيل النماذج العصبية وإعدادات الأمان.
          </p>
        </Link>
      </div>
    </div>
  );
}
