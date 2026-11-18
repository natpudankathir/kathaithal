import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  signInAnonymously,
  updateProfile,
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

  static async signInAsGuest(guestName: string): Promise<User | null> {
    try {
      const result = await signInAnonymously(auth);
      const firebaseUser = result.user;

      // Append 6-char uid suffix for uniqueness: "Ravi#A3F9B2"
      const shortId = firebaseUser.uid.slice(-6).toUpperCase();
      const guestDisplayName = `${guestName}#${shortId}`;

      // Update Firebase Auth profile so all auth listeners get the name immediately
      try {
        await updateProfile(firebaseUser, { displayName: guestDisplayName });
      } catch (profileErr) {
        console.warn('Failed to update auth profile displayName:', profileErr);
      }

      const user: User = {
        uid: firebaseUser.uid,
        email: '',
        displayName: guestDisplayName,
        photoURL: '',
        isOnline: true,
        lastSeen: new Date(),
        createdAt: new Date(),
        isGuest: true
      };

      // Set localStorage immediately before Firestore or listeners
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.AUTH_STATE, 'authenticated');

      // Persist to Firestore with merge
      await this.createOrUpdateGuestUser(user);

      return user;
    } catch (error) {
      console.error('Error signing in as guest:', error);
      throw error;
    }
  }

  private static async createOrUpdateGuestUser(user: User): Promise<void> {
    try {
      const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
      const shortId = user.uid.slice(-6).toUpperCase();
      await setDoc(userDocRef, {
        email: '',
        displayName: user.displayName,
        normalizedName: user.displayName.toLowerCase(),
        guestTag: shortId,
        photoURL: '',
        isOnline: true,
        isGuest: true,
        lastSeen: serverTimestamp(),
        createdAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error creating/updating guest user:', error);
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
      const storedUser = this.getUserFromStorage();
      const isStoredMatch = storedUser?.uid === firebaseUser.uid;
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Ensure we have a high-resolution photo URL
        let photoURL = firebaseUser.photoURL;
        if (photoURL && photoURL.includes('s96-c')) {
          photoURL = photoURL.replace('s96-c', 's400-c');
        }

        const isGuest = userData.isGuest || (isStoredMatch && storedUser?.isGuest) || firebaseUser.isAnonymous || false;
        const displayName = userData.displayName 
          || firebaseUser.displayName 
          || (isStoredMatch ? storedUser?.displayName : '')
          || (isGuest ? `Guest_${firebaseUser.uid.slice(-6).toUpperCase()}` : 'Unknown User');
        
        const user: User = {
          uid: firebaseUser.uid,
          email: userData.email || firebaseUser.email || '',
          displayName,
          photoURL: photoURL || '',
          isOnline: true, // User just signed in
          lastSeen: new Date(),
          createdAt: userData.createdAt?.toDate() || new Date(),
          isGuest
        };
        
        // Update user data if needed
        await this.updateUserProfile(user);
        
        return user;
      } else {
        // Create new user
        const isGuest = (isStoredMatch && storedUser?.isGuest) || firebaseUser.isAnonymous || false;
        const displayName = firebaseUser.displayName 
          || (isStoredMatch ? storedUser?.displayName : '')
          || (isGuest ? `Guest_${firebaseUser.uid.slice(-6).toUpperCase()}` : 'Unknown User');

        const user: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName,
          photoURL: firebaseUser.photoURL || '',
          isOnline: true,
          lastSeen: new Date(),
          createdAt: new Date(),
          isGuest
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
      const shortId = user.uid.slice(-6).toUpperCase();
      const userData: any = {
        email: user.email,
        displayName: user.displayName,
        normalizedName: user.displayName.toLowerCase(),
        photoURL: user.photoURL,
        isOnline: user.isOnline,
        isGuest: !!user.isGuest,
        lastSeen: serverTimestamp(),
        createdAt: serverTimestamp()
      };
      if (user.isGuest) {
        userData.guestTag = shortId;
      }
      await setDoc(doc(db, COLLECTIONS.USERS, user.uid), userData, { merge: true });
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  private static async updateUserProfile(user: User): Promise<void> {
    try {
      const updateData: any = {
        email: user.email,
        displayName: user.displayName,
        normalizedName: user.displayName.toLowerCase(),
        photoURL: user.photoURL,
        isOnline: true,
        lastSeen: serverTimestamp()
      };
      if (user.isGuest) {
        updateData.isGuest = true;
        updateData.guestTag = user.uid.slice(-6).toUpperCase();
      }
      await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), updateData);
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
