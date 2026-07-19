"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

type AuthContextType = {
  isAdmin: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("novacart-admin");

    if (saved === "true") {
      setIsAdmin(true);
    }
  }, []);

  const login = (username: string, password: string) => {
    if (username === "admin" && password === "12345") {
      setIsAdmin(true);
      localStorage.setItem("novacart-admin", "true");
      return true;
    }

    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    localStorage.removeItem("novacart-admin");
  };

  return (
    <AuthContext.Provider
      value={{
        isAdmin,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}