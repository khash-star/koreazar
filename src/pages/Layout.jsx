
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import * as entities from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Home, PlusCircle, User, Shield, Heart, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Layout({ children, currentPageName }) {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const showNav = currentPageName !== 'CreateListing' && currentPageName !== 'ListingDetail';

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
      return entities.SavedListing.filter({ created_by: email });
    },
    enabled: !!(userData?.email || user?.email),
    retry: false
  });

  const savedCount = savedListings.length;

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
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40 shadow-lg">
          <div className="flex items-center justify-around py-2.5 px-2">
            <button
              onClick={handleHomeClick}
              className={`flex flex-col items-center justify-center gap-1 flex-1 min-w-0 ${
                currentPageName === 'Home' ? 'text-amber-600' : 'text-gray-500'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px] leading-tight">Нүүр</span>
            </button>

            <Link
              to={createPageUrl('SavedListings')}
              className={`flex flex-col items-center justify-center gap-1 flex-1 min-w-0 relative ${
                currentPageName === 'SavedListings' ? 'text-amber-600' : 'text-gray-500'
              }`}
            >
              <Heart className="w-5 h-5" />
              {savedCount > 0 && (
                <span className="absolute -top-0.5 right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {savedCount > 9 ? '9+' : savedCount}
                </span>
              )}
              <span className="text-[10px] leading-tight">Хадгал</span>
            </Link>

            <Link
              to={createPageUrl('Messages')}
              className={`flex flex-col items-center justify-center gap-1 flex-1 min-w-0 relative ${
                currentPageName === 'Messages' || currentPageName === 'Chat' ? 'text-amber-600' : 'text-gray-500'
              }`}
            >
              <MessageCircle className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              <span className="text-[10px] leading-tight">Мессеж</span>
            </Link>

            <Link
              to={createPageUrl('CreateListing')}
              className={`flex flex-col items-center justify-center gap-1 flex-1 min-w-0 ${
                currentPageName === 'CreateListing' ? 'text-amber-600' : 'text-gray-500'
              }`}
            >
              <PlusCircle className="w-5 h-5" />
              <span className="text-[10px] leading-tight">Нэмэх</span>
            </Link>

            {(userData?.role === 'admin' || user?.role === 'admin') && (
              <Link
                to={createPageUrl('AdminPanel')}
                className={`flex flex-col items-center justify-center gap-1 flex-1 min-w-0 ${
                  currentPageName === 'AdminPanel' || currentPageName === 'AdminNewListings' || currentPageName === 'AdminAllListings' ? 'text-amber-600' : 'text-gray-500'
                }`}
              >
                <Shield className="w-5 h-5" />
                <span className="text-[10px] leading-tight">Админ</span>
              </Link>
            )}

            <Link
              to={createPageUrl('MyListings')}
              className={`flex flex-col items-center justify-center gap-1 flex-1 min-w-0 ${
                currentPageName === 'MyListings' ? 'text-amber-600' : 'text-gray-500'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-[10px] leading-tight">Миний</span>
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
}
