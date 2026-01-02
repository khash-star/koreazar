// AI Conversation Service - Firestore operations for AI chat
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  limit,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/firebase/config';

/**
 * Convert Firestore Timestamp to JavaScript Date
 */
const convertTimestamp = (value) => {
  if (!value) return value;
  if (value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  if (value instanceof Date) {
    return value;
  }
  if (value.seconds !== undefined) {
    return new Date(value.seconds * 1000 + (value.nanoseconds || 0) / 1000000);
  }
  return value;
};

/**
 * Get or create AI conversation for a user
 * @param {string} userEmail - User's email
 * @returns {Promise<Object>} Conversation object
 */
export const getOrCreateAIConversation = async (userEmail) => {
  try {
    const conversationsRef = collection(db, 'ai_conversations');
    // First try without orderBy to avoid index requirement
    const q = query(
      conversationsRef,
      where('user_email', '==', userEmail),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Sort in memory if multiple found
      const docs = querySnapshot.docs.sort((a, b) => {
        const dateA = a.data().last_message_date?.toDate?.() || new Date(0);
        const dateB = b.data().last_message_date?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      const doc = docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_date: convertTimestamp(data.created_date),
        last_message_date: convertTimestamp(data.last_message_date)
      };
    }
    
    // Create new conversation
    const newConvData = {
      user_email: userEmail,
      created_date: Timestamp.now(),
      last_message_date: Timestamp.now(),
      message_count: 0
    };
    
    const docRef = await addDoc(conversationsRef, newConvData);
    
    return {
      id: docRef.id,
      ...newConvData,
      created_date: newConvData.created_date.toDate(),
      last_message_date: newConvData.last_message_date.toDate()
    };
  } catch (error) {
    console.error('Error getting/creating AI conversation:', error);
    throw error;
  }
};

/**
 * Get AI conversation by ID
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Object|null>} Conversation object or null
 */
export const getAIConversation = async (conversationId) => {
  try {
    const convRef = doc(db, 'ai_conversations', conversationId);
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
    console.error('Error getting AI conversation:', error);
    throw error;
  }
};

/**
 * List AI messages for a conversation
 * @param {string} conversationId - Conversation ID
 * @param {number} limitCount - Maximum number of messages to fetch
 * @returns {Promise<Array>} Array of messages
 */
export const listAIMessages = async (conversationId, limitCount = 100) => {
  try {
    const messagesRef = collection(db, 'ai_messages');
    // Try with orderBy first, fallback to without if index missing
    let q = query(
      messagesRef,
      where('conversation_id', '==', conversationId),
      orderBy('created_date', 'desc'),
      limit(limitCount)
    );
    
    let querySnapshot;
    try {
      querySnapshot = await getDocs(q);
    } catch (error) {
      // If index missing, query without orderBy and sort in memory
      if (error.code === 'failed-precondition') {
        q = query(
          messagesRef,
          where('conversation_id', '==', conversationId),
          limit(limitCount)
        );
        querySnapshot = await getDocs(q);
        // Sort in memory
        const messages = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            created_date: convertTimestamp(data.created_date)
          };
        }).sort((a, b) => {
          const dateA = a.created_date || new Date(0);
          const dateB = b.created_date || new Date(0);
          return dateB - dateA;
        });
        return messages.reverse(); // Oldest first
      }
      throw error;
    }
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_date: convertTimestamp(data.created_date)
      };
    }).reverse(); // Oldest first
  } catch (error) {
    console.error('Error listing AI messages:', error);
    throw error;
  }
};

/**
 * Create AI message
 * @param {Object} data - Message data
 * @returns {Promise<Object>} Created message
 */
export const createAIMessage = async (data) => {
  try {
    const messagesRef = collection(db, 'ai_messages');
    const messageData = {
      ...data,
      created_date: Timestamp.now()
    };
    
    const docRef = await addDoc(messagesRef, messageData);
    
    // Update conversation
    if (data.conversation_id) {
      const convRef = doc(db, 'ai_conversations', data.conversation_id);
      await updateDoc(convRef, {
        last_message_date: Timestamp.now(),
        message_count: (await getDoc(convRef)).data()?.message_count + 1 || 1
      });
    }
    
    return {
      id: docRef.id,
      ...messageData,
      created_date: messageData.created_date.toDate()
    };
  } catch (error) {
    console.error('Error creating AI message:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time AI messages
 * @param {string} conversationId - Conversation ID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToAIMessages = (conversationId, callback) => {
  const messagesRef = collection(db, 'ai_messages');
  // Query without orderBy to avoid index requirement, sort in memory
  const q = query(
    messagesRef,
    where('conversation_id', '==', conversationId)
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_date: convertTimestamp(data.created_date)
      };
    }).sort((a, b) => {
      const dateA = a.created_date || new Date(0);
      const dateB = b.created_date || new Date(0);
      return dateA - dateB; // Ascending order (oldest first)
    });
    callback(messages);
  }, (error) => {
    console.error('Error subscribing to AI messages:', error);
    callback([]);
  });
};

