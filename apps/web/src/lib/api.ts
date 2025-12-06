import axios, { type AxiosError, type AxiosRequestConfig } from "axios";
import { getAccessToken, setAuth, clearAuth } from "@/lib/auth/authStorage";
import type { Role } from "@/lib/auth/authApi";

interface CustomAxiosRequestConfig extends AxiosRequestConfig<unknown> {
  _retry?: boolean;
}

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

interface AuthRefreshResponse {
  access_token: string;
  user: AuthUser;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
});

function isAuthEndpoint(url?: string) {
  if (!url) return false;
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/logout")
  );
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = api
    .post<AuthRefreshResponse>("/auth/refresh")
    .then((res) => {
      const { access_token, user } = res.data;
      setAuth(access_token, user);
      return access_token;
    })
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });

  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<unknown>) => {
    const originalRequest = error.config as
      | CustomAxiosRequestConfig
      | undefined;
    const status = error.response?.status;

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        clearAuth();
      }
    }

    return Promise.reject(error);
  }
);

export default api;
