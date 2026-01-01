import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { MapPin, Clock, Eye, Heart, Crown, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { mn } from 'date-fns/locale';
import { categoryInfo } from './CategoryCard';
import { subcategoryConfig } from './subcategoryConfig';
import { redirectToLogin } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import { listSavedListings, createSavedListing, deleteSavedListing } from '@/services/conversationService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const conditionLabels = {
  new: 'Шинэ',
  like_new: 'Бараг шинэ',
  used: 'Хэрэглэсэн',
  for_parts: 'Сэлбэгт'
};

export default function ListingCard({ listing }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, userData, isAuthenticated } = useAuth();
  const info = categoryInfo[listing.category] || categoryInfo.other;
  const isVIP = listing.listing_type === 'vip';
  const isFeatured = listing.listing_type === 'featured';

  const userEmail = userData?.email || user?.email;

  const { data: savedListings = [] } = useQuery({
    queryKey: ['savedListings', userEmail],
    queryFn: () => listSavedListings({ created_by: userEmail }),
    enabled: !!userEmail
  });

  const isSaved = savedListings.some(s => s.listing_id === listing.id);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        const saved = savedListings.find(s => s.listing_id === listing.id);
        if (saved) {
          await deleteSavedListing(saved.id);
        }
      } else {
        if (!userEmail) {
          throw new Error('User email is required');
        }
        await createSavedListing({ 
          listing_id: listing.id,
          created_by: userEmail 
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedListings'] });
    }
  });

  const handleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated || !user) {
      redirectToLogin(window.location.href);
      return;
    }
    
    saveMutation.mutate();
  };

  const handleCardClick = () => {
    navigate(createPageUrl(`ListingDetail?id=${listing.id}`));
  };
  
  const getSubcategoryLabel = () => {
    if (!listing.subcategory || !listing.category) return null;
    const subcats = subcategoryConfig[listing.category] || [];
    const subcat = subcats.find(s => s.value === listing.subcategory);
    return subcat?.label;
  };
  
  const formatPrice = (price) => {
    if (!price) return 'Үнэ тохирно';
    return '₩' + new Intl.NumberFormat('ko-KR').format(price);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={handleCardClick}
      className={`rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group border-2 cursor-pointer ${
        isVIP
          ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-400'
          : isFeatured
          ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300'
          : 'bg-white border-gray-100'
      }`}
    >
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {listing.images && listing.images.length > 0 ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-gray-50 to-gray-100">
              {info.icon}
            </div>
          )}
          
          {isVIP && (
            <Badge className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg">
              <Crown className="w-3 h-3 mr-1" />
              VIP
            </Badge>
          )}
          
          {isFeatured && !isVIP && (
            <Badge className="absolute top-3 left-3 bg-blue-600 text-white border-0 shadow-lg">
              <Star className="w-3 h-3 mr-1" />
              Онцгой
            </Badge>
          )}
          
          {!isVIP && !isFeatured && listing.condition && listing.condition !== 'used' && (
            <Badge className="absolute top-3 left-3 bg-white/90 text-gray-900 backdrop-blur-sm">
              {conditionLabels[listing.condition]}
            </Badge>
          )}
          
          {listing.status === 'sold' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-xl">ЗАРАГДСАН</span>
            </div>
          )}

          <button
            onClick={handleSave}
            type="button"
            className={`absolute top-3 right-3 w-10 h-10 rounded-full backdrop-blur-sm transition-all flex items-center justify-center z-10 ${
              isSaved 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-white/90 hover:bg-white text-gray-700'
            }`}
            aria-label={isSaved ? 'Хадгалсан' : 'Хадгалах'}
          >
            <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-amber-600 transition-colors">
              {listing.title}
            </h3>
          </div>
          
          <p className="text-xl font-bold text-amber-600 mt-2">
            {formatPrice(listing.price)}
            {listing.is_negotiable && <span className="text-sm font-normal text-gray-500 ml-1">тохирно</span>}
          </p>
          
          {getSubcategoryLabel() && (
            <p className="text-sm text-gray-600 mt-2">
              {getSubcategoryLabel()}
            </p>
          )}
          
          <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
            {listing.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {listing.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDistanceToNow(new Date(listing.created_date), { addSuffix: true, locale: mn })}
            </span>
          </div>
          
          {listing.views > 0 && (
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
              <Eye className="w-3 h-3" />
              {listing.views} үзсэн
            </div>
          )}
        </div>
      </motion.div>
  );
}