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
  limit,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { convertTimestamp } from '@/utils/firestoreDates';

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
 * @param {string} userEmail - Owner email (required by Firestore ownership rules)
 * @param {number} limitCount - Maximum number of messages to fetch
 * @returns {Promise<Array>} Array of messages
 */
export const listAIMessages = async (conversationId, userEmail, limitCount = 100) => {
  try {
    if (!userEmail) {
      throw new Error('userEmail is required to list AI messages');
    }
    const messagesRef = collection(db, 'ai_messages');
    // Ownership-scoped query (rules deny unscoped collection scans).
    // Prefer user_email-only to avoid requiring a new composite index; filter in memory.
    const q = query(
      messagesRef,
      where('user_email', '==', userEmail),
      limit(Math.max(limitCount * 5, 100))
    );
    const querySnapshot = await getDocs(q);
    const messages = querySnapshot.docs
      .map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          created_date: convertTimestamp(data.created_date),
        };
      })
      .filter((msg) => msg.conversation_id === conversationId)
      .sort((a, b) => {
        const dateA = a.created_date || new Date(0);
        const dateB = b.created_date || new Date(0);
        return dateA - dateB; // Oldest first
      });
    return messages.slice(-limitCount);
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
 * @param {string} userEmail - Owner email (required by Firestore ownership rules)
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToAIMessages = (conversationId, userEmail, callback) => {
  if (!userEmail) {
    callback([]);
    return () => {};
  }
  const messagesRef = collection(db, 'ai_messages');
  // Ownership-scoped listener; filter conversation in memory (no composite index).
  const q = query(messagesRef, where('user_email', '==', userEmail));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs
      .map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          created_date: convertTimestamp(data.created_date),
        };
      })
      .filter((msg) => msg.conversation_id === conversationId)
      .sort((a, b) => {
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

