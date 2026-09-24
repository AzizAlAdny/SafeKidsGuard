"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Shield, Lock, Mail, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const resp = await api.post("/auth/login", { email, password });
      const { user, access_token, refresh_token } = resp.data;
      login(user, access_token, refresh_token);
      router.push("/dashboard");
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      } else {
        setError(err.response?.data?.detail || "حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#041b2f] via-[#07365f] to-[#0b518e]">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-xl shadow-[#1bc3e4]/30 mb-4 bg-white p-1 border border-white/40">
            <Image
              src="/logo.jpeg"
              alt="Safe Kids Guard Logo"
              width={80}
              height={80}
              className="object-cover rounded-xl w-full h-full"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-[#07365f]">Safe Kids Guard</h1>
          <p className="text-sm text-[#387b94] mt-1 font-medium">لوحة تحكم ولي الأمر الآمنة</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#e33a0a]" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[#07365f] mb-1.5 text-right">
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

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-semibold text-[#07365f]">كلمة المرور</label>
              <a href="#" className="text-xs text-[#159cb7] hover:underline font-medium">
                نسيت كلمة المرور؟
              </a>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
                className="w-full px-4 py-3 pl-11 rounded-xl border border-[#b5d7e3] focus:border-[#1bc3e4] focus:ring-2 focus:ring-[#1bc3e4]/20 outline-none transition text-sm text-[#07365f] bg-[#edf5f8]/30 placeholder:text-gray-400"
              />
              <Lock className="w-5 h-5 text-[#387b94] absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-[#159cb7] to-[#1bc3e4] hover:opacity-95 shadow-md shadow-[#1bc3e4]/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري تسجيل الدخول...</span>
              </>
            ) : (
              <>
                <span>تسجيل الدخول</span>
                <ArrowLeft className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-[#387b94]">
          ليس لديك حساب؟{" "}
          <Link href="/register" className="font-bold text-[#107589] hover:text-[#1bc3e4] transition">
            إنشاء حساب جديد
          </Link>
        </div>
      </div>
    </div>
  );
}
