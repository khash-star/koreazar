import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { normalizeEmail, emailQueryVariants } from "../utils/emailNormalize.js";

/** Одоогийн хэрэглэгчийн профайл дээр зар эзэн (имэйл) блоклогдсон эсэх */
export function isSellerBlockedByViewer(userDoc, sellerEmail) {
  if (!userDoc || !sellerEmail) return false;
  const se = normalizeEmail(sellerEmail);
  if (!se) return false;
  const raw = userDoc.blocked_seller_emails;
  if (!Array.isArray(raw)) return false;
  return raw.some((x) => normalizeEmail(x) === se);
}

/** Зар эзнийг блоклох / блок тайлах (өөрийн users/{uid} дээр blocked_seller_emails) */
export async function setSellerBlockedByEmail(uid, sellerEmail, blocked) {
  if (!uid) throw new Error("Нэвтэрнэ үү");
  const se = normalizeEmail(sellerEmail);
  if (!se) throw new Error("Зар эзний имэйл олдсонгүй");
  const ref = doc(db, "users", String(uid));
  if (blocked) {
    await updateDoc(ref, { blocked_seller_emails: arrayUnion(se) });
  } else {
    await updateDoc(ref, { blocked_seller_emails: arrayRemove(se) });
  }
}

/** Firebase Auth дээр имэйл байхгүй үед users/{uid} (нэвтрэлтийн үндсэн имэйл) */
export async function getUserProfileByUid(uid) {
  try {
    if (!uid) return null;
    const ref = doc(db, "users", String(uid));
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (e) {
    console.warn("getUserProfileByUid:", e?.message);
    return null;
  }
}

/** Админы имэйл (users коллекц дээр role === 'admin') */
const ADMIN_EMAIL_CACHE_TTL_MS = 5 * 60 * 1000;
let adminEmailCache = { email: null, hasValue: false, expiresAt: 0, cachedAt: 0 };
let adminEmailFetchPromise = null;

function readAdminEmailCache(allowStale) {
  if (!adminEmailCache.hasValue) return undefined;
  const now = Date.now();
  if (adminEmailCache.expiresAt > now) return adminEmailCache.email;
  if (allowStale) return adminEmailCache.email;
  return undefined;
}

function writeAdminEmailCache(email) {
  const now = Date.now();
  adminEmailCache = {
    email,
    hasValue: true,
    cachedAt: now,
    expiresAt: now + ADMIN_EMAIL_CACHE_TTL_MS,
  };
}

async function fetchAdminEmailFromFirestore() {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("role", "==", "admin"), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const raw = snapshot.docs[0].data()?.email;
  return raw ? normalizeEmail(raw) : null;
}

export async function getAdminEmail() {
  const cached = readAdminEmailCache(false);
  if (cached !== undefined) return cached;

  if (adminEmailFetchPromise) return adminEmailFetchPromise;

  adminEmailFetchPromise = (async () => {
    try {
      const email = await fetchAdminEmailFromFirestore();
      writeAdminEmailCache(email);
      return email;
    } catch (e) {
      console.warn("getAdminEmail:", e?.message);
      const stale = readAdminEmailCache(true);
      if (stale !== undefined) {
        console.warn("[getAdminEmail] using stale cache after fetch error");
        return stale;
      }
      return null;
    } finally {
      adminEmailFetchPromise = null;
    }
  })();

  return adminEmailFetchPromise;
}

/** Имэйлээр хэрэглэгчийн профайл */
export async function getUserByEmail(email) {
  try {
    if (!email) return null;
    const usersRef = collection(db, "users");
    const variants = [...new Set(emailQueryVariants(normalizeEmail(email)))];
    if (variants.length === 0) {
      const em = normalizeEmail(email);
      if (em) variants.push(em);
    }
    for (const em of variants) {
      if (!em) continue;
      const q = query(usersRef, where("email", "==", em), limit(1));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        return { id: docSnap.id, ...docSnap.data() };
      }
    }
    return null;
  } catch (e) {
    console.warn("getUserByEmail:", e?.message);
    return null;
  }
}

export async function updateUserBlocked(uid, blocked) {
  if (!uid) throw new Error("Хэрэглэгчийн ID олдсонгүй");
  const ref = doc(db, "users", String(uid));
  await updateDoc(ref, { blocked: !!blocked });
}

export async function deleteUserProfile(uid) {
  if (!uid) throw new Error("Хэрэглэгчийн ID олдсонгүй");
  const ref = doc(db, "users", String(uid));
  await deleteDoc(ref);
}
