import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { ensureUserDocEmailForFirestoreRules, subscribeAuth } from "../services/authService";
import { getUserByEmail, getUserProfileByUid } from "../services/userProfileService";
import { normalizeEmail } from "../utils/emailNormalize.js";
import { isExpoPushNativeAvailable } from "../utils/expoPushAvailability.js";

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

  /** Token-д имэйл байхгүй ч Firestore профайлд байвал дүрмийн authEmailLower() ажиллана */
  useEffect(() => {
    if (!user?.uid) return;
    const pe = userData?.email;
    if (!pe || typeof pe !== "string" || !pe.trim()) return;
    ensureUserDocEmailForFirestoreRules(user, pe).catch(() => {});
  }, [user?.uid, user?.email, userData?.email]);

  /** iOS/Android: push token — native модульгүй APK дээр expo-notifications ачаалахгүй */
  useEffect(() => {
    if (Platform.OS === "web" || !user?.uid || !isExpoPushNativeAvailable()) return;
    import("../utils/pushNotifications.js")
      .then((m) => m.registerAndSavePushToken(user.uid))
      .catch(() => {});
  }, [user?.uid]);

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
  }, [user?.uid, user?.email]);

  const resolvedEmail =
    normalizeEmail(user?.email || userData?.email || "") || null;

  const value = useMemo(
    () => ({
      user,
      userData,
      loading,
      email: resolvedEmail,
      isAuthenticated: !!user,
      isAdmin: userData?.role === "admin",
      refreshUserData,
    }),
    [user, userData, loading, refreshUserData, resolvedEmail]
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
