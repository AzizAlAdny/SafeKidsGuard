import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely extract a readable error message from API errors (FastAPI Pydantic validation errors or standard HTTP exceptions).
 * Guarantees a string return value so React never crashes with "Objects are not valid as a React child".
 */
export function extractErrorMessage(err: any, fallback: string = "حدث خطأ أثناء معالجة الطلب"): string {
  if (!err) return fallback;

  const detail = err.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    // Pydantic validation error list: [{ type, loc, msg, input, ctx }]
    const messages = detail
      .map((item: any) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : "";
          const msg = item.msg || "قيمة غير صالحة";

          if (field === "password") {
            if (item.type === "string_too_short") return "كلمة المرور يجب أن لا تقل عن 6 أحرف";
            return `كلمة المرور: ${msg}`;
          }
          if (field === "email") {
            return "البريد الإلكتروني المدخل غير صالح";
          }
          if (field === "full_name") {
            return "الاسم الكامل مطلوب (حرفين على الأقل)";
          }
          if (field === "phone_number" || field === "whatsapp_phone") {
            return "رقم الهاتف يجب أن يكون بصيغة دولية صحيحة مع رمز الدولة (مثال: +966501234567 أو 201012345678)";
          }
          return `${field ? field + ": " : ""}${msg}`;
        }
        return String(item);
      })
      .filter(Boolean);

    return messages.length > 0 ? messages.join(" | ") : fallback;
  }

  if (detail && typeof detail === "object") {
    if (typeof detail.message === "string") return detail.message;
    if (typeof detail.msg === "string") return detail.msg;
    return JSON.stringify(detail);
  }

  if (typeof err.message === "string") {
    if (err.message.includes("Network Error")) {
      return "تعذر الاتصال بالخادم، يرجى التأكد من تشغيل الخادم";
    }
    return err.message;
  }

  return fallback;
}

/**
 * Normalize Arabic text for robust search and filter matching.
 * Unifies Alef variations (أ, إ, آ, ٱ -> ا), Taa Marbuta (ة -> ه), Yaa (ى -> ي),
 * removes Arabic diacritics / tashkeel, and lowercases latin text.
 */
export function normalizeArabicText(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[أإآٱ]/g, "ا")
    .replace(/[ة]/g, "ه")
    .replace(/[ى]/g, "ي")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .trim();
}

/**
 * Safely parse an ISO-8601 date string from the backend.
 * If SQLite returned a naive UTC string without 'Z' or a timezone offset,
 * appends 'Z' so JavaScript converts it from UTC to the user's local timezone (e.g., +03:00).
 */
export function parseUtcDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const trimmed = dateStr.trim();
  const hasTimezone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(trimmed);
  const normalized = hasTimezone ? trimmed : `${trimmed.replace(" ", "T")}Z`;
  return new Date(normalized);
}

/**
 * Format a UTC timestamp into local date and 12-hour time with English digits (0-9)
 * and Arabic period marker (صباحاً / مساءً), e.g. "05/11/2026 - 06:29 مساءً".
 */
export function formatLocalDateTime(dateStr: string): string {
  try {
    const d = parseUtcDate(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const datePart = d.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const hours24 = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const periodAr = hours24 >= 12 ? "مساءً" : "صباحاً";
    const hours12 = String(hours24 % 12 || 12).padStart(2, "0");
    return `${datePart} - ${hours12}:${minutes} ${periodAr}`;
  } catch {
    return dateStr;
  }
}


