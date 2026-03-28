// Listing Service - PHP MySQL API CRUD operations
import { auth } from '@/firebase/config';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.zarkorea.com/index.php';

/** MySQL зарын ID — буруу id ?action=listing дуудахад API 400 */
export function parseMysqlListingId(raw) {
  if (raw == null || raw === '') return null;
  const n = Number.parseInt(String(raw).trim(), 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return String(n);
}

const buildApiUrl = (action, params = {}) => {
  const url = new URL(API_BASE_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, String(v));
    }
  });
  return url.toString();
};

const requestJson = async (url, options = {}) => {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = payload?.message || payload?.error || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return payload;
};

const getAuthHeaders = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Хэрэглэгч нэвтрээгүй байна');
  }
  const token = await user.getIdToken(true);
  return { Authorization: `Bearer ${token}` };
};

const normalizeListing = (item) => {
  if (!item || typeof item !== 'object') return null;
  const cid = item.customer_id;
  return {
    ...item,
    id: item?.id != null ? String(item.id) : '',
    customer_id: cid != null && cid !== '' ? Number(cid) : undefined,
    images: Array.isArray(item.images) ? item.images : [],
  };
};

/**
 * Бүх listings-ийг авах
 * @param {string} orderByField - Order by field (default: 'created_date')
 * @param {number} limitCount - Limit count (default: 100)
 * @returns {Promise<Array>} Listings array
 */
export const listListings = async (orderByField = 'created_date', limitCount = 100) => {
  try {
    const orderDirection = orderByField.startsWith('-') ? 'desc' : 'asc';
    const payload = await requestJson(buildApiUrl('listings', {
      limit: limitCount,
      status: 'active',
    }));
    const result = (payload?.data || []).map(normalizeListing);
    // API currently returns created_at desc. Keep compatibility for asc requests.
    if (orderDirection === 'asc') {
      return [...result].reverse();
    }
    return result;
  } catch (error) {
    console.error('Error listing listings:', error);
    throw error;
  }
};

/**
 * Listing filter хийх
 * @param {Object} filters - Filter object
 * @param {string} orderByField - Order by field (default: 'created_date')
 * @param {number} limitCount - Limit count (default: 100)
 * @returns {Promise<Array>} Filtered listings
 */
export const filterListings = async (filters = {}, orderByField = '-created_date', limitCount = 100) => {
  try {
    const orderDirection = orderByField.startsWith('-') ? 'desc' : 'asc';
    const params = { limit: limitCount };
    if (filters.category) params.category = filters.category;
    if (filters.subcategory) params.subcategory = filters.subcategory;
    if (filters.customer_id != null && filters.customer_id !== '') {
      params.customer_id = String(filters.customer_id);
    }
    if (filters.status !== undefined && filters.status !== null && filters.status !== '') {
      params.status = filters.status;
    } else if (!filters.created_by) {
      params.status = 'active';
    }

    const payload = await requestJson(buildApiUrl('listings', params));
    let result = (payload?.data || []).map(normalizeListing);

    // Server-side currently supports category/subcategory/status. Apply the rest client-side.
    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      if (value === undefined || value === null || value === '') return;
      if (key === 'category' || key === 'subcategory' || key === 'status') return;
      result = result.filter((item) => String(item?.[key] ?? '') === String(value));
    });

    if (orderDirection === 'asc') {
      result = [...result].reverse();
    }
    return result.slice(0, limitCount);
  } catch (error) {
    console.error('Error filtering listings:', error);
    throw error;
  }
};

/**
 * Listing үүсгэх
 * @param {Object} data - Listing data
 * @returns {Promise<Object>} Created listing with ID
 */
export const createListing = async (data) => {
  try {
    const headers = await getAuthHeaders();
    const payload = await requestJson(buildApiUrl('listings'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...data,
        status: data.status || 'pending',
        listing_type: data.listing_type || 'regular',
      }),
    });
    return normalizeListing(payload?.data || {});
  } catch (error) {
    console.error('Error creating listing:', error);
    throw error;
  }
};

/**
 * Listing шинэчлэх
 * @param {string} id - Listing ID
 * @param {Object} data - Update data
 * @returns {Promise<void>}
 */
export const updateListing = async (id, data) => {
  try {
    const mysqlId = parseMysqlListingId(id);
    if (!mysqlId) throw new Error('Зарын ID буруу байна.');
    const headers = await getAuthHeaders();
    await requestJson(buildApiUrl('listing', { id: mysqlId }), {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('Error updating listing:', error);
    throw error;
  }
};

/**
 * Listing устгах
 * @param {string} id - Listing ID
 * @returns {Promise<void>}
 */
export const deleteListing = async (id) => {
  try {
    const mysqlId = parseMysqlListingId(id);
    if (!mysqlId) throw new Error('Зарын ID буруу байна.');
    const headers = await getAuthHeaders();
    await requestJson(buildApiUrl('listing', { id: mysqlId }), {
      method: 'DELETE',
      headers,
    });
  } catch (error) {
    console.error('Error deleting listing:', error);
    throw error;
  }
};

/**
 * Нэг зар — HTTP статустай (хадгалсан зарын 404 цэвэрлэхэд)
 * @returns {{ listing: Object|null, httpStatus?: number }}
 */
export const fetchListingByIdResult = async (id) => {
  const mysqlId = parseMysqlListingId(id);
  if (!mysqlId) return { listing: null };
  try {
    const payload = await requestJson(buildApiUrl('listing', { id: mysqlId }));
    return { listing: normalizeListing(payload?.data) };
  } catch (e) {
    const st = typeof e?.status === 'number' ? e.status : undefined;
    return { listing: null, httpStatus: st };
  }
};

/**
 * Нэг listing-ийг авах
 * @param {string} id - Listing ID
 * @returns {Promise<Object | null>} Listing object or null
 */
export const getListing = async (id) => {
  const { listing } = await fetchListingByIdResult(id);
  if (!listing) return null;
  return listing;
};

