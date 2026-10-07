// Firebase configuration placeholder
// Note: Replace with actual Firebase config in production
export const firebaseConfig = {
  apiKey: "AIzaSyCOAtEd9PhrQvdX3-TLDwNzEBdwQ71sWDE",
  authDomain: "cm26tn.firebaseapp.com",
  databaseURL: "https://cm26tn-default-rtdb.firebaseio.com",
  projectId: "cm26tn",
  storageBucket: "cm26tn.firebasestorage.app",
  messagingSenderId: "1098092592637",
  appId: "1:1098092592637:web:e747952ab83274594eed94",
  measurementId: "G-PEHEVL90S5"
};

// Firestore collection names
export const COLLECTIONS = {
  USERS: 'users',
  FRIEND_REQUESTS: 'friendRequests',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages'
} as const;