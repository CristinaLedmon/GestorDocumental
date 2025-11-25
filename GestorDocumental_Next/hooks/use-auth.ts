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
  message: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  permissions: string[];
  isLoading: boolean; // Añadido para controlar el estado de carga
}

const AUTH_STORAGE_KEY = "auth_data";

export default function useAuth() {
  // TODO: Remove this before demo.
  const permissionsDataFake = [
    "read_permission",
    "write_permission",
    "read_user",
    "write_user",
    "read_role",
    "write_role",
    "read_batch",
    "write_batch",
    "read_activity",
    "write_activity",
    "read_activity_partner",
    "write_activity_partner",
    "read_invitation_partner",
    "write_invitation_partner",
    "read_report_partner",
    "read_partner",
    "write_partner",
    "read_master_invitation_type",
    "write_master_invitation_type",
    "read_master_cancellation_type",
    "write_master_cancellation_type",
    "read_category",
    "write_category",
    "read_master_payment_method",
    "write_master_payment_method",
    "read_invoice",
    "write_invoice",
    "read_client",
    "write_client",
    "read_master_fiscal_data",
    "write_master_fiscal_data",
    "read_report_invoice",
    "read_master_payment_method_invoice",
    "write_master_payment_method_invoice",
    "read_master_retention_type",
    "write_master_retention_type",
    "read_master_iva_type",
    "write_master_iva_type",
    "read_master_serie",
    "write_master_serie",
    "read_master_concept",
    "write_master_concept",
    "read_cash_out",
    "write_cash_out",
    "read_ticket",
    "write_ticket",
    "read_product",
    "write_product",
    "read_master_product",
    "write_master_product",
    "read_cash_out_court",
    "write_cash_out_court",
    "read_court",
    "write_court",
    "read_master_court",
    "write_master_court",
    "read_ticket_court",
    "write_ticket_court",
    "read_home",
    "read_alert",
    "read_door"
  ];
  const [authState, setAuthState] = useState<AuthState>({
    user: {
      id: 1,
      name: "Ledmon Marketing",
      email: "webs@ledmon.com",
      role: "ledmon",
      permissions: permissionsDataFake
    } as User,
    isAuthenticated: true,
    permissions: permissionsDataFake,
    isLoading: false // Inicialmente está cargando
  });

  // Cargar datos del localStorage al inicializar
  useEffect(() => {
    const loadAuthData = () => {
      try {
        const storedData = localStorage.getItem(AUTH_STORAGE_KEY);
        console.log("Datos cargados del localStorage:", storedData); // Debug

        if (storedData) {
          const authData: AuthData = JSON.parse(storedData);
          console.log("Datos parseados:", authData); // Debug
          console.log("Permisos encontrados:", authData.user.permissions); // Debug

          setAuthState({
            user: authData.user,
            isAuthenticated: true,
            permissions: authData.user.permissions || [],
            isLoading: false
          });
        } else {
          console.log("No hay datos en localStorage"); // Debug
          setAuthState({
            user: null,
            isAuthenticated: false,
            permissions: [],
            isLoading: false
          });
        }
      } catch (error) {
        console.error("Error al cargar datos de autenticación:", error);
        // Si hay error, limpiar localStorage
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setAuthState({
          user: null,
          isAuthenticated: false,
          permissions: [],
          isLoading: false
        });
      }
    };

    // TODO: Remove this before demo.
    // loadAuthData();
  }, []);

  // Función para guardar datos de login
  const login = (authData: AuthData) => {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
      setAuthState({
        user: authData.user,
        isAuthenticated: true,
        permissions: authData.user.permissions || [],
        isLoading: false
      });
    } catch (error) {
      console.error("Error al guardar datos de autenticación:", error);
      throw new Error("No se pudieron guardar los datos de autenticación");
    }
  };

  // Función para cerrar sesión
  // const logout = () => {
  //   console.log('Entra en borrar cookie')
  //   localStorage.removeItem(AUTH_STORAGE_KEY);
  //   setAuthState({
  //     user: null,
  //     isAuthenticated: false,
  //     permissions: [],
  //     isLoading: false
  //   });
  // };
const logout = () => {
  // console.log("Entra en borrar cookie")
  
  // // 🔹 Borrar cookie con los MISMOS atributos que al crearla
  // document.cookie = `access_token=; path=/; max-age=0; SameSite=Lax; Secure=${location.protocol === "https:"}`
  
  // // 🔹 Alternativa usando expires (también con los mismos atributos)
  // // document.cookie = `access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure=${location.protocol === "https:"}`
  
  // // 🔹 Borrar storage
  // localStorage.removeItem(AUTH_STORAGE_KEY)
  
  // // 🔹 Resetear estado
  // setAuthState({
  //   user: null,
  //   isAuthenticated: false,
  //   permissions: [],
  //   isLoading: false,
  // })
}




  // Función para verificar si el usuario tiene un permiso específico
  const hasPermission = (permission: string): boolean => {
    return authState.permissions.includes(permission);
  };

  // Función para verificar si el usuario tiene alguno de los permisos especificados
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some((permission) => authState.permissions.includes(permission));
  };

  // Función para verificar si el usuario tiene todos los permisos especificados
  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every((permission) => authState.permissions.includes(permission));
  };

  // Función para obtener los datos de autenticación actuales
  const getAuthData = (): AuthData | null => {
    try {
      const storedData = localStorage.getItem(AUTH_STORAGE_KEY);
      return storedData ? JSON.parse(storedData) : null;
    } catch (error) {
      console.error("Error al obtener datos de autenticación:", error);
      return null;
    }
  };

  return {
    // Estado
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    permissions: authState.permissions,
    isLoading: authState.isLoading, // Añadido

    // Funciones
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getAuthData
  };
}
