import { useState, useEffect } from 'react';
import { Conversation, Message, ChatState } from '../types';
import { FirestoreService } from '../services/firebase';

export const useChat = (userId: string | null) => {
  const [chatState, setChatState] = useState<ChatState>({
    conversations: [],
    currentConversation: null,
    messages: [],
    loading: false,
    error: null
  });

  useEffect(() => {
    if (!userId) return;

    // TODO: Set up real-time listeners for conversations
    const loadConversations = async () => {
      setChatState(prev => ({ ...prev, loading: true }));
      try {
        const conversations = await FirestoreService.getConversations(userId);
        setChatState(prev => ({
          ...prev,
          conversations,
          loading: false,
          error: null
        }));
      } catch (error) {
        setChatState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load conversations'
        }));
      }
    };

    loadConversations();
  }, [userId]);

  const selectConversation = async (conversation: Conversation) => {
    setChatState(prev => ({ ...prev, currentConversation: conversation, loading: true }));
    try {
      const messages = await FirestoreService.getMessages(conversation.id);
      setChatState(prev => ({
        ...prev,
        messages,
        loading: false,
        error: null
      }));
    } catch (error) {
      setChatState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load messages'
      }));
    }
  };

  const sendMessage = async (content: string) => {
    if (!chatState.currentConversation || !userId) return;

    try {
      await FirestoreService.sendMessage({
        conversationId: chatState.currentConversation.id,
        senderId: userId,
        senderName: 'Current User', // TODO: Get from auth context
        content,
        type: 'text',
        readBy: [userId]
      });
    } catch (error) {
      setChatState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to send message'
      }));
    }
  };

  return {
    conversations: chatState.conversations,
    currentConversation: chatState.currentConversation,
    messages: chatState.messages,
    loading: chatState.loading,
    error: chatState.error,
    selectConversation,
    sendMessage
  };
};