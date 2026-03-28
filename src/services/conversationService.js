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
import { normalizeEmail } from '@/utils/emailNormalize';

export function isFirestorePermissionDenied(err) {
  if (err == null) return false;
  const code = err.code;
  if (code === 'permission-denied' || code === 'firestore/permission-denied') return true;
  const msg = String(err.message ?? (typeof err.toString === 'function' ? err.toString() : '') ?? '')
    .toLowerCase();
  return msg.includes('missing or insufficient permissions') || msg.includes('permission-denied');
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
  try {
    const snap = await getDoc(doc(db, 'users', u.uid));
    if (snap.exists()) {
      const em = normalizeEmail(snap.data()?.email);
      if (em) return em;
    }
  } catch (e) {
    console.warn('resolveChatParticipantEmail:', e?.message);
  }
  return '';
}

// Conversations
export const listConversations = async () => {
  try {
    const email = await resolveChatParticipantEmail();
    if (!email) return [];
    const convsRef = collection(db, 'conversations');
    const q1 = query(
      convsRef,
      where('participant_1', '==', email),
      orderBy('last_message_date', 'desc')
    );
    const q2 = query(
      convsRef,
      where('participant_2', '==', email),
      orderBy('last_message_date', 'desc')
    );
    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    const seen = new Set();
    const rows = [];
    for (const s of [snap1, snap2]) {
      s.docs.forEach((d) => {
        if (seen.has(d.id)) return;
        seen.add(d.id);
        const data = d.data();
        rows.push({
          id: d.id,
          ...data,
          created_date: convertTimestamp(data.created_date),
          last_message_date: convertTimestamp(data.last_message_date),
        });
      });
    }
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
    const p1 = normalizeEmail(c.participant_1);
    total += p1 === me ? (c.unread_count_p1 || 0) : (c.unread_count_p2 || 0);
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
    const convData = {
      ...data,
      participant_1: normalizeEmail(data.participant_1),
      participant_2: normalizeEmail(data.participant_2),
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
    const convsRef = collection(db, 'conversations');

    const q1 = query(convsRef, where('participant_1', '==', a), where('participant_2', '==', b));
    const q2 = query(convsRef, where('participant_1', '==', b), where('participant_2', '==', a));
    
    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    
    if (!snap1.empty) {
      const doc = snap1.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    if (!snap2.empty) {
      const doc = snap2.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    
    return null;
  } catch (error) {
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
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of users) {
      // Админд мессеж явуулахгүй
      if (user.email === adminEmail) continue;
      
      try {
        // Conversation олох эсвэл үүсгэх
        let conversation = await findConversation(adminEmail, user.email);
        
        if (!conversation) {
          // Шинэ conversation үүсгэх
          conversation = await createConversation({
            participant_1: adminEmail,
            participant_2: user.email,
            last_message: message,
            last_message_date: Timestamp.now(),
            last_message_sender: adminEmail,
            unread_count_p1: 0,
            unread_count_p2: 1 // Хүлээн авагч unread count
          });
        } else {
          // Conversation update хийх
          await updateConversation(conversation.id, {
            last_message: message,
            last_message_date: Timestamp.now(),
            last_message_sender: adminEmail,
            unread_count_p2: (conversation.unread_count_p2 || 0) + 1
          });
        }
        
        // Мессеж үүсгэх
        await createMessage(
          {
            conversation_id: conversation.id,
            sender_email: adminEmail,
            receiver_email: user.email,
            message: message,
            is_read: false,
          },
          { skipBannedCheck: true }
        );
        
        successCount++;
      } catch (error) {
        console.error(`Error sending message to ${user.email}:`, error);
        errorCount++;
      }
    }
    
    return {
      successCount,
      errorCount,
      totalUsers: users.length - 1 // Админийг тооцохгүй
    };
  } catch (error) {
    console.error('Error sending messages to all users:', error);
    throw error;
  }
};

