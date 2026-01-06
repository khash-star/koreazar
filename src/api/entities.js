// Entities - Firestore service exports
// Base44 entities-ийг Firestore service-ээр солих

import * as listingService from '@/services/listingService';
import * as conversationService from '@/services/conversationService';
import * as bannerService from '@/services/bannerService';

// Listing entity - Firestore service ашиглах
export const Listing = {
  list: (orderBy = '-created_date', limitCount = 100) => 
    listingService.listListings(orderBy.replace('-', ''), limitCount),
  
  filter: async (filters = {}, orderBy = '-created_date', limitCount = 100) => {
    // Convert base44 filter format to Firestore query
    if (filters.id) {
      const listing = await listingService.getListingById(filters.id);
      return listing ? [listing] : [];
    }
    if (filters.status) {
      return listingService.getListingsByStatus(filters.status, orderBy.replace('-', ''), limitCount);
    }
    if (filters.created_by) {
      return listingService.getListingsByUser(filters.created_by, orderBy.replace('-', ''), limitCount);
    }
    // Default: list all
    return listingService.listListings(orderBy.replace('-', ''), limitCount);
  },
  
  create: (data) => listingService.createListing(data),
  update: (id, data) => listingService.updateListing(id, data),
  delete: (id) => listingService.deleteListing(id)
};

// SavedListing entity
export const SavedListing = {
  filter: async (filters = {}, orderBy = '-created_date') => {
    const { collection, query, where, getDocs, orderBy: orderByFn } = await import('firebase/firestore');
    const { db } = await import('@/firebase/config');
    
    const savedRef = collection(db, 'saved_listings');
    const conditions = [];
    
    if (filters.created_by) {
      conditions.push(where('created_by', '==', filters.created_by));
    }
    if (filters.listing_id) {
      conditions.push(where('listing_id', '==', filters.listing_id));
    }
    
    const orderField = orderBy.replace('-', '');
    const orderDirection = orderBy.startsWith('-') ? 'desc' : 'asc';
    const q = query(savedRef, ...conditions, orderByFn(orderField, orderDirection));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },
  create: async (data) => {
    const { collection, addDoc, Timestamp } = await import('firebase/firestore');
    const { db } = await import('@/firebase/config');
    
    const savedRef = collection(db, 'saved_listings');
    const savedData = {
      listing_id: data.listing_id,
      created_by: data.created_by,
      created_date: Timestamp.now()
    };
    
    const docRef = await addDoc(savedRef, savedData);
    return {
      id: docRef.id,
      ...savedData
    };
  },
  delete: async (id) => {
    const { doc, deleteDoc } = await import('firebase/firestore');
    const { db } = await import('@/firebase/config');
    
    const savedRef = doc(db, 'saved_listings', id);
    await deleteDoc(savedRef);
  }
};

// Conversation entity
export const Conversation = {
  filter: async (filters = {}) => {
    if (filters.id) {
      const conv = await conversationService.getConversationById(filters.id);
      return conv ? [conv] : [];
    }
    if (filters.participant_1) {
      return conversationService.getConversationsByParticipant1(filters.participant_1);
    }
    if (filters.participant_2) {
      return conversationService.getConversationsByParticipant2(filters.participant_2);
    }
    return [];
  },
  create: (data) => conversationService.createConversation(data),
  update: (id, data) => conversationService.updateConversation(id, data),
  delete: (id) => conversationService.deleteConversation(id)
};

// Message entity
export const Message = {
  filter: async (filters = {}, orderBy = 'created_date') => {
    if (filters.conversation_id) {
      return conversationService.getMessagesByConversation(filters.conversation_id);
    }
    return [];
  },
  create: (data) => conversationService.createMessage(data),
  update: (id, data) => conversationService.updateMessage(id, data),
  delete: (id) => conversationService.deleteMessage(id)
};

// BannerAd entity
export const BannerAd = {
  list: (orderBy = '-order') => bannerService.listBannerAds(orderBy),
  filter: async (filters = {}, orderBy = '-order') => {
    if (filters.is_active !== undefined) {
      return bannerService.filterBannerAds({ is_active: filters.is_active });
    }
    return bannerService.listBannerAds(orderBy);
  },
  create: (data) => bannerService.createBannerAd(data),
  update: (id, data) => bannerService.updateBannerAd(id, data),
  delete: (id) => bannerService.deleteBannerAd(id)
};

// BannerRequest entity
export const BannerRequest = {
  list: (orderBy = '-created_date') => bannerService.listBannerRequests(),
  filter: async (filters = {}, orderBy = '-created_date') => {
    if (filters.created_by) {
      return bannerService.filterBannerRequests({ created_by: filters.created_by });
    }
    return bannerService.listBannerRequests();
  },
  create: (data) => bannerService.createBannerRequest(data),
  update: (id, data) => bannerService.updateBannerRequest(id, data),
  delete: (id) => bannerService.deleteBannerRequest(id)
};

// User - Firebase Auth ашиглах (authService-ээс)
export const User = {
  list: async () => {
    const { getAllUsers } = await import('@/services/authService');
    return getAllUsers();
  },
  filter: async (filters = {}) => {
    if (filters.email) {
      const { getUserByEmail } = await import('@/services/authService');
      const user = await getUserByEmail(filters.email);
      return user ? [user] : [];
    }
    const { getAllUsers } = await import('@/services/authService');
    return getAllUsers();
  }
};
