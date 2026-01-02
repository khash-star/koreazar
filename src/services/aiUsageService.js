// AI Usage Tracking Service - Track AI bot usage and costs
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
  increment,
  setDoc
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
 * Get or create daily usage record for a user
 * @param {string} userEmail - User's email
 * @param {Date} date - Date for the usage record (default: today)
 * @returns {Promise<Object>} Usage record
 */
export const getOrCreateDailyUsage = async (userEmail, date = new Date()) => {
  try {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    const usageRef = doc(db, 'ai_usage', `${userEmail}_${dateStr}`);
    const usageSnap = await getDoc(usageRef);
    
    if (usageSnap.exists()) {
      const data = usageSnap.data();
      return {
        id: usageSnap.id,
        ...data,
        date: convertTimestamp(data.date)
      };
    }
    
    // Create new daily usage record
    const newUsageData = {
      user_email: userEmail,
      date: Timestamp.fromDate(new Date(dateStr)),
      request_count: 0,
      total_tokens: 0,
      prompt_tokens: 0,
      completion_tokens: 0,
      estimated_cost: 0,
      last_request_date: null
    };
    
    await setDoc(usageRef, newUsageData);
    
    return {
      id: usageRef.id,
      ...newUsageData,
      date: new Date(dateStr)
    };
  } catch (error) {
    // Silently fail if permission denied - don't block functionality
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      console.warn('Could not get or create usage record, skipping usage tracking');
      return null;
    }
    console.error('Error getting/creating daily usage:', error);
    return null;
  }
};

/**
 * Record AI usage
 * @param {string} userEmail - User's email
 * @param {Object} usageData - Usage data from OpenAI API response
 * @returns {Promise<Object>} Updated usage record
 */
export const recordAIUsage = async (userEmail, usageData) => {
  try {
    const today = new Date();
    const usage = await getOrCreateDailyUsage(userEmail, today);
    if (!usage) {
      console.warn('Could not get or create usage record, skipping usage tracking');
      return null;
    }
    
    const usageRef = doc(db, 'ai_usage', usage.id);
    
    // Calculate cost (gpt-4o-mini pricing: $0.15/$0.60 per 1M tokens)
    // Input: $0.15/1M tokens, Output: $0.60/1M tokens
    const inputCost = (usageData.prompt_tokens || 0) * 0.15 / 1000000;
    const outputCost = (usageData.completion_tokens || 0) * 0.60 / 1000000;
    const totalCost = inputCost + outputCost;
    
    await updateDoc(usageRef, {
      request_count: increment(1),
      total_tokens: increment(usageData.total_tokens || 0),
      prompt_tokens: increment(usageData.prompt_tokens || 0),
      completion_tokens: increment(usageData.completion_tokens || 0),
      estimated_cost: increment(totalCost),
      last_request_date: Timestamp.now()
    });
    
    // Get updated usage
    const updatedSnap = await getDoc(usageRef);
    return {
      id: updatedSnap.id,
      ...updatedSnap.data(),
      date: convertTimestamp(updatedSnap.data().date)
    };
  } catch (error) {
    // Silently fail if permission denied - don't block functionality
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      return null;
    }
    console.error('Error recording AI usage:', error);
    return null;
  }
};

/**
 * Get user's daily usage
 * @param {string} userEmail - User's email
 * @param {Date} date - Date to get usage for (default: today)
 * @returns {Promise<Object|null>} Usage record or null
 */
export const getDailyUsage = async (userEmail, date = new Date()) => {
  try {
    const dateStr = date.toISOString().split('T')[0];
    const usageRef = doc(db, 'ai_usage', `${userEmail}_${dateStr}`);
    const usageSnap = await getDoc(usageRef);
    
    if (usageSnap.exists()) {
      const data = usageSnap.data();
      return {
        id: usageSnap.id,
        ...data,
        date: convertTimestamp(data.date)
      };
    }
    return null;
  } catch (error) {
    // Silently fail if permission denied - don't block functionality
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      return null;
    }
    console.error('Error getting daily usage:', error);
    return null;
  }
};

/**
 * Get user's usage for a date range
 * @param {string} userEmail - User's email
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Array of usage records
 */
export const getUsageRange = async (userEmail, startDate, endDate) => {
  try {
    const usageRef = collection(db, 'ai_usage');
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    const q = query(
      usageRef,
      where('user_email', '==', userEmail),
      where('date', '>=', Timestamp.fromDate(new Date(startStr))),
      where('date', '<=', Timestamp.fromDate(new Date(endStr + 'T23:59:59'))),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: convertTimestamp(data.date)
      };
    });
  } catch (error) {
    console.error('Error getting usage range:', error);
    throw error;
  }
};

/**
 * Check if user has exceeded daily limit
 * @param {string} userEmail - User's email
 * @param {number} dailyLimit - Daily request limit (default: 50)
 * @returns {Promise<{exceeded: boolean, usage: Object, remaining: number}>}
 */
export const checkDailyLimit = async (userEmail, dailyLimit = 50) => {
  try {
    const usage = await getDailyUsage(userEmail);
    const requestCount = usage?.request_count || 0;
    const exceeded = requestCount >= dailyLimit;
    const remaining = Math.max(0, dailyLimit - requestCount);
    
    return {
      exceeded,
      usage: usage || { request_count: 0 },
      remaining
    };
  } catch (error) {
    // Silently fail if permission denied - return default values
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      return {
        exceeded: false,
        usage: { request_count: 0 },
        remaining: dailyLimit
      };
    }
    console.error('Error checking daily limit:', error);
    return {
      exceeded: false,
      usage: { request_count: 0 },
      remaining: dailyLimit
    };
  }
};

/**
 * Get all users' usage statistics (admin only)
 * @param {Date} date - Date to get statistics for (default: today)
 * @returns {Promise<Object>} Statistics object
 */
export const getAllUsersUsageStats = async (date = new Date()) => {
  try {
    const dateStr = date.toISOString().split('T')[0];
    const usageRef = collection(db, 'ai_usage');
    const q = query(
      usageRef,
      where('date', '==', Timestamp.fromDate(new Date(dateStr)))
    );
    
    const querySnapshot = await getDocs(q);
    
    let totalRequests = 0;
    let totalTokens = 0;
    let totalCost = 0;
    let activeUsers = 0;
    
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      totalRequests += data.request_count || 0;
      totalTokens += data.total_tokens || 0;
      totalCost += data.estimated_cost || 0;
      if (data.request_count > 0) {
        activeUsers++;
      }
    });
    
    return {
      date: dateStr,
      total_requests: totalRequests,
      total_tokens: totalTokens,
      total_cost: totalCost,
      active_users: activeUsers,
      usage_records: querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: convertTimestamp(doc.data().date)
      }))
    };
  } catch (error) {
    console.error('Error getting all users usage stats:', error);
    throw error;
  }
};

/**
 * Get usage statistics for a date range (admin only)
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Statistics object
 */
export const getUsageStatsRange = async (startDate, endDate) => {
  try {
    const usageRef = collection(db, 'ai_usage');
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    const q = query(
      usageRef,
      where('date', '>=', Timestamp.fromDate(new Date(startStr))),
      where('date', '<=', Timestamp.fromDate(new Date(endStr + 'T23:59:59'))),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    let totalRequests = 0;
    let totalTokens = 0;
    let totalCost = 0;
    const dailyStats = {};
    
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      const dateStr = data.date?.toDate?.()?.toISOString()?.split('T')[0] || 
                     convertTimestamp(data.date)?.toISOString()?.split('T')[0];
      
      if (!dailyStats[dateStr]) {
        dailyStats[dateStr] = {
          date: dateStr,
          requests: 0,
          tokens: 0,
          cost: 0,
          users: new Set()
        };
      }
      
      dailyStats[dateStr].requests += data.request_count || 0;
      dailyStats[dateStr].tokens += data.total_tokens || 0;
      dailyStats[dateStr].cost += data.estimated_cost || 0;
      if (data.user_email) {
        dailyStats[dateStr].users.add(data.user_email);
      }
      
      totalRequests += data.request_count || 0;
      totalTokens += data.total_tokens || 0;
      totalCost += data.estimated_cost || 0;
    });
    
    // Convert Set to count
    Object.keys(dailyStats).forEach(date => {
      dailyStats[date].users = dailyStats[date].users.size;
    });
    
    return {
      start_date: startStr,
      end_date: endStr,
      total_requests: totalRequests,
      total_tokens: totalTokens,
      total_cost: totalCost,
      daily_stats: Object.values(dailyStats).sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      )
    };
  } catch (error) {
    console.error('Error getting usage stats range:', error);
    throw error;
  }
};

