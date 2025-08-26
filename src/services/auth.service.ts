import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../config/firebase';
import { COLLECTIONS } from '../constants/firebase';
import { User } from '../types';

// Local Storage Keys
const STORAGE_KEYS = {
  USER: 'chatapp_user',
  AUTH_STATE: 'chatapp_auth_state'
} as const;

export class AuthService {
  // Initialize auth state listener
  static initializeAuthListener(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get or create user in Firestore
          const user = await this.getOrCreateUser(firebaseUser);
          if (user) {
            // Store in localStorage
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
            localStorage.setItem(STORAGE_KEYS.AUTH_STATE, 'authenticated');
            
            // Update online status
            await this.updateUserOnlineStatus(user.uid, true);
            
            callback(user);
          } else {
            callback(null);
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          callback(null);
        }
      } else {
        // Clear localStorage on sign out
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
        callback(null);
      }
    });
  }

  // Get user from localStorage if available
  static getUserFromStorage(): User | null {
    try {
      const userStr = localStorage.getItem(STORAGE_KEYS.USER);
      const authState = localStorage.getItem(STORAGE_KEYS.AUTH_STATE);
      
      if (userStr && authState === 'authenticated') {
        return JSON.parse(userStr);
      }
    } catch (error) {
      console.error('Error getting user from storage:', error);
    }
    return null;
  }

  static async signInWithGoogle(): Promise<User | null> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      // Create or get user from Firestore
      const user = await this.getOrCreateUser(firebaseUser);
      
      if (user) {
        // Store in localStorage
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        localStorage.setItem(STORAGE_KEYS.AUTH_STATE, 'authenticated');
        
        // Update online status
        await this.updateUserOnlineStatus(user.uid, true);
      }
      
      return user;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  }

  static async signOut(): Promise<void> {
    try {
      const currentUser = this.getUserFromStorage();
      if (currentUser) {
        // Update offline status before signing out
        await this.updateUserOnlineStatus(currentUser.uid, false);
      }
      
      await firebaseSignOut(auth);
      
      // Clear localStorage
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    // First check localStorage
    const storedUser = this.getUserFromStorage();
    if (storedUser) {
      return storedUser;
    }

    // If not in storage, check Firebase auth
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      return await this.getOrCreateUser(firebaseUser);
    }

    return null;
  }

  private static async getOrCreateUser(firebaseUser: FirebaseUser): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Ensure we have a high-resolution photo URL
        let photoURL = firebaseUser.photoURL;
        if (photoURL && photoURL.includes('s96-c')) {
          photoURL = photoURL.replace('s96-c', 's400-c');
        }
        
        const user: User = {
          uid: firebaseUser.uid,
          email: userData.email || firebaseUser.email || '',
          displayName: userData.displayName || firebaseUser.displayName || 'Unknown User',
          photoURL: photoURL || '',
          isOnline: true, // User just signed in
          lastSeen: new Date(),
          createdAt: userData.createdAt?.toDate() || new Date()
        };
        
        // Update user data if needed
        await this.updateUserProfile(user);
        
        return user;
      } else {
        // Create new user
        const user: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'Unknown User',
          photoURL: firebaseUser.photoURL || '',
          isOnline: true,
          lastSeen: new Date(),
          createdAt: new Date()
        };
        
        await this.createUser(user);
        return user;
      }
    } catch (error) {
      console.error('Error getting or creating user:', error);
      return null;
    }
  }

  private static async createUser(user: User): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTIONS.USERS, user.uid), {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isOnline: user.isOnline,
        lastSeen: serverTimestamp(),
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  private static async updateUserProfile(user: User): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isOnline: true,
        lastSeen: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  }

  private static async updateUserOnlineStatus(uid: string, isOnline: boolean): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
        isOnline,
        lastSeen: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  }
}
