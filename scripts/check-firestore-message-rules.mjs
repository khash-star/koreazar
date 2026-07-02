import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
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

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const rules = readFileSync(resolve(projectRoot, "firestore.rules"), "utf8");
const projectId = `koreazar-message-rules-${Date.now()}`;
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
const [host, portText] = emulatorHost.split(":");

const testEnv = await initializeTestEnvironment({
  projectId,
  firestore: {
    host,
    port: Number(portText || 8080),
    rules,
  },
});

function authedDb(uid, email) {
  return testEnv.authenticatedContext(uid, { email }).firestore();
}

async function seedData() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await Promise.all([
      setDoc(doc(db, "users", "alice"), {
        email: "alice@example.com",
        role: "user",
      }),
      setDoc(doc(db, "users", "bob"), {
        email: "bob@example.com",
        role: "user",
      }),
      setDoc(doc(db, "users", "mallory"), {
        email: "mallory@example.com",
        role: "user",
      }),
      setDoc(doc(db, "users", "admin"), {
        email: "admin@example.com",
        role: "admin",
      }),
      setDoc(doc(db, "conversations", "alice-bob"), {
        participant_1: "alice@example.com",
        participant_2: "bob@example.com",
        participant_uids: ["alice", "bob"],
      }),
      setDoc(doc(db, "messages", "alice-to-bob"), {
        conversation_id: "alice-bob",
        sender_email: "alice@example.com",
        receiver_email: "bob@example.com",
        message: "hello",
        is_read: false,
      }),
    ]);
  });
}

async function run() {
  await testEnv.clearFirestore();
  await seedData();

  const alice = authedDb("alice", "alice@example.com");
  const bob = authedDb("bob", "bob@example.com");
  const mallory = authedDb("mallory", "mallory@example.com");
  const admin = authedDb("admin", "admin@example.com");

  const conversationMessages = (db) =>
    query(collection(db, "messages"), where("conversation_id", "==", "alice-bob"));

  await assertSucceeds(getDoc(doc(alice, "messages", "alice-to-bob")));
  await assertSucceeds(getDocs(conversationMessages(bob)));
  await assertSucceeds(getDoc(doc(admin, "messages", "alice-to-bob")));

  await assertFails(getDoc(doc(mallory, "messages", "alice-to-bob")));
  await assertFails(getDocs(conversationMessages(mallory)));

  await assertFails(
    setDoc(doc(mallory, "messages", "spoofed-alice"), {
      conversation_id: "alice-bob",
      sender_email: "alice@example.com",
      receiver_email: "bob@example.com",
      message: "spoofed",
      is_read: false,
    })
  );

  await assertFails(
    setDoc(doc(mallory, "messages", "intruder-message"), {
      conversation_id: "alice-bob",
      sender_email: "mallory@example.com",
      receiver_email: "bob@example.com",
      message: "intrusion",
      is_read: false,
    })
  );

  await assertSucceeds(
    setDoc(doc(alice, "messages", "legit-alice"), {
      conversation_id: "alice-bob",
      sender_email: "alice@example.com",
      receiver_email: "bob@example.com",
      message: "legit",
      is_read: false,
    })
  );

  await assertSucceeds(
    setDoc(doc(admin, "messages", "admin-broadcast"), {
      conversation_id: "alice-bob",
      sender_email: "admin@example.com",
      receiver_email: "bob@example.com",
      message: "admin notice",
      is_read: false,
    })
  );

  await assertSucceeds(
    updateDoc(doc(bob, "messages", "alice-to-bob"), { is_read: true })
  );

  console.log("Firestore message rules guardrails passed");
}

try {
  await run();
} finally {
  await testEnv.cleanup();
}
