/**
 * Хэрэглэгчийн контентод хориглосон түлхүүр үг / хэллэг.
 * Ижил жагсаалт: mobile/src/utils/bannedContent.js, api/banned_content.php
 */

const BANNED_PHRASES = [
  'child porn',
  'childporn',
  'underage sex',
  'cp video',
];

/** Нэг бүрийг word-boundary-аар шалгана (жишээ нь Sussex-д таарахгүй) */
const BANNED_WORDS = [
  'sex',
  'porn',
  'porno',
  'xxx',
  'nsfw',
  'nude',
  'nudes',
  'erotic',
  'escort',
  'prostitute',
  'prostitution',
  'cocaine',
  'heroin',
  'methamphetamine',
  'scam',
  'scammer',
  'scamming',
  'phishing',
];

const LISTING_STRING_KEYS = [
  'title',
  'description',
  'phone',
  'kakao_id',
  'wechat_id',
  'whatsapp',
  'facebook',
  'location',
  'subcategory',
  'vehicle_make',
  'vehicle_model',
  'electronics_brand',
  'electronics_model',
  'job_type',
  'job_salary',
  'contact_name',
];

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * @param {string} text
 * @returns {{ blocked: boolean, matched?: string }}
 */
export function checkBannedContent(text) {
  if (!text || typeof text !== 'string') return { blocked: false };
  let lower = text.toLowerCase();
  try {
    lower = lower.normalize('NFKC');
  } catch {
    /* ignore */
  }

  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase.toLowerCase())) {
      return { blocked: true, matched: phrase };
    }
  }

  for (const word of BANNED_WORDS) {
    const re = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i');
    if (re.test(text)) {
      return { blocked: true, matched: word };
    }
  }

  return { blocked: false };
}

/**
 * Зарын form / payload-оос текст талбаруудыг нэгтгэж шалгана.
 * @param {Record<string, unknown>} payload
 * @returns {{ blocked: boolean, matched?: string }}
 */
export function checkBannedListingFields(payload) {
  if (!payload || typeof payload !== 'object') return { blocked: false };
  const chunks = [];
  for (const key of LISTING_STRING_KEYS) {
    const v = payload[key];
    if (typeof v === 'string' && v.trim()) chunks.push(v);
  }
  return checkBannedContent(chunks.join('\n'));
}
