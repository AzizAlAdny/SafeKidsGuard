"use client";

import { useEffect, useState } from "react";
import { Users, Search, Trash2, CheckCircle2, Ban, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState(true);

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
    fetchUsers();
  }, [roleFilter]);

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

  const handleDeleteUser = async (userId: string) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#07365f]">إدارة حسابات المستخدمين (FR10)</h1>
          <p className="text-sm text-[#387b94] mt-1">
            التحكم في حسابات أولياء الأمور والأطفال والمشرفين وتفعيلها أو إيقافها
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
              placeholder="بحث بالاسم أو البريد..."
              className="px-4 py-2 pr-9 rounded-xl border border-[#b5d7e3] bg-white text-sm text-[#07365f] outline-none"
            />
            <Search className="w-4 h-4 text-[#387b94] absolute right-3 top-2.5" />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#b5d7e3] bg-white text-sm text-[#07365f]"
          >
            <option value="">كل الأدوار</option>
            <option value="parent">ولي أمر (Parent)</option>
            <option value="child">طفل (Child)</option>
            <option value="admin">مشرف (Admin)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-12 rounded-2xl bg-white border border-[#b5d7e3]/40 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#1bc3e4]" />
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-[#b5d7e3]/40 shadow-sm overflow-hidden">
          <table className="w-full text-right text-sm">
            <thead className="bg-[#edf5f8] text-[#07365f] font-bold text-xs">
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
                      {u.role}
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
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
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
    </div>
  );
}
