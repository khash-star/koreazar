import { Platform } from "react-native";
import Constants from "expo-constants";

let lastSet = -1;
/** @type {Promise<typeof import("expo-notifications")> | null} */
let notificationsLoadPromise = null;

export function invalidateAppIconBadgeCache() {
  lastSet = -1;
}

/**
 * Expo Go on Android (SDK 53+): importing `expo-notifications` throws at module load
 * (remote push was removed from Expo Go). Dev / EAS builds must be used for that stack.
 * Badge APIs are skipped here so the rest of the app runs in Expo Go.
 */
function isExpoGoAndroid() {
  return Platform.OS === "android" && Constants.appOwnership === "expo";
}

async function getNotificationsModule() {
  if (Platform.OS === "web") return null;
  if (isExpoGoAndroid()) return null;
  if (!notificationsLoadPromise) {
    notificationsLoadPromise = import("expo-notifications");
  }
  try {
    return await notificationsLoadPromise;
  } catch {
    return null;
  }
}

/**
 * iOS: Expo — `setBadgeCountAsync` нь `allowBadge` зөвшөөрөлгүйгүйгээр `false` буцаана.
 * Android: зарим launcher тоо огт харуулахгүй / зөвхөн цэг; заримд notification зөвшөөрөл хэрэгтэй.
 */
async function ensureBadgePermissionIfNeeded() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return false;
  const cur = await Notifications.getPermissionsAsync();
  if (cur.status === "granted") {
    if (Platform.OS === "ios" && cur.ios?.allowsBadge === false) return false;
    return true;
  }
  if (cur.canAskAgain === false) return false;
  const res = await Notifications.requestPermissionsAsync({
    ios: {
      allowBadge: true,
      allowSound: false,
      allowAlert: false,
    },
  });
  if (res.status !== "granted") return false;
  if (Platform.OS === "ios" && res.ios?.allowsBadge === false) return false;
  return true;
}

/** Home screen дээрх апп icon badge — нийт тоо (жишээ нь уншаагүй мессеж + зар). */
export async function syncAppIconBadgeFromUnreadCount(count) {
  if (Platform.OS === "web") return;
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;
  const n = Math.max(0, Math.min(99999, Math.floor(Number(count) || 0)));
  if (n === lastSet) return;
  try {
    if (n > 0) {
      const okPerm = await ensureBadgePermissionIfNeeded();
      if (!okPerm) return;
    }
    const applied = await Notifications.setBadgeCountAsync(n);
    if (!applied && n > 0) return;
    lastSet = n;
  } catch {
    /* native */
  }
}

export async function clearAppIconBadge() {
  if (Platform.OS === "web") return;
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;
  if (lastSet === 0) return;
  try {
    await Notifications.setBadgeCountAsync(0);
    lastSet = 0;
  } catch {
    /* ignore */
  }
}
