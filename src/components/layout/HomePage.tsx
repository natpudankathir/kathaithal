import React, { useState } from 'react';
import { FriendsList } from '../chat/FriendsList';
import { ChatWindow } from '../chat/ChatWindow';
import { User, Conversation } from '../../types';

interface HomePageProps {
  user: User;
  onSignOut: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ user, onSignOut }) => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleBackToConversations = () => {
    setSelectedConversation(null);
  };

  return (
    <div className="h-screen overflow-hidden">
      {selectedConversation ? (
        <ChatWindow
          conversation={selectedConversation}
          user={user}
          onBack={handleBackToConversations}
        />
      ) : (
        <FriendsList
          user={user}
          onSignOut={onSignOut}
          onConversationSelect={handleConversationSelect}
        />
      )}
    </div>
  );
};