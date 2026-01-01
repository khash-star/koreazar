// Banner Service - Firestore CRUD operations
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
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/firebase/config';

/**
 * Banner Ads list
 */
export const listBannerAds = async (orderByField = '-order') => {
  try {
    const bannersRef = collection(db, 'banner_ads');
    const orderField = orderByField.startsWith('-') ? orderByField.slice(1) : orderByField;
    const orderDirection = orderByField.startsWith('-') ? 'desc' : 'asc';
    const q = query(bannersRef, orderBy(orderField, orderDirection));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error listing banners:', error);
    throw error;
  }
};

/**
 * Banner Ads filter
 */
export const filterBannerAds = async (filters = {}) => {
  try {
    const bannersRef = collection(db, 'banner_ads');
    const conditions = [];
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        conditions.push(where(key, '==', filters[key]));
      }
    });
    
    const q = query(bannersRef, ...conditions, orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error filtering banners:', error);
    throw error;
  }
};

/**
 * Banner Ad үүсгэх
 */
export const createBannerAd = async (data) => {
  try {
    const bannersRef = collection(db, 'banner_ads');
    const bannerData = {
      ...data,
      created_date: Timestamp.now(),
      order: data.order || 0,
      is_active: data.is_active !== undefined ? data.is_active : true
    };
    
    const docRef = await addDoc(bannersRef, bannerData);
    
    return {
      id: docRef.id,
      ...bannerData
    };
  } catch (error) {
    console.error('Error creating banner:', error);
    throw error;
  }
};

/**
 * Banner Ad шинэчлэх
 */
export const updateBannerAd = async (id, data) => {
  try {
    const bannerRef = doc(db, 'banner_ads', id);
    await updateDoc(bannerRef, data);
  } catch (error) {
    console.error('Error updating banner:', error);
    throw error;
  }
};

/**
 * Banner Ad устгах
 */
export const deleteBannerAd = async (id) => {
  try {
    const bannerRef = doc(db, 'banner_ads', id);
    await deleteDoc(bannerRef);
  } catch (error) {
    console.error('Error deleting banner:', error);
    throw error;
  }
};

// Banner Requests
export const listBannerRequests = async () => {
  try {
    const requestsRef = collection(db, 'banner_requests');
    const q = query(requestsRef, orderBy('created_date', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error listing banner requests:', error);
    throw error;
  }
};

export const filterBannerRequests = async (filters = {}) => {
  try {
    const requestsRef = collection(db, 'banner_requests');
    const conditions = [];
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        conditions.push(where(key, '==', filters[key]));
      }
    });
    
    const q = query(requestsRef, ...conditions, orderBy('created_date', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error filtering banner requests:', error);
    throw error;
  }
};

export const createBannerRequest = async (data) => {
  try {
    const requestsRef = collection(db, 'banner_requests');
    const requestData = {
      ...data,
      created_date: Timestamp.now(),
      status: data.status || 'pending'
    };
    
    const docRef = await addDoc(requestsRef, requestData);
    
    return {
      id: docRef.id,
      ...requestData
    };
  } catch (error) {
    console.error('Error creating banner request:', error);
    throw error;
  }
};

export const updateBannerRequest = async (id, data) => {
  try {
    const requestRef = doc(db, 'banner_requests', id);
    await updateDoc(requestRef, data);
  } catch (error) {
    console.error('Error updating banner request:', error);
    throw error;
  }
};

export const deleteBannerRequest = async (id) => {
  try {
    const requestRef = doc(db, 'banner_requests', id);
    await deleteDoc(requestRef);
  } catch (error) {
    console.error('Error deleting banner request:', error);
    throw error;
  }
};

