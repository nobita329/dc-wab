import { create } from "zustand";
import { User, HomePageContent, SiteSettings, WsMessage } from "@nova/shared";
import { api } from "./api";

// -------------------------------------------------------------
// Auth Store
// -------------------------------------------------------------
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  setAuth: (user, token) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("nova_auth_token", token);
      localStorage.setItem("nova_auth_user", JSON.stringify(user));
    }
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // Ignore network logout error
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("nova_auth_token");
        localStorage.removeItem("nova_auth_user");
      }
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  initializeAuth: async () => {
    if (typeof window === "undefined") return;

    const storedToken = localStorage.getItem("nova_auth_token");
    if (!storedToken) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const res = await api.get("/api/auth/me");
      if (res.data?.success && res.data.user) {
        set({
          user: res.data.user,
          token: storedToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        throw new Error("Invalid session");
      }
    } catch {
      localStorage.removeItem("nova_auth_token");
      localStorage.removeItem("nova_auth_user");
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

// -------------------------------------------------------------
// Theme Store
// -------------------------------------------------------------
interface ThemeState {
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "dark",
  setTheme: (theme) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("nova_theme", theme);
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    set({ theme });
  },
  toggleTheme: () => {
    set((state) => {
      const next = state.theme === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        localStorage.setItem("nova_theme", next);
        if (next === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
      return { theme: next };
    });
  },
}));

// -------------------------------------------------------------
// Editor Store
// -------------------------------------------------------------
export type PreviewDevice = "desktop" | "tablet" | "mobile";

interface EditorState {
  draft: HomePageContent | null;
  original: HomePageContent | null;
  isDirty: boolean;
  previewDevice: PreviewDevice;
  previewMode: boolean;
  activeSection: string;
  setDraft: (content: HomePageContent) => void;
  updateDraft: (updater: (prev: HomePageContent) => HomePageContent) => void;
  setPreviewDevice: (device: PreviewDevice) => void;
  setPreviewMode: (mode: boolean) => void;
  setActiveSection: (section: string) => void;
  resetDraft: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  draft: null,
  original: null,
  isDirty: false,
  previewDevice: "desktop",
  previewMode: false,
  activeSection: "hero",

  setDraft: (content) => {
    set({
      draft: content,
      original: JSON.parse(JSON.stringify(content)),
      isDirty: false,
    });
  },

  updateDraft: (updater) => {
    set((state) => {
      if (!state.draft) return state;
      const updated = updater(state.draft);
      return {
        draft: updated,
        isDirty: true,
      };
    });
  },

  setPreviewDevice: (device) => set({ previewDevice: device }),
  setPreviewMode: (mode) => set({ previewMode: mode }),
  setActiveSection: (section) => set({ activeSection: section }),
  resetDraft: () => {
    set((state) => ({
      draft: state.original ? JSON.parse(JSON.stringify(state.original)) : null,
      isDirty: false,
    }));
  },
}));

// -------------------------------------------------------------
// WebSocket Store
// -------------------------------------------------------------
interface WsState {
  isConnected: boolean;
  lastMessage: WsMessage | null;
  setConnected: (connected: boolean) => void;
  setLastMessage: (msg: WsMessage) => void;
}

export const useWsStore = create<WsState>((set) => ({
  isConnected: false,
  lastMessage: null,
  setConnected: (isConnected) => set({ isConnected }),
  setLastMessage: (lastMessage) => set({ lastMessage }),
}));

// -------------------------------------------------------------
// UI Store
// -------------------------------------------------------------
interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));


