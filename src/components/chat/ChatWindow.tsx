import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, Smile, Paperclip, Image, FileText } from 'lucide-react';
import { User, Conversation, Message } from '../../types';
import { FirestoreService, SoundService } from '../../services/firebase';

interface ChatWindowProps {
  conversation: Conversation;
  user: User;
  onBack: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversation, user, onBack }) => {
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showFileOptions, setShowFileOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [previousMessageCount, setPreviousMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Get the other participant
  const otherParticipant = conversation.participantDetails.find(p => p.uid !== user.uid);

  // Common emojis for quick access
  const commonEmojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
    '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
    '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
    '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
    '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
    '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
    '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥',
    '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
    '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
    '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑',
    '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻',
    '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸',
    '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '❤️',
    '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎',
    '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘',
    '💝', '💟', '♥️', '💯', '💢', '💥', '💫', '💦',
    '💨', '🕳️', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤'
  ];

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setMessageText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Load messages with real-time listener
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupMessageListener = async () => {
      try {
        setLoading(true);
        
        // Set up real-time listener for messages
        unsubscribe = FirestoreService.subscribeToMessages(conversation.id, (newMessages: Message[]) => {
          // Detect new received messages (not sent by current user)
          if (!loading && newMessages.length > previousMessageCount) {
            const latestMessage = newMessages[newMessages.length - 1];
            if (latestMessage && latestMessage.senderId !== user.uid) {
              // Play received message sound
              SoundService.playMessageReceived();
            }
          }
          
          setMessages(newMessages);
          setPreviousMessageCount(newMessages.length);
          setLoading(false);
        });
      } catch (error) {
        console.error('Error setting up message listener:', error);
        setLoading(false);
      }
    };

    setupMessageListener();

    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [conversation.id, user.uid]); // Removed loading and previousMessageCount to prevent subscription recreation

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmojiPicker]);

  // Send text message
  const handleSendMessage = async () => {
    if (!messageText.trim() || sending) return;

    const content = messageText.trim();
    setMessageText('');
    setSending(true);

    try {
      // Play send sound effect
      SoundService.playMessageSent();
      
      await FirestoreService.sendTextMessage(
        conversation.id,
        user.uid,
        user.displayName,
        user.photoURL,
        content
      );
      // Message will be automatically updated via real-time listener
    } catch (error) {
      console.error('Error sending message:', error);
      // Play error sound
      SoundService.playError();
      // Restore message text on error
      setMessageText(content);
    } finally {
      setSending(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!file || sending) return;

    setSending(true);
    setShowFileOptions(false);

    try {
      // Play send sound effect
      SoundService.playMessageSent();
      
      await FirestoreService.sendMessageWithFile(
        conversation.id,
        user.uid,
        user.displayName,
        user.photoURL,
        file
      );
      // Message will be automatically updated via real-time listener
    } catch (error) {
      console.error('Error sending file:', error);
      // Play error sound
      SoundService.playError();
    } finally {
      setSending(false);
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = 'none';
    const fallback = e.currentTarget.parentElement?.querySelector('.fallback-avatar') as HTMLElement;
    if (fallback) {
      fallback.style.display = 'flex';
    }
  };

  return (
    <div className="h-screen bg-gradient-to-b from-white to-primary-25 flex flex-col">
      {/* Chat Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-primary-200 px-4 py-3 flex items-center justify-between
                      animate-in slide-in-from-top-2 duration-500">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              SoundService.playButtonClick();
              onBack();
            }}
            className="p-2 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg 
                      transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-md hover:shadow-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="relative">
            {otherParticipant?.photoURL ? (
              <>
                <img
                  src={otherParticipant.photoURL}
                  alt={otherParticipant.displayName}
                  className="w-10 h-10 rounded-full border-2 border-primary-200"
                  onError={handleImageError}
                />
                <div 
                  className="fallback-avatar hidden w-10 h-10 rounded-full bg-primary-500 text-white text-sm font-semibold items-center justify-center border-2 border-primary-200"
                >
                  {otherParticipant.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
              </>
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-500 text-white text-sm font-semibold flex items-center justify-center border-2 border-primary-200">
                {otherParticipant?.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            {otherParticipant?.isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>

          <div>
            <h2 className="font-semibold text-secondary-800">{otherParticipant?.displayName || 'Unknown User'}</h2>
            <p className="text-sm text-secondary-500">
              {otherParticipant?.isOnline ? 'Online' : `Last seen ${formatTimestamp(otherParticipant?.lastSeen || new Date())}`}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-primary-600" />
            </div>
            <p className="text-lg font-medium">Start a conversation</p>
            <p className="text-sm">Send a message to {otherParticipant?.displayName}</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === user.uid;
            return (
              <div
                key={msg.id}
                className={`flex items-end space-x-2 ${isMe ? 'justify-end' : 'justify-start'} 
                           animate-in slide-in-from-bottom-5 fade-in duration-300`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {!isMe && (
                  <div className="w-8 h-8 rounded-full bg-primary-500 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0 
                                  animate-in zoom-in duration-200 shadow-md">
                    {otherParticipant?.displayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                
                <div className={`max-w-xs lg:max-w-md ${isMe ? 'order-1' : 'order-2'} 
                                animate-in ${isMe ? 'slide-in-from-right-5' : 'slide-in-from-left-5'} 
                                duration-300`}>
                  {msg.type === 'text' ? (
                    <div
                      className={`px-4 py-2 rounded-2xl transform transition-all duration-200 hover:scale-105 ${
                        isMe
                          ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg hover:shadow-xl'
                          : 'bg-white border border-primary-200 text-secondary-800 shadow-md hover:shadow-lg hover:border-primary-300'
                      }`}
                    >
                      <p className="break-words">{msg.content}</p>
                    </div>
                  ) : msg.type === 'image' ? (
                    <div className="relative group">
                      <img 
                        src={msg.fileUrl}
                        alt={msg.fileName}
                        className="max-w-xs rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl 
                                  group-hover:scale-105 cursor-pointer"
                        style={{ maxHeight: '300px' }}
                      />
                      {msg.content && msg.content !== msg.fileName && (
                        <div
                          className={`mt-2 px-4 py-2 rounded-2xl transform transition-all duration-200 hover:scale-105 ${
                            isMe
                              ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg hover:shadow-xl'
                              : 'bg-white border border-primary-200 text-secondary-800 shadow-md hover:shadow-lg hover:border-primary-300'
                          }`}
                        >
                          <p className="break-words">{msg.content}</p>
                        </div>
                      )}
                    </div>
                  ) : msg.type === 'video' ? (
                    <div className="relative group">
                      <video 
                        src={msg.fileUrl}
                        controls
                        className="max-w-xs rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl 
                                  group-hover:scale-105"
                        style={{ maxHeight: '300px' }}
                      />
                      {msg.content && msg.content !== msg.fileName && (
                        <div
                          className={`mt-2 px-4 py-2 rounded-2xl transform transition-all duration-200 hover:scale-105 ${
                            isMe
                              ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg hover:shadow-xl'
                              : 'bg-white border border-primary-200 text-secondary-800 shadow-md hover:shadow-lg hover:border-primary-300'
                          }`}
                        >
                          <p className="break-words">{msg.content}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`px-4 py-2 rounded-2xl flex items-center space-x-2 transform transition-all duration-200 hover:scale-105 ${
                        isMe
                          ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg hover:shadow-xl'
                          : 'bg-white border border-primary-200 text-secondary-800 shadow-md hover:shadow-lg hover:border-primary-300'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <div>
                        <p className="font-medium">{msg.fileName}</p>
                        {msg.fileSize && (
                          <p className="text-xs opacity-70">
                            {(msg.fileSize / 1024 / 1024).toFixed(2)} MB
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <p
                    className={`text-xs text-secondary-500 mt-1 ${
                      isMe ? 'text-right' : 'text-left'
                    }`}
                  >
                    {formatTimestamp(msg.createdAt)}
                  </p>
                </div>

                {isMe && (
                  <div className="w-8 h-8 rounded-full bg-primary-600 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
                    {user.displayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white/90 backdrop-blur-sm border-t border-primary-200 p-4 
                      animate-in slide-in-from-bottom-2 duration-500">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            SoundService.playButtonClick();
            handleSendMessage();
          }}
          className="flex items-end space-x-3"
        >
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                SoundService.playButtonClick();
                setShowFileOptions(!showFileOptions);
                setShowEmojiPicker(false);
              }}
              className="p-2 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg 
                        transition-all duration-200 transform hover:scale-110 active:scale-95 
                        shadow-md hover:shadow-lg"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            
            {showFileOptions && (
              <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl border border-primary-200 p-2 space-y-1 
                              animate-in slide-in-from-bottom-3 zoom-in duration-300 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => {
                    SoundService.playButtonClick();
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handleFileUpload(file);
                    };
                    input.click();
                  }}
                  className="flex items-center space-x-2 w-full px-3 py-2 text-sm hover:bg-primary-50 
                            rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95
                            hover:shadow-md"
                >
                  <Image className="w-4 h-4" />
                  <span>Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    SoundService.playButtonClick();
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '*/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handleFileUpload(file);
                    };
                    input.click();
                  }}
                  className="flex items-center space-x-2 w-full px-3 py-2 text-sm hover:bg-primary-50 
                            rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95
                            hover:shadow-md"
                >
                  <FileText className="w-4 h-4" />
                  <span>File</span>
                </button>
              </div>
            )}
          </div>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                // Play subtle typing sound occasionally
                if (Math.random() < 0.3) {
                  SoundService.playTyping();
                }
              }}
              onFocus={() => SoundService.playButtonClick()}
              placeholder="Type a message..."
              disabled={sending}
              className="w-full px-4 py-3 pr-12 border border-primary-200 rounded-2xl 
                        focus:ring-2 focus:ring-primary-300 focus:border-transparent resize-none 
                        bg-white/80 disabled:opacity-50 transition-all duration-300
                        transform focus:scale-[1.02] hover:shadow-lg focus:shadow-xl
                        placeholder:text-secondary-400"
            />
            <button
              type="button"
              onClick={() => {
                SoundService.playButtonClick();
                setShowEmojiPicker(!showEmojiPicker);
                setShowFileOptions(false);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-secondary-400 
                        hover:text-primary-600 transition-all duration-200 hover:scale-110 active:scale-95
                        rounded-full hover:bg-primary-50"
            >
              <Smile className="w-5 h-5" />
            </button>
            
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div 
                ref={emojiPickerRef}
                className="absolute bottom-full right-0 mb-2 bg-white/95 backdrop-blur-sm rounded-lg 
                          shadow-xl border border-primary-200 p-3 w-80 max-h-64 overflow-y-auto
                          animate-in slide-in-from-bottom-3 zoom-in duration-300"
              >
                <div className="grid grid-cols-8 gap-2">
                  {commonEmojis.map((emoji, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        SoundService.playButtonClick();
                        handleEmojiSelect(emoji);
                      }}
                      className="w-8 h-8 text-xl hover:bg-primary-50 rounded transition-all duration-200 
                                flex items-center justify-center transform hover:scale-125 active:scale-95
                                hover:shadow-md"
                      style={{ animationDelay: `${index * 10}ms` }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!messageText.trim() || sending}
            className="p-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl 
                      hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed 
                      transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95
                      disabled:transform-none"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};