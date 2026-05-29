/**
 * Native SMS via @react-native-firebase/auth (EAS / dev client only — not Expo Go).
 * Session persistence: authService confirmPhoneLogin → Firebase JS signInWithCredential + AsyncStorage.
 */
import Constants from "expo-constants";

/** @type {import('@react-native-firebase/auth').FirebaseAuthTypes.ConfirmationResult | null} */
let pendingConfirmation = null;

const EXPO_GO_OTP_MSG =
  "Утасны OTP нэвтрэлт Expo Go дээр ажиллахгүй. EAS development build суулгаад ашиглана уу.";

function isExpoGoClient() {
  return Constants.appOwnership === "expo";
}

function getRnAuthModule() {
  if (isExpoGoClient()) {
    throw new Error(EXPO_GO_OTP_MSG);
  }
  try {
    // Lazy require — Expo Go must not load native module at import time.
    // eslint-disable-next-line global-require
    const mod = require("@react-native-firebase/auth");
    return mod.default;
  } catch (e) {
    const msg = e?.message || String(e);
    if (/Native module|RNFBAppModule|not found/i.test(msg)) {
      throw new Error(EXPO_GO_OTP_MSG);
    }
    throw e;
  }
}

export async function nativeSendPhoneOtp(phoneE164) {
  const phone = String(phoneE164 || "").trim();
  if (!phone.startsWith("+")) {
    throw new Error("Утасны дугаар +8210… форматаар оруулна уу");
  }
  const rnAuth = getRnAuthModule();
  pendingConfirmation = await rnAuth().signInWithPhoneNumber(phone);
  return { verificationId: pendingConfirmation?.verificationId || "" };
}

export function getPendingPhoneVerificationId() {
  return pendingConfirmation?.verificationId || null;
}

export function clearPendingPhoneOtp() {
  pendingConfirmation = null;
}

/** Logout: RN Firebase session (spike / edge cases) — JS Auth signOut is separate. */
export async function signOutNativeAuthIfAny() {
  if (isExpoGoClient()) return;
  try {
    const rnAuth = getRnAuthModule();
    if (rnAuth().currentUser) {
      await rnAuth().signOut();
    }
  } catch {
    /* ignore */
  }
  clearPendingPhoneOtp();
}
