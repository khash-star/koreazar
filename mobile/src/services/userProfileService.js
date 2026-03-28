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
import { normalizeEmail } from "../utils/emailNormalize.js";

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
export async function getAdminEmail() {
  try {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);
    const admin = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })).find((u) => u.role === "admin");
    return admin?.email || null;
  } catch (e) {
    console.warn("getAdminEmail:", e?.message);
    return null;
  }
}

/** Имэйлээр хэрэглэгчийн профайл */
export async function getUserByEmail(email) {
  try {
    if (!email) return null;
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
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
