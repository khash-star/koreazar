// Auth Context - Authentication state management
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange, getMe } from '@/services/authService';
import { auth } from '@/firebase/config';

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

  useEffect(() => {
    // Auth state өөрчлөлтийг хянах
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Immediately set basic user data (don't wait for Firestore)
        const basicUserData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          role: 'user' // Default role, will be updated from Firestore if available
        };
        setUserData(basicUserData);
        setLoading(false); // Set loading to false immediately so pages can render
        
        // Then try to get full user data from Firestore (async, don't block)
        try {
          console.log('🔍 AuthContext: Getting user data from Firestore...');
          console.log('🔍 AuthContext: Firebase User UID:', firebaseUser.uid);
          console.log('🔍 AuthContext: Firebase User Email:', firebaseUser.email);
          
          const data = await getMe();
          console.log('🔍 AuthContext: getMe() returned:', data);
          
          if (data) {
            console.log('🔍 AuthContext: Setting userData with role:', data.role);
            setUserData(data); // Update with full Firestore data including role
          } else {
            console.warn('🔍 AuthContext: getMe() returned null, trying getUserData directly...');
            // If getMe returns null, try to get user data directly from Firestore
            const { getUserData } = await import('@/services/authService');
            const userDataFromFirestore = await getUserData(firebaseUser.uid);
            console.log('🔍 AuthContext: getUserData() returned:', userDataFromFirestore);
            
            if (userDataFromFirestore) {
              console.log('🔍 AuthContext: Setting userData from getUserData with role:', userDataFromFirestore.role);
              setUserData({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                ...userDataFromFirestore
              });
            } else {
              console.warn('🔍 AuthContext: No user data found in Firestore for UID:', firebaseUser.uid);
            }
            // If Firestore doesn't have data, keep the basic userData we set above
          }
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

    return () => unsubscribe();
  }, []);

  const value = {
    user,           // Firebase Auth user object
    userData,       // Firestore user data (email, role, etc.)
    loading,        // Loading state
    isAuthenticated: !!user  // Boolean - нэвтэрсэн эсэх
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

