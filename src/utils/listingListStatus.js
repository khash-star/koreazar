/**
 * Status query for GET ?action=listings.
 * The API treats a missing status as `active`, so owner queries must send
 * `all` or pending/sold/rejected rows never come back.
 *
 * @param {Record<string, unknown>} filters
 * @returns {string}
 */
export function resolveListingsStatusParam(filters = {}) {
  const explicit = filters.status;
  if (explicit !== undefined && explicit !== null && String(explicit).trim() !== '') {
    return String(explicit);
  }

  const createdBy = String(filters.created_by || '').trim();
  const firebaseUid = String(filters.firebase_uid || '').trim();
  const customerId = Number(filters.customer_id);
  const hasCustomer = Number.isFinite(customerId) && customerId > 0;

  if (createdBy || firebaseUid || hasCustomer) {
    return 'all';
  }
  return 'active';
}
