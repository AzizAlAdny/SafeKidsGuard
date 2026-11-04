"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BrainCircuit,
  Flag,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const adminNavItems = [
  { href: "/admin", label: "نظرة عامة للنظام", icon: LayoutDashboard },
  { href: "/admin/users", label: "إدارة المستخدمين", icon: Users },
  { href: "/admin/models", label: "نماذج الذكاء الاصطناعي", icon: BrainCircuit },
  { href: "/admin/flagged", label: "مراجعة المحتوى المبلّغ", icon: Flag },
  { href: "/admin/settings", label: "إعدادات الأمان والنظام", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isInitialized, initialize, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else if (user?.role !== "admin") {
        router.replace("/dashboard");
      }
    }
  }, [isInitialized, isAuthenticated, user, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex bg-[#f0fafc]">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-[#041b2f] text-white border-l border-white/10 shadow-xl">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-xl overflow-hidden shadow-md shadow-[#1bc3e4]/30 flex-shrink-0 bg-white p-0.5">
            <Image
              src="/logo.jpeg"
              alt="Safe Kids Guard Logo"
              width={44}
              height={44}
              className="object-cover rounded-lg w-full h-full"
            />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-wide">Safe Kids Admin</h1>
            <p className="text-xs text-[#76dbef] font-medium">لوحة إدارة النظام والذكاء الاصطناعي</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  active
                    ? "bg-[#1bc3e4] text-[#041b2f] font-bold shadow-md shadow-[#1bc3e4]/20"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "text-[#041b2f]" : "text-[#76dbef]"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">
                {user?.full_name || "مدير النظام"}
              </p>
              <p className="text-xs text-[#a4e7f4] truncate">{user?.email || "admin@safekids.sa"}</p>
            </div>
            <button
              onClick={handleLogout}
              title="تسجيل الخروج"
              className="p-2 rounded-lg hover:bg-red-500/20 text-red-300 hover:text-red-100 transition cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3.5 bg-[#041b2f] text-white">
          <span className="font-bold text-sm">Safe Kids Guard — Admin</span>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-white/10 text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {mobileMenuOpen && (
          <div className="md:hidden bg-[#041b2f] text-white p-4 space-y-2 border-b border-white/10 shadow-lg">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                    active ? "bg-[#1bc3e4] text-[#041b2f] font-bold" : "text-white/80 hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
