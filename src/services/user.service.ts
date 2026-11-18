import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLLECTIONS } from '../constants/firebase';
import { User, FriendRequest } from '../types';

export class UserService {
  static async getUser(uid: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          uid,
          email: userData.email,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          isOnline: userData.isOnline,
          lastSeen: userData.lastSeen?.toDate() || new Date(),
          createdAt: userData.createdAt?.toDate() || new Date()
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  static async updateUserOnlineStatus(uid: string, isOnline: boolean): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
        isOnline,
        lastSeen: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  }

  private static mapDocToUser(docSnap: any): User {
    const userData = docSnap.data();
    return {
      uid: docSnap.id,
      email: userData.email || '',
      displayName: userData.displayName || 'Unknown User',
      photoURL: userData.photoURL || '',
      isOnline: userData.isOnline ?? false,
      lastSeen: userData.lastSeen?.toDate() || new Date(),
      createdAt: userData.createdAt?.toDate() || new Date(),
      isGuest: userData.isGuest || false
    };
  }

  static async searchUser(queryTerm: string): Promise<User | null> {
    try {
      const term = queryTerm.trim();
      if (!term) return null;

      console.log('Searching for user with query:', term);

      // 1. If email format
      if (term.includes('@')) {
        const emailQuery = query(
          collection(db, COLLECTIONS.USERS),
          where('email', '==', term.toLowerCase())
        );
        const emailSnap = await getDocs(emailQuery);
        if (!emailSnap.empty) {
          return UserService.mapDocToUser(emailSnap.docs[0]);
        }
      }

      // 2. Exact displayName match (e.g. "Ravi#A3F9B2")
      const nameQuery = query(
        collection(db, COLLECTIONS.USERS),
        where('displayName', '==', term)
      );
      const nameSnap = await getDocs(nameQuery);
      if (!nameSnap.empty) {
        return UserService.mapDocToUser(nameSnap.docs[0]);
      }

      // 3. Search by normalized name (case-insensitive)
      const normQuery = query(
        collection(db, COLLECTIONS.USERS),
        where('normalizedName', '==', term.toLowerCase())
      );
      const normSnap = await getDocs(normQuery);
      if (!normSnap.empty) {
        return UserService.mapDocToUser(normSnap.docs[0]);
      }

      // 4. Search by 6-char guestTag (e.g. "A3F9B2" or "#A3F9B2")
      const cleanTag = term.startsWith('#') ? term.slice(1).toUpperCase() : term.toUpperCase();
      if (cleanTag.length === 6) {
        const tagQuery = query(
          collection(db, COLLECTIONS.USERS),
          where('guestTag', '==', cleanTag)
        );
        const tagSnap = await getDocs(tagQuery);
        if (!tagSnap.empty) {
          return UserService.mapDocToUser(tagSnap.docs[0]);
        }
      }

      // 5. Try direct UID match
      try {
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, term));
        if (userDoc.exists()) {
          return UserService.mapDocToUser(userDoc);
        }
      } catch {
        // term wasn't valid doc path, ignore
      }

      console.log('No user found for query:', term);
      return null;
    } catch (error) {
      console.error('Error searching user:', error);
      return null;
    }
  }

  static async searchUserByEmail(queryTerm: string): Promise<User | null> {
    return this.searchUser(queryTerm);
  }

  // Friend request operations
  static async sendFriendRequest(fromUserId: string, toUserId: string): Promise<void> {
    try {
      // Check if request already exists
      const existingRequest = await getDocs(
        query(
          collection(db, COLLECTIONS.FRIEND_REQUESTS),
          where('fromUserId', '==', fromUserId),
          where('toUserId', '==', toUserId),
          where('status', '==', 'pending')
        )
      );

      if (!existingRequest.empty) {
        throw new Error('Friend request already sent');
      }

      await addDoc(collection(db, COLLECTIONS.FRIEND_REQUESTS), {
        fromUserId,
        toUserId,
        status: 'pending',
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  }

  static async getFriendRequests(userId: string): Promise<FriendRequest[]> {
    try {
      const requests = await getDocs(
        query(
          collection(db, COLLECTIONS.FRIEND_REQUESTS),
          where('toUserId', '==', userId),
          where('status', '==', 'pending')
        )
      );

      const friendRequests: FriendRequest[] = [];
      for (const doc of requests.docs) {
        const data = doc.data();
        
        // Get sender details
        const fromUser = await this.getUser(data.fromUserId);
        if (fromUser) {
          friendRequests.push({
            id: doc.id,
            fromUserId: data.fromUserId,
            toUserId: data.toUserId,
            status: data.status,
            createdAt: data.createdAt?.toDate() || new Date(),
            fromUser
          });
        }
      }

      return friendRequests;
    } catch (error) {
      console.error('Error getting friend requests:', error);
      return [];
    }
  }

  static async respondToFriendRequest(requestId: string, accept: boolean): Promise<void> {
    try {
      const requestRef = doc(db, COLLECTIONS.FRIEND_REQUESTS, requestId);
      const requestDoc = await getDoc(requestRef);
      
      if (!requestDoc.exists()) {
        throw new Error('Friend request not found');
      }

      const requestData = requestDoc.data();
      
      // Update request status
      await updateDoc(requestRef, {
        status: accept ? 'accepted' : 'rejected'
      });

      // If accepted, create friendship entries (if you need a friends collection)
      if (accept) {
        // You can add friendship logic here if needed
        console.log('Friend request accepted between:', requestData.fromUserId, 'and', requestData.toUserId);
      }
    } catch (error) {
      console.error('Error responding to friend request:', error);
      throw error;
    }
  }
}
