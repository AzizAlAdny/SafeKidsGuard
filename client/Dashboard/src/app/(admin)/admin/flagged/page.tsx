"use client";

import { useEffect, useState } from "react";
import { Flag, CheckCircle2, ShieldAlert, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function AdminFlaggedPage() {
  const [items, setItems] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  const loadFlagged = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/flagged", {
        params: { review_status: statusFilter },
      });
      setItems(res.data || []);
    } catch (err) {
      console.error("Failed to load flagged items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlagged();
  }, [statusFilter]);

  const handleReview = async (
    alertId: string,
    review_status: "APPROVED_FALSE_POSITIVE" | "CONFIRMED_THREAT" | "DISMISSED"
  ) => {
    try {
      const res = await api.patch(`/admin/flagged/${alertId}`, { review_status });
      setItems((prev) => prev.map((it) => (it.id === alertId ? res.data : it)));
    } catch (err) {
      console.error("Failed to review item:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#07365f]">
            مراجعة المحتوى المبلّغ وطلبات السماح (UC-A4, UC-C5)
          </h1>
          <p className="text-sm text-[#387b94] mt-1">
            التحقق من التنبيهات وطلبات الأطفال لتصحيح الإيجابيات الخاطئة وتحسين دقة النماذج
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-xl border border-[#b5d7e3] bg-white text-sm text-[#07365f]"
        >
          <option value="ALL">جميع الحالات</option>
          <option value="ACCESS_REQUESTED">طلبات السماح من الطفل (Access Requested)</option>
          <option value="PENDING">بانتظار المراجعة (Pending)</option>
          <option value="APPROVED_FALSE_POSITIVE">تم تصحيحه كآمن (False Positive)</option>
          <option value="CONFIRMED_THREAT">تهديد مؤكد (Confirmed Threat)</option>
        </select>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#1bc3e4]" />
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-[#b5d7e3]/40 text-center text-sm text-[#387b94]">
          لا توجد عناصر مطابقة للفلتر المحدد.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700">
                    {item.category} ({(item.confidence * 100).toFixed(0)}%)
                  </span>
                  <span className="text-xs text-[#387b94]">
                    الطفل: <strong>{item.child_name}</strong> | التطبيق:{" "}
                    <strong>{item.context_app || "غير محدد"}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#edf5f8] text-[#07365f]">
                    {item.review_status}
                  </span>
                </div>
                <p className="text-sm text-[#07365f] font-medium bg-[#f8fafc] p-3 rounded-xl border border-gray-100">
                  {item.content_snippet}
                </p>
                {item.access_request_reason && (
                  <p className="text-xs text-amber-700 font-semibold">
                    رسالة طلب الطفل: {item.access_request_reason}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleReview(item.id, "APPROVED_FALSE_POSITIVE")}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-[#eaf9ef] text-[#1a6f2f] hover:opacity-90 flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تصحيح كآمن (False Positive)</span>
                </button>
                <button
                  onClick={() => handleReview(item.id, "CONFIRMED_THREAT")}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 flex items-center gap-1 cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>تأكيد التهديد</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
