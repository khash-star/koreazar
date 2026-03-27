import { auth } from "../config/firebase";
import { toDate } from "../utils/firestoreDates";
import { buildApiUrl, requestJson } from "./apiClient";

const TYPE_ORDER = { vip: 0, featured: 1, regular: 2 };
const LATEST_CACHE_TTL_MS = 15000;
let latestListingsCache = { at: 0, key: "", data: null, pending: null };

async function getAuthHeaders() {
  const user = auth.currentUser;
  if (!user) throw new Error("Хэрэглэгч нэвтрээгүй байна");
  const token = await user.getIdToken();
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
  const safeLimit = Math.min(limitCount, 100);
  const cacheKey = `active:${safeLimit}`;
  const now = Date.now();
  if (
    latestListingsCache.data &&
    latestListingsCache.key === cacheKey &&
    now - latestListingsCache.at < LATEST_CACHE_TTL_MS
  ) {
    return latestListingsCache.data;
  }
  if (latestListingsCache.pending && latestListingsCache.key === cacheKey) {
    return latestListingsCache.pending;
  }
  latestListingsCache.key = cacheKey;
  latestListingsCache.pending = (async () => {
    const payload = await requestJson(buildApiUrl("listings", { status: "active", limit: safeLimit }), {
      retries: 1,
    });
    const rows = (payload?.data || []).map(normalizeListing).filter(Boolean);
    const sorted = sortHomeListings(rows);
    latestListingsCache = { at: Date.now(), key: cacheKey, data: sorted, pending: null };
    return sorted;
  })();
  try {
    return await latestListingsCache.pending;
  } catch (e) {
    latestListingsCache.pending = null;
    throw e;
  }
}

export async function getListingsByCreator(email, limitCount = 50) {
  if (!email) return [];
  const payload = await requestJson(
    buildApiUrl("listings", { created_by: email, limit: Math.min(limitCount, 100) }),
    { retries: 1 }
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
    }),
    { retries: 1 }
  );
  return (payload?.data || []).map(normalizeListing).filter(Boolean);
}

export async function getListingById(id) {
  if (!id) return null;
  try {
    const payload = await requestJson(buildApiUrl("listing", { id }), { retries: 1 });
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
  const payload = await requestJson(buildApiUrl("listings", { status: "pending", limit: 500 }), {
    retries: 1,
  });
  return (payload?.data || []).length;
}

export async function getPendingListings(limitCount = 100) {
  const payload = await requestJson(
    buildApiUrl("listings", { status: "pending", limit: Math.min(limitCount, 200) }),
    { retries: 1 }
  );
  return (payload?.data || []).map(normalizeListing).filter(Boolean);
}
