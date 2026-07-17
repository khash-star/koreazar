import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../api/index.php', import.meta.url), 'utf8');
const start = source.indexOf('function enforce_listing_promotion_privileges(');
assert.notEqual(start, -1, 'listing promotion guard must exist');

let depth = 0;
let bodyStart = -1;
let end = -1;
for (let index = start; index < source.length; index += 1) {
  if (source[index] === '{') {
    depth += 1;
    if (bodyStart === -1) bodyStart = index;
  } else if (source[index] === '}') {
    depth -= 1;
    if (bodyStart !== -1 && depth === 0) {
      end = index + 1;
      break;
    }
  }
}

assert.notEqual(end, -1, 'listing promotion guard must have a complete body');
const guard = source.slice(start, end);

assert.match(
  guard,
  /\$targetListing\s*=\s*\$isCreate\s*\?\s*\$payload\s*:\s*array_merge\(\$existing\s*\?\?\s*\[\],\s*\$payload\)/,
  'admin scope checks must evaluate creates and the post-update listing state',
);
assert.match(
  guard,
  /if\s*\(\s*!admin_can_moderate_listing\(\$pdo,\s*\$authUser,\s*\$targetListing\)\s*\)/,
  'scoped admins must be rejected when the resulting listing is outside their scope',
);
assert.doesNotMatch(
  guard,
  /!\$isCreate\s*&&\s*\$existing\s*!==\s*null\s*&&\s*!admin_can_moderate_listing\(\$pdo,\s*\$authUser,\s*\$existing\)/,
  'the vulnerable existing-row-only scope check must not return',
);

console.log('Admin listing scope guard checks passed.');
