import { persistentMap } from "@nanostores/persistent";
import type { User } from "../types/auth.types";

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

export const $authStore = persistentMap<AuthState>(
  "auth:",
  {
    token: null,
    user: null,
    isAuthenticated: false,
  },
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  }
);

export const login = (token: string, user: User) => {
  $authStore.set({
    token,
    user,
    isAuthenticated: true,
  });
};

export const logout = () => {
  $authStore.set({
    token: null,
    user: null,
    isAuthenticated: false,
  });

  window.location.href = "/login";
};
