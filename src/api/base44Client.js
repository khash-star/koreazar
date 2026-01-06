import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client WITHOUT authentication redirect (Firebase auth is used instead)
export const base44 = createClient({
  appId: "6955079a31933f39746103b7", 
  requiresAuth: false // Disable base44 auth redirect - using Firebase auth instead
});
