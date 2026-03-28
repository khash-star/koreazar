/** Firebase / Firestore query-д имэйлийг нэг хэлбэрт оруулах (mobile/utils/emailNormalize.js-тай ижил) */
export function normalizeEmail(e) {
  return String(e || '').trim().toLowerCase();
}
