const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");

initializeApp();
const db = getFirestore();

setGlobalOptions({ region: "asia-northeast3" });

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

function normalizeEmail(value) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
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
  const match = em.match(/^phone_(\d+)@phone\.zarkorea\.com$/);
  if (match) {
    const digits = match[1];
    if (digits.startsWith("82") && digits.length > 10) {
      out.add(`phone_${digits.slice(2)}@phone.zarkorea.com`);
      out.add(normalizeEmail(phoneToAuthEmail(`+${digits}`)));
    } else if (!digits.startsWith("82") && digits.length >= 9) {
      out.add(`phone_82${digits}@phone.zarkorea.com`);
      out.add(normalizeEmail(phoneToAuthEmail(`+82${digits}`)));
    }
  }
  return [...out].filter(Boolean);
}

function previewMessage(text) {
  const s = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return "Шинэ мессеж ирлээ";
  return s.length > 120 ? `${s.slice(0, 117)}...` : s;
}

/**
 * Resolve receiver Firebase uid from normalized chat email (email + phone synthetic).
 */
async function findUidByEmail(email) {
  const variants = emailQueryVariants(email);
  for (const em of variants) {
    const snap = await db.collection("users").where("email", "==", em).limit(1).get();
    if (!snap.empty) return snap.docs[0].id;
  }
  return null;
}

async function loadExpoTokensForUid(uid) {
  const snap = await db.collection("user_push_tokens").doc(uid).collection("devices").get();
  const rows = [];
  snap.forEach((docSnap) => {
    const token = docSnap.data()?.expo_push_token;
    if (typeof token === "string" && token.startsWith("ExponentPushToken")) {
      rows.push({ token, docRef: docSnap.ref });
    }
  });
  return rows;
}

async function sendExpoPushBatch(messages) {
  if (!messages.length) return [];
  const res = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.warn("Expo push HTTP", res.status, body.slice(0, 200));
    return [];
  }
  const json = await res.json();
  return Array.isArray(json?.data) ? json.data : [];
}

async function pruneInvalidTokens(tokenRows, tickets) {
  const tasks = [];
  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];
    if (ticket?.status !== "error") continue;
    const err = ticket?.details?.error;
    if (err !== "DeviceNotRegistered" && err !== "InvalidCredentials") continue;
    const row = tokenRows[i];
    if (row?.docRef) tasks.push(row.docRef.delete());
  }
  await Promise.all(tasks);
}

exports.onChatMessageCreatedPush = onDocumentCreated(
  {
    document: "messages/{messageId}",
    region: "asia-northeast3",
  },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const receiverEmail = normalizeEmail(data.receiver_email);
    const senderEmail = normalizeEmail(data.sender_email);
    if (!receiverEmail) return;
    if (receiverEmail === senderEmail) return;

    const receiverUid = await findUidByEmail(receiverEmail);
    if (!receiverUid) {
      console.log("chat push: no uid for receiver", receiverEmail);
      return;
    }

    const tokenRows = await loadExpoTokensForUid(receiverUid);
    if (!tokenRows.length) return;

    const conversationId = String(data.conversation_id || "").trim();
    const body = previewMessage(data.message);
    const title = "Шинэ мессеж";

    const expoMessages = tokenRows.map((row) => ({
      to: row.token,
      sound: "default",
      title,
      body,
      channelId: "chat",
      priority: "high",
      data: {
        type: "chat",
        conversation_id: conversationId,
        other_user_email: senderEmail,
      },
    }));

    const tickets = await sendExpoPushBatch(expoMessages);
    await pruneInvalidTokens(tokenRows, tickets);
  }
);
