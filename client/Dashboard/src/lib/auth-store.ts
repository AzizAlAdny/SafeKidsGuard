import { create } from "zustand";
import { api } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  role: "parent" | "child" | "admin";
  full_name: string | null;
  is_active?: boolean;
  created_at?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setUser: (user: User | null) => void;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => Promise<void>;
  initialize: () => void;
}

function setAuthCookies(role: string) {
  if (typeof document !== "undefined") {
    document.cookie = `skg_auth=1; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `skg_role=${role}; path=/; max-age=604800; SameSite=Lax`;
  }
}

function clearAuthCookies() {
  if (typeof document !== "undefined") {
    document.cookie = "skg_auth=; path=/; max-age=0";
    document.cookie = "skg_role=; path=/; max-age=0";
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  login: (user, accessToken, refreshToken) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));
      setAuthCookies(user.role);
    }
    set({ user, isAuthenticated: true, isInitialized: true });
  },
  logout: async () => {
    if (typeof window !== "undefined") {
      const refreshToken = localStorage.getItem("refresh_token");
      try {
        await api.post("/auth/logout", { refresh_token: refreshToken });
      } catch {
        // Ignore network errors during logout cleanup
      }
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      clearAuthCookies();
    }
    set({ user: null, isAuthenticated: false, isInitialized: true });
  },
  initialize: () => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("access_token");
      if (storedUser && token) {
        try {
          const parsed: User = JSON.parse(storedUser);
          setAuthCookies(parsed.role);
          set({ user: parsed, isAuthenticated: true, isInitialized: true });
          return;
        } catch {
          clearAuthCookies();
        }
      }
      set({ user: null, isAuthenticated: false, isInitialized: true });
    }
  },
}));
