import { useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthScreen } from './components/auth/AuthScreen';
import { HomePage } from './components/layout/HomePage';
import { LoadingScreen } from './components/common/LoadingSpinner';
import { SoundService } from './services/firebase';

function App() {
  const { user, loading, error, signIn, signOut, isAuthenticated } = useAuth();

  // Initialize sound service
  useEffect(() => {
    SoundService.initialize();
    
    // Resume audio context on first user interaction
    const handleFirstInteraction = () => {
      SoundService.resumeAudioContext();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
    
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);
    
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <AuthScreen 
        onSignIn={signIn}
        loading={loading}
        error={error}
      />
    );
  }

  return (
    <HomePage 
      user={user!}
      onSignOut={signOut}
    />
  );
}

export default App;