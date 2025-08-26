import React from 'react';
import { MessageCircle, Settings, LogOut, User } from 'lucide-react';
import { User as UserType } from '../../types';

interface NavigationProps {
  user: UserType | null;
  onSignOut: () => void;
  onProfileClick: () => void;
  onSettingsClick: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  user,
  onSignOut,
  onProfileClick,
  onSettingsClick
}) => {
  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-primary-200 px-6 py-4 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              TalkWave
            </h1>
            <p className="text-xs text-secondary-500 -mt-1">Real-time Chat</p>
          </div>
        </div>

        {/* User Actions */}
        {user && (
          <div className="flex items-center space-x-4">
            {/* User Profile */}
            <button
              onClick={onProfileClick}
              className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors group"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full border-2 border-primary-200 group-hover:border-primary-300 transition-colors"
                />
              ) : (
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-secondary-800">{user.displayName}</p>
                <p className="text-xs text-secondary-500">
                  {user.isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </button>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 border-l border-primary-200 pl-4">
              <button
                onClick={onSettingsClick}
                className="p-2 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={onSignOut}
                className="p-2 text-secondary-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};