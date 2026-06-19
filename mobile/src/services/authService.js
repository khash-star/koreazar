import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  EmailAuthProvider,
  PhoneAuthProvider,
  signInWithCredential,
  reauthenticateWithCredential,
  deleteUser,
} from "firebase/auth";
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { deleteAllFirestoreDataForUser } from "./accountDeletion";
import { buildApiUrl, requestJson } from "./apiClient";
import { normalizeEmail, phoneToAuthEmail } from "../utils/emailNormalize.js";
import {
  clearPendingPhoneOtp,
  getPendingPhoneVerificationId,
  nativeSendPhoneOtp,
  signOutNativeAuthIfAny,
} from "./phoneAuth";

/** Client profile updates must never set these (web authService parity). */
const PROTECTED_USER_DOC_FIELDS = new Set([
  "role",
  "isAdmin",
  "customerId",
  "emailVerified",
  "uid",
]);

function stripProtectedUserFields(data) {
  if (!data || typeof data !== "object") return {};
  const out = { ...data };
  PROTECTED_USER_DOC_FIELDS.forEach((key) => {
    delete out[key];
  });
  return out;
}

/** Вэбийн authService.TERMS_POLICY_VERSION-тай ижил байлгана уу */
const TERMS_POLICY_VERSION = "2025-03-28";
const DESTRUCTIVE_DELETE_RECENT_LOGIN_MAX_AGE_MS = 4 * 60 * 1000;

function getLastSignInTimeMs(user) {
  const metadata = user?.metadata || {};
  const candidates = [
    metadata.lastSignInTime,
    metadata.lastLoginAt,
    metadata.lastSignInAt,
  ];
  for (const value of candidates) {
    if (value == null || value === "") continue;
    const ms = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(ms) && ms > 0) return ms;
    const parsed = Date.parse(String(value));
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

async function assertRecentLoginBeforeDestructiveDelete(user, hasPasswordProvider) {
  if (hasPasswordProvider) return;
  try {
    await user.reload?.();
  } catch {
    /* best effort; metadata below still protects stale sessions when available */
  }
  const lastSignInMs = getLastSignInTimeMs(user);
  if (!lastSignInMs || Date.now() - lastSignInMs > DESTRUCTIVE_DELETE_RECENT_LOGIN_MAX_AGE_MS) {
    throw new Error(
      "Аюулгүй байдлын үүднээс бүртгэл устгахаас өмнө утсаар дахин нэвтэрч, шууд дахин оролдоно уу"
    );
  }
}

async function ensureTermsAcceptanceIfMissing(user) {
  if (!user?.uid) return;
  try {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    if (snap.exists() && snap.data()?.termsAcceptedAt != null) return;
    await setDoc(
      ref,
      {
        termsAcceptedAt: serverTimestamp(),
        termsVersion: TERMS_POLICY_VERSION,
        termsAckSource: "login",
      },
      { merge: true }
    );
  } catch (e) {
    console.warn("ensureTermsAcceptanceIfMissing:", e?.message || e);
  }
}

/**
 * Firestore conversations/saved_listings дүрэм authEmailLower() — users/{uid}.email-тэй таарах ёстой.
 * @returns {Promise<boolean>} users/{uid}.email амжилттай бичигдсэн эсэх
 */
export async function ensureUserDocEmailForFirestoreRules(user, profileEmail = null) {
  if (!user?.uid) return false;
  const pick = (raw) => {
    if (raw == null || raw === "") return "";
    const s = typeof raw === "string" ? raw.trim() : String(raw).trim();
    if (!s) return "";
    return normalizeEmail(s) || "";
  };
  let em = pick(profileEmail);
  if (!em) {
    em = await getResolvedAuthEmail(user);
  }
  if (!em) return false;
  try {
    await setDoc(doc(db, "users", user.uid), { email: em }, { merge: true });
    return true;
  } catch (e) {
    console.warn("ensureUserDocEmailForFirestoreRules:", e?.message || e);
    return false;
  }
}

async function persistCustomerIdFromSync(user, data) {
  const cid = data?.customer_id;
  if (!user?.uid || cid == null || Number.isNaN(Number(cid))) return;
  const customerId = Number(cid);
  try {
    await updateDoc(doc(db, "users", user.uid), { customerId });
  } catch {
    try {
      await setDoc(doc(db, "users", user.uid), { customerId }, { merge: true });
    } catch (e2) {
      console.warn("Firestore customerId:", e2?.message || e2);
    }
  }
}

async function syncUserToMySql(user, profile = {}) {
  if (!user) return;
  try {
    const token = await user.getIdToken();
    const data = await requestJson(buildApiUrl("user_sync"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        display_name: profile.displayName || user.displayName || user.email?.split("@")[0] || "",
        phone: profile.phone || "",
        city: profile.city || "",
        district: profile.district || "",
      }),
      timeoutMs: 10000,
    });
    await persistCustomerIdFromSync(user, data);
  } catch (e) {
    console.warn("MySQL user sync failed:", e?.message || e);
  }
}

export function subscribeAuth(callback) {
  return onAuthStateChanged(auth, (user) => {
    if (!user) {
      callback(null);
      return;
    }
    ensureUserDocEmailForFirestoreRules(user).finally(() => callback(user));
  });
}

export async function loginWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  await ensureUserDocEmailForFirestoreRules(cred.user, normalizeEmail(email));
  syncUserToMySql(cred.user, {}).catch(() => {});
  await ensureTermsAcceptanceIfMissing(cred.user);
  return cred.user;
}

function isAutoPhoneDisplayName(name, phoneE164 = "") {
  const trimmed = String(name || "").trim();
  if (!trimmed || trimmed === "User") return true;
  if (phoneE164 && trimmed === `User ${phoneE164}`) return true;
  return /^User \+\d+$/.test(trimmed);
}

/** Native SMS илгээх (session: confirmPhoneLogin → JS Auth + AsyncStorage persistence). */
export async function startPhoneLogin(phoneNumberE164) {
  if (!phoneNumberE164) {
    throw new Error("Утасны дугаар хоосон байна");
  }
  await nativeSendPhoneOtp(phoneNumberE164);
}

/**
 * OTP баталгаажуулах — JS Auth credential (апп дахин нээхэд session хадгалагдана).
 * @returns {Promise<{ user: import('firebase/auth').User, needsNameSetup: boolean }>}
 */
export async function confirmPhoneLogin(code, phoneNumberE164 = "") {
  const verificationId = getPendingPhoneVerificationId();
  if (!verificationId) {
    throw new Error("Баталгаажуулалтын сесс олдсонгүй. Дахин код илгээнэ үү.");
  }
  const trimmed = String(code || "").trim();
  if (!trimmed) {
    throw new Error("OTP код оруулна уу");
  }

  const credential = PhoneAuthProvider.credential(verificationId, trimmed);
  const userCredential = await signInWithCredential(auth, credential);
  clearPendingPhoneOtp();

  const user = userCredential.user;
  const phone = phoneNumberE164 || user.phoneNumber || "";
  const authEmail = normalizeEmail(phoneToAuthEmail(phone));

  const userRef = doc(db, "users", user.uid);
  const existingSnap = await getDoc(userRef);
  const existing = existingSnap.exists() ? existingSnap.data() : null;
  const existingName = existing?.displayName || user.displayName || "";
  const profileCompleted = existing?.profileCompleted === true;
  const needsNameSetup =
    !profileCompleted && isAutoPhoneDisplayName(existingName, phone);

  const payload = {
    phone,
    phoneNumber: phone,
    email: authEmail || existing?.email || "",
    role: existing?.role || "user",
    authProvider: "phone",
  };

  if (!existingSnap.exists()) {
    payload.createdAt = serverTimestamp();
    payload.profileCompleted = false;
  }

  if (!needsNameSetup && existingName && !isAutoPhoneDisplayName(existingName, phone)) {
    payload.displayName = existingName;
  }

  await setDoc(userRef, payload, { merge: true });
  await ensureUserDocEmailForFirestoreRules(user, authEmail);

  if (!needsNameSetup) {
    await syncUserToMySql(user, { displayName: existingName, phone });
  }
  await ensureTermsAcceptanceIfMissing(user);

  return { user, needsNameSetup };
}

export async function completePhoneUserProfile(displayName) {
  const user = auth.currentUser;
  if (!user?.uid) {
    throw new Error("Нэвтэрсэн хэрэглэгч олдсонгүй");
  }
  const name = String(displayName || "").trim();
  if (name.length < 2) {
    throw new Error("Нэр хамгийн багадаа 2 тэмдэгт байх ёстой");
  }

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  const phone = snap.data()?.phone || snap.data()?.phoneNumber || user.phoneNumber || "";

  await setDoc(
    userRef,
    {
      displayName: name,
      profileCompleted: true,
      phone,
      phoneNumber: phone,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  try {
    await updateProfile(user, { displayName: name });
  } catch (e) {
    console.warn("updateProfile:", e?.message || e);
  }

  await syncUserToMySql(user, { displayName: name, phone });
  const authEmail =
    normalizeEmail(phoneToAuthEmail(phone)) || normalizeEmail(snap.data()?.email || "") || "";
  await ensureUserDocEmailForFirestoreRules(user, authEmail || undefined);
  return user;
}

/**
 * Firestore rules / saved_listings — token.email хоосон үед users doc + synthetic phone email.
 */
export async function getResolvedAuthEmail(user = auth.currentUser) {
  if (!user?.uid) return "";
  const pick = (raw) => {
    if (raw == null || raw === "") return "";
    return normalizeEmail(String(raw).trim()) || "";
  };

  let em = pick(user.email);
  let phone = user.phoneNumber || "";

  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      const d = snap.data();
      em = em || pick(d?.email);
      phone = phone || d?.phone || d?.phoneNumber || "";
    }
  } catch {
    /* ignore */
  }

  if (!em && phone) {
    em = normalizeEmail(phoneToAuthEmail(phone)) || "";
  }
  return em;
}

/** Firestore бичилт / reporter_email — phone OTP-д auth.currentUser.email байхгүй. */
export async function requireResolvedAuthEmail() {
  const user = auth.currentUser;
  if (!user?.uid) {
    throw new Error("Нэвтэрнэ үү");
  }
  await ensureUserDocEmailForFirestoreRules(user);
  const email = await getResolvedAuthEmail(user);
  if (!email) {
    throw new Error("Нэвтэрсний дараа дахин оролдоно уу");
  }
  return { user, email };
}

export async function registerWithEmail(
  email,
  password,
  displayName = "",
  phone = "",
  city = "",
  district = ""
) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const user = cred.user;
  if (displayName?.trim()) {
    try {
      await updateProfile(user, { displayName: displayName.trim() });
    } catch {
      /* ignore */
    }
  }
  try {
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      displayName: displayName?.trim() || user.email?.split("@")[0] || "",
      role: "user",
      createdAt: new Date(),
      phone: phone?.trim() || "",
      city: city?.trim() || "",
      district: district?.trim() || "",
      kakao_id: "",
      wechat_id: "",
      whatsapp: "",
      facebook: "",
      termsAcceptedAt: serverTimestamp(),
      termsVersion: TERMS_POLICY_VERSION,
      termsAckSource: "register",
    });
  } catch (e) {
    console.warn("Firestore user doc:", e?.message);
  }
  syncUserToMySql(user, {
    displayName: displayName?.trim() || user.email?.split("@")[0] || "",
    phone: phone?.trim() || "",
    city: city?.trim() || "",
    district: district?.trim() || "",
  }).catch(() => {});
  return user;
}

export async function logout() {
  const uid = auth.currentUser?.uid;
  if (uid) {
    try {
      const { unregisterCurrentPushToken } = await import("./pushTokenService.js");
      await unregisterCurrentPushToken(uid);
    } catch {
      /* best-effort */
    }
  }
  clearPendingPhoneOtp();
  await signOutNativeAuthIfAny();
  await signOut(auth);
}

function trimStr(v) {
  if (v == null) return "";
  return String(v).trim();
}

/** Firestore users/{uid} + Auth displayName + MySQL sync (вэбийн updateUserData-тай ижил түлхүүрүүд). */
export async function updateUserData(uid, data) {
  const user = auth.currentUser;
  if (!user || user.uid !== uid) {
    throw new Error("Зөвхөн өөрийн мэдээллийг засах боломжтой");
  }
  const safe = stripProtectedUserFields(data);
  const patch = {
    displayName: trimStr(safe?.displayName),
    phone: trimStr(safe?.phone),
    city: trimStr(safe?.city),
    district: trimStr(safe?.district),
    kakao_id: trimStr(safe?.kakao_id),
    wechat_id: trimStr(safe?.wechat_id),
    whatsapp: trimStr(safe?.whatsapp),
    facebook: trimStr(safe?.facebook),
    updatedAt: new Date(),
  };
  const resolvedEmail = (await getResolvedAuthEmail(user)) || user.email || "";
  const userRef = doc(db, "users", uid);
  await setDoc(
    userRef,
    {
      email: resolvedEmail,
      ...patch,
    },
    { merge: true }
  );
  if (patch.displayName) {
    try {
      await updateProfile(user, { displayName: patch.displayName });
    } catch {
      /* ignore */
    }
  }
  syncUserToMySql(user, {
    displayName: patch.displayName || user.displayName || user.email?.split("@")[0] || "",
    phone: patch.phone,
    city: patch.city,
    district: patch.district,
  }).catch(() => {});
}

/** Apple 5.1.1(v) — бүртгэл бүрэн устгах (имэйл/нууц үг эсвэл утасны OTP). */
export async function deleteAccountForCurrentUser(password = "") {
  const user = auth.currentUser;
  if (!user?.uid) throw new Error("Нэвтэрсэн хэрэглэгч олдсонгүй");

  await ensureUserDocEmailForFirestoreRules(user);
  const resolvedEmail = await getResolvedAuthEmail(user);
  if (!resolvedEmail) throw new Error("Нэвтэрсний дараа дахин оролдоно уу");

  const hasPasswordProvider =
    !!user.email && user.providerData?.some((p) => p.providerId === "password");

  if (hasPasswordProvider) {
    const pwd = typeof password === "string" ? password.trim() : "";
    if (!pwd) throw new Error("Нууц үгээ оруулна уу");
    const credential = EmailAuthProvider.credential(user.email, pwd);
    try {
      await reauthenticateWithCredential(user, credential);
    } catch (e) {
      const code = e?.code || "";
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        throw new Error("Нууц үг буруу байна");
      }
      if (code === "auth/requires-recent-login" || code === "auth/user-mismatch") {
        throw new Error("Аюулгүй байдлын шалтгаанаар дахин нэвтэрч, дахин оролдоно уу");
      }
      throw e;
    }
  }

  await assertRecentLoginBeforeDestructiveDelete(user, hasPasswordProvider);

  const uid = user.uid;
  try {
    const { unregisterCurrentPushToken } = await import("./pushTokenService.js");
    await unregisterCurrentPushToken(uid);
  } catch {
    /* best-effort */
  }

  await deleteAllFirestoreDataForUser(uid, resolvedEmail);

  try {
    await deleteUser(user);
  } catch (e) {
    const code = e?.code || "";
    if (code === "auth/requires-recent-login") {
      throw new Error(
        hasPasswordProvider
          ? "Өгөгдөл устгагдсан боловч бүртгэлийг бүрэн хаахын тулд дахин нэвтэрч оролдоно уу"
          : "Сүүлийн нэвтрэлт хэт хуучин байна. Дахин утсаар нэвтэрч, дахин оролдоно уу"
      );
    }
    throw e;
  }

  clearPendingPhoneOtp();
  await signOutNativeAuthIfAny();
}

/** @deprecated Use deleteAccountForCurrentUser — имэйл/нууц үгтэй бүртгэл */
export async function deleteAccountWithPassword(password) {
  return deleteAccountForCurrentUser(password);
}

export async function sendResetEmail(email) {
  await sendPasswordResetEmail(auth, email.trim());
}

/** Firebase алдааг монгол мессеж болгох */
export function authErrorMessage(code) {
  const map = {
    "auth/invalid-email": "Имэйл буруу байна",
    "auth/user-disabled": "Энэ бүртгэл идэвхгүй болсон",
    "auth/user-not-found": "Имэйл эсвэл нууц үг буруу",
    "auth/wrong-password": "Имэйл эсвэл нууц үг буруу",
    "auth/invalid-credential": "Имэйл эсвэл нууц үг буруу",
    "auth/email-already-in-use": "Энэ имэйлээр бүртгэл аль хэдийн байна",
    "auth/weak-password": "Нууц үг хэтэрхий сул байна (дор хаяж 6 тэмдэгт)",
    "auth/too-many-requests": "Хэт олон оролдлого. Түр хүлээгээд дахин оролдоно уу",
    "auth/network-request-failed": "Сүлжээний алдаа. Интернэтээ шалгана уу",
    "auth/requires-recent-login": "Дахин нэвтэрч дахин оролдоно уу",
    "auth/invalid-phone-number": "Утасны дугаар буруу байна",
    "auth/invalid-verification-code": "OTP код буруу байна",
    "auth/code-expired": "OTP код хугацаа дууссан. Дахин илгээнэ үү",
    "auth/session-expired": "Сесс дууссан. Дахин код илгээнэ үү",
    "auth/missing-verification-code": "OTP код оруулна уу",
    "auth/quota-exceeded": "SMS лимит дууссан. Түр хүлээгээд дахин оролдоно уу",
    "auth/captcha-check-failed": "Баталгаажуулалт амжилтгүй. Дахин оролдоно уу",
    "auth/missing-client-identifier": "Android SHA тохиргоо шалгана уу (Firebase Console)",
  };
  return map[code] || "Алдаа гарлаа. Дахин оролдоно уу";
}

export async function getAllUsers() {
  const usersRef = collection(db, "users");
  const snap = await getDocs(usersRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
