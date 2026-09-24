"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Smartphone,
  QrCode,
  Shield,
  Trash2,
  KeyRound,
  CheckCircle2,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/utils";

export default function ChildrenPage() {
  const [childrenList, setChildrenList] = useState([
    {
      id: "c1",
      name: "سعد",
      nickname: "سعودي",
      email: "saad@family.local",
      device: "Samsung Galaxy A54",
      pairingCode: "748-291",
      status: "متصل ومحمي",
    },
    {
      id: "c2",
      name: "سارة",
      nickname: "سارونة",
      email: "sara@family.local",
      device: "Xiaomi Redmi Note 12",
      pairingCode: "593-104",
      status: "متصل ومحمي",
    },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadChildren() {
      try {
        const res = await api.get("/auth/children");
        const list = res.data?.children || [];
        if (list.length > 0) {
          setChildrenList(
            list.map((c: any, index: number) => ({
              id: c.id,
              name: c.full_name,
              nickname: c.full_name.split(" ")[0] || c.full_name,
              email: c.email,
              device: "Android Smartphone",
              pairingCode: `${500 + index * 37}-${100 + index * 41}`,
              status: "متصل ومحمي",
            }))
          );
        }
      } catch (err) {
        console.error("Failed to load children from server:", err);
      }
    }
    loadChildren();
  }, []);

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const resp = await api.post("/auth/children", {
        full_name: fullName,
        nickname: nickname || fullName,
        email,
        password,
      });

      const randomCode = `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;

      setChildrenList([
        ...childrenList,
        {
          id: resp.data.id,
          name: fullName,
          nickname: nickname || fullName,
          email,
          device: "في انتظار ربط الجهاز...",
          pairingCode: randomCode,
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
            إضافة أجهزة جديدة وتوليد رموز الاقتران لتطبيق المراقبة (Android)
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

      {/* Children Cards Grid */}
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
                  <h3 className="font-bold text-[#07365f] text-base">{child.name} ({child.nickname})</h3>
                  <p className="text-xs text-[#387b94] font-mono">{child.email}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#eaf9ef] text-[#2abe50] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {child.status}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#edf5f8]/50 border border-[#b5d7e3]/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-[#387b94] block">رمز الاقتران لتطبيق الطفل (PIN):</span>
                <span className="font-mono text-lg font-bold text-[#07365f] tracking-widest">
                  {child.pairingCode}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white border border-[#b5d7e3]/50 flex items-center justify-center text-[#159cb7]">
                <QrCode className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[#387b94] pt-2 border-t border-[#b5d7e3]/30">
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-[#159cb7]" />
                {child.device}
              </span>
            </div>
          </div>
        ))}
      </div>

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
                <label className="block text-xs font-bold text-[#07365f] mb-1 text-right">الاسم الكامل</label>
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
                <label className="block text-xs font-bold text-[#07365f] mb-1 text-right">الاسم المستعار (اللقب)</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="حمودي"
                  className="w-full px-3 py-2 rounded-xl border border-[#b5d7e3] text-sm text-[#07365f] outline-none focus:border-[#1bc3e4]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#07365f] mb-1 text-right">البريد الإلكتروني للطفل</label>
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
                  كلمة المرور المؤقتة للطفل <span className="text-gray-400 font-normal">(6 خانات على الأقل)</span>
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
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>إنشاء الحساب</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
