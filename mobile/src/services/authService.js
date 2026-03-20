import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

export function subscribeAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function loginWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

export async function registerWithEmail(email, password, displayName = "") {
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
      phone: "",
      kakao_id: "",
      wechat_id: "",
      whatsapp: "",
      facebook: "",
    });
  } catch (e) {
    console.warn("Firestore user doc:", e?.message);
  }
  return user;
}

export async function logout() {
  await signOut(auth);
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
  };
  return map[code] || "Алдаа гарлаа. Дахин оролдоно уу";
}
