import axios from "axios";

// In the browser, using a relative base URL ("") routes requests through
// Next.js rewrites, preventing CORS and mixed-content issues in cloud/Codespaces environments.
// Server-side calls use the local backend directly.
function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  return (
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:3002"
  );
}

export const API_BASE_URL = getBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach bearer token if stored in localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("nova_auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor for 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const isAuthRoute = window.location.pathname.startsWith("/admin/login");
      if (!isAuthRoute && window.location.pathname.startsWith("/admin")) {
        localStorage.removeItem("nova_auth_token");
        localStorage.removeItem("nova_auth_user");
        window.location.href =
          "/admin/login?redirect=" + encodeURIComponent(window.location.pathname);
      }
    }
    return Promise.reject(error);
  }
);
