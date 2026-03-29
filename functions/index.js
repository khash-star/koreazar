/**
 * Шинэ мессеж (messages onCreate) үед хүлээн авагчийн Expo push token руу мэдэгдэл илгээнэ (дуу: default).
 * Deploy: Blaze төлөвлөгөө + `firebase deploy --only functions`
 */
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");

initializeApp();
const db = getFirestore();

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

function normalizeEmail(v) {
  if (typeof v !== "string") return "";
  return v.trim().toLowerCase();
}

function truncateBody(text, max = 120) {
  if (typeof text !== "string") return "Мессеж ирлээ";
  const one = text.replace(/\s+/g, " ").trim();
  if (one.length <= max) return one || "Мессеж ирлээ";
  return `${one.slice(0, max - 1)}…`;
}

exports.notifyNewMessage = onDocumentCreated(
  {
    document: "messages/{messageId}",
    region: "asia-northeast3",
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const data = snap.data();
    const receiver = normalizeEmail(data.receiver_email);
    const sender = normalizeEmail(data.sender_email);
    if (!receiver || receiver === sender) return;

    const usersSnap = await db.collection("users").where("email", "==", receiver).limit(10).get();
    if (usersSnap.empty) return;

    const tokens = new Set();
    usersSnap.forEach((docSnap) => {
      const raw = docSnap.get("expo_push_tokens");
      if (!Array.isArray(raw)) return;
      raw.forEach((t) => {
        if (typeof t === "string" && t.trim().length > 0) tokens.add(t.trim());
      });
    });

    if (tokens.size === 0) return;

    const conversationId = data.conversation_id != null ? String(data.conversation_id) : "";
    const body = truncateBody(data.message);
    const messages = [...tokens].map((to) => ({
      to,
      title: "Шинэ мессеж",
      body,
      sound: "default",
      priority: "high",
      channelId: "messages",
      data: {
        type: "chat",
        conversationId,
      },
    }));

    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages }),
      });
      if (!res.ok) {
        console.error("Expo push HTTP", res.status, await res.text());
      }
    } catch (e) {
      console.error("Expo push fetch failed", e?.message);
    }
  }
);
