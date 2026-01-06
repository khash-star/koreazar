import React, { useState, useEffect, useRef } from 'react';
import * as entities from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, TrendingUp, Sparkles, ChevronRight, ArrowUp, ChevronLeft, ChevronRight as ChevronRightIcon, ChevronDown, Heart, LogIn, LogOut, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
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
import { logout } from '@/services/authService';

export default function Home() {
  const listingsRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const { user, userData } = useAuth();
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
      const ads = await entities.BannerAd.filter({ is_active: true }, '-order');
      return ads.length > 0 ? ads : [];
    }
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryFromUrl = urlParams.get('category') || '';
    const scrollTo = urlParams.get('scroll');
    
    setFilters(prev => ({
      ...prev,
      category: categoryFromUrl,
      subcategory: ''
    }));

    if (scrollTo === 'listings') {
      setTimeout(() => listingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }

    // Check if user has seen welcome modal
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, []);

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
      
      let results = await entities.Listing.filter(query, '-created_date', 100);
      
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
    queryFn: () => entities.Listing.filter({ status: 'active' }),
  });

  // Get saved listings for current user
  const { data: savedListings = [], isLoading: savedLoading } = useQuery({
    queryKey: ['savedListings', userData?.email || user?.email],
    queryFn: async () => {
      const email = userData?.email || user?.email;
      if (!email) return [];
      const saved = await entities.SavedListing.filter({ created_by: email }, '-created_date');
      return saved;
    },
    enabled: !!(userData?.email || user?.email)
  });

  // Get full listing data for saved listings
  const { data: savedListingsFull = [] } = useQuery({
    queryKey: ['savedListingsFull', savedListings.map(s => s.listing_id).join(',')],
    queryFn: async () => {
      if (savedListings.length === 0) return [];
      const listingIds = savedListings.map(s => s.listing_id);
      const allListingsData = await entities.Listing.filter({ status: 'active' });
      return allListingsData.filter(l => listingIds.includes(l.id));
    },
    enabled: savedListings.length > 0
  });

  const categoryCounts = allListings.reduce((acc, listing) => {
    acc[listing.category] = (acc[listing.category] || 0) + 1;
    return acc;
  }, {});

  const handleSearch = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white">
      <WelcomeModal isOpen={showWelcome} onClose={handleCloseWelcome} />
      
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-amber-600 to-orange-500 text-white py-3 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex-1 text-center">
            <h1 className="text-sm md:text-lg font-bold tracking-wide">
              🇲🇳 СОЛОНГОС ДАХ МОНГОЛЧУУДЫН ЗАРЫН НЭГДСЭН САЙТ 🇰🇷
            </h1>
          </div>
          {!(user || userData) ? (
            <Link to={createPageUrl('Login')} className="ml-4 flex-shrink-0 z-50">
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white hover:bg-white/90 text-amber-600 border-white font-semibold shadow-md whitespace-nowrap"
              >
                <LogIn className="w-4 h-4 mr-2" />
                <span>Нэвтрэх</span>
              </Button>
            </Link>
          ) : (
            <div className="ml-4 flex items-center gap-2 flex-shrink-0 z-50">
              <Link to={createPageUrl('Profile')}>
                <div className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-sm">
                    {(userData?.displayName || user?.displayName || userData?.email || user?.email || '?')[0]?.toUpperCase()}
                  </div>
                  <span className="text-white font-medium text-sm hidden md:block">
                    {userData?.displayName || user?.displayName || userData?.email?.split('@')[0] || user?.email?.split('@')[0] || 'Хэрэглэгч'}
                  </span>
                  <Settings className="w-4 h-4 text-white" />
                </div>
              </Link>
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  try {
                    await logout();
                    window.location.href = '/Home';
                  } catch (error) {
                    console.error('Logout error:', error);
                  }
                }}
                className="bg-white hover:bg-white/90 text-amber-600 border-white font-semibold shadow-md whitespace-nowrap"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">Гарах</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Hero Banner Grid */}
      <div className="bg-gray-900 py-3 md:py-6 mt-12 md:mt-14">
        <div className="max-w-7xl mx-auto px-4">
          {bannerAds.length > 0 ? (
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
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="relative h-[200px] md:h-[320px] rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center"
                >
                  <div className="text-center text-white/50">
                    <div className="text-4xl mb-2">📢</div>
                    <p className="text-sm">Баннер зар байршуулах</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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

        {/* Saved Listings Section - Only show if user is logged in and has saved listings */}
        {user && savedListingsFull.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                <h2 className="text-xl font-bold text-gray-900">Хадгалсан зарууд</h2>
                <span className="text-sm text-gray-500">({savedListingsFull.length})</span>
              </div>
              <Link to={createPageUrl('SavedListings')}>
                <Button variant="outline" size="sm" className="text-sm">
                  Бүгдийг харах
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex gap-4 pb-2">
                {savedListingsFull.slice(0, 10).map((listing) => (
                  <FeaturedListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </div>
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
        <Link to={createPageUrl('CreateListing')}>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-12 px-6">
        <Plus className="w-5 h-5 mr-2" />
        Зар нэмэх
        </Button>
        </Link>
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
                <Link to={createPageUrl('CreateListing')}>
                  <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                    <Plus className="w-5 h-5 mr-2" />
                    Эхний зараа нэмэх
                  </Button>
                </Link>
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
            className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 w-12 h-12 rounded-full bg-gray-900 hover:bg-gray-800 text-white shadow-lg flex items-center justify-center md:w-14 md:h-14"
          >
            <ArrowUp className="w-5 h-5 md:w-6 md:h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}