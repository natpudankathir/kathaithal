import React, { useState, useEffect } from 'react';
import { MessageCircle, LogOut, Search, UserPlus, X } from 'lucide-react';
import { User, Conversation } from '../../types';
import { FirestoreService, SoundService } from '../../services/firebase';
interface FriendsListProps {
  user: User;
  onSignOut: () => void;
  onConversationSelect: (conversation: Conversation) => void;
}

export const FriendsList: React.FC<FriendsListProps> = ({ user, onSignOut, onConversationSelect }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [addFriendEmail, setAddFriendEmail] = useState('');
  const [addFriendLoading, setAddFriendLoading] = useState(false);
  const [addFriendError, setAddFriendError] = useState('');
  const [addFriendSuccess, setAddFriendSuccess] = useState('');

  // Load conversations with real-time updates
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        const userConversations = await FirestoreService.getConversations(user.uid);
        console.log('Loaded conversations:', userConversations);
        setConversations(userConversations);
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();

    // Set up real-time listener for conversations
    const unsubscribe = FirestoreService.subscribeToConversations(user.uid, (updatedConversations) => {
      console.log('Real-time conversation update:', updatedConversations);
      setConversations(updatedConversations);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user.uid]);

  // Add friend by email
  const handleAddFriend = async () => {
    if (!addFriendEmail.trim()) return;

    try {
      setAddFriendLoading(true);
      setAddFriendError('');
      setAddFriendSuccess('');

      // Search for user by email
      const foundUser = await FirestoreService.searchUserByEmail(addFriendEmail.trim());
      
      if (!foundUser) {
        setAddFriendError('User not found with this email');
        return;
      }

      if (foundUser.uid === user.uid) {
        setAddFriendError("You can't add yourself as a friend");
        return;
      }

      // Check if conversation already exists
      const existingConversations = conversations.find(conv => 
        conv.participants.includes(foundUser.uid) && conv.participants.includes(user.uid)
      );

      if (existingConversations) {
        setAddFriendError('You already have a conversation with this user');
        setAddFriendEmail('');
        setShowAddFriend(false);
        return;
      }

      // Create or get conversation
      const conversationId = await FirestoreService.createOrGetConversation(user.uid, foundUser.uid);
      console.log('Conversation created/found with ID:', conversationId);
      
      // Show success message
      setAddFriendSuccess(`Conversation started with ${foundUser.displayName || foundUser.email}!`);
      
      // Force refresh conversations immediately - try multiple times to ensure it loads
      const refreshConversations = async () => {
        for (let i = 0; i < 3; i++) {
          try {
            const userConversations = await FirestoreService.getConversations(user.uid);
            console.log(`Refresh attempt ${i + 1}:`, userConversations.length, 'conversations');
            setConversations(userConversations);
            
            // Check if the new conversation is in the list
            const newConv = userConversations.find(conv => conv.id === conversationId);
            if (newConv) {
              console.log('New conversation found in list:', newConv);
              break;
            }
            
            // Wait a bit before next attempt
            if (i < 2) await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`Refresh attempt ${i + 1} failed:`, error);
          }
        }
      };
      
      await refreshConversations();

      // Reset form after a short delay to show success message
      setTimeout(() => {
        setAddFriendEmail('');
        setShowAddFriend(false);
        setAddFriendSuccess('');
      }, 3000);
      
      console.log('Conversation created successfully with ID:', conversationId);
    } catch (error) {
      console.error('Error adding friend:', error);
      setAddFriendError('Failed to add friend. Please try again.');
    } finally {
      setAddFriendLoading(false);
    }
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conversation => {
    const otherParticipant = conversation.participantDetails.find((p: any) => p.uid !== user.uid);
    return otherParticipant?.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           otherParticipant?.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = 'none';
    const fallback = e.currentTarget.parentElement?.querySelector('.fallback-avatar') as HTMLElement;
    if (fallback) {
      fallback.style.display = 'flex';
    }
  };

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hour(s) ago`;
    return `${Math.floor(diffInMinutes / 1440)} day(s) ago`;
  };  return (    <div className="h-screen bg-gradient-to-br from-primary-50 to-white flex flex-col">      {/* Header */}      <div className="bg-white/90 backdrop-blur-sm border-b border-primary-200 p-4">        <div className="flex items-center justify-between mb-4">          <div className="flex items-center space-x-3">            <div className="relative">              {user.photoURL ? (                <>                  <img                    src={user.photoURL}                    alt={user.displayName}                    className="w-10 h-10 rounded-full border-2 border-primary-200"                    onError={handleImageError}                  />                  <div                     className="fallback-avatar hidden w-10 h-10 rounded-full bg-primary-500 text-white text-sm font-semibold items-center justify-center border-2 border-primary-200"                  >                    {user.displayName?.charAt(0).toUpperCase() || 'U'}                  </div>                </>              ) : (                <div className="w-10 h-10 rounded-full bg-primary-500 text-white text-sm font-semibold flex items-center justify-center border-2 border-primary-200">                  {user.displayName?.charAt(0).toUpperCase() || 'U'}                </div>              )}              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>            </div>            <div>              <h2 className="font-semibold text-gray-800">{user.displayName}</h2>              <p className="text-xs text-gray-500 truncate max-w-[150px]">{user.email}</p>            </div>          </div>          <div className="flex items-center space-x-2">            <button              onClick={() => setShowAddFriend(!showAddFriend)}              className="p-2 hover:bg-primary-100 rounded-lg transition-colors"              title="Add Friend"            >              <UserPlus className="w-5 h-5 text-gray-600" />            </button>            <button              onClick={onSignOut}              className="p-2 hover:bg-red-100 rounded-lg transition-colors"              title="Sign Out"            >              <LogOut className="w-5 h-5 text-red-500" />            </button>          </div>        </div>        {/* Add Friend Section */}        {showAddFriend && (          <div className="mb-4 p-3 bg-primary-50 rounded-lg border border-primary-200">            <div className="flex items-center justify-between mb-2">              <h3 className="text-sm font-medium text-gray-800">Add Friend by Email</h3>              <button                onClick={() => {                  setShowAddFriend(false);                  setAddFriendEmail('');                  setAddFriendError('');                }}                className="p-1 hover:bg-primary-200 rounded"              >                <X className="w-4 h-4 text-gray-500" />              </button>            </div>            <div className="flex space-x-2">              <input                type="email"                value={addFriendEmail}                onChange={(e) => setAddFriendEmail(e.target.value)}                placeholder="Enter Gmail address..."                className="flex-1 px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"                onKeyPress={(e) => e.key === 'Enter' && handleAddFriend()}              />              <button                onClick={handleAddFriend}                disabled={!addFriendEmail.trim() || addFriendLoading}                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"              >                {addFriendLoading ? 'Adding...' : 'Add'}              </button>            </div>            {addFriendError && (              <p className="text-red-500 text-xs mt-2">{addFriendError}</p>            )}            {addFriendSuccess && (              <p className="text-green-500 text-xs mt-2">{addFriendSuccess}</p>            )}          </div>        )}        {/* Search */}        <div className="relative">          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />          <input            type="text"            value={searchQuery}            onChange={(e) => setSearchQuery(e.target.value)}            placeholder="Search conversations..."            className="w-full pl-10 pr-4 py-2 bg-white border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"          />        </div>      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">
              {conversations.length === 0 
                ? "No conversations yet. Add a friend to start chatting!" 
                : "No conversations match your search."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conversation) => {
              const otherParticipant = conversation.participantDetails.find(p => p.uid !== user.uid);
              if (!otherParticipant) return null;

              return (
                <button
                  key={conversation.id}
                  onClick={() => onConversationSelect(conversation)}
                  className="w-full flex items-center space-x-3 p-3 bg-white hover:bg-primary-50 rounded-lg border border-transparent hover:border-primary-200 transition-all duration-200 text-left"
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {otherParticipant.photoURL ? (
                      <>
                        <img
                          src={otherParticipant.photoURL}
                          alt={otherParticipant.displayName}
                          className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                          onError={handleImageError}
                        />
                        <div 
                          className="fallback-avatar hidden w-12 h-12 rounded-full bg-primary-500 text-white text-lg font-semibold items-center justify-center border-2 border-white shadow-sm"
                        >
                          {otherParticipant.displayName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      </>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary-500 text-white text-lg font-semibold flex items-center justify-center border-2 border-white shadow-sm">
                        {otherParticipant.displayName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    {otherParticipant.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {otherParticipant.displayName}
                      </h3>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {conversation.lastMessage 
                          ? formatLastSeen(conversation.lastMessage.createdAt)
                          : formatLastSeen(otherParticipant.lastSeen)
                        }
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage?.content || 'Start a conversation...'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
