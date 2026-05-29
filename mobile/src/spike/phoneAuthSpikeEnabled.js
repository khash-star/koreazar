/** Dev-only Phone OTP spike — release build-д харагдахгүй. */
export function isPhoneAuthSpikeEnabled() {
  return typeof __DEV__ !== "undefined" && __DEV__;
}
