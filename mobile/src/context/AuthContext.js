import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ensureUserDocEmailForFirestoreRules,
  getResolvedAuthEmail,
  subscribeAuth,
} from "../services/authService";
import { getUserByEmail, getUserProfileByUid } from "../services/userProfileService";
import { normalizeEmail, phoneToAuthEmail } from "../utils/emailNormalize.js";
import {
  canManageUsers,
  getAdminScope,
  isAppAdmin,
  isSuperAdmin,
} from "../constants/adminRoles.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolvedEmail, setResolvedEmail] = useState(null);

  useEffect(() => {
    const unsub = subscribeAuth((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setUserData(null);
      return;
    }
    let cancelled = false;
    (async () => {
      let data = null;
      if (user.email) {
        data = await getUserByEmail(normalizeEmail(user.email));
      }
      if (!data) {
        data = await getUserProfileByUid(user.uid);
      }
      if (!cancelled) setUserData(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, user?.email]);

  useEffect(() => {
    if (!user?.uid) {
      setResolvedEmail(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const em = await getResolvedAuthEmail(user);
      if (!cancelled) setResolvedEmail(em || null);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, user?.email, user?.phoneNumber]);

  useEffect(() => {
    if (!user?.uid) return;
    const pe = userData?.email || resolvedEmail;
    if (!pe || typeof pe !== "string" || !pe.trim()) return;
    ensureUserDocEmailForFirestoreRules(user, pe).catch(() => {});
  }, [user?.uid, user?.email, userData?.email, resolvedEmail]);

  const refreshUserData = useCallback(async () => {
    if (!user?.uid) return;
    let data = null;
    if (user.email) {
      data = await getUserByEmail(normalizeEmail(user.email));
    }
    if (!data) {
      data = await getUserProfileByUid(user.uid);
    }
    if (data) setUserData(data);
    const em = await getResolvedAuthEmail(user);
    setResolvedEmail(em || null);
  }, [user?.uid, user?.email, user?.phoneNumber]);

  const email =
    resolvedEmail ||
    normalizeEmail(user?.email || userData?.email || "") ||
    (user?.phoneNumber ? normalizeEmail(phoneToAuthEmail(user.phoneNumber)) : null) ||
    null;

  const value = useMemo(
    () => ({
      user,
      userData,
      loading,
      email,
      isAuthenticated: !!user,
      isAdmin: isAppAdmin(userData),
      isSuperAdmin: isSuperAdmin(userData),
      adminScope: getAdminScope(userData),
      canManageUsers: canManageUsers(userData),
      refreshUserData,
    }),
    [user, userData, loading, refreshUserData, email]
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
