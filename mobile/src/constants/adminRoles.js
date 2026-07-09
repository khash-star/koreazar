/**
 * AUTO-GENERATED – do not edit by hand.
 * Source: src/constants/adminRoles.js
 * Regenerate: npm run sync-admin-roles (from repo root)
 */

export const ROLES = {
  USER: 'user',
  /** @deprecated Use super_admin; kept for backward compatibility */
  LEGACY_SUPER: 'admin',
  SUPER_ADMIN: 'super_admin',
  COUNTRY_ADMIN: 'country_admin',
  REGION_ADMIN: 'region_admin',
};

export const ADMIN_ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super admin',
  [ROLES.COUNTRY_ADMIN]: 'Country admin',
  [ROLES.REGION_ADMIN]: 'Region admin',
  [ROLES.LEGACY_SUPER]: 'Super admin',
};

/** @param {string|undefined|null} role */
export function normalizeAdminRole(role) {
  const r = String(role || '').trim().toLowerCase();
  if (r === ROLES.LEGACY_SUPER) return ROLES.SUPER_ADMIN;
  return r || ROLES.USER;
}

/** @param {Record<string, unknown>|null|undefined} userData */
export function isSuperAdmin(userData) {
  return normalizeAdminRole(userData?.role) === ROLES.SUPER_ADMIN;
}

/** @param {Record<string, unknown>|null|undefined} userData */
export function isAppAdmin(userData) {
  const role = normalizeAdminRole(userData?.role);
  return (
    role === ROLES.SUPER_ADMIN ||
    role === ROLES.COUNTRY_ADMIN ||
    role === ROLES.REGION_ADMIN
  );
}

/**
 * @param {Record<string, unknown>|null|undefined} userData
 * @returns {{ role: string, countryCode: string|null, regionCode: string|null }}
 */
export function getAdminScope(userData) {
  if (!isAppAdmin(userData)) {
    return { role: ROLES.USER, countryCode: null, regionCode: null };
  }
  const role = normalizeAdminRole(userData?.role);
  const countryCode = userData?.admin_country_code
    ? String(userData.admin_country_code).trim().toUpperCase()
    : null;
  const regionCode = userData?.admin_region_code
    ? String(userData.admin_region_code).trim().toLowerCase()
    : null;
  return { role, countryCode, regionCode };
}

/** @param {string|undefined} role */
export function getAdminRoleLabel(role) {
  const normalized = normalizeAdminRole(role);
  return ADMIN_ROLE_LABELS[normalized] || normalized;
}

/** @param {Record<string, unknown>|null|undefined} listing */
export function listingCountryCode(listing) {
  return String(listing?.country_code || 'KR').trim().toUpperCase() || 'KR';
}

/** @param {Record<string, unknown>|null|undefined} listing */
export function listingRegionCode(listing) {
  const code = listing?.region_code;
  return code ? String(code).trim().toLowerCase() : '';
}

/** @param {Record<string, unknown>|null|undefined} banner */
export function bannerCountryCode(banner) {
  return String(banner?.country_code || 'KR').trim().toUpperCase() || 'KR';
}

/** @param {Record<string, unknown>|null|undefined} userData @param {Record<string, unknown>|null|undefined} listing */
export function listingMatchesAdminScope(userData, listing) {
  if (!isAppAdmin(userData)) return false;
  const scope = getAdminScope(userData);
  if (scope.role === ROLES.SUPER_ADMIN) return true;

  const lc = listingCountryCode(listing);
  const lr = listingRegionCode(listing);

  if (scope.role === ROLES.COUNTRY_ADMIN) {
    return Boolean(scope.countryCode && lc === scope.countryCode);
  }
  if (scope.role === ROLES.REGION_ADMIN) {
    return Boolean(scope.regionCode && lc === 'US' && lr === scope.regionCode);
  }
  return false;
}

/** @param {Record<string, unknown>|null|undefined} userData @param {Record<string, unknown>|null|undefined} banner */
export function bannerMatchesAdminScope(userData, banner) {
  if (!isAppAdmin(userData)) return false;
  const scope = getAdminScope(userData);
  if (scope.role === ROLES.SUPER_ADMIN) return true;

  const bc = bannerCountryCode(banner);
  if (scope.role === ROLES.COUNTRY_ADMIN) {
    return Boolean(scope.countryCode && bc === scope.countryCode);
  }
  if (scope.role === ROLES.REGION_ADMIN) {
    return bc === 'US';
  }
  return false;
}

/**
 * API listing query params for admin screens.
 * @param {Record<string, unknown>|null|undefined} userData
 * @param {Record<string, string|number|undefined>} [params]
 */
export function appendAdminListingQueryParams(userData, params = {}) {
  const scope = getAdminScope(userData);
  if (scope.role === ROLES.SUPER_ADMIN) return { ...params };

  if (scope.role === ROLES.COUNTRY_ADMIN && scope.countryCode) {
    const next = { ...params, country_code: scope.countryCode };
    if (scope.countryCode !== 'US' && scope.regionCode) {
      next.region_code = scope.regionCode;
    }
    return next;
  }

  if (scope.role === ROLES.REGION_ADMIN) {
    const next = { ...params, country_code: 'US' };
    if (scope.regionCode) next.region_code = scope.regionCode;
    return next;
  }

  return { ...params };
}

/** Super + country admins can search/block users; region admins cannot. */
export function canManageUsers(userData) {
  const scope = getAdminScope(userData);
  return scope.role === ROLES.SUPER_ADMIN || scope.role === ROLES.COUNTRY_ADMIN;
}

/** Super + country admins can broadcast; region admins cannot. */
export function canBroadcast(userData) {
  return canManageUsers(userData);
}

/** Global config (auto-approve, etc.) — super admin only. */
export function canManageGlobalConfig(userData) {
  return isSuperAdmin(userData);
}

/** @param {Record<string, unknown>|null|undefined} userData */
export function isProtectedAdminAccount(userData) {
  return isAppAdmin(userData);
}

/**
 * Whether actor may block/delete target user.
 * @param {Record<string, unknown>|null|undefined} actor
 * @param {Record<string, unknown>|null|undefined} target
 */
export function canModerateUser(actor, target) {
  if (!canManageUsers(actor)) return false;
  if (!target || actor?.uid === target.uid || actor?.id === target.id) return false;
  if (isSuperAdmin(actor)) return true;
  if (isSuperAdmin(target) || isAppAdmin(target)) return false;
  return true;
}

/** @param {Record<string, unknown>|null|undefined} userData @param {Array<Record<string, unknown>>} listings */
export function filterListingsByAdminScope(userData, listings) {
  if (!Array.isArray(listings)) return [];
  if (isSuperAdmin(userData)) return listings;
  return listings.filter((item) => listingMatchesAdminScope(userData, item));
}

/** Super admin only — assign or revoke scoped admin roles. */
export function canAssignAdminRole(actor, targetUid) {
  if (!isSuperAdmin(actor)) return false;
  if (!targetUid) return false;
  if (actor?.uid === targetUid) return false;
  return true;
}

/**
 * @param {{ role: string, adminCountryCode?: string, adminRegionCode?: string }} input
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function validateAdminRoleAssignment(input) {
  const role = String(input?.role || ROLES.USER).trim().toLowerCase();
  if (role === ROLES.USER) return { ok: true };

  if (role === ROLES.LEGACY_SUPER || role === ROLES.SUPER_ADMIN) return { ok: true };

  if (role === ROLES.COUNTRY_ADMIN) {
    const cc = String(input?.adminCountryCode || '').trim().toUpperCase();
    if (!cc || !['KR', 'US', 'JP'].includes(cc)) {
      return { ok: false, error: 'Country admin requires admin_country_code (KR, US, or JP)' };
    }
    return { ok: true };
  }

  if (role === ROLES.REGION_ADMIN) {
    const region = String(input?.adminRegionCode || '').trim().toLowerCase();
    if (!region) {
      return { ok: false, error: 'Region admin requires admin_region_code' };
    }
    return { ok: true };
  }

  return { ok: false, error: 'Unknown admin role' };
}

/** UI options for super-admin role picker (web AdminPanel). */
export const SUPER_ADMIN_ASSIGNABLE_ROLES = [
  { value: ROLES.USER, label: 'Хэрэглэгч (admin эрхгүй)' },
  { value: ROLES.REGION_ADMIN, label: 'Region admin (US region)' },
  { value: ROLES.COUNTRY_ADMIN, label: 'Country admin' },
  { value: ROLES.LEGACY_SUPER, label: 'Super admin (бүх эрх)' },
];

export const ASSIGNABLE_COUNTRY_CODES = ['KR', 'US', 'JP'];

/** @param {Record<string, unknown>|null|undefined} userData @param {Array<Record<string, unknown>>} banners */
export function filterBannersByAdminScope(userData, banners) {
  if (!Array.isArray(banners)) return [];
  if (isSuperAdmin(userData)) return banners;
  return banners.filter((item) => bannerMatchesAdminScope(userData, item));
}
