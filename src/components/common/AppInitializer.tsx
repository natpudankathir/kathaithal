import React, { useEffect } from 'react';
import { auth } from '../../config/firebase';

interface AppInitializerProps {
  children: React.ReactNode;
}

export const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  useEffect(() => {
    // Test Firebase connection
    console.log('Firebase Auth initialized:', !!auth);
    console.log('Firebase config loaded:', {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? 'Set' : 'Missing',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? 'Set' : 'Missing',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? 'Set' : 'Missing'
    });

    // Listen for auth state changes to debug user photo
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('Current Firebase User:', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          providerId: user.providerId
        });
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return <>{children}</>;
};
