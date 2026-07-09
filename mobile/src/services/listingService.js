import { auth } from "../config/firebase";
import { getActiveMobileCountryCode, isUsMobileMarket } from "../config/country";
import { getActiveMobileRegionCode } from "../config/region.js";
import { toDate } from "../utils/firestoreDates";
import { buildApiUrl, requestJson } from "./apiClient";
import { filterListingsForMarket } from "../utils/listingCountry";

function buildMarketListingsParams(extra = {}) {
  const marketCode = getActiveMobileCountryCode();
  const params = { country_code: marketCode, ...extra };
  if (isUsMobileMarket()) {
    const regionCode = getActiveMobileRegionCode();
    if (regionCode) params.region_code = regionCode;
  }
  return params;
}

function marketListingsCacheKey(suffix) {
  const marketCode = getActiveMobileCountryCode();
  const regionCode = isUsMobileMarket() ? getActiveMobileRegionCode() : "";
  return `${suffix}:${marketCode}:${regionCode || "-"}`;
}

/** MySQL зарын primary key — буруу/хоосон id-ээр ?action=listing дуудахад API 400 өгнө */
export function parseMysqlListingId(raw) {
  if (raw == null || raw === "") return null;
  const n = Number.parseInt(String(raw).trim(), 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return String(n);
}
const LATEST_CACHE_TTL_MS = 15000;
const DETAIL_CACHE_TTL_MS = 120000;
/** Home feed sort — VIP first, then featured, then regular (matches web Home.jsx). */
const TYPE_ORDER = { vip: 0, featured: 1, regular: 2 };
let latestListingsCache = { at: 0, key: "", data: null, pending: null };
/** @type {Map<string, { at: number, data: object }>} */
const listingDetailCache = new Map();

export function invalidateLatestListingsCache() {
  latestListingsCache = { at: 0, key: "", data: null, pending: null };
}

export function peekListingDetailCache(id) {
  const mysqlId = parseMysqlListingId(id);
  if (!mysqlId) return null;
  const row = listingDetailCache.get(mysqlId);
  if (!row || Date.now() - row.at > DETAIL_CACHE_TTL_MS) {
    if (row) listingDetailCache.delete(mysqlId);
    return null;
  }
  return row.data;
}

function storeListingDetailCache(mysqlId, listing) {
  if (!mysqlId || !listing) return;
  listingDetailCache.set(mysqlId, { at: Date.now(), data: listing });
}

async function getAuthHeaders() {
  const user = auth.currentUser;
  if (!user) throw new Error("Хэрэглэгч нэвтрээгүй байна");
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

/** API allows unauthenticated PATCH when body is only views = existing + 1 (see api/index.php). */
function isViewCountOnlyBump(data) {
  if (!data || typeof data !== "object") return false;
  const keys = Object.keys(data);
  return keys.length === 1 && keys[0] === "views" && Number.isFinite(Number(data.views));
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
  const countryCode = String(item.country_code || "KR").trim().toUpperCase() || "KR";
  return {
    ...item,
    id: item?.id != null ? String(item.id) : "",
    customer_id: cid != null && cid !== "" ? Number(cid) : undefined,
    country_code: countryCode,
    state_code: item.state_code ? String(item.state_code).trim().toUpperCase() : null,
    region_code: item.region_code ? String(item.region_code).trim().toLowerCase() : null,
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
  const cacheKey = marketListingsCacheKey(`active:${safeLimit}`);
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
    const payload = await requestJson(
      buildApiUrl("listings", buildMarketListingsParams({ status: "active", limit: safeLimit })),
      { retries: 1 }
    );
    const rows = (payload?.data || []).map(normalizeListing).filter(Boolean);
    const sorted = sortHomeListings(filterListingsForMarket(rows, getActiveMobileCountryCode()));
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

/** Миний зарууд — pending/active/sold (хуучин API status=all буруу шүүдэг тул тус бүрээр татна). */
const MY_LISTING_STATUSES = ["active", "pending", "sold"];

async function requestListingsQuery(params, options = {}) {
  const { includeAllStatuses, ...fetchOpts } = options;
  const limit = Math.min(Number(params.limit) || 50, 100);

  if (!includeAllStatuses) {
    const payload = await requestJson(buildApiUrl("listings", { ...params, limit }), {
      retries: 1,
      ...fetchOpts,
    });
    const rows = (payload?.data || []).map(normalizeListing).filter(Boolean);
    if (params.country_code) {
      return filterListingsForMarket(rows, params.country_code);
    }
    return rows;
  }

  const seen = new Set();
  const merged = [];
  const add = (list) => {
    for (const item of list) {
      if (!item?.id || seen.has(item.id)) continue;
      seen.add(item.id);
      merged.push(item);
    }
  };

  // Шинэ API: status=all → бүх төлөв
  try {
    const all = await requestJson(
      buildApiUrl("listings", { ...params, limit, status: "all" }),
      { retries: 1, ...fetchOpts }
    );
    const rows = (all?.data || []).map(normalizeListing).filter(Boolean);
    if (rows.length > 0) return rows;
  } catch {
    /* хуучин API: status=all гэж бичихээр 0 мөр буцаадаг */
  }

  for (const status of MY_LISTING_STATUSES) {
    try {
      const payload = await requestJson(
        buildApiUrl("listings", { ...params, limit, status }),
        { retries: 1, ...fetchOpts }
      );
      add((payload?.data || []).map(normalizeListing).filter(Boolean));
    } catch {
      /* ignore */
    }
  }
  return merged;
}

export async function getListingsByCreator(email, limitCount = 50, options = {}) {
  if (!email) return [];
  return requestListingsQuery({ created_by: email, limit: limitCount }, options);
}

/** MySQL users.id (customer_id) — шүүх: GET listings&customer_id= */
export async function getListingsByCustomerId(customerId, limitCount = 50, options = {}) {
  if (customerId == null || customerId === "") return [];
  return requestListingsQuery(
    { customer_id: String(customerId), limit: limitCount },
    options
  );
}

/** Firebase UID — утасны нэвтрэлтэд created_by/email зөрөхөөс илүү найдвартай */
export async function getListingsByFirebaseUid(firebaseUid, limitCount = 50, options = {}) {
  if (!firebaseUid) return [];
  return requestListingsQuery({ firebase_uid: String(firebaseUid), limit: limitCount }, options);
}

/** Миний зарууд — uid + customerId + email (pending зарууд орно). */
export async function getMyListings(email, customerId, limitCount = 50, options = {}) {
  const opts = { includeAllStatuses: true, ...options };
  const firebaseUid = options.firebaseUid || auth.currentUser?.uid || "";
  const seen = new Set();
  const rows = [];
  let lastError = null;

  const merge = (list) => {
    for (const item of list) {
      if (!item?.id || seen.has(item.id)) continue;
      seen.add(item.id);
      rows.push(item);
    }
  };

  const tryMerge = async (label, fn) => {
    try {
      merge(await fn());
    } catch (e) {
      lastError = e;
      if (__DEV__) {
        console.warn(`getMyListings:${label}`, e?.message || e);
      }
    }
  };

  if (firebaseUid) {
    await tryMerge("firebase_uid", () => getListingsByFirebaseUid(firebaseUid, limitCount, opts));
  }

  const cid = customerId != null && customerId !== "" ? Number(customerId) : NaN;
  if (Number.isFinite(cid) && cid > 0) {
    await tryMerge("customer_id", () => getListingsByCustomerId(cid, limitCount, opts));
  }

  if (email) {
    await tryMerge("created_by", () => getListingsByCreator(email, limitCount, opts));
  }

  if (rows.length === 0 && lastError) {
    throw lastError;
  }

  rows.sort((a, b) => {
    const ta = new Date(a.created_date || a.created_at || 0).getTime();
    const tb = new Date(b.created_date || b.created_at || 0).getTime();
    return tb - ta;
  });
  return rows.slice(0, limitCount);
}

/**
 * @returns {{ listing: object|null, httpStatus?: number }} — 404-ийг saved_listings цэвэрлэхэд ашиглана
 */
export async function fetchListingByIdResult(id, options = {}) {
  const mysqlId = parseMysqlListingId(id);
  if (!mysqlId) return { listing: null };
  const bypassCache = Boolean(options.bypassCache);
  if (!bypassCache) {
    const cached = peekListingDetailCache(id);
    if (cached) return { listing: cached };
  }
  try {
    const payload = await requestJson(buildApiUrl("listing", { id: mysqlId }), { retries: 1 });
    const listing = normalizeListing(payload?.data);
    if (listing) storeListingDetailCache(mysqlId, listing);
    return { listing };
  } catch (e) {
    const st = typeof e?.status === "number" ? e.status : undefined;
    return { listing: null, httpStatus: st };
  }
}

export async function getListingById(id) {
  const { listing } = await fetchListingByIdResult(id);
  return listing;
}

export async function createListing(data, options = {}) {
  const headers = await getAuthHeaders();
  const payload = await requestJson(buildApiUrl("listings"), {
    method: "POST",
    headers,
    timeoutMs: 10000,
    ...options,
    body: JSON.stringify({
      ...data,
      status: data.status || "pending",
      listing_type: data.listing_type || "regular",
    }),
  });
  const row = normalizeListing(payload?.data || {});
  if (!row?.id) {
    throw new Error(
      typeof payload?.message === "string" && payload.message.trim()
        ? payload.message
        : "Зар үүсгэгдсэнгүй. Дахин оролдоно уу."
    );
  }
  return row;
}

export async function updateListing(id, data) {
  if (!id) throw new Error("ID шаардлагатай.");
  const headers = isViewCountOnlyBump(data) ? {} : await getAuthHeaders();
  await requestJson(buildApiUrl("listing", { id }), {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });
}

export async function deleteListing(id) {
  const mysqlId = parseMysqlListingId(id);
  if (!mysqlId) throw new Error("Зарын ID буруу байна.");
  const headers = await getAuthHeaders();
  await requestJson(buildApiUrl("listing", { id: mysqlId }), {
    method: "DELETE",
    headers,
  });
  invalidateLatestListingsCache();
  listingDetailCache.delete(mysqlId);
}

export async function getPendingListingsCount() {
  const payload = await requestJson(
    buildApiUrl("listings", buildMarketListingsParams({ status: "pending", limit: 500 })),
    { retries: 1 }
  );
  return (payload?.data || []).length;
}

/** Энгийн хэрэглэгч: өөрийн илгээсэн, баталгаажаагүй (pending) зарын тоо — апп icon badge-д. */
export async function getCreatorPendingListingsCount(email, customerId) {
  const cid = customerId != null && customerId !== "" ? String(customerId).trim() : "";
  const em = typeof email === "string" ? email.trim() : "";
  if (!cid && !em) return 0;
  const listings = cid
    ? await getListingsByCustomerId(cid, 80)
    : await getListingsByCreator(em, 80);
  return listings.filter((l) => l.status === "pending").length;
}

export async function getPendingListings(limitCount = 100) {
  const payload = await requestJson(
    buildApiUrl(
      "listings",
      buildMarketListingsParams({
        status: "pending",
        limit: Math.min(limitCount, 200),
      })
    ),
    { retries: 1 }
  );
  return (payload?.data || []).map(normalizeListing).filter(Boolean);
}
