import { Alert } from "react-native";

/** iOS / Android — RN Alert (window.alert байхгүй). */
export function showAlert(title, message, buttons) {
  if (buttons?.length) {
    Alert.alert(title, message, buttons);
  } else {
    Alert.alert(title, message);
  }
}
