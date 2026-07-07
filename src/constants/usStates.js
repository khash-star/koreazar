/**
 * US states keyed by two-letter state_code (stored in Firestore).
 * UI shows "California (CA)"; DB stores only "CA".
 */
export const US_STATES = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
  DC: 'District of Columbia',
};

/**
 * Launch subset — Washington DC / DMV MVP (washington-dc region).
 * Mobile create-listing uses `getActiveUsRegionStateCodes()` from region registry;
 * keep this in sync for web US UI when enabled.
 */
export const US_LAUNCH_STATE_CODES = ['DC', 'VA', 'MD'];

/** State codes sorted by display name (for dropdown order). */
export const US_STATE_CODES = US_LAUNCH_STATE_CODES.slice().sort((a, b) =>
  US_STATES[a].localeCompare(US_STATES[b])
);

export function getUsStateName(stateCode) {
  const code = String(stateCode || '').trim().toUpperCase();
  return US_STATES[code] || '';
}

/** UI label: "California (CA)" */
export function formatUsStateLabel(stateCode) {
  const code = String(stateCode || '').trim().toUpperCase();
  const name = US_STATES[code];
  if (!name) return code || '';
  return `${name} (${code})`;
}

export function isValidUsStateCode(stateCode) {
  return !!getUsStateName(stateCode);
}
