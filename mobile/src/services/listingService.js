import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { toDate } from "../utils/firestoreDates";

const TYPE_ORDER = { vip: 0, featured: 1, regular: 2 };

function normalizeListing(docItem) {
  const data = docItem.data();
  return {
    id: docItem.id,
    ...data,
    created_date: toDate(data.created_date) || data.created_date,
    updated_date: toDate(data.updated_date) || data.updated_date,
    listing_type_expires: data.listing_type_expires
      ? toDate(data.listing_type_expires) || data.listing_type_expires
      : undefined,
  };
}

function applyListingTypeExpiry(listing) {
  if (listing.listing_type === "regular" || !listing.listing_type_expires) return listing;
  const exp = toDate(listing.listing_type_expires);
  if (exp && exp < new Date()) {
    return { ...listing, listing_type: "regular" };
  }
  return listing;
}

function sortHomeListings(listings) {
  const adjusted = listings.map(applyListingTypeExpiry);
  return [...adjusted].sort((a, b) => {
    const ao = TYPE_ORDER[a.listing_type] ?? 2;
    const bo = TYPE_ORDER[b.listing_type] ?? 2;
    if (ao !== bo) return ao - bo;
    const da = toDate(a.created_date);
    const db = toDate(b.created_date);
    return (db?.getTime() || 0) - (da?.getTime() || 0);
  });
}

export async function getLatestListings(limitCount = 50) {
  const listingsRef = collection(db, "listings");
  const q = query(
    listingsRef,
    where("status", "==", "active"),
    orderBy("created_date", "desc"),
    limit(Math.min(limitCount, 100))
  );

  const snapshot = await getDocs(q);
  const rows = snapshot.docs.map(normalizeListing);
  return sortHomeListings(rows);
}

export async function getListingsByCreator(email, limitCount = 50) {
  if (!email) return [];
  const listingsRef = collection(db, "listings");
  const q = query(
    listingsRef,
    where("created_by", "==", email),
    orderBy("created_date", "desc"),
    limit(Math.min(limitCount, 100))
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(normalizeListing);
}

export async function getListingById(id) {
  if (!id) return null;
  const ref = doc(db, "listings", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return normalizeListing(snap);
}

export async function createListing(data) {
  const { auth } = await import("../config/firebase");
  const userEmail = data.created_by || auth.currentUser?.email || "";
  if (!userEmail) {
    throw new Error("Нэвтэрнэ үү.");
  }
  const listingsRef = collection(db, "listings");
  const listingData = {
    ...data,
    created_by: userEmail,
    created_date: Timestamp.now(),
    updated_date: Timestamp.now(),
    views: 0,
    status: data.status || "pending",
    listing_type: data.listing_type || "regular",
  };
  const docRef = await addDoc(listingsRef, listingData);
  return { id: docRef.id, ...listingData };
}

export async function deleteListing(id) {
  if (!id) throw new Error("ID шаардлагатай.");
  const ref = doc(db, "listings", id);
  await deleteDoc(ref);
}
