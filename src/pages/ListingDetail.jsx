import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { redirectToLogin } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import { getListing, updateListing } from '@/services/listingService';
import { listSavedListings, createSavedListing, deleteSavedListing } from '@/services/conversationService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { mn } from 'date-fns/locale';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Clock,
  Eye,
  Share2,
  ChevronLeft,
  ChevronRight,
  Tag,
  MessageCircle,
  Heart,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { categoryInfo } from '@/components/listings/CategoryCard';
import { subcategoryConfig } from '@/components/listings/subcategoryConfig';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const conditionLabels = {
  new: 'Шинэ',
  like_new: 'Бараг шинэ',
  used: 'Хэрэглэсэн',
  for_parts: 'Сэлбэгт'
};

export default function ListingDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const listingId = urlParams.get('id');
  const queryClient = useQueryClient();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const { user, userData } = useAuth();

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: async () => {
      if (!listingId) return null;
      return await getListing(listingId);
    },
    enabled: !!listingId,
    retry: false
  });

  const userEmail = userData?.email || user?.email;
  
  const { data: savedListings = [] } = useQuery({
    queryKey: ['savedListings', userEmail],
    queryFn: () => listSavedListings({ created_by: userEmail }),
    enabled: !!userEmail
  });

  const isSaved = savedListings.some(s => s.listing_id === listingId);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        const saved = savedListings.find(s => s.listing_id === listingId);
        if (saved) {
          await deleteSavedListing(saved.id);
        }
      } else {
        if (!userEmail) {
          throw new Error('User email is required');
        }
        await createSavedListing({ 
          listing_id: listingId,
          created_by: userEmail 
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedListings'] });
    },
    onError: (error) => {
      console.error('Error saving listing:', error);
      alert('Зар хадгалахад алдаа гарлаа. Дахин оролдоно уу.');
    }
  });

  const handleSave = () => {
    if (!user && !userData) {
      redirectToLogin();
      return;
    }
    saveMutation.mutate();
  };

  // Update view count
  useEffect(() => {
    if (listing) {
      updateListing(listing.id, {
        views: (listing.views || 0) + 1
      }).catch(err => console.error('Error updating view count:', err));
    }
  }, [listing?.id]);

  const formatPrice = (price) => {
    if (!price) return 'Үнэ тохирно';
    return '₩' + new Intl.NumberFormat('ko-KR').format(price);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: listing?.title,
        url: window.location.href
      });
    } else {
      setShowShareDialog(true);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Skeleton className="h-8 w-48" />
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Skeleton className="aspect-[4/3] rounded-2xl w-full" />
          <div className="mt-6 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!isLoading && !listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Зар олдсонгүй</h2>
          <p className="text-gray-500 mb-4">
            {listingId ? `Listing ID: ${listingId}` : 'Listing ID байхгүй байна'}
          </p>
          {error && (
            <p className="text-red-500 text-sm mb-4">
              Алдаа: {error.message || 'Тодорхойгүй алдаа'}
            </p>
          )}
          <Link to={createPageUrl('Home')}>
            <Button className="mt-4">Нүүр хуудас руу буцах</Button>
          </Link>
        </div>
      </div>
    );
  }

  const info = categoryInfo[listing.category] || categoryInfo.other;
  const hasImages = listing.images && listing.images.length > 0;
  
  const getSubcategoryLabel = () => {
    if (!listing.subcategory || !listing.category) return null;
    const subcats = subcategoryConfig[listing.category] || [];
    const subcat = subcats.find(s => s.value === listing.subcategory);
    return subcat?.label;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={createPageUrl(`Home?category=${listing.category}&scroll=listings`)}>
            <Button variant="ghost" className="rounded-full gap-2">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Буцах</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`rounded-full ${isSaved ? 'text-red-500 hover:text-red-600' : ''}`}
              onClick={handleSave}
            >
              <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={handleShare}>
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Image Gallery */}
        <div className="relative bg-black">
          {hasImages ? (
            <div className="relative aspect-[4/3] md:aspect-[16/9]">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  src={listing.images[currentImageIndex]}
                  alt={listing.title}
                  className="w-full h-full object-contain"
                />
              </AnimatePresence>
              
              {listing.images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex(prev => prev === 0 ? listing.images.length - 1 : prev - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex(prev => prev === listing.images.length - 1 ? 0 : prev + 1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {listing.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentImageIndex ? 'bg-white w-6' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="aspect-[4/3] md:aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <span className="text-8xl">{info.icon}</span>
            </div>
          )}
          
          {listing.status === 'sold' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-bold text-3xl">ЗАРАГДСАН</span>
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {hasImages && listing.images.length > 1 && (
          <div className="bg-white px-4 py-3 flex gap-2 overflow-x-auto">
            {listing.images.map((url, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 ring-2 transition-all ${
                  index === currentImageIndex ? 'ring-amber-500' : 'ring-transparent'
                }`}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            {/* Category & Condition */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary" className="bg-gray-100">
                {info.icon} {info.name}
              </Badge>
              {getSubcategoryLabel() && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  {getSubcategoryLabel()}
                </Badge>
              )}
              {listing.condition && (
                <Badge variant="outline">
                  {conditionLabels[listing.condition]}
                </Badge>
              )}
              {listing.status === 'active' && (
                <Badge className="bg-green-100 text-green-700">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Идэвхтэй
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              {listing.title}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-3xl md:text-4xl font-bold text-amber-600">
                {formatPrice(listing.price)}
              </span>
              {listing.is_negotiable && (
                <span className="text-gray-500">тохирно</span>
              )}
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 pb-6 border-b">
              {listing.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {listing.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {listing.created_date ? format(
                  listing.created_date instanceof Date 
                    ? listing.created_date 
                    : new Date(listing.created_date), 
                  'yyyy.MM.dd', 
                  { locale: mn }
                ) : 'Тодорхойгүй'}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {listing.views || 0} үзсэн
              </span>
            </div>

            {/* Description */}
            {listing.description && (
              <div className="py-6 border-b">
                <h3 className="font-semibold text-gray-900 mb-3">Тайлбар</h3>
                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Contact Section */}
            <div className="pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Холбоо барих</h3>

              <div className="space-y-3">
                {listing.created_by !== userEmail && (
                  <Link to={createPageUrl(`Chat?otherUserEmail=${listing.created_by}&listingId=${listing.id}`)}>
                    <Button className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600">
                      <Mail className="w-5 h-5 mr-2" />
                      Мессеж илгээх
                    </Button>
                  </Link>
                )}
                {listing.phone && (
                  showPhone ? (
                    <a href={`tel:${listing.phone}`} className="block">
                      <Button className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700">
                        <Phone className="w-5 h-5 mr-2" />
                        {listing.phone}
                      </Button>
                    </a>
                  ) : (
                    <Button
                      onClick={() => setShowPhone(true)}
                      className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600"
                    >
                      <Phone className="w-5 h-5 mr-2" />
                      Утас харах
                    </Button>
                  )
                )}

                <div className="grid grid-cols-2 gap-3">
                  {listing.kakao_id && (
                    <a href={`https://open.kakao.com/o/${listing.kakao_id}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full h-11 rounded-lg">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        KakaoTalk
                      </Button>
                    </a>
                  )}

                  {listing.wechat_id && (
                    <Button variant="outline" className="w-full h-11 rounded-lg" onClick={() => {
                      navigator.clipboard.writeText(listing.wechat_id);
                      alert(`WeChat ID хуулагдлаа: ${listing.wechat_id}`);
                    }}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WeChat
                    </Button>
                  )}

                  {listing.whatsapp && (
                    <a href={`https://wa.me/${listing.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full h-11 rounded-lg">
                        <Send className="w-4 h-4 mr-2" />
                        WhatsApp
                      </Button>
                    </a>
                  )}

                  {listing.facebook && (
                    <a href={listing.facebook.includes('http') ? listing.facebook : `https://facebook.com/${listing.facebook}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full h-11 rounded-lg">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Facebook
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Fixed Bottom Bar (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 md:hidden">
        {listing.phone && (
          <div className="mb-2">
            {showPhone ? (
              <a href={`tel:${listing.phone}`}>
                <Button className="w-full h-11 rounded-xl bg-green-600 hover:bg-green-700">
                  <Phone className="w-5 h-5 mr-2" />
                  {listing.phone}
                </Button>
              </a>
            ) : (
              <Button
                onClick={() => setShowPhone(true)}
                className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-600"
              >
                <Phone className="w-5 h-5 mr-2" />
                Утас харах
              </Button>
            )}
          </div>
        )}
        
        <div className="grid grid-cols-4 gap-2">
          {listing.kakao_id && (
            <a href={`https://open.kakao.com/o/${listing.kakao_id}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="w-full">
                <MessageSquare className="w-4 h-4" />
              </Button>
            </a>
          )}
          {listing.wechat_id && (
            <Button variant="outline" size="sm" className="w-full" onClick={() => {
              navigator.clipboard.writeText(listing.wechat_id);
              alert(`WeChat ID хуулагдлаа: ${listing.wechat_id}`);
            }}>
              <MessageCircle className="w-4 h-4" />
            </Button>
          )}
          {listing.whatsapp && (
            <a href={`https://wa.me/${listing.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="w-full">
                <Send className="w-4 h-4" />
              </Button>
            </a>
          )}
          {listing.facebook && (
            <a href={listing.facebook.includes('http') ? listing.facebook : `https://facebook.com/${listing.facebook}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="w-full">
                <MessageCircle className="w-4 h-4" />
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Зар хуваалцах</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={window.location.href}
              className="flex-1 p-3 bg-gray-100 rounded-lg text-sm"
            />
            <Button onClick={copyToClipboard}>Хуулах</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}