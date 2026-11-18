import React, { useState, useEffect, useRef } from 'react';
import Peer, { type DataConnection } from 'peerjs';
import { 
  MessageCircle, 
  Send, 
  ArrowLeft, 
  Copy, 
  Check, 
  Smile, 
  Paperclip, 
  Volume2, 
  VolumeX, 
  LogOut, 
  Radio, 
  Lock, 
  Download, 
  FileText,
  AlertTriangle
} from 'lucide-react';
import { SoundService } from '../../services/sound.service';

interface TempMessage {
  id: string;
  senderName: string;
  senderType: 'me' | 'peer' | 'system';
  content: string;
  timestamp: Date;
  file?: {
    name: string;
    size: number;
    mimeType: string;
    dataUrl: string;
  };
}

interface TempChatScreenProps {
  onExit: () => void;
  initialRoomCode?: string | null;
}

export const TempChatScreen: React.FC<TempChatScreenProps> = ({ onExit, initialRoomCode }) => {
  // Lobby state
  const [nickname, setNickname] = useState(() => 'Name_' + Math.floor(1000 + Math.random() * 9000));
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [joinCodeInput, setJoinCodeInput] = useState(initialRoomCode || '');
  const [roomCode, setRoomCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // Chat state
  const [isConnected, setIsConnected] = useState(false);
  const [peerDisconnected, setPeerDisconnected] = useState(false);
  const [peerName, setPeerName] = useState('Friend');
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<TempMessage[]>([]);
  const [isMuted, setIsMuted] = useState(SoundService.getIsMuted());
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Refs
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle mute changes
  useEffect(() => {
    const handleMuteChange = (e: any) => {
      setIsMuted(e.detail.isMuted);
    };
    window.addEventListener('kathaithal_sound_mute_changed', handleMuteChange);
    return () => window.removeEventListener('kathaithal_sound_mute_changed', handleMuteChange);
  }, []);

  // Cleanup peer on unmount
  useEffect(() => {
    return () => {
      cleanupPeer();
    };
  }, []);

  const cleanupPeer = () => {
    try {
      if (connRef.current) {
        connRef.current.close();
        connRef.current = null;
      }
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    } catch (err) {
      console.warn('Error during peer cleanup:', err);
    }
  };

  // Generate a random 6-character clean room code
  const generateRoomCode = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `KV-${code}`;
  };

  // Bind connection events
  const setupConnection = (conn: DataConnection, myDisplayName: string) => {
    connRef.current = conn;

    conn.on('open', () => {
      setIsConnected(true);
      setIsConnecting(false);
      setErrorMsg('');
      setPeerDisconnected(false);

      // Send our handshake
      conn.send({
        type: 'handshake',
        name: myDisplayName
      });

      SoundService.playSuccess();
    });

    conn.on('data', (data: any) => {
      if (!data || typeof data !== 'object') return;

      if (data.type === 'handshake') {
        const remoteName = data.name || 'Friend';
        setPeerName(remoteName);
        setMessages((prev) => [
          ...prev,
          {
            id: 'sys-' + Date.now(),
            senderName: 'System',
            senderType: 'system',
            content: `${remoteName} joined the temp room. Messages are P2P and ephemeral.`,
            timestamp: new Date()
          }
        ]);
      } else if (data.type === 'text') {
        setMessages((prev) => [
          ...prev,
          {
            id: 'msg-' + Date.now() + Math.random(),
            senderName: data.senderName || peerName,
            senderType: 'peer',
            content: data.content,
            timestamp: new Date()
          }
        ]);
        SoundService.playMessageReceived();
      } else if (data.type === 'file') {
        setMessages((prev) => [
          ...prev,
          {
            id: 'file-' + Date.now() + Math.random(),
            senderName: data.senderName || peerName,
            senderType: 'peer',
            content: data.caption || '',
            file: data.file,
            timestamp: new Date()
          }
        ]);
        SoundService.playMessageReceived();
      }
    });

    conn.on('close', () => {
      setPeerDisconnected(true);
      setMessages((prev) => [
        ...prev,
        {
          id: 'sys-left-' + Date.now(),
          senderName: 'System',
          senderType: 'system',
          content: 'Peer has left the chat. All session data wiped.',
          timestamp: new Date()
        }
      ]);
      SoundService.playError();
    });

    conn.on('error', (err) => {
      console.error('Peer connection error:', err);
      setErrorMsg('Connection error: ' + (err.message || 'Failed'));
      setIsConnecting(false);
    });
  };

  // Host: Create Room
  const handleCreateRoom = () => {
    cleanupPeer();
    setErrorMsg('');
    setIsConnecting(true);

    const generated = generateRoomCode();
    setRoomCode(generated);

    try {
      const peer = new Peer(generated.toLowerCase());
      peerRef.current = peer;

      peer.on('open', (id) => {
        setIsConnecting(false);
        console.log('Temp Peer Room ready with ID:', id);
      });

      peer.on('connection', (conn) => {
        setupConnection(conn, nickname.trim() || 'Host');
      });

      peer.on('error', (err) => {
        console.error('Peer host error:', err);
        setErrorMsg('Error creating room: ' + err.message);
        setIsConnecting(false);
      });
    } catch (err: any) {
      console.error('Failed to init Peer:', err);
      setErrorMsg(err.message || 'Failed to initialize P2P');
      setIsConnecting(false);
    }
  };

  // Client: Join Room
  const handleJoinRoom = () => {
    const target = joinCodeInput.trim().toLowerCase();
    if (!target) {
      setErrorMsg('Please enter a room code');
      return;
    }

    cleanupPeer();
    setErrorMsg('');
    setIsConnecting(true);

    try {
      const peer = new Peer();
      peerRef.current = peer;

      peer.on('open', () => {
        const conn = peer.connect(target, {
          reliable: true
        });
        setupConnection(conn, nickname.trim() || 'Guest');
      });

      peer.on('error', (err) => {
        console.error('Peer join error:', err);
        setErrorMsg('Could not connect to room: ' + err.message);
        setIsConnecting(false);
      });
    } catch (err: any) {
      console.error('Failed to join Peer room:', err);
      setErrorMsg(err.message || 'Failed to connect');
      setIsConnecting(false);
    }
  };

  // Send text message
  const handleSendMessage = () => {
    if (!messageText.trim() || !connRef.current || !isConnected) return;

    const text = messageText.trim();
    connRef.current.send({
      type: 'text',
      senderName: nickname.trim(),
      content: text
    });

    setMessages((prev) => [
      ...prev,
      {
        id: 'msg-' + Date.now() + Math.random(),
        senderName: nickname.trim(),
        senderType: 'me',
        content: text,
        timestamp: new Date()
      }
    ]);

    setMessageText('');
    SoundService.playMessageSent();
  };

  // Send file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !connRef.current || !isConnected) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('File size exceeds 15MB P2P limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const fileData = {
        name: file.name,
        size: file.size,
        mimeType: file.type,
        dataUrl
      };

      connRef.current?.send({
        type: 'file',
        senderName: nickname.trim(),
        file: fileData
      });

      setMessages((prev) => [
        ...prev,
        {
          id: 'file-' + Date.now() + Math.random(),
          senderName: nickname.trim(),
          senderType: 'me',
          content: '',
          file: fileData,
          timestamp: new Date()
        }
      ]);

      SoundService.playMessageSent();
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    SoundService.playButtonClick();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!roomCode) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?temp=${roomCode}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    SoundService.playButtonClick();
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleEndChat = () => {
    if (window.confirm('End this temp chat? All messages will be wiped immediately.')) {
      cleanupPeer();
      setIsConnected(false);
      setMessages([]);
      onExit();
    }
  };

  const commonEmojis = ['😊', '😂', '👍', '❤️', '🔥', '🎉', '👋', '🙏', '✨', '💯'];

  // Render Connected Chat View
  if (isConnected) {
    return (
      <div className="h-screen bg-gradient-to-br from-primary-50 to-white flex flex-col overflow-hidden animate-in fade-in duration-300">
        {/* Top Navigation */}
        <div className="bg-white/90 backdrop-blur-md border-b border-primary-200 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-primary-600 text-white font-bold flex items-center justify-center shadow-md">
              {peerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-semibold text-gray-800 text-sm md:text-base">{peerName}</h2>
                <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  P2P Ephemeral
                </span>
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Lock className="w-3 h-3 text-green-600" />
                Direct browser tunnel • Zero server storage
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => SoundService.toggleMute()}
              className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-amber-600" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button
              onClick={handleEndChat}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-semibold transition-all transform hover:scale-105 active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span>End Chat</span>
            </button>
          </div>
        </div>

        {/* Peer Disconnected Notice */}
        {peerDisconnected && (
          <div className="bg-amber-50 border-b border-amber-200 p-3 text-center text-xs text-amber-800 flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Peer has disconnected. All messages will vanish when you leave.</span>
            <button
              onClick={handleEndChat}
              className="ml-2 font-bold underline hover:text-amber-900"
            >
              Exit Now
            </button>
          </div>
        )}

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Privacy Notice Banner */}
          <div className="max-w-md mx-auto my-2 p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-center text-xs text-amber-700 shadow-sm">
            <div className="font-semibold flex items-center justify-center gap-1 mb-0.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Ephemeral Peer-to-Peer Session</span>
            </div>
            Messages flow directly between devices via WebRTC. Nothing is saved to any database.
          </div>

          {messages.map((msg) => {
            if (msg.senderType === 'system') {
              return (
                <div key={msg.id} className="text-center my-2">
                  <span className="text-[11px] bg-gray-100 text-gray-500 px-3 py-1 rounded-full border border-gray-200">
                    {msg.content}
                  </span>
                </div>
              );
            }

            const isMe = msg.senderType === 'me';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-1 duration-150`}
              >
                <div
                  className={`max-w-[78%] md:max-w-[65%] rounded-2xl p-3 shadow-sm ${
                    isMe
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-tr-none'
                      : 'bg-white text-gray-800 border border-primary-100 rounded-tl-none'
                  }`}
                >
                  {/* File Attachment */}
                  {msg.file && (
                    <div className="mb-2">
                      {msg.file.mimeType.startsWith('image/') ? (
                        <img
                          src={msg.file.dataUrl}
                          alt={msg.file.name}
                          className="max-h-60 rounded-lg object-contain bg-black/5"
                        />
                      ) : (
                        <div className={`flex items-center space-x-2 p-2 rounded-lg ${isMe ? 'bg-white/20' : 'bg-gray-100'}`}>
                          <FileText className="w-5 h-5 flex-shrink-0" />
                          <div className="min-w-0 flex-1 text-xs">
                            <p className="font-medium truncate">{msg.file.name}</p>
                            <p className="opacity-70">{(msg.file.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <a
                            href={msg.file.dataUrl}
                            download={msg.file.name}
                            className={`p-1.5 rounded hover:bg-black/10 transition-colors ${isMe ? 'text-white' : 'text-primary-600'}`}
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {msg.content && <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>}

                  <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="bg-white/90 backdrop-blur-md border-t border-primary-200 p-3 relative">
          {showEmojiPicker && (
            <div className="absolute bottom-16 left-4 bg-white border border-primary-200 rounded-xl p-2 shadow-xl flex gap-1 z-20">
              {commonEmojis.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => {
                    setMessageText((prev) => prev + e);
                    setShowEmojiPicker(false);
                  }}
                  className="text-lg p-1 hover:scale-125 transition-transform"
                >
                  {e}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <Smile className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="Send File / Photo"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
            />

            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type ephemeral message..."
              disabled={peerDisconnected}
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-sm transition-all"
            />

            <button
              type="button"
              onClick={handleSendMessage}
              disabled={!messageText.trim() || peerDisconnected}
              className="p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-40 transition-all transform hover:scale-105 active:scale-95 shadow-md flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Lobby (Create or Join)
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-100 via-white to-primary-200 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Back to Standard Login */}
        <button
          onClick={onExit}
          className="mb-4 inline-flex items-center space-x-2 text-xs font-semibold text-secondary-600 hover:text-secondary-800 transition-colors bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-primary-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Main Login</span>
        </button>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-xl border border-primary-200">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg text-white">
              <Radio className="w-8 h-8 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-700 to-amber-600 bg-clip-text text-transparent">
              Temp Chat (தற்காலிக அரட்டை)
            </h1>
            <p className="text-xs text-secondary-500 mt-1">
              Peer-to-Peer WebRTC • Zero database records • Vanishes on exit
            </p>
          </div>

          {/* Nickname Input */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-secondary-700 mb-1.5">
              உங்கள் பெயர் • Your Nickname
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={18}
              className="w-full px-3 py-2 border-2 border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-400 focus:border-primary-500 outline-none text-sm font-medium"
              placeholder="e.g. Name_1234"
            />
          </div>

          {/* Mode Tabs */}
          <div className="flex border-b border-primary-200 mb-5">
            <button
              onClick={() => { setActiveTab('create'); setErrorMsg(''); }}
              className={`flex-1 pb-2.5 text-sm font-semibold transition-colors relative ${
                activeTab === 'create' ? 'text-primary-700' : 'text-secondary-400 hover:text-secondary-600'
              }`}
            >
              Create Room (அறை உருவாக்கு)
              {activeTab === 'create' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />}
            </button>
            <button
              onClick={() => { setActiveTab('join'); setErrorMsg(''); }}
              className={`flex-1 pb-2.5 text-sm font-semibold transition-colors relative ${
                activeTab === 'join' ? 'text-primary-700' : 'text-secondary-400 hover:text-secondary-600'
              }`}
            >
              Join Room (அறையில் இணை)
              {activeTab === 'join' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />}
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
              {errorMsg}
            </div>
          )}

          {/* Tab 1: Create Room */}
          {activeTab === 'create' && (
            <div>
              {!roomCode ? (
                <button
                  onClick={handleCreateRoom}
                  disabled={isConnecting}
                  className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-amber-600 text-white rounded-xl font-semibold text-sm hover:opacity-95 transition-opacity shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isConnecting ? (
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Radio className="w-4 h-4" />
                      <span>Start New Room</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 bg-primary-50 rounded-xl border border-primary-200 text-center">
                    <p className="text-xs text-secondary-500 mb-1">Share this Room Code with your friend:</p>
                    <div className="text-3xl font-mono font-bold tracking-widest text-primary-800 my-2 select-all">
                      {roomCode}
                    </div>
                    <div className="flex gap-2 justify-center mt-3">
                      <button
                        onClick={handleCopyCode}
                        className="px-3 py-1.5 bg-white border border-primary-300 rounded-lg text-xs font-semibold text-primary-700 hover:bg-primary-100 transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? 'Copied Code!' : 'Copy Code'}</span>
                      </button>

                      <button
                        onClick={handleCopyLink}
                        className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? 'Link Copied!' : 'Copy Invite Link'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-center space-x-2 text-xs text-secondary-500 py-1">
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
                    <span>Waiting for friend to connect...</span>
                  </div>

                  <button
                    onClick={() => { cleanupPeer(); setRoomCode(''); }}
                    className="w-full py-2 text-xs text-secondary-500 hover:text-secondary-700"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Join Room */}
          {activeTab === 'join' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-secondary-700 mb-1.5">
                  Enter Room Code or Link
                </label>
                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                  placeholder="e.g. KV-XXXXXX"
                  className="w-full px-3 py-2.5 border-2 border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-400 focus:border-primary-500 outline-none text-sm font-mono uppercase tracking-wider"
                />
              </div>

              <button
                onClick={handleJoinRoom}
                disabled={!joinCodeInput.trim() || isConnecting}
                className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-amber-600 text-white rounded-xl font-semibold text-sm hover:opacity-95 transition-opacity shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isConnecting ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Connect to Room</span>
                )}
              </button>
            </div>
          )}

          {/* Footer explanation */}
          <div className="mt-6 pt-4 border-t border-primary-100 text-center">
            <p className="text-[11px] text-secondary-400">
              🔒 No sign-in required • End-to-end encrypted direct connection
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
