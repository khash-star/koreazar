import React, { useState, useEffect } from 'react';
import * as entities from '@/api/entities';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Crown, Star, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

const LISTING_TYPES = {
  regular: {
    name: 'Энгийн зар',
    price: 0,
    duration: '∞',
    icon: '📌',
    color: 'from-gray-100 to-gray-200',
    features: ['Энгийн жагсаалтад харагдана']
  },
  featured: {
    name: 'Онцгой зар',
    price: 10000,
    duration: '7 хоног',
    icon: '⭐',
    color: 'from-blue-500 to-blue-600',
    features: [
      'Хайлтын үр дүнд дээд талд гарна',
      'Онцгой тэмдэг харагдана',
      '7 хоногийн турш идэвхтэй'
    ]
  },
  vip: {
    name: 'VIP зар',
    price: 30000,
    duration: '7 хоног',
    icon: '👑',
    color: 'from-amber-500 to-amber-600',
    features: [
      'Хамгийн дээд талд байрлана',
      'VIP тэмдэг болон золтой дизайн',
      'Илүү их харагдах боломж',
      '7 хоногийн турш идэвхтэй'
    ]
  }
};

export default function UpgradeListing() {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const isAdmin = userData?.role === 'admin' || user?.role === 'admin';
  const [listingId, setListingId] = useState(null);

  const canApplyListingType = (typeKey) => typeKey === 'regular' || isAdmin;

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setListingId(urlParams.get('id'));
  }, []);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: async () => {
      const listings = await entities.Listing.filter({ id: listingId });
      return listings[0];
    },
    enabled: !!listingId
  });

  const upgradeMutation = useMutation({
    mutationFn: async (type) => {
      const expiresDate = new Date();
      expiresDate.setDate(expiresDate.getDate() + 7);
      
      return entities.Listing.update(listingId, {
        listing_type: type,
        listing_type_expires: type === 'regular' ? null : expiresDate.toISOString()
      });
    },
    onSuccess: () => {
      navigate(createPageUrl(`ListingDetail?id=${listingId}`));
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Зар олдсонгүй</h2>
          <Link to={createPageUrl('MyListings')}>
            <Button className="bg-amber-600 hover:bg-amber-700">
              Миний зар руу буцах
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to={createPageUrl('MyListings')}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Зар сайжруулах</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Current Listing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm mb-8"
        >
          <h2 className="text-sm text-gray-500 mb-2">Сонгогдсон зар</h2>
          <h3 className="text-xl font-bold text-gray-900">{listing.title}</h3>
          <p className="text-amber-600 font-semibold mt-2">
            ₩{new Intl.NumberFormat('ko-KR').format(listing.price)}
          </p>
          {listing.listing_type !== 'regular' && (
            <Badge className="mt-3 bg-blue-100 text-blue-700">
              Одоогийн төлөв: {LISTING_TYPES[listing.listing_type]?.name}
            </Badge>
          )}
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {Object.entries(LISTING_TYPES).map(([key, type], index) => {
            const isCurrentType = listing.listing_type === key;
            
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-2xl p-6 border-2 transition-all ${
                  key === 'vip'
                    ? 'border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50'
                    : key === 'featured'
                    ? 'border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {key === 'vip' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                      🔥 Хамгийн алдартай
                    </Badge>
                  </div>
                )}

                <div className="text-center mb-6">
                  <span className="text-5xl mb-3 block">{type.icon}</span>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{type.name}</h3>
                  {type.price > 0 ? (
                    <>
                      <div className="text-3xl font-bold text-gray-900">
                        ₩{new Intl.NumberFormat('ko-KR').format(type.price)}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{type.duration}</p>
                    </>
                  ) : (
                    <div className="text-2xl font-bold text-gray-600">Үнэгүй</div>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {type.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => upgradeMutation.mutate(key)}
                  disabled={isCurrentType || upgradeMutation.isPending}
                  className={`w-full h-12 rounded-xl font-semibold ${
                    key === 'vip'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
                      : key === 'featured'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {upgradeMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Уншиж байна...
                    </>
                  ) : isCurrentType ? (
                    <>Одоогийн төлөв</>
                  ) : !canApplyListingType(key) ? (
                    <>Зөвхөн админ</>
                  ) : (
                    <>
                      {key === 'vip' && <Crown className="w-5 h-5 mr-2" />}
                      {key === 'featured' && <Star className="w-5 h-5 mr-2" />}
                      {type.price > 0 ? 'Сонгох' : 'Буцах'}
                    </>
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-200"
        >
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span className="text-xl">💡</span>
            Зөвлөмж
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• VIP болон Онцгой зарууд илүү олон хүмүүст харагдана</li>
            <li>• 7 хоногийн дараа зар автоматаар энгийн төлөвт шилжинэ</li>
            <li>• Та дахин сайжруулж болно</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}