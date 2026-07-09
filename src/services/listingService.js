// Listing Service - PHP MySQL API CRUD operations
import { auth } from '@/firebase/config';
import { appendUsRegionScopeParams } from '@/utils/usRegionScope';
import { appendAdminListingQueryParams } from '@/constants/adminRoles';

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

/** API allows unauthenticated PATCH when body is only views = existing + 1 (see api/index.php). */
function isViewCountOnlyBump(data) {
  if (!data || typeof data !== 'object') return false;
  const keys = Object.keys(data);
  return keys.length === 1 && keys[0] === 'views' && Number.isFinite(Number(data.views));
}

const normalizeListing = (item) => {
  if (!item || typeof item !== 'object') return null;
  const cid = item.customer_id;
  const countryCode = String(item.country_code || 'KR').trim().toUpperCase() || 'KR';
  return {
    ...item,
    id: item?.id != null ? String(item.id) : '',
    customer_id: cid != null && cid !== '' ? Number(cid) : undefined,
    country_code: countryCode,
    state_code: item.state_code ? String(item.state_code).trim().toUpperCase() : null,
    region_code: item.region_code ? String(item.region_code).trim().toLowerCase() : null,
    images: Array.isArray(item.images) ? item.images : [],
  };
};

/**
 * Бүх listings-ийг авах
 * @param {string} orderByField - Order by field (default: 'created_date')
 * @param {number} limitCount - Limit count (default: 100)
 * @returns {Promise<Array>} Listings array
 */
export const listListings = async (orderByField = 'created_date', limitCount = 100, options = {}) => {
  if (options.adminUserData) {
    return filterListings({}, `-${orderByField}`, limitCount, options);
  }
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
export const filterListings = async (filters = {}, orderByField = '-created_date', limitCount = 100, options = {}) => {
  try {
    const orderDirection = orderByField.startsWith('-') ? 'desc' : 'asc';
    let scopedFilters = { ...filters };
    if (options.adminUserData) {
      scopedFilters = appendAdminListingQueryParams(options.adminUserData, scopedFilters);
    }
    const params = appendUsRegionScopeParams({ limit: limitCount }, scopedFilters.country_code);
    if (scopedFilters.category) params.category = scopedFilters.category;
    if (scopedFilters.subcategory) params.subcategory = scopedFilters.subcategory;
    if (scopedFilters.country_code) params.country_code = scopedFilters.country_code;
    if (scopedFilters.state_code) params.state_code = scopedFilters.state_code;
    if (scopedFilters.region_code) params.region_code = scopedFilters.region_code;
    if (scopedFilters.customer_id != null && scopedFilters.customer_id !== '') {
      params.customer_id = String(scopedFilters.customer_id);
    }
    if (scopedFilters.status !== undefined && scopedFilters.status !== null && scopedFilters.status !== '') {
      params.status = scopedFilters.status;
    } else if (!scopedFilters.created_by) {
      params.status = 'active';
    }

    const fetchOptions = options.adminUserData ? { headers: await getAuthHeaders() } : {};
    const payload = await requestJson(buildApiUrl('listings', params), fetchOptions);
    let result = (payload?.data || []).map(normalizeListing);

    // Server-side: category/subcategory/status/country_code/state_code. Rest client-side.
    const serverFilterKeys = new Set([
      'category',
      'subcategory',
      'status',
      'country_code',
      'state_code',
      'region_code',
    ]);
    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      if (value === undefined || value === null || value === '') return;
      if (serverFilterKeys.has(key)) return;
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
    const headers = isViewCountOnlyBump(data)
      ? {}
      : await getAuthHeaders();
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

