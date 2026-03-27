import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
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

export async function listBannerAds() {
  const ref = collection(db, "banner_ads");
  const snap = await getDocs(ref);
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  rows.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  return rows;
}

export async function createBannerAd(data) {
  const ref = collection(db, "banner_ads");
  const payload = {
    image_url: data.image_url || "",
    link: data.link || "#",
    title: data.title || "",
    is_active: data.is_active !== false,
    order: Number(data.order) || 0,
  };
  const created = await addDoc(ref, payload);
  return { id: created.id, ...payload };
}

export async function updateBannerAd(id, data) {
  const ref = doc(db, "banner_ads", String(id));
  await updateDoc(ref, data);
}

export async function deleteBannerAd(id) {
  const ref = doc(db, "banner_ads", String(id));
  await deleteDoc(ref);
}
