// Auth Context - Authentication state management
// Firebase Auth is loaded asynchronously (dynamic import) so it doesn't block first paint / LCP
import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { resolveAuthEmail } from '@/utils/emailNormalize';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const unsubRef = useRef(() => {});

  useEffect(() => {
    (async () => {
      try {
        const { onAuthChange, getMe, ensureUserDocEmailForFirestoreRules } = await import(
          '@/services/authService'
        );
        unsubRef.current = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        await ensureUserDocEmailForFirestoreRules(
          firebaseUser,
          resolveAuthEmail(firebaseUser, null)
        );
        setUser(firebaseUser);
        // Immediately set basic user data (don't wait for Firestore)
        const basicUserData = {
          uid: firebaseUser.uid,
          email: resolveAuthEmail(firebaseUser, null),
          phone: firebaseUser.phoneNumber || '',
          phoneNumber: firebaseUser.phoneNumber || '',
          displayName:
            firebaseUser.displayName ||
            resolveAuthEmail(firebaseUser, null)?.split('@')[0] ||
            'Хэрэглэгч',
          role: 'user' // Default role, will be updated from Firestore if available
        };
        setUserData(basicUserData);
        setLoading(false); // Set loading to false immediately so pages can render
        
        // Then try to get full user data from Firestore (async, don't block)
        try {
          const data = await getMe();
          let profileForRules = null;
          if (data) {
            setUserData(data); // Update with full Firestore data including role
            profileForRules = data;
          } else {
            // If getMe returns null, try to get user data directly from Firestore
            const { getUserData } = await import('@/services/authService');
            const userDataFromFirestore = await getUserData(firebaseUser.uid);
            
            if (userDataFromFirestore) {
              const merged = {
                uid: firebaseUser.uid,
                ...userDataFromFirestore,
                email: resolveAuthEmail(firebaseUser, userDataFromFirestore),
              };
              setUserData(merged);
              profileForRules = merged;
            }
            // If Firestore doesn't have data, keep the basic userData we set above
          }
          await ensureUserDocEmailForFirestoreRules(firebaseUser, profileForRules?.email);
        } catch (error) {
          console.error('❌ AuthContext: Failed to get user data from Firestore:', error);
          console.error('❌ AuthContext: Error details:', {
            code: error.code,
            message: error.message,
            stack: error.stack
          });
          // Keep the basic userData we already set
        }
      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
        });
      } catch (err) {
        console.error('Auth load failed:', err);
        setLoading(false);
      }
    })();
    return () => unsubRef.current();
  }, []);

  const authEmail = useMemo(() => resolveAuthEmail(user, userData), [user, userData]);

  const value = {
    user,           // Firebase Auth user object
    userData,       // Firestore user data (email, role, etc.)
    authEmail,      // Resolved identity (email or phone synthetic) for queries/rules
    loading,        // Loading state
    isAuthenticated: !!user  // Boolean - нэвтэрсэн эсэх
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

