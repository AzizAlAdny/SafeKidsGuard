"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Shield, Lock, Mail, User, Phone, ArrowLeft, Loader2, AlertCircle, MessageCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export default function RegisterPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Sanitize Saudi phone number format
    let cleanPhone = whatsappPhone.trim().replace(/[\s\-+]/g, "");
    if (cleanPhone.startsWith("05")) {
      cleanPhone = "966" + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith("5")) {
      cleanPhone = "966" + cleanPhone;
    }

    if (!cleanPhone.startsWith("966") || cleanPhone.length !== 12) {
      setError("يرجى إدخال رقم هاتف سعودي صحيح بصيغة 966XXXXXXXXX أو 05XXXXXXXX");
      return;
    }

    if (password.length < 8) {
      setError("يجب أن تكون كلمة المرور 8 خانات على الأقل");
      return;
    }

    setLoading(true);

    try {
      const resp = await api.post("/auth/register", {
        full_name: fullName,
        email,
        password,
        role: "parent",
        whatsapp_phone: cleanPhone,
      });

      const { user, access_token, refresh_token } = resp.data;
      login(user, access_token, refresh_token);
      router.push("/dashboard");
    } catch (err: any) {
      if (err.response?.status === 400) {
        setError(err.response?.data?.detail || "البريد الإلكتروني مسجل بالفعل مسبقاً");
      } else if (err.response?.status === 422) {
        setError("بيانات الإدخال غير صالحة. يرجى التأكد من صحة رقم الهاتف والبريد.");
      } else {
        setError("حدث خطأ في إنشاء الحساب. يرجى المحاولة لاحقاً.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#041b2f] via-[#07365f] to-[#0b518e]">
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20 my-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-xl shadow-[#1bc3e4]/30 mb-3 bg-white p-1 border border-white/40">
            <Image
              src="/logo.jpeg"
              alt="Safe Kids Guard Logo"
              width={80}
              height={80}
              className="object-cover rounded-xl w-full h-full"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-[#07365f]">إنشاء حساب ولي أمر جديد</h1>
          <p className="text-sm text-[#387b94] mt-1 font-medium">ابدأ حماية أطفالك فوراً بأحدث تقنيات الذكاء الاصطناعي</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#e33a0a]" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#07365f] mb-1 text-right">
              الاسم الكامل
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="أحمد محمد"
                className="w-full px-4 py-3 pl-11 rounded-xl border border-[#b5d7e3] focus:border-[#1bc3e4] focus:ring-2 focus:ring-[#1bc3e4]/20 outline-none transition text-sm text-[#07365f] bg-[#edf5f8]/30 placeholder:text-gray-400"
              />
              <User className="w-5 h-5 text-[#387b94] absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#07365f] mb-1 text-right">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                dir="ltr"
                className="w-full px-4 py-3 pl-11 rounded-xl border border-[#b5d7e3] focus:border-[#1bc3e4] focus:ring-2 focus:ring-[#1bc3e4]/20 outline-none transition text-sm text-[#07365f] bg-[#edf5f8]/30 placeholder:text-gray-400"
              />
              <Mail className="w-5 h-5 text-[#387b94] absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* WhatsApp Phone Field — Mandatory Primary Channel */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-semibold text-[#07365f] flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-[#2abe50]" />
                <span>رقم الواتساب للتنبيهات الفورية (مطلوب)</span>
              </label>
            </div>
            <div className="relative">
              <input
                type="tel"
                required
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="05XXXXXXXX أو +9665XXXXXXXX"
                dir="ltr"
                className="w-full px-4 py-3 pl-11 rounded-xl border border-[#2abe50]/50 focus:border-[#2abe50] focus:ring-2 focus:ring-[#2abe50]/20 outline-none transition text-sm text-[#07365f] bg-[#eaf9ef]/30 placeholder:text-gray-400 font-mono"
              />
              <Phone className="w-5 h-5 text-[#2abe50] absolute left-3.5 top-3.5" />
            </div>
            <p className="text-xs text-[#159cb7] mt-1.5 flex items-center gap-1">
              <span>⚡</span>
              <span>ستصلك تنبيهات المحتوى المسيء والتنمر فورياً عبر رسائل واتساب الرسمية</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#07365f] mb-1 text-right">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••• (8 أحرف على الأقل)"
                dir="ltr"
                className="w-full px-4 py-3 pl-11 rounded-xl border border-[#b5d7e3] focus:border-[#1bc3e4] focus:ring-2 focus:ring-[#1bc3e4]/20 outline-none transition text-sm text-[#07365f] bg-[#edf5f8]/30 placeholder:text-gray-400"
              />
              <Lock className="w-5 h-5 text-[#387b94] absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 rounded-xl font-bold text-white bg-gradient-to-r from-[#159cb7] to-[#1bc3e4] hover:opacity-95 shadow-md shadow-[#1bc3e4]/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري إنشاء الحساب...</span>
              </>
            ) : (
              <>
                <span>إنشاء الحساب ومتابعة الحماية</span>
                <ArrowLeft className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-[#387b94]">
          لديك حساب بالفعل؟{" "}
          <Link href="/login" className="font-bold text-[#107589] hover:text-[#1bc3e4] transition">
            تسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}
