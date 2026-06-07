// Conversation & Message Service - Firestore CRUD operations
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  limit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import { convertTimestamp } from '@/utils/firestoreDates';
import { checkBannedContent } from '@/utils/bannedContent';
import { normalizeEmail, phoneToAuthEmail, areEmailVariants, emailQueryVariants, emailsMatch } from '@/utils/emailNormalize';
import { getUserByEmail } from '@/services/authService';

async function resolveUidForChatEmail(email, hintUid = null) {
  if (hintUid) return hintUid;
  const em = normalizeEmail(email);
  if (!em) return null;
  const u = auth.currentUser;
  if (u?.uid) {
    let myEmail = normalizeEmail(u.email);
    if (!myEmail) {
      try {
        const snap = await getDoc(doc(db, 'users', u.uid));
        if (snap.exists()) myEmail = normalizeEmail(snap.data()?.email);
      } catch {
        /* ignore */
      }
    }
    if (!myEmail && u.phoneNumber) {
      myEmail = normalizeEmail(phoneToAuthEmail(u.phoneNumber));
    }
    if (myEmail === em || areEmailVariants(myEmail, em)) return u.uid;
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

export function isFirestorePermissionDenied(err) {
  if (err == null) return false;
  const code = err.code;
  if (code === 'permission-denied' || code === 'firestore/permission-denied') return true;
  const msg = String(err.message ?? (typeof err.toString === 'function' ? err.toString() : '') ?? '')
    .toLowerCase();
  return msg.includes('missing or insufficient permissions') || msg.includes('permission-denied');
}

function isRecoverableConversationListError(err) {
  if (isFirestorePermissionDenied(err)) return true;
  const code = String(err?.code || '');
  return code === 'failed-precondition' || code === 'firestore/failed-precondition';
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

function pushConversationRowsFromSnap(docs, rows) {
  const seen = new Set(rows.map((r) => r.id));
  for (const d of docs) {
    if (seen.has(d.id)) continue;
    seen.add(d.id);
    rows.push(mapConversationDoc(d));
  }
}

/**
 * Чатын participant query-д ашиглах имэйл: Auth token-д байхгүй тохиолдолд users/{uid}.email (Firestore дүрэмтэй ижил).
 */
export async function resolveChatParticipantEmail() {
  if (typeof auth.authStateReady === 'function') {
    await auth.authStateReady();
  }
  const u = auth.currentUser;
  if (!u) return '';
  const fromAuth = normalizeEmail(u.email);
  if (fromAuth) return fromAuth;
  let phone = u.phoneNumber || '';
  try {
    const snap = await getDoc(doc(db, 'users', u.uid));
    if (snap.exists()) {
      const d = snap.data();
      const em = normalizeEmail(d?.email);
      if (em) return em;
      phone = phone || d?.phone || d?.phoneNumber || '';
    }
  } catch (e) {
    console.warn('resolveChatParticipantEmail:', e?.message);
  }
  if (phone) {
    return normalizeEmail(phoneToAuthEmail(phone)) || '';
  }
  return '';
}

// Conversations
export const listConversations = async () => {
  try {
    const email = await resolveChatParticipantEmail();
    const uid = auth.currentUser?.uid || null;
    if (!email && !uid) return [];
    const convsRef = collection(db, 'conversations');
    const seen = new Set();
    const rows = [];

    const pushRows = (items) => {
      for (const c of items) {
        if (!c?.id || seen.has(c.id)) continue;
        seen.add(c.id);
        rows.push(c);
      }
    };

    if (uid) {
      try {
        const uidQ = query(convsRef, where('participant_uids', 'array-contains', uid));
        const uidSnap = await getDocs(uidQ);
        pushConversationRowsFromSnap(uidSnap.docs, rows);
      } catch (e) {
        if (!isRecoverableConversationListError(e)) throw e;
      }
    }

    if (email) {
      for (const em of emailQueryVariants(email)) {
        try {
          const q1 = query(
            convsRef,
            where('participant_1', '==', em),
            orderBy('last_message_date', 'desc')
          );
          const q2 = query(
            convsRef,
            where('participant_2', '==', em),
            orderBy('last_message_date', 'desc')
          );
          const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
          pushRows([...snap1.docs, ...snap2.docs].map(mapConversationDoc));
        } catch (e) {
          if (!isFirestorePermissionDenied(e)) throw e;
        }
      }
    }

    await ensureCurrentUidOnConversations(rows);

    rows.sort((a, b) => {
      const ta = a.last_message_date?.getTime?.() || 0;
      const tb = b.last_message_date?.getTime?.() || 0;
      return tb - ta;
    });
    return rows;
  } catch (error) {
    if (isFirestorePermissionDenied(error)) {
      return [];
    }
    console.error('Error listing conversations:', error);
    throw error;
  }
};

/** Нэвтэрсэн хэрэглэгчийн нийт unread */
export async function getUnreadMessagesCount() {
  const me = await resolveChatParticipantEmail();
  if (!me) return 0;
  const rows = await listConversations();
  let total = 0;
  for (const c of rows) {
    total += emailsMatch(c.participant_1, me) ? (c.unread_count_p1 || 0) : (c.unread_count_p2 || 0);
  }
  return total;
}

export const filterConversations = async (filters = {}) => {
  try {
    const convsRef = collection(db, 'conversations');
    const conditions = [];

    const normKeys = new Set(['participant_1', 'participant_2', 'last_message_sender']);
    Object.keys(filters).forEach((key) => {
      let v = filters[key];
      if (v === undefined || v === null || v === '') return;
      if (normKeys.has(key)) v = normalizeEmail(v);
      conditions.push(where(key, '==', v));
    });

    if (conditions.length === 0) {
      return [];
    }

    const q = query(convsRef, ...conditions, orderBy('last_message_date', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_date: convertTimestamp(data.created_date),
        last_message_date: convertTimestamp(data.last_message_date)
      };
    });
  } catch (error) {
    if (!isFirestorePermissionDenied(error)) {
      console.error('Error filtering conversations:', error);
    }
    throw error;
  }
};

export const createConversation = async (data) => {
  try {
    const convsRef = collection(db, 'conversations');
    const p1 = normalizeEmail(data.participant_1);
    const p2 = normalizeEmail(data.participant_2);
    const participant_uids = await buildParticipantUids(p1, p2);
    const convData = {
      ...data,
      participant_1: p1,
      participant_2: p2,
      participant_uids,
      last_message_sender:
        data.last_message_sender != null ? normalizeEmail(data.last_message_sender) : '',
      created_date: Timestamp.now(),
      last_message_date: Timestamp.now(),
      unread_count_p1: data.unread_count_p1 ?? 0,
      unread_count_p2: data.unread_count_p2 ?? 0,
    };
    
    const docRef = await addDoc(convsRef, convData);
    
    return {
      id: docRef.id,
      ...convData
    };
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

export const updateConversation = async (id, data) => {
  try {
    const convRef = doc(db, 'conversations', id);
    await updateDoc(convRef, data);
  } catch (error) {
    console.error('Error updating conversation:', error);
    throw error;
  }
};

export const getConversation = async (id) => {
  try {
    const convRef = doc(db, 'conversations', id);
    const convSnap = await getDoc(convRef);
    
    if (convSnap.exists()) {
      const data = convSnap.data();
      return {
        id: convSnap.id,
        ...data,
        created_date: convertTimestamp(data.created_date),
        last_message_date: convertTimestamp(data.last_message_date)
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting conversation:', error);
    throw error;
  }
};

// Find conversation between two participants
export const findConversation = async (email1, email2) => {
  try {
    const a = normalizeEmail(email1);
    const b = normalizeEmail(email2);
    if (!a || !b) return null;
    const uid = auth.currentUser?.uid;

    if (uid) {
      try {
        const q = query(
          collection(db, 'conversations'),
          where('participant_uids', 'array-contains', uid)
        );
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          const data = d.data();
          const p1 = normalizeEmail(data.participant_1);
          const p2 = normalizeEmail(data.participant_2);
          if ((emailsMatch(p1, a) && emailsMatch(p2, b)) || (emailsMatch(p1, b) && emailsMatch(p2, a))) {
            return { id: d.id, ...data };
          }
        }
      } catch (e) {
        if (!isFirestorePermissionDenied(e)) throw e;
      }
    }

    const convsRef = collection(db, 'conversations');
    for (const av of emailQueryVariants(a)) {
      for (const bv of emailQueryVariants(b)) {
        const q1 = query(convsRef, where('participant_1', '==', av), where('participant_2', '==', bv));
        const q2 = query(convsRef, where('participant_1', '==', bv), where('participant_2', '==', av));
        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

        if (!snap1.empty) {
          return mapConversationDoc(snap1.docs[0]);
        }
        if (!snap2.empty) {
          return mapConversationDoc(snap2.docs[0]);
        }
      }
    }
    
    return null;
  } catch (error) {
    if (isFirestorePermissionDenied(error)) return null;
    console.error('Error finding conversation:', error);
    throw error;
  }
};

// Messages
export const listMessages = async (conversationId, limitCount = 100) => {
  try {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('conversation_id', '==', conversationId),
      orderBy('created_date', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_date: convertTimestamp(data.created_date)
      };
    }).reverse(); // Oldest first
  } catch (error) {
    console.error('Error listing messages:', error);
    throw error;
  }
};

/**
 * @param {object} data
 * @param {{ skipBannedCheck?: boolean }} [options] — зөвхөн дотоод (админ broadcast) дамжуулалтад true
 */
export const createMessage = async (data, options = {}) => {
  try {
    if (!options.skipBannedCheck) {
      const msgText = typeof data.message === 'string' ? data.message : '';
      if (checkBannedContent(msgText).blocked) {
        throw new Error('Мессежид зохисгүй үг агуулагдсан байна. Өөрөөр бичнэ үү.');
      }
    }
    const messagesRef = collection(db, 'messages');
    const messageData = {
      ...data,
      sender_email: normalizeEmail(data.sender_email),
      receiver_email: normalizeEmail(data.receiver_email),
      created_date: Timestamp.now(),
      is_read: data.is_read !== undefined ? data.is_read : false
    };
    
    const docRef = await addDoc(messagesRef, messageData);
    
    const result = {
      id: docRef.id,
      ...messageData,
      created_date: messageData.created_date.toDate() // Convert for easier use in components
    };
    
    return result;
  } catch (error) {
    console.error('Error creating message:', error);
    throw error;
  }
};

export const updateMessage = async (id, data) => {
  try {
    const messageRef = doc(db, 'messages', id);
    await updateDoc(messageRef, data);
  } catch (error) {
    console.error('Error updating message:', error);
    throw error;
  }
};

export const deleteMessage = async (messageId) => {
  if (!messageId) throw new Error('Мессежийн ID байхгүй');
  await deleteDoc(doc(db, 'messages', String(messageId)));
};

/** Яриа болон түүний бүх мессежийг устгана */
export const deleteConversationAndMessages = async (conversationId) => {
  const user = auth.currentUser;
  if (!user?.uid) throw new Error('Нэвтэрнэ үү');
  await user.getIdToken(true);

  const cid = String(conversationId ?? '').trim();
  if (!cid) throw new Error('Ярианы ID байхгүй');

  const convRef = doc(db, 'conversations', cid);

  // 1) Яриаг эхэлж устгаад жагсаалтаас шууд алга болгоно.
  // 2) Мессежүүдийг best-effort хэлбэрээр араас нь устгана.
  await deleteDoc(convRef);

  void (async () => {
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(messagesRef, where('conversation_id', '==', cid));
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
};

/** Устгасны дараа ярианы урьдчилгааг үлдсэн мессежүүдээс тохируулна */
export const syncConversationLastMessageFromMessages = async (conversationId) => {
  const list = await listMessages(conversationId, 200);
  if (!list.length) {
    await updateConversation(conversationId, {
      last_message: '',
      last_message_date: Timestamp.now(),
      last_message_time: new Date().toISOString(),
      last_message_sender: ''
    });
    return;
  }
  const last = list[list.length - 1];
  await updateConversation(conversationId, {
    last_message: String(last.message ?? ''),
    last_message_date: Timestamp.now(),
    last_message_time:
      last.created_date instanceof Date
        ? last.created_date.toISOString()
        : new Date().toISOString(),
    last_message_sender: last.sender_email || ''
  });
};

export const getMessage = async (id) => {
  try {
    const messageRef = doc(db, 'messages', id);
    const messageSnap = await getDoc(messageRef);
    
    if (messageSnap.exists()) {
      const data = messageSnap.data();
      return {
        id: messageSnap.id,
        ...data,
        created_date: convertTimestamp(data.created_date)
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting message:', error);
    throw error;
  }
};

// Saved Listings
export const listSavedListings = async (filters = {}) => {
  try {
    const savedRef = collection(db, 'saved_listings');
    const conditions = [];
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        conditions.push(where(key, '==', filters[key]));
      }
    });
    
    const q = query(savedRef, ...conditions);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error listing saved listings:', error);
    throw error;
  }
};

export const createSavedListing = async (data) => {
  try {
    const savedRef = collection(db, 'saved_listings');
    const savedData = {
      ...data,
      created_date: Timestamp.now()
    };
    
    const docRef = await addDoc(savedRef, savedData);
    
    return {
      id: docRef.id,
      ...savedData
    };
  } catch (error) {
    console.error('Error creating saved listing:', error);
    throw error;
  }
};

export const deleteSavedListing = async (id) => {
  try {
    const savedRef = doc(db, 'saved_listings', id);
    await deleteDoc(savedRef);
  } catch (error) {
    console.error('Error deleting saved listing:', error);
    throw error;
  }
};

/**
 * Бүх хэрэглэгчдэд мессеж явуулах (зөвхөн админ)
 * @param {string} adminEmail - Админий имэйл
 * @param {string} message - Мессежийн агуулга
 * @returns {Promise<Object>} Амжилттай илгээсэн мессежүүдийн тоо
 */
export const sendMessageToAllUsers = async (adminEmail, message) => {
  try {
    const { getAllUsers } = await import('@/services/authService');
    const users = await getAllUsers();
    const adminN = normalizeEmail(adminEmail);
    const adminUid = auth.currentUser?.uid || null;
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of users) {
      if (normalizeEmail(user.email) === adminN) continue;
      
      try {
        const receiver = normalizeEmail(user.email);
        const receiverUid = user.id || null;
        let conversation = await findConversation(adminN, receiver);
        
        if (!conversation) {
          conversation = await createConversation({
            participant_1: adminN,
            participant_2: receiver,
            last_message: '',
            last_message_time: new Date().toISOString(),
            last_message_sender: adminN,
            unread_count_p1: 0,
            unread_count_p2: 0,
          });
        }

        conversation = await repairConversationParticipants(conversation, {
          meEmail: adminN,
          meUid: adminUid,
          participantUid1: adminUid,
          participantUid2: receiverUid,
        });
        
        await createMessage(
          {
            conversation_id: conversation.id,
            sender_email: adminN,
            receiver_email: receiver,
            message: message,
            is_read: false,
          },
          { skipBannedCheck: true }
        );

        await updateConversationAfterMessage({
          conversationId: conversation.id,
          conversation,
          senderEmail: adminN,
          receiverEmail: receiver,
          messageText: message,
          senderUid: adminUid,
          receiverUid,
        });
        
        successCount++;
      } catch (error) {
        console.error(`Error sending message to ${user.email}:`, error);
        errorCount++;
      }
    }
    
    return {
      successCount,
      errorCount,
      totalUsers: users.length - 1
    };
  } catch (error) {
    console.error('Error sending messages to all users:', error);
    throw error;
  }
};

export async function repairConversationParticipants(conversation, options = {}) {
  const uid = options.meUid || auth.currentUser?.uid;
  if (!conversation?.id || !uid) return conversation;

  let meEmail = normalizeEmail(options.meEmail || '');
  if (!meEmail && auth.currentUser) {
    meEmail = normalizeEmail(await resolveChatParticipantEmail());
  }

  const p1 = normalizeEmail(conversation.participant_1);
  const p2 = normalizeEmail(conversation.participant_2);
  let newP1 = p1;
  let newP2 = p2;
  if (meEmail) {
    if (areEmailVariants(p1, meEmail)) newP1 = meEmail;
    if (areEmailVariants(p2, meEmail)) newP2 = meEmail;
  }

  const knownUids = [options.participantUid1, options.participantUid2, uid].filter(Boolean);
  const participant_uids = await buildParticipantUids(newP1, newP2, knownUids);

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
    await updateDoc(doc(db, 'conversations', conversation.id), patch);
    return { ...conversation, ...patch };
  } catch {
    return conversation;
  }
}

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
  if (!conv?.id) throw new Error('Яриа олдсонгүй');

  const sender = normalizeEmail(senderEmail);
  const receiver = normalizeEmail(receiverEmail);
  const p1 = normalizeEmail(conv.participant_1);
  const p2 = normalizeEmail(conv.participant_2);

  const resolvedSenderUid = senderUid || auth.currentUser?.uid || null;
  const resolvedReceiverUid = receiverUid || (await resolveUidForChatEmail(receiver));
  const knownUids = [resolvedSenderUid, resolvedReceiverUid].filter(Boolean);
  const participant_uids = await buildParticipantUids(p1, p2, knownUids);

  const senderIsP1 = areEmailVariants(p1, sender) || p1 === sender;
  const unreadKey = senderIsP1 ? 'unread_count_p2' : 'unread_count_p1';
  const prevUnread = senderIsP1 ? conv.unread_count_p2 || 0 : conv.unread_count_p1 || 0;
  const now = Timestamp.now();
  const iso = new Date().toISOString();

  const patch = {
    participant_1: pickCanonicalParticipantEmail(
      p1,
      senderIsP1 ? sender : areEmailVariants(p1, receiver) ? receiver : ''
    ),
    participant_2: pickCanonicalParticipantEmail(
      p2,
      !senderIsP1 ? sender : areEmailVariants(p2, receiver) ? receiver : ''
    ),
    participant_uids: [...new Set(participant_uids)],
    last_message: String(messageText ?? ''),
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

