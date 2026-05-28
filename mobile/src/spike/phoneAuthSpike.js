/**
 * Web / unsupported: Phone OTP spike is native-only.
 */

export function isPhoneAuthSpikeEnabled() {
  return process.env.EXPO_PUBLIC_PHONE_AUTH_SPIKE === "true";
}

export const SPIKE_NATIVE_ONLY = true;

export function getAuthSyncSnapshot() {
  return {
    platform: "web",
    rn: null,
    js: null,
    inSync: false,
    note: "Spike requires iOS/Android dev build with @react-native-firebase/auth",
  };
}

export function subscribeRnAuth() {
  return () => {};
}

export function subscribeJsAuth() {
  return () => {};
}

export async function spikeSendOtp() {
  throw new Error("Phone OTP spike is native-only");
}

export async function spikeConfirmOtp() {
  throw new Error("Phone OTP spike is native-only");
}

export async function spikeSignOutRn() {
  throw new Error("Phone OTP spike is native-only");
}

export async function spikeSignOutJs() {
  throw new Error("Phone OTP spike is native-only");
}
