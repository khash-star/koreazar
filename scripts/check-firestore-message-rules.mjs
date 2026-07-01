import fs from 'node:fs';
import path from 'node:path';

const rulesPath = path.resolve('firestore.rules');
const rules = fs.readFileSync(rulesPath, 'utf8');

function fail(message) {
  console.error(`Firestore message rules check failed: ${message}`);
  process.exitCode = 1;
}

function assertIncludes(haystack, needle, description) {
  if (!haystack.includes(needle)) {
    fail(`${description} is missing "${needle}"`);
  }
}

const messagesMatch = rules.match(/match\s+\/messages\/\{messageId\}\s*\{([\s\S]*?)\n\s*\}/);
if (!messagesMatch) {
  fail('messages match block not found');
  process.exit();
}

const messagesBlock = messagesMatch[1];

if (/allow\s+read\s*:\s*if\s+request\.auth\s*!=\s*null\s*;/.test(messagesBlock)) {
  fail('message reads are open to every authenticated user');
}

if (/allow\s+create\s*:\s*if\s+request\.auth\s*!=\s*null\s*;/.test(messagesBlock)) {
  fail('message creates are open to every authenticated user');
}

assertIncludes(
  messagesBlock,
  'isMessageSenderOrReceiver()',
  'message read/update/delete sender-or-receiver guard'
);
assertIncludes(
  messagesBlock,
  'isMessageConversationParticipant()',
  'message read/update/delete parent conversation participant guard'
);
assertIncludes(messagesBlock, 'isNewMessageSender()', 'message create authenticated sender guard');
assertIncludes(
  messagesBlock,
  'isNewMessageConversationParticipant()',
  'message create parent conversation participant guard'
);
assertIncludes(messagesBlock, 'isAdmin()', 'message admin override');

for (const helper of [
  'function isConversationParticipantById',
  'function isMessageConversationParticipant',
  'function isNewMessageSender',
  'function isNewMessageConversationParticipant',
]) {
  assertIncludes(rules, helper, `${helper} helper`);
}

if (process.exitCode) {
  process.exit();
}

console.log('Firestore message rules guardrails passed.');
