/**
 * One-shot: upload Firebase service account JSON to Expo for Android FCM V1 push.
 * Uses local `eas login` session (~/.expo/state.json). Does not commit secrets.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOBILE_DIR = path.join(__dirname, "..");
const PROJECT_FULL_NAME = "@khashbal/zarkorea-app";
const ANDROID_PACKAGE = "com.zarkorea.twa";
const KEY_FILE =
  process.env.FCM_SERVICE_ACCOUNT_JSON ||
  path.join(MOBILE_DIR, "koreazar-32e7a-firebase-adminsdk-fbsvc-0eae403278.json");
const STATE_JSON = path.join(process.env.USERPROFILE || process.env.HOME || "", ".expo", "state.json");
const GRAPHQL_URL = "https://api.expo.dev/graphql";

function loadSessionSecret() {
  const raw = JSON.parse(fs.readFileSync(STATE_JSON, "utf8"));
  const secret = raw?.auth?.sessionSecret;
  if (!secret) throw new Error("Not logged in to Expo. Run: eas login");
  return secret;
}

async function gql(sessionSecret, query, variables = {}) {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "expo-session": sessionSecret,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  return json.data;
}

async function main() {
  if (!fs.existsSync(KEY_FILE)) {
    throw new Error(
      `Key file not found: ${KEY_FILE}\nSet FCM_SERVICE_ACCOUNT_JSON or copy JSON to mobile/ (gitignored).`
    );
  }
  const jsonKey = JSON.parse(fs.readFileSync(KEY_FILE, "utf8"));
  const sessionSecret = loadSessionSecret();

  const accountData = await gql(
    sessionSecret,
    `query($fullName: String!) {
      app { byFullName(fullName: $fullName) {
        id
        ownerAccount { id name }
        androidAppCredentials(filter: { applicationIdentifier: "${ANDROID_PACKAGE}" }) {
          id
          googleServiceAccountKeyForFcmV1 { id clientEmail }
        }
      }}
    }`,
    { fullName: PROJECT_FULL_NAME }
  );

  const app = accountData?.app?.byFullName;
  if (!app?.id) throw new Error(`App not found: ${PROJECT_FULL_NAME}`);

  const accountId = app.ownerAccount.id;
  let creds = app.androidAppCredentials?.[0] ?? null;

  if (creds?.googleServiceAccountKeyForFcmV1?.id) {
    console.log("FCM V1 already assigned:", creds.googleServiceAccountKeyForFcmV1.clientEmail);
    return;
  }

  const createKey = await gql(
    sessionSecret,
    `mutation($accountId: ID!, $jsonKey: JSONObject!) {
      googleServiceAccountKey {
        createGoogleServiceAccountKey(
          accountId: $accountId
          googleServiceAccountKeyInput: { jsonKey: $jsonKey }
        ) { id clientEmail projectIdentifier }
      }
    }`,
    { accountId, jsonKey }
  );

  const key = createKey.googleServiceAccountKey.createGoogleServiceAccountKey;
  console.log("Uploaded key:", key.clientEmail, key.projectIdentifier);

  if (!creds?.id) {
    const createCreds = await gql(
      sessionSecret,
      `mutation($appId: ID!, $applicationIdentifier: String!) {
        androidAppCredentials {
          createAndroidAppCredentials(
            appId: $appId
            applicationIdentifier: $applicationIdentifier
            androidAppCredentialsInput: {}
          ) { id }
        }
      }`,
      { appId: app.id, applicationIdentifier: ANDROID_PACKAGE }
    );
    creds = { id: createCreds.androidAppCredentials.createAndroidAppCredentials.id };
  }

  await gql(
    sessionSecret,
    `mutation($androidAppCredentialsId: ID!, $googleServiceAccountKeyId: ID!) {
      androidAppCredentials {
        setGoogleServiceAccountKeyForFcmV1(
          id: $androidAppCredentialsId
          googleServiceAccountKeyId: $googleServiceAccountKeyId
        ) { id googleServiceAccountKeyForFcmV1 { id clientEmail } }
      }
    }`,
    {
      androidAppCredentialsId: creds.id,
      googleServiceAccountKeyId: key.id,
    }
  );

  console.log("Done. FCM V1 assigned to", ANDROID_PACKAGE);
  console.log("Next: Android app logout -> login, then test push.");
}

main().catch((e) => {
  console.error("upload-fcm-v1 failed:", e.message);
  process.exit(1);
});
