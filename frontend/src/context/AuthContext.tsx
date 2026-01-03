import { createContext } from "react";
import { User } from "@/types/auth.types";
import { LoginFormValues } from "@/schemas/auth.schema";

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginFormValues) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
