import { addDoc, collection, doc, getDocs, orderBy, query, Timestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

export async function createListingReport({ listingId, listingTitle, reason, details }) {
  const user = auth.currentUser;
  if (!user?.email) throw new Error("Нэвтэрнэ үү");
  if (!listingId) throw new Error("Зарын ID олдсонгүй");

  const ref = collection(db, "listing_reports");
  const payload = {
    listing_id: listingId,
    listing_title: listingTitle || "",
    reason: reason || "Бусад",
    details: details?.trim() || null,
    status: "pending",
    reporter_email: user.email,
    created_date: Timestamp.now(),
  };

  const created = await addDoc(ref, payload);
  return { id: created.id, ...payload };
}

export async function listListingReports() {
  const user = auth.currentUser;
  if (!user?.email) throw new Error("Нэвтэрнэ үү");
  const ref = collection(db, "listing_reports");
  const q = query(ref, orderBy("created_date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateListingReport(id, data) {
  const user = auth.currentUser;
  if (!user?.email) throw new Error("Нэвтэрнэ үү");
  if (!id) throw new Error("Гомдлын ID олдсонгүй");
  const ref = doc(db, "listing_reports", String(id));
  await updateDoc(ref, data);
}
