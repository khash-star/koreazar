// Firebase Authentication Service

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '@/firebase/config';
import { doc, setDoc, getDoc, updateDoc, collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/firebase/config';

/**
 * Нэвтрэх (Email/Password)
 * @param {string} email - Имэйл хаяг
 * @param {string} password - Нууц үг
 * @returns {Promise<User>} Firebase User object
 */
export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

/**
 * Бүртгүүлэх (Email/Password)
 * @param {string} email - Имэйл хаяг
 * @param {string} password - Нууц үг
 * @param {string} displayName - Хэрэглэгчийн нэр (optional)
 * @param {string} phone - Утасны дугаар (optional)
 * @returns {Promise<User>} Firebase User object
 */
export const register = async (email, password, displayName = null, phone = null) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Display name тохируулах (хэрэв байгаа бол)
    if (displayName) {
      try {
        await updateProfile(user, { displayName });
      } catch (error) {
        console.warn('Failed to update profile:', error);
        // Continue even if profile update fails
      }
    }

    // Firestore дээр user document үүсгэх (offline байвал алдаа гаргахгүй)
    try {
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: displayName || user.email.split('@')[0],
        role: 'user',
        createdAt: new Date(),
        phone: phone || '',
        kakao_id: '',
        wechat_id: '',
        whatsapp: '',
        facebook: ''
      });
    } catch (firestoreError) {
      // Ignore offline errors - Firestore will sync when online
      if (firestoreError.code === 'unavailable' || firestoreError.message?.includes('offline')) {
        console.warn('Firestore offline - user data will sync when online');
      } else {
        console.error('Failed to create user document in Firestore:', firestoreError);
        // Continue even if Firestore fails - user is still created in Auth
      }
    }

    return user;
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
};

/**
 * Гарах
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

/**
 * Нууц үг сэргээх имэйл илгээх
 * @param {string} email - Имэйл хаяг
 * @returns {Promise<void>}
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw error;
  }
};

/**
 * Одоогийн хэрэглэгчийн мэдээлэл авах
 * @returns {Promise<User | null>} User object эсвэл null
 */
export const getCurrentUser = async () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

/**
 * Хэрэглэгчийн Firestore дээрх мэдээлэл авах
 * @param {string} uid - User ID
 * @returns {Promise<Object | null>} User data эсвэл null
 */
export const getUserData = async (uid) => {
  try {
    console.log('🔍 getUserData: Fetching user data for UID:', uid);
    const userDoc = await getDoc(doc(db, 'users', uid));
    console.log('🔍 getUserData: Document exists:', userDoc.exists());
    
    if (userDoc.exists()) {
      const data = { id: userDoc.id, ...userDoc.data() };
      console.log('🔍 getUserData: User data retrieved:', data);
      console.log('🔍 getUserData: Role:', data.role);
      return data;
    }
    console.warn('🔍 getUserData: Document does not exist for UID:', uid);
    return null;
  } catch (error) {
    // Ignore offline errors - Firestore will work when online
    if (error.code === 'unavailable' || error.message?.includes('offline')) {
      console.warn('Firestore offline - user data will sync when online');
      return null;
    }
    console.error('❌ Error getting user data:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    return null;
  }
};

/**
 * Хэрэглэгчийн бүрэн мэдээлэл авах (Auth + Firestore)
 * @returns {Promise<Object | null>} User object with Firestore data
 */
export const getMe = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const userData = await getUserData(user.uid);
    if (!userData) {
      // Хэрэв Firestore дээр байхгүй бол үүсгэх (offline байвал skip)
      try {
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          role: 'user',
          createdAt: new Date()
        });
      } catch (error) {
        // Ignore offline errors
        if (error.code === 'unavailable' || error.message?.includes('offline')) {
          console.warn('Firestore offline - user data will sync when online');
        }
      }
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        role: 'user'
      };
    }

    return {
      uid: user.uid,
      email: user.email,
      ...userData
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Нэвтэрсэн эсэхийг шалгах
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!auth.currentUser;
};

/**
 * Auth state өөрчлөлтийг хянах (subscribe)
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Login хуудас руу чиглүүлэх
 * @param {string} redirectUrl - Нэвтрэсний дараа чиглүүлэх URL (optional)
 */
export const redirectToLogin = (redirectUrl = null) => {
  const currentPath = window.location.pathname + window.location.search;
  const targetUrl = redirectUrl || currentPath;
  
  // Use React Router navigate if available, otherwise use window.location
  if (targetUrl && targetUrl !== '/Login' && !targetUrl.includes('/Login')) {
    window.location.href = `/Login?redirect=${encodeURIComponent(targetUrl)}`;
  } else {
    window.location.href = '/Login';
  }
};

/**
 * Админ эрх шалгах
 * @returns {Promise<boolean>} Админ эсэх
 */
export const isAdmin = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return false;
    
    const userData = await getUserData(user.uid);
    return userData?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Бүх хэрэглэгчдийг авах (зөвхөн админ)
 * @returns {Promise<Array>} Бүх хэрэглэгчдийн жагсаалт
 */
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

/**
 * Админий имэйлийг олох
 * @returns {Promise<string|null>} Админий имэйл эсвэл null
 */
export const getAdminEmail = async () => {
  try {
    const users = await getAllUsers();
    const admin = users.find(user => user.role === 'admin');
    return admin?.email || null;
  } catch (error) {
    console.error('Error getting admin email:', error);
    return null;
  }
};

/**
 * Email-аар хэрэглэгчийн мэдээлэл авах
 * @param {string} email - Хэрэглэгчийн имэйл
 * @returns {Promise<Object|null>} User data эсвэл null
 */
export const getUserByEmail = async (email) => {
  try {
    if (!email) return null;
    
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
};

/**
 * Хэрэглэгчийн мэдээллийг засах
 * @param {string} uid - User ID
 * @param {Object} data - Засах мэдээлэл
 * @returns {Promise<void>}
 */
export const updateUserData = async (uid, data) => {
  try {
    const user = auth.currentUser;
    if (!user || user.uid !== uid) {
      throw new Error('Зөвхөн өөрийн мэдээллийг засах боломжтой');
    }
    
    const userRef = doc(db, 'users', uid);
    
    // Update Firestore
    await updateDoc(userRef, {
      ...data,
      updatedAt: new Date()
    });
    
    // Update Firebase Auth displayName if provided
    if (data.displayName) {
      try {
        await updateProfile(user, { displayName: data.displayName });
      } catch (error) {
        console.warn('Failed to update Firebase Auth profile:', error);
        // Continue even if Auth update fails
      }
    }
  } catch (error) {
    console.error('Error updating user data:', error);
    throw error;
  }
};

