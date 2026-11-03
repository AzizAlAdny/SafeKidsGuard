"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Smartphone,
  QrCode,
  RefreshCw,
  CheckCircle2,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/utils";

interface ChildCardItem {
  id: string;
  name: string;
  nickname: string;
  email: string;
  device: string;
  pairingCode: string;
  isPaired: boolean;
  status: string;
}

export default function ChildrenPage() {
  const [childrenList, setChildrenList] = useState<ChildCardItem[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingPinFor, setGeneratingPinFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadChildren = async () => {
    setInitialLoading(true);
    try {
      const res = await api.get("/auth/children");
      const list = res.data?.children || [];
      setChildrenList(
        list.map((c: any) => ({
          id: c.id,
          name: c.full_name,
          nickname: c.nickname || c.full_name.split(" ")[0] || c.full_name,
          email: c.email,
          device: c.is_paired ? "Android Smartphone (مقترن)" : "في انتظار ربط جهاز الأندرويد...",
          pairingCode: c.pairing_pin || "اضغط لتوليد رمز",
          isPaired: Boolean(c.is_paired),
          status: c.is_paired ? "متصل ومحمي" : "بانتظار الاقتران",
        }))
      );
    } catch (err) {
      console.error("Failed to load children from server:", err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadChildren();
  }, []);

  const handleGeneratePin = async (childId: string) => {
    setGeneratingPinFor(childId);
    try {
      const res = await api.post(`/auth/children/${childId}/pairing-pin`);
      const formattedPin = res.data?.formatted_pin || res.data?.pairing_pin;
      setChildrenList((prev) =>
        prev.map((c) =>
          c.id === childId
            ? { ...c, pairingCode: formattedPin, status: "رمز الربط جاهز (صالح لـ 15 دقيقة)" }
            : c
        )
      );
    } catch (err) {
      console.error("Failed to generate pairing PIN:", err);
    } finally {
      setGeneratingPinFor(null);
    }
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const resp = await api.post("/auth/children", {
        full_name: fullName,
        nickname: nickname || fullName,
        email: email.trim() || undefined,
        password: password || undefined,
      });

      const createdId = resp.data.id;
      const pinResp = await api.post(`/auth/children/${createdId}/pairing-pin`);
      const realPin = pinResp.data?.formatted_pin || pinResp.data?.pairing_pin;

      setChildrenList((prev) => [
        ...prev,
        {
          id: createdId,
          name: fullName,
          nickname: nickname || fullName,
          email: resp.data.email || email,
          device: "في انتظار ربط جهاز الأندرويد...",
          pairingCode: realPin,
          isPaired: false,
          status: "رمز الربط جاهز",
        },
      ]);

      setModalOpen(false);
      setFullName("");
      setNickname("");
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setError(extractErrorMessage(err, "حدث خطأ في إضافة حساب الطفل"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#07365f]">إدارة حسابات وأجهزة الأطفال</h1>
          <p className="text-sm text-[#387b94] mt-1">
            إضافة أجهزة جديدة وتوليد رموز الاقتران الرسمية لتطبيق المراقبة (Android)
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#159cb7] to-[#1bc3e4] text-white text-sm font-bold shadow-md shadow-[#1bc3e4]/20 hover:opacity-95 transition cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة طفل جديد</span>
        </button>
      </div>

      {/* Empty State or Children Cards Grid */}
      {initialLoading ? (
        <div className="p-12 rounded-2xl bg-white border border-[#b5d7e3]/40 flex flex-col items-center justify-center text-[#387b94] gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-[#1bc3e4]" />
          <span className="text-sm">جاري تحميل حسابات الأطفال...</span>
        </div>
      ) : childrenList.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-[#b5d7e3]/40 text-center space-y-3">
          <Users className="w-10 h-10 text-[#159cb7] mx-auto" />
          <h3 className="font-bold text-[#07365f] text-base">لا توجد حسابات أطفال مضافة حالياً</h3>
          <p className="text-xs text-[#387b94]">
            اضغط على &quot;إضافة طفل جديد&quot; لإنشاء حساب وتوليد رمز اقتران مكون من 6 أرقام لتطبيق الأندرويد.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {childrenList.map((child) => (
            <div
              key={child.id}
              className="p-6 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7455aa] to-[#1bc3e4] text-white font-bold text-lg flex items-center justify-center">
                    {child.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#07365f] text-base">
                      {child.name} ({child.nickname})
                    </h3>
                    <p className="text-xs text-[#387b94] font-mono">{child.email}</p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                    child.isPaired
                      ? "bg-[#eaf9ef] text-[#2abe50]"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {child.status}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#edf5f8]/50 border border-[#b5d7e3]/30 flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#387b94] block">
                    رمز الاقتران لتطبيق الطفل (6 أرقام):
                  </span>
                  <span className="font-mono text-lg font-bold text-[#07365f] tracking-widest">
                    {child.pairingCode}
                  </span>
                </div>
                <button
                  onClick={() => handleGeneratePin(child.id)}
                  disabled={generatingPinFor === child.id}
                  title="توليد رمز اقتران جديد"
                  className="px-3 py-2 rounded-xl bg-white border border-[#b5d7e3]/60 hover:border-[#1bc3e4] flex items-center gap-1.5 text-xs font-bold text-[#07365f] transition cursor-pointer"
                >
                  {generatingPinFor === child.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#159cb7]" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-[#159cb7]" />
                  )}
                  <span>توليد رمز جديد</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-[#387b94] pt-2 border-t border-[#b5d7e3]/30">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#159cb7]" />
                  {child.device}
                </span>
                <QrCode className="w-4 h-4 text-[#387b94]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Child Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="font-bold text-lg text-[#07365f]">إضافة حساب طفل جديد</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddChild} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#07365f] mb-1 text-right">
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="محمد أحمد"
                  className="w-full px-3 py-2 rounded-xl border border-[#b5d7e3] text-sm text-[#07365f] outline-none focus:border-[#1bc3e4]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#07365f] mb-1 text-right">
                  الاسم المستعار (اللقب)
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="حمودي"
                  className="w-full px-3 py-2 rounded-xl border border-[#b5d7e3] text-sm text-[#07365f] outline-none focus:border-[#1bc3e4]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#07365f] mb-1 text-right">
                  البريد الإلكتروني للطفل
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="child@gmail.com"
                  dir="ltr"
                  className="w-full px-3 py-2 rounded-xl border border-[#b5d7e3] text-sm text-[#07365f] outline-none focus:border-[#1bc3e4]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#07365f] mb-1 text-right">
                  كلمة المرور المؤقتة للطفل{" "}
                  <span className="text-gray-400 font-normal">(6 خانات على الأقل)</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full px-3 py-2 rounded-xl border border-[#b5d7e3] text-sm text-[#07365f] outline-none focus:border-[#1bc3e4]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#159cb7] to-[#1bc3e4] hover:opacity-95 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>إنشاء الحساب وتوليد الرمز</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
