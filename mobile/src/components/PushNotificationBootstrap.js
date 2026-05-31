import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import { useAuth } from "../context/AuthContext.js";
import { registerPushTokenForUid } from "../services/pushTokenService.js";
import { setupChatPushNotificationHandlers } from "../utils/chatPushNotifications.js";

const ANDROID_REGISTER_DELAY_MS = 1200;
const REGISTER_RETRY_DELAYS_MS = Platform.OS === "android" ? [0, 2000, 5000] : [0, 1500];

async function registerPushTokenWithRetry(uid) {
  let last = { ok: false, reason: "unknown" };
  for (let i = 0; i < REGISTER_RETRY_DELAYS_MS.length; i += 1) {
    if (REGISTER_RETRY_DELAYS_MS[i] > 0) {
      await new Promise((resolve) => setTimeout(resolve, REGISTER_RETRY_DELAYS_MS[i]));
    }
    last = await registerPushTokenForUid(uid);
    if (last.ok) return last;
    if (last.reason === "permission_denied" || last.reason === "unsupported") return last;
  }
  if (!last.ok) {
    console.warn("Push token register failed:", last.reason || "unknown");
  }
  return last;
}

/**
 * Registers Expo push token by Firebase uid when authenticated.
 * Re-registers when app returns to foreground (token refresh).
 */
export default function PushNotificationBootstrap() {
  const { user, isAuthenticated } = useAuth();
  const uid = user?.uid;
  const registerInFlight = useRef(false);

  useEffect(() => {
    let cleanupHandlers = () => {};
    setupChatPushNotificationHandlers().then((fn) => {
      if (typeof fn === "function") cleanupHandlers = fn;
    });
    return () => cleanupHandlers();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !uid) return;

    const run = async () => {
      if (registerInFlight.current) return;
      registerInFlight.current = true;
      try {
        if (Platform.OS === "android") {
          await new Promise((resolve) => setTimeout(resolve, ANDROID_REGISTER_DELAY_MS));
        }
        await registerPushTokenWithRetry(uid);
      } catch (e) {
        console.warn("Push token register:", e?.message);
      } finally {
        registerInFlight.current = false;
      }
    };

    run();

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") run();
    });
    return () => sub.remove();
  }, [isAuthenticated, uid]);

  return null;
}
