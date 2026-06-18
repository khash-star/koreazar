import { Platform } from "react-native";
import Constants from "expo-constants";
import { deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";

/** @type {string | null} */
let lastRegisteredToken = null;

function isExpoGoAndroid() {
  return Platform.OS === "android" && Constants.appOwnership === "expo";
}

function getEasProjectId() {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    null
  );
}

/** Firestore-safe doc id from Expo push token string */
export function pushTokenDocId(expoPushToken) {
  const raw = String(expoPushToken || "").trim();
  if (!raw) return "";
  const safe = raw.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  return safe || "unknown";
}

async function getNotificationsModule() {
  if (Platform.OS === "web") return null;
  if (isExpoGoAndroid()) return null;
  try {
    return await import("expo-notifications");
  } catch {
    return null;
  }
}

async function getCurrentExpoPushToken() {
  const projectId = getEasProjectId();
  if (!projectId) return null;

  const Notifications = await getNotificationsModule();
  if (!Notifications) return null;

  try {
    const tokenRes = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenRes?.data || null;
  } catch (e) {
    console.warn("getExpoPushTokenAsync:", e?.message);
    return null;
  }
}

/**
 * Alert/sound for remote chat push (separate from app icon badge permission in appIconBadge.js).
 */
export async function ensureChatPushPermissions() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("chat", {
      name: "Мессеж",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 120, 200],
      lightColor: "#EA580C",
      sound: "default",
      enableVibrate: true,
      showBadge: true,
    });
  }

  const cur = await Notifications.getPermissionsAsync();
  if (cur.status === "granted") {
    if (Platform.OS === "ios" && cur.ios?.allowsAlert === false) return false;
    return true;
  }
  if (cur.canAskAgain === false) return false;

  const res = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
  if (res.status !== "granted") return false;
  if (Platform.OS === "ios" && res.ios?.allowsAlert === false) return false;
  return true;
}

/**
 * Register this device's Expo push token under `user_push_tokens/{uid}/devices/{tokenId}`.
 */
export async function registerPushTokenForUid(uid) {
  if (!uid || Platform.OS === "web" || isExpoGoAndroid()) return { ok: false, reason: "unsupported" };

  const projectId = getEasProjectId();
  if (!projectId) {
    console.warn("registerPushTokenForUid: missing EAS projectId");
    return { ok: false, reason: "no_project_id" };
  }

  const Notifications = await getNotificationsModule();
  if (!Notifications) return { ok: false, reason: "no_notifications_module" };

  const permitted = await ensureChatPushPermissions();
  if (!permitted) return { ok: false, reason: "permission_denied" };

  const expoPushToken = await getCurrentExpoPushToken();

  if (!expoPushToken) return { ok: false, reason: "empty_token" };

  const tokenId = pushTokenDocId(expoPushToken);
  const deviceRef = doc(db, "user_push_tokens", String(uid), "devices", tokenId);

  try {
    await setDoc(
      deviceRef,
      {
        expo_push_token: expoPushToken,
        platform: Platform.OS,
        updated_at: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (e) {
    const denied =
      e?.code === "permission-denied" ||
      String(e?.message || "")
        .toLowerCase()
        .includes("insufficient permissions");
    console.warn("registerPushTokenForUid setDoc:", e?.message);
    return { ok: false, reason: denied ? "permission_denied" : "firestore_error" };
  }

  lastRegisteredToken = expoPushToken;
  return { ok: true, tokenId, expoPushToken };
}

/** Remove this device's token from Firestore (logout). */
export async function unregisterCurrentPushToken(uid) {
  if (!uid) return;
  const expoPushToken = lastRegisteredToken || (await getCurrentExpoPushToken());
  if (!expoPushToken) return;
  const tokenId = pushTokenDocId(expoPushToken);
  if (!tokenId) return;
  try {
    await deleteDoc(doc(db, "user_push_tokens", String(uid), "devices", tokenId));
  } catch (e) {
    console.warn("unregisterCurrentPushToken:", e?.message);
  } finally {
    lastRegisteredToken = null;
  }
}
