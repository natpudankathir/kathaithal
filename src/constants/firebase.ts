// Firebase configuration placeholder
// Note: Replace with actual Firebase config in production
export const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

// Firestore collection names
export const COLLECTIONS = {
  USERS: 'users',
  FRIEND_REQUESTS: 'friendRequests',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages'
} as const;