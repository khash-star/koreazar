/** Statuses written by create/admin flows. Used when `status=all` returns nothing. */
export const OWNED_LISTING_STATUSES = ['active', 'pending', 'sold', 'rejected'];

/**
 * Query params for one page of the signed-in user's MySQL listings.
 * Do not add country_code or region_code: those filters hide KR+region and
 * out-of-scope US rows that still hold public contact details.
 */
export function ownedListingQueryParams(firebaseUid, status, limit) {
  const uid = String(firebaseUid || '').trim();
  const size = Math.min(100, Math.max(1, Number(limit) || 100));
  return {
    firebase_uid: uid,
    status: String(status || 'all'),
    limit: String(size),
  };
}

async function loadOwnedPage(listByStatus, pageSize) {
  const allRows = await listByStatus({ status: 'all', limit: pageSize });
  if (Array.isArray(allRows) && allRows.length > 0) return allRows;

  const seen = new Set();
  const merged = [];
  for (const status of OWNED_LISTING_STATUSES) {
    const part = await listByStatus({ status, limit: pageSize });
    if (!Array.isArray(part)) continue;
    for (const row of part) {
      const id = row?.id != null ? String(row.id) : '';
      if (!id || seen.has(id)) continue;
      seen.add(id);
      merged.push(row);
    }
  }
  return merged;
}

/**
 * Delete every MySQL listing owned by this Firebase uid.
 * Aborts if a returned row is owned by someone else, so a dropped
 * firebase_uid filter cannot wipe the public feed.
 *
 * @param {{ firebaseUid: string, listByStatus: Function, deleteById: Function, pageSize?: number, maxPages?: number }} args
 * @returns {Promise<{ deleted: number }>}
 */
export async function purgeOwnedMysqlListings({
  firebaseUid,
  listByStatus,
  deleteById,
  pageSize = 100,
  maxPages = 50,
}) {
  const uid = String(firebaseUid || '').trim();
  if (!uid) throw new Error('Нэвтэрсэн хэрэглэгч олдсонгүй');
  if (typeof listByStatus !== 'function' || typeof deleteById !== 'function') {
    throw new Error('Бүртгэл устгах явцад зарыг устгаж чадсангүй. Дахин оролдоно уу.');
  }

  const size = Math.min(100, Math.max(1, Number(pageSize) || 100));
  const pages = Math.max(1, Number(maxPages) || 50);
  let deleted = 0;

  for (let page = 0; page < pages; page += 1) {
    const rows = await loadOwnedPage(listByStatus, size);
    if (rows.length === 0) return { deleted };

    for (const row of rows) {
      const id = row?.id != null ? String(row.id) : '';
      const owner = row?.firebase_uid != null ? String(row.firebase_uid) : '';
      if (!id || owner !== uid) {
        throw new Error('Бүртгэл устгах явцад зарыг устгаж чадсангүй. Дахин оролдоно уу.');
      }
      try {
        await deleteById(id);
      } catch (error) {
        if (error?.status !== 404) throw error;
      }
      deleted += 1;
    }
  }

  const leftover = await loadOwnedPage(listByStatus, size);
  if (leftover.length > 0) {
    throw new Error('Бүртгэл устгах явцад зарыг устгаж чадсангүй. Дахин оролдоно уу.');
  }
  return { deleted };
}
