// Facebook Authentication Service
// Firebase Authentication-тай холбох

import { signInWithPopup, FacebookAuthProvider } from 'firebase/auth';
import { auth } from '@/firebase/config';

/**
 * Facebook-р нэвтрэх
 */
export const loginWithFacebook = async () => {
  try {
    const provider = new FacebookAuthProvider();
    
    // Add scopes for email and public profile
    provider.addScope('email');
    provider.addScope('public_profile');
    
    // Sign in with popup
    const result = await signInWithPopup(auth, provider);
    
    // The signed-in user info
    const user = result.user;
    
    return user;
  } catch (error) {
    console.error('Error signing in with Facebook:', error);
    
    // Handle specific errors
    if (error.code === 'auth/account-exists-with-different-credential') {
      throw new Error('Энэ имэйл хаяг аль хэдийн өөр аргаар бүртгэгдсэн байна.');
    }
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Нэвтрэх цонхыг хаасан байна.');
    }
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Браузер popup-ийг блоколсон байна. Popup-ийг зөвшөөрнө үү.');
    }
    
    throw error;
  }
};

/**
 * Facebook-с гарах
 * Note: Firebase Auth handles logout globally, but this can be used for Facebook-specific cleanup
 */
export const logoutFromFacebook = async () => {
  // Firebase handles logout globally, so no specific Facebook logout needed
  // This is kept for consistency with the previous Kakao implementation
  console.log('Facebook logout - handled by Firebase Auth');
};

