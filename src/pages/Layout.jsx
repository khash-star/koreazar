
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import * as entities from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Home, PlusCircle, User, Shield, Heart, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Layout({ children, currentPageName }) {
  const { user, userData } = useAuth();
  const [savedCount, setSavedCount] = useState(0);
  const showNav = currentPageName !== 'CreateListing' && currentPageName !== 'ListingDetail';

  useEffect(() => {
    const email = userData?.email || user?.email;
    if (email) {
      entities.SavedListing.filter({ created_by: email })
        .then(saved => {
          setSavedCount(saved.length);
        })
        .catch(error => {
          console.warn('Error loading saved listings count:', error);
          setSavedCount(0);
        });
    } else {
      setSavedCount(0);
    }
  }, [userData?.email, user?.email]);

  // Get unread message count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadMessages', userData?.email || user?.email],
    queryFn: async () => {
      const email = userData?.email || user?.email;
      if (!email) return 0;
      
      try {
        const conv1 = await entities.Conversation.filter({ participant_1: email });
        const conv2 = await entities.Conversation.filter({ participant_2: email });
        
        const totalUnread = conv1.reduce((sum, c) => sum + (c.unread_count_p1 || 0), 0) +
                            conv2.reduce((sum, c) => sum + (c.unread_count_p2 || 0), 0);
        
        return totalUnread;
      } catch (error) {
        console.warn('Error loading unread messages count:', error);
        return 0;
      }
    },
    enabled: !!(userData?.email || user?.email),
    refetchInterval: 5000,
    retry: false
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
      <footer className="bg-gray-900 text-gray-300 py-2 mt-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-gray-400">
            © 2026 Copyright Reserved - <span className="text-amber-500 font-semibold">KHASH Co Ltd</span>
          </p>
        </div>
      </footer>

      {/* Admin Button (Desktop) */}
      {(userData?.role === 'admin' || user?.role === 'admin') && (
        <Link to={createPageUrl('AdminPanel')} className="hidden md:block fixed top-4 right-4 z-50">
          <Button className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg">
            <Shield className="w-4 h-4 mr-2" />
            Админ удирдлага
          </Button>
        </Link>
      )}
      
      {/* Bottom Navigation (Mobile) - Only on Home */}
      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40">
          <div className={`flex items-center ${(userData?.role === 'admin' || user?.role === 'admin') ? 'justify-between' : 'justify-around'} py-2`}>
            <Link
              to={createPageUrl('Home')}
              className={`flex flex-col items-center py-2 px-6 ${
                currentPageName === 'Home' ? 'text-amber-600' : 'text-gray-500'
              }`}
            >
              <Home className="w-6 h-6" />
              <span className="text-xs mt-1">Нүүр</span>
            </Link>

            <Link
              to={createPageUrl('RequestBannerAd')}
              className={`flex flex-col items-center py-2 px-4 ${
                currentPageName === 'RequestBannerAd' ? 'text-amber-600' : 'text-gray-500'
              }`}
            >
              <span className="text-xl">🎨</span>
              <span className="text-xs mt-1">Баннер</span>
            </Link>

            <Link
              to={createPageUrl('SavedListings')}
              className={`flex flex-col items-center py-2 px-3 relative ${
                currentPageName === 'SavedListings' ? 'text-amber-600' : 'text-gray-500'
              }`}
            >
              <Heart className="w-6 h-6" />
              {savedCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {savedCount}
                </span>
              )}
              <span className="text-xs mt-1">Хадгалсан</span>
            </Link>

            <Link
              to={createPageUrl('Messages')}
              className={`flex flex-col items-center py-2 px-3 relative ${
                currentPageName === 'Messages' || currentPageName === 'Chat' ? 'text-amber-600' : 'text-gray-500'
              }`}
            >
              <MessageCircle className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              <span className="text-xs mt-1">Мессеж</span>
            </Link>

            <Link
              to={createPageUrl('CreateListing')}
              className="flex flex-col items-center py-2 px-3 text-gray-500"
            >
              <div className="w-12 h-12 -mt-6 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                <PlusCircle className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs mt-1">Зар нэмэх</span>
            </Link>

            <Link
              to={createPageUrl('MyListings')}
              className={`flex flex-col items-center py-2 px-6 ${
                currentPageName === 'MyListings' ? 'text-amber-600' : 'text-gray-500'
              }`}
            >
              <User className="w-6 h-6" />
              <span className="text-xs mt-1">Миний зар</span>
            </Link>

            {(userData?.role === 'admin' || user?.role === 'admin') && (
              <Link
                to={createPageUrl('AdminPanel')}
                className={`flex flex-col items-center py-2 px-6 ${
                  currentPageName === 'AdminPanel' || currentPageName === 'AdminNewListings' || currentPageName === 'AdminAllListings' ? 'text-amber-600' : 'text-gray-500'
                }`}
              >
                <Shield className="w-6 h-6" />
                <span className="text-xs mt-1">Админ</span>
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
