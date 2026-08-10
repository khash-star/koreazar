#!/usr/bin/env node
/**
 * Static guard: MyListings / SavedListings / CreateListing must wipe private
 * in-memory state on auth switch / logout. Sibling of MessagesScreen (#28) and
 * ChatScreen (#60) auth-switch fixes.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assertGuards(label, relPath, required) {
  const src = readFileSync(join(root, relPath), 'utf8');
  const missing = required.filter((r) => !r.re.test(src));
  if (missing.length) {
    console.error(`check-mobile-listing-auth-switch-guards: FAILED (${label})`);
    for (const m of missing) {
      console.error(`  - missing: ${m.label}`);
    }
    process.exit(1);
  }
}

assertGuards('MyListingsScreen', 'mobile/src/screens/MyListingsScreen.js', [
  { label: 'tracks rowsOwnerUid', re: /rowsOwnerUid/ },
  { label: 'renders only rows owned by current uid', re: /visibleRows/ },
  { label: 'uses AuthContext user uid for switch detection', re: /currentUserUid/ },
  { label: 'guards async listing writes against uid mismatch', re: /user\?\.uid !== loadUid/ },
]);

assertGuards('SavedListingsScreen', 'mobile/src/screens/SavedListingsScreen.js', [
  { label: 'tracks rowsOwnerUid', re: /rowsOwnerUid/ },
  { label: 'renders only rows owned by current uid', re: /visibleRows/ },
  { label: 'uses AuthContext user uid for switch detection', re: /currentUserUid/ },
  { label: 'guards async saved-list writes against uid mismatch', re: /user\?\.uid !== loadUid/ },
]);

assertGuards('CreateListingScreen', 'mobile/src/screens/CreateListingScreen.js', [
  { label: 'tracks form owner uid ref', re: /formOwnerUidRef/ },
  { label: 'clears listing form session helper', re: /clearListingFormSession/ },
  { label: 'clears edit listingId on auth switch', re: /setParams\(\{\s*listingId:\s*undefined\s*\}\)/ },
  { label: 'guards edit load against uid mismatch', re: /user\?\.uid !== loadUid/ },
  { label: 'guards submit against form owner mismatch', re: /formOwnerUidRef\.current !== submitUid/ },
]);

console.log('check-mobile-listing-auth-switch-guards: ok');
