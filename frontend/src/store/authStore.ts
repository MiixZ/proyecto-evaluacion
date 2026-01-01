import { persistentMap } from "@nanostores/persistent";

export interface AuthState {
  token: string | null;
  user: {
    id: string;
    email: string;
    role: "student" | "professor" | "admin";
    name: string;
  } | null;
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

export const login = (token: string, user: AuthState["user"]) => {
  $authStore.set({ token, user, isAuthenticated: true });
};

export const logout = () => {
  $authStore.set({ token: null, user: null, isAuthenticated: false });
  window.location.href = "/login";
};
