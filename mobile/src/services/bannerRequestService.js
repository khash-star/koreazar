import { collection, doc, getDocs, orderBy, query, Timestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

export async function listBannerRequests() {
  const user = auth.currentUser;
  if (!user?.email) throw new Error("Нэвтэрнэ үү");
  const ref = collection(db, "banner_requests");
  const q = query(ref, orderBy("created_date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateBannerRequest(id, status) {
  const user = auth.currentUser;
  if (!user?.email) throw new Error("Нэвтэрнэ үү");
  if (!id) throw new Error("Хүсэлтийн ID олдсонгүй");
  const ref = doc(db, "banner_requests", String(id));
  await updateDoc(ref, {
    status,
    reviewed_at: Timestamp.now(),
  });
}
