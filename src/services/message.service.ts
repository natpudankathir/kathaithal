import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  getDocs,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { COLLECTIONS } from '../constants/firebase';
import { Message } from '../types';

export class MessageService {
  // Send a message to a conversation
  static async sendMessage(message: Omit<Message, 'id' | 'createdAt'>, conversationId: string): Promise<void> {
    try {
      console.log('Sending message to conversation:', conversationId);
      
      // Add message to messages subcollection under the conversation
      const messagesRef = collection(db, COLLECTIONS.CONVERSATIONS, conversationId, 'messages');
      await addDoc(messagesRef, {
        senderId: message.senderId,
        senderName: message.senderName,
        senderPhotoURL: message.senderPhotoURL,
        content: message.content,
        type: message.type,
        readBy: message.readBy || [],
        createdAt: serverTimestamp(),
        ...(message.fileUrl && { fileUrl: message.fileUrl }),
        ...(message.fileName && { fileName: message.fileName }),
        ...(message.fileSize && { fileSize: message.fileSize }),
        ...(message.fileMimeType && { fileMimeType: message.fileMimeType })
      });

      // Update conversation's last message timestamp and content
      await updateDoc(doc(db, COLLECTIONS.CONVERSATIONS, conversationId), {
        lastMessage: message.content,
        lastMessageAt: serverTimestamp()
      });
      
      console.log('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  static async getMessages(conversationId: string): Promise<Message[]> {
    try {
      console.log('Getting messages for conversation:', conversationId);
      
      // Get messages from subcollection under the conversation
      const messagesRef = collection(db, COLLECTIONS.CONVERSATIONS, conversationId, 'messages');
      const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));
      const messages = await getDocs(messagesQuery);

      console.log('Found', messages.docs.length, 'messages');

      return messages.docs.map(doc => {
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
          updatedAt: data.updatedAt?.toDate(),
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          fileMimeType: data.fileMimeType
        };
      });
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  static async markMessageAsRead(conversationId: string, messageId: string, userId: string): Promise<void> {
    try {
      console.log('Marking message as read:', messageId, 'by user:', userId);
      
      const messageRef = doc(db, COLLECTIONS.CONVERSATIONS, conversationId, 'messages', messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (messageDoc.exists()) {
        const data = messageDoc.data();
        const readBy = data.readBy || [];
        
        if (!readBy.includes(userId)) {
          await updateDoc(messageRef, {
            readBy: [...readBy, userId]
          });
          console.log('Message marked as read successfully');
        }
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  // File upload operations
  static async uploadFile(file: File, conversationId: string, userId: string): Promise<string> {
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `conversations/${conversationId}/${userId}/${fileName}`;
      
      const storageRef = ref(storage, filePath);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Convenience methods for specific message types
  static async sendTextMessage(
    conversationId: string,
    senderId: string,
    senderName: string,
    senderPhotoURL: string | undefined,
    content: string
  ): Promise<void> {
    const message = {
      senderId,
      senderName,
      senderPhotoURL,
      content,
      type: 'text' as const,
      readBy: [senderId] // Sender marks as read by default
    };
    
    return this.sendMessage(message, conversationId);
  }

  static async sendMessageWithFile(
    conversationId: string,
    senderId: string,
    senderName: string,
    senderPhotoURL: string | undefined,
    file: File
  ): Promise<void> {
    try {
      console.log('Uploading file:', file.name);
      
      // Upload file to Firebase Storage
      const fileName = `${Date.now()}_${file.name}`;
      const fileRef = ref(storage, `messages/${conversationId}/${fileName}`);
      
      const uploadResult = await uploadBytes(fileRef, file);
      const fileUrl = await getDownloadURL(uploadResult.ref);
      
      console.log('File uploaded successfully:', fileUrl);
      
      // Determine message type based on file type
      let messageType: 'image' | 'video' | 'audio' | 'file' = 'file';
      if (file.type.startsWith('image/')) {
        messageType = 'image';
      } else if (file.type.startsWith('video/')) {
        messageType = 'video';
      } else if (file.type.startsWith('audio/')) {
        messageType = 'audio';
      }
      
      const message = {
        senderId,
        senderName,
        senderPhotoURL,
        content: file.name,
        type: messageType,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        fileMimeType: file.type,
        readBy: [senderId] // Sender marks as read by default
      };
      
      return this.sendMessage(message, conversationId);
    } catch (error) {
      console.error('Error sending file message:', error);
      throw error;
    }
  }

  // Real-time message subscription
  static subscribeToMessages(conversationId: string, callback: (messages: Message[]) => void): () => void {
    try {
      console.log('Setting up real-time message subscription for conversation:', conversationId);
      
      const messagesRef = collection(db, COLLECTIONS.CONVERSATIONS, conversationId, 'messages');
      const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));
      
      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messages: Message[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          messages.push({
            id: doc.id,
            senderId: data.senderId,
            senderName: data.senderName,
            senderPhotoURL: data.senderPhotoURL,
            content: data.content,
            type: data.type,
            readBy: data.readBy || [],
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate(),
            fileUrl: data.fileUrl,
            fileName: data.fileName,
            fileSize: data.fileSize,
            fileMimeType: data.fileMimeType
          });
        });
        
        console.log('Real-time messages updated:', messages.length, 'messages');
        callback(messages);
      }, (error) => {
        console.error('Error in messages subscription:', error);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up message subscription:', error);
      return () => {};
    }
  }
}
