/**
 * Regression guard for cross-market admin / listing write holes:
 * - canBroadcast is super-admin only (no unscoped country-admin spam)
 * - mobile banner create defaults to active market, not hardcoded US
 * - banner request/approve persist country_code
 * - API owner PATCH strips country_code / region_code retags
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canBroadcast } from '../src/constants/adminRoles.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

assert.equal(canBroadcast({ role: 'super_admin' }), true);
assert.equal(canBroadcast({ role: 'admin' }), true);
assert.equal(canBroadcast({ role: 'country_admin', admin_country_code: 'US' }), false);
assert.equal(canBroadcast({ role: 'region_admin', admin_country_code: 'US', admin_region_code: 'washington-dc' }), false);
assert.equal(canBroadcast({ role: 'user' }), false);

const mobileBanner = read('mobile/src/screens/AdminBannersScreen.js');
assert.match(mobileBanner, /getActiveMobileCountryCode/);
assert.doesNotMatch(mobileBanner, /admin_country_code\s*\|\|\s*["']US["']/);

const requestBanner = read('src/pages/RequestBannerAd.jsx');
assert.match(requestBanner, /country_code:\s*String\(activeCountry/);

const approveBanner = read('src/pages/AdminBannerRequests.jsx');
assert.match(approveBanner, /normalizeBannerCountryCode\(request\.country_code\)/);
assert.match(approveBanner, /country_code:\s*countryCode/);

const api = read('api/index.php');
assert.match(
  api,
  /if\s*\(\s*!is_app_admin\(\$pdo,\s*\$authUser\)\s*\)\s*\{\s*unset\(\$payload\['country_code'\],\s*\$payload\['region_code'\]\);\s*\}/s,
);

const mobileRoles = read('mobile/src/constants/adminRoles.js');
assert.match(mobileRoles, /function canBroadcast\(userData\)\s*\{\s*return isSuperAdmin\(userData\);\s*\}/s);

console.log('check-cross-market-admin-guards: ok');
