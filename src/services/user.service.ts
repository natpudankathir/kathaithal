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

  static async searchUserByEmail(email: string): Promise<User | null> {
    try {
      console.log('Searching for user with email:', email);
      
      const usersQuery = query(
        collection(db, COLLECTIONS.USERS),
        where('email', '==', email.toLowerCase())
      );
      
      const querySnapshot = await getDocs(usersQuery);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const userData = doc.data();
        const user = {
          uid: doc.id,
          email: userData.email,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          isOnline: userData.isOnline,
          lastSeen: userData.lastSeen?.toDate() || new Date(),
          createdAt: userData.createdAt?.toDate() || new Date()
        };
        
        console.log('Found user:', user);
        return user;
      }
      
      console.log('No user found with email:', email);
      return null;
    } catch (error) {
      console.error('Error searching user by email:', error);
      return null;
    }
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
