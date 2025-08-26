import React, { useState } from 'react';
import { Users, UserPlus, Search, MessageSquare } from 'lucide-react';
import { Conversation, FriendRequest } from '../../types';

interface SidebarProps {
  conversations: Conversation[];
  friendRequests: FriendRequest[];
  currentConversation: Conversation | null;
  onConversationSelect: (conversation: Conversation) => void;
  onFriendRequestAction: (requestId: string, accept: boolean) => void;
}

type TabType = 'chats' | 'friends' | 'requests';

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  friendRequests,
  currentConversation,
  onConversationSelect,
  onFriendRequestAction
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('chats');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(conv =>
    conv.participantDetails.some(user =>
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const tabs = [
    { id: 'chats' as TabType, label: 'Chats', icon: MessageSquare, count: conversations.length },
    { id: 'friends' as TabType, label: 'Friends', icon: Users, count: 0 }, // TODO: Implement friends count
    { id: 'requests' as TabType, label: 'Requests', icon: UserPlus, count: friendRequests.length }
  ];

  return (
    <div className="w-80 bg-white/90 backdrop-blur-sm border-r border-primary-200 flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-primary-200">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-4 px-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-secondary-600 hover:text-primary-600 hover:bg-primary-25'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      {activeTab === 'chats' && (
        <div className="p-4 border-b border-primary-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-colors bg-white/80"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chats' && (
          <div className="space-y-1 p-2">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-secondary-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-secondary-300" />
                <p>No conversations yet</p>
                <p className="text-sm">Start chatting with friends!</p>
              </div>
            ) : (
              filteredConversations.map(conversation => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isActive={currentConversation?.id === conversation.id}
                  onClick={() => onConversationSelect(conversation)}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="text-center py-8 text-secondary-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-secondary-300" />
            <p>Friends list</p>
            <p className="text-sm">Coming soon...</p>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-2 p-4">
            {friendRequests.length === 0 ? (
              <div className="text-center py-8 text-secondary-500">
                <UserPlus className="w-12 h-12 mx-auto mb-3 text-secondary-300" />
                <p>No friend requests</p>
                <p className="text-sm">You're all caught up!</p>
              </div>
            ) : (
              friendRequests.map(request => (
                <FriendRequestItem
                  key={request.id}
                  request={request}
                  onAction={onFriendRequestAction}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, isActive, onClick }) => {
  const otherParticipant = conversation.participantDetails[0]; // TODO: Handle group chats
  const unreadCount = Object.values(conversation.unreadCount).reduce((sum, count) => sum + count, 0);

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-left ${
        isActive
          ? 'bg-primary-100 border border-primary-200'
          : 'hover:bg-primary-50 border border-transparent hover:border-primary-100'
      }`}
    >
      {/* Avatar */}
      <div className="relative">
        {otherParticipant?.photoURL ? (
          <img
            src={otherParticipant.photoURL}
            alt={otherParticipant.displayName}
            className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
          />
        ) : (
          <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium shadow-sm">
            {otherParticipant?.displayName?.charAt(0) || '?'}
          </div>
        )}
        {otherParticipant?.isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-secondary-800 truncate">
            {otherParticipant?.displayName || 'Unknown User'}
          </h3>
          {conversation.lastMessageAt && (
            <span className="text-xs text-secondary-500">
              {new Date(conversation.lastMessageAt).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-secondary-600 truncate">
            {conversation.lastMessage?.content || 'No messages yet'}
          </p>
          {unreadCount > 0 && (
            <span className="bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

interface FriendRequestItemProps {
  request: FriendRequest;
  onAction: (requestId: string, accept: boolean) => void;
}

const FriendRequestItem: React.FC<FriendRequestItemProps> = ({ request, onAction }) => {
  return (
    <div className="bg-white border border-primary-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center space-x-3 mb-3">
        {request.fromUser.photoURL ? (
          <img
            src={request.fromUser.photoURL}
            alt={request.fromUser.displayName}
            className="w-10 h-10 rounded-full border border-primary-200"
          />
        ) : (
          <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
            {request.fromUser.displayName.charAt(0)}
          </div>
        )}
        <div className="flex-1">
          <h4 className="font-medium text-secondary-800">{request.fromUser.displayName}</h4>
          <p className="text-sm text-secondary-600">{request.fromUser.email}</p>
        </div>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => onAction(request.id, true)}
          className="flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
        >
          Accept
        </button>
        <button
          onClick={() => onAction(request.id, false)}
          className="flex-1 bg-secondary-200 text-secondary-700 py-2 px-4 rounded-lg hover:bg-secondary-300 transition-colors text-sm font-medium"
        >
          Decline
        </button>
      </div>
    </div>
  );
};