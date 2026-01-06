import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowLeft, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ListingCard from '@/components/listings/ListingCard';
import { useAuth } from '@/contexts/AuthContext';
import { redirectToLogin } from '@/services/authService';

export default function SavedListings() {
  const queryClient = useQueryClient();
  const { user, userData } = useAuth();
  const [isAuthChecking, setIsAuthChecking] = useState(false);

  const { data: savedListings = [], isLoading: savedLoading } = useQuery({
    queryKey: ['savedListings', user?.email],
    queryFn: () => base44.entities.SavedListing.filter({ created_by: userData?.email || user?.email }, '-created_date'),
    enabled: !!(userData?.email || user?.email)
  });

  const { data: allListings = [], isLoading: listingsLoading } = useQuery({
    queryKey: ['listings'],
    queryFn: () => base44.entities.Listing.list(),
    enabled: savedListings.length > 0
  });

  const listings = savedListings
    .map(saved => allListings.find(l => l.id === saved.listing_id))
    .filter(Boolean);

  const unsaveMutation = useMutation({
    mutationFn: (listingId) => {
      const saved = savedListings.find(s => s.listing_id === listingId);
      return base44.entities.SavedListing.delete(saved.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedListings'] });
    }
  });

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user && !userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Нэвтрэх шаардлагатай</h2>
          <p className="text-gray-500 mb-6">Хадгалсан зарыг харахын тулд нэвтэрнэ үү</p>
          <Button
            onClick={() => redirectToLogin()}
            className="bg-amber-500 hover:bg-amber-600"
          >
            Нэвтрэх
          </Button>
        </div>
      </div>
    );
  }

  const isLoading = savedLoading || listingsLoading;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl('Home')}>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Heart className="w-6 h-6 text-red-500 fill-current" />
                  Хадгалсан зарууд
                </h1>
                <p className="text-gray-500 mt-1">Нийт {listings.length} зар</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {listings.map((listing, index) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ListingCard listing={listing} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Heart className="w-20 h-20 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Хадгалсан зар байхгүй байна</h3>
            <p className="text-gray-500 mb-6">Таалагдсан зараа хадгалж эхэлцгээе</p>
            <Link to={createPageUrl('Home')}>
              <Button className="bg-amber-500 hover:bg-amber-600">
                Зар үзэх
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}