#!/usr/bin/env node
/**
 * Static guard: ChatScreen must wipe in-memory chat state and leave the Chat
 * route on auth switch / logout. Sibling of MessagesScreen auth-switch fix (#28).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const chatPath = join(root, 'mobile/src/screens/ChatScreen.js');
const src = readFileSync(chatPath, 'utf8');

const required = [
  {
    label: 'tracks sessionOwnerUid for loaded chat session',
    re: /sessionOwnerUid/,
  },
  {
    label: 'clears chat session helper',
    re: /clearChatSession/,
  },
  {
    label: 'renders only messages owned by current uid',
    re: /visibleMessages/,
  },
  {
    label: 'leaves Chat route on auth switch/logout',
    re: /navigation\.replace\(\s*["']MsgMain["']\s*\)/,
  },
  {
    label: 'guards async message writes against uid mismatch',
    re: /auth\.currentUser\?\.uid !== loadUid/,
  },
  {
    label: 'uses AuthContext user uid for switch detection',
    re: /currentUserUid/,
  },
];

const missing = required.filter((r) => !r.re.test(src));
if (missing.length) {
  console.error('check-mobile-chat-auth-switch-guards: FAILED');
  for (const m of missing) {
    console.error(`  - missing: ${m.label}`);
  }
  process.exit(1);
}

console.log('check-mobile-chat-auth-switch-guards: ok');
