#!/usr/bin/env node
/**
 * Static guard: web Chat must wipe private conversation bind / message cache on
 * auth switch so User B cannot see User A's thread (including tip open message reads).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'src/pages/Chat.jsx'), 'utf8');

const required = [
  { label: 'tracks authSessionKey for switch detection', re: /authSessionKey/ },
  { label: 'tracks previous auth session for switch', re: /prevAuthSessionKeyRef/ },
  { label: 'clears actualConversationId on auth switch', re: /setActualConversationId\(null\)/ },
  { label: 'removes cached messages queries on switch', re: /removeQueries\(\{\s*queryKey:\s*\['messages'\]/ },
  { label: 'navigates away on auth switch', re: /navigate\(createCountryPageUrl\('Messages'/ },
  { label: 'scopes messages query by auth session', re: /queryKey:\s*\['messages',\s*authSessionKey/ },
  { label: 'scopes conversation query by auth session', re: /queryKey:\s*\['conversation',\s*authSessionKey/ },
  { label: 'renders only session-owned messages', re: /visibleMessages/ },
  { label: 'guards send against missing auth session', re: /!authSessionKey/ },
];

const missing = required.filter((r) => !r.re.test(src));
if (missing.length) {
  console.error('check-web-chat-auth-switch-guards: FAILED');
  for (const m of missing) {
    console.error(`  - missing: ${m.label}`);
  }
  process.exit(1);
}

console.log('check-web-chat-auth-switch-guards: ok');
