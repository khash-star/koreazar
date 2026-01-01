// Base44 SDK - Conditional import to prevent auto-redirects
// TODO: This will be removed after full migration to Firebase

// CRITICAL: Check if we're on auth pages BEFORE importing base44 SDK
// Base44 SDK auto-redirects on import, so we must prevent import on Login/Register pages
const shouldLoadBase44 = () => {
  if (typeof window === 'undefined') return true; // SSR
  const path = window.location.pathname;
  // Don't load base44 SDK on auth pages
  if (path === '/Login' || path === '/Register' || 
      path.startsWith('/Login') || path.startsWith('/Register')) {
    return false;
  }
  return true;
};

// Mock base44 client for auth pages
const createMockBase44 = () => ({
  auth: {
    me: () => Promise.reject(new Error('Base44 SDK disabled on auth pages')),
    redirectToLogin: () => {},
    isAuthenticated: () => false
  },
  entities: {
    Listing: { 
      list: () => Promise.resolve([]), 
      filter: () => Promise.resolve([]), 
      create: () => Promise.resolve({}), 
      update: () => Promise.resolve({}), 
      delete: () => Promise.resolve({}) 
    },
    BannerAd: { 
      list: () => Promise.resolve([]), 
      filter: () => Promise.resolve([]), 
      create: () => Promise.resolve({}), 
      update: () => Promise.resolve({}), 
      delete: () => Promise.resolve({}) 
    },
    BannerRequest: { 
      list: () => Promise.resolve([]), 
      filter: () => Promise.resolve([]), 
      create: () => Promise.resolve({}), 
      update: () => Promise.resolve({}), 
      delete: () => Promise.resolve({}) 
    },
    SavedListing: { 
      list: () => Promise.resolve([]), 
      filter: () => Promise.resolve([]), 
      create: () => Promise.resolve({}), 
      update: () => Promise.resolve({}), 
      delete: () => Promise.resolve({}) 
    },
    Conversation: { 
      list: () => Promise.resolve([]), 
      filter: () => Promise.resolve([]), 
      create: () => Promise.resolve({}), 
      update: () => Promise.resolve({}), 
      delete: () => Promise.resolve({}) 
    },
    Message: { 
      list: () => Promise.resolve([]), 
      filter: () => Promise.resolve([]), 
      create: () => Promise.resolve({}), 
      update: () => Promise.resolve({}), 
      delete: () => Promise.resolve({}) 
    },
    User: { 
      list: () => Promise.resolve([]), 
      filter: () => Promise.resolve([]) 
    }
  },
  integrations: {
    Core: {
      UploadFile: () => Promise.resolve({ file_url: '' }),
      SendEmail: () => Promise.resolve({}),
      InvokeLLM: () => Promise.resolve({}),
      GenerateImage: () => Promise.resolve({}),
      ExtractDataFromUploadedFile: () => Promise.resolve({}),
      CreateFileSignedUrl: () => Promise.resolve({}),
      UploadPrivateFile: () => Promise.resolve({})
    }
  }
});

let base44Instance = null;

// Only import base44 SDK if NOT on auth pages
if (shouldLoadBase44()) {
  // Dynamic import to prevent auto-redirect
  import('@base44/sdk').then(({ createClient }) => {
    base44Instance = createClient({
      appId: "6955079a31933f39746103b7", 
      requiresAuth: false
    });
  }).catch(err => {
    console.error('Failed to load base44 SDK:', err);
    base44Instance = createMockBase44();
  });
} else {
  // On auth pages, use mock immediately
  base44Instance = createMockBase44();
}

// Export base44 - will be mock on auth pages, real client otherwise
export const base44 = new Proxy({}, {
  get(target, prop) {
    if (!base44Instance) {
      // If not loaded yet, return mock
      return createMockBase44()[prop];
    }
    return base44Instance[prop];
  }
});
