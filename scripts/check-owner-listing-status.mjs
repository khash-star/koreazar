/**
 * Owner listing queries must request status=all.
 * GET ?action=listings defaults a missing status to active, so My Listings
 * and Profile otherwise hide pending, sold, and rejected ads.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveListingsStatusParam } from '../src/utils/listingListStatus.js';

assert.equal(resolveListingsStatusParam({}), 'active');
assert.equal(resolveListingsStatusParam({ status: '' }), 'active');
assert.equal(resolveListingsStatusParam({ status: '   ' }), 'active');
assert.equal(resolveListingsStatusParam({ category: 'cars' }), 'active');
assert.equal(resolveListingsStatusParam({ status: 'pending' }), 'pending');
assert.equal(resolveListingsStatusParam({ status: 'active' }), 'active');
assert.equal(resolveListingsStatusParam({ created_by: 'owner@example.com' }), 'all');
assert.equal(
  resolveListingsStatusParam({ created_by: 'owner@example.com', status: 'sold' }),
  'sold'
);
assert.equal(resolveListingsStatusParam({ firebase_uid: 'uid-1' }), 'all');
assert.equal(resolveListingsStatusParam({ firebase_uid: '   ' }), 'active');
assert.equal(resolveListingsStatusParam({ customer_id: 12 }), 'all');
assert.equal(resolveListingsStatusParam({ customer_id: '4' }), 'all');
assert.equal(resolveListingsStatusParam({ customer_id: 0 }), 'active');
assert.equal(resolveListingsStatusParam({ customer_id: '' }), 'active');
assert.equal(resolveListingsStatusParam({ customer_id: '0' }), 'active');

const service = readFileSync(new URL('../src/services/listingService.js', import.meta.url), 'utf8');
assert.match(service, /params\.status = resolveListingsStatusParam\(scopedFilters\)/);
assert.doesNotMatch(
  service,
  /else if \(!scopedFilters\.created_by\) \{\s*params\.status = 'active';/
);

const api = readFileSync(new URL('../api/index.php', import.meta.url), 'utf8');
assert.match(
  api,
  /\$status = isset\(\$_GET\['status'\]\) \? trim\(\(string\) \$_GET\['status'\]\) : 'active'/
);
assert.match(api, /strtolower\(\$status\) !== 'all'/);

console.log('check-owner-listing-status: ok');
