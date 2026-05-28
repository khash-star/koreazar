/** Firebase / Firestore query-д имэйлийг нэг хэлбэрт оруулах (mobile/utils/emailNormalize.js-тай ижил) */
export function normalizeEmail(e) {
  return String(e || '').trim().toLowerCase();
}

/** Утасны нэвтрэлтэд зар/saved_listings created_by тогтвортой байх синтетик имэйл */
export function phoneToAuthEmail(phoneE164) {
  const digits = String(phoneE164 || '').replace(/[^\d]/g, '');
  if (!digits) return '';
  return `phone_${digits}@phone.zarkorea.com`;
}

/** Утасны нэвтрэлтийн дотоод синтетик имэйл эсэх (UI дээр харуулахгүй) */
export function isSyntheticPhoneAuthEmail(email) {
  const e = normalizeEmail(email);
  return /^phone_\d+@phone\.zarkorea\.com$/.test(e);
}
