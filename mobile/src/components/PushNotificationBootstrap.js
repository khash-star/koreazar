import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useAuth } from "../context/AuthContext.js";
import { registerPushTokenForUid, unregisterCurrentPushToken } from "../services/pushTokenService.js";
import { setupChatPushNotificationHandlers } from "../utils/chatPushNotifications.js";

/**
 * Registers Expo push token by Firebase uid when authenticated.
 * Re-registers when app returns to foreground (token refresh).
 */
export default function PushNotificationBootstrap() {
  const { user, isAuthenticated } = useAuth();
  const uid = user?.uid;
  const registerInFlight = useRef(false);
  const previousUidRef = useRef(null);

  useEffect(() => {
    let cleanupHandlers = () => {};
    setupChatPushNotificationHandlers().then((fn) => {
      if (typeof fn === "function") cleanupHandlers = fn;
    });
    return () => cleanupHandlers();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !uid) {
      previousUidRef.current = null;
      return;
    }

    const run = async () => {
      if (registerInFlight.current) return;
      registerInFlight.current = true;
      try {
        const previousUid = previousUidRef.current;
        if (previousUid && previousUid !== uid) {
          await unregisterCurrentPushToken(previousUid);
        }
        previousUidRef.current = uid;
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
