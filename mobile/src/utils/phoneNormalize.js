/** E.164: +821012345678 */
export function normalizePhoneE164(raw) {
  const v = String(raw || "").trim().replace(/[\s-]/g, "");
  if (!v) return "";
  if (!v.startsWith("+")) return v.replace(/[^\d]/g, "");
  return `+${v.slice(1).replace(/[^\d]/g, "")}`;
}

/** 010-9497-0939 → 1094970939 (+82/+976 улсын кодтой хамт) */
export function stripNationalTrunkZero(digits, prefix) {
  let d = String(digits || "").replace(/[^\d]/g, "");
  if (!d) return "";
  if (prefix === "+82" && d.startsWith("82")) d = d.slice(2);
  if (prefix === "+976" && d.startsWith("976")) d = d.slice(3);
  if ((prefix === "+82" || prefix === "+976") && d.startsWith("0")) {
    d = d.replace(/^0+/, "");
  }
  return d;
}

export function buildPhoneE164(countryPrefix, localInput) {
  const localDigits = stripNationalTrunkZero(localInput, countryPrefix);
  if (!localDigits) return "";
  return normalizePhoneE164(`${countryPrefix}${localDigits}`);
}
