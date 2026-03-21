import { Alert, Platform } from "react-native";

/**
 * react-native-web: Alert.alert is a no-op (empty implementation).
 * This helper shows real browser dialogs on web and Alert on iOS/Android.
 */
export function showAlert(title, message, buttons) {
  if (Platform.OS !== "web") {
    if (buttons?.length) {
      Alert.alert(title, message, buttons);
    } else {
      Alert.alert(title, message);
    }
    return;
  }

  const full = [title, message].filter(Boolean).join("\n\n");

  if (!buttons || buttons.length === 0) {
    window.alert(full);
    return;
  }

  if (buttons.length === 1) {
    window.alert(full);
    queueMicrotask(() => {
      try {
        buttons[0].onPress?.();
      } catch (_) {
        /* ignore */
      }
    });
    return;
  }

  if (buttons.length === 2) {
    const confirmed = window.confirm(full);
    queueMicrotask(() => {
      try {
        if (confirmed) {
          const primary = buttons.find((b) => b.style !== "cancel") || buttons[buttons.length - 1];
          primary?.onPress?.();
        } else {
          buttons.find((b) => b.style === "cancel")?.onPress?.();
        }
      } catch (_) {
        /* ignore */
      }
    });
    return;
  }

  window.alert(full);
}
