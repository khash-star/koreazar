/**
 * Regression guard: chat authorization must not trust mutable users/{uid}.email.
 *
 * Trigger closed by this guard:
 * Phone OTP attacker updates users/{uid}.email to victim@example.com and previously
 * gained conversation access via authEmailLower() falling back to the profile doc.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const rules = read('firestore.rules');

assert.match(rules, /function authPhoneNumber\(\)/);
assert.match(rules, /function tokenDerivedAuthEmailLower\(\)/);
assert.match(rules, /function authEmailLower\(\)\s*\{\s*return tokenDerivedAuthEmailLower\(\);\s*\}/);
assert.match(rules, /function emailFieldAllowedOnWrite\(\)/);
assert.match(rules, /function emailFieldAllowedOnUpdate\(\)/);
assert.match(rules, /function isTokenPhoneAliasEmail\(/);

// authEmailLower must not read mutable users/{uid}.email
const authEmailFn = rules.match(
  /function authEmailLower\(\)[\s\S]*?\n    \}/,
)?.[0];
assert.ok(authEmailFn, 'missing authEmailLower function');
assert.doesNotMatch(
  authEmailFn,
  /get\(\/databases\/\$\(database\)\/documents\/users\/\$\(request\.auth\.uid\)\)\.data\.email/,
);

const tokenDerivedFn = rules.match(
  /function tokenDerivedAuthEmailLower\(\)[\s\S]*?\n    \}/,
)?.[0];
assert.ok(tokenDerivedFn, 'missing tokenDerivedAuthEmailLower function');
assert.match(tokenDerivedFn, /request\.auth\.token\.email/);
assert.match(tokenDerivedFn, /authPhoneNumber\(\)/);
assert.match(tokenDerivedFn, /phone_.*@phone\.zarkorea\.com/);
assert.doesNotMatch(
  tokenDerivedFn,
  /get\(\/databases\/\$\(database\)\/documents\/users\//,
);

const usersBlock = rules.match(/match \/users\/\{userId\} \{[\s\S]*?\n    \}/)?.[0];
assert.ok(usersBlock, 'missing users rules block');
assert.match(usersBlock, /emailFieldAllowedOnWrite\(\)/);
assert.match(usersBlock, /emailFieldAllowedOnUpdate\(\)/);

const webAuth = read('src/services/authService.js');
assert.match(webAuth, /'email'/);
assert.match(webAuth, /'phoneAuthEmails'/);
assert.match(
  webAuth,
  /PROTECTED_USER_DOC_FIELDS[\s\S]*'email'[\s\S]*'phoneAuthEmails'/,
);
assert.match(webAuth, /Prefer verified token identity over mutable profile email/);

const mobileAuth = read('mobile/src/services/authService.js');
assert.match(
  mobileAuth,
  /PROTECTED_USER_DOC_FIELDS[\s\S]*"email"[\s\S]*"phoneAuthEmails"/,
);
assert.match(mobileAuth, /Prefer verified token identity over mutable profile email/);

const webNormalize = read('src/utils/emailNormalize.js');
const resolveFn = webNormalize.match(
  /export function resolveAuthEmail\([\s\S]*?\n\}/,
)?.[0];
assert.ok(resolveFn, 'missing resolveAuthEmail');
const tokenIdx = resolveFn.indexOf('user?.email');
const profileIdx = resolveFn.indexOf('userData?.email');
assert.ok(tokenIdx > 0, 'resolveAuthEmail must check token email');
assert.ok(profileIdx > tokenIdx, 'resolveAuthEmail must prefer token before profile email');
assert.match(resolveFn, /user\?\.phoneNumber/);

console.log('check-firestore-auth-email-guards: ok');
