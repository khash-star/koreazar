/**
 * Regression guard: KR mobile local forms (10xxxxxxxx) must expand to +82
 * canonical aliases — not bogus US +1 aliases — after US phone variant parity.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  areEmailVariants,
  emailQueryVariants,
} from '../src/utils/emailNormalize.js';
import {
  areEmailVariants as mobileAreEmailVariants,
  emailQueryVariants as mobileEmailQueryVariants,
} from '../mobile/src/utils/emailNormalize.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const krCanonical = 'phone_821012345678@phone.zarkorea.com';
const krLocal = 'phone_1012345678@phone.zarkorea.com';
const bogusUsFromKrLocal = 'phone_11012345678@phone.zarkorea.com';
const usCanonical = 'phone_12025551234@phone.zarkorea.com';
const usLocal = 'phone_2025551234@phone.zarkorea.com';

function assertVariantParity(label, variantsFn, areFn) {
  const krLocalVariants = variantsFn(krLocal);
  assert.ok(
    krLocalVariants.includes(krCanonical),
    `${label}: KR local must include canonical +82 form`
  );
  assert.ok(
    !krLocalVariants.includes(bogusUsFromKrLocal),
    `${label}: KR local must not invent US +1 alias phone_110…`
  );

  assert.equal(areFn(krLocal, krCanonical), true, `${label}: local→canonical`);
  assert.equal(areFn(krCanonical, krLocal), true, `${label}: canonical→local`);

  assert.equal(areFn(usLocal, usCanonical), true, `${label}: US local→canonical`);
  assert.equal(areFn(usCanonical, usLocal), true, `${label}: US canonical→local`);
  assert.ok(
    variantsFn(usCanonical).includes(usLocal),
    `${label}: US canonical includes NANP local`
  );
}

assertVariantParity('web', emailQueryVariants, areEmailVariants);
assertVariantParity('mobile', mobileEmailQueryVariants, mobileAreEmailVariants);

for (const rel of ['src/utils/emailNormalize.js', 'mobile/src/utils/emailNormalize.js']) {
  const src = readFileSync(join(root, rel), 'utf8');
  assert.match(src, /isKrMobileLocal/, `${rel}: must detect KR mobile local 10xxxxxxxx`);
  assert.match(src, /isUsE164/, `${rel}: must detect US E.164 before excluding KR locals`);
  assert.doesNotMatch(
    src,
    /!digits\.startsWith\(['"]1['"]\) && \(digits\.length === 9/,
    `${rel}: must not use broad startsWith('1') exclusion that drops KR mobiles`
  );
}

console.log('Email query variant checks passed.');
