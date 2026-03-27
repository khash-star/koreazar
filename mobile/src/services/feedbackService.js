import { addDoc, collection, Timestamp } from "firebase/firestore";
import { auth, db } from "../config/firebase";

export async function createFeedback(message) {
  const user = auth.currentUser;
  if (!user?.email) throw new Error("Нэвтэрсний дараа санал илгээнэ үү");
  const text = (message || "").trim();
  if (!text) throw new Error("Саналын текст хоосон байна");

  const ref = collection(db, "feedback_messages");
  const payload = {
    name: user.displayName || user.email.split("@")[0] || "",
    phone: "",
    email: user.email,
    message: text,
    status: "new",
    created_date: Timestamp.now(),
  };
  const created = await addDoc(ref, payload);
  return { id: created.id, ...payload };
}
