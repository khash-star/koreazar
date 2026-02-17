import React, { useState, useEffect, useRef } from 'react';
import * as entities from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { withWidth } from '@/utils/imageUrl';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { mn } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { redirectToLogin, getAdminEmail, getUserByEmail } from '@/services/authService';

export default function Chat() {
  const urlParams = new URLSearchParams(window.location.search);
  const conversationId = urlParams.get('conversationId');
  const otherUserEmail = urlParams.get('otherUserEmail');
  const listingId = urlParams.get('listingId');
  
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const { user, userData, loading } = useAuth();
  const [message, setMessage] = useState('');
  const [actualConversationId, setActualConversationId] = useState(conversationId);
  const [adminEmail, setAdminEmail] = useState(null);

  // Get admin email
  useEffect(() => {
    const fetchAdminEmail = async () => {
      const email = await getAdminEmail();
      setAdminEmail(email);
    };
    fetchAdminEmail();
  }, []);

  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (loading) return;
    
    const email = userData?.email || user?.email;
    if (!email) {
      redirectToLogin(window.location.href);
    }
  }, [user, userData, loading]);

  // Create conversation if needed
  useEffect(() => {
    const createConversation = async () => {
      const email = userData?.email || user?.email;
      if (!email || !otherUserEmail || conversationId) return;
      
      // Check if conversation exists
      const existing1 = await entities.Conversation.filter({
        participant_1: email,
        participant_2: otherUserEmail
      });
      
      const existing2 = await entities.Conversation.filter({
        participant_1: otherUserEmail,
        participant_2: email
      });
      
      if (existing1.length > 0) {
        setActualConversationId(existing1[0].id);
      } else if (existing2.length > 0) {
        setActualConversationId(existing2[0].id);
      } else {
        // Create new conversation
        const newConv = await entities.Conversation.create({
          participant_1: email,
          participant_2: otherUserEmail,
          last_message: '',
          last_message_time: new Date().toISOString(),
          last_message_sender: email,
          unread_count_p1: 0,
          unread_count_p2: 0
        });
        setActualConversationId(newConv.id);
      }
    };
    
    createConversation();
  }, [userData?.email, user?.email, otherUserEmail, conversationId]);

  const { data: conversation } = useQuery({
    queryKey: ['conversation', actualConversationId],
    queryFn: async () => {
      const convs = await entities.Conversation.filter({ id: actualConversationId });
      return convs[0];
    },
    enabled: !!actualConversationId
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', actualConversationId],
    queryFn: () => entities.Message.filter(
      { conversation_id: actualConversationId },
      'created_date'
    ),
    enabled: !!actualConversationId,
    refetchInterval: 3000 // Refresh every 3 seconds
  });

  const { data: otherUser } = useQuery({
    queryKey: ['otherUser', conversation?.id, adminEmail],
    queryFn: async () => {
      const email = userData?.email || user?.email;
      if (!conversation || !email) return null;
      const otherEmail = conversation.participant_1 === email 
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
        displayName: displayName,
        full_name: displayName
      };
    },
    enabled: !!conversation && !!(userData?.email || user?.email)
  });

  const { data: listing } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: async () => {
      const listings = await entities.Listing.filter({ id: listingId });
      return listings[0];
    },
    enabled: !!listingId
  });

  // Mark messages as read
  useEffect(() => {
    const markAsRead = async () => {
      const email = userData?.email || user?.email;
      if (!email || !actualConversationId || !conversation) return;
      
      const unreadMessages = messages.filter(
        m => m.receiver_email === email && !m.is_read
      );
      
      for (const msg of unreadMessages) {
        await entities.Message.update(msg.id, { is_read: true });
      }
      
      // Update conversation unread count
      if (unreadMessages.length > 0) {
        const isParticipant1 = conversation.participant_1 === email;
        await entities.Conversation.update(actualConversationId, {
          [isParticipant1 ? 'unread_count_p1' : 'unread_count_p2']: 0
        });
      }
    };
    
    markAsRead();
  }, [messages, userData?.email, user?.email, actualConversationId, conversation]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (messageText) => {
      const email = userData?.email || user?.email;
      if (!email || !actualConversationId || !otherUser?.email) return;
      
      const newMessage = await entities.Message.create({
        conversation_id: actualConversationId,
        sender_email: email,
        receiver_email: otherUser.email,
        message: messageText,
        is_read: false
      });
      
      // Update conversation
      const isParticipant1 = conversation.participant_1 === email;
      const otherUnreadCount = isParticipant1 ? conversation.unread_count_p2 : conversation.unread_count_p1;
      
      await entities.Conversation.update(actualConversationId, {
        last_message: messageText,
        last_message_time: new Date().toISOString(),
        last_message_sender: email,
        [isParticipant1 ? 'unread_count_p2' : 'unread_count_p1']: otherUnreadCount + 1
      });
      
      return newMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversation'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setMessage('');
    }
  });

  const handleSend = () => {
    if (!message.trim() || sendMutation.isPending) return;
    sendMutation.mutate(message);
  };

  // Show loading while auth is checking
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

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
            {adminEmail && otherUser?.email === adminEmail ? (
              <img 
                src="/admin_logo.png" 
                alt="Admin Logo" 
                className="w-10 h-10 object-contain rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold">
                {otherUser?.displayName?.[0]?.toUpperCase() || otherUser?.full_name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div>
              <h2 className="font-semibold text-gray-900">
                {otherUser?.displayName || otherUser?.full_name || otherUser?.email || 'Уншиж байна...'}
              </h2>
              {listing && (
                <p className="text-xs text-gray-500">
                  Зар: {listing.title}
                </p>
              )}
            </div>
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
                  <img src={withWidth(listing.images[0], 100)} alt="" className="w-12 h-12 rounded-lg object-cover" loading="lazy" decoding="async" />
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
          {isLoading ? (
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
                const email = userData?.email || user?.email;
                const isOwnMessage = msg.sender_email === email;
                const showDate = index === 0 || 
                  format(new Date(messages[index - 1].created_date), 'yyyy-MM-dd') !== 
                  format(new Date(msg.created_date), 'yyyy-MM-dd');
                
                return (
                  <React.Fragment key={msg.id}>
                    {showDate && (
                      <div className="text-center my-4">
                        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          {format(new Date(msg.created_date), 'yyyy оны MM сарын dd', { locale: mn })}
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
                          {format(new Date(msg.created_date), 'HH:mm')}
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
      <div className="bg-white border-t border-gray-200 sticky bottom-0 md:bottom-0 pb-20 md:pb-3 z-30">
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