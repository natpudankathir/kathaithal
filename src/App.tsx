import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthScreen } from './components/auth/AuthScreen';
import { HomePage } from './components/layout/HomePage';
import { LoadingScreen } from './components/common/LoadingSpinner';
import { TempChatScreen } from './components/chat/TempChatScreen';
import { SoundService } from './services/firebase';

function App() {
  const { user, loading, error, signIn, signInAsGuest, signOut, isAuthenticated } = useAuth();
  const [isTempChat, setIsTempChat] = useState(false);
  const [tempRoomCode, setTempRoomCode] = useState<string | null>(null);

  // Check URL query parameters for temp room link on mount
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tempParam = urlParams.get('temp');
      if (tempParam) {
        setTempRoomCode(tempParam);
        setIsTempChat(true);
      }
    } catch (e) {
      console.warn('Error reading URL params:', e);
    }
  }, []);

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

  if (isTempChat) {
    return (
      <TempChatScreen 
        initialRoomCode={tempRoomCode}
        onExit={() => {
          setIsTempChat(false);
          setTempRoomCode(null);
          // Clean URL query param without full page reload
          if (window.history.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }}
      />
    );
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <AuthScreen 
        onSignIn={signIn}
        onSignInAsGuest={(name) => signInAsGuest(name)}
        onStartTempChat={() => setIsTempChat(true)}
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