/**
 * One-time backfill: conversations.participant_uids from participant emails + users.email
 *
 *   cd functions
 *   set GOOGLE_APPLICATION_CREDENTIALS=..\path\to\firebase-adminsdk.json
 *   node scripts/backfill-conversation-participant-uids.js
 *   node scripts/backfill-conversation-participant-uids.js --dry-run
 */
const fs = require("fs");
const path = require("path");
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const DRY_RUN = process.argv.includes("--dry-run");

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function phoneToAuthEmail(phoneE164) {
  const digits = String(phoneE164 || "").replace(/[^\d]/g, "");
  if (!digits) return "";
  return `phone_${digits}@phone.zarkorea.com`;
}

function emailQueryVariants(email) {
  const em = normalizeEmail(email);
  if (!em) return [];
  const out = new Set([em]);
  const m = em.match(/^phone_(\d+)@phone\.zarkorea\.com$/);
  if (m) {
    const digits = m[1];
    if (digits.startsWith("82") && digits.length > 10) {
      out.add(`phone_${digits.slice(2)}@phone.zarkorea.com`);
      out.add(normalizeEmail(phoneToAuthEmail(`+${digits}`)));
    } else if (!digits.startsWith("82") && digits.length >= 9) {
      out.add(`phone_82${digits}@phone.zarkorea.com`);
      out.add(normalizeEmail(phoneToAuthEmail(`+82${digits}`)));
    }
  }
  return [...out];
}

function resolveCredentialsPath() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }
  const candidates = [
    path.join(__dirname, "..", "..", "mobile", "koreazar-32e7a-firebase-adminsdk-fbsvc-0eae403278.json"),
    path.join(process.env.USERPROFILE || process.env.HOME || "", "Downloads", "koreazar-32e7a-firebase-adminsdk-fbsvc-0eae403278.json"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("Set GOOGLE_APPLICATION_CREDENTIALS to firebase-adminsdk JSON path");
}

function initAdmin() {
  if (getApps().length) return getFirestore();
  const keyPath = resolveCredentialsPath();
  initializeApp({ credential: cert(JSON.parse(fs.readFileSync(keyPath, "utf8"))) });
  return getFirestore();
}

async function buildEmailToUidMap(db) {
  const snap = await db.collection("users").get();
  const map = new Map();
  for (const doc of snap.docs) {
    const email = normalizeEmail(doc.data()?.email);
    if (!email) continue;
    for (const variant of emailQueryVariants(email)) {
      if (!map.has(variant)) map.set(variant, doc.id);
    }
  }
  return map;
}

function uidsForParticipant(email, emailToUid) {
  const em = normalizeEmail(email);
  if (!em) return [];
  const out = new Set();
  for (const variant of emailQueryVariants(em)) {
    const uid = emailToUid.get(variant);
    if (uid) out.add(uid);
  }
  return [...out];
}

async function main() {
  const db = initAdmin();
  const emailToUid = await buildEmailToUidMap(db);
  console.log(`Loaded ${emailToUid.size} email variant mappings`);

  const convSnap = await db.collection("conversations").get();
  let scanned = 0;
  let updated = 0;
  let skipped = 0;

  for (const doc of convSnap.docs) {
    scanned += 1;
    const data = doc.data();
    const prev = Array.isArray(data.participant_uids) ? data.participant_uids.filter(Boolean) : [];
    const uidSet = new Set(prev);

    for (const em of [data.participant_1, data.participant_2]) {
      for (const uid of uidsForParticipant(em, emailToUid)) {
        uidSet.add(uid);
      }
    }

    const next = [...uidSet];
    const changed = next.length !== prev.length || next.some((uid) => !prev.includes(uid));
    if (!changed) {
      skipped += 1;
      continue;
    }

    if (DRY_RUN) {
      console.log(`[dry-run] ${doc.id}: ${JSON.stringify(prev)} -> ${JSON.stringify(next)}`);
    } else {
      await doc.ref.update({ participant_uids: next });
    }
    updated += 1;
  }

  console.log(
    `${DRY_RUN ? "Dry run" : "Done"}: scanned=${scanned}, updated=${updated}, unchanged=${skipped}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
