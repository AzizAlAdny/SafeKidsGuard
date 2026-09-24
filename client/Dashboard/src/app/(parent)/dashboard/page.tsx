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
  ExternalLink,
  ChevronLeft,
  Plus,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

export default function DashboardPage() {
  const { user } = useAuthStore();

  const [stats] = useState({
    totalMessagesAnalyzed: 1420,
    threatsBlocked: 14,
    activeChildren: 2,
    protectionLevel: "حماية مشددة (ذكاء اصطناعي)",
  });

  const [childrenList] = useState([
    {
      id: "1",
      name: "سعد",
      nickname: "سعودي",
      device: "Samsung Galaxy A54 (Android 14)",
      battery: 84,
      status: "آمن الآن",
      lastActive: "منذ دقيقتين",
      todayBlocked: 1,
    },
    {
      id: "2",
      name: "سارة",
      nickname: "سارونة",
      device: "Xiaomi Redmi Note 12",
      battery: 62,
      status: "آمن الآن",
      lastActive: "منذ 15 دقيقة",
      todayBlocked: 0,
    },
  ]);

  const [recentAlerts] = useState([
    {
      id: "a1",
      childName: "سعد",
      category: "CYBERBULLYING",
      categoryArabic: "تنمر إلكتروني",
      confidence: 94.2,
      time: "منذ 18 دقيقة",
      status: "تم الحظر تلقائياً",
      whatsappSent: true,
      snippet: "رسالة تتضمن إساءة لفظية وتهديد...",
    },
    {
      id: "a2",
      childName: "سعد",
      category: "VIOLENCE",
      categoryArabic: "تحريض وعنف",
      confidence: 88.5,
      time: "اليوم 02:40 م",
      status: "تم الحظر تلقائياً",
      whatsappSent: true,
      snippet: "محتوى يروّج لأفعال عدوانية...",
    },
    {
      id: "a3",
      childName: "سارة",
      category: "HATE_SPEECH",
      categoryArabic: "خطاب كراهية",
      confidence: 91.0,
      time: "أمس 08:15 م",
      status: "تم الحظر تلقائياً",
      whatsappSent: true,
      snippet: "عبارات تمييزية مسيئة...",
    },
  ]);

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
            <p className="text-xs font-semibold text-[#387b94]">الأجهزة المتصلة</p>
            <h3 className="text-2xl font-bold text-[#07365f] mt-1">{stats.activeChildren} أجهزة</h3>
            <span className="text-[11px] text-[#2abe50] font-medium flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> جميعها محمية
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#d1f3fa] flex items-center justify-center text-[#159cb7]">
            <Smartphone className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#387b94]">الرسائل المفحوصة اليوم</p>
            <h3 className="text-2xl font-bold text-[#07365f] mt-1">{stats.totalMessagesAnalyzed}</h3>
            <span className="text-[11px] text-[#159cb7] font-medium mt-1 block">فحص فوري &lt; 200ms</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#e7f3fd] flex items-center justify-center text-[#0b518e]">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#387b94]">المحتوى المحظور</p>
            <h3 className="text-2xl font-bold text-[#e33a0a] mt-1">{stats.threatsBlocked} تهديد</h3>
            <span className="text-[11px] text-[#e33a0a] font-medium mt-1 block">تم التصدي بنجاح 100%</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-[#e33a0a]">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#387b94]">تنبيهات الواتساب</p>
            <h3 className="text-2xl font-bold text-[#2abe50] mt-1">مفعلة ✅</h3>
            <span className="text-[11px] text-[#2abe50] font-medium mt-1 block">Meta Business Cloud API</span>
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
            <p className="text-xs text-[#387b94]">حالة النشاط والبطارية والحماية اللحظية</p>
          </div>
          <Link
            href="/children"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1bc3e4] text-[#07365f] text-xs font-bold hover:bg-[#48cfea] transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>ربط جهاز طفل جديد</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {childrenList.map((child) => (
            <div
              key={child.id}
              className="p-5 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7455aa] to-[#1bc3e4] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    {child.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#07365f]">{child.name} ({child.nickname})</h3>
                    <p className="text-xs text-[#387b94]">{child.device}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#eaf9ef] text-[#2abe50] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2abe50]"></span>
                  {child.status}
                </span>
              </div>

              <div className="mt-5 pt-4 border-t border-[#b5d7e3]/30 flex items-center justify-between text-xs text-[#387b94]">
                <span>البطارية: <strong>{child.battery}%</strong></span>
                <span>آخر ظهور: <strong>{child.lastActive}</strong></span>
                <span className="text-[#e33a0a] font-medium">محظورات اليوم: {child.todayBlocked}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Alerts Feed */}
      <div className="p-6 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-[#07365f]">آخر التنبيهات المرصودة</h2>
            <p className="text-xs text-[#387b94]">تم تحليلها وتصنيفها وإرسالها فورياً لهاتفك</p>
          </div>
          <Link
            href="/alerts"
            className="text-xs font-bold text-[#107589] hover:text-[#1bc3e4] transition flex items-center gap-1"
          >
            <span>عرض السجل الكامل</span>
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-3">
          {recentAlerts.map((alert) => (
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
                    <span className="font-bold text-sm text-[#07365f]">{alert.childName}</span>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#7455aa]/15 text-[#7455aa]">
                      {alert.categoryArabic}
                    </span>
                    <span className="text-[11px] text-[#387b94]">نسبة الثقة: {alert.confidence}%</span>
                  </div>
                  <p className="text-xs text-[#387b94] mt-1">{alert.snippet}</p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                {alert.whatsappSent && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2abe50] bg-[#eaf9ef] px-2 py-1 rounded-md">
                    <MessageCircle className="w-3.5 h-3.5" />
                    أُرسل للواتساب
                  </span>
                )}
                <span className="text-gray-400">{alert.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
