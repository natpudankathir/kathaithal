// User Types
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
}

// Friend Request Types
export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUser: User;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

// Conversation Types
export interface Conversation {
  id: string;
  participants: string[];
  participantDetails: User[];
  messages?: Message[]; // Optional since we use subcollections
  lastMessage?: Message;
  lastMessageAt: Date;
  unreadCount: Record<string, number>;
  createdAt: Date;
}

// Message Types (optimized for subcollection storage)
export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderPhotoURL?: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
  readBy: string[];
  createdAt: Date;
  updatedAt?: Date;
}

// Auth Types
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Chat Types
export interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
}