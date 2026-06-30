import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { areEmailVariants, emailQueryVariants } from "../mobile/src/utils/emailNormalize.js";

const canonicalPhoneEmail = "phone_821012345678@phone.zarkorea.com";
const legacyPhoneEmail = "phone_1012345678@phone.zarkorea.com";

assert.equal(areEmailVariants(canonicalPhoneEmail, legacyPhoneEmail), true);
assert.equal(areEmailVariants(legacyPhoneEmail, canonicalPhoneEmail), true);
assert.ok(emailQueryVariants(canonicalPhoneEmail).includes(legacyPhoneEmail));
assert.ok(emailQueryVariants(legacyPhoneEmail).includes(canonicalPhoneEmail));

const conversationService = readFileSync(
  new URL("../mobile/src/services/conversationService.js", import.meta.url),
  "utf8"
);
assert.match(conversationService, /function participantPairMatches/);
assert.match(conversationService, /participantPairMatches\(p1, p2, a, b\)/);
assert.match(conversationService, /emailQueryVariants\(a\)/);
assert.match(conversationService, /emailQueryVariants\(b\)/);

const chatScreen = readFileSync(
  new URL("../mobile/src/screens/ChatScreen.js", import.meta.url),
  "utf8"
);
assert.match(chatScreen, /areEmailVariants\(m\.receiver_email, meNorm\)/);
assert.match(chatScreen, /areEmailVariants\(activeConv\.participant_1, meNorm\)/);

console.log("Chat phone email variant checks passed.");
