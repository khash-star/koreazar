/**
 * Regression guard for novel critical holes fixed on this branch:
 * 1. Web My Listings / owner filterListings must send created_by/firebase_uid
 *    and default owner queries to status=all (pending/sold visible).
 * 2. user_sync / listing created_by must prefer Firebase token phone over
 *    client-writable MySQL phone (and must not wipe phone on empty sync).
 * 3. Shared Storage paths must allow image create only (no overwrite/delete).
 * 4. US country_code backfill SQL must match SQL NULL via IS NULL.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const listingService = read('src/services/listingService.js');
assert.match(listingService, /hasOwnerFilter/);
assert.match(listingService, /params\.created_by\s*=\s*String\(scopedFilters\.created_by\)/);
assert.match(listingService, /params\.firebase_uid\s*=\s*String\(scopedFilters\.firebase_uid\)/);
assert.match(listingService, /params\.status\s*=\s*['"]all['"]/);
assert.match(listingService, /needsAuth/);

const api = read('api/index.php');
assert.match(
  api,
  /upsert_user_profile_best_effort\(\$pdo,\s*\$authUser\['uid'\],\s*\$authUser\['email'\],\s*\$body,\s*\$authUser\)/,
);
assert.match(api, /Verified Firebase phone claim beats any client-supplied MySQL phone/);
assert.match(api, /Prefer verified Firebase phone claim/);
assert.match(api, /Only write phone when we have a value/);
assert.doesNotMatch(
  api,
  /if\s*\(\s*table_has\(\$pdo,\s*'users',\s*'phone'\)\s*\)\s*\{\s*\$set\[\]\s*=\s*'phone\s*=\s*:phone';\s*\$params\[':phone'\]\s*=\s*\$phone;\s*\}/s,
);

// resolve_auth_email_for_listing: token phone must appear before DB phone lookup.
const resolveIdx = api.indexOf('function resolve_auth_email_for_listing');
assert.ok(resolveIdx > 0);
const resolveSlice = api.slice(resolveIdx, resolveIdx + 2500);
const tokenPhoneIdx = resolveSlice.indexOf("authUser['phoneNumber']");
const dbPhoneIdx = resolveSlice.indexOf('$dbPhone');
assert.ok(tokenPhoneIdx > 0, 'token phone lookup missing');
assert.ok(dbPhoneIdx > tokenPhoneIdx, 'token phone must be checked before DB phone');

const storage = read('storage.rules');
assert.match(storage, /function canCreatePublicImage/);
assert.match(storage, /allow create:\s*if canCreatePublicImage\(\)/);
assert.match(storage, /allow update,\s*delete:\s*if false/);
assert.doesNotMatch(storage, /match \/images\/\{allPaths=\*\*\}[\s\S]*?allow write:\s*if request\.auth\s*!=\s*null/ );

const sqlFix = read('api/sql/fix_us_listings_country_code.sql');
assert.match(sqlFix, /country_code`\s+IS NULL\s+OR\s+`country_code`\s+IN\s*\(/i);
assert.doesNotMatch(sqlFix, /IN\s*\(\s*'KR'\s*,\s*''\s*,\s*NULL\s*\)/);

console.log('check-owner-sync-storage-guards: ok');
