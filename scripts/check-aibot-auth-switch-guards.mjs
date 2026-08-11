#!/usr/bin/env node
/**
 * Static guard: web AIBot must wipe private in-memory AI thread state on auth
 * switch / logout so User B cannot see User A's conversation.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'src/pages/AIBot.jsx'), 'utf8');

const required = [
  { label: 'tracks authSessionKey for switch detection', re: /authSessionKey/ },
  { label: 'tracks messagesOwnerKey for render gating', re: /messagesOwnerKey/ },
  { label: 'wipes conversationId on auth switch', re: /setConversationId\(null\)/ },
  { label: 'wipes messages on auth switch', re: /setMessages\(\[\]\)/ },
  { label: 'renders only session-owned messages', re: /visibleMessages/ },
  { label: 'guards send against missing auth session', re: /!authSessionKey/ },
  {
    label: 'guards send against owner key mismatch',
    re: /messagesOwnerKey\s*!=\s*null\s*&&\s*messagesOwnerKey\s*!==\s*authSessionKey/,
  },
];

const missing = required.filter((r) => !r.re.test(src));
if (missing.length) {
  console.error('check-aibot-auth-switch-guards: FAILED');
  for (const m of missing) {
    console.error(`  - missing: ${m.label}`);
  }
  process.exit(1);
}

console.log('check-aibot-auth-switch-guards: ok');
