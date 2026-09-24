"use client";

import { useState } from "react";
import {
  AlertTriangle,
  MessageCircle,
  Filter,
  Search,
  ShieldAlert,
  Calendar,
  CheckCircle2,
} from "lucide-react";

const allAlerts = [
  {
    id: "1",
    child: "سعد",
    category: "CYBERBULLYING",
    categoryLabel: "تنمر إلكتروني",
    color: "#7455aa",
    bgColor: "#f1eef6",
    confidence: 94.2,
    date: "2026-09-24 18:42",
    action: "حظر فوري + إشعار واتساب",
    whatsappStatus: "تم التسليم",
    contentSnippet: "أنت غبي وما تفهم شي وراح تشوف بكرة بالمدرسة...",
  },
  {
    id: "2",
    child: "سعد",
    category: "VIOLENCE",
    categoryLabel: "عنف وتحريض",
    color: "#f0a83d",
    bgColor: "#fef8ee",
    confidence: 88.5,
    date: "2026-09-24 14:40",
    action: "حظر فوري + إشعار واتساب",
    whatsappStatus: "تم التسليم",
    contentSnippet: "جيب السكين معك وخلينا نتضارب معهم...",
  },
  {
    id: "3",
    child: "سارة",
    category: "HATE_SPEECH",
    categoryLabel: "خطاب كراهية",
    color: "#0b518e",
    bgColor: "#e7f3fd",
    confidence: 91.0,
    date: "2026-09-23 20:15",
    action: "حظر فوري + إشعار واتساب",
    whatsappStatus: "تم التسليم",
    contentSnippet: "هذول الناس ما يستاهلون يعيشون بيننا...",
  },
  {
    id: "4",
    child: "سارة",
    category: "SEXUAL",
    categoryLabel: "محتوى غير لائق",
    color: "#e33a0a",
    bgColor: "#fdece7",
    confidence: 97.4,
    date: "2026-09-22 17:30",
    action: "حظر فوري + إشعار واتساب",
    whatsappStatus: "تم التسليم",
    contentSnippet: "رابط مشبوه يحتوي على صور غير ملائمة للمرحلة العمرية...",
  },
];

export default function AlertsPage() {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const filteredAlerts = allAlerts.filter((alert) => {
    const matchesFilter = filter === "ALL" || alert.category === filter;
    const matchesSearch =
      alert.child.includes(search) ||
      alert.categoryLabel.includes(search) ||
      alert.contentSnippet.includes(search);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#07365f]">سجل التنبيهات والمخاطر المرصودة</h1>
          <p className="text-sm text-[#387b94] mt-1">
            كافة المحتويات المصنفة كتهديد بواسطة الذكاء الاصطناعي مع إجراءات الحماية المتخذة
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-[#b5d7e3]/40 shadow-sm">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {[
            { id: "ALL", label: "الكل" },
            { id: "CYBERBULLYING", label: "تنمر إلكتروني" },
            { id: "SEXUAL", label: "محتوى غير لائق" },
            { id: "VIOLENCE", label: "عنف وتحريض" },
            { id: "HATE_SPEECH", label: "خطاب كراهية" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                filter === tab.id
                  ? "bg-[#07365f] text-white shadow-sm"
                  : "bg-gray-100 text-[#387b94] hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في السجل..."
            className="w-full px-3 py-2 pl-9 rounded-xl border border-[#b5d7e3] text-xs text-[#07365f] outline-none focus:border-[#1bc3e4]"
          />
          <Search className="w-4 h-4 text-[#387b94] absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-2xl border border-[#b5d7e3]/40 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-[#edf5f8] text-[#07365f] font-bold text-xs border-b border-[#b5d7e3]/50">
              <tr>
                <th className="p-4">الطفل</th>
                <th className="p-4">تصنيف التهديد</th>
                <th className="p-4">المحتوى المرصود</th>
                <th className="p-4">دقة الذكاء الاصطناعي</th>
                <th className="p-4">إشعار الواتساب</th>
                <th className="p-4">التاريخ والوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#b5d7e3]/30">
              {filteredAlerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-[#edf5f8]/30 transition">
                  <td className="p-4 font-bold text-[#07365f] whitespace-nowrap">
                    {alert.child}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <span
                      className="px-2.5 py-1 rounded-lg text-xs font-bold"
                      style={{ backgroundColor: alert.bgColor, color: alert.color }}
                    >
                      {alert.categoryLabel}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-[#07365f] max-w-xs truncate" title={alert.contentSnippet}>
                    {alert.contentSnippet}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <span className="font-semibold text-xs text-[#07365f]">
                      {alert.confidence}%
                    </span>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#eaf9ef] text-[#2abe50]">
                      <MessageCircle className="w-3.5 h-3.5" />
                      {alert.whatsappStatus}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
                    {alert.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
