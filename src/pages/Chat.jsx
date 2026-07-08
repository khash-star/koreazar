import React, { useState, useEffect, useRef } from 'react';
import * as entities from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createCountryPageUrl } from '@/utils';
import { getListingImageUrl } from '@/utils/imageUrl';
import { useActiveCountry, useRouteCountryCode } from '@/hooks/useActiveCountry';
import { formatListingPrice } from '@/utils/formatPrice';
import { ArrowLeft, Send, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { mn } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import {
  redirectToLogin,
  getAdminEmail,
  getUserByEmail,
  isSellerBlockedByViewer,
  ensureUserDocEmailForFirestoreRules,
} from '@/services/authService';
import { normalizeEmail, resolveAuthEmail, areEmailVariants } from '@/utils/emailNormalize';
import {
  deleteMessage,
  syncConversationLastMessageFromMessages,
  repairConversationParticipants,
  updateConversationAfterMessage,
} from '@/services/conversationService';
import { toast } from '@/components/ui/use-toast';
export default function Chat() {
  const urlParams = new URLSearchParams(window.location.search);
  const conversationId = urlParams.get('conversationId');
  const otherUserEmail = urlParams.get('otherUserEmail');
  const listingId = urlParams.get('listingId');
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  // Only prefix when this page itself is under /kr, /us, /jp — legacy
  // /Chat keeps linking to the KR-compatible unprefixed route.
  const activeCountry = useActiveCountry();
  const routeCountryCode = useRouteCountryCode();
  const countryPrefix = routeCountryCode ? activeCountry.defaultRoutePrefix : null;
  const messagesEndRef = useRef(null);
  const blockRedirectRef = useRef(false);
  const { user, userData, loading } = useAuth();
  const authEmail = resolveAuthEmail(user, userData);
  const myEmailNorm = normalizeEmail(authEmail);
  const [message, setMessage] = useState('');
  const [actualConversationId, setActualConversationId] = useState(conversationId);
  const [adminEmail, setAdminEmail] = useState(null);
  const [chatForbidden, setChatForbidden] = useState(false);

  // Get admin email
  useEffect(() => {
    const fetchAdminEmail = async () => {
      const email = await getAdminEmail();
      setAdminEmail(email);
    };
    fetchAdminEmail();
  }, []);

  useEffect(() => {
    blockRedirectRef.current = false;
    setChatForbidden(false);
  }, [conversationId, otherUserEmail]);

  useEffect(() => {
    if (loading || !user) return;
    if (!myEmailNorm || !actualConversationId || otherUserEmail) return;

    let cancelled = false;
    (async () => {
      try {
        const convs = await entities.Conversation.filter({ id: actualConversationId });
        const conv = convs[0];
        if (cancelled || !conv) return;
        const p1 = normalizeEmail(conv.participant_1);
        const p2 = normalizeEmail(conv.participant_2);
        const other = p1 === myEmailNorm ? p2 : p1;
        if (!other) return;
        let admin = adminEmail;
        if (!admin) admin = await getAdminEmail();
        if (admin && normalizeEmail(admin) === other) return;
        const profile = await getUserByEmail(myEmailNorm);
        if (profile && isSellerBlockedByViewer(profile, other) && !blockRedirectRef.current) {
          blockRedirectRef.current = true;
          setChatForbidden(true);
          toast({
            title: 'Чат',
            description: 'Та энэ хэрэглэгчийг блоклосон.',
            variant: 'destructive',
          });
          navigate(createCountryPageUrl('Messages', countryPrefix));
        }
      } catch (e) {
        console.warn('Chat: block check', e?.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    loading,
    user,
    myEmailNorm,
    actualConversationId,
    otherUserEmail,
    adminEmail,
    navigate,
  ]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      redirectToLogin(window.location.href);
    }
  }, [user, loading]);

  // Create conversation if needed
  useEffect(() => {
    const ensureConversation = async () => {
      if (!authEmail || !otherUserEmail || conversationId) return;

      const meN = normalizeEmail(authEmail);
      const otherN = normalizeEmail(otherUserEmail);
      let admin = adminEmail;
      if (!admin) admin = await getAdminEmail();
      if (!(admin && normalizeEmail(admin) === otherN)) {
        const profile = await getUserByEmail(meN);
        if (profile && isSellerBlockedByViewer(profile, otherUserEmail)) {
          if (!blockRedirectRef.current) {
            blockRedirectRef.current = true;
            setChatForbidden(true);
            toast({
              title: 'Чат',
              description: 'Та энэ хэрэглэгчийг блоклосон.',
              variant: 'destructive',
            });
            navigate(createCountryPageUrl('Messages', countryPrefix));
          }
          return;
        }
      }

      try {
        const existing1 = await entities.Conversation.filter({
          participant_1: meN,
          participant_2: otherN
        });
        
        const existing2 = await entities.Conversation.filter({
          participant_1: otherN,
          participant_2: meN
        });
        
        if (existing1.length > 0) {
          setActualConversationId(existing1[0].id);
        } else if (existing2.length > 0) {
          setActualConversationId(existing2[0].id);
        } else {
          const newConv = await entities.Conversation.create({
            participant_1: meN,
            participant_2: otherN,
            last_message: '',
            last_message_time: new Date().toISOString(),
            last_message_sender: meN,
            unread_count_p1: 0,
            unread_count_p2: 0
          });
          setActualConversationId(newConv.id);
        }
      } catch (err) {
        console.error('Chat: create conversation error', err);
      }
    };
    
    ensureConversation();
  }, [authEmail, otherUserEmail, conversationId, listingId, adminEmail, navigate]);

  const { data: conversation } = useQuery({
    queryKey: ['conversation', actualConversationId],
    queryFn: async () => {
      const convs = await entities.Conversation.filter({ id: actualConversationId });
      return convs[0];
    },
    enabled: !!actualConversationId
  });

  useEffect(() => {
    if (!conversation?.id || !authEmail) return;
    repairConversationParticipants(conversation, { meEmail: authEmail }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });
  }, [conversation?.id, authEmail, queryClient]);

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
      if (!conversation || !authEmail) return null;
      const otherEmail = conversation.participant_1 === authEmail 
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
    enabled: !!conversation && !!authEmail
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
      if (!authEmail || !actualConversationId || !conversation) return;
      
      try {
        if (user) {
          await ensureUserDocEmailForFirestoreRules(user, authEmail);
        }
        const me = normalizeEmail(authEmail);
        const unreadMessages = messages.filter(
          (m) => areEmailVariants(m.receiver_email, me) && !m.is_read
        );
        
        for (const msg of unreadMessages) {
          await entities.Message.update(msg.id, { is_read: true });
        }
        
        if (unreadMessages.length > 0) {
          const isParticipant1 = areEmailVariants(conversation.participant_1, authEmail);
          await entities.Conversation.update(actualConversationId, {
            [isParticipant1 ? 'unread_count_p1' : 'unread_count_p2']: 0
          });
          queryClient.invalidateQueries({ queryKey: ['unreadMessages'] });
        }
      } catch (err) {
        console.error('Chat: mark as read error', err);
      }
    };
    
    markAsRead();
  }, [messages, authEmail, actualConversationId, conversation, queryClient, user]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (messageText) => {
      if (!authEmail || !actualConversationId || !otherUser?.email) return;
      
      const senderNorm = normalizeEmail(authEmail);
      const receiverNorm = normalizeEmail(otherUser.email);
      const newMessage = await entities.Message.create({
        conversation_id: actualConversationId,
        sender_email: senderNorm,
        receiver_email: receiverNorm,
        message: messageText,
        is_read: false
      });
      
      await updateConversationAfterMessage({
        conversationId: actualConversationId,
        conversation,
        senderEmail: senderNorm,
        receiverEmail: receiverNorm,
        messageText,
      });
      
      return newMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversation'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unreadMessages'] });
      setMessage('');
      toast({ title: 'Мессеж илгээгдлээ', variant: 'default' });
    },
    onError: (err) => {
      toast({ title: 'Алдаа', description: err?.message || 'Мессеж илгээж чадсангүй', variant: 'destructive' });
    }
  });

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  };

  const handleAdminDeleteMessage = async (msg) => {
    if (userData?.role !== 'admin' || !actualConversationId) return;
    if (!window.confirm('Энэ мессежийг устгах уу?')) return;
    try {
      await deleteMessage(msg.id);
      await syncConversationLastMessageFromMessages(actualConversationId);
      queryClient.invalidateQueries({ queryKey: ['messages', actualConversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversation', actualConversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({ title: 'Мессеж устгагдлаа' });
    } catch (err) {
      toast({
        title: 'Алдаа',
        description: err?.message || 'Устгаж чадсангүй',
        variant: 'destructive'
      });
    }
  };

  // Show loading while auth is checking
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (chatForbidden) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-gray-600 text-center">Та энэ хэрэглэгчийг блоклосон.</p>
        <Link to={createCountryPageUrl('Messages', countryPrefix)}>
          <Button className="rounded-xl bg-amber-600 hover:bg-amber-700">Мессеж руу буцах</Button>
        </Link>
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
          <Link to={createCountryPageUrl('Messages', countryPrefix)}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 flex-1">
            {adminEmail && otherUser?.email === adminEmail ? (
              <img 
                src="/icon-180.png" 
                alt="АДМИН" 
                className="w-10 h-10 object-contain rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold">
                {(adminEmail && otherUser?.email === adminEmail
                  ? 'А'
                  : otherUser?.displayName?.[0] || otherUser?.full_name?.[0] || '?').toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="font-semibold text-gray-900">
                {adminEmail && otherUser?.email === adminEmail
                  ? 'АДМИН'
                  : (otherUser?.displayName || otherUser?.full_name || otherUser?.email || 'Уншиж байна...')}
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
            <Link to={createCountryPageUrl(`ListingDetail?id=${listing.id}`, countryPrefix)}>
              <div className="flex gap-3 items-center hover:bg-amber-100 rounded-lg p-2 -m-2 transition-colors">
                {listing.images?.[0] && (
                  <img src={getListingImageUrl(listing.images[0], 'w150')} alt="" className="w-12 h-12 rounded-lg object-contain object-top bg-gray-50" loading="lazy" decoding="async" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{listing.title}</p>
                  <p className="text-sm text-amber-600 font-semibold">
                    {formatListingPrice(listing.price, { countryCode: listing.country_code || activeCountry.countryCode })}
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
                const isOwnMessage = msg.sender_email === authEmail;
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
                    
                    <div
                      className={`flex items-end gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      {userData?.role === 'admin' && !isOwnMessage && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleAdminDeleteMessage(msg)}
                          aria-label="Мессеж устгах"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          isOwnMessage
                            ? 'bg-amber-600 text-white'
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
                      {userData?.role === 'admin' && isOwnMessage && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleAdminDeleteMessage(msg)}
                          aria-label="Мессеж устгах"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
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
              disabled={!message.trim() || sendMutation.isPending || !otherUser?.email}
              className="h-11 w-11 rounded-xl bg-amber-600 hover:bg-amber-700 flex-shrink-0"
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