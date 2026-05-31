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
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { ensureUserDocEmailForFirestoreRules, getAllUsers, getResolvedAuthEmail } from "./authService";
import { getUserByEmail } from "./userProfileService";
import { normalizeEmail, phoneToAuthEmail } from "../utils/emailNormalize.js";
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

async function resolveUidForChatEmail(email) {
  const em = normalizeEmail(email);
  if (!em) return null;
  const u = auth.currentUser;
  if (u?.uid) {
    const myEmail = await getResolvedAuthEmail(u);
    if (normalizeEmail(myEmail) === em) return u.uid;
  }
  const profile = await getUserByEmail(em);
  return profile?.id || null;
}

async function buildParticipantUids(email1, email2) {
  const uidSet = new Set();
  if (auth.currentUser?.uid) uidSet.add(auth.currentUser.uid);
  const [u1, u2] = await Promise.all([
    resolveUidForChatEmail(email1),
    resolveUidForChatEmail(email2),
  ]);
  if (u1) uidSet.add(u1);
  if (u2) uidSet.add(u2);
  return [...uidSet];
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
        if ((p1 === a && p2 === b) || (p1 === b && p2 === a)) {
          return row;
        }
      }
    } catch (e) {
      if (!isFirestorePermissionDenied(e)) throw e;
    }
  }

  const convsRef = collection(db, "conversations");
  try {
    const q1 = query(convsRef, where("participant_1", "==", a), where("participant_2", "==", b));
    const q2 = query(convsRef, where("participant_1", "==", b), where("participant_2", "==", a));
    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    if (!snap1.empty) return mapConversationDoc(snap1.docs[0]);
    if (!snap2.empty) return mapConversationDoc(snap2.docs[0]);
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
  const docRef = await addDoc(messagesRef, messageData);
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

export function emailQueryVariants(email) {
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

async function ensureCurrentUidOnConversations(conversations) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const tasks = [];
  for (const c of conversations) {
    if (!c?.id) continue;
    const uids = Array.isArray(c.participant_uids) ? c.participant_uids : [];
    if (uids.includes(uid)) continue;
    tasks.push(
      updateDoc(doc(db, "conversations", c.id), {
        participant_uids: [...new Set([...uids, uid])],
      }).catch(() => {})
    );
  }
  if (tasks.length) await Promise.all(tasks);
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
      total += p1 === me ? c.unread_count_p1 || 0 : c.unread_count_p2 || 0;
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

  const users = await getAllUsers();
  const targets = users.filter((u) => {
    const email = String(u?.email || "").trim().toLowerCase();
    if (!email) return false;
    if (email === String(adminEmail).trim().toLowerCase()) return false;
    return true;
  });

  let successCount = 0;
  let failCount = 0;
  for (const user of targets) {
    try {
      const receiver = String(user.email).trim().toLowerCase();
      let conv = await findConversation(adminEmail, receiver);
      if (!conv) {
        const iso = new Date().toISOString();
        conv = await createConversation({
          participant_1: adminEmail,
          participant_2: receiver,
          last_message: "",
          last_message_time: iso,
          last_message_sender: adminEmail,
          unread_count_p1: 0,
          unread_count_p2: 0,
        });
      }

      await createMessage(
        {
          conversation_id: conv.id,
          sender_email: adminEmail,
          receiver_email: receiver,
          message: text,
          is_read: false,
        },
        { skipBannedCheck: true }
      );

      const convLatest = await getConversation(conv.id);
      const adminN = normalizeEmail(adminEmail);
      const p1 = normalizeEmail(convLatest?.participant_1);
      const prev =
        p1 === adminN ? convLatest?.unread_count_p2 || 0 : convLatest?.unread_count_p1 || 0;
      const unreadKey = p1 === adminN ? "unread_count_p2" : "unread_count_p1";

      await updateConversation(conv.id, {
        last_message: text,
        last_message_date: Timestamp.now(),
        last_message_time: new Date().toISOString(),
        last_message_sender: adminN,
        [unreadKey]: prev + 1,
      });

      successCount += 1;
    } catch {
      failCount += 1;
    }
  }

  return { successCount, failCount, total: targets.length };
}
