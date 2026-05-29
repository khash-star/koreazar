/** Expo web — native SMS OTP байхгүй */
export async function nativeSendPhoneOtp() {
  throw new Error("Утасны OTP нэвтрэлт зөвхөн iOS/Android апп дээр ажиллана.");
}

export function getPendingPhoneVerificationId() {
  return null;
}

export function clearPendingPhoneOtp() {
  /* noop */
}

export async function signOutNativeAuthIfAny() {
  /* noop */
}
