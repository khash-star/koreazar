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
import { getAllUsers } from "./authService";
import { normalizeEmail } from "../utils/emailNormalize.js";
import { checkBannedContent } from "../utils/bannedContent.js";

function convertTimestamp(value) {
  if (!value) return value;
  if (value && typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  if (value.seconds !== undefined) {
    return new Date(value.seconds * 1000 + (value.nanoseconds || 0) / 1e6);
  }
  return value;
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
  return querySnapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      created_date: convertTimestamp(data.created_date),
      last_message_date: convertTimestamp(data.last_message_date),
    };
  });
}

export async function createConversation(data) {
  const convsRef = collection(db, "conversations");
  const convData = {
    ...data,
    participant_1: normalizeEmail(data.participant_1),
    participant_2: normalizeEmail(data.participant_2),
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
  const data = convSnap.data();
  return {
    id: convSnap.id,
    ...data,
    created_date: convertTimestamp(data.created_date),
    last_message_date: convertTimestamp(data.last_message_date),
  };
}

export async function findConversation(email1, email2) {
  const a = normalizeEmail(email1);
  const b = normalizeEmail(email2);
  const convsRef = collection(db, "conversations");
  const q1 = query(convsRef, where("participant_1", "==", a), where("participant_2", "==", b));
  const q2 = query(convsRef, where("participant_1", "==", b), where("participant_2", "==", a));
  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  if (!snap1.empty) {
    const d = snap1.docs[0];
    return { id: d.id, ...d.data() };
  }
  if (!snap2.empty) {
    const d = snap2.docs[0];
    return { id: d.id, ...d.data() };
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

  // 1) Яриаг устгаад жагсаалтаас шууд алга болгоно.
  // 2) Мессежүүдийг best-effort хэлбэрээр араас нь устгана (permission асуудалтай үед
  //    UI удаан хүлээлгэхгүй байхын тулд).
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

/** Query-д илгээх имэйлийн хувилбарууд (хуучин өгөгдөл өөр регистртэй байж болно) */
/** filterConversations аль хэдийн participant имэйлийг normalize хийдэг тул зөвхөн нэг хувилбараар асуулгана. */
export function emailQueryVariants(email) {
  const em = normalizeEmail(email);
  return em ? [em] : [];
}

/** Хэрэглэгчийн уншаагүй мессежийн нийт тоо */
export async function getUnreadMessagesCount(email) {
  if (!email) return 0;
  try {
    const variants = emailQueryVariants(email);
    const batches = await Promise.all(
      variants.map(async (em) => {
        const [conv1, conv2] = await Promise.all([
          filterConversations({ participant_1: em }),
          filterConversations({ participant_2: em }),
        ]);
        return { conv1, conv2 };
      })
    );
    const seen = new Set();
    let total = 0;
    for (const { conv1, conv2 } of batches) {
      for (const c of [...conv1, ...conv2]) {
        if (!c?.id || seen.has(c.id)) continue;
        seen.add(c.id);
        const me = normalizeEmail(email);
        const p1 = normalizeEmail(c.participant_1);
        total += p1 === me ? c.unread_count_p1 || 0 : c.unread_count_p2 || 0;
      }
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
