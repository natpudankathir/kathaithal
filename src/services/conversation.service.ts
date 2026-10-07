import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  serverTimestamp,
  onSnapshot, 
  limit,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLLECTIONS } from '../constants/firebase';
import { Conversation, Message } from '../types';
import { UserService } from './user.service';

export class ConversationService {
  static async createConversation(participants: string[]): Promise<string> {
    try {
      const conversationRef = await addDoc(collection(db, COLLECTIONS.CONVERSATIONS), {
        participants,
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        unreadCount: participants.reduce((acc, userId) => {
          acc[userId] = 0;
          return acc;
        }, {} as Record<string, number>)
      });

      return conversationRef.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  static async getConversations(userId: string): Promise<Conversation[]> {
    try {
      console.log('Getting conversations for user:', userId);
      
      // Try the indexed query first
      try {
        const conversations = await getDocs(
          query(
            collection(db, COLLECTIONS.CONVERSATIONS),
            where('participants', 'array-contains', userId),
            orderBy('lastMessageAt', 'desc')
          )
        );

        console.log('Found', conversations.docs.length, 'conversations (indexed)');
        return await ConversationService.processConversations(conversations.docs);
      } catch (indexError) {
        console.warn('Indexed query failed, trying simple query:', indexError);
        return await ConversationService.getConversationsSimple(userId);
      }
    } catch (error) {
      console.error('Error getting conversations:', error);
      return [];
    }
  }

  // Fallback method to get conversations without ordering (in case of index issues)
  static async getConversationsSimple(userId: string): Promise<Conversation[]> {
    try {
      console.log('Getting conversations (simple) for user:', userId);
      
      const conversations = await getDocs(
        query(
          collection(db, COLLECTIONS.CONVERSATIONS),
          where('participants', 'array-contains', userId)
        )
      );

      console.log('Found', conversations.docs.length, 'conversations (simple)');
      const conversationList = await ConversationService.processConversations(conversations.docs);

      // Sort manually by lastMessageAt
      conversationList.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());

      console.log('Returning', conversationList.length, 'conversations (simple)');
      return conversationList;
    } catch (error) {
      console.error('Error getting conversations (simple):', error);
      return [];
    }
  }

  private static async processConversations(docs: any[]): Promise<Conversation[]> {
    const conversationList: Conversation[] = [];
    
    for (const doc of docs) {
      const data = doc.data();
      if (data.isDeleted) {
        continue;
      }

      console.log('Processing conversation:', doc.id, 'with participants:', data.participants);
      
      // Get participant details
      const participantDetails = [];
      for (const participantId of data.participants) {
        const user = await UserService.getUser(participantId);
        if (user) {
          participantDetails.push(user);
        }
      }

      console.log('Participant details loaded:', participantDetails.length, 'participants');

      // Get last message
      const lastMessage = await ConversationService.getLastMessage(doc.id);

      const conversation = {
        id: doc.id,
        participants: data.participants,
        participantDetails,
        lastMessage,
        lastMessageAt: data.lastMessageAt?.toDate() || new Date(),
        unreadCount: data.unreadCount || {},
        createdAt: data.createdAt?.toDate() || new Date(),
        isGroup: !!data.isGroup,
        groupName: data.groupName || undefined,
        groupPhotoURL: data.groupPhotoURL || undefined,
        createdById: data.createdById || undefined,
        isDeleted: data.isDeleted,
        deletedAt: data.deletedAt?.toDate(),
        deletedBy: data.deletedBy
      };

      conversationList.push(conversation);
      console.log('Added conversation to list:', conversation.id);
    }

    return conversationList;
  }

  private static async getLastMessage(conversationId: string): Promise<Message | undefined> {
    try {
      console.log('Getting last message for conversation:', conversationId);
      
      // Get last message from subcollection under the conversation
      const messagesRef = collection(db, COLLECTIONS.CONVERSATIONS, conversationId, 'messages');
      const lastMessageQuery = query(messagesRef, orderBy('createdAt', 'desc'), limit(1));
      const messages = await getDocs(lastMessageQuery);

      if (!messages.empty) {
        const doc = messages.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          senderId: data.senderId,
          senderName: data.senderName,
          senderPhotoURL: data.senderPhotoURL,
          content: data.content,
          type: data.type,
          readBy: data.readBy || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate()
        };
      }
    } catch (error) {
      console.error('Error getting last message:', error);
    }
    return undefined;
  }

  static async createOrGetConversation(userId1: string, userId2: string): Promise<string> {
    try {
      console.log('Creating or getting conversation between:', userId1, 'and', userId2);
      
      // Check if conversation already exists with both users
      const existingConversations = await getDocs(
        query(
          collection(db, COLLECTIONS.CONVERSATIONS),
          where('participants', 'array-contains', userId1)
        )
      );

      for (const doc of existingConversations.docs) {
        const data = doc.data();
        if (data.isDeleted) continue;
        const participants = data.participants || [];
        if (participants.includes(userId2) && participants.length === 2 && !data.isGroup) {
          console.log('Found existing conversation:', doc.id);
          return doc.id;
        }
      }

      // Create new conversation
      console.log('Creating new conversation...');
      const conversationRef = await addDoc(collection(db, COLLECTIONS.CONVERSATIONS), {
        participants: [userId1, userId2],
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        unreadCount: {
          [userId1]: 0,
          [userId2]: 0
        }
      });

      console.log('New conversation created with ID:', conversationRef.id);
      return conversationRef.id;
    } catch (error) {
      console.error('Error creating or getting conversation:', error);
      throw error;
    }
  }

  // Real-time conversation subscription
  static subscribeToConversations(userId: string, callback: (conversations: Conversation[]) => void): () => void {
    // Try indexed query first, fallback to simple query if it fails
    const tryIndexedSubscription = () => {
      const conversationsQuery = query(
        collection(db, COLLECTIONS.CONVERSATIONS),
        where('participants', 'array-contains', userId),
        orderBy('lastMessageAt', 'desc')
      );

      return onSnapshot(conversationsQuery, async (snapshot) => {
        try {
          const conversationList = await ConversationService.processConversations(snapshot.docs);
          callback(conversationList);
        } catch (error) {
          console.error('Error in conversation subscription:', error);
        }
      }, (error) => {
        console.error('Indexed subscription failed, trying simple subscription:', error);
        return trySimpleSubscription();
      });
    };

    const trySimpleSubscription = () => {
      const conversationsQuery = query(
        collection(db, COLLECTIONS.CONVERSATIONS),
        where('participants', 'array-contains', userId)
      );

      return onSnapshot(conversationsQuery, async (snapshot) => {
        try {
          const conversationList = await ConversationService.processConversations(snapshot.docs);

          // Sort manually by lastMessageAt
          conversationList.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());

          callback(conversationList);
        } catch (error) {
          console.error('Error in simple conversation subscription:', error);
        }
      }, (error) => {
        console.error('Simple subscription also failed:', error);
      });
    };

    // Start with indexed subscription
    return tryIndexedSubscription();
  }

  // Create a new group conversation
  static async createGroupConversation(
    groupName: string,
    participantUids: string[],
    creatorUid: string
  ): Promise<string> {
    try {
      const allParticipants = Array.from(new Set([creatorUid, ...participantUids]));
      const conversationRef = await addDoc(collection(db, COLLECTIONS.CONVERSATIONS), {
        isGroup: true,
        groupName: groupName.trim(),
        createdById: creatorUid,
        participants: allParticipants,
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        unreadCount: allParticipants.reduce((acc, uid) => {
          acc[uid] = 0;
          return acc;
        }, {} as Record<string, number>)
      });

      return conversationRef.id;
    } catch (error) {
      console.error('Error creating group conversation:', error);
      throw error;
    }
  }

  // Add members to an existing group
  static async addParticipantsToGroup(conversationId: string, newUserIds: string[]): Promise<void> {
    try {
      const convRef = doc(db, COLLECTIONS.CONVERSATIONS, conversationId);
      await updateDoc(convRef, {
        participants: arrayUnion(...newUserIds)
      });
    } catch (error) {
      console.error('Error adding participants to group:', error);
      throw error;
    }
  }

  // Remove member from group (or leave group)
  static async removeParticipantFromGroup(conversationId: string, userId: string): Promise<void> {
    try {
      const convRef = doc(db, COLLECTIONS.CONVERSATIONS, conversationId);
      await updateDoc(convRef, {
        participants: arrayRemove(userId)
      });
    } catch (error) {
      console.error('Error removing participant from group:', error);
      throw error;
    }
  }

  // Rename group
  static async updateGroupName(conversationId: string, groupName: string): Promise<void> {
    try {
      const convRef = doc(db, COLLECTIONS.CONVERSATIONS, conversationId);
      await updateDoc(convRef, {
        groupName: groupName.trim()
      });
    } catch (error) {
      console.error('Error updating group name:', error);
      throw error;
    }
  }

  // Soft delete conversation (marks doc for future purge job)
  static async deleteConversation(conversationId: string, deletedBy?: string): Promise<void> {
    try {
      console.log('Soft-deleting conversation:', conversationId);
      const convRef = doc(db, COLLECTIONS.CONVERSATIONS, conversationId);
      await updateDoc(convRef, {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        ...(deletedBy ? { deletedBy } : {})
      });
      console.log('Conversation soft-deleted successfully');
    } catch (error) {
      console.error('Error soft-deleting conversation:', error);
      throw error;
    }
  }
}
