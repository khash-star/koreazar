/**
 * Native-only spike: RN Firebase Auth phone sign-in vs Firebase JS SDK auth state.
 * Do not use in production flows until architecture decision is recorded.
 */
import rnAuth from "@react-native-firebase/auth";
import { auth as jsAuth } from "../config/firebase";

/** @type {import('@react-native-firebase/auth').FirebaseAuthTypes.ConfirmationResult | null} */
let pendingConfirmation = null;

export function isPhoneAuthSpikeEnabled() {
  return typeof __DEV__ !== "undefined" && __DEV__;
}

export const SPIKE_NATIVE_ONLY = false;

function mapUser(user) {
  if (!user) return null;
  return {
    uid: user.uid || null,
    email: user.email || null,
    phoneNumber: user.phoneNumber || null,
    providerIds: user.providerData?.map((p) => p.providerId) || [],
  };
}

export function getAuthSyncSnapshot() {
  const rnUser = rnAuth().currentUser;
  const jsUser = jsAuth.currentUser;
  const rn = mapUser(rnUser);
  const js = mapUser(jsUser);
  const inSync =
  !!rn?.uid &&
  !!js?.uid &&
  rn.uid === js.uid &&
  (rn.phoneNumber || "") === (js.phoneNumber || "");

  return {
    platform: "native",
    rn,
    js,
    inSync,
    rnOnly: !!rn?.uid && !js?.uid,
    jsOnly: !!js?.uid && !rn?.uid,
    pendingOtp: !!pendingConfirmation,
    note: inSync
      ? "RN + JS auth both see same uid (unexpected unless bridged — verify)"
      : rn?.uid && !js?.uid
        ? "RN signed in; JS auth currentUser is null — expected without bridge"
        : js?.uid && !rn?.uid
          ? "JS signed in (e.g. email); RN auth null — expected for email-only login"
          : "Neither signed in",
  };
}

export function subscribeRnAuth(callback) {
  return rnAuth().onAuthStateChanged(() => callback(getAuthSyncSnapshot()));
}

export function subscribeJsAuth(callback) {
  return jsAuth.onAuthStateChanged(() => callback(getAuthSyncSnapshot()));
}

/**
 * @param {string} phoneE164 e.g. +821012345678
 */
export async function spikeSendOtp(phoneE164) {
  const phone = String(phoneE164 || "").trim();
  if (!phone.startsWith("+")) {
    throw new Error("Use E.164 format, e.g. +821012345678");
  }
  pendingConfirmation = await rnAuth().signInWithPhoneNumber(phone);
  return {
    sent: true,
    verificationId: pendingConfirmation?.verificationId || "(ok)",
    snapshot: getAuthSyncSnapshot(),
  };
}

/**
 * @param {string} code 6-digit OTP
 */
export async function spikeConfirmOtp(code) {
  if (!pendingConfirmation) {
    throw new Error("Call Send OTP first");
  }
  const trimmed = String(code || "").trim();
  if (!trimmed) {
    throw new Error("Enter OTP code");
  }
  await pendingConfirmation.confirm(trimmed);
  pendingConfirmation = null;
  return getAuthSyncSnapshot();
}

export async function spikeSignOutRn() {
  pendingConfirmation = null;
  await rnAuth().signOut();
  return getAuthSyncSnapshot();
}

export async function spikeSignOutJs() {
  await jsAuth.signOut();
  return getAuthSyncSnapshot();
}
