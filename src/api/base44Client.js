import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client WITHOUT authentication redirect (Firebase auth is used instead)
const base44Client = createClient({
  appId: "6955079a31933f39746103b7", 
  requiresAuth: false // Disable base44 auth redirect - using Firebase auth instead
});

// Override auth methods to prevent any redirects to base44.app
base44Client.auth = {
  ...base44Client.auth,
  redirectToLogin: () => {
    // Do nothing - Firebase auth handles login redirects
    console.warn('base44.auth.redirectToLogin() called but disabled - using Firebase auth instead');
  },
  me: () => {
    // Return rejected promise to prevent any redirects
    return Promise.reject(new Error('base44.auth.me() is disabled - use Firebase auth instead'));
  },
  isAuthenticated: () => {
    return false; // Always return false to prevent SDK from redirecting
  }
};

export const base44 = base44Client;
