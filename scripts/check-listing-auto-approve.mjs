/**
 * Auto-approve must not publish pending ads from a stale browser flag.
 * The moderation queue runs only after config/app has loaded and is on.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { shouldRunListingAutoApprove } from '../src/utils/listingAutoApprove.js';

assert.equal(shouldRunListingAutoApprove(false, false), false);
assert.equal(shouldRunListingAutoApprove(false, true), false);
assert.equal(shouldRunListingAutoApprove(true, false), false);
assert.equal(shouldRunListingAutoApprove(true, true), true);
assert.equal(shouldRunListingAutoApprove(undefined, true), false);
assert.equal(shouldRunListingAutoApprove(true, 'true'), false);

const page = readFileSync(new URL('../src/pages/AdminNewListings.jsx', import.meta.url), 'utf8');
assert.match(page, /shouldRunListingAutoApprove\(autoApproveLoaded, autoApprove\)/);
assert.doesNotMatch(page, /localStorage\.(get|set)Item\(\s*['"]admin_auto_approve_listings['"]/);
assert.match(page, /useState\(false\)/);
assert.match(page, /await setListingAutoApprove\(next\)/);

console.log('check listing auto-approve: ok');
