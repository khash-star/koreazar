import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
} from "firebase/auth";
import { collection, doc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { deleteAllFirestoreDataForUser } from "./accountDeletion";
import { buildApiUrl, requestJson } from "./apiClient";

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
  return onAuthStateChanged(auth, callback);
}

export async function loginWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  await syncUserToMySql(cred.user, {});
  return cred.user;
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
    });
  } catch (e) {
    console.warn("Firestore user doc:", e?.message);
  }
  await syncUserToMySql(user, {
    displayName: displayName?.trim() || user.email?.split("@")[0] || "",
    phone: phone?.trim() || "",
    city: city?.trim() || "",
    district: district?.trim() || "",
  });
  return user;
}

export async function logout() {
  await signOut(auth);
}

/** Apple 5.1.1(v) — бүртгэл бүрэн устгах */
export async function deleteAccountWithPassword(password) {
  const user = auth.currentUser;
  if (!user?.email) throw new Error("Нэвтэрсэн хэрэглэгч олдсонгүй");
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

  const uid = user.uid;
  const email = user.email;
  await deleteAllFirestoreDataForUser(uid, email);

  try {
    await deleteUser(user);
  } catch (e) {
    const code = e?.code || "";
    if (code === "auth/requires-recent-login") {
      throw new Error(
        "Өгөгдөл устгагдсан боловч бүртгэлийг бүрэн хаахын тулд дахин нэвтэрч оролдоно уу"
      );
    }
    throw e;
  }
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
  };
  return map[code] || "Алдаа гарлаа. Дахин оролдоно уу";
}

export async function getAllUsers() {
  const usersRef = collection(db, "users");
  const snap = await getDocs(usersRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
