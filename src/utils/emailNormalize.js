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

/** Phone synthetic email query variants (KR +82 prefix parity). */
export function emailQueryVariants(email) {
  const em = normalizeEmail(email);
  if (!em) return [];
  const out = new Set([em]);
  const m = em.match(/^phone_(\d+)@phone\.zarkorea\.com$/);
  if (m) {
    const digits = m[1];
    if (digits.startsWith('82') && digits.length > 10) {
      out.add(`phone_${digits.slice(2)}@phone.zarkorea.com`);
      out.add(normalizeEmail(phoneToAuthEmail(`+${digits}`)));
    } else if (!digits.startsWith('82') && digits.length >= 9) {
      out.add(`phone_82${digits}@phone.zarkorea.com`);
      out.add(normalizeEmail(phoneToAuthEmail(`+82${digits}`)));
    }
  }
  return [...out];
}

export function areEmailVariants(a, b) {
  const left = normalizeEmail(a);
  const right = normalizeEmail(b);
  if (!left || !right) return false;
  if (left === right) return true;
  const variants = new Set(emailQueryVariants(left));
  return variants.has(right);
}

export function emailsMatch(a, b) {
  return areEmailVariants(a, b);
}
