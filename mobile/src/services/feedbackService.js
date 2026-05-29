import { addDoc, collection, doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { requireResolvedAuthEmail } from "./authService";

export async function createFeedback(message) {
  const { user, email } = await requireResolvedAuthEmail();
  const text = (message || "").trim();
  if (!text) throw new Error("Саналын текст хоосон байна");

  let phone = user.phoneNumber || "";
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      phone = snap.data()?.phone || snap.data()?.phoneNumber || phone;
    }
  } catch {
    /* ignore */
  }

  const ref = collection(db, "feedback_messages");
  const payload = {
    user_uid: user.uid,
    name: user.displayName || email.split("@")[0] || "",
    phone: phone || "",
    email,
    message: text,
    status: "new",
    created_date: Timestamp.now(),
  };
  const created = await addDoc(ref, payload);
  return { id: created.id, ...payload };
}
