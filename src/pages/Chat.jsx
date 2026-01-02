import React, { useState, useEffect, useRef } from 'react';
import { redirectToLogin, getMe, getAdminEmail, getUserByEmail } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import { getConversation, listMessages, createMessage, updateConversation, findConversation, createConversation } from '@/services/conversationService';
import { getListing } from '@/services/listingService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Timestamp, onSnapshot, query, collection, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { mn } from 'date-fns/locale';

export default function Chat() {
  const urlParams = new URLSearchParams(window.location.search);
  const conversationId = urlParams.get('conversationId');
  const otherUserEmail = urlParams.get('otherUserEmail');
  const listingId = urlParams.get('listingId');
  
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const { user, userData } = useAuth();
  const [message, setMessage] = useState('');
  const [actualConversationId, setActualConversationId] = useState(conversationId);
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [adminEmail, setAdminEmail] = useState(null);
  
  const userEmail = userData?.email || user?.email;

  // Get admin email
  useEffect(() => {
    const fetchAdminEmail = async () => {
      const email = await getAdminEmail();
      setAdminEmail(email);
    };
    fetchAdminEmail();
  }, []);
  
  useEffect(() => {
    if (!user && !userData) {
      redirectToLogin(window.location.href);
    }
  }, [user, userData]);

  // Create conversation if needed
  useEffect(() => {
    const createConversationIfNeeded = async () => {
      if (!userEmail || !otherUserEmail || conversationId) return;
      
      // Check if conversation exists
      const existing = await findConversation(userEmail, otherUserEmail);
      
      if (existing) {
        setActualConversationId(existing.id);
      } else {
        // Create new conversation
        const newConv = await createConversation({
          participant_1: userEmail,
          participant_2: otherUserEmail,
          last_message: '',
          last_message_date: Timestamp.now(),
          last_message_sender: userEmail,
          unread_count_p1: 0,
          unread_count_p2: 0
        });
        setActualConversationId(newConv.id);
      }
    };
    
    createConversationIfNeeded();
  }, [userEmail, otherUserEmail, conversationId]);

  const { data: conversation } = useQuery({
    queryKey: ['conversation', actualConversationId],
    queryFn: () => getConversation(actualConversationId),
    enabled: !!actualConversationId
  });

  // Mark conversation as read when viewing
  useEffect(() => {
    if (!conversation || !userEmail) return;
    
    const markAsRead = async () => {
      try {
        // Determine which unread count to reset
        const isParticipant1 = conversation.participant_1 === userEmail;
        const unreadField = isParticipant1 ? 'unread_count_p1' : 'unread_count_p2';
        const currentUnread = conversation[unreadField] || 0;
        
        // Only update if there are unread messages
        if (currentUnread > 0) {
          await updateConversation(conversation.id, {
            [unreadField]: 0
          });
          // Invalidate queries to refresh counts
          queryClient.invalidateQueries(['conversations', userEmail]);
          queryClient.invalidateQueries(['conversation', actualConversationId]);
        }
      } catch (error) {
        console.error('Error marking conversation as read:', error);
      }
    };
    
    markAsRead();
  }, [conversation, userEmail, actualConversationId, queryClient]);

  // Real-time listener for messages
  useEffect(() => {
    if (!actualConversationId) {
      setMessages([]);
      setIsLoadingMessages(false);
      return;
    }

    setIsLoadingMessages(true);
    
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('conversation_id', '==', actualConversationId),
      orderBy('created_date', 'desc'),
      limit(100)
    );

    // Convert Firestore Timestamp to Date
    const convertTimestamp = (value) => {
      if (!value) return value;
      if (value && typeof value.toDate === 'function') {
        return value.toDate();
      }
      if (value instanceof Date) {
        return value;
      }
      if (value.seconds !== undefined) {
        return new Date(value.seconds * 1000 + (value.nanoseconds || 0) / 1000000);
      }
      return value;
    };

    console.log('Setting up real-time listener for conversation:', actualConversationId);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messagesData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            created_date: convertTimestamp(data.created_date)
          };
        }).reverse(); // Oldest first
        
        console.log('Real-time messages updated:', messagesData.length, 'messages');
        setMessages(messagesData);
        setIsLoadingMessages(false);
        
        // Update query cache for compatibility
        queryClient.setQueryData(['messages', actualConversationId], messagesData);
      },
      (error) => {
        console.error('Error listening to messages:', error);
        setIsLoadingMessages(false);
      }
    );

    return () => {
      console.log('Unsubscribing from real-time listener');
      unsubscribe();
    };
  }, [actualConversationId, queryClient]);

  const { data: otherUser } = useQuery({
    queryKey: ['otherUser', conversation?.id, adminEmail],
    queryFn: async () => {
      if (!conversation || !user?.email) return null;
      const otherEmail = conversation.participant_1 === userEmail 
        ? conversation.participant_2 
        : conversation.participant_1;
      
      // Get admin email if not already set
      let currentAdminEmail = adminEmail;
      if (!currentAdminEmail) {
        currentAdminEmail = await getAdminEmail();
      }
      
      // Check if other user is admin
      const isAdmin = currentAdminEmail && otherEmail === currentAdminEmail;
      
      // Get user data from Firestore
      let displayName;
      if (isAdmin) {
        displayName = 'АДМИН';
      } else {
        const userData = await getUserByEmail(otherEmail);
        displayName = userData?.displayName || otherEmail.split('@')[0];
      }
      
      return { 
        email: otherEmail, 
        displayName: displayName
      };
    },
    enabled: !!conversation && !!user?.email
  });

  const { data: listing } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: () => getListing(listingId),
    enabled: !!listingId
  });

  // Mark messages as read
  useEffect(() => {
    const markAsRead = async () => {
      if (!user?.email || !actualConversationId || !conversation) return;
      
      const unreadMessages = messages.filter(
        m => m.receiver_email === userEmail && !m.is_read
      );
      
      const { updateMessage } = await import('@/services/conversationService');
      for (const msg of unreadMessages) {
        await updateMessage(msg.id, { is_read: true });
      }
      
      // Update conversation unread count
      if (unreadMessages.length > 0) {
        const isParticipant1 = conversation.participant_1 === userEmail;
        await updateConversation(actualConversationId, {
          [isParticipant1 ? 'unread_count_p1' : 'unread_count_p2']: 0
        });
      }
    };
    
    markAsRead();
  }, [messages, user?.email, actualConversationId, conversation]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (messageText) => {
      if (!user?.email || !actualConversationId || !otherUser?.email) {
        console.error('Missing required data:', { user: user?.email, conversationId: actualConversationId, otherUser: otherUser?.email });
        throw new Error('Missing required data to send message');
      }
      
      console.log('Creating message:', {
        conversation_id: actualConversationId,
        sender_email: userEmail,
        receiver_email: otherUser.email,
        message: messageText
      });
      
      const newMessage = await createMessage({
        conversation_id: actualConversationId,
        sender_email: userEmail,
        receiver_email: otherUser.email,
        message: messageText,
        is_read: false
      });
      
      console.log('Message created:', newMessage);
      
      // Update conversation
      const isParticipant1 = conversation.participant_1 === userEmail;
      const otherUnreadCount = isParticipant1 ? (conversation.unread_count_p2 || 0) : (conversation.unread_count_p1 || 0);
      
      console.log('Updating conversation:', {
        conversationId: actualConversationId,
        isParticipant1,
        otherUnreadCount,
        newCount: otherUnreadCount + 1
      });
      
      await updateConversation(actualConversationId, {
        last_message: messageText,
        last_message_date: Timestamp.now(),
        last_message_sender: userEmail,
        [isParticipant1 ? 'unread_count_p2' : 'unread_count_p1']: otherUnreadCount + 1
      });
      
      console.log('Conversation updated successfully');
      
      return newMessage;
    },
    onSuccess: () => {
      console.log('Message sent successfully');
      // Real-time listener will automatically update messages
      // But we still need to invalidate conversation queries
      queryClient.invalidateQueries({ queryKey: ['conversation', actualConversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setMessage('');
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      alert('Мессеж илгээхэд алдаа гарлаа: ' + (error.message || 'Тодорхойгүй алдаа'));
    }
  });

  const handleSend = () => {
    if (!message.trim() || sendMutation.isPending) return;
    sendMutation.mutate(message);
  };

  if (!user || !actualConversationId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4" />
          <p className="text-gray-600">Уншиж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to={createPageUrl('Messages')}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 flex-1">
            {otherUser?.displayName === 'АДМИН' ? (
              <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 bg-white rounded-full overflow-hidden border border-gray-200 p-1">
                <img 
                  src={`${window.location.origin}/admin_logo.png`}
                  alt="Admin Logo" 
                  className="w-full h-full object-contain"
                  style={{ maxWidth: '100%', maxHeight: '100%' }}
                  onError={(e) => {
                    console.error('Failed to load admin logo, trying fallback');
                    e.target.src = '/favicon.svg';
                  }}
                  loading="eager"
                />
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {otherUser?.displayName?.[0]?.toUpperCase() || otherUser?.email?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-gray-900 truncate">
                    {otherUser?.displayName || otherUser?.email || 'Уншиж байна...'}
                  </h2>
                  {listing && (
                    <p className="text-xs text-gray-500 truncate">
                      Зар: {listing.title}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Listing Reference */}
      {listing && (
        <div className="bg-amber-50 border-b border-amber-100">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <Link to={createPageUrl(`ListingDetail?id=${listing.id}`)}>
              <div className="flex gap-3 items-center hover:bg-amber-100 rounded-lg p-2 -m-2 transition-colors">
                {listing.images?.[0] && (
                  <img src={listing.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{listing.title}</p>
                  <p className="text-sm text-amber-600 font-semibold">
                    ₩{listing.price?.toLocaleString()}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {isLoadingMessages ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                  <Skeleton className="h-16 w-64 rounded-2xl" />
                </div>
              ))}
            </div>
          ) : messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((msg, index) => {
                const isOwnMessage = msg.sender_email === userEmail;
                // Ensure created_date is a Date object
                const msgDate = msg.created_date instanceof Date 
                  ? msg.created_date 
                  : new Date(msg.created_date);
                const prevMsgDate = index > 0 && messages[index - 1].created_date
                  ? (messages[index - 1].created_date instanceof Date 
                      ? messages[index - 1].created_date 
                      : new Date(messages[index - 1].created_date))
                  : null;
                
                const showDate = index === 0 || 
                  (prevMsgDate && format(prevMsgDate, 'yyyy-MM-dd') !== format(msgDate, 'yyyy-MM-dd'));
                
                return (
                  <React.Fragment key={msg.id}>
                    {showDate && (
                      <div className="text-center my-4">
                        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          {format(msgDate, 'yyyy оны MM сарын dd', { locale: mn })}
                        </span>
                      </div>
                    )}
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          isOwnMessage
                            ? 'bg-amber-500 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                        <p className={`text-xs mt-1 ${
                          isOwnMessage ? 'text-amber-100' : 'text-gray-500'
                        }`}>
                          {format(msgDate, 'HH:mm')}
                        </p>
                      </div>
                    </motion.div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-500">Анхны мессежээ илгээнэ үү</p>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Мессеж бичих..."
              className="flex-1 min-h-[44px] max-h-32 rounded-xl resize-none"
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || sendMutation.isPending}
              className="h-11 w-11 rounded-xl bg-amber-500 hover:bg-amber-600 flex-shrink-0"
              size="icon"
            >
              {sendMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}