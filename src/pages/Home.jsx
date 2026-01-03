import React, { useState, useEffect, useRef } from 'react';
import { filterListings } from '@/services/listingService';
import { filterBannerAds } from '@/services/bannerService';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, TrendingUp, Sparkles, ChevronRight, ArrowUp, ChevronLeft, ChevronRight as ChevronRightIcon, ChevronDown, User, Clock, Star, MessageSquare, Bot, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import CategoryCard, { categoryInfo } from '@/components/listings/CategoryCard';
import ListingCard from '@/components/listings/ListingCard';
import SearchBar from '@/components/listings/SearchBar';
import { Skeleton } from '@/components/ui/skeleton';
import { subcategoryConfig } from '@/components/listings/subcategoryConfig';
import Banner from '@/components/Banner';
import FeaturedListingCard from '@/components/listings/FeaturedListingCard';
import WelcomeModal from '@/components/WelcomeModal';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LogOut } from 'lucide-react';
import { logout } from '@/services/authService';
import { useNavigate } from 'react-router-dom';
import { filterConversations } from '@/services/conversationService';

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const listingsRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const { isAuthenticated, userData } = useAuth();
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/Home');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Түгээмэл асуулт хариултууд
  const faqData = [
    {
      question: 'Сайтад бүртгүүлэх',
      answer: `Бүртгүүлэх заавар:

1. **"Бүртгүүлэх"** товчийг дарна
2. **Имэйл хаяг, нууц үгээ** оруулна
3. Бүртгүүлэх товчийг дараад бүртгэл үүсгэнэ

**Анхаарах зүйл:**
- Имэйл хаяг зөв оруулах шаардлагатай
- Нууц үг хангалттай хүчтэй байх ёстой
- Бүртгүүлсний дараа имэйлээр баталгаажуулах линк ирнэ`
    },
    {
      question: '🔐 Нэвтрэх',
      answer: `Нэвтрэх заавар:

1. **"Нэвтрэх"** товчийг дарна
2. **Имэйл, нууц үгээ** оруулна
3. Нэвтрэх товчийг дараад нэвтэрнэ`
    },
    {
      question: '❓ Нууц үгээ мартсан бол',
      answer: `Нууц үг сэргээх заавар:

1. Нэвтрэх хуудас дээр **"Нууц үгээ мартсан уу?"** линк дээр дарна
2. **Имэйл хаягаа** оруулна
3. Имэйлээр ирсэн **линкээр шинэ нууц үг үүсгэнэ**

**Анхаарах зүйл:**
- Имэйлээ зөв оруулах шаардлагатай
- Имэйлээр нууц үг сэргээх линк ирнэ
- Линк нь тодорхой хугацааны дараа хүчингүй болно`
    },
    {
      question: 'Зар хэрхэн оруулах вэ?',
      answer: `Зар оруулах заавар:

1. **Апп-ыг нээгээд** нүүр хуудас руу орох
2. **"Зар нэмэх"** товчийг дарж шинэ зар үүсгэх
3. **Категори-г сонгоно уу** (жишээ: Автомашин, Орон сууц, Ажлын байр гэх мэт)
4. **Зарын мэдээлэл-ийг бөглөж, зураг оруулах**
5. **"Хадгалах" эсвэл "Танилцуулах"** товчийг дарж зар оруулах

Зар оруулсны дараа админ баталгаажуулаад идэвхтэй болно.`
    },
    {
      question: 'VIP зар гэж юу вэ?',
      answer: `VIP зар гэдэг нь:

**VIP заруудын онцлог:**
- Зар жагсаалтын дээд талд онцолж харагдана
- Илүү их харагдах боломжтой
- Хайлтын үр дүнд эхэлж харагдана
- Онцгой тэмдэглэгээтэй байна

**VIP зар болгох:**
- Зар оруулсны дараа "VIP болгох" товчийг дарах
- VIP зар нь тодорхой хугацааны турш идэвхтэй байна
- VIP зарууд илүү их анхаарал татаж, борлуулалт хурдан болдог`
    },
    {
      question: 'Мессеж хэрхэн илгээх вэ?',
      answer: `Мессеж илгээх заавар:

**Зар эзэмшлийн мессеж илгээх:**
1. Зар дээр ороод **"Мессеж илгээх"** товчийг дарна
2. Мессежийн агуулга бичнэ
3. **"Илгээх"** товчийг дарна

**Админтай мессеж илгээх:**
1. **"Мессеж"** хуудас руу орох
2. **"Админтай мессеж"** товчийг дарна
3. Мессеж бичээд илгээнэ

**Мессеж унших:**
- "Мессеж" хуудас дээр бүх ярилцлагууд харагдана
- Шинэ мессеж ирсэн бол тоогоор мэдэгдэнэ`
    },
    {
      question: 'Категориуд юу байна?',
      answer: `Koreazar апп-д дараах категориуд байна:

**Үндсэн категориуд:**
1. **Автомашин** - Машин, мотоцикл, эд анги
2. **Орон сууц** - Байр, оффис, газар
3. **Ажлын байр** - Ажлын байр, ажил олох
4. **Бараа** - Гоёл чимэглэл, хувцас, бусад бараа
5. **Үйлчилгээ** - Бизнес, үйлчилгээний зар

**Категори сонгох:**
- Нүүр хуудас дээр категориуд харагдана
- Категори дээр дарж тухайн категорийн заруудыг харах
- Зар оруулахдаа категори сонгох шаардлагатай`
    },
    {
      question: 'Зар хэрхэн хайх вэ?',
      answer: `Зар хайх заавар:

**Хайлт хийх арга:**
1. Нүүр хуудас дээр хайлтын талбар ашиглах
2. Категори сонгож тухайн категорийн заруудыг харах
3. Дэд ангилал, байршил, үнэ зэрэг шүүлтүүр ашиглах

**Зарны мэдээлэл:**
- Зар дээр дарж дэлгэрэнгүй мэдээлэл харах
- Зар эзэмшэлтэй шууд холбогдох боломжтой
- Зар хадгалж, дараа нь харах боломжтой`
    }
  ];
  const [filters, setFilters] = useState({
    category: '',
    subcategory: '',
    search: '',
    location: '',
    minPrice: '',
    maxPrice: '',
    condition: ''
  });



  const { data: bannerAds = [] } = useQuery({
    queryKey: ['bannerAds'],
    queryFn: async () => {
      try {
        const ads = await filterBannerAds({ is_active: true });
        return ads.length > 0 ? ads : [
          // Fallback default banners
          { image_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6955079a31933f39746103b7/e5e668a0d_busan-city.jpg', link: '#' },
          { image_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6955079a31933f39746103b7/318d19bb0_daegu-tower_144973903.jpg', link: '#' },
          { image_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6955079a31933f39746103b7/9d05a0e32_exploring-the-city-of-korean-drama-a-travel-in-south-korea.jpg', link: '#' }
        ];
      } catch (error) {
        console.error('Error fetching banners:', error);
        // Return fallback banners on error
        return [
          { image_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6955079a31933f39746103b7/e5e668a0d_busan-city.jpg', link: '#' },
          { image_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6955079a31933f39746103b7/318d19bb0_daegu-tower_144973903.jpg', link: '#' },
          { image_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6955079a31933f39746103b7/9d05a0e32_exploring-the-city-of-korean-drama-a-travel-in-south-korea.jpg', link: '#' }
        ];
      }
    }
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryFromUrl = urlParams.get('category') || '';
    const scrollTo = urlParams.get('scroll');
    
    // If navigating to Home without category parameter, clear all filters
    if (location.pathname === '/Home' && !categoryFromUrl) {
      setFilters({
        category: '',
        subcategory: '',
        search: '',
        location: '',
        minPrice: '',
        maxPrice: '',
        condition: ''
      });
    } else {
      setFilters(prev => ({
        ...prev,
        category: categoryFromUrl,
        subcategory: ''
      }));
    }

    if (scrollTo === 'listings') {
      setTimeout(() => listingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }

    // Check if user has seen welcome modal
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, [location.pathname, location.search]);

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('hasSeenWelcome', 'true');
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
      if (window.scrollY > 200 && categoriesExpanded) {
        setCategoriesExpanded(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [categoriesExpanded]);

  useEffect(() => {
    if (filters.category && categoriesExpanded) {
      setCategoriesExpanded(false);
    }
  }, [filters.category]);

  useEffect(() => {
    if (bannerAds.length > 2) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 2) % bannerAds.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [bannerAds.length]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['listings', filters],
    queryFn: async () => {
      let query = { status: 'active' };
      
      if (filters.category) query.category = filters.category;
      if (filters.subcategory) query.subcategory = filters.subcategory;
      if (filters.location) query.location = filters.location;
      if (filters.condition) query.condition = filters.condition;
      
      let results = await filterListings(query, '-created_date', 20); // Limit to 20 listings per page to save Firestore reads
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        results = results.filter(l => 
          l.title?.toLowerCase().includes(searchLower) ||
          l.description?.toLowerCase().includes(searchLower)
        );
      }
      
      if (filters.minPrice) {
        results = results.filter(l => l.price >= Number(filters.minPrice));
      }
      if (filters.maxPrice) {
        results = results.filter(l => l.price <= Number(filters.maxPrice));
      }
      
      // Check listing_type_expires and downgrade if expired
      const now = new Date();
      results = results.map(listing => {
        if (listing.listing_type !== 'regular' && listing.listing_type_expires) {
          const expiresDate = new Date(listing.listing_type_expires);
          if (expiresDate < now) {
            return { ...listing, listing_type: 'regular' };
          }
        }
        return listing;
      });
      
      // Sort: VIP first, then featured, then regular by date
      results.sort((a, b) => {
        const typeOrder = { vip: 0, featured: 1, regular: 2 };
        const aOrder = typeOrder[a.listing_type] ?? 2;
        const bOrder = typeOrder[b.listing_type] ?? 2;
        
        if (aOrder !== bOrder) return aOrder - bOrder;
        return new Date(b.created_date) - new Date(a.created_date);
      });
      
      return results;
    }
  });

  const { data: allListings = [] } = useQuery({
    queryKey: ['allListings'],
    queryFn: () => filterListings({ status: 'active' }, '-created_date', 20), // Limit to 20 for counts
  });

  // Admin dashboard stats
  const { data: pendingListings = [] } = useQuery({
    queryKey: ['admin-pending-count'],
    queryFn: () => filterListings({ status: 'pending' }),
    enabled: userData?.role === 'admin',
  });

  const { data: vipListings = [] } = useQuery({
    queryKey: ['admin-vip-count'],
    queryFn: () => filterListings({ listing_type: 'vip', status: 'active' }),
    enabled: userData?.role === 'admin',
  });

  const { data: unreadMessagesCount = 0 } = useQuery({
    queryKey: ['admin-unread-messages-home', userData?.email],
    queryFn: async () => {
      if (!userData?.email) return 0;
      
      try {
        const convs1 = await filterConversations({ participant_1: userData.email });
        const convs2 = await filterConversations({ participant_2: userData.email });
        const allConvs = [...convs1, ...convs2];
        
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
    refetchInterval: 5000
  });

  const categoryCounts = allListings.reduce((acc, listing) => {
    acc[listing.category] = (acc[listing.category] || 0) + 1;
    return acc;
  }, {});

  const handleSearch = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Markdown форматлалт харуулах функц
  const renderFormattedText = (text) => {
    if (!text) return '';
    
    // Мөрүүдийг хуваах
    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => {
      // **bold** болгох
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, partIndex) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const boldText = part.slice(2, -2);
          return <strong key={partIndex} className="font-semibold">{boldText}</strong>;
        }
        return <span key={partIndex}>{part}</span>;
      });
      
      return (
        <React.Fragment key={lineIndex}>
          {formattedParts}
          {lineIndex < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white">
      <WelcomeModal isOpen={showWelcome} onClose={handleCloseWelcome} />
      
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-amber-600 to-orange-500 text-white py-2 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <h1 className="text-xs md:text-sm font-bold tracking-wide flex-1 text-center">
             СОЛОНГОС ДАХ МОНГОЛЧУУДЫН ЗАРЫН НЭГДСЭН САЙТ 
          </h1>
          {!isAuthenticated ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                onClick={() => setShowHelpDialog(true)}
              >
                <HelpCircle className="w-4 h-4 mr-1" />
                <span className="text-xs">ТУСЛАМЖ</span>
              </Button>
              <Link to={createPageUrl('Login')} className="ml-2">
                <Button variant="outline" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                  <User className="w-4 h-4 mr-1" />
                  <span className="text-xs">Нэвтрэх</span>
                </Button>
              </Link>
            </>
          ) : (
            <>
              {/* AI Bot Icon Button */}
              <Link to={createPageUrl('AIBot')} className="ml-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-full w-10 h-10"
                  title="AI Туслах"
                >
                  <Bot className="w-5 h-5" />
                </Button>
              </Link>
              <div className="md:hidden ml-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                      {userData?.role === 'admin' ? (
                        <img src="/admin_logo.png" alt="Admin" className="w-4 h-4 mr-1 object-contain" />
                      ) : (
                        <User className="w-4 h-4 mr-1" />
                      )}
                      <span className="text-xs">{userData?.displayName || user?.displayName || userData?.email?.split('@')[0] || user?.email?.split('@')[0] || 'Профайл'}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('Profile')} className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Профайл</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('MyListings')} className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Миний зар</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Гарах</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="hidden md:block ml-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                      {userData?.role === 'admin' ? (
                        <img src="/admin_logo.png" alt="Admin" className="w-4 h-4 mr-1 object-contain" />
                      ) : (
                        <User className="w-4 h-4 mr-1" />
                      )}
                      <span className="text-xs">{userData?.displayName || user?.displayName || userData?.email?.split('@')[0] || user?.email?.split('@')[0] || 'Профайл'}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('Profile')} className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Профайл</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('MyListings')} className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Миний зар</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Гарах</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Admin Dashboard Stats */}
      {userData?.role === 'admin' && (
        <div className="max-w-7xl mx-auto px-4 mt-4 mb-4">
          <div className="grid grid-cols-3 gap-3">
            <Link to={createPageUrl('AdminNewListings')}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-3 border border-yellow-200 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Шинэ зар</p>
                    <p className="text-2xl font-bold text-yellow-600">{pendingListings.length}</p>
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
                    <p className="text-2xl font-bold text-purple-600">{vipListings.length}</p>
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
                    <p className="text-xs text-gray-600 mb-1">Мессеж</p>
                    <p className="text-2xl font-bold text-blue-600">{unreadMessagesCount}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-blue-500 opacity-50" />
                </div>
              </motion.div>
            </Link>
          </div>
        </div>
      )}

      {/* Hero Banner Grid */}
      {bannerAds.length > 0 && (
        <div className="bg-gray-900 py-3 md:py-6 mt-12 md:mt-14">
          <div className="max-w-7xl mx-auto px-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentBannerIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-2 gap-4"
              >
                {bannerAds.slice(currentBannerIndex, currentBannerIndex + 2).concat(
                  currentBannerIndex + 2 > bannerAds.length 
                    ? bannerAds.slice(0, (currentBannerIndex + 2) - bannerAds.length)
                    : []
                ).slice(0, 2).map((banner, index) => (
                  <a
                    key={index}
                    href={banner.link || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative h-[200px] md:h-[320px] rounded-xl overflow-hidden group block"
                  >
                    <img 
                      src={banner.image_url} 
                      alt={banner.title || 'Banner'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      crossOrigin="anonymous"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute top-3 right-3">
                      <span className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-md font-medium shadow-lg">
                        Зар
                      </span>
                    </div>
                  </a>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 pt-0 pb-24 md:pb-12 mt-0 md:mt-0">
        {/* Categories */}
        {!filters.search && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-4"
          >
            <button
              onClick={() => setCategoriesExpanded(!categoriesExpanded)}
              className="flex items-center justify-between gap-2 mb-6 w-full md:pointer-events-none"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Ангилалууд</h2>
                  <p className="text-sm text-gray-500">Монголчуудын зарын сайт</p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform md:hidden ${categoriesExpanded ? 'rotate-180' : ''}`} />
            </button>

            {/* Category Grid */}
            <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6 ${categoriesExpanded ? '' : 'hidden md:grid'}`}>
              <button
                onClick={() => {
                  setFilters(prev => ({ ...prev, category: '', subcategory: '' }));
                  setTimeout(() => listingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                }}
                className={`px-3 py-2 rounded-xl font-medium transition-all text-center ${
                  !filters.category
                    ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/40 scale-105 border-2 border-amber-600'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-amber-300'
                }`}
              >
                <div className="text-sm font-semibold">
                  Бүгд ({Object.values(categoryCounts).reduce((a, b) => a + b, 0)})
                </div>
              </button>
              {Object.keys(categoryInfo).map((cat) => {
                const info = categoryInfo[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setFilters(prev => ({ ...prev, category: cat, subcategory: '' }));
                      setTimeout(() => listingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                    }}
                    className={`px-3 py-2 rounded-xl font-medium transition-all text-center ${
                      filters.category === cat
                        ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/40 scale-105 border-2 border-amber-600'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="text-sm font-semibold">{info.name} ({categoryCounts[cat] || 0})</div>
                  </button>
                );
              })}
            </div>

            {/* Subcategories */}
            {filters.category && subcategoryConfig[filters.category] && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`bg-white rounded-xl p-4 mb-4 border border-gray-100 ${categoriesExpanded ? '' : 'hidden md:block'}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <ChevronRight className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-semibold text-gray-700">Дэд ангилал</span>
                </div>
                <div className="flex flex-wrap gap-2 scrollbar-hide">
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, subcategory: '' }))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      !filters.subcategory
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    Бүгд
                  </button>
                  {subcategoryConfig[filters.category].map((sub) => (
                    <button
                      key={sub.value}
                      onClick={() => setFilters(prev => ({ ...prev, subcategory: sub.value }))}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        filters.subcategory === sub.value
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Category Search Box */}
            {filters.category && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`bg-white rounded-xl p-4 mb-4 border border-gray-100 ${categoriesExpanded ? '' : 'hidden md:block'}`}
              >
                <div className="relative">
                  <input
                    type="text"
                    placeholder={`${categoryInfo[filters.category]?.name || 'Энэ категори'}-д хайх...`}
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    🔍
                  </div>
                  {filters.search && (
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </motion.section>
        )}

        {/* Sponsored Banners & VIP Listings Marquee */}
        {(bannerAds.length > 0 || listings.filter(l => l.listing_type === 'vip').length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 overflow-hidden"
          >
            <motion.div
              animate={{
                x: [0, -1 * ((bannerAds.length + listings.filter(l => l.listing_type === 'vip').slice(0, 5).length) * 320)]
              }}
              transition={{
                duration: (bannerAds.length + listings.filter(l => l.listing_type === 'vip').slice(0, 5).length) * 5,
                repeat: Infinity,
                ease: "linear"
              }}
              className="flex gap-4"
            >
              {[...bannerAds, ...listings.filter(l => l.listing_type === 'vip').slice(0, 5), ...bannerAds, ...listings.filter(l => l.listing_type === 'vip').slice(0, 5)].map((item, idx) => (
                item.image_url ? (
                  <Banner 
                    key={`banner-${idx}`}
                    imageUrl={item.image_url}
                    title={item.title}
                    link={item.link || '#'}
                    className="w-[300px] h-[160px] flex-shrink-0"
                  />
                ) : (
                  <Link 
                    key={`vip-${idx}`}
                    to={createPageUrl(`ListingDetail?id=${item.id}`)}
                    className="w-[300px] flex-shrink-0"
                  >
                    <div className="relative h-[160px] rounded-2xl overflow-hidden group">
                      <img 
                        src={item.images?.[0] || 'https://via.placeholder.com/400x200'} 
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                          VIP
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="font-bold text-lg mb-1 line-clamp-1">{item.title}</h3>
                        <p className="text-xl font-bold">{item.price?.toLocaleString()}₩</p>
                      </div>
                    </div>
                  </Link>
                )
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* Featured/VIP Listings Carousel */}
        {listings.filter(l => l.listing_type === 'featured' || l.listing_type === 'vip').length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-bold text-gray-900">Онцлох зарууд</h2>
            </div>
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex gap-4 pb-2">
                {listings
                  .filter(l => l.listing_type === 'featured' || l.listing_type === 'vip')
                  .slice(0, 10)
                  .map((listing) => (
                    <FeaturedListingCard key={listing.id} listing={listing} />
                  ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Listings */}
        <section ref={listingsRef}>
        <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-amber-500" />
        <h2 className="text-2xl font-bold text-gray-900">
        {filters.category 
          ? `${categoryInfo[filters.category]?.name || 'Зар'} (${listings.length})`
          : filters.search 
            ? `"${filters.search}" хайлтын үр дүн (${listings.length})`
            : `Сүүлийн зарууд`
        }
        </h2>
        </div>
        {isAuthenticated ? (
          <Link to={createPageUrl('CreateListing')}>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-12 px-6">
              <Plus className="w-5 h-5 mr-2" />
              Зар нэмэх
            </Button>
          </Link>
        ) : (
          <Link to={createPageUrl('Login')}>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-12 px-6">
              <Plus className="w-5 h-5 mr-2" />
              Зар нэмэх
            </Button>
          </Link>
        )}
        </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {listings.slice(0, 8).map((listing, index) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                  >
                    <ListingCard listing={listing} />
                  </motion.div>
                ))}
              </div>

              {listings.length > 8 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {listings.slice(8).map((listing, index) => (
                    <motion.div
                      key={listing.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * index }}
                    >
                      <ListingCard listing={listing} />
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Зар олдсонгүй</h3>
                <p className="text-gray-500 mb-6">Шүүлтүүрээ өөрчилж үзнэ үү</p>
                {isAuthenticated ? (
                  <Link to={createPageUrl('CreateListing')}>
                    <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                      <Plus className="w-5 h-5 mr-2" />
                      Эхний зараа нэмэх
                    </Button>
                  </Link>
                ) : (
                  <Link to={createPageUrl('Login')}>
                    <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                      <Plus className="w-5 h-5 mr-2" />
                      Эхний зараа нэмэх
                    </Button>
                  </Link>
                )}
            </motion.div>
          )}
        </section>
      </div>





      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={scrollToTop}
            className="fixed bottom-24 right-6 z-50 w-12 h-12 rounded-full bg-gray-900 hover:bg-gray-800 text-white shadow-lg flex items-center justify-center md:w-14 md:h-14"
          >
            <ArrowUp className="w-5 h-5 md:w-6 md:h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Түгээмэл асуулт хариулт Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-amber-600 flex items-center gap-2">
              <HelpCircle className="w-6 h-6" />
              Түгээмэл асуулт хариулт
            </DialogTitle>
            <DialogDescription className="text-gray-600 pt-2">
              Солонгос дах Монголчуудын нэгдсэн зарын сайт, Та Facebook-с хайж цаг заваа үрэх хэрэггүй таньд хэрэгтэй бүх зар энд байна
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {faqData.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <h3 className="font-semibold text-lg text-gray-900 mb-2 flex items-center gap-2">
                  <span className="bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  {faq.question}
                </h3>
                <div className="text-gray-700 whitespace-pre-line leading-relaxed pl-8">
                  {renderFormattedText(faq.answer)}
                </div>
              </motion.div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
