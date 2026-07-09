/**
 * Assign region_admin (or other admin role) via Firebase Admin SDK.
 *
 *   cd functions
 *   set GOOGLE_APPLICATION_CREDENTIALS=%USERPROFILE%\Downloads\koreazar-32e7a-firebase-adminsdk-fbsvc-0eae403278.json
 *   node scripts/set-region-admin.js bambar_2006@yahoo.com washington-dc
 */
const fs = require("fs");
const path = require("path");
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const emailArg = process.argv[2];
const regionArg = (process.argv[3] || "washington-dc").trim().toLowerCase();
const roleArg = (process.argv[4] || "region_admin").trim().toLowerCase();

if (!emailArg) {
  console.error("Usage: node scripts/set-region-admin.js <email> [region_code] [role]");
  process.exit(1);
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
  if (!getApps().length) {
    const keyPath = resolveCredentialsPath();
    initializeApp({ credential: cert(JSON.parse(fs.readFileSync(keyPath, "utf8"))) });
  }
}

async function main() {
  initAdmin();
  const auth = getAuth();
  const db = getFirestore();
  const email = String(emailArg).trim().toLowerCase();

  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
  } catch (e) {
    console.error(`Auth user not found for ${email}. Register/login once first.`);
    process.exit(1);
  }

  const uid = userRecord.uid;
  const payload = {
    email,
    role: roleArg,
    admin_country_code: "US",
    admin_region_code: regionArg,
    updatedAt: FieldValue.serverTimestamp(),
  };

  await db.collection("users").doc(uid).set(payload, { merge: true });

  console.log("OK — admin role assigned");
  console.log(JSON.stringify({ uid, email, role: roleArg, admin_country_code: "US", admin_region_code: regionArg }, null, 2));
  console.log("\nUser must logout + login again. MySQL users table: sync if API deploy uses DB role checks.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
