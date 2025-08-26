// Firebase service - Modular exports
// Clean modular architecture for Firebase services

// Export all modular services
export { AuthService } from './auth.service';
export { UserService } from './user.service';
export { ConversationService } from './conversation.service';
export { MessageService } from './message.service';
export { SoundService } from './sound.service';

// Import services for legacy compatibility
import { UserService } from './user.service';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';

// Legacy class aliases for backward compatibility
export class FirestoreService {
  // User operations - delegate to UserService and AuthService
  static getUser = UserService.getUser;
  static updateUserOnlineStatus = UserService.updateUserOnlineStatus;
  static searchUserByEmail = UserService.searchUserByEmail;
  
  // Friend request operations - delegate to UserService
  static sendFriendRequest = UserService.sendFriendRequest;
  static getFriendRequests = UserService.getFriendRequests;
  static respondToFriendRequest = UserService.respondToFriendRequest;
  
  // Conversation operations - delegate to ConversationService
  static createConversation = ConversationService.createConversation;
  static getConversations = ConversationService.getConversations;
  static getConversationsSimple = ConversationService.getConversationsSimple;
  static createOrGetConversation = ConversationService.createOrGetConversation;
  static subscribeToConversations = ConversationService.subscribeToConversations;
  
  // Message operations - delegate to MessageService
  static sendMessage = MessageService.sendMessage;
  static getMessages = MessageService.getMessages;
  static markMessageAsRead = MessageService.markMessageAsRead;
  static sendTextMessage = MessageService.sendTextMessage;
  static sendMessageWithFile = MessageService.sendMessageWithFile;
  static subscribeToMessages = MessageService.subscribeToMessages;
  static uploadFile = MessageService.uploadFile;

  // Legacy methods that delegate to AuthService (for backward compatibility)
  static async createUser(_user: any): Promise<void> {
    // This method is now handled in AuthService.getOrCreateUser
    console.warn('FirestoreService.createUser is deprecated. User creation is handled automatically by AuthService.');
  }

  // Alias for getConversations (for backward compatibility)
  static getUserConversations = ConversationService.getConversations;
}