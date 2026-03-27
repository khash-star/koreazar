import { Linking } from "react-native";
import { showAlert } from "./showAlert";

const ALLOWED_SCHEMES = new Set(["https:", "http:", "tel:"]);

function parseUrl(rawUrl) {
  if (typeof rawUrl !== "string") return null;
  const value = rawUrl.trim();
  if (!value || value === "#") return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

/**
 * iOS: Linking.canOpenURL нь https:// зарим тохиолдолд false буцаадаг (LSApplicationQueriesSchemes).
 * Тиймээс шууд openURL + try/catch ашиглана.
 */
export async function openExternalUrlSafe(rawUrl, fallbackMessage = "Холбоос нээж чадсангүй.") {
  const parsed = parseUrl(rawUrl);
  if (!parsed || !ALLOWED_SCHEMES.has(parsed.protocol)) {
    showAlert("Алдаа", fallbackMessage);
    return false;
  }
  const url = parsed.toString();
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    showAlert("Алдаа", fallbackMessage);
    return false;
  }
}

export async function openPhoneDialerSafe(phone) {
  const normalized = typeof phone === "string" ? phone.replace(/[^\d+]/g, "") : "";
  if (!normalized) {
    showAlert("Алдаа", "Утасны дугаар буруу байна.");
    return false;
  }
  return openExternalUrlSafe(`tel:${normalized}`, "Залгах боломжгүй байна.");
}
