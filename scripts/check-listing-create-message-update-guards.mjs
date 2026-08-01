/**
 * Regression guard for novel critical holes fixed on this branch:
 * 1. Non-US listing CREATE must bind region_code (null) when the column exists —
 *    unset/missing named params fail under PDO::ATTR_EMULATE_PREPARES=false.
 * 2. Firestore message updates for non-admins must be limited to is_read so a
 *    sender cannot rewrite conversation_id / message body into another thread.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const regions = read('api/regions.php');
const enforceIdx = regions.indexOf('function enforce_us_listing_write_region');
assert.ok(enforceIdx > 0, 'enforce_us_listing_write_region missing');
const enforceSlice = regions.slice(enforceIdx, enforceIdx + 1200);
assert.match(
  enforceSlice,
  /\$country\s*!==\s*'US'[\s\S]*?\$payload\['region_code'\]\s*=\s*null/,
  'non-US writes must set region_code = null for CREATE binds',
);
assert.doesNotMatch(
  enforceSlice,
  /\$country\s*!==\s*'US'[\s\S]*?unset\(\$payload\['region_code'\]\)/,
  'non-US writes must not unset region_code (breaks native PDO binds)',
);

const api = read('api/index.php');
const postIdx = api.indexOf("if ($method === 'POST')");
assert.ok(postIdx > 0, 'listings POST branch missing');
const createSlice = api.slice(postIdx, postIdx + 4500);
assert.match(
  createSlice,
  /enforce_us_listing_write_region\(\$pdo,\s*\$payload\)/,
);
assert.match(
  createSlice,
  /\$hasRegionCode\s*&&\s*!array_key_exists\(\s*'region_code'\s*,\s*\$payload\s*\)[\s\S]*?\$payload\['region_code'\]\s*=\s*null/,
  'CREATE must defensively bind region_code when the column exists',
);
assert.match(createSlice, /:region_code/);
assert.match(createSlice, /INSERT INTO listings/);

const bootstrap = read('api/bootstrap.php');
assert.match(bootstrap, /ATTR_EMULATE_PREPARES\s*=>\s*false/);

const rules = read('firestore.rules');
const messagesBlock = rules.match(/match \/messages\/\{messageId\} \{[\s\S]*?\n    \}/);
assert.ok(messagesBlock, 'missing messages rules block');
assert.match(
  messagesBlock[0],
  /affectedKeys\(\)\s*\.\s*hasOnly\(\s*\['is_read'\]\s*\)/,
  'non-admin message updates must allow only is_read',
);
assert.match(messagesBlock[0], /isMessageSenderOrReceiver\(\)/);
// Must not leave the pre-fix unrestricted participant update path.
assert.doesNotMatch(
  messagesBlock[0],
  /allow update:\s*if request\.auth != null &&\s*\n\s*\(isMessageSenderOrReceiver\(\) \|\| isAppAdmin\(\)\);/,
);

console.log('check-listing-create-message-update-guards: ok');
