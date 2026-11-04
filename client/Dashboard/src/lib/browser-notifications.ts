"use client";

export interface LivePushPayload {
  id: string;
  title: string;
  body: string;
  category?: string;
  childName?: string;
  confidence?: number;
  contextApp?: string | null;
  createdAt?: string;
}

export const CATEGORY_LABELS_AR: Record<string, string> = {
  CYBERBULLYING: "تنمر إلكتروني",
  VIOLENCE: "عنف وتهديد",
  SEXUAL: "محتوى غير لائق",
  HATE_SPEECH: "خطاب كراهية",
  BLOCKED_APP: "تطبيق محظور",
  BLACKLISTED_URL: "موقع محظور (القائمة السوداء)",
  BEDTIME: "مخالفة وقت النوم",
  SCREEN_TIME: "تجاوز وقت الشاشة",
  ACCESS_REQUEST: "طلب مراجعة من الطفل",
};

/**
 * Plays a two-tone security alert chime using the Web Audio API.
 */
export function playNotificationSound(): void {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // First tone (F5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(698.46, ctx.currentTime);
    osc1.frequency.setValueAtTime(880.0, ctx.currentTime + 0.14);

    gain1.gain.setValueAtTime(0.18, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start();
    osc1.stop(ctx.currentTime + 0.58);
  } catch {
    // Ignore browser autoplay restrictions if user hasn't interacted yet
  }
}

/**
 * Fires both a native OS/Browser Notification (via Notification API / ServiceWorker)
 * AND an in-app real-time push toast event so notifications are always visible
 * even if Windows Focus Assist / Do Not Disturb suppresses desktop popups.
 */
export async function triggerBrowserNotification(payload: {
  title: string;
  body: string;
  category?: string;
  childName?: string;
  confidence?: number;
  contextApp?: string | null;
  playSound?: boolean;
}): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const soundPref = localStorage.getItem("skg_sound_alerts_enabled");
  const shouldPlaySound = payload.playSound ?? soundPref !== "false";
  if (shouldPlaySound) {
    playNotificationSound();
  }

  const uniqueId = `skg-alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // 1. Dispatch in-app live push banner event so ParentLayout always displays it immediately
  const liveEvent: LivePushPayload = {
    id: uniqueId,
    title: payload.title,
    body: payload.body,
    category: payload.category,
    childName: payload.childName,
    confidence: payload.confidence,
    contextApp: payload.contextApp,
    createdAt: new Date().toISOString(),
  };
  window.dispatchEvent(new CustomEvent<LivePushPayload>("skg-live-push", { detail: liveEvent }));

  // 2. Dispatch native Browser / OS Notification if supported
  if (!("Notification" in window)) {
    return false;
  }

  let permission = Notification.permission;
  if (permission === "default") {
    try {
      permission = await Notification.requestPermission();
    } catch {
      // Ignore permission request failure
    }
  }

  if (permission !== "granted") {
    return false;
  }

  const notifOptions: NotificationOptions = {
    body: payload.body,
    icon: "/logo.jpeg",
    badge: "/logo.jpeg",
    tag: uniqueId, // Unique tag prevents Chrome/Windows from silently deduplicating consecutive alerts
    dir: "rtl",
    lang: "ar",
  };

  try {
    // Try direct Notification constructor first (most reliable for foreground/background tabs)
    const notif = new Notification(payload.title, notifOptions);
    notif.onclick = () => {
      window.focus();
      if (window.location.pathname !== "/alerts") {
        window.location.href = "/alerts";
      }
      notif.close();
    };
    return true;
  } catch {
    // Fallback to ServiceWorker registration if direct Notification constructor is restricted
    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.showNotification(payload.title, notifOptions);
          return true;
        }
      }
    } catch {
      // Ignore fallback error
    }
  }

  return false;
}
