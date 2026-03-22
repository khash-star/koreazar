import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { subscribeAuth } from "../services/authService";
import { getUserByEmail } from "../services/userProfileService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeAuth((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user?.email) {
      setUserData(null);
      return;
    }
    let cancelled = false;
    getUserByEmail(user.email).then((data) => {
      if (!cancelled) setUserData(data);
    });
    return () => { cancelled = true; };
  }, [user?.email]);

  const value = useMemo(
    () => ({
      user,
      userData,
      loading,
      email: user?.email || null,
      isAuthenticated: !!user,
      isAdmin: userData?.role === "admin",
    }),
    [user, userData, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
