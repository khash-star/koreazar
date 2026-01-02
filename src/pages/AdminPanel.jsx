import React, { useState } from 'react';
import { filterListings } from '@/services/listingService';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, List, Shield, Settings, MessageSquare, Send, Star, Bell, Users, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation } from '@tanstack/react-query';
import { sendMessageToAllUsers, filterConversations } from '@/services/conversationService';
import { getAllUsers } from '@/services/authService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export default function AdminPanel() {
  const { userData, loading: authLoading } = useAuth();
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [message, setMessage] = useState('');
  const [sendResult, setSendResult] = useState(null);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const { data: pendingListings = [], isLoading: pendingLoading, error: pendingError } = useQuery({
    queryKey: ['pending-count'],
    queryFn: async () => {
      console.log('Fetching pending listings...');
      const result = await filterListings({ status: 'pending' });
      console.log('Pending listings result:', result);
      return result;
    },
    enabled: userData?.role === 'admin',
    onError: (error) => {
      console.error('Error fetching pending listings:', error);
    }
  });

  const { data: vipListings = [], isLoading: vipLoading, error: vipError } = useQuery({
    queryKey: ['vip-listings-count'],
    queryFn: async () => {
      console.log('Fetching VIP listings...');
      const result = await filterListings({ listing_type: 'vip', status: 'active' });
      console.log('VIP listings result:', result);
      return result;
    },
    enabled: userData?.role === 'admin',
    onError: (error) => {
      console.error('Error fetching VIP listings:', error);
    }
  });

  const { data: unreadMessagesCount = 0 } = useQuery({
    queryKey: ['admin-unread-messages', userData?.email],
    queryFn: async () => {
      if (!userData?.email) return 0;
      
      try {
        // Get all conversations where admin is participant
        const convs1 = await filterConversations({ participant_1: userData.email });
        const convs2 = await filterConversations({ participant_2: userData.email });
        const allConvs = [...convs1, ...convs2];
        
        // Calculate total unread count for admin
        const totalUnread = allConvs.reduce((sum, conv) => {
          const unread = conv.participant_1 === userData.email 
            ? (conv.unread_count_p1 || 0)
            : (conv.unread_count_p2 || 0);
          return sum + unread;
        }, 0);
        
        return totalUnread;
      } catch (error) {
        console.error('Error fetching unread count:', error);
        return 0;
      }
    },
    enabled: !!userData?.email && userData?.role === 'admin',
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => getAllUsers(),
    enabled: userData?.role === 'admin',
  });

  const { data: allListings = [] } = useQuery({
    queryKey: ['all-listings-for-user-stats'],
    queryFn: () => filterListings({}, '-created_date', 1000),
    enabled: userData?.role === 'admin' && showUserSearch,
  });

  const filteredUsers = allUsers.filter(user => 
    user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.phone?.includes(userSearchTerm)
  );

  const sendMessageMutation = useMutation({
    mutationFn: async (messageText) => {
      const adminEmail = userData?.email;
      if (!adminEmail) throw new Error('Admin email not found');
      return await sendMessageToAllUsers(adminEmail, messageText);
    },
    onSuccess: (result) => {
      setSendResult(result);
      setMessage('');
      setTimeout(() => {
        setShowMessageDialog(false);
        setSendResult(null);
      }, 3000);
    },
    onError: (error) => {
      console.error('Error sending messages:', error);
      alert('Мессеж илгээхэд алдаа гарлаа. Дахин оролдоно уу.');
    }
  });

  const handleSendMessage = () => {
    if (!message.trim()) {
      alert('Мессеж оруулна уу.');
      return;
    }
    sendMessageMutation.mutate(message.trim());
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4" />
          <p className="text-gray-600">Уншиж байна...</p>
        </div>
      </div>
    );
  }

  if (!userData || userData.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Хандах эрхгүй</h1>
          <p className="text-gray-500 mb-4">Зөвхөн админ хэрэглэгч энэ хуудсыг үзэх боломжтой</p>
          <Link to={createPageUrl('Home')}>
            <Button>Нүүр хуудас руу буцах</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <img 
              src="/admin_logo.png" 
              alt="Admin Logo" 
              className="w-10 h-10 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Админ удирдлага</h1>
              <p className="text-sm text-gray-500">Зарууд болон системийн удирдлага</p>
            </div>
          </div>
          
          {/* Dashboard Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link to={createPageUrl('AdminNewListings')}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-3 border border-yellow-200 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Шинэ зар</p>
                    {pendingLoading ? (
                      <Loader2 className="w-6 h-6 text-yellow-600 animate-spin" />
                    ) : pendingError ? (
                      <p className="text-sm text-red-600">Алдаа</p>
                    ) : (
                      <p className="text-2xl font-bold text-yellow-600">{pendingListings.length}</p>
                    )}
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500 opacity-50" />
                </div>
              </motion.div>
            </Link>
            
            <Link to={createPageUrl('AdminAllListings')}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 border border-purple-200 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">VIP зар</p>
                    {vipLoading ? (
                      <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                    ) : vipError ? (
                      <p className="text-sm text-red-600">Алдаа</p>
                    ) : (
                      <p className="text-2xl font-bold text-purple-600">{vipListings.length}</p>
                    )}
                  </div>
                  <Star className="w-8 h-8 text-purple-500 opacity-50" />
                </div>
              </motion.div>
            </Link>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => setShowUserSearch(true)}
              className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3 border border-blue-200 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Мессеж</p>
                  <p className="text-2xl font-bold text-blue-600">{unreadMessagesCount}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Хэрэглэгч: {usersLoading ? '...' : allUsers.length}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => setShowMessageDialog(true)}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 border border-green-200 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Мессеж илгээх</p>
                  <p className="text-sm font-semibold text-green-600">Бүх хэрэглэгч</p>
                </div>
                <Send className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid gap-4 md:grid-cols-2">
          <Link to={createPageUrl('AdminNewListings')}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Шинэ зарууд</h2>
                  <p className="text-sm text-gray-500">Батлах хүлээгдэж буй зар</p>
                </div>
              </div>
              {pendingListings.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Батлах хүлээж байна</span>
                    <span className="text-2xl font-bold text-yellow-600">{pendingListings.length}</span>
                  </div>
                </div>
              )}
            </motion.div>
          </Link>

          <Link to={createPageUrl('AdminAllListings')}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <List className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Бүх зарууд</h2>
                  <p className="text-sm text-gray-500">Бүх зарын жагсаалт</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">Хайх, устгах, засах, онцгой/VIP болгох</p>
              </div>
            </motion.div>
          </Link>

          <Link to={createPageUrl('AdminBanners')}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Баннер удирдах</h2>
                  <p className="text-sm text-gray-500">Нүүр хуудасны баннер зар</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">Баннер зар нэмэх, засах, устгах</p>
              </div>
            </motion.div>
          </Link>

          <Link to={createPageUrl('AdminBannerRequests')}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Баннер хүсэлтүүд</h2>
                  <p className="text-sm text-gray-500">Хэрэглэгчдийн баннер зарын хүсэлт</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">Хүсэлтүүдийг батлах, татгалзах</p>
              </div>
            </motion.div>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ y: -4, scale: 1.02 }}
            onClick={() => setShowMessageDialog(true)}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Бүх хэрэглэгчдэд мессеж</h2>
                <p className="text-sm text-gray-500">Бүх хэрэглэгчдэд мессеж илгээх</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">Бүх бүртгэлтэй хэрэглэгчдэд мессеж илгээх</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ y: -4, scale: 1.02 }}
            onClick={() => setShowUserSearch(true)}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Хэрэглэгч хайх</h2>
                <p className="text-sm text-gray-500">Хэрэглэгч хайх, мэдээлэл үзэх</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">Имэйл, нэр, утасны дугаараар хайх</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* User Search Dialog */}
      <Dialog open={showUserSearch} onOpenChange={setShowUserSearch}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Хэрэглэгч хайх</DialogTitle>
            <DialogDescription>
              Имэйл, нэр, утасны дугаараар хэрэглэгч хайх
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Имэйл, нэр, утасны дугаар..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {usersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Хэрэглэгч олдсонгүй</p>
                ) : (
                  filteredUsers.map((user) => {
                    const userListings = allListings.filter(listing => listing.created_by === user.email);
                    const activeListings = userListings.filter(l => l.status === 'active').length;
                    const pendingListings = userListings.filter(l => l.status === 'pending').length;
                    const totalListings = userListings.length;
                    
                    return (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900">
                                {user.displayName || user.email?.split('@')[0] || 'Нэргүй'}
                              </h3>
                              {user.role === 'admin' && (
                                <span className="px-2 py-0.5 text-xs bg-amber-500 text-white rounded">Админ</span>
                              )}
                            </div>
                            
                            <div className="space-y-1 mb-3">
                              <p className="text-sm text-gray-600">📧 {user.email}</p>
                              {user.phone && (
                                <p className="text-sm text-gray-600">📞 {user.phone}</p>
                              )}
                              {user.createdAt && (
                                <p className="text-xs text-gray-500">
                                  Бүртгүүлсэн: {new Date(user.createdAt?.seconds * 1000 || user.createdAt).toLocaleDateString('mn-MN', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}
                                </p>
                              )}
                            </div>

                            <div className="grid grid-cols-3 gap-2 mb-3 p-2 bg-white rounded border border-gray-200">
                              <div className="text-center">
                                <p className="text-xs text-gray-500">Нийт зар</p>
                                <p className="text-lg font-bold text-gray-900">{totalListings}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-500">Идэвхтэй</p>
                                <p className="text-lg font-bold text-green-600">{activeListings}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-500">Хүлээгдэж</p>
                                <p className="text-lg font-bold text-yellow-600">{pendingListings}</p>
                              </div>
                            </div>

                            {(user.kakao_id || user.wechat_id || user.whatsapp || user.facebook) && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">Сошиал мэдээлэл:</p>
                                <div className="flex flex-wrap gap-2">
                                  {user.kakao_id && (
                                    <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">Kakao: {user.kakao_id}</span>
                                  )}
                                  {user.wechat_id && (
                                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">WeChat: {user.wechat_id}</span>
                                  )}
                                  {user.whatsapp && (
                                    <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded">WhatsApp: {user.whatsapp}</span>
                                  )}
                                  {user.facebook && (
                                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Facebook: {user.facebook}</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowUserSearch(false);
              setUserSearchTerm('');
            }}>
              Хаах
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Бүх хэрэглэгчдэд мессеж илгээх</DialogTitle>
            <DialogDescription>
              Бүх бүртгэлтэй хэрэглэгчдэд мессеж илгээх. Мессеж нь хэрэглэгчдийн мессеж хайрцагт харагдах болно.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Мессежийн агуулга..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="resize-none"
            />
            {sendResult && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✅ Амжилттай илгээсэн: {sendResult.successCount} хэрэглэгч
                  {sendResult.errorCount > 0 && (
                    <span className="text-red-600"> | Алдаа: {sendResult.errorCount}</span>
                  )}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowMessageDialog(false);
                setMessage('');
                setSendResult(null);
              }}
              disabled={sendMessageMutation.isPending}
            >
              Цуцлах
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={sendMessageMutation.isPending || !message.trim()}
            >
              {sendMessageMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Илгээж байна...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Илгээх
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}