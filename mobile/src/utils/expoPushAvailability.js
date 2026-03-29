import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";

/**
 * expo-notifications ачаалахаас өмнө шалгана. Native модуль APK-д ороогүй бол
 * pushNotifications.js огт ачаалагдахгүй — «Cannot find ExpoPushTokenManager» гарна.
 */
export function isExpoPushNativeAvailable() {
  if (Platform.OS === "web") return false;
  try {
    return requireOptionalNativeModule("ExpoPushTokenManager") != null;
  } catch {
    return false;
  }
}
