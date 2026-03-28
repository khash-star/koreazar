
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import * as entities from '@/api/entities';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Home, PlusCircle, User, Shield, Heart, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUnreadMessagesCount } from '@/services/conversationService';
import { fetchSavedListingsResolved } from '@/services/savedListingsResolve';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function Layout({ children, currentPageName }) {
  const { user, userData, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const showNav = currentPageName !== 'CreateListing' && currentPageName !== 'ListingDetail';
  const [feedbackForm, setFeedbackForm] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  });
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const handleHomeClick = (e) => {
    e.preventDefault();
    // Navigate to home with clearFilters parameter to reset all filters
    navigate(`${createPageUrl('Home')}?clearFilters=true`);
    // Navigate to listings section after a short delay
    setTimeout(() => {
      const listingsSection = document.querySelector('[data-listings-section]');
      if (listingsSection) {
        listingsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // Fallback: scroll to top if section not found
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    }, 100);
  };

  // Get saved listings count using useQuery (same as other components)
  const { data: savedListings = [] } = useQuery({
    queryKey: ['savedListings', userData?.email || user?.email],
    queryFn: () => {
      const email = userData?.email || user?.email;
      if (!email) return [];
      return fetchSavedListingsResolved(email);
    },
    enabled: !!(userData?.email || user?.email),
    retry: false
  });

  const savedCount = savedListings.length;

  const isAdmin = userData?.role === 'admin' || user?.role === 'admin';

  // Get pending listings count for admin (шинэ зарын хүсэлт)
  const { data: pendingListings = [] } = useQuery({
    queryKey: ['pending-count'],
    queryFn: () => entities.Listing.filter({ status: 'pending' }),
    enabled: isAdmin,
    refetchInterval: 5000,
    retry: false
  });
  const pendingCount = pendingListings.length;

  const displayName = userData?.name || userData?.displayName || user?.displayName || '';
  const displayPhone = userData?.phone || userData?.phoneNumber || user?.phoneNumber || '';
  const displayEmail = userData?.email || user?.email || '';

  useEffect(() => {
    setFeedbackForm((prev) => ({
      ...prev,
      name: displayName,
      phone: displayPhone,
      email: displayEmail,
    }));
  }, [displayName, displayPhone, displayEmail]);

  const feedbackMutation = useMutation({
    mutationFn: (payload) => entities.Feedback.create(payload),
    onSuccess: () => {
      toast({ title: 'Санал хүсэлт амжилттай илгээгдлээ' });
      setFeedbackForm((prev) => ({ ...prev, message: '' }));
      setIsFeedbackOpen(false);
    },
    onError: () => {
      toast({ title: 'Илгээх үед алдаа гарлаа', variant: 'destructive' });
    },
  });

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    const message = feedbackForm.message.trim();

    if (!displayEmail) {
      toast({ title: 'Санал илгээхийн тулд нэвтэрнэ үү', variant: 'destructive' });
      navigate(createPageUrl('Login'));
      return;
    }

    if (!message) {
      toast({ title: 'Санал хүсэлтийн агуулгаа бичнэ үү', variant: 'destructive' });
      return;
    }

    feedbackMutation.mutate({
      name: displayName || feedbackForm.name || '',
      phone: displayPhone || feedbackForm.phone || '',
      email: displayEmail,
      message,
      page: currentPageName,
      source: 'footer',
    });
  };

  // Unread badge: getUnreadMessagesCount нь users/{uid}.email-ийг ашиглаж болно (token.email хоосон үед ч).
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadMessages', user?.uid],
    queryFn: async () => {
      try {
        return await getUnreadMessagesCount();
      } catch {
        return 0;
      }
    },
    enabled: !authLoading && !!user?.uid,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    staleTime: 5_000,
    retry: false,
  });
  
  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        :root {
          --color-primary: #f59e0b;
          --color-primary-dark: #d97706;
        }
        
        * {
          -webkit-tap-highlight-color: transparent;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      {children}

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 mt-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/70 border border-gray-700 rounded-2xl p-4">
              <h3 className="text-white font-semibold">Тусламж</h3>
              <div className="mt-2 space-y-1 text-sm">
                <Link to={createPageUrl('AIBot')} className="block text-gray-300 hover:text-amber-400">
                  Түгээмэл асуулт, хариулт
                </Link>
                <button
                  type="button"
                  onClick={() => setIsFeedbackOpen(true)}
                  className="block text-left w-full text-gray-300 hover:text-amber-400"
                >
                  Санал хүсэлт илгээх
                </button>
                <Link to={createPageUrl('Messages')} className="block text-gray-300 hover:text-amber-400">
                  Админтай холбогдох
                </Link>
                <Link to={createPageUrl('Privacy')} className="block text-gray-300 hover:text-amber-400">
                  Нууцлалын бодлого
                </Link>
              </div>
            </div>

            <div className="bg-gray-800/70 border border-gray-700 rounded-2xl p-4">
              <h3 className="text-white font-semibold">Холбоо барих</h3>
              <div className="mt-2 space-y-1 text-sm text-gray-300">
                <p>И-мэйл: support@zarkorea.com</p>
                <p>Утас: +82 10-0000-0000</p>
                <p>Ажлын цаг: 09:00 - 18:00</p>
              </div>
            </div>

            <div className="bg-gray-800/70 border border-gray-700 rounded-2xl p-4">
              <h3 className="text-white font-semibold">Үйлчилгээ</h3>
              <div className="mt-2 space-y-1 text-sm">
                <Link to={createPageUrl('CreateListing')} className="block text-gray-300 hover:text-amber-400">
                  Зар нэмэх
                </Link>
                <Link to={createPageUrl('MyListings')} className="block text-gray-300 hover:text-amber-400">
                  Миний зарууд
                </Link>
                <Link to={createPageUrl('SavedListings')} className="block text-gray-300 hover:text-amber-400">
                  Хадгалсан зарууд
                </Link>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center">
            © 2026 Copyright Reserved - <span className="text-amber-500 font-semibold">KHASH Co Ltd</span>
            {' · '}
            <Link to={createPageUrl('Privacy')} className="hover:text-amber-500 underline underline-offset-2">
              Нууцлалын бодлого
            </Link>
          </p>
        </div>
      </footer>

      <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
        <DialogContent className="sm:max-w-3xl bg-[#10233f] border border-slate-700 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl">Санал хүсэлт</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-300">Таны саналыг бид сайжруулалтад ашиглана.</p>
          <form onSubmit={handleFeedbackSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input value={feedbackForm.name} readOnly className="bg-[#0a1730] border-slate-700 text-white" placeholder="Таны нэр" />
              <Input value={feedbackForm.phone} readOnly className="bg-[#0a1730] border-slate-700 text-white" placeholder="Утас" />
              <Input value={feedbackForm.email} readOnly className="bg-[#0a1730] border-slate-700 text-white" placeholder="E-мэйл" />
            </div>
            <Textarea
              value={feedbackForm.message}
              onChange={(e) => setFeedbackForm((prev) => ({ ...prev, message: e.target.value }))}
              className="bg-[#0a1730] border-slate-700 text-white min-h-[140px]"
              placeholder={displayEmail ? 'Санал хүсэлтээ энд бичнэ үү' : 'Санал хүсэлт илгээхийн тулд эхлээд нэвтэрнэ үү'}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={feedbackMutation.isPending}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {feedbackMutation.isPending ? 'Илгээж байна...' : 'Илгээх'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Admin Button (Desktop) */}
      {(userData?.role === 'admin' || user?.role === 'admin') && (
        <Link to={createPageUrl('AdminPanel')} className="hidden md:block fixed top-4 right-4 z-50">
          <Button className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg">
            <Shield className="w-4 h-4 mr-2" />
            Админ удирдлага
          </Button>
        </Link>
      )}
      
      {/* Bottom Navigation (Mobile) - Only on Home */}
      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40 shadow-lg" aria-label="Гол цэс">
          <div className="flex items-center justify-around py-2.5 px-2">
            <button
              type="button"
              onClick={handleHomeClick}
              aria-current={currentPageName === 'Home' ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-1 flex-1 min-w-0 ${
                currentPageName === 'Home' ? 'text-amber-600' : 'text-gray-700'
              }`}
            >
              <Home className="w-5 h-5" aria-hidden />
              <span className="text-[10px] leading-tight font-medium">Нүүр</span>
            </button>

            <Link
              to={createPageUrl('SavedListings')}
              aria-label="Хадгалсан зарууд"
              aria-current={currentPageName === 'SavedListings' ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-1 flex-1 min-w-0 relative ${
                currentPageName === 'SavedListings' ? 'text-amber-600' : 'text-gray-700'
              }`}
            >
              <Heart className="w-5 h-5" aria-hidden />
              {savedCount > 0 && (
                <span className="absolute -top-0.5 right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {savedCount > 9 ? '9+' : savedCount}
                </span>
              )}
              <span className="text-[10px] leading-tight font-medium">Хадгал</span>
            </Link>

            <Link
              to={createPageUrl('Messages')}
              aria-label="Мессеж"
              aria-current={currentPageName === 'Messages' || currentPageName === 'Chat' ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-1 flex-1 min-w-0 relative ${
                currentPageName === 'Messages' || currentPageName === 'Chat' ? 'text-amber-600' : 'text-gray-700'
              }`}
            >
              <MessageCircle className="w-5 h-5" aria-hidden />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              <span className="text-[10px] leading-tight font-medium">Мессеж</span>
            </Link>

            <Link
              to={createPageUrl('CreateListing')}
              aria-label="Зар нэмэх"
              aria-current={currentPageName === 'CreateListing' ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-1 flex-1 min-w-0 ${
                currentPageName === 'CreateListing' ? 'text-amber-600' : 'text-gray-700'
              }`}
            >
              <PlusCircle className="w-5 h-5" aria-hidden />
              <span className="text-[10px] leading-tight font-medium">Нэмэх</span>
            </Link>

            {(userData?.role === 'admin' || user?.role === 'admin') && (
              <Link
                to={createPageUrl('AdminPanel')}
                aria-label="Админ удирдлага"
                aria-current={currentPageName === 'AdminPanel' || currentPageName === 'AdminNewListings' || currentPageName === 'AdminAllListings' ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-1 flex-1 min-w-0 relative ${
                  currentPageName === 'AdminPanel' || currentPageName === 'AdminNewListings' || currentPageName === 'AdminAllListings' ? 'text-amber-600' : 'text-gray-700'
                }`}
              >
                <Shield className="w-5 h-5" aria-hidden />
                {pendingCount > 0 && (
                  <span className="absolute -top-0.5 right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
                <span className="text-[10px] leading-tight font-medium">Админ</span>
              </Link>
            )}

            <Link
              to={createPageUrl('MyListings')}
              aria-label="Миний зарууд"
              aria-current={currentPageName === 'MyListings' ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-1 flex-1 min-w-0 ${
                currentPageName === 'MyListings' ? 'text-amber-600' : 'text-gray-700'
              }`}
            >
              <User className="w-5 h-5" aria-hidden />
              <span className="text-[10px] leading-tight font-medium">Миний</span>
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
}
