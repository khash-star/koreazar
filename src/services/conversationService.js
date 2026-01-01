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
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/firebase/config';

/**
 * Convert Firestore Timestamp to JavaScript Date
 * @param {*} value - Firestore Timestamp or other value
 * @returns {Date|*} Converted Date or original value
 */
const convertTimestamp = (value) => {
  if (!value) return value;
  // Check if it's a Firestore Timestamp object
  if (value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  // If it's already a Date object, return as is
  if (value instanceof Date) {
    return value;
  }
  // If it's a timestamp-like object with seconds/nanoseconds
  if (value.seconds !== undefined) {
    return new Date(value.seconds * 1000 + (value.nanoseconds || 0) / 1000000);
  }
  return value;
};

// Conversations
export const listConversations = async () => {
  try {
    const convsRef = collection(db, 'conversations');
    const q = query(convsRef, orderBy('last_message_date', 'desc'));
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
    console.error('Error listing conversations:', error);
    throw error;
  }
};

export const filterConversations = async (filters = {}) => {
  try {
    const convsRef = collection(db, 'conversations');
    const conditions = [];
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        conditions.push(where(key, '==', filters[key]));
      }
    });
    
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
    console.error('Error filtering conversations:', error);
    throw error;
  }
};

export const createConversation = async (data) => {
  try {
    const convsRef = collection(db, 'conversations');
    const convData = {
      ...data,
      created_date: Timestamp.now(),
      last_message_date: Timestamp.now(),
      unread_count_p1: 0,
      unread_count_p2: 0
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
    const convsRef = collection(db, 'conversations');
    
    // Check both directions
    const q1 = query(
      convsRef,
      where('participant_1', '==', email1),
      where('participant_2', '==', email2)
    );
    const q2 = query(
      convsRef,
      where('participant_1', '==', email2),
      where('participant_2', '==', email1)
    );
    
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

export const createMessage = async (data) => {
  try {
    const messagesRef = collection(db, 'messages');
    const messageData = {
      ...data,
      created_date: Timestamp.now(),
      is_read: data.is_read !== undefined ? data.is_read : false
    };
    
    console.log('Creating message in Firestore:', messageData);
    
    const docRef = await addDoc(messagesRef, messageData);
    
    const result = {
      id: docRef.id,
      ...messageData,
      created_date: messageData.created_date.toDate() // Convert for easier use in components
    };
    
    console.log('Message created successfully with ID:', docRef.id);
    
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

