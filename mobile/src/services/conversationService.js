/**
 * Вэбийн @/services/conversationService-тай ижил Firestore загвар (conversations, messages).
 */
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";

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
  Object.keys(filters).forEach((key) => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== "") {
      conditions.push(where(key, "==", filters[key]));
    }
  });
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
  const convsRef = collection(db, "conversations");
  const q1 = query(convsRef, where("participant_1", "==", email1), where("participant_2", "==", email2));
  const q2 = query(convsRef, where("participant_1", "==", email2), where("participant_2", "==", email1));
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

export async function createMessage(data) {
  const messagesRef = collection(db, "messages");
  const messageData = {
    ...data,
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

/** Хэрэглэгчийн уншаагүй мессежийн нийт тоо */
export async function getUnreadMessagesCount(email) {
  if (!email) return 0;
  try {
    const conv1 = await filterConversations({ participant_1: email });
    const conv2 = await filterConversations({ participant_2: email });
    const total =
      conv1.reduce((sum, c) => sum + (c.unread_count_p1 || 0), 0) +
      conv2.reduce((sum, c) => sum + (c.unread_count_p2 || 0), 0);
    return total;
  } catch (_e) {
    return 0;
  }
}
