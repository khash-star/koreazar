/**
 * Regression guard for novel Firestore privacy holes:
 * - conversations create requires creator to be a participant
 * - ai_conversations / ai_messages / ai_usage must not allow unscoped auth list
 * - AI message list/subscribe clients must pass owner user_email
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const rules = read('firestore.rules');

assert.match(rules, /function isCreatingAsConversationParticipant\(\)/);
assert.match(
  rules,
  /match \/conversations\/\{conversationId\}[\s\S]*?allow create:\s*if isCreatingAsConversationParticipant\(\);/,
);
assert.doesNotMatch(
  rules,
  /match \/conversations\/\{conversationId\}[\s\S]*?allow create:\s*if request\.auth != null;/,
);

assert.match(rules, /function ownsAiResource\(\)/);
assert.match(rules, /function createsOwnAiResource\(\)/);

for (const collectionName of ['ai_conversations', 'ai_messages', 'ai_usage']) {
  const blockMatch = rules.match(
    new RegExp(`match \\/${collectionName}\\/\\{[^}]+\\} \\{[\\s\\S]*?\\n    \\}`),
  );
  assert.ok(blockMatch, `missing ${collectionName} rules block`);
  const block = blockMatch[0];
  assert.doesNotMatch(
    block,
    /allow list:\s*if request\.auth != null;/,
    `${collectionName} must not allow unscoped auth list`,
  );
}

assert.match(
  rules,
  /match \/ai_conversations\/\{conversationId\}[\s\S]*?allow read:\s*if ownsAiResource\(\);/,
);
assert.match(
  rules,
  /match \/ai_messages\/\{messageId\}[\s\S]*?allow read:\s*if ownsAiResource\(\);/,
);

const aiService = read('src/services/aiConversationService.js');
assert.match(
  aiService,
  /export const listAIMessages = async \(conversationId, userEmail/,
);
assert.match(
  aiService,
  /export const subscribeToAIMessages = \(conversationId, userEmail, callback\)/,
);
assert.match(aiService, /where\('user_email',\s*'==',\s*userEmail\)/);

const aiBot = read('src/pages/AIBot.jsx');
assert.match(aiBot, /listAIMessages\(conversationId,\s*userEmail\)/);
assert.match(aiBot, /subscribeToAIMessages\(conversationId,\s*userEmail,/);

console.log('check-firestore-conversation-ai-guards: ok');
