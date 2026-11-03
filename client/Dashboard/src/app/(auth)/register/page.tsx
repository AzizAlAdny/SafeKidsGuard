"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Shield,
  Lock,
  Mail,
  User,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Check,
  X,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { extractErrorMessage } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Password Policy Criteria
  const passwordCriteria = {
    length: password.length >= 8,
    hasLetter: /[a-zA-Z\u0600-\u06FF]/.test(password),
    hasNumber: /\d/.test(password),
    hasMixed:
      (/[a-z]/.test(password) && /[A-Z]/.test(password)) ||
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password),
  };

  const criteriaCount = [
    passwordCriteria.length,
    passwordCriteria.hasLetter,
    passwordCriteria.hasNumber,
    passwordCriteria.hasMixed,
  ].filter(Boolean).length;

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Password Policy Validation
    if (password.length < 8) {
      setError("يجب أن تكون كلمة المرور 8 خانات على الأقل وفقاً لسياسة الأمان");
      return;
    }

    if (!passwordCriteria.hasLetter || !passwordCriteria.hasNumber) {
      setError("يجب أن تحتوي كلمة المرور على أحرف وأرقام معاً");
      return;
    }

    // Confirm Password Validation
    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين، يرجى إعادة إدخالها للتأكيد");
      return;
    }

    setLoading(true);

    try {
      const resp = await api.post("/auth/register", {
        full_name: fullName,
        email,
        password,
        role: "parent",
      });

      const { user, access_token, refresh_token } = resp.data;
      login(user, access_token, refresh_token);
      router.push("/dashboard");
    } catch (err: any) {
      if (err.response?.status === 400) {
        setError(extractErrorMessage(err, "البريد الإلكتروني مسجل بالفعل مسبقاً"));
      } else if (err.response?.status === 422) {
        setError(extractErrorMessage(err, "بيانات الإدخال غير صالحة. يرجى التأكد من صحة البريد وكلمة المرور."));
      } else {
        setError(extractErrorMessage(err, "حدث خطأ في إنشاء الحساب. يرجى المحاولة لاحقاً."));
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
          {/* Full Name */}
          <div>
            <label htmlFor="reg_full_name" className="block text-sm font-semibold text-[#07365f] mb-1 text-right">
              الاسم الكامل
            </label>
            <div className="relative">
              <input
                id="reg_full_name"
                name="name"
                autoComplete="name"
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

          {/* Email */}
          <div>
            <label htmlFor="reg_email" className="block text-sm font-semibold text-[#07365f] mb-1 text-right">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <input
                id="reg_email"
                name="email"
                autoComplete="email"
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

          {/* Password Field */}
          <div>
            <label htmlFor="reg_password" className="block text-sm font-semibold text-[#07365f] mb-1 text-right">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                id="reg_password"
                name="password"
                autoComplete="new-password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
                className="w-full px-4 py-3 pl-11 pr-11 rounded-xl border border-[#b5d7e3] focus:border-[#1bc3e4] focus:ring-2 focus:ring-[#1bc3e4]/20 outline-none transition text-sm text-[#07365f] bg-[#edf5f8]/30 placeholder:text-gray-400 font-mono"
              />
              <Lock className="w-5 h-5 text-[#387b94] absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-[#387b94] hover:text-[#07365f] focus:outline-none cursor-pointer"
                aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password Policy & Strength Indicator */}
            {password.length > 0 && (
              <div className="mt-2.5 p-3 rounded-xl bg-[#edf5f8]/70 border border-[#b5d7e3]/40 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#07365f] flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-[#159cb7]" />
                    <span>قوة كلمة المرور:</span>
                  </span>
                  <span
                    className={`font-bold text-xs ${
                      criteriaCount <= 1
                        ? "text-red-600"
                        : criteriaCount <= 3
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {criteriaCount <= 1 ? "ضعيفة" : criteriaCount <= 3 ? "متوسطة" : "قوية جداً"}
                  </span>
                </div>

                {/* Strength Meter Bar */}
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden flex gap-1">
                  <div
                    className={`h-full flex-1 transition-all rounded-full ${
                      criteriaCount >= 1
                        ? criteriaCount === 1
                          ? "bg-red-500"
                          : criteriaCount <= 3
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                        : "bg-transparent"
                    }`}
                  />
                  <div
                    className={`h-full flex-1 transition-all rounded-full ${
                      criteriaCount >= 2
                        ? criteriaCount <= 3
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                        : "bg-transparent"
                    }`}
                  />
                  <div
                    className={`h-full flex-1 transition-all rounded-full ${
                      criteriaCount >= 3
                        ? criteriaCount === 3
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                        : "bg-transparent"
                    }`}
                  />
                  <div
                    className={`h-full flex-1 transition-all rounded-full ${
                      criteriaCount >= 4 ? "bg-emerald-500" : "bg-transparent"
                    }`}
                  />
                </div>

                {/* Policy Checklist */}
                <ul className="text-[11px] space-y-1 text-[#387b94] pt-1">
                  <li className="flex items-center gap-1.5">
                    {passwordCriteria.length ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1 flex-shrink-0" />
                    )}
                    <span className={passwordCriteria.length ? "text-emerald-700 font-medium" : ""}>
                      8 خانات على الأقل
                    </span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    {passwordCriteria.hasLetter && passwordCriteria.hasNumber ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1 flex-shrink-0" />
                    )}
                    <span
                      className={
                        passwordCriteria.hasLetter && passwordCriteria.hasNumber
                          ? "text-emerald-700 font-medium"
                          : ""
                      }
                    >
                      تتضمن أحرفاً وأرقاماً معاً
                    </span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    {passwordCriteria.hasMixed ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1 flex-shrink-0" />
                    )}
                    <span className={passwordCriteria.hasMixed ? "text-emerald-700 font-medium" : ""}>
                      حرف كبير وصغير أو رمز خاص (مثل @, #, $, !)
                    </span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="reg_confirm_password" className="block text-sm font-semibold text-[#07365f] text-right">
                تأكيد كلمة المرور
              </label>
              {passwordsMatch && (
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>كلمتا المرور متطابقتان</span>
                </span>
              )}
              {passwordsMismatch && (
                <span className="text-[11px] text-red-600 font-medium flex items-center gap-1">
                  <X className="w-3.5 h-3.5" />
                  <span>غير متطابقتين</span>
                </span>
              )}
            </div>
            <div className="relative">
              <input
                id="reg_confirm_password"
                name="confirm_password"
                autoComplete="new-password"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
                className={`w-full px-4 py-3 pl-11 pr-11 rounded-xl border outline-none transition text-sm text-[#07365f] bg-[#edf5f8]/30 placeholder:text-gray-400 font-mono ${
                  passwordsMatch
                    ? "border-emerald-500 ring-1 ring-emerald-500/20"
                    : passwordsMismatch
                    ? "border-red-400 ring-1 ring-red-400/20"
                    : "border-[#b5d7e3] focus:border-[#1bc3e4] focus:ring-2 focus:ring-[#1bc3e4]/20"
                }`}
              />
              <Lock className="w-5 h-5 text-[#387b94] absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-3.5 text-[#387b94] hover:text-[#07365f] focus:outline-none cursor-pointer"
                aria-label={showConfirmPassword ? "إخفاء تأكيد كلمة المرور" : "إظهار تأكيد كلمة المرور"}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
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
