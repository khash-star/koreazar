import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

let lastSet = -1;

export function invalidateAppIconBadgeCache() {
  lastSet = -1;
}

/** Home screen дээрх апп icon badge — нийт тоо (жишээ нь уншаагүй мессеж + зар). */
export async function syncAppIconBadgeFromUnreadCount(count) {
  if (Platform.OS === "web") return;
  const n = Math.max(0, Math.min(99999, Math.floor(Number(count) || 0)));
  if (n === lastSet) return;
  try {
    await Notifications.setBadgeCountAsync(n);
    lastSet = n;
  } catch {
    /* зөвшөөрөл эсвэл launcher дэмжихгүй */
  }
}

export async function clearAppIconBadge() {
  if (Platform.OS === "web") return;
  if (lastSet === 0) return;
  try {
    await Notifications.setBadgeCountAsync(0);
    lastSet = 0;
  } catch {
    /* ignore */
  }
}
