import React, { useState } from 'react';
import * as entities from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, List, Shield, Settings, MessageSquare, Send, Star, Users, Search, TrendingUp, Eye, LogIn, Loader2, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getAllUsers } from '@/services/authService';
import { sendMessageToAllUsers } from '@/services/conversationService';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export default function AdminPanel() {
  const { user, userData, loading: authLoading } = useAuth();
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [message, setMessage] = useState('');
  const [sendResult, setSendResult] = useState(null);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const isAdmin = userData?.role === 'admin' || user?.role === 'admin';

  const { data: pendingListings = [], isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-count'],
    queryFn: () => entities.Listing.filter({ status: 'pending' }),
    enabled: isAdmin,
  });

  const { data: vipListings = [], isLoading: vipLoading } = useQuery({
    queryKey: ['vip-listings-count'],
    queryFn: () => entities.Listing.filter({ listing_type: 'vip', status: 'active' }),
    enabled: isAdmin,
  });

  const { data: unreadMessagesCount = 0 } = useQuery({
    queryKey: ['admin-unread-messages', userData?.email || user?.email],
    queryFn: async () => {
      const email = userData?.email || user?.email;
      if (!email) return 0;
      
      try {
        const conv1 = await entities.Conversation.filter({ participant_1: email });
        const conv2 = await entities.Conversation.filter({ participant_2: email });
        const allConvs = [...conv1, ...conv2];
        
        const totalUnread = allConvs.reduce((sum, conv) => {
          const unread = conv.participant_1 === email 
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
    enabled: !!(userData?.email || user?.email) && isAdmin,
    refetchInterval: 5000
  });

  const { data: pendingReports = [] } = useQuery({
    queryKey: ['pending-listing-reports'],
    queryFn: () => entities.ListingReport.filter({ status: 'pending' }),
    enabled: isAdmin,
  });

  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => getAllUsers(),
    enabled: isAdmin,
  });

  const { data: allListingsForStats = [] } = useQuery({
    queryKey: ['all-listings-stats'],
    queryFn: () => entities.Listing.list('-created_date', 1000),
    enabled: isAdmin,
  });

  const { data: allListings = [] } = useQuery({
    queryKey: ['all-listings-for-user-stats'],
    queryFn: () => entities.Listing.list('-created_date', 1000),
    enabled: isAdmin && showUserSearch,
  });

  // Calculate statistics
  const totalViews = allListingsForStats.reduce((sum, listing) => sum + (listing.views || 0), 0);
  const loggedInUsers = allUsers.filter(user => user.email).length;
  
  // Category statistics
  const categoryStats = allListingsForStats.reduce((acc, listing) => {
    const category = listing.category || 'Бусад';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  // Status statistics
  const statusStats = allListingsForStats.reduce((acc, listing) => {
    const status = listing.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // Prepare chart data
  const categoryChartData = Object.entries(categoryStats).map(([name, value]) => ({
    name: name.length > 10 ? name.substring(0, 10) + '...' : name,
    value,
    fullName: name
  })).sort((a, b) => b.value - a.value).slice(0, 10);

  const statusChartData = Object.entries(statusStats).map(([name, value]) => ({
    name: name === 'active' ? 'Идэвхтэй' : 
          name === 'pending' ? 'Хүлээгдэж' : 
          name === 'rejected' ? 'Татгалзсан' : 
          name === 'sold' ? 'Зарагдсан' : name,
    value
  }));

  const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  const filteredUsers = allUsers.filter(user => 
    user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.phone?.includes(userSearchTerm)
  );

  const sendMessageMutation = useMutation({
    mutationFn: async (messageText) => {
      const adminEmail = userData?.email || user?.email;
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
      alert('Мессеж оруулах шаардлагатай.');
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

  if (!user || !isAdmin) {
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
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
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
                    ) : (
                      <p className="text-2xl font-bold text-purple-600">{vipListings.length}</p>
                    )}
                  </div>
                  <Star className="w-8 h-8 text-purple-500 opacity-50" />
                </div>
              </motion.div>
            </Link>
            
            <Link to={createPageUrl('Messages')}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3 border border-blue-200 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Мессеж (хариу бичих)</p>
                    <p className="text-2xl font-bold text-blue-600">{unreadMessagesCount}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Хэрэглэгч: {usersLoading ? '...' : allUsers.length}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-blue-500 opacity-50" />
                </div>
              </motion.div>
            </Link>
            
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

      {/* Statistics Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Статистик</h2>
          <p className="text-gray-500">Сайтын идэвжийн мэдээлэл</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Сайт хандалт</p>
                <p className="text-3xl font-bold text-gray-900">{totalViews.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">Бүх заруудын үзсэн тоо</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Нэвтэрсэн хэрэглэгч</p>
                <p className="text-3xl font-bold text-gray-900">{loggedInUsers}</p>
                <p className="text-xs text-gray-400 mt-1">Бүртгэлтэй хэрэглэгч</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <LogIn className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Нийт зар</p>
                <p className="text-3xl font-bold text-gray-900">{allListingsForStats.length}</p>
                <p className="text-xs text-gray-400 mt-1">Бүх заруудын тоо</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Category Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">Заруудын категори</h3>
            {categoryChartData.length > 0 ? (
              <div style={{ minHeight: 300, width: '100%' }}>
                <ResponsiveContainer width="100%" height={300} minHeight={300}>
                  <BarChart data={categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, _name, props) => [value, props?.payload?.fullName ?? props?.payload?.name ?? value]}
                  />
                  <Legend />
                  <Bar dataKey="value" fill="#f59e0b" name="Тоо" />
                </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                Өгөгдөл байхгүй
              </div>
            )}
          </motion.div>

          {/* Status Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">Заруудын статус</h3>
            {statusChartData.length > 0 ? (
              <div style={{ minHeight: 300, width: '100%' }}>
                <ResponsiveContainer width="100%" height={300} minHeight={300}>
                  <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                Өгөгдөл байхгүй
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Main Cards */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

          <Link to={createPageUrl('AdminListingReports')}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.33 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <Flag className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Зарын гомдол</h2>
                  <p className="text-sm text-gray-500">Хэрэглэгчийн санал, гомдлын шалгалт</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  {pendingReports.length > 0 ? `${pendingReports.length} шинэ гомдол` : 'Шинэ гомдол алга'}
                </p>
              </div>
            </motion.div>
          </Link>

          <Link to={createPageUrl('Messages')}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Мессеж унших, хариу бичих</h2>
                  <p className="text-sm text-gray-500">Хэрэглэгчдээс ирсэн мессежид хариу өгөх</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  {unreadMessagesCount > 0 ? `${unreadMessagesCount} уншаагүй мессеж байна` : 'Мессежийн жагсаалт руу орох'}
                </p>
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
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Имэйл, нэр, утасны дугаараар хайх</p>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Нийт хэрэглэгч</p>
                  <p className="text-2xl font-bold text-indigo-600">{usersLoading ? '...' : allUsers.length}</p>
                </div>
              </div>
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
                        onClick={() => setSelectedUser({ ...user, listings: userListings, activeListings, pendingListings, totalListings })}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900">
                                {user.displayName || user.email?.split('@')[0] || 'Хэрэглэгч'}
                              </h3>
                              {user.role === 'admin' && (
                                <span className="px-2 py-0.5 text-xs bg-amber-600 text-white rounded">Админ</span>
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

      {/* User Profile Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Хэрэглэгчийн профайл</DialogTitle>
            <DialogDescription>
              Хэрэглэгчийн дэлгэрэнгүй мэдээлэл
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                    {(selectedUser.displayName || selectedUser.email?.split('@')[0] || 'U')[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {selectedUser.displayName || selectedUser.email?.split('@')[0] || 'Хэрэглэгч'}
                      </h3>
                      {selectedUser.role === 'admin' && (
                        <span className="px-2 py-0.5 text-xs bg-amber-600 text-white rounded">Админ</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{selectedUser.email}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Үндсэн мэдээлэл</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Имэйл</p>
                      <p className="text-sm text-gray-900">{selectedUser.email}</p>
                    </div>
                    {selectedUser.phone && (
                      <div>
                        <p className="text-xs text-gray-500">Утасны дугаар</p>
                        <p className="text-sm text-gray-900">📞 {selectedUser.phone}</p>
                      </div>
                    )}
                    {selectedUser.createdAt && (
                      <div>
                        <p className="text-xs text-gray-500">Бүртгүүлсэн огноо</p>
                        <p className="text-sm text-gray-900">
                          {new Date(selectedUser.createdAt?.seconds * 1000 || selectedUser.createdAt).toLocaleDateString('mn-MN', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500">Эрх</p>
                      <p className="text-sm text-gray-900">
                        <span className={`px-2 py-0.5 rounded ${selectedUser.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>
                          {selectedUser.role === 'admin' ? 'Админ' : 'Хэрэглэгч'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Заруудын статистик</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500">Нийт</p>
                      <p className="text-lg font-bold text-gray-900">{selectedUser.totalListings || 0}</p>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <p className="text-xs text-gray-500">Идэвхтэй</p>
                      <p className="text-lg font-bold text-green-600">{selectedUser.activeListings || 0}</p>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded">
                      <p className="text-xs text-gray-500">Хүлээгдэж</p>
                      <p className="text-lg font-bold text-yellow-600">{selectedUser.pendingListings || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {(selectedUser.kakao_id || selectedUser.wechat_id || selectedUser.whatsapp || selectedUser.facebook) && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Сошиал мэдээлэл</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedUser.kakao_id && (
                      <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
                        <p className="text-xs text-gray-500">Kakao ID</p>
                        <p className="text-sm font-medium text-yellow-700">{selectedUser.kakao_id}</p>
                      </div>
                    )}
                    {selectedUser.wechat_id && (
                      <div className="p-2 bg-green-50 rounded border border-green-200">
                        <p className="text-xs text-gray-500">WeChat ID</p>
                        <p className="text-sm font-medium text-green-700">{selectedUser.wechat_id}</p>
                      </div>
                    )}
                    {selectedUser.whatsapp && (
                      <div className="p-2 bg-emerald-50 rounded border border-emerald-200">
                        <p className="text-xs text-gray-500">WhatsApp</p>
                        <p className="text-sm font-medium text-emerald-700">{selectedUser.whatsapp}</p>
                      </div>
                    )}
                    {selectedUser.facebook && (
                      <div className="p-2 bg-blue-50 rounded border border-blue-200">
                        <p className="text-xs text-gray-500">Facebook</p>
                        <p className="text-sm font-medium text-blue-700 break-all">{selectedUser.facebook}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedUser.listings && selectedUser.listings.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Зарууд ({selectedUser.listings.length})</h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {selectedUser.listings.slice(0, 10).map((listing) => (
                      <div key={listing.id} className="p-2 bg-gray-50 rounded border border-gray-200">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">{listing.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            listing.status === 'active' ? 'bg-green-100 text-green-700' :
                            listing.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            listing.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {listing.status === 'active' ? 'Идэвхтэй' :
                             listing.status === 'pending' ? 'Хүлээгдэж' :
                             listing.status === 'rejected' ? 'Татгалзсан' :
                             listing.status}
                          </span>
                          {listing.listing_type === 'vip' && (
                            <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">VIP</span>
                          )}
                          {listing.listing_type === 'featured' && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Онцгой</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {selectedUser.listings.length > 10 && (
                      <p className="text-xs text-gray-500 text-center mt-2">
                        +{selectedUser.listings.length - 10} илүү зар...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>
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
              Бүх бүртгэлтэй хэрэглэгчдэд мессеж илгээх. Мессеж нь хэрэглэгчдийн мессеж хайрцгад харагдана.
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
