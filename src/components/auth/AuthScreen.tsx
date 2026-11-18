import React, { useState } from 'react';
import { MessageCircle, Radio } from 'lucide-react';

interface AuthScreenProps {
  onSignIn: () => void;
  onSignInAsGuest: (guestName: string) => void;
  onStartTempChat: () => void;
  loading: boolean;
  error: string | null;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ 
  onSignIn, 
  onSignInAsGuest, 
  onStartTempChat,
  loading, 
  error 
}) => {
  const [guestStep, setGuestStep] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [nameError, setNameError] = useState('');

  const handleGuestSubmit = () => {
    const trimmed = guestName.trim();
    if (!trimmed) {
      setNameError('பெயர் கொடுங்க • Please enter a name');
      return;
    }
    if (trimmed.length < 2) {
      setNameError('Minimum 2 characters');
      return;
    }
    if (trimmed.length > 20) {
      setNameError('Maximum 20 characters');
      return;
    }
    setNameError('');
    onSignInAsGuest(trimmed);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-100 via-white to-primary-200 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-2">
            Kathaithal
          </h1>
          <p className="text-secondary-600 text-lg">நண்பர்களோடு கதைப்போமா? • Connect in real-time</p>
        </div>

        {/* Sign In Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-primary-200">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-secondary-800 mb-1">கதைப்போமா?</h2>
            <p className="text-sm font-medium text-primary-600 mb-2">Welcome to Kathaithal</p>
            <p className="text-secondary-600 text-sm">Sign in with Google to start chatting</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={onSignIn}
            disabled={loading}
            className="w-full bg-white border-2 border-primary-200 text-secondary-700 py-4 px-6 rounded-xl hover:bg-primary-50 hover:border-primary-300 transition-all duration-200 font-medium flex items-center justify-center space-x-3 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5\" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-secondary-200" />
            <span className="px-3 text-xs text-secondary-400 font-medium">அல்லது • or</span>
            <div className="flex-1 border-t border-secondary-200" />
          </div>

          {/* Guest Sign In */}
          {!guestStep ? (
            <button
              onClick={() => setGuestStep(true)}
              disabled={loading}
              className="w-full bg-secondary-50 border-2 border-secondary-200 text-secondary-600 py-3 px-6 rounded-xl hover:bg-secondary-100 hover:border-secondary-300 transition-all duration-200 font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              <span>Continue as Guest</span>
            </button>
          ) : (
            <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-secondary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-secondary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-secondary-700">உங்கள் பெயர் • Your guest name</p>
              </div>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="e.g. Ravi, Priya, Kumar..."
                    value={guestName}
                    onChange={(e) => { setGuestName(e.target.value); setNameError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleGuestSubmit()}
                    maxLength={20}
                    autoFocus
                    className="w-full px-3 py-2.5 border-2 border-secondary-200 rounded-lg focus:ring-2 focus:ring-secondary-300 focus:border-secondary-400 outline-none text-sm text-secondary-800 placeholder-secondary-400 transition-colors"
                  />
                  {nameError && (
                    <p className="text-xs text-red-500 mt-1">{nameError}</p>
                  )}
                  {guestName.trim() && (
                    <p className="text-xs text-secondary-400 mt-1">
                      Will appear as: <span className="font-semibold text-secondary-600">{guestName.trim()}#XXXXXX</span>
                    </p>
                  )}
                </div>
                <button
                  onClick={handleGuestSubmit}
                  disabled={loading}
                  className="px-4 py-2.5 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors font-medium text-sm disabled:opacity-50 flex-shrink-0"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : 'Go'}
                </button>
              </div>
              <button
                onClick={() => { setGuestStep(false); setGuestName(''); setNameError(''); }}
                className="text-xs text-secondary-400 hover:text-secondary-600 transition-colors"
              >
                ← Back
              </button>
            </div>
          )}
          <p className="text-center text-xs text-secondary-400 mt-2">
            Guest chats are saved. No account needed.
          </p>

          {/* Divider */}
          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-secondary-200" />
            <span className="px-3 text-xs text-secondary-400 font-medium">தற்காலிக • ephemeral</span>
            <div className="flex-1 border-t border-secondary-200" />
          </div>

          {/* Temp P2P Chat Button */}
          <button
            type="button"
            onClick={onStartTempChat}
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-50 to-primary-50 border-2 border-amber-200 text-amber-900 py-3 px-6 rounded-xl hover:bg-amber-100 hover:border-amber-300 transition-all duration-200 font-medium flex items-center justify-center space-x-2 shadow-sm"
          >
            <Radio className="w-4 h-4 text-amber-600" />
            <span>Start Temp Chat (P2P • Ephemeral)</span>
          </button>
          <p className="text-center text-[11px] text-secondary-400 mt-1.5">
            Zero trace • Direct device-to-device • Gone on exit
          </p>

          <p className="text-center text-xs text-secondary-500 mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};