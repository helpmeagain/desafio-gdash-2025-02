import type { User } from "./authApi";

let accessToken: string | null = null;
let currentUser: User | null = null;

const ACCESS_TOKEN_KEY = "access_token";
const USER_KEY = "user";

export function setAuth(token: string, user: User) {
  accessToken = token;
  currentUser = user;
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function loadAuthFromStorage() {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const userJson = localStorage.getItem(USER_KEY);
  if (token && userJson) {
    accessToken = token;
    try {
      const parsed = JSON.parse(userJson) as User;
      currentUser = parsed;
    } catch {
      currentUser = null;
    }
  }
}

export function clearAuth() {
  accessToken = null;
  currentUser = null;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAccessToken() {
  return accessToken;
}

export function getCurrentUser() {
  return currentUser;
}
