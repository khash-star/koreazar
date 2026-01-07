import React, { useState, useEffect } from 'react';
import * as entities from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { MessageCircle, Search, ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { mn } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { redirectToLogin, getAdminEmail, getUserByEmail } from '@/services/authService';
import { findConversation, createConversation } from '@/services/conversationService';
import { Timestamp } from 'firebase/firestore';

export default function Messages() {
  const { user, userData, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const userEmail = userData?.email || user?.email;
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
    if (!user && !userData) {
      redirectToLogin(window.location.href);
    }
  }, [user, userData]);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations', userEmail, adminEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      
      // Get admin email if not already set
      let currentAdminEmail = adminEmail;
      if (!currentAdminEmail) {
        currentAdminEmail = await getAdminEmail();
      }
      
      // Get user conversations (either participant_1 or participant_2)
      const convs1 = await entities.Conversation.filter({ participant_1: userEmail });
      const convs2 = await entities.Conversation.filter({ participant_2: userEmail });
      const allConvs = [...convs1, ...convs2];
      
      // Get user data for all other users in conversations
      const otherEmails = [...new Set(allConvs.map(conv => 
        conv.participant_1 === userEmail ? conv.participant_2 : conv.participant_1
      ))];
      
      // Fetch user data for all other users
      const userDataMap = new Map();
      await Promise.all(otherEmails.map(async (email) => {
        if (email === currentAdminEmail) {
          userDataMap.set(email, { displayName: 'АДМИН' });
        } else {
          const userData = await getUserByEmail(email);
          userDataMap.set(email, {
            displayName: userData?.displayName || email.split('@')[0]
          });
        }
      }));
      
      return allConvs.map(conv => {
        const otherEmail = conv.participant_1 === userEmail ? conv.participant_2 : conv.participant_1;
        const unreadCount = conv.participant_1 === userEmail ? conv.unread_count_p1 : conv.unread_count_p2;
        
        // Get display name from user data map
        const userInfo = userDataMap.get(otherEmail) || { displayName: otherEmail.split('@')[0] };
        
        return {
          ...conv,
          otherUser: { 
            email: otherEmail, 
            displayName: userInfo.displayName,
            full_name: userInfo.displayName
          },
          unreadCount
        };
      });
    },
    enabled: !!userEmail,
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Sort conversations: admin first, then by unread count, then by last message time
  const sortedConversations = [...conversations].sort((a, b) => {
    // Admin conversations first
    const aIsAdmin = a.otherUser.email === adminEmail;
    const bIsAdmin = b.otherUser.email === adminEmail;
    if (aIsAdmin && !bIsAdmin) return -1;
    if (!aIsAdmin && bIsAdmin) return 1;
    
    // Then by unread count (higher first)
    if (a.unreadCount !== b.unreadCount) {
      return (b.unreadCount || 0) - (a.unreadCount || 0);
    }
    
    // Then by last message time (newer first)
    const aTime = a.last_message_time || a.last_message_date || 0;
    const bTime = b.last_message_time || b.last_message_date || 0;
    if (aTime && bTime) {
      return new Date(bTime) - new Date(aTime);
    }
    if (aTime) return -1;
    if (bTime) return 1;
    return 0;
  });

  const filteredConversations = sortedConversations.filter(conv => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      conv.otherUser.displayName?.toLowerCase().includes(searchLower) ||
      conv.otherUser.email?.toLowerCase().includes(searchLower) ||
      conv.last_message?.toLowerCase().includes(searchLower)
    );
  });

  // Check if user has conversation with admin
  const hasAdminConversation = conversations.some(conv => 
    conv.otherUser.email === adminEmail
  );

  const handleMessageAdmin = async () => {
    // Check if user is authenticated
    if (!isAuthenticated || !user || !userData) {
      redirectToLogin(window.location.href);
      return;
    }
    
    if (!adminEmail || !userEmail) return;
    
    try {
      // Find or create conversation with admin
      let conversation = await findConversation(userEmail, adminEmail);
      
      if (!conversation) {
        conversation = await createConversation({
          participant_1: userEmail,
          participant_2: adminEmail,
          last_message: '',
          last_message_sender: userEmail,
          unread_count_p1: 0,
          unread_count_p2: 0
        });
      }
      
      // Navigate to chat with admin
      window.location.href = createPageUrl(`Chat?conversationId=${conversation.id}&otherUserEmail=${adminEmail}`);
    } catch (error) {
      console.error('Error creating conversation with admin:', error);
      alert('Админд мессеж илгээхэд алдаа гарлаа. Дахин оролдоно уу.');
    }
  };

  if (!user) {
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
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            {userData?.role === 'admin' && (
              <img 
                src="/admin_logo.png" 
                alt="Admin Logo" 
                className="w-10 h-10 object-contain"
              />
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">Мессеж</h1>
              <p className="text-sm text-gray-500">{conversations.length} харилцаа</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Хайх..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl"
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4">
                <div className="flex gap-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length > 0 ? (
          <div className="space-y-2">
            {filteredConversations.map((conv) => (
              <Link
                key={conv.id}
                to={createPageUrl(`Chat?conversationId=${conv.id}`)}
              >
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="bg-white rounded-xl p-4 hover:shadow-md transition-all"
                >
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                      {conv.otherUser.full_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {conv.otherUser.displayName || conv.otherUser.email}
                        </h3>
                        {(conv.last_message_time || conv.last_message_date) && (
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {formatDistanceToNow(new Date(conv.last_message_time || conv.last_message_date), { 
                              addSuffix: true,
                              locale: mn 
                            })
                              .replace(/ойролцоогоор\s*/gi, '')
                              .replace(/өдрийн/gi, 'Ө')
                              .replace(/цагийн/gi, 'Ц')
                              .replace(/сарын/gi, 'С')}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate flex-1 min-w-0">
                          {conv.last_message_sender === userEmail && (
                            <span className="text-gray-500">Та: </span>
                          )}
                          <span className="truncate">
                            {conv.last_message || 'Мессеж илгээх...'}
                          </span>
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="flex-shrink-0 ml-2 w-6 h-6 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'Хайлтын үр дүн олдсонгүй' : 'Мессеж байхгүй байна'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ? 'Өөр хайлт хийж үзнэ үү' : 'Зар дээр дарж зарын эзэнтэй холбогдоорой'}
            </p>
            {adminEmail && !hasAdminConversation && (
              <Button
                onClick={handleMessageAdmin}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                <Shield className="w-4 h-4 mr-2" />
                Админд мессеж илгээх
              </Button>
            )}
          </div>
        )}
        
        {/* Message Admin Button - Always visible at top */}
        {adminEmail && !hasAdminConversation && filteredConversations.length > 0 && (
          <div className="mt-4 mb-4">
            <Button
              onClick={handleMessageAdmin}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              variant="default"
            >
              <Shield className="w-4 h-4 mr-2" />
              Админд мессеж илгээх
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}