// src/context/UserContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export interface User {
  id: string;
  name: string;
  role: "owner" | "pharmacist";
  company_id: string;
  auth_user_id?: string | null;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    console.log("🔍 UserProvider - storedUser from sessionStorage:", storedUser);
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      console.log("✅ UserProvider - user set from storage:", parsed);
    } else {
      console.log("⚠️ UserProvider - no stored user");
    }
    setLoading(false);
    console.log("🔄 UserProvider - loading set to false");
  }, []);

  const logout = async () => {
    console.log("🚪 Logging out...");
    await supabase.auth.signOut();
    sessionStorage.removeItem("user");
    setUser(null);
  };

  useEffect(() => {
    if (user) {
      console.log("💾 UserProvider - writing user to sessionStorage:", user);
      sessionStorage.setItem("user", JSON.stringify(user));
    } else {
      console.log("🗑️ UserProvider - removing user from sessionStorage");
      sessionStorage.removeItem("user");
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};