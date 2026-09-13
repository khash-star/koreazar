/**
 * Regression guard: banner_requests must not allow any signed-in user to
 * list/read the full collection (advertiser email, message, link, image).
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const rules = read('firestore.rules');

assert.match(rules, /function ownsBannerRequest\(data\)/);

const block = rules.match(
  /match \/banner_requests\/\{requestId\} \{[\s\S]*?\n    \}/,
)?.[0];
assert.ok(block, 'missing banner_requests rules block');

assert.doesNotMatch(
  block,
  /allow read:\s*if request\.auth != null;/,
  'banner_requests must not allow unscoped authenticated reads',
);
assert.doesNotMatch(
  block,
  /allow create:\s*if request\.auth != null;/,
  'banner_requests must not allow unscoped authenticated creates',
);
assert.match(
  block,
  /allow read:\s*if isAppAdmin\(\) \|\| ownsBannerRequest\(resource\.data\);/,
);
assert.match(
  block,
  /allow create:\s*if ownsBannerRequest\(request\.resource\.data\)/,
);
assert.match(block, /created_by_uid == request\.auth\.uid/);

const bannerService = read('src/services/bannerService.js');
assert.match(bannerService, /requireResolvedAuthEmail/);
assert.match(bannerService, /created_by:\s*userEmail/);
assert.match(bannerService, /created_by_uid:\s*user\.uid/);

console.log('check-firestore-banner-request-guards: ok');
