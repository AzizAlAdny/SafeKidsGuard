"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Shield, Lock, Bell, MessageCircle, ArrowLeft, Cpu } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router, initialize]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#041b2f] via-[#07365f] to-[#0b518e] text-white">
      {/* Top Navbar */}
      <header className="p-6 max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-lg shadow-[#1bc3e4]/30 bg-white p-0.5 border border-white/30 flex-shrink-0">
            <Image
              src="/logo.jpeg"
              alt="Safe Kids Guard Logo"
              width={48}
              height={48}
              className="object-cover rounded-xl w-full h-full"
              priority
            />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-wide">Safe Kids Guard</h1>
            <p className="text-xs text-[#76dbef] font-medium">حارس الأطفال الآمن</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 transition"
          >
            تسجيل الدخول
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#07365f] bg-[#1bc3e4] hover:bg-[#48cfea] transition shadow-md shadow-[#1bc3e4]/20"
          >
            حساب جديد
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto py-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-[#76dbef] mb-6 border border-white/10">
          <Cpu className="w-4 h-4 text-[#1bc3e4]" />
          <span>مدعوم بنماذج AraBERT v2 و CAMeLBERT المخصصة للهجات العربية</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black leading-tight sm:leading-tight mb-6">
          حماية ذكية لأطفالك في العالم الرقمي
        </h1>

        <p className="text-base sm:text-xl text-[#d1f3fa] mb-10 max-w-2xl font-normal leading-relaxed">
          نظام متقدم لرصد وتحليل المحتوى المسيء والتنمر الإلكتروني والتهديدات على أجهزة الأطفال، مع إرسال تنبيهات لحظية للأهل مباشرة عبر تطبيق الواتساب.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-[#159cb7] to-[#1bc3e4] hover:opacity-95 shadow-lg shadow-[#1bc3e4]/30 transition flex items-center justify-center gap-2"
          >
            <span>ابدأ الحماية الآن مجاناً</span>
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold text-white/90 bg-white/10 hover:bg-white/15 border border-white/20 transition"
          >
            دخول لوحة التحكم
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 text-right w-full">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-[#1bc3e4]/20 text-[#1bc3e4] flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-[#2abe50]" />
            </div>
            <h3 className="font-bold text-lg mb-2">تنبيهات واتساب فورية</h3>
            <p className="text-sm text-[#a4e7f4] leading-relaxed">
              تصلك إشعارات الطوارئ ورصد المحتوى الخطير مباشرة على رقم واتساب الخاص بك عبر Meta Business API.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-[#1bc3e4]/20 text-[#1bc3e4] flex items-center justify-center mb-4">
              <Cpu className="w-6 h-6 text-[#1bc3e4]" />
            </div>
            <h3 className="font-bold text-lg mb-2">ذكاء اصطناعي عربي مزدوج</h3>
            <p className="text-sm text-[#a4e7f4] leading-relaxed">
              تحليل دقيق يفهم العربية الفصحى واللهجات الخليجية والسعودية لاكتشاف التنمر والتحريض والكراهية.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-[#1bc3e4]/20 text-[#1bc3e4] flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-[#7455aa]" />
            </div>
            <h3 className="font-bold text-lg mb-2">خصوصية وأمان تام</h3>
            <p className="text-sm text-[#a4e7f4] leading-relaxed">
              تشفير كامل لكافة البيانات مع تخزين آمن وامتثال كامل لمعايير حماية البيانات السعودية.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-[#76dbef]/70 border-t border-white/10">
        مشروع التخرج — جامعة جدة (UJ) — كلية علوم وهندسة الحاسب — 1447هـ / 2026م
      </footer>
    </div>
  );
}
