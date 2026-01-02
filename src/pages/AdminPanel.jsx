import React, { useState } from 'react';
import { filterListings } from '@/services/listingService';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, List, Shield, Settings, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation } from '@tanstack/react-query';
import { sendMessageToAllUsers } from '@/services/conversationService';
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

  const { data: pendingListings = [] } = useQuery({
    queryKey: ['pending-count'],
    queryFn: () => filterListings({ status: 'pending' }),
    enabled: userData?.role === 'admin',
  });

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
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
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
        </div>
      </div>

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