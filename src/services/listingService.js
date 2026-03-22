// Listing Service - Firestore CRUD operations

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
import { convertTimestamp } from '@/utils/firestoreDates';

/**
 * Бүх listings-ийг авах
 * @param {string} orderByField - Order by field (default: 'created_date')
 * @param {number} limitCount - Limit count (default: 100)
 * @returns {Promise<Array>} Listings array
 */
export const listListings = async (orderByField = 'created_date', limitCount = 100) => {
  try {
    const listingsRef = collection(db, 'listings');
    const orderField = orderByField.startsWith('-') ? orderByField.slice(1) : orderByField;
    const orderDirection = orderByField.startsWith('-') ? 'desc' : 'asc';

    const q = query(
      listingsRef,
      orderBy(orderField, orderDirection),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);

    const result = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_date: convertTimestamp(data.created_date),
        updated_date: convertTimestamp(data.updated_date),
        listing_type_expires: data.listing_type_expires ? convertTimestamp(data.listing_type_expires) : undefined
      };
    });
    return result;
  } catch (error) {
    console.error('Error listing listings:', error);
    throw error;
  }
};

/**
 * Listing filter хийх
 * @param {Object} filters - Filter object
 * @param {string} orderByField - Order by field (default: 'created_date')
 * @param {number} limitCount - Limit count (default: 100)
 * @returns {Promise<Array>} Filtered listings
 */
export const filterListings = async (filters = {}, orderByField = '-created_date', limitCount = 100) => {
  try {
    const listingsRef = collection(db, 'listings');
    const conditions = [];
    
    // Build where conditions
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        conditions.push(where(key, '==', filters[key]));
      }
    });
    
    // Handle order by (support '-' prefix for descending)
    const orderField = orderByField.startsWith('-') ? orderByField.slice(1) : orderByField;
    const orderDirection = orderByField.startsWith('-') ? 'desc' : 'asc';
    
    // Build query
    let q;
    if (conditions.length > 0) {
      q = query(listingsRef, ...conditions, orderBy(orderField, orderDirection), limit(limitCount));
    } else {
      q = query(listingsRef, orderBy(orderField, orderDirection), limit(limitCount));
    }
    
    const querySnapshot = await getDocs(q);
    
    const result = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_date: convertTimestamp(data.created_date),
        updated_date: convertTimestamp(data.updated_date),
        listing_type_expires: data.listing_type_expires ? convertTimestamp(data.listing_type_expires) : undefined
      };
    });
    
    return result;
  } catch (error) {
    console.error('Error filtering listings:', error);

    if (error.code === 'failed-precondition' && error.message?.includes('index')) {
      // Ийм тохиолдолд илүү энгийн query ашиглах эсвэл client-side filter хийх
      if (conditions.length > 1) {
        // Эхлээд orderBy-гүй query хийж, дараа нь client-side filter хийх
        try {
          const simpleQuery = query(listingsRef, ...conditions, limit(limitCount * 2));
          const simpleSnapshot = await getDocs(simpleQuery);
          let simpleResult = simpleSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              created_date: convertTimestamp(data.created_date),
              updated_date: convertTimestamp(data.updated_date),
              listing_type_expires: data.listing_type_expires ? convertTimestamp(data.listing_type_expires) : undefined
            };
          });
          
          // Client-side sorting
          const orderField = orderByField.startsWith('-') ? orderByField.slice(1) : orderByField;
          simpleResult.sort((a, b) => {
            const aVal = a[orderField];
            const bVal = b[orderField];
            if (!aVal || !bVal) return 0;
            const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            return orderByField.startsWith('-') ? -comparison : comparison;
          });
          
          // Limit
          simpleResult = simpleResult.slice(0, limitCount);
          return simpleResult;
        } catch (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          // Эцсийн fallback: хоосон массив
          return [];
        }
      }
    }
    
    throw error;
  }
};

/**
 * Listing үүсгэх
 * @param {Object} data - Listing data
 * @returns {Promise<Object>} Created listing with ID
 */
export const createListing = async (data) => {
  try {
    const listingsRef = collection(db, 'listings');
    
    // Get current user email from auth if not provided
    const { auth } = await import('@/firebase/config');
    const userEmail = data.created_by || auth.currentUser?.email || '';
    
    if (!userEmail) {
      throw new Error('Хэрэглэгчийн мэдээлэл олдсонгүй. Нэвтэрнэ үү.');
    }
    
    const listingData = {
      ...data,
      created_by: userEmail,
      created_date: Timestamp.now(),
      updated_date: Timestamp.now(),
      views: 0,
      status: data.status || 'pending',
      listing_type: data.listing_type || 'regular'
    };
    
    const docRef = await addDoc(listingsRef, listingData);
    
    return {
      id: docRef.id,
      ...listingData
    };
  } catch (error) {
    console.error('Error creating listing:', error);
    throw error;
  }
};

/**
 * Listing шинэчлэх
 * @param {string} id - Listing ID
 * @param {Object} data - Update data
 * @returns {Promise<void>}
 */
export const updateListing = async (id, data) => {
  try {
    const listingRef = doc(db, 'listings', id);
    const updateData = {
      ...data,
      updated_date: Timestamp.now()
    };
    
    await updateDoc(listingRef, updateData);
  } catch (error) {
    console.error('Error updating listing:', error);
    throw error;
  }
};

/**
 * Listing устгах
 * @param {string} id - Listing ID
 * @returns {Promise<void>}
 */
export const deleteListing = async (id) => {
  try {
    const listingRef = doc(db, 'listings', id);
    await deleteDoc(listingRef);
  } catch (error) {
    console.error('Error deleting listing:', error);
    throw error;
  }
};

/**
 * Нэг listing-ийг авах
 * @param {string} id - Listing ID
 * @returns {Promise<Object | null>} Listing object or null
 */
export const getListing = async (id) => {
  try {
    if (!id) return null;
    
    const listingRef = doc(db, 'listings', id);
    const listingSnap = await getDoc(listingRef);
    
    if (listingSnap.exists()) {
      const data = listingSnap.data();
      // Convert Firestore Timestamps to JavaScript Dates
      const convertedData = {
        ...data,
        created_date: convertTimestamp(data.created_date),
        updated_date: convertTimestamp(data.updated_date),
        listing_type_expires: data.listing_type_expires ? convertTimestamp(data.listing_type_expires) : undefined
      };
      
      return {
        id: listingSnap.id,
        ...convertedData
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting listing:', error);
    // Don't throw error, return null instead to show "not found" message
    return null;
  }
};

