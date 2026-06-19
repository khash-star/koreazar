/**
 * Вэбийн @/services/conversationService-тай ижил Firestore загвар (conversations, messages).
 */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { ensureUserDocEmailForFirestoreRules, getAllUsers, getResolvedAuthEmail } from "./authService";
import { getUserByEmail } from "./userProfileService";
import { normalizeEmail, areEmailVariants, emailQueryVariants } from "../utils/emailNormalize.js";
import { checkBannedContent } from "../utils/bannedContent.js";

export function isFirestorePermissionDenied(err) {
  if (err == null) return false;
  const code = err?.code;
  if (code === "permission-denied" || code === "firestore/permission-denied") return true;
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("missing or insufficient permissions") || msg.includes("permission-denied");
}

/** UID query алдаа гарвал имэйл query руу шилжих (index, permission). */
function isRecoverableConversationListError(err) {
  if (isFirestorePermissionDenied(err)) return true;
  const code = String(err?.code || "");
  return code === "failed-precondition" || code === "firestore/failed-precondition";
}

/** Firestore rules authEmailLower()-тай ижил имэйл — чат query-ийн өмнө заавал. */
export async function resolveChatParticipantEmail() {
  if (typeof auth.authStateReady === "function") {
    try {
      await auth.authStateReady();
    } catch {
      /* ignore */
    }
  }
  const u = auth.currentUser;
  if (!u?.uid) return "";
  try {
    await u.getIdToken(true);
  } catch {
    /* ignore */
  }
  await ensureUserDocEmailForFirestoreRules(u);
  return getResolvedAuthEmail(u);
}

function convertTimestamp(value) {
  if (!value) return value;
  if (value && typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  if (value.seconds !== undefined) {
    return new Date(value.seconds * 1000 + (value.nanoseconds || 0) / 1e6);
  }
  return value;
}

function mapConversationDoc(d) {
  const data = d.data();
  return {
    id: d.id,
    ...data,
    created_date: convertTimestamp(data.created_date),
    last_message_date: convertTimestamp(data.last_message_date),
  };
}

async function resolveUidForChatEmail(email, hintUid = null) {
  if (hintUid) return hintUid;
  const em = normalizeEmail(email);
  if (!em) return null;
  const u = auth.currentUser;
  if (u?.uid) {
    const myEmail = await getResolvedAuthEmail(u);
    if (normalizeEmail(myEmail) === em || areEmailVariants(myEmail, em)) return u.uid;
  }
  for (const variant of emailQueryVariants(em)) {
    const profile = await getUserByEmail(variant);
    if (profile?.id) return profile.id;
  }
  return null;
}

async function buildParticipantUids(email1, email2, knownUids = []) {
  const uidSet = new Set(knownUids.filter(Boolean));
  if (auth.currentUser?.uid) uidSet.add(auth.currentUser.uid);
  const [u1, u2] = await Promise.all([
    resolveUidForChatEmail(email1),
    resolveUidForChatEmail(email2),
  ]);
  if (u1) uidSet.add(u1);
  if (u2) uidSet.add(u2);
  return [...uidSet];
}

function pickCanonicalParticipantEmail(stored, canonical) {
  const storedNorm = normalizeEmail(stored);
  const canonicalNorm = normalizeEmail(canonical);
  if (!canonicalNorm) return storedNorm;
  if (!storedNorm) return canonicalNorm;
  if (storedNorm === canonicalNorm || areEmailVariants(storedNorm, canonicalNorm)) {
    return canonicalNorm;
  }
  return storedNorm;
}

function participantEmailMatches(left, right) {
  const a = normalizeEmail(left);
  const b = normalizeEmail(right);
  return !!a && !!b && (a === b || areEmailVariants(a, b));
}

function conversationParticipantsMatch(p1, p2, a, b) {
  return (
    (participantEmailMatches(p1, a) && participantEmailMatches(p2, b)) ||
    (participantEmailMatches(p1, b) && participantEmailMatches(p2, a))
  );
}

export async function filterConversations(filters = {}) {
  const convsRef = collection(db, "conversations");
  const conditions = [];
  const normKeys = new Set(["participant_1", "participant_2", "last_message_sender"]);
  Object.keys(filters).forEach((key) => {
    let v = filters[key];
    if (v === undefined || v === null || v === "") return;
    if (normKeys.has(key)) v = normalizeEmail(v);
    conditions.push(where(key, "==", v));
  });
  if (conditions.length === 0) {
    return [];
  }
  const q = query(convsRef, ...conditions, orderBy("last_message_date", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(mapConversationDoc);
}

/** Phone OTP + email — uid query (rules participant_uids) + legacy email queries. */
export async function listConversationsForCurrentUser() {
  const u = auth.currentUser;
  if (!u?.uid) return [];

  const chatEmail = await resolveChatParticipantEmail();
  if (chatEmail) {
    await ensureUserDocEmailForFirestoreRules(u, chatEmail);
  } else {
    await ensureUserDocEmailForFirestoreRules(u);
  }

  const rows = [];
  const seen = new Set();

  const pushRows = (items) => {
    for (const c of items) {
      if (!c?.id || seen.has(c.id)) continue;
      seen.add(c.id);
      rows.push(c);
    }
  };

  pushRows(await queryConversationsByUid(u.uid));

  const email = chatEmail || (await getResolvedAuthEmail(u));
  if (email) {
    for (const em of emailQueryVariants(email)) {
      try {
        const [conv1, conv2] = await Promise.all([
          filterConversations({ participant_1: em }),
          filterConversations({ participant_2: em }),
        ]);
        pushRows([...conv1, ...conv2]);
      } catch (e) {
        if (!isFirestorePermissionDenied(e)) throw e;
      }
    }
  }

  await ensureCurrentUidOnConversations(rows);

  rows.sort((a, b) => {
    const ta = new Date(a.last_message_time || a.last_message_date || 0).getTime();
    const tb = new Date(b.last_message_time || b.last_message_date || 0).getTime();
    return tb - ta;
  });
  return rows;
}

export async function createConversation(data) {
  const convsRef = collection(db, "conversations");
  const p1 = normalizeEmail(data.participant_1);
  const p2 = normalizeEmail(data.participant_2);
  const participant_uids = await buildParticipantUids(p1, p2);
  const convData = {
    ...data,
    participant_1: p1,
    participant_2: p2,
    participant_uids,
    last_message_sender: data.last_message_sender != null ? normalizeEmail(data.last_message_sender) : "",
    created_date: Timestamp.now(),
    last_message_date: Timestamp.now(),
    unread_count_p1: data.unread_count_p1 ?? 0,
    unread_count_p2: data.unread_count_p2 ?? 0,
  };
  const docRef = await addDoc(convsRef, convData);
  return { id: docRef.id, ...convData };
}

export async function updateConversation(id, data) {
  const convRef = doc(db, "conversations", id);
  await updateDoc(convRef, data);
}

export async function getConversation(id) {
  const convRef = doc(db, "conversations", id);
  const convSnap = await getDoc(convRef);
  if (!convSnap.exists()) return null;
  return mapConversationDoc(convSnap);
}

export async function findConversation(email1, email2) {
  const a = normalizeEmail(email1);
  const b = normalizeEmail(email2);
  if (!a || !b) return null;
  const uid = auth.currentUser?.uid;

  if (uid) {
    try {
      const q = query(
        collection(db, "conversations"),
        where("participant_uids", "array-contains", uid)
      );
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        const row = mapConversationDoc(d);
        const p1 = normalizeEmail(row.participant_1);
        const p2 = normalizeEmail(row.participant_2);
        if (conversationParticipantsMatch(p1, p2, a, b)) {
          return row;
        }
      }
    } catch (e) {
      if (!isFirestorePermissionDenied(e)) throw e;
    }
  }

  const convsRef = collection(db, "conversations");
  try {
    const seenPairs = new Set();
    const queryPair = async (p1, p2) => {
      const key = `${p1}\n${p2}`;
      if (seenPairs.has(key)) return null;
      seenPairs.add(key);
      const q = query(convsRef, where("participant_1", "==", p1), where("participant_2", "==", p2));
      const snap = await getDocs(q);
      return snap.empty ? null : mapConversationDoc(snap.docs[0]);
    };

    for (const av of emailQueryVariants(a)) {
      for (const bv of emailQueryVariants(b)) {
        const direct = await queryPair(av, bv);
        if (direct) return direct;
        const reverse = await queryPair(bv, av);
        if (reverse) return reverse;
      }
    }
  } catch (e) {
    if (isFirestorePermissionDenied(e)) return null;
    throw e;
  }
  return null;
}

export async function listMessages(conversationId, limitCount = 100) {
  const messagesRef = collection(db, "messages");
  const q = query(
    messagesRef,
    where("conversation_id", "==", conversationId),
    orderBy("created_date", "desc"),
    limit(limitCount)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        created_date: convertTimestamp(data.created_date),
      };
    })
    .reverse();
}

/**
 * @param {object} data
 * @param {{ skipBannedCheck?: boolean }} [options] — админ broadcast зэрэг дотоод дамжуулалт
 */
export async function createMessage(data, options = {}) {
  if (!options.skipBannedCheck) {
    const msgText = typeof data.message === "string" ? data.message : "";
    if (checkBannedContent(msgText).blocked) {
      throw new Error("Мессежид зохисгүй үг агуулагдсан байна. Өөрөөр бичнэ үү.");
    }
  }
  const messagesRef = collection(db, "messages");
  const messageData = {
    ...data,
    sender_email: normalizeEmail(data.sender_email),
    receiver_email: normalizeEmail(data.receiver_email),
    created_date: Timestamp.now(),
    is_read: data.is_read !== undefined ? data.is_read : false,
  };
  const docRef = doc(messagesRef);
  try {
    await setDoc(docRef, messageData);
  } catch (e) {
    const code = String(e?.code || "");
    const msg = String(e?.message || "");
    if (code !== "already-exists" && !/already exists/i.test(msg)) {
      throw e;
    }
  }
  return {
    id: docRef.id,
    ...messageData,
    created_date: messageData.created_date.toDate(),
  };
}

export async function updateMessage(id, data) {
  const messageRef = doc(db, "messages", id);
  await updateDoc(messageRef, data);
}

/** Админ эсвэл илгээгч/хүлээн авагч (Firestore rules) */
export async function deleteMessage(messageId) {
  if (!messageId) throw new Error("Мессежийн ID байхгүй");
  await deleteDoc(doc(db, "messages", String(messageId)));
}

/** Яриа болон түүний бүх мессежийг устгана (жагсаалт дээрх «устгах»). */
export async function deleteConversationAndMessages(conversationId) {
  const user = auth.currentUser;
  if (!user?.uid) throw new Error("Нэвтэрнэ үү");
  await user.getIdToken(true);

  const cid = String(conversationId ?? "").trim();
  if (!cid) throw new Error("Ярианы ID байхгүй");

  const convRef = doc(db, "conversations", cid);

  await deleteDoc(convRef);

  void (async () => {
    try {
      const messagesRef = collection(db, "messages");
      const q = query(messagesRef, where("conversation_id", "==", cid));
      const snap = await getDocs(q);
      const docs = [...snap.docs];

      for (let i = 0; i < docs.length; i += 500) {
        const chunk = docs.slice(i, i + 500);
        const batch = writeBatch(db);
        chunk.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    } catch {
      // best-effort only
    }
  })();
}

/** Устгасны дараа ярианы сүүлийн мессежийн урьдчилгааг үлдсэн мессежүүдээс тохируулна */
export async function syncConversationLastMessageFromMessages(conversationId) {
  const list = await listMessages(conversationId, 200);
  if (!list.length) {
    await updateConversation(conversationId, {
      last_message: "",
      last_message_date: Timestamp.now(),
      last_message_time: new Date().toISOString(),
      last_message_sender: "",
    });
    return;
  }
  const last = list[list.length - 1];
  await updateConversation(conversationId, {
    last_message: String(last.message ?? ""),
    last_message_date: Timestamp.now(),
    last_message_time:
      last.created_date instanceof Date
        ? last.created_date.toISOString()
        : new Date().toISOString(),
    last_message_sender: normalizeEmail(last.sender_email || ""),
  });
}

export function emailQueryVariantsForChat(email) {
  return emailQueryVariants(email);
}

/**
 * participant_uids + phone email variant-ийг засах (push-аар нээгдсэн яриа list-д орохгүй case).
 * @returns {Promise<object|null>} patched conversation or original
 */
export async function repairConversationParticipants(conversation, options = {}) {
  const uid = options.meUid || auth.currentUser?.uid;
  if (!conversation?.id || !uid) return conversation;

  let meEmail = normalizeEmail(options.meEmail || "");
  if (!meEmail && auth.currentUser) {
    meEmail = normalizeEmail(await getResolvedAuthEmail(auth.currentUser));
  }

  const p1 = normalizeEmail(conversation.participant_1);
  const p2 = normalizeEmail(conversation.participant_2);
  let newP1 = p1;
  let newP2 = p2;
  if (meEmail) {
    if (areEmailVariants(p1, meEmail)) newP1 = meEmail;
    if (areEmailVariants(p2, meEmail)) newP2 = meEmail;
  }

  const extraUids = [options.participantUid1, options.participantUid2, uid].filter(Boolean);
  const participant_uids = await buildParticipantUids(newP1, newP2, extraUids);

  const patch = {
    participant_uids: [...new Set(participant_uids)],
  };
  if (newP1 && newP1 !== p1) patch.participant_1 = newP1;
  if (newP2 && newP2 !== p2) patch.participant_2 = newP2;

  const prevUids = Array.isArray(conversation.participant_uids) ? conversation.participant_uids : [];
  const uidsChanged =
    patch.participant_uids.length !== prevUids.length ||
    patch.participant_uids.some((id) => !prevUids.includes(id));
  const emailsChanged = patch.participant_1 != null || patch.participant_2 != null;
  if (!uidsChanged && !emailsChanged) return conversation;

  try {
    await updateDoc(doc(db, "conversations", conversation.id), patch);
    return { ...conversation, ...patch };
  } catch {
    return conversation;
  }
}

/** @deprecated use repairConversationParticipants */
export async function ensureCurrentUidOnConversation(conversation) {
  return repairConversationParticipants(conversation);
}

/** Мессеж илгээсний дараа conversation metadata + participant_uids шинэчлэх. */
export async function updateConversationAfterMessage({
  conversationId,
  conversation = null,
  senderEmail,
  receiverEmail,
  messageText,
  receiverUid = null,
  senderUid = null,
  incrementReceiverUnread = true,
}) {
  const conv = conversation || (await getConversation(conversationId));
  if (!conv?.id) throw new Error("Яриа олдсонгүй");

  const sender = normalizeEmail(senderEmail);
  const receiver = normalizeEmail(receiverEmail);
  const p1 = normalizeEmail(conv.participant_1);
  const p2 = normalizeEmail(conv.participant_2);

  const resolvedSenderUid = senderUid || auth.currentUser?.uid || null;
  const resolvedReceiverUid = receiverUid || (await resolveUidForChatEmail(receiver));
  const knownUids = [resolvedSenderUid, resolvedReceiverUid].filter(Boolean);
  const participant_uids = await buildParticipantUids(p1, p2, knownUids);

  const senderIsP1 = areEmailVariants(p1, sender) || p1 === sender;
  const unreadKey = senderIsP1 ? "unread_count_p2" : "unread_count_p1";
  const prevUnread = senderIsP1 ? conv.unread_count_p2 || 0 : conv.unread_count_p1 || 0;
  const now = Timestamp.now();
  const iso = new Date().toISOString();

  const patch = {
    participant_1: pickCanonicalParticipantEmail(
      p1,
      senderIsP1 ? sender : areEmailVariants(p1, receiver) ? receiver : ""
    ),
    participant_2: pickCanonicalParticipantEmail(
      p2,
      !senderIsP1 ? sender : areEmailVariants(p2, receiver) ? receiver : ""
    ),
    participant_uids: [...new Set(participant_uids)],
    last_message: String(messageText ?? ""),
    last_message_date: now,
    last_message_time: iso,
    last_message_sender: sender,
  };
  if (incrementReceiverUnread) {
    patch[unreadKey] = prevUnread + 1;
  }

  await updateConversation(conv.id, patch);
  return { ...conv, ...patch };
}

async function ensureCurrentUidOnConversations(conversations) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await Promise.all(
    conversations.map((c) => (c?.id ? repairConversationParticipants(c, { meUid: uid }) : null))
  );
}

async function queryConversationsByUid(uid) {
  const convsRef = collection(db, "conversations");
  const rows = [];

  try {
    const qSimple = query(convsRef, where("participant_uids", "array-contains", uid));
    pushRowsFromSnap((await getDocs(qSimple)).docs, rows);
  } catch (e) {
    if (!isRecoverableConversationListError(e)) throw e;
    console.warn("listConversations uid query (simple):", e?.code || e?.message || e);
  }

  if (rows.length === 0) {
    try {
      const qOrdered = query(
        convsRef,
        where("participant_uids", "array-contains", uid),
        orderBy("last_message_date", "desc")
      );
      pushRowsFromSnap((await getDocs(qOrdered)).docs, rows);
    } catch (e) {
      if (!isRecoverableConversationListError(e)) throw e;
      console.warn("listConversations uid query (ordered):", e?.code || e?.message || e);
    }
  }

  return rows;
}

function pushRowsFromSnap(docs, rows) {
  const seen = new Set(rows.map((r) => r.id));
  for (const d of docs) {
    if (seen.has(d.id)) continue;
    seen.add(d.id);
    rows.push(mapConversationDoc(d));
  }
}

/** Хэрэглэгчийн уншаагүй мессежийн нийт тоо */
export async function getUnreadMessagesCount(emailHint = "") {
  let email = normalizeEmail(emailHint);
  if (!email) {
    email = await resolveChatParticipantEmail();
  }
  if (!email) return 0;
  try {
    const convs = await listConversationsForCurrentUser();
    const me = normalizeEmail(email);
    let total = 0;
    for (const c of convs) {
      const p1 = normalizeEmail(c.participant_1);
      const imP1 = me && (p1 === me || areEmailVariants(p1, me));
      total += imP1 ? c.unread_count_p1 || 0 : c.unread_count_p2 || 0;
    }
    return total;
  } catch (_e) {
    return 0;
  }
}

/** Админ -> бүх хэрэглэгчдэд мессеж */
export async function sendMessageToAllUsers(adminEmail, message) {
  const text = String(message || "").trim();
  if (!adminEmail) throw new Error("Админ имэйл олдсонгүй");
  if (!text) throw new Error("Мессеж хоосон байна");

  const adminN = normalizeEmail(adminEmail);
  const adminUid = auth.currentUser?.uid || null;
  const users = await getAllUsers();
  const targets = users.filter((u) => {
    const email = String(u?.email || "").trim().toLowerCase();
    if (!email) return false;
    if (email === adminN) return false;
    return true;
  });

  let successCount = 0;
  let failCount = 0;
  for (const user of targets) {
    try {
      const receiver = normalizeEmail(user.email);
      const receiverUid = user.id || null;
      let conv = await findConversation(adminN, receiver);
      if (!conv) {
        const iso = new Date().toISOString();
        conv = await createConversation({
          participant_1: adminN,
          participant_2: receiver,
          last_message: "",
          last_message_time: iso,
          last_message_sender: adminN,
          unread_count_p1: 0,
          unread_count_p2: 0,
        });
      }

      conv = await repairConversationParticipants(conv, {
        meEmail: adminN,
        meUid: adminUid,
        participantUid1: adminUid,
        participantUid2: receiverUid,
      });

      await createMessage(
        {
          conversation_id: conv.id,
          sender_email: adminN,
          receiver_email: receiver,
          message: text,
          is_read: false,
        },
        { skipBannedCheck: true }
      );

      await updateConversationAfterMessage({
        conversationId: conv.id,
        conversation: conv,
        senderEmail: adminN,
        receiverEmail: receiver,
        messageText: text,
        senderUid: adminUid,
        receiverUid,
      });

      successCount += 1;
    } catch {
      failCount += 1;
    }
  }

  return { successCount, failCount, total: targets.length };
}
