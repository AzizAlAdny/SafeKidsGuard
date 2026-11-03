"use client";

import { useEffect, useState } from "react";
import { Users, Search, Trash2, CheckCircle2, Ban, Loader2, X, RotateCcw, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import ConfirmModal from "@/components/ConfirmModal";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (roleFilter) params.role = roleFilter;
      if (search.trim()) params.search = search.trim();
      const res = await api.get("/admin/users", { params });
      setUsers(res.data || []);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [roleFilter, search]);

  const resetFilters = () => {
    setRoleFilter("");
    setSearch("");
  };

  const hasActiveFilters = Boolean(roleFilter) || Boolean(search.trim());

  const handleToggleActive = async (user: any) => {
    try {
      const res = await api.patch(`/admin/users/${user.id}`, {
        is_active: !user.is_active,
      });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.data : u)));
    } catch (err) {
      console.error("Failed to update user:", err);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/users/${userToDelete.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setUserToDelete(null);
    } catch (err) {
      console.error("Failed to delete user:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#07365f]">إدارة حسابات المستخدمين</h1>
          <p className="text-sm text-[#387b94] mt-1">
            التحكم في حسابات أولياء الأمور والأطفال والمشرفين وتفعيلها أو إيقافها
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#b5d7e3] text-xs font-bold text-[#07365f] hover:bg-[#edf5f8] transition cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#1bc3e4]" : ""}`} />
          <span>تحديث القائمة</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-[#b5d7e3]/40 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#b5d7e3] bg-[#edf5f8]/50 text-xs font-semibold text-[#07365f] outline-none cursor-pointer focus:border-[#1bc3e4]"
          >
            <option value="">جميع الأدوار</option>
            <option value="parent">ولي أمر (Parent)</option>
            <option value="child">طفل (Child)</option>
            <option value="admin">مشرف (Admin)</option>
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

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو البريد..."
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
        <div className="p-16 rounded-2xl bg-white border border-[#b5d7e3]/40 flex flex-col items-center justify-center text-[#387b94] gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#1bc3e4]" />
          <span className="text-xs">جاري تحميل قائمة المستخدمين...</span>
        </div>
      ) : users.length === 0 ? (
        <div className="p-16 rounded-2xl bg-white border border-[#b5d7e3]/40 text-center space-y-3">
          <Users className="w-10 h-10 text-[#387b94] mx-auto opacity-50" />
          <h3 className="text-base font-bold text-[#07365f]">لا توجد حسابات مطابقة لمعايير البحث</h3>
          <p className="text-xs text-[#387b94]">
            {hasActiveFilters
              ? "لم نجد أي مستخدم يطابق معايير الدور أو مصطلح البحث المدخل."
              : "لا يوجد مستخدمون مسجلون في النظام حالياً."}
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="mt-2 px-4 py-2 rounded-xl text-xs font-bold text-[#07365f] bg-[#edf5f8] hover:bg-[#b5d7e3]/40 transition cursor-pointer"
            >
              عرض كافة المستخدمين
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm overflow-hidden">
          <table className="w-full text-right text-sm">
            <thead className="bg-[#edf5f8] text-[#07365f] font-bold text-xs border-b border-[#b5d7e3]/50">
              <tr>
                <th className="p-4">الاسم الكامل</th>
                <th className="p-4">البريد الإلكتروني</th>
                <th className="p-4">الدور</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#f0fafc]">
                  <td className="p-4 font-semibold text-[#07365f]">{u.full_name || "—"}</td>
                  <td className="p-4 font-mono text-xs text-[#387b94]">{u.email}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#e7f3fd] text-[#0b518e]">
                      {u.role === "parent" ? "ولي أمر" : u.role === "child" ? "طفل" : "مشرف"}
                    </span>
                  </td>
                  <td className="p-4">
                    {u.is_active ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#2abe50]">
                        <CheckCircle2 className="w-4 h-4" /> نشط
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600">
                        <Ban className="w-4 h-4" /> معطل
                      </span>
                    )}
                  </td>
                  <td className="p-4 flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(u)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#b5d7e3] hover:bg-gray-50 text-[#07365f] cursor-pointer"
                    >
                      {u.is_active ? "تعطيل" : "تفعيل"}
                    </button>
                    <button
                      onClick={() => setUserToDelete(u)}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer transition"
                      title="حذف الحساب"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(userToDelete)}
        onClose={() => !deleteLoading && setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        loading={deleteLoading}
        title="تأكيد حذف حساب المستخدم"
        description={`هل أنت متأكد من رغبتك في حذف حساب "${userToDelete?.full_name || userToDelete?.email}" نهائياً؟ سيتم حذف كافة السجلات والروابط العائلية المرتبطة بهذا الحساب ولا يمكن التراجع عن هذا الإجراء.`}
        confirmText="نعم، حذف الحساب نهائياً"
        cancelText="إلغاء الأمر"
        variant="danger"
      />
    </div>
  );
}
