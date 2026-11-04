"use client";

import { useEffect, useState, useRef } from "react";
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
  BellRing,
  LogOut,
  Menu,
  X,
  Activity,
  ShieldAlert,
  ExternalLink,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import {
  CATEGORY_LABELS_AR,
  LivePushPayload,
  triggerBrowserNotification,
} from "@/lib/browser-notifications";

const navItems = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/alerts", label: "سجل التنبيهات", icon: Bell },
  { href: "/children", label: "إدارة الأطفال", icon: Users },
  { href: "/activity", label: "النشاط المباشر", icon: Activity },
  { href: "/policies", label: "سياسات الحماية", icon: Sliders },
  { href: "/reports", label: "التقارير التحليلية", icon: FileText },
  { href: "/notifications", label: "إعدادات الإشعارات", icon: BellRing },
];

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isInitialized, initialize, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [liveToasts, setLiveToasts] = useState<LivePushPayload[]>([]);
  const seenAlertsRef = useRef<Map<string, string>>(new Map());
  const initialPollDoneRef = useRef<boolean>(false);
  const childrenMapRef = useRef<Record<string, string>>({});

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isInitialized, isAuthenticated, router]);

  // Listen for in-app live push notification events (from test button or real-time alert poller)
  useEffect(() => {
    const handleLivePush = (e: Event) => {
      const customEvent = e as CustomEvent<LivePushPayload>;
      const payload = customEvent.detail;
      if (!payload) return;

      setLiveToasts((prev) => [payload, ...prev].slice(0, 3));

      // Auto-dismiss after 9 seconds
      setTimeout(() => {
        setLiveToasts((prev) => prev.filter((item) => item.id !== payload.id));
      }, 9000);
    };

    window.addEventListener("skg-live-push", handleLivePush);
    return () => window.removeEventListener("skg-live-push", handleLivePush);
  }, []);

  // Real-time background alert watcher (polls GET /alerts?limit=5 every 4s while authenticated)
  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;

    let isMounted = true;

    async function fetchChildrenMap() {
      try {
        const res = await api.get("/auth/children");
        if (res.data?.children && Array.isArray(res.data.children)) {
          const map: Record<string, string> = {};
          res.data.children.forEach((c: { id: string; full_name?: string; nickname?: string }) => {
            map[c.id] = c.full_name || c.nickname || "جهاز الطفل";
          });
          childrenMapRef.current = map;
        }
      } catch {
        // Ignore
      }
    }

    async function pollRecentAlerts() {
      try {
        const res = await api.get("/alerts", { params: { limit: 5 } });
        if (!isMounted || !Array.isArray(res.data)) return;

        const alerts = res.data as Array<{
          id: string;
          child_id: string;
          category: string;
          content_snippet: string;
          confidence: number;
          context_app: string | null;
          review_status?: string;
          access_request_reason?: string | null;
          created_at: string;
        }>;

        // First poll: baseline existing alert IDs so we don't notify for historical alerts
        if (!initialPollDoneRef.current) {
          alerts.forEach((a) => {
            seenAlertsRef.current.set(a.id, a.review_status || "PENDING");
          });
          initialPollDoneRef.current = true;
          return;
        }

        const webPushPref = localStorage.getItem("skg_web_push_enabled");
        const pushEnabled = webPushPref !== "false";

        for (const alert of alerts) {
          const prevStatus = seenAlertsRef.current.get(alert.id);
          const currentStatus = alert.review_status || "PENDING";
          const isNewAlert = prevStatus === undefined;
          const isNewAppeal = prevStatus !== undefined && prevStatus !== "ACCESS_REQUESTED" && currentStatus === "ACCESS_REQUESTED";

          seenAlertsRef.current.set(alert.id, currentStatus);

          if ((isNewAlert || isNewAppeal) && pushEnabled) {
            const childName = childrenMapRef.current[alert.child_id] || "جهاز الطفل";
            const catAr = CATEGORY_LABELS_AR[alert.category] || alert.category;
            const confPct = Math.round((alert.confidence > 1 ? alert.confidence : alert.confidence * 100));

            if (isNewAppeal) {
              await triggerBrowserNotification({
                title: `📩 طلب مراجعة من ${childName}`,
                body: `طلب الطفل مراجعة حظر المحتوى (${catAr}): "${alert.access_request_reason || alert.content_snippet}"`,
                category: "ACCESS_REQUEST",
                childName,
                confidence: confPct,
                contextApp: alert.context_app,
              });
            } else {
              await triggerBrowserNotification({
                title: `⚠️ تنبيه أمان فوري — ${catAr}`,
                body: `تم رصد وحظر محتوى (${catAr}) على جهاز "${childName}" بنسبة ثقة ${confPct}%: "${alert.content_snippet.slice(0, 80)}"`,
                category: alert.category,
                childName,
                confidence: confPct,
                contextApp: alert.context_app,
              });
            }

            window.dispatchEvent(new CustomEvent("skg-alerts-updated"));
          }
        }
      } catch {
        // Ignore transient network errors during background poll
      }
    }

    fetchChildrenMap().then(() => {
      pollRecentAlerts();
    });

    const intervalId = setInterval(pollRecentAlerts, 4000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [isInitialized, isAuthenticated]);

  const handleLogout = async () => {
    await logout();
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

      {/* Real-Time Browser Push Notification Popup Stack */}
      {liveToasts.length > 0 && (
        <div
          dir="rtl"
          className="fixed top-5 left-5 z-50 flex flex-col gap-3 w-[92vw] max-w-md pointer-events-none"
        >
          {liveToasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto bg-white border-2 border-[#e33a0a]/40 rounded-2xl shadow-2xl p-4 transition-all animate-in fade-in slide-in-from-top-3 duration-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#fdece7] text-[#e33a0a] flex items-center justify-center flex-shrink-0 shadow-sm">
                    <ShieldAlert className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-extrabold text-[#07365f]">
                        {toast.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        إشعار متصفح فوري
                      </span>
                    </div>
                    <p className="text-xs text-[#387b94] leading-relaxed">
                      {toast.body}
                    </p>
                    <div className="pt-1.5 flex items-center gap-3">
                      <Link
                        href="/alerts"
                        onClick={() =>
                          setLiveToasts((prev) => prev.filter((item) => item.id !== toast.id))
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#159cb7] hover:text-[#07365f] transition"
                      >
                        <span>فتح سجل التنبيهات</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setLiveToasts((prev) => prev.filter((item) => item.id !== toast.id))
                  }
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                  title="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
