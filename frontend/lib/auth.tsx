"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import {
  login as apiLogin,
  register as apiRegister,
  getMe as apiMe,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
} from "@/lib/api";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    full_name: string,
    role?: string
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      fetchMe(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  async function fetchMe(token: string) {
    try {
      const data = await apiMe(token);
      setUser({
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        is_active: data.is_active,
      });
    } catch {
      removeAuthToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const data = await apiLogin(email, password);
    setAuthToken(data.access_token);
    setUser({
      id: data.user.id,
      email: data.user.email,
      full_name: data.user.full_name,
      role: data.user.role,
      is_active: data.user.is_active,
    });
  }

  async function register(
    email: string,
    password: string,
    full_name: string,
    role: string = "merchant"
  ) {
    const data = await apiRegister(email, password, full_name, role);
    setAuthToken(data.access_token);
    setUser({
      id: data.user.id,
      email: data.user.email,
      full_name: data.user.full_name,
      role: data.user.role,
      is_active: data.user.is_active,
    });
  }

  function logout() {
    removeAuthToken();
    setUser(null);
  }

  const value: AuthContextType = {
    user,
    token: getAuthToken(),
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
