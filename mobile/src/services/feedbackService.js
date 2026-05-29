import { collection, doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
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

  const payload = {
    user_uid: user.uid,
    name: user.displayName || email.split("@")[0] || "",
    phone: phone || "",
    email,
    message: text,
    status: "new",
    created_date: Timestamp.now(),
  };

  const colRef = collection(db, "feedback_messages");
  const writeNew = async () => {
    const docRef = doc(colRef);
    await setDoc(docRef, payload);
    return { id: docRef.id, ...payload };
  };

  try {
    return await writeNew();
  } catch (e) {
    const code = String(e?.code || "");
    const msg = String(e?.message || "");
    if (code === "already-exists" || /already exists/i.test(msg)) {
      return writeNew();
    }
    throw e;
  }
}
