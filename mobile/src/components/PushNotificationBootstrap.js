import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useAuth } from "../context/AuthContext.js";
import { registerPushTokenForUid } from "../services/pushTokenService.js";
import { setupChatPushNotificationHandlers } from "../utils/chatPushNotifications.js";

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
        await registerPushTokenForUid(uid);
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
