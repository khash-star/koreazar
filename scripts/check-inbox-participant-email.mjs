/**
 * A conversation document with a missing or non-string participant used to throw
 * inside the inbox query (`other.split`), so every other thread disappeared.
 * Poisoned rows must be skipped and valid rows must still render.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeEmail, participantEmailOrEmpty as webParticipantEmailOrEmpty } from '../src/utils/emailNormalize.js';

const mobileSrc = readFileSync(new URL('../mobile/src/utils/emailNormalize.js', import.meta.url), 'utf8');
const mobileFn = mobileSrc.match(/export function participantEmailOrEmpty\(value\) \{[\s\S]*?\n\}/);
assert.ok(mobileFn, 'mobile participantEmailOrEmpty missing');
const mobileParticipantEmailOrEmpty = new Function(
  `${mobileFn[0].replace(/^export /m, '')}\nreturn participantEmailOrEmpty;`,
)();

function inboxRows(conversations, myEmail, participantEmailOrEmpty) {
  const me = normalizeEmail(myEmail);
  return conversations.flatMap((conv) => {
    const p1 = normalizeEmail(conv.participant_1);
    const imP1 = !!(me && p1 === me);
    const otherEmail = participantEmailOrEmpty(imP1 ? conv.participant_2 : conv.participant_1);
    if (!otherEmail) return [];
    return [{ id: conv.id, otherEmail, label: otherEmail.split('@')[0] }];
  });
}

const conversations = [
  {
    id: 'good',
    participant_1: 'Me@Example.com',
    participant_2: 'Seller@Example.com',
  },
  {
    id: 'poison-number',
    participant_1: 'me@example.com',
    participant_2: 1,
  },
  {
    id: 'poison-missing',
    participant_1: 'me@example.com',
  },
  {
    id: 'poison-null',
    participant_1: 'me@example.com',
    participant_2: null,
  },
  {
    id: 'also-good',
    participant_1: 'buyer@example.com',
    participant_2: 'me@example.com',
  },
];

for (const participantEmailOrEmpty of [webParticipantEmailOrEmpty, mobileParticipantEmailOrEmpty]) {
  assert.equal(participantEmailOrEmpty(undefined), '');
  assert.equal(participantEmailOrEmpty(null), '');
  assert.equal(participantEmailOrEmpty(1), '');
  assert.equal(participantEmailOrEmpty({ email: 'a@b.c' }), '');
  assert.equal(participantEmailOrEmpty('  Seller@Example.com '), 'seller@example.com');

  assert.throws(() => {
    conversations.forEach((conv) => {
      const other = conv.participant_1 === 'me@example.com' ? conv.participant_2 : conv.participant_1;
      other.split('@');
    });
  }, TypeError);

  assert.deepEqual(inboxRows(conversations, 'me@example.com', participantEmailOrEmpty), [
    { id: 'good', otherEmail: 'seller@example.com', label: 'seller' },
    { id: 'also-good', otherEmail: 'buyer@example.com', label: 'buyer' },
  ]);
}

const webMessages = readFileSync(new URL('../src/pages/Messages.jsx', import.meta.url), 'utf8');
const mobileMessages = readFileSync(new URL('../mobile/src/screens/MessagesScreen.js', import.meta.url), 'utf8');
const webChat = readFileSync(new URL('../src/pages/Chat.jsx', import.meta.url), 'utf8');
const mobileChat = readFileSync(new URL('../mobile/src/screens/ChatScreen.js', import.meta.url), 'utf8');

for (const src of [webMessages, mobileMessages, webChat, mobileChat]) {
  assert.match(src, /participantEmailOrEmpty\(/);
}

assert.match(webMessages, /if \(!otherEmail\) return \[]/);
assert.match(mobileMessages, /if \(!other\) return null/);

console.log('check-inbox-participant-email: ok');
