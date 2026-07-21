import fs from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

const PROJECT_ID = 'koreazar-phone-alias-regression';

const rules = fs.readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8');
const testEnv = await initializeTestEnvironment({
  projectId: PROJECT_ID,
  firestore: { rules },
});

try {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await setDoc(doc(db, 'users', 'attacker'), {
      email: 'attacker@example.test',
      phoneAuthEmails: [],
      role: 'user',
    });
    await setDoc(doc(db, 'conversations', 'victim-conversation'), {
      participant_1: 'victim@example.test',
      participant_2: 'owner@example.test',
      participant_uids: ['victim-uid', 'owner-uid'],
    });

    await setDoc(doc(db, 'conversations', 'kr-e164-alias-conversation'), {
      participant_1: 'phone_821012345678@phone.zarkorea.com',
      participant_2: 'owner@example.test',
      participant_uids: [],
    });
    await setDoc(doc(db, 'conversations', 'kr-local-alias-conversation'), {
      participant_1: 'phone_1012345678@phone.zarkorea.com',
      participant_2: 'owner@example.test',
      participant_uids: [],
    });

    await setDoc(doc(db, 'conversations', 'us-e164-alias-conversation'), {
      participant_1: 'phone_12025550123@phone.zarkorea.com',
      participant_2: 'owner@example.test',
      participant_uids: [],
    });
    await setDoc(doc(db, 'conversations', 'us-local-alias-conversation'), {
      participant_1: 'phone_2025550123@phone.zarkorea.com',
      participant_2: 'owner@example.test',
      participant_uids: [],
    });
  });

  const attackerDb = testEnv.authenticatedContext('attacker', {
    email: 'attacker@example.test',
    firebase: { sign_in_provider: 'password' },
  }).firestore();
  const attackerProfile = doc(attackerDb, 'users', 'attacker');
  const victimConversation = doc(attackerDb, 'conversations', 'victim-conversation');

  await assertFails(getDoc(victimConversation));
  await assertSucceeds(updateDoc(attackerProfile, {
    phoneAuthEmails: ['victim@example.test'],
  }));
  await assertFails(getDoc(victimConversation));

  const krDb = testEnv.authenticatedContext('kr-phone-user', {
    phone_number: '+821012345678',
    firebase: { sign_in_provider: 'phone' },
  }).firestore();
  const usDb = testEnv.authenticatedContext('us-phone-user', {
    phone_number: '+12025550123',
    firebase: { sign_in_provider: 'phone' },
  }).firestore();

  await assertSucceeds(getDoc(doc(krDb, 'conversations', 'kr-e164-alias-conversation')));
  await assertSucceeds(getDoc(doc(krDb, 'conversations', 'kr-local-alias-conversation')));
  await assertSucceeds(getDoc(doc(usDb, 'conversations', 'us-e164-alias-conversation')));
  await assertSucceeds(getDoc(doc(usDb, 'conversations', 'us-local-alias-conversation')));
} finally {
  await testEnv.cleanup();
}
