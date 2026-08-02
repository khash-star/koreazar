/**
 * Regression guard: conversation updates must not allow swapping participant
 * emails to unrelated addresses (inbox phishing / fake-admin injection).
 *
 * Own-slot canonicalization is allowed only via token-derived identity.
 * Clients must not rewrite the counterparty email after send.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const rules = read('firestore.rules');

assert.match(rules, /function conversationParticipantsUpdateAllowed\(\)/);
assert.match(rules, /function conversationParticipantSlotAllowed\(/);
assert.match(rules, /function participantEmailMatchesToken\(/);
assert.match(rules, /function tokenDerivedChatEmailLower\(\)/);
assert.match(rules, /function isTokenPhoneAliasEmail\(/);

const conversationsBlock = rules.match(
  /match \/conversations\/\{conversationId\} \{[\s\S]*?\n    \}/,
)?.[0];
assert.ok(conversationsBlock, 'missing conversations rules block');
assert.match(
  conversationsBlock,
  /conversationParticipantsUpdateAllowed\(\)/,
);
assert.match(
  conversationsBlock,
  /allow update:\s*if request\.auth != null &&[\s\S]*isConversationParticipant\(\) && conversationParticipantsUpdateAllowed\(\)/,
);
assert.doesNotMatch(
  conversationsBlock,
  /allow update:\s*if request\.auth != null &&\s*\n\s*\(isConversationParticipant\(\) \|\| isAppAdmin\(\)\);/,
);

// Token-only rematch — must not authorize slot changes via mutable profile email.
assert.doesNotMatch(
  rules,
  /function participantEmailMatchesToken\([\s\S]*?users\/\$\(request\.auth\.uid\)[\s\S]*?function conversationParticipantSlotAllowed/,
);

for (const rel of [
  'src/services/conversationService.js',
  'mobile/src/services/conversationService.js',
]) {
  const src = read(rel);
  assert.match(
    src,
    /Only canonicalize the sender's own slot/,
    `${rel} must document own-slot-only canonicalize`,
  );
  assert.match(
    src,
    /participant_1:\s*senderIsP1\s*\?\s*pickCanonicalParticipantEmail\(p1,\s*sender\)\s*:\s*p1/,
    `${rel} must keep counterparty participant_1 unchanged`,
  );
  assert.match(
    src,
    /participant_2:\s*!senderIsP1\s*\?\s*pickCanonicalParticipantEmail\(p2,\s*sender\)\s*:\s*p2/,
    `${rel} must keep counterparty participant_2 unchanged`,
  );
  assert.doesNotMatch(
    src,
    /pickCanonicalParticipantEmail\(\s*p1,\s*senderIsP1 \? sender : areEmailVariants/,
    `${rel} must not canonicalize counterparty via receiver variants`,
  );
}

console.log('check-conversation-participant-update-guards: ok');
