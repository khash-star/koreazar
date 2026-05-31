import { Platform } from "react-native";
import Constants from "expo-constants";
import { navigationRef } from "../navigation/AppNavigator.js";
import { notifyUnreadTabBadge } from "./unreadBadgeEvents.js";

function isExpoGoAndroid() {
  return Platform.OS === "android" && Constants.appOwnership === "expo";
}

function navigateToChatFromNotificationData(data) {
  if (!data || data.type !== "chat") return;
  const otherUserEmail =
    typeof data.other_user_email === "string" ? data.other_user_email.trim().toLowerCase() : "";
  const conversationId =
    typeof data.conversation_id === "string" ? data.conversation_id.trim() : "";
  if (!otherUserEmail && !conversationId) return;

  const params = {};
  if (conversationId) params.conversationId = conversationId;
  if (otherUserEmail) params.otherUserEmail = otherUserEmail;

  const go = () => {
    if (!navigationRef.isReady()) return false;
    navigationRef.navigate("Main", {
      screen: "MessagesTab",
      params: {
        screen: "Chat",
        params,
      },
    });
    return true;
  };

  if (go()) return;
  const started = Date.now();
  const interval = setInterval(() => {
    if (go() || Date.now() - started > 8000) clearInterval(interval);
  }, 200);
}

/**
 * Foreground display + tap-to-open Chat. Does not replace app icon badge logic.
 */
export async function setupChatPushNotificationHandlers() {
  if (Platform.OS === "web" || isExpoGoAndroid()) return () => {};

  let Notifications;
  try {
    Notifications = await import("expo-notifications");
  } catch {
    return () => {};
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  const receivedSub = Notifications.addNotificationReceivedListener(() => {
    notifyUnreadTabBadge();
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response?.notification?.request?.content?.data;
    navigateToChatFromNotificationData(data);
  });

  const last = Notifications.getLastNotificationResponseAsync?.();
  if (last && typeof last.then === "function") {
    last.then((response) => {
      if (response) {
        navigateToChatFromNotificationData(response?.notification?.request?.content?.data);
      }
    }).catch(() => {});
  }

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
