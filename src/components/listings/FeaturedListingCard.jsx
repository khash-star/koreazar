import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { getListingImageUrl, getListingImageSrcSet } from '@/utils/imageUrl';
import { convertTimestamp } from '@/utils/firestoreDates';
import { MapPin, Clock, Sparkles, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { mn } from 'date-fns/locale';

export default function FeaturedListingCard({ listing }) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getBadge = () => {
    if (listing.listing_type === 'vip') {
      return { icon: Star, text: 'VIP', color: 'bg-gradient-to-r from-purple-600 to-pink-600' };
    }
    if (listing.listing_type === 'featured') {
      return { icon: Sparkles, text: 'Онцгой', color: 'bg-gradient-to-r from-blue-600 to-cyan-600' };
    }
    return null;
  };

  const badge = getBadge();
  const BadgeIcon = badge?.icon;

  return (
    <Link to={createPageUrl(`ListingDetail?id=${listing.id}`)}>
      <motion.div
        whileHover={{ y: -4 }}
        className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all w-[280px] flex-shrink-0"
      >
        <div className="relative aspect-[3/2] overflow-hidden bg-gray-100">
          {listing.images?.[0] ? (
            <img
              src={getListingImageUrl(listing.images[0], 'w400')}
              srcSet={getListingImageSrcSet(listing.images[0]) || undefined}
              alt={listing.title || 'Зарын зураг'}
              width={400}
              height={267}
              loading="lazy"
              decoding="async"
              sizes="(max-width: 768px) 280px, 350px"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              📷
            </div>
          )}
          
          {badge && (
            <div className={`absolute top-3 left-3 ${badge.color} text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg`}>
              <BadgeIcon className="w-4 h-4" />
              <span className="text-xs font-semibold">{badge.text}</span>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-gray-900 text-base mb-2 line-clamp-1">
            {listing.title}
          </h3>
          
          <p className="text-amber-600 font-bold text-lg mb-3">
            {formatPrice(listing.price)}
            {listing.is_negotiable && (
              <span className="text-xs text-gray-500 ml-1 font-normal">тохирно</span>
            )}
          </p>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            {listing.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{listing.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDistanceToNow(new Date(convertTimestamp(listing.created_date) || Date.now()), { addSuffix: true, locale: mn })}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}