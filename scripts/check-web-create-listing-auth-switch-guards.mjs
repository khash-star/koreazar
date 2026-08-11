#!/usr/bin/env node
/**
 * Static guard: web CreateListing / RequestBannerAd must wipe private draft
 * form (and banner request cache) on auth switch so User B cannot see User A's
 * phone/kakao/title/images or prior banner requests. Web sibling of mobile #61.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assertGuards(label, relPath, required) {
  const src = readFileSync(join(root, relPath), 'utf8');
  const missing = required.filter((r) => !r.re.test(src));
  if (missing.length) {
    console.error(`check-web-create-listing-auth-switch-guards: FAILED (${label})`);
    for (const m of missing) {
      console.error(`  - missing: ${m.label}`);
    }
    process.exit(1);
  }
}

assertGuards('CreateListing', 'src/pages/CreateListing.jsx', [
  { label: 'tracks authSessionKey for switch detection', re: /authSessionKey/ },
  { label: 'tracks form owner uid ref', re: /formOwnerUidRef/ },
  { label: 'clears listing form session helper', re: /clearListingFormSession/ },
  { label: 'guards submit against form owner mismatch', re: /formOwnerUidRef\.current !== submitUid/ },
  { label: 'guards image upload against uid mismatch', re: /formOwnerUidRef\.current !== uploadUid/ },
]);

assertGuards('RequestBannerAd', 'src/pages/RequestBannerAd.jsx', [
  { label: 'tracks authSessionKey for switch detection', re: /authSessionKey/ },
  { label: 'tracks form owner uid ref', re: /formOwnerUidRef/ },
  { label: 'clears banner form session helper', re: /clearBannerFormSession/ },
  { label: 'scopes myBannerRequests query by auth session', re: /queryKey:\s*\['myBannerRequests',\s*authSessionKey/ },
  { label: 'removes cached banner requests on switch', re: /removeQueries\(\{\s*queryKey:\s*\['myBannerRequests'\]/ },
  { label: 'renders only session-visible requests', re: /visibleRequests/ },
  { label: 'guards submit against form owner mismatch', re: /formOwnerUidRef\.current !== submitUid/ },
]);

console.log('check-web-create-listing-auth-switch-guards: ok');
