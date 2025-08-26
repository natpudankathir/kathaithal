import React from 'react';
import { MessageCircle, LogOut, Search } from 'lucide-react';
import { User } from '../../types';

interface Friend {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  lastMessage: string;
  lastSeen: string;
}

interface FriendsListProps {
  user: User;
  onSignOut: () => void;
  onFriendSelect: (friend: Friend) => void;
}

export const FriendsList: React.FC<FriendsListProps> = ({ user, onSignOut, onFriendSelect }) => {
  // Debug user data
  console.log('FriendsList received user:', user);
  console.log('User photoURL:', user.photoURL);
  
  // Demo friends data
  const friends: Friend[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150',
      isOnline: true,
      lastMessage: 'Hey! How are you doing?',
      lastSeen: '2 min ago'
    },
    {
      id: '2',
      name: 'Mike Chen',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150',
      isOnline: true,
      lastMessage: 'Let\'s meet up this weekend!',
      lastSeen: '5 min ago'
    },
    {
      id: '3',
      name: 'Emma Wilson',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
      isOnline: false,
      lastMessage: 'Thanks for the help yesterday',
      lastSeen: '1 hour ago'
    },
    {
      id: '4',
      name: 'Alex Rodriguez',
      avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150',
      isOnline: false,
      lastMessage: 'See you tomorrow!',
      lastSeen: '3 hours ago'
    },
    {
      id: '5',
      name: 'Lisa Park',
      avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150',
      isOnline: true,
      lastMessage: 'Great job on the presentation!',
      lastSeen: '10 min ago'
    }
  ];

  return (
    <div className="h-screen bg-gradient-to-br from-primary-50 to-white flex flex-col">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-primary-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                TalkWave
              </h1>
              <p className="text-xs text-secondary-500">Real-time Chat</p>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="p-2 text-secondary-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center space-x-3 p-3 bg-primary-50 rounded-xl">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="w-12 h-12 rounded-full border-2 border-primary-200 object-cover"
              onError={(e) => {
                console.log('Photo loading error:', e);
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold ${user.photoURL ? 'hidden' : ''}`}>
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-secondary-800">{user.displayName}</h3>
            <p className="text-sm text-secondary-600">Online</p>
          </div>
        </div>
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input
            type="text"
            placeholder="Search friends..."
            className="w-full pl-10 pr-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-colors bg-white/80"
          />
        </div>
      </div>

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="text-lg font-semibold text-secondary-800 mb-4">Friends ({friends.length})</h2>
        <div className="space-y-2">
          {friends.map((friend) => (
            <button
              key={friend.id}
              onClick={() => onFriendSelect(friend)}
              className="w-full flex items-center space-x-3 p-4 rounded-xl hover:bg-white/80 hover:shadow-md transition-all duration-200 border border-transparent hover:border-primary-200 group"
            >
              {/* Avatar */}
              <div className="relative">
                <img
                  src={friend.avatar}
                  alt={friend.name}
                  className="w-14 h-14 rounded-full border-2 border-white shadow-sm group-hover:border-primary-200 transition-colors"
                />
                {friend.isOnline && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                )}
              </div>

              {/* Friend Info */}
              <div className="flex-1 text-left">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-secondary-800 group-hover:text-primary-700 transition-colors">
                    {friend.name}
                  </h3>
                  <span className="text-xs text-secondary-500">{friend.lastSeen}</span>
                </div>
                <p className="text-sm text-secondary-600 truncate mt-1">{friend.lastMessage}</p>
                <div className="flex items-center mt-1">
                  <div className={`w-2 h-2 rounded-full mr-2 ${friend.isOnline ? 'bg-green-500' : 'bg-secondary-300'}`} />
                  <span className="text-xs text-secondary-500">
                    {friend.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};