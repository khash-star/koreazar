import { addDoc, collection, deleteDoc, doc, getDocs, query, Timestamp, where } from "firebase/firestore";
import { db } from "../config/firebase";
import { auth } from "../config/firebase";
import { fetchListingByIdResult } from "./listingService";
import { toDate } from "../utils/firestoreDates";

/**
 * Вэбийн `saved_listings` collection-тай ижил.
 * Composite index шаардахгүй — client-side эрэмбэ.
 */
export async function getSavedForUser(email) {
  if (!email) return [];
  const ref = collection(db, "saved_listings");
  const q = query(ref, where("created_by", "==", email));
  const snap = await getDocs(q);
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  rows.sort((a, b) => {
    const da = toDate(a.created_date)?.getTime() || 0;
    const db = toDate(b.created_date)?.getTime() || 0;
    return db - da;
  });
  return rows;
}

export async function saveListing(listingId) {
  const user = auth.currentUser;
  const userEmail = user?.email;
  if (!userEmail) throw new Error("Нэвтэрнэ үү");
  const ref = collection(db, "saved_listings");
  const docRef = await addDoc(ref, {
    listing_id: listingId,
    created_by: userEmail,
    created_date: Timestamp.now(),
  });
  return { id: docRef.id, listing_id: listingId, created_by: userEmail };
}

export async function removeSaved(savedDocId) {
  await deleteDoc(doc(db, "saved_listings", savedDocId));
}

/** saved + listing мэдээлэл нэгтгэсэн жагсаалт (MySQL-аас устсан зарын хадгалалтыг 404 үед устгана) */
export async function getSavedListingsWithDetails(email) {
  const saved = await getSavedForUser(email);
  const rows = await Promise.all(
    saved.map(async (s) => {
      const { listing, httpStatus } = await fetchListingByIdResult(s.listing_id);
      if (!listing && httpStatus === 404) {
        try {
          await deleteDoc(doc(db, "saved_listings", s.id));
        } catch {
          /* ignore */
        }
        return null;
      }
      return listing ? { savedId: s.id, listing } : null;
    })
  );
  return rows.filter(Boolean);
}

/** Нэг зар хадгалагдсан эсэх (Firestore saved_listings document id) */
export async function findSavedDocId(email, listingId) {
  if (!email || !listingId) return null;
  const want = String(listingId);
  const saved = await getSavedForUser(email);
  const row = saved.find((s) => String(s.listing_id ?? "") === want);
  return row?.id || null;
}
