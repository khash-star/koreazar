#!/usr/bin/env node
/**
 * Guard: post-login redirect must stay on-origin.
 * Run: node scripts/check-safe-redirect-path.mjs
 */
import { safeRedirectPath } from "../src/utils/safeRedirectPath.js";

const ORIGIN = "https://zarkorea.com";

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

const rejected = [
  "//evil.com",
  "//evil.com/phish",
  "///evil.com",
  "/\\evil.com",
  "https://evil.com",
  "http://evil.com",
  "https://zarkorea.com.evil.com/",
  "HTTPS://evil.com/x",
  "javascript:alert(1)",
  "data:text/html,phish",
  "/",
  "/Login",
  "/Login?next=1",
  "/us/Login",
  "/kr/Login",
  "/jp/Login",
  "",
  "   ",
  null,
  undefined,
];

const allowed = [
  ["/ListingDetail?id=1", "/ListingDetail?id=1"],
  ["/us/CreateListing", "/us/CreateListing"],
  ["/kr/ListingDetail?id=9", "/kr/ListingDetail?id=9"],
  ["https://zarkorea.com/ListingDetail?id=1", "/ListingDetail?id=1"],
  ["https://zarkorea.com/us/MyListings", "/us/MyListings"],
  ["ListingDetail?id=1", "/ListingDetail?id=1"],
  ["/Chat?id=abc", "/Chat?id=abc"],
  ["/ListingDetail?id=1#gallery", "/ListingDetail?id=1#gallery"],
  ["//zarkorea.com/ListingDetail", "/ListingDetail"],
];

for (const raw of rejected) {
  assertEqual(safeRedirectPath(raw, ORIGIN), null, `reject ${JSON.stringify(raw)}`);
}

for (const [raw, expected] of allowed) {
  assertEqual(safeRedirectPath(raw, ORIGIN), expected, `allow ${JSON.stringify(raw)}`);
}

const parsedRelative = new URL("//evil.com/phish", ORIGIN);
if (parsedRelative.origin === ORIGIN) {
  throw new Error("sanity: //evil.com must parse as a different origin");
}

// Pre-fix helper (starts-with-/ only) accepted protocol-relative URLs.
function legacyStartsWithSlash(raw) {
  if (!raw || typeof raw !== "string") return null;
  const s = raw.trim();
  if (s.startsWith("http://") || s.startsWith("https://")) return null;
  if (/[<>"']/.test(s)) return null;
  const path = s.startsWith("/") ? s : `/${s}`;
  return path === "/" || path.startsWith("/Login") ? null : path;
}
assertEqual(legacyStartsWithSlash("//evil.com/phish"), "//evil.com/phish", "legacy bypass");
assertEqual(safeRedirectPath("//evil.com/phish", ORIGIN), null, "fixed helper blocks bypass");

console.log("check-safe-redirect-path: ok");
