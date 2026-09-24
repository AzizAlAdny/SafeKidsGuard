"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  Bell,
  Users,
  Sliders,
  FileText,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Activity,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const navItems = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/alerts", label: "سجل التنبيهات", icon: Bell },
  { href: "/children", label: "إدارة الأطفال", icon: Users },
  { href: "/activity", label: "النشاط المباشر", icon: Activity },
  { href: "/policies", label: "سياسات الحماية", icon: Sliders },
  { href: "/reports", label: "التقارير التحليلية", icon: FileText },
  { href: "/notifications", label: "إعدادات الإشعارات (واتساب)", icon: MessageSquare },
];

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, initialize, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex bg-[#f0fafc]">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-[#07365f] text-white border-l border-white/10 shadow-xl">
        {/* Brand */}
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
            <h1 className="font-bold text-lg leading-tight tracking-wide">Safe Kids Guard</h1>
            <p className="text-xs text-[#76dbef] font-medium">حارس الأطفال الآمن</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  active
                    ? "bg-[#1bc3e4] text-[#07365f] font-bold shadow-md shadow-[#1bc3e4]/20"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "text-[#07365f]" : "text-[#76dbef]"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{user?.full_name || "ولي الأمر"}</p>
              <p className="text-xs text-[#a4e7f4] truncate">{user?.email || "parent@safekids.sa"}</p>
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
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3.5 bg-[#07365f] text-white">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-white p-0.5">
              <Image
                src="/logo.jpeg"
                alt="Safe Kids Guard Logo"
                width={32}
                height={32}
                className="object-cover rounded-md w-full h-full"
              />
            </div>
            <span className="font-bold text-sm">Safe Kids Guard</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-white/10 text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#07365f] text-white p-4 space-y-2 border-b border-white/10 shadow-lg">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                    active ? "bg-[#1bc3e4] text-[#07365f] font-bold" : "text-white/80 hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/20"
            >
              <LogOut className="w-5 h-5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
