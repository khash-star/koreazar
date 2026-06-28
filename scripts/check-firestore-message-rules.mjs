import { readFileSync } from "node:fs";
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
  Timestamp,
  where,
} from "firebase/firestore";

const projectId = "demo-koreazar";
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
const [host, rawPort] = emulatorHost.split(":");
const port = Number(rawPort);

if (!host || !Number.isFinite(port)) {
  throw new Error(`Invalid FIRESTORE_EMULATOR_HOST: ${emulatorHost}`);
}

const testEnv = await initializeTestEnvironment({
  projectId,
  firestore: {
    host,
    port,
    rules: readFileSync("firestore.rules", "utf8"),
  },
});

const messagePayload = (overrides = {}) => ({
  conversation_id: "conv-owner-victim",
  sender_email: "owner@example.com",
  receiver_email: "victim@example.com",
  message: "hello",
  is_read: false,
  created_date: Timestamp.now(),
  ...overrides,
});

try {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "users", "owner"), {
      email: "owner@example.com",
      role: "user",
    });
    await setDoc(doc(db, "users", "victim"), {
      email: "victim@example.com",
      role: "user",
    });
    await setDoc(doc(db, "users", "attacker"), {
      email: "attacker@example.com",
      role: "user",
    });
    await setDoc(doc(db, "users", "admin"), {
      email: "admin@example.com",
      role: "admin",
    });
    await setDoc(doc(db, "conversations", "conv-owner-victim"), {
      participant_1: "owner@example.com",
      participant_2: "victim@example.com",
      participant_uids: ["owner", "victim"],
      last_message: "hello",
      last_message_time: new Date().toISOString(),
      last_message_sender: "owner@example.com",
      unread_count_p1: 0,
      unread_count_p2: 1,
    });
    await setDoc(doc(db, "conversations", "conv-attacker-victim"), {
      participant_1: "attacker@example.com",
      participant_2: "victim@example.com",
      participant_uids: ["attacker", "victim"],
      last_message: "",
      last_message_time: new Date().toISOString(),
      last_message_sender: "attacker@example.com",
      unread_count_p1: 0,
      unread_count_p2: 0,
    });
    await setDoc(doc(db, "messages", "owner-message"), messagePayload());
  });

  const ownerDb = testEnv
    .authenticatedContext("owner", { email: "owner@example.com" })
    .firestore();
  const victimDb = testEnv
    .authenticatedContext("victim", { email: "victim@example.com" })
    .firestore();
  const attackerDb = testEnv
    .authenticatedContext("attacker", { email: "attacker@example.com" })
    .firestore();
  const adminDb = testEnv
    .authenticatedContext("admin", { email: "admin@example.com" })
    .firestore();

  await assertSucceeds(getDoc(doc(ownerDb, "messages", "owner-message")));
  await assertSucceeds(getDoc(doc(victimDb, "messages", "owner-message")));
  await assertFails(getDoc(doc(attackerDb, "messages", "owner-message")));
  await assertFails(
    getDocs(
      query(
        collection(attackerDb, "messages"),
        where("conversation_id", "==", "conv-owner-victim")
      )
    )
  );

  await assertFails(
    setDoc(
      doc(attackerDb, "messages", "attacker-intrusion"),
      messagePayload({
        sender_email: "attacker@example.com",
        message: "intrusion",
      })
    )
  );
  await assertFails(
    setDoc(
      doc(attackerDb, "messages", "attacker-spoof"),
      messagePayload({
        conversation_id: "conv-attacker-victim",
        sender_email: "owner@example.com",
        receiver_email: "victim@example.com",
        message: "spoof",
      })
    )
  );
  await assertSucceeds(
    setDoc(
      doc(attackerDb, "messages", "attacker-legitimate"),
      messagePayload({
        conversation_id: "conv-attacker-victim",
        sender_email: "attacker@example.com",
        receiver_email: "victim@example.com",
        message: "legitimate",
      })
    )
  );
  await assertSucceeds(
    setDoc(
      doc(adminDb, "messages", "admin-broadcast"),
      messagePayload({
        sender_email: "admin@example.com",
        receiver_email: "victim@example.com",
        message: "admin broadcast",
      })
    )
  );

  console.log("Firestore message rules regression checks passed");
} finally {
  await testEnv.cleanup();
}
