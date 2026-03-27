import { auth } from "../config/firebase";
import { toDate } from "../utils/firestoreDates";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "https://api.zarkorea.com/index.php";
const TYPE_ORDER = { vip: 0, featured: 1, regular: 2 };

function buildApiUrl(action, params = {}) {
  const url = new URL(API_BASE_URL);
  url.searchParams.set("action", action);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      url.searchParams.set(k, String(v));
    }
  });
  return url.toString();
}

async function requestJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = payload?.message || payload?.error || `HTTP ${res.status}`;
    throw new Error(message);
  }
  return payload;
}

async function getAuthHeaders() {
  const user = auth.currentUser;
  if (!user) throw new Error("Хэрэглэгч нэвтрээгүй байна");
  const token = await user.getIdToken(true);
  return { Authorization: `Bearer ${token}` };
}

function normalizeImages(images) {
  if (Array.isArray(images)) return images;
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeListing(item) {
  if (!item || typeof item !== "object") return null;
  const cid = item.customer_id;
  return {
    ...item,
    id: item?.id != null ? String(item.id) : "",
    customer_id: cid != null && cid !== "" ? Number(cid) : undefined,
    images: normalizeImages(item.images),
    created_date: toDate(item.created_date) || item.created_date,
    updated_date: toDate(item.updated_date) || item.updated_date,
    listing_type_expires: item.listing_type_expires
      ? toDate(item.listing_type_expires) || item.listing_type_expires
      : undefined,
  };
}

function applyListingTypeExpiry(listing) {
  if (listing.listing_type === "regular" || !listing.listing_type_expires) return listing;
  const exp = toDate(listing.listing_type_expires);
  if (exp && exp < new Date()) return { ...listing, listing_type: "regular" };
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
  const payload = await requestJson(
    buildApiUrl("listings", { status: "active", limit: Math.min(limitCount, 100) })
  );
  const rows = (payload?.data || []).map(normalizeListing).filter(Boolean);
  return sortHomeListings(rows);
}

export async function getListingsByCreator(email, limitCount = 50) {
  if (!email) return [];
  const payload = await requestJson(
    buildApiUrl("listings", { created_by: email, limit: Math.min(limitCount, 100) })
  );
  return (payload?.data || []).map(normalizeListing).filter(Boolean);
}

/** MySQL users.id (customer_id) — шүүх: GET listings&customer_id= */
export async function getListingsByCustomerId(customerId, limitCount = 50) {
  if (customerId == null || customerId === "") return [];
  const payload = await requestJson(
    buildApiUrl("listings", {
      customer_id: String(customerId),
      limit: Math.min(limitCount, 100),
    })
  );
  return (payload?.data || []).map(normalizeListing).filter(Boolean);
}

export async function getListingById(id) {
  if (!id) return null;
  try {
    const payload = await requestJson(buildApiUrl("listing", { id }));
    return normalizeListing(payload?.data);
  } catch {
    return null;
  }
}

export async function createListing(data) {
  const headers = await getAuthHeaders();
  const payload = await requestJson(buildApiUrl("listings"), {
    method: "POST",
    headers,
    body: JSON.stringify({
      ...data,
      status: data.status || "pending",
      listing_type: data.listing_type || "regular",
    }),
  });
  return normalizeListing(payload?.data || {});
}

export async function updateListing(id, data) {
  if (!id) throw new Error("ID шаардлагатай.");
  const headers = await getAuthHeaders();
  await requestJson(buildApiUrl("listing", { id }), {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });
}

export async function deleteListing(id) {
  if (!id) throw new Error("ID шаардлагатай.");
  const headers = await getAuthHeaders();
  await requestJson(buildApiUrl("listing", { id }), {
    method: "DELETE",
    headers,
  });
}

export async function getPendingListingsCount() {
  const payload = await requestJson(buildApiUrl("listings", { status: "pending", limit: 500 }));
  return (payload?.data || []).length;
}

export async function getPendingListings(limitCount = 100) {
  const payload = await requestJson(
    buildApiUrl("listings", { status: "pending", limit: Math.min(limitCount, 200) })
  );
  return (payload?.data || []).map(normalizeListing).filter(Boolean);
}
