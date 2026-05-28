/**
 * Профайл / форм дээр утасны дугаар шалгах, E.164 болгох
 * @returns {{ valid: boolean, value?: string, message?: string }}
 */
export function normalizeProfilePhone(raw) {
  const v = String(raw || '').trim().replace(/[\s-]/g, '');
  if (!v) return { valid: true, value: '' };

  if (v.startsWith('+')) {
    const e164 = `+${v.slice(1).replace(/[^\d]/g, '')}`;
    if (!/^\+\d{8,15}$/.test(e164)) {
      return { valid: false, message: 'Утасны дугаар буруу форматтай байна (+821012345678).' };
    }
    return { valid: true, value: e164 };
  }

  let digits = v.replace(/[^\d]/g, '');
  if (digits.startsWith('0')) {
    digits = digits.replace(/^0+/, '');
  }
  if (!/^\d+$/.test(digits)) {
    return { valid: false, message: 'Утасны дугаар зөвхөн тоо байх ёстой.' };
  }
  if (digits.length < 8 || digits.length > 15) {
    return { valid: false, message: 'Утасны дугаар 8-15 оронтой байх ёстой.' };
  }
  return { valid: true, value: digits };
}
