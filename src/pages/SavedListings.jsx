import React, { useState, useEffect } from 'react';
import { redirectToLogin } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import { listSavedListings, deleteSavedListing } from '@/services/conversationService';
import { filterListings } from '@/services/listingService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowLeft, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ListingCard from '@/components/listings/ListingCard';

export default function SavedListings() {
  const queryClient = useQueryClient();
  const { user, userData, loading: isAuthChecking, isAuthenticated } = useAuth();
  const userEmail = userData?.email || user?.email;

  // Check authentication
  useEffect(() => {
    if (isAuthChecking) return; // Wait for auth to load
    
    if (!isAuthenticated || !user) {
      redirectToLogin(window.location.href);
    }
  }, [isAuthChecking, isAuthenticated, user]);

  const { data: savedListings = [], isLoading: savedLoading } = useQuery({
    queryKey: ['savedListings', userEmail],
    queryFn: () => listSavedListings({ created_by: userEmail }),
    enabled: !!userEmail
  });

  const listingIds = savedListings.map(s => s.listing_id);
  
  const { data: allListings = [], isLoading: listingsLoading } = useQuery({
    queryKey: ['listings'],
    queryFn: async () => {
      if (listingIds.length === 0) return [];
      // Firestore 'in' query can only handle up to 10 items, so we'll fetch all and filter
      const all = await filterListings({ status: 'active' }, '-created_date', 1000);
      return all.filter(l => listingIds.includes(l.id));
    },
    enabled: listingIds.length > 0
  });

  const listings = savedListings
    .map(saved => allListings.find(l => l.id === saved.listing_id))
    .filter(Boolean);

  const unsaveMutation = useMutation({
    mutationFn: (listingId) => {
      const saved = savedListings.find(s => s.listing_id === listingId);
      return deleteSavedListing(saved.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedListings'] });
    }
  });

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4" />
          <p className="text-gray-600">Уншиж байна...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // Don't render - redirect will happen in useEffect
    return null;
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