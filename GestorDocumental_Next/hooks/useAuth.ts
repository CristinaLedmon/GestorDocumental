"use client";

import { useState, useEffect } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

interface AuthData {
  user: User;
  token: string;
  message?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  permissions: string[];
  isLoading: boolean;
}

const AUTH_STORAGE_KEY = "auth_data";

export default function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    permissions: [],
    isLoading: true,
  });

  // Cargar usuario actual al iniciar
  useEffect(() => {
    const fetchUser = async () => {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          permissions: [],
          isLoading: false,
        });
        return;
      }

      const data: AuthData = JSON.parse(stored);

      try {
        const res = await fetch("http://localhost:8000/api/me", {
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${data.token}`, // usamos token guardado
          },
        });

        if (!res.ok) throw new Error("No autenticado");

        const meData = await res.json();

        setAuthState({
          user: meData.user,
          isAuthenticated: true,
          permissions: meData.user.permissions || [],
          isLoading: false,
        });
      } catch {
        setAuthState({
          user: null,
          isAuthenticated: false,
          permissions: [],
          isLoading: false,
        });
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    };

    fetchUser();
  }, []);

  // Login con token
  const login = async (email: string, password: string) => {
    const res = await fetch("http://localhost:8000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) throw new Error("Login fallido");

    const data: AuthData = await res.json();

    // Guardar token en localStorage
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));

    setAuthState({
      user: data.user,
      isAuthenticated: true,
      permissions: data.user.permissions || [],
      isLoading: false,
    });

    return data;
  };

  // Logout
  const logout = () => {
    setAuthState({
      user: null,
      isAuthenticated: false,
      permissions: [],
      isLoading: false,
    });
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const hasPermission = (permission: string) =>
    authState.permissions.includes(permission);

  const hasAnyPermission = (permissions: string[]) =>
    permissions.some((p) => authState.permissions.includes(p));

  return {
    ...authState,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
  };
}
