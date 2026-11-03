"use client";

import { useEffect, useState } from "react";
import { BrainCircuit, CheckCircle2, Activity, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function AdminModelsPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await api.get("/admin/ai-metrics");
        setMetrics(res.data);
      } catch (err) {
        console.error("Failed to fetch AI metrics:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-[#1bc3e4]" />
      </div>
    );
  }

  const distribution = metrics?.category_distribution || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#07365f]">
          مراقبة نماذج الذكاء الاصطناعي واللغة العربية
        </h1>
        <p className="text-sm text-[#387b94] mt-1">
          متابعة حالة نماذج AraBERTv2 و CAMeLBERT ومقاييس التصنيف الفوري للهجات العربية
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-[#07365f] flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-[#7455aa]" />
              <span>نموذج الفصحى (MSA Model)</span>
            </h2>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#eaf9ef] text-[#2abe50]">
              نشط
            </span>
          </div>
          <p className="font-mono text-xs text-[#387b94]">{metrics?.arabert_model}</p>
          <p className="text-xs text-[#07365f]">
            مخصص لتحليل النصوص العربية الفصحى مع معالجة التشكيل والتطويل وتطبيع الحروف.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-[#07365f] flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#159cb7]" />
              <span>نموذج اللهجات العربية (Dialectal Model)</span>
            </h2>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#eaf9ef] text-[#2abe50]">
              نشط
            </span>
          </div>
          <p className="font-mono text-xs text-[#387b94]">{metrics?.camelbert_model}</p>
          <p className="text-xs text-[#07365f]">
            يدعم اللهجات الخليجية والمصرية والشامية ومعالجة كتابة العربيزي (Arabizi).
          </p>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="p-6 rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm space-y-4">
        <h3 className="font-bold text-[#07365f]">توزيع التصنيفات المسجلة في النظام</h3>
        {Object.keys(distribution).length === 0 ? (
          <p className="text-xs text-[#387b94]">لا توجد سجلات تصنيف حتى الآن.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {Object.entries(distribution).map(([cat, count]) => (
              <div
                key={cat}
                className="p-4 rounded-xl bg-[#edf5f8]/60 border border-[#b5d7e3]/40 text-center"
              >
                <span className="text-xs font-mono font-bold text-[#387b94] block">{cat}</span>
                <span className="text-2xl font-bold text-[#07365f] mt-1 block">
                  {String(count)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
