// Listing Service - Firestore CRUD operations
// Base44: base44.entities.Listing.* → Firestore

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

/**
 * Бүх listings-ийг авах
 * Base44: base44.entities.Listing.list()
 * @param {string} orderByField - Order by field (default: 'created_date')
 * @param {number} limitCount - Limit count (default: 100)
 * @returns {Promise<Array>} Listings array
 */
export const listListings = async (orderByField = 'created_date', limitCount = 100) => {
  try {
    const listingsRef = collection(db, 'listings');
    const q = query(
      listingsRef,
      orderBy(orderByField, orderByField.startsWith('-') ? 'desc' : 'asc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_date: convertTimestamp(data.created_date),
        updated_date: convertTimestamp(data.updated_date),
        listing_type_expires: data.listing_type_expires ? convertTimestamp(data.listing_type_expires) : undefined
      };
    });
  } catch (error) {
    console.error('Error listing listings:', error);
    throw error;
  }
};

/**
 * Listing filter хийх
 * Base44: base44.entities.Listing.filter({...}, orderBy, limit)
 * @param {Object} filters - Filter object
 * @param {string} orderByField - Order by field (default: 'created_date')
 * @param {number} limitCount - Limit count (default: 100)
 * @returns {Promise<Array>} Filtered listings
 */
export const filterListings = async (filters = {}, orderByField = '-created_date', limitCount = 100) => {
  try {
    console.log('filterListings called with:', { filters, orderByField, limitCount });
    const listingsRef = collection(db, 'listings');
    const conditions = [];
    
    // Build where conditions
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        conditions.push(where(key, '==', filters[key]));
        console.log(`Added where condition: ${key} == ${filters[key]}`);
      }
    });
    
    // Handle order by (support '-' prefix for descending)
    const orderField = orderByField.startsWith('-') ? orderByField.slice(1) : orderByField;
    const orderDirection = orderByField.startsWith('-') ? 'desc' : 'asc';
    console.log(`Order by: ${orderField} ${orderDirection}`);
    
    // Build query
    let q;
    if (conditions.length > 0) {
      q = query(listingsRef, ...conditions, orderBy(orderField, orderDirection), limit(limitCount));
    } else {
      q = query(listingsRef, orderBy(orderField, orderDirection), limit(limitCount));
    }
    
    console.log('Executing Firestore query...');
    const querySnapshot = await getDocs(q);
    console.log(`Query returned ${querySnapshot.docs.length} documents`);
    
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
    
    console.log('filterListings result:', result);
    return result;
  } catch (error) {
    console.error('Error filtering listings:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Listing үүсгэх
 * Base44: base44.entities.Listing.create({...})
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
    
    console.log('Creating listing with data:', listingData);
    const docRef = await addDoc(listingsRef, listingData);
    console.log('Listing created successfully with ID:', docRef.id);
    
    return {
      id: docRef.id,
      ...listingData
    };
  } catch (error) {
    console.error('Error creating listing:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Listing шинэчлэх
 * Base44: base44.entities.Listing.update(id, {...})
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
    
    console.log('Updating listing:', id, 'with data:', updateData);
    await updateDoc(listingRef, updateData);
    console.log('Listing updated successfully:', id);
  } catch (error) {
    console.error('Error updating listing:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      listingId: id
    });
    throw error;
  }
};

/**
 * Listing устгах
 * Base44: base44.entities.Listing.delete(id)
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
 * Base44: base44.entities.Listing.filter({ id })
 * @param {string} id - Listing ID
 * @returns {Promise<Object | null>} Listing object or null
 */
export const getListing = async (id) => {
  try {
    if (!id) {
      console.error('Listing ID is required');
      return null;
    }
    
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
    
    console.warn(`Listing not found with ID: ${id}`);
    return null;
  } catch (error) {
    console.error('Error getting listing:', error);
    // Don't throw error, return null instead to show "not found" message
    return null;
  }
};

