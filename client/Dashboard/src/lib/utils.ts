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
          if (field === "whatsapp_phone") {
            return "رقم الواتساب يجب أن يكون بالصيغة السعودية (966XXXXXXXXX)";
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
