import { useState, useEffect } from 'react';
import { AuthState } from '../types';
import { AuthService } from '../services/firebase';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = AuthService.getUserFromStorage();
    if (storedUser) {
      setAuthState({
        user: storedUser,
        loading: false,
        error: null
      });
    } else {
      setAuthState(prev => ({ ...prev, loading: false }));
    }

    // Initialize auth state listener
    const unsubscribe = AuthService.initializeAuthListener((user) => {
      setAuthState({
        user,
        loading: false,
        error: null
      });
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const user = await AuthService.signInWithGoogle();
      
      setAuthState({
        user,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Sign in error:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Sign in failed'
      }));
    }
  };

  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      await AuthService.signOut();
      
      setAuthState({
        user: null,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Sign out error:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Sign out failed'
      }));
    }
  };

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    signIn,
    signOut,
    isAuthenticated: !!authState.user
  };
};