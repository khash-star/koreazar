import { readFileSync } from 'node:fs';

function assertContains(file, source, needle) {
  if (!source.includes(needle)) {
    throw new Error(`${file} is missing expected guard: ${needle}`);
  }
}

function assertNotContains(file, source, needle) {
  if (source.includes(needle)) {
    throw new Error(`${file} still contains unsafe pattern: ${needle}`);
  }
}

const firestoreRules = readFileSync('firestore.rules', 'utf8');
const apiIndex = readFileSync('api/index.php', 'utf8');
const webListingService = readFileSync('src/services/listingService.js', 'utf8');
const mobileListingService = readFileSync('mobile/src/services/listingService.js', 'utf8');

const messagesMatch = firestoreRules.match(/match \/messages\/\{messageId\} \{[\s\S]*?\n    \}/);
if (!messagesMatch) {
  throw new Error('firestore.rules messages block not found');
}
const messagesBlock = messagesMatch[0];

assertNotContains('firestore.rules', messagesBlock, 'allow read: if request.auth != null;');
assertNotContains('firestore.rules', messagesBlock, 'allow create: if request.auth != null;');
assertContains('firestore.rules', firestoreRules, 'function isConversationParticipantById(conversationId)');
assertContains('firestore.rules', firestoreRules, 'function isValidMessageCreate()');
assertContains('firestore.rules', firestoreRules, 'request.resource.data.sender_email.lower() == em');
assertContains('firestore.rules', messagesBlock, 'isConversationParticipantById(resource.data.conversation_id)');
assertContains('firestore.rules', messagesBlock, 'isValidMessageCreate() || isAdmin()');

assertContains('api/index.php', apiIndex, '$isPublicQuery = !$hasOwnerFilter && $statusLower === \'active\';');
assertContains('api/index.php', apiIndex, '$readAuthUser = require_firebase_user();');
assertContains('api/index.php', apiIndex, 'function build_listing_owner_scope');
assertContains('api/index.php', apiIndex, 'function can_view_private_listing');
assertContains('api/index.php', apiIndex, 'function enforce_listing_status_privileges');
assertContains('api/index.php', apiIndex, '$payload[\'status\'] = \'pending\';');
assertContains('api/index.php', apiIndex, 'Зарын баталгаажуулалтын төлөвийг зөвхөн админ өөрчилнө');

for (const [file, source] of [
  ['src/services/listingService.js', webListingService],
  ['mobile/src/services/listingService.js', mobileListingService],
]) {
  assertContains(file, source, 'getOptionalAuthHeaders');
  assertContains(file, source, 'isPrivateListingsQuery');
  assertContains(file, source, 'withPrivateReadAuth');
  assertContains(file, source, 'Authorization:');
}

console.log('Critical security guardrails are present.');
