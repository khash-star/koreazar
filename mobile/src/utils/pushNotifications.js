import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { getActiveChatConversationId } from "./chatNotificationState.js";

const ANDROID_CHANNEL_ID = "messages";

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const cid = notification.request.content.data?.conversationId;
    const active = getActiveChatConversationId();
    if (active && cid != null && String(cid) === String(active)) {
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: true,
      };
    }
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

let pendingOpenConversationId = null;

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: "Мессеж",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound: "default",
  });
}

/**
 * Нэвтэрсэн үед дуудна: зөвшөөрөл + Expo push token-ийг Firestore users/{uid}.expo_push_tokens дээр хадгална.
 * (Cloud Function мессеж үүсэхэд хүлээн авагч руу push илгээнэ.)
 */
export async function registerAndSavePushToken(uid) {
  if (Platform.OS === "web" || !uid) return null;
  if (!Device.isDevice) return null;

  await ensureAndroidChannel();

  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    final = status;
  }
  if (final !== "granted") return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    console.warn("push: EAS projectId (app.json extra.eas.projectId) олдсонгүй");
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = tokenData.data;
  if (!token) return null;

  try {
    await updateDoc(doc(db, "users", String(uid)), {
      expo_push_tokens: arrayUnion(token),
    });
  } catch (e) {
    console.warn("push: token хадгалахад алдаа", e?.message);
  }

  return token;
}

function navigateToConversation(navigationRef, conversationId) {
  if (!conversationId || !navigationRef || !navigationRef.isReady()) return;
  try {
    navigationRef.navigate("Main", {
      screen: "MessagesTab",
      params: {
        screen: "Chat",
        params: { conversationId: String(conversationId) },
      },
    });
  } catch (e) {
    console.warn("push: navigation", e?.message);
  }
}

/**
 * Мэдэгдэл дарахад чат руу оруулна. Холбоосыг AppNavigator дээрх onReady-тай хамт ашиглана.
 */
export function setupPushNotificationNavigation(navigationRef) {
  if (Platform.OS === "web") return () => {};

  Notifications.getLastNotificationResponseAsync()
    .then((response) => {
      const cid = response?.notification?.request?.content?.data?.conversationId;
      if (cid) pendingOpenConversationId = String(cid);
    })
    .catch(() => {});

  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const cid = response?.notification?.request?.content?.data?.conversationId;
    if (cid) navigateToConversation(navigationRef, cid);
  });

  return () => sub.remove();
}

export function flushPendingNotificationNavigation(navigationRef) {
  if (Platform.OS === "web" || !pendingOpenConversationId) return;
  const cid = pendingOpenConversationId;
  pendingOpenConversationId = null;
  navigateToConversation(navigationRef, cid);
}
