import api from "../api";
import { setAuth, clearAuth } from "./authStorage";

export type Role = "user" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export async function login(email: string, password: string) {
  const { data } = await api.post<LoginResponse>("/auth/login", {
    email,
    password,
  });

  setAuth(data.access_token, data.user);
  return data;
}

export async function refresh() {
  const { data } = await api.post<LoginResponse>("/auth/refresh");
  setAuth(data.access_token, data.user);
  return data;
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } finally {
    clearAuth();
  }
}

export async function signup(payload: SignupPayload) {
  await api.post("/user", payload);
}
