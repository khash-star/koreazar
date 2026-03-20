import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Идэвхтэй баннерууд — вэбийн BannerAd.filter({ is_active: true })-тай ижил.
 * orderBy-гүй (composite index шаардлагагүй), client-side эрэмбэ.
 */
export async function getActiveBannerAds() {
  const ref = collection(db, "banner_ads");
  const q = query(ref, where("is_active", "==", true));
  const snap = await getDocs(q);
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  rows.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  return rows;
}
