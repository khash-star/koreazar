import fs from "node:fs";
import assert from "node:assert/strict";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

const testEnv = await initializeTestEnvironment({
  projectId: `koreazar-message-rules-${Date.now()}`,
  firestore: {
    rules: fs.readFileSync("firestore.rules", "utf8"),
  },
});

try {
  await testEnv.clearFirestore();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "users", "alice"), {
      email: "alice@example.com",
      role: "user",
    });
    await setDoc(doc(db, "users", "bob"), {
      email: "bob@example.com",
      role: "user",
    });
    await setDoc(doc(db, "users", "eve"), {
      email: "eve@example.com",
      role: "user",
    });
    await setDoc(doc(db, "users", "admin"), {
      email: "admin@example.com",
      role: "admin",
    });

    await setDoc(doc(db, "conversations", "alice-bob"), {
      participant_1: "alice@example.com",
      participant_2: "bob@example.com",
      participant_uids: ["alice", "bob"],
    });
    await setDoc(doc(db, "conversations", "eve-admin"), {
      participant_1: "eve@example.com",
      participant_2: "admin@example.com",
      participant_uids: ["eve", "admin"],
    });

    await setDoc(doc(db, "messages", "alice-message"), {
      conversation_id: "alice-bob",
      sender_email: "alice@example.com",
      receiver_email: "bob@example.com",
      message: "hello bob",
      is_read: false,
    });
    await setDoc(doc(db, "messages", "eve-message"), {
      conversation_id: "eve-admin",
      sender_email: "eve@example.com",
      receiver_email: "admin@example.com",
      message: "hello admin",
      is_read: false,
    });
  });

  const aliceDb = testEnv.authenticatedContext("alice", {
    email: "alice@example.com",
  }).firestore();
  const bobDb = testEnv.authenticatedContext("bob", {
    email: "bob@example.com",
  }).firestore();
  const eveDb = testEnv.authenticatedContext("eve", {
    email: "eve@example.com",
  }).firestore();
  const adminDb = testEnv.authenticatedContext("admin", {
    email: "admin@example.com",
  }).firestore();

  const aliceMessagesQuery = query(
    collection(aliceDb, "messages"),
    where("conversation_id", "==", "alice-bob")
  );
  const aliceMessages = await assertSucceeds(getDocs(aliceMessagesQuery));
  assert.equal(aliceMessages.size, 1);

  await assertFails(getDocs(query(collection(eveDb, "messages"), where("conversation_id", "==", "alice-bob"))));
  await assertFails(getDoc(doc(eveDb, "messages", "alice-message")));
  await assertFails(getDocs(collection(aliceDb, "messages")));

  await assertSucceeds(
    setDoc(doc(aliceDb, "messages", "alice-send"), {
      conversation_id: "alice-bob",
      sender_email: "alice@example.com",
      receiver_email: "bob@example.com",
      message: "allowed",
      is_read: false,
    })
  );

  await assertFails(
    setDoc(doc(aliceDb, "messages", "spoofed-send"), {
      conversation_id: "alice-bob",
      sender_email: "bob@example.com",
      receiver_email: "alice@example.com",
      message: "spoofed",
      is_read: false,
    })
  );

  await assertFails(
    setDoc(doc(eveDb, "messages", "outsider-send"), {
      conversation_id: "alice-bob",
      sender_email: "eve@example.com",
      receiver_email: "bob@example.com",
      message: "outsider",
      is_read: false,
    })
  );

  await assertSucceeds(updateDoc(doc(bobDb, "messages", "alice-message"), { is_read: true }));
  await assertFails(updateDoc(doc(eveDb, "messages", "alice-message"), { is_read: true }));
  await assertSucceeds(getDoc(doc(adminDb, "messages", "alice-message")));
} finally {
  await testEnv.cleanup();
}
