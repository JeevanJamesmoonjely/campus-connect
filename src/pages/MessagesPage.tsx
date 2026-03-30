import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Phone, Video, Info, Search, Loader2, MessageSquare, X, Mic, MicOff, VideoOff, PhoneOff, User, Maximize2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useConversations, useMessages } from '../hooks/useData';
import { useAuthStore } from '../store/authStore';
import { MessageService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import type { Conversation } from '../types';

export const MessagesPage = () => {
    const { user } = useAuthStore();
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [message, setMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
    const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Call state
    const [callState, setCallState] = useState<{
        isActive: boolean;
        type: 'voice' | 'video';
        mode: 'calling' | 'receiving' | 'ongoing';
        otherUser: any;
    } | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const callTimerRef = useRef<any>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const localStreamRef = useRef<MediaStream | null>(null);

    const { data: conversations, isLoading: loadingConversations, refetch: refetchConversations } = useConversations(user?.id);
    const { data: messages, isLoading: loadingMessages, setData: setMessages } = useMessages(selectedConversation?.id);
    const lastMsgCountRef = useRef(messages?.length || 0);

    useEffect(() => {
        lastMsgCountRef.current = messages?.length || 0;
    }, [selectedConversation?.id]);

    useEffect(() => {
        const conversationId = searchParams.get('conversationId');
        const itemName = searchParams.get('item');
        
        if (!conversations?.length) return;

        if (conversationId) {
            const targetConversation = conversations.find((conv) => conv.id === conversationId);
            if (targetConversation) {
                setSelectedConversation(targetConversation);
                
                // If there's an item context, pre-fill the message with a special tag
                if (itemName) {
                    const type = searchParams.get('type') || 'marketplace';
                    const img = searchParams.get('img') || '';
                    setMessage(`[ITEM_CONTEXT:${type}|${itemName}|${img}]`);
                }

                setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    next.delete('conversationId');
                    next.delete('item');
                    next.delete('img');
                    next.delete('type');
                    return next;
                }, { replace: true });
            }
        }
    }, [conversations, searchParams, setSearchParams]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Presence Signal Transmitter
    useEffect(() => {
        if (!selectedConversation?.id || !user) return;

        const sendPresence = async () => {
            try {
                await MessageService.sendMessage(selectedConversation.id, '[SYSTEM_PRESENCE:ONLINE]');
            } catch (error) {
                // Silent fail
            }
        };

        sendPresence(); // Immediate signal
        const interval = setInterval(sendPresence, 20000); // Pulse every 20s

        return () => clearInterval(interval);
    }, [selectedConversation?.id, user]);

    // Poll for new messages and handle call/presence signaling
    useEffect(() => {
        if (!selectedConversation?.id || !user) return;

        const pollInterval = setInterval(async () => {
            try {
                const newMessages = await MessageService.getMessages(selectedConversation.id);
                
                // Presence/Signaling logic
                if (newMessages.length > 0) {
                    const now = new Date().getTime();
                    
                    // Check for other user's presence in recent messages
                    const hasRecentHeartbeat = newMessages.some((msg: any) => {
                        const msgTime = new Date(msg.created_at).getTime();
                        return msg.sender_id !== user.id && 
                               msg.content === '[SYSTEM_PRESENCE:ONLINE]' && 
                               (now - msgTime) < 45000; // Recent heartbeat (45s window)
                    });
                    setIsOtherUserOnline(hasRecentHeartbeat);

                    const latestMsg: any = newMessages[newMessages.length - 1];
                    const isFromOther = latestMsg.sender_id !== user.id;

                    // New message indication - use ref to compare to avoid closure stale value issues
                    if (isFromOther && newMessages.length > lastMsgCountRef.current) {
                        setShowNewMessageIndicator(true);
                        setTimeout(() => setShowNewMessageIndicator(false), 5000);
                    }
                    
                    // Update ref after check
                    lastMsgCountRef.current = newMessages.length;

                    if (latestMsg.content.startsWith('[SYSTEM_CALL_START:')) {
                        const type = latestMsg.content.includes('video') ? 'video' : 'voice';
                        if (isFromOther && (!callState || callState.mode !== 'ongoing')) {
                            setCallState({
                                isActive: true,
                                type: type as 'voice' | 'video',
                                mode: 'receiving',
                                otherUser: selectedConversation.other_user
                            });
                        }
                    } else if (latestMsg.content === '[SYSTEM_CALL_ANSWER]') {
                        if (!isFromOther && callState?.mode === 'receiving') {
                            setCallState(prev => prev ? { ...prev, mode: 'ongoing' } : null);
                        } else if (isFromOther && callState?.mode === 'calling') {
                            setCallState(prev => prev ? { ...prev, mode: 'ongoing' } : null);
                        }
                    } else if (latestMsg.content === '[SYSTEM_CALL_END]') {
                        setCallState(null);
                    }
                }

                setMessages(newMessages);
            } catch (error) {
                console.error('Failed to poll messages:', error);
            }
        }, 3000);

        return () => {
            clearInterval(pollInterval);
            if (callTimerRef.current) clearInterval(callTimerRef.current);
        };
    }, [selectedConversation?.id, setMessages, user, callState]);

    // Call timer logic
    useEffect(() => {
        if (callState?.mode === 'ongoing') {
            callTimerRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        } else {
            if (callTimerRef.current) clearInterval(callTimerRef.current);
            setCallDuration(0);
        }
        return () => {
            if (callTimerRef.current) clearInterval(callTimerRef.current);
        };
    }, [callState?.mode]);

    // Clean up media on unmount
    useEffect(() => {
        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Effect to attach local stream to video element
    useEffect(() => {
        if (localVideoRef.current && localStreamRef.current && callState?.type === 'video') {
            localVideoRef.current.srcObject = localStreamRef.current;
        }
    }, [callState?.type, callState?.isActive, localStreamRef.current]);

    const startLocalStream = async (type: 'voice' | 'video') => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: type === 'video',
                audio: true
            });
            localStreamRef.current = stream;
            return stream;
        } catch (error) {
            console.error('Failed to get local stream:', error);
            return null;
        }
    };

    const initiateCall = async (type: 'voice' | 'video') => {
        if (!selectedConversation || !user) return;
        
        const stream = await startLocalStream(type);
        if (!stream && type === 'video') {
            alert('Camera access is required for video calls.');
            return;
        }

        setCallState({
            isActive: true,
            type,
            mode: 'calling',
            otherUser: selectedConversation.other_user
        });

        try {
            await MessageService.sendMessage(selectedConversation.id, `[SYSTEM_CALL_START:${type}]`);
        } catch (error) {
            console.error('Failed to start call:', error);
            setCallState(null);
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
                localStreamRef.current = null;
            }
        }
    };

    const answerCall = async () => {
        if (!selectedConversation || !callState) return;
        
        const stream = await startLocalStream(callState.type);
        if (!stream && callState.type === 'video') {
            alert('Camera access is required for video calls.');
        }

        try {
            await MessageService.sendMessage(selectedConversation.id, '[SYSTEM_CALL_ANSWER]');
            setCallState(prev => prev ? { ...prev, mode: 'ongoing' } : null);
        } catch (error) {
            console.error('Failed to answer call:', error);
        }
    };

    const endCall = async () => {
        if (!selectedConversation) return;
        try {
            await MessageService.sendMessage(selectedConversation.id, '[SYSTEM_CALL_END]');
            setCallState(null);
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
                localStreamRef.current = null;
            }
        } catch (error) {
            console.error('Failed to end call:', error);
            setCallState(null);
        }
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = isMuted; // If currently muted, we want to enable (track.enabled = true)
            });
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(track => {
                track.enabled = isVideoOff; // If currently off, we want to enable
            });
            setIsVideoOff(!isVideoOff);
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSendMessage = async () => {
        if (!message.trim() || !selectedConversation || !user) return;

        setIsSending(true);
        try {
            await MessageService.sendMessage(selectedConversation.id, message.trim());
            setMessage('');
            // Immediately fetch new messages
            const newMessages = await MessageService.getMessages(selectedConversation.id);
            setMessages(newMessages);
            refetchConversations();
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const filteredConversations = conversations?.filter(conv =>
        conv.other_user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!user) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
                <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Sign in to view messages</h2>
                    <p className="text-text-secondary">You need to be logged in to access your messages.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-12rem)] bg-white rounded-3xl border border-border overflow-hidden shadow-sm">
            {/* Sidebar - Chat List */}
            <div className="w-full md:w-80 border-r border-border flex flex-col">
                <div className="p-4 border-b border-border">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                        <input
                            type="text"
                            placeholder="Search chats..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {loadingConversations ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-brand" />
                        </div>
                    ) : filteredConversations && filteredConversations.length > 0 ? (
                        filteredConversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => setSelectedConversation(conv)}
                                className={`w-full p-4 flex gap-3 hover:bg-gray-50 transition-all text-left ${selectedConversation?.id === conv.id ? 'bg-brand/5 border-r-4 border-brand' : ''
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-full text-brand flex items-center justify-center font-bold relative shrink-0 transition-all ${isOtherUserOnline && selectedConversation?.id === conv.id ? 'ring-2 ring-green-500 ring-offset-2' : 'bg-brand/10'}`}>
                                    {conv.other_user?.avatar_url ? (
                                        <img src={conv.other_user.avatar_url} alt={conv.other_user.name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        conv.other_user?.name?.charAt(0) || '?'
                                    )}
                                    {selectedConversation?.id === conv.id && isOtherUserOnline && (
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm animate-pulse" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-bold text-sm truncate">{conv.other_user?.name || 'Unknown'}</h3>
                                        <span className="text-[10px] text-text-secondary">{formatTime(conv.last_message_at)}</span>
                                    </div>
                                    <p className={`text-xs truncate ${selectedConversation?.id === conv.id && isOtherUserOnline ? 'text-green-500 font-medium' : 'text-text-secondary'}`}>
                                        {selectedConversation?.id === conv.id && isOtherUserOnline 
                                            ? 'Active now'
                                            : typeof conv.last_message === 'string'
                                                ? conv.last_message.startsWith('[SYSTEM') ? 'Online' : conv.last_message
                                                : conv.last_message?.content?.startsWith('[SYSTEM') ? 'Online' : conv.last_message?.content || 'No messages yet'}
                                    </p>
                                </div>
                                {(conv.unread_count ?? 0) > 0 && (
                                    <div className="w-5 h-5 bg-brand text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {conv.unread_count}
                                    </div>
                                )}
                            </button>
                        ))
                    ) : (
                        <div className="p-8 text-center">
                            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-text-secondary">No conversations yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Window */}
            <div className="hidden md:flex flex-1 flex-col">
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold">
                                    {selectedConversation.other_user?.avatar_url ? (
                                        <img src={selectedConversation.other_user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        selectedConversation.other_user?.name?.charAt(0) || '?'
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm leading-tight">{selectedConversation.other_user?.name || 'Unknown'}</h3>
                                    <div className="flex items-center gap-1.5 h-3.5">
                                        {isOtherUserOnline ? (
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                                                <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">online</span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-text-secondary font-medium italic">
                                                Last seen recently
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => initiateCall('voice')}
                                    className="p-2 text-text-secondary hover:text-brand transition-colors"
                                    title="Voice Call"
                                >
                                    <Phone className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => initiateCall('video')}
                                    className="p-2 text-text-secondary hover:text-brand transition-colors"
                                    title="Video Call"
                                >
                                    <Video className="w-5 h-5" />
                                </button>
                                <button className="p-2 text-text-secondary hover:text-brand transition-colors"><Info className="w-5 h-5" /></button>
                            </div>
                        </div>

                        {/* Message Area */}
                        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50/50">
                            {loadingMessages ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="w-6 h-6 animate-spin text-brand" />
                                </div>
                            ) : messages && messages.length > 0 ? (
                                messages
                                    .filter(msg => !msg.content.startsWith('[SYSTEM'))
                                    .map((msg) => {
                                        const isItemContext = msg.content.startsWith('[ITEM_CONTEXT:');
                                        let itemData = null;
                                        
                                        if (isItemContext) {
                                            const parts = msg.content.slice(14, -1).split('|');
                                            itemData = {
                                                type: parts[0],
                                                title: parts[1],
                                                img: parts[2]
                                            };
                                        }

                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[75%] rounded-2xl shadow-sm text-sm overflow-hidden ${
                                                        msg.sender_id === user.id
                                                            ? 'bg-brand text-white rounded-tr-none'
                                                            : 'bg-white border border-border rounded-tl-none'
                                                    }`}
                                                >
                                                    {isItemContext && itemData ? (
                                                        <div className="flex flex-col">
                                                            {itemData.img && (
                                                                <div className="w-full aspect-video">
                                                                    <img 
                                                                        src={itemData.img} 
                                                                        alt={itemData.title} 
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                            )}
                                                            <div className="p-3">
                                                                <div className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${msg.sender_id === user.id ? 'text-white/80' : 'text-brand'}`}>
                                                                    {itemData.type === 'marketplace' ? '🛒 Marketplace Item' : '🔍 Lost & Found Item'}
                                                                </div>
                                                                <div className="font-bold text-base leading-tight mb-1">{itemData.title}</div>
                                                                <div className={`text-xs ${msg.sender_id === user.id ? 'text-white/70' : 'text-text-secondary'}`}>
                                                                    Hi! I'm interested in this. Is it still available?
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="p-4">{msg.content}</div>
                                                    )}
                                                    
                                                    <div
                                                        className={`text-[10px] px-4 pb-2 text-right ${
                                                            msg.sender_id === user.id ? 'text-brand-light opacity-80' : 'text-text-secondary'
                                                        }`}
                                                    >
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-text-secondary text-sm">No messages yet. Start the conversation!</p>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                            
                            <AnimatePresence>
                                {showNewMessageIndicator && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="fixed bottom-32 left-1/2 -translate-x-1/2 z-30"
                                    >
                                        <div className="bg-brand text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold flex items-center gap-2 border border-white/20 backdrop-blur-sm">
                                            <MessageSquare className="w-3 h-3" />
                                            New messages received
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-border">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Type a message..."
                                    className="flex-1 px-4 py-3 bg-gray-50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all text-sm"
                                />
                                <Button
                                    className="px-5"
                                    aria-label="Send message"
                                    onClick={handleSendMessage}
                                    disabled={!message.trim() || isSending}
                                    isLoading={isSending}
                                >
                                    <Send className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold mb-2">Select a conversation</h3>
                            <p className="text-text-secondary">Choose a chat from the sidebar to start messaging</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Call Overlay */}
            {callState && callState.isActive && (
                <div className="fixed inset-0 z-100 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center animate-fadeIn">
                    <div className="absolute top-8 right-8">
                        <button 
                            onClick={endCall}
                            className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex flex-col items-center gap-8 w-full max-w-2xl px-6">
                        {/* Profile/Video Area */}
                        <div className="relative w-full aspect-video md:aspect-video rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl">
                            {callState.type === 'video' && callState.mode === 'ongoing' && !isVideoOff ? (
                                <div className="absolute inset-0 w-full h-full bg-linear-to-br from-indigo-500/20 to-purple-500/20 flex flex-col items-center justify-center">
                                    <div className="w-48 h-48 rounded-full border-4 border-brand/50 p-2 animate-pulse">
                                        <img 
                                            src={callState.otherUser?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${callState.otherUser?.name}`} 
                                            alt="" 
                                            className="w-full h-full rounded-full object-cover" 
                                        />
                                    </div>
                                    <div className="mt-8 flex items-center gap-3">
                                        <div className="flex gap-1">
                                            {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />)}
                                        </div>
                                        <span className="text-white/60 text-sm font-medium tracking-widest uppercase">Streaming Live</span>
                                    </div>
                                    
                                    {/* PiP - User's own real camera feed */}
                                    <div className="absolute bottom-6 right-6 w-40 aspect-video rounded-2xl bg-black/40 border border-white/20 overflow-hidden shadow-xl backdrop-blur-md">
                                        <div className="w-full h-full flex items-center justify-center bg-black">
                                            <video 
                                                ref={localVideoRef}
                                                autoPlay 
                                                muted 
                                                playsInline 
                                                className={`w-full h-full object-cover transition-opacity duration-500 ${isVideoOff ? 'opacity-0' : 'opacity-100'}`}
                                            />
                                            {isVideoOff && <User className="absolute w-8 h-8 text-white/20" />}
                                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/40 rounded-md">
                                                <span className="text-[8px] text-white/60 font-bold uppercase tracking-wider">You (Local)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <div className={`w-40 h-40 rounded-full bg-brand/20 p-2 border-2 border-brand/30 ${callState.mode === 'calling' ? 'animate-pulse' : ''}`}>
                                        <div className="w-full h-full rounded-full overflow-hidden bg-black relative">
                                            {callState.type === 'video' && callState.mode === 'calling' && !isVideoOff ? (
                                                <video 
                                                    ref={localVideoRef}
                                                    autoPlay 
                                                    muted 
                                                    playsInline 
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <img 
                                                    src={callState.otherUser?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${callState.otherUser?.name}`} 
                                                    alt="" 
                                                    className="w-full h-full object-cover" 
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-6 text-center">
                                        <h2 className="text-3xl font-bold text-white mb-2">{callState.otherUser?.name}</h2>
                                        <p className="text-brand text-sm font-bold uppercase tracking-[0.2em]">
                                            {callState.mode === 'calling' ? 'Calling...' : 
                                             callState.mode === 'receiving' ? 'Incoming Call' : 
                                             formatDuration(callDuration)}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Ongoing call indicators */}
                            {callState.mode === 'ongoing' && (
                                <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 bg-black/40 rounded-full border border-white/10 backdrop-blur-md">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                    <span className="text-xs font-bold text-white uppercase tracking-widest">{callState.type === 'video' ? 'HD Video' : 'HQ Voice'}</span>
                                    <div className="w-px h-3 bg-white/20 mx-1" />
                                    <span className="text-xs font-mono text-white/80">{formatDuration(callDuration)}</span>
                                </div>
                            )}
                        </div>

                        {/* Control Bar */}
                        <div className="flex items-center gap-6 px-10 py-6 bg-white/5 rounded-full border border-white/10 backdrop-blur-md shadow-2xl">
                            <button 
                                onClick={toggleMute}
                                className={`p-4 rounded-full transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                            >
                                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                            </button>
                            
                            {callState.type === 'video' && (
                                <button 
                                    onClick={toggleVideo}
                                    className={`p-4 rounded-full transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                >
                                    {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                                </button>
                            )}

                            {callState.mode === 'receiving' ? (
                                <button 
                                    onClick={answerCall}
                                    className="p-6 bg-green-500 hover:bg-green-600 rounded-full text-white shadow-lg shadow-green-500/40 transition-all hover:scale-110 active:scale-95"
                                >
                                    <Phone className="w-8 h-8" />
                                </button>
                            ) : (
                                <button 
                                    onClick={endCall}
                                    className="p-6 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-lg shadow-red-500/40 transition-all hover:scale-110 active:scale-95"
                                >
                                    <PhoneOff className="w-8 h-8" />
                                </button>
                            )}
                            
                            <button className="p-4 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all">
                                <Maximize2 className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Tips */}
                        <p className="text-white/30 text-xs font-medium uppercase tracking-widest text-center">
                            {callState.mode === 'calling' ? `Wait for ${callState.otherUser?.name} to answer...` : 
                             callState.mode === 'receiving' ? `${callState.otherUser?.name} wants to connect with you` : 
                             'Secure end-to-end encrypted connection'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

