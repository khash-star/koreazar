// Firebase Authentication Service

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
} from 'firebase/auth';
import { auth } from '@/firebase/config';
import { doc, setDoc, getDoc, updateDoc, collection, getDocs, query, where, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { deleteAllFirestoreDataForUser } from '@/services/accountDeletion';

/** Нөхцөл өөрчлөгдөхөд дугаарлаж шинэчлэх (Firestore users.{termsVersion}) */
export const TERMS_POLICY_VERSION = '2025-03-28';

const USER_SYNC_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.zarkorea.com/index.php';
const buildUserSyncUrl = () => {
  const url = new URL(USER_SYNC_API_BASE_URL);
  url.searchParams.set('action', 'user_sync');
  return url.toString();
};

const syncUserToMySql = async (user, profile = {}) => {
  if (!user) return;
  try {
    const token = await user.getIdToken(true);
    const res = await fetch(buildUserSyncUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        display_name: profile.displayName || user.displayName || user.email?.split('@')[0] || '',
        phone: profile.phone || '',
        city: profile.city || '',
        district: profile.district || '',
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.customer_id != null && !Number.isNaN(Number(data.customer_id))) {
      const customerId = Number(data.customer_id);
      const userRef = doc(db, 'users', user.uid);
      try {
        await updateDoc(userRef, { customerId });
      } catch {
        await setDoc(userRef, { customerId }, { merge: true });
      }
    }
  } catch (e) {
    console.warn('MySQL user sync failed:', e?.message || e);
  }
};

/**
 * Үйлчилгээний нөхцөл зөвшөөрсөн тэмдэглэл (хуучин хэрэглэгчдэд талбар байхгүй бол нэг удаа).
 */
export async function ensureTermsAcceptanceIfMissing(user) {
  if (!user?.uid) return;
  try {
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    if (snap.exists() && snap.data()?.termsAcceptedAt != null) return;
    await setDoc(
      ref,
      {
        termsAcceptedAt: serverTimestamp(),
        termsVersion: TERMS_POLICY_VERSION,
        termsAckSource: 'login',
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('ensureTermsAcceptanceIfMissing:', e?.message || e);
  }
}

/**
 * Нэвтрэх (Email/Password)
 * @param {string} email - Имэйл хаяг
 * @param {string} password - Нууц үг
 * @returns {Promise<User>} Firebase User object
 */
export const login = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  await syncUserToMySql(userCredential.user, {});
  await ensureTermsAcceptanceIfMissing(userCredential.user);
  return userCredential.user;
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
        facebook: '',
        termsAcceptedAt: serverTimestamp(),
        termsVersion: TERMS_POLICY_VERSION,
        termsAckSource: 'register',
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
    await syncUserToMySql(user, {
      displayName: displayName || user.email.split('@')[0],
      phone: phone || '',
    });

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
  await signOut(auth);
};

/**
 * Бүртгэл бүрэн устгах (нэвтрэх нууц үгээр дахин баталгаажуулна). Apple 5.1.1(v).
 * @param {string} password - Одоогийн нууц үг
 */
export const deleteAccountWithPassword = async (password) => {
  const user = auth.currentUser;
  if (!user?.email) throw new Error('Нэвтэрсэн хэрэглэгч олдсонгүй');
  const pwd = typeof password === 'string' ? password.trim() : '';
  if (!pwd) throw new Error('Нууц үгээ оруулна уу');

  const credential = EmailAuthProvider.credential(user.email, pwd);
  try {
    await reauthenticateWithCredential(user, credential);
  } catch (e) {
    const code = e?.code || '';
    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      throw new Error('Нууц үг буруу байна');
    }
    if (code === 'auth/requires-recent-login' || code === 'auth/user-mismatch') {
      throw new Error('Аюулгүй байдлын шалтгаанаар дахин нэвтэрч, дахин оролдоно уу');
    }
    throw e;
  }

  const uid = user.uid;
  const email = user.email;
  await deleteAllFirestoreDataForUser(uid, email);

  try {
    await deleteUser(user);
  } catch (e) {
    const code = e?.code || '';
    if (code === 'auth/requires-recent-login') {
      throw new Error('Өгөгдөл устгагдсан боловч бүртгэлийг бүрэн хаахын тулд дахин нэвтэрч оролдоно уу');
    }
    throw e;
  }
};

/**
 * Нууц үг сэргээх имэйл илгээх
 * @param {string} email - Имэйл хаяг
 * @returns {Promise<void>}
 */
export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
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
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (userDoc.exists()) {
      const data = { id: userDoc.id, ...userDoc.data() };
      return data;
    }
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
 * Same-origin path only – prevents open redirect
 * @param {string} url - Full URL or path
 * @returns {string|null} Safe path or null
 */
function toSafePath(url) {
  if (!url || typeof url !== 'string') return null;
  let path = url.trim();
  try {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      const u = new URL(path);
      if (u.origin !== window.location.origin) return null;
      path = u.pathname + u.search;
    }
    if (!path || path === '/' || path.startsWith('/Login')) return null;
    return path.startsWith('/') ? path : '/' + path;
  } catch {
    return null;
  }
}

/**
 * Login хуудас руу чиглүүлэх
 * @param {string} redirectUrl - Нэвтрэсний дараа чиглүүлэх URL эсвэл path (optional)
 */
export const redirectToLogin = (redirectUrl = null) => {
  const currentPath = window.location.pathname + window.location.search;
  const safePath = redirectUrl ? toSafePath(redirectUrl) : (currentPath && currentPath !== '/' && !currentPath.startsWith('/Login') ? currentPath : null);
  
  if (safePath) {
    window.location.href = `/Login?redirect=${encodeURIComponent(safePath)}`;
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
    await syncUserToMySql(user, data);
  } catch (error) {
    console.error('Error updating user data:', error);
    throw error;
  }
};

