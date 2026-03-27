import { collection, deleteDoc, doc, getDocs, limit, query, updateDoc, where } from "firebase/firestore";
import { db } from "../config/firebase";

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
