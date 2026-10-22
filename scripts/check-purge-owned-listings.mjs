/**
 * Account-deletion purge: remove every MySQL listing for the Firebase uid,
 * and refuse rows that belong to someone else.
 */
import assert from 'node:assert/strict';
import {
  ownedListingQueryParams,
  purgeOwnedMysqlListings,
} from '../src/utils/purgeOwnedMysqlListings.js';

const uid = 'user-uid-1';

function paramsHaveNoMarketScope(params) {
  assert.equal(params.firebase_uid, uid);
  assert.equal(Object.hasOwn(params, 'country_code'), false);
  assert.equal(Object.hasOwn(params, 'region_code'), false);
  assert.equal(Object.hasOwn(params, 'state_code'), false);
}

const params = ownedListingQueryParams(uid, 'all', 100);
paramsHaveNoMarketScope(params);
assert.equal(params.status, 'all');
assert.equal(params.limit, '100');
assert.equal(ownedListingQueryParams(uid, 'pending', 500).limit, '100');

const store = new Map([
  ['1', { id: '1', firebase_uid: uid, status: 'active' }],
  ['2', { id: '2', firebase_uid: uid, status: 'pending' }],
  ['3', { id: '3', firebase_uid: uid, status: 'rejected' }],
]);

const deleted = [];
const result = await purgeOwnedMysqlListings({
  firebaseUid: uid,
  pageSize: 2,
  listByStatus: async ({ status, limit }) => {
    const rows = [...store.values()].filter((row) => status === 'all' || row.status === status);
    return rows.slice(0, limit);
  },
  deleteById: async (id) => {
    deleted.push(id);
    store.delete(id);
  },
});

assert.equal(result.deleted, 3);
assert.deepEqual(deleted, ['1', '2', '3']);
assert.equal(store.size, 0);

const soldOnly = new Map([['9', { id: '9', firebase_uid: uid, status: 'sold' }]]);
const fallbackDeletes = [];
const fallback = await purgeOwnedMysqlListings({
  firebaseUid: uid,
  listByStatus: async ({ status }) => {
    if (status === 'all') return [];
    return [...soldOnly.values()].filter((row) => row.status === status);
  },
  deleteById: async (id) => {
    fallbackDeletes.push(id);
    soldOnly.delete(id);
  },
});
assert.equal(fallback.deleted, 1);
assert.deepEqual(fallbackDeletes, ['9']);

const foreign = new Error('should not delete');
await assert.rejects(
  () => purgeOwnedMysqlListings({
    firebaseUid: uid,
    listByStatus: async () => [{ id: '4', firebase_uid: 'someone-else' }],
    deleteById: async () => {
      throw foreign;
    },
  }),
  /зарыг устгаж чадсангүй/
);

const notFound = Object.assign(new Error('missing'), { status: 404 });
let gone = false;
const missing = await purgeOwnedMysqlListings({
  firebaseUid: uid,
  listByStatus: async ({ status }) => {
    if (gone || status !== 'all') return [];
    return [{ id: '5', firebase_uid: uid }];
  },
  deleteById: async () => {
    gone = true;
    throw notFound;
  },
});
assert.equal(missing.deleted, 1);

await assert.rejects(
  () => purgeOwnedMysqlListings({
    firebaseUid: '',
    listByStatus: async () => [],
    deleteById: async () => {},
  }),
  /хэрэглэгч олдсонгүй/
);

console.log('purge owned listings: ok');
