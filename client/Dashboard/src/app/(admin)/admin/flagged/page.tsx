"use client";

import { useEffect, useState } from "react";
import { Flag, CheckCircle2, ShieldAlert, Loader2, Search, X, RotateCcw, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";

export default function AdminFlaggedPage() {
  const [items, setItems] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const loadFlagged = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter && statusFilter !== "ALL") params.review_status = statusFilter;
      if (categoryFilter && categoryFilter !== "ALL") params.category = categoryFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get("/admin/flagged", { params });
      setItems(res.data || []);
    } catch (err) {
      console.error("Failed to load flagged items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadFlagged();
    }, 250);
    return () => clearTimeout(timer);
  }, [statusFilter, categoryFilter, search]);

  const resetFilters = () => {
    setStatusFilter("ALL");
    setCategoryFilter("ALL");
    setSearch("");
  };

  const hasActiveFilters = statusFilter !== "ALL" || categoryFilter !== "ALL" || Boolean(search.trim());

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
            مراجعة المحتوى المبلّغ وطلبات السماح
          </h1>
          <p className="text-sm text-[#387b94] mt-1">
            التحقق من التنبيهات وطلبات الأطفال لتصحيح الإيجابيات الخاطئة وتحسين دقة النماذج
          </p>
        </div>

        <button
          onClick={loadFlagged}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#b5d7e3] text-xs font-bold text-[#07365f] hover:bg-[#edf5f8] transition cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#1bc3e4]" : ""}`} />
          <span>تحديث السجل</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-[#b5d7e3]/40 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#b5d7e3] bg-[#edf5f8]/50 text-xs font-semibold text-[#07365f] outline-none cursor-pointer focus:border-[#1bc3e4]"
          >
            <option value="ALL">جميع الحالات</option>
            <option value="ACCESS_REQUESTED">طلبات السماح من الطفل (Access Requested)</option>
            <option value="PENDING">بانتظار المراجعة (Pending)</option>
            <option value="APPROVED_FALSE_POSITIVE">تم تصحيحه كآمن (False Positive)</option>
            <option value="CONFIRMED_THREAT">تهديد مؤكد (Confirmed Threat)</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#b5d7e3] bg-[#edf5f8]/50 text-xs font-semibold text-[#07365f] outline-none cursor-pointer focus:border-[#1bc3e4]"
          >
            <option value="ALL">جميع التصنيفات</option>
            <option value="CYBERBULLYING">تنمر إلكتروني</option>
            <option value="SEXUAL">محتوى غير لائق</option>
            <option value="VIOLENCE">عنف وتحريض</option>
            <option value="HATE_SPEECH">خطاب كراهية</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
              title="إعادة ضبط كل الفلاتر"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط</span>
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full lg:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالنص، الطفل، أو السبب..."
            className="w-full px-3 py-2 pr-8 pl-8 rounded-xl border border-[#b5d7e3] bg-[#f8fafc] text-xs text-[#07365f] outline-none focus:border-[#1bc3e4]"
          />
          <Search className="w-4 h-4 text-[#387b94] absolute right-2.5 top-2.5" />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute left-2.5 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
              title="مسح البحث"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-2 text-[#387b94]">
          <Loader2 className="w-6 h-6 animate-spin text-[#1bc3e4]" />
          <span className="text-xs font-medium">جاري جلب البلاغات المرصودة...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="p-16 rounded-2xl bg-white border border-[#b5d7e3]/40 text-center space-y-3">
          <Flag className="w-10 h-10 text-[#387b94] mx-auto opacity-50" />
          <h3 className="text-base font-bold text-[#07365f]">لا توجد بلاغات مطابقة لمعايير البحث</h3>
          <p className="text-xs text-[#387b94]">
            {hasActiveFilters
              ? "لم يتم العثور على أي عناصر تطابق معايير الحالة أو التصنيف أو مصطلح البحث المدخل."
              : "لا توجد بلاغات أو طلبات سماح مسجلة في النظام حالياً."}
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="mt-2 px-4 py-2 rounded-xl text-xs font-bold text-[#07365f] bg-[#edf5f8] hover:bg-[#b5d7e3]/40 transition cursor-pointer"
            >
              عرض كافة البلاغات
            </button>
          )}
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
