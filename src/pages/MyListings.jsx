import React, { useState, useEffect } from 'react';
import * as entities from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { getListingImageUrl } from '@/utils/imageUrl';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Eye, MoreVertical, CheckCircle, XCircle, AlertCircle, Settings, ArrowUp, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { categoryInfo } from '@/components/listings/CategoryCard';
import { useAuth } from '@/contexts/AuthContext';
import { redirectToLogin } from '@/services/authService';

const statusLabels = {
  active: { label: 'Идэвхтэй', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  sold: { label: 'Зарагдсан', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  expired: { label: 'Хугацаа дууссан', color: 'bg-gray-100 text-gray-700', icon: XCircle }
};

export default function MyListings() {
  const queryClient = useQueryClient();
  const { user, userData } = useAuth();
  const [deleteId, setDeleteId] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (!user && !userData) {
        setIsAuthChecking(true);
        await redirectToLogin();
      }
    };
    checkAuth();
  }, [user, userData]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['myListings', user?.email],
    queryFn: () => entities.Listing.filter({ created_by: userData?.email || user?.email }, '-created_date'),
    enabled: !!user?.email
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => entities.Listing.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['allListings'] });
      queryClient.invalidateQueries({ queryKey: ['similarListings'] });
      setDeleteId(null);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => entities.Listing.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['allListings'] });
      queryClient.invalidateQueries({ queryKey: ['listing'] });
      queryClient.invalidateQueries({ queryKey: ['similarListings'] });
    }
  });

  const formatPrice = (price) => {
    if (!price) return 'Үнэ тохирно';
    return '₩' + new Intl.NumberFormat('ko-KR').format(price);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
          <p className="text-gray-500 mb-6">Зараа удирдахын тулд нэвтэрнэ үү</p>
          <Button
            onClick={() => redirectToLogin()}
            className="bg-amber-600 hover:bg-amber-700"
          >
            Нэвтрэх
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl('Home')}>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Миний зарууд</h1>
                <p className="text-gray-500 mt-1">Нийт {listings.length} зар</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Link to={createPageUrl('CreateListing')}>
                <Button className="w-full bg-amber-600 hover:bg-amber-700">
                  <Plus className="w-5 h-5 mr-2" />
                  Зар нэмэх
                </Button>
              </Link>
              <Link to={createPageUrl('RequestBannerAd')}>
                <Button className="w-full bg-amber-600 hover:bg-amber-700">
                  <span className="text-lg mr-2">+</span>
                  Баннер
                </Button>
              </Link>
              {user?.role === 'admin' && (
                <Link to={createPageUrl('AdminBanners')}>
                  <Button variant="outline" className="w-full">
                    <Settings className="w-5 h-5 mr-2" />
                    Баннер удирдах
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 flex gap-4">
                <Skeleton className="w-24 h-24 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="space-y-4">
            <AnimatePresence>
              {listings.map((listing, index) => {
                const info = categoryInfo[listing.category] || categoryInfo.other;
                const status = statusLabels[listing.status] || statusLabels.active;
                const StatusIcon = status.icon;

                return (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-xl p-4 shadow-sm flex gap-4"
                  >
                    <Link to={createPageUrl(`ListingDetail?id=${listing.id}`)} className="flex-shrink-0">
                      {listing.images && listing.images.length > 0 ? (
                        <img
                          src={getListingImageUrl(listing.images[0], 'w150')}
                          alt={listing.title || 'Зар'}
                          loading="lazy"
                          decoding="async"
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-3xl">
                          {info.icon}
                        </div>
                      )}
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                        <Link to={createPageUrl(`ListingDetail?id=${listing.id}`)} className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 truncate hover:text-amber-600 transition-colors">
                            {listing.title}
                          </h3>
                        </Link>
                        <div className="flex flex-shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                          <Link to={createPageUrl(`EditListing?id=${listing.id}`)}>
                            <Button variant="outline" size="sm" className="h-9 border-amber-200 text-amber-800 hover:bg-amber-50">
                              <Edit2 className="w-4 h-4 mr-1.5" />
                              Засах
                            </Button>
                          </Link>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteId(listing.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1.5" />
                            Устгах
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" title="Бусад">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={createPageUrl(`ListingDetail?id=${listing.id}`)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Харах
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={createPageUrl(`UpgradeListing?id=${listing.id}`)}>
                                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                  </svg>
                                  {userData?.role === 'admin' || user?.role === 'admin' ? 'VIP болгох' : 'VIP хүсэлт'}
                                </Link>
                              </DropdownMenuItem>
                              {listing.status === 'sold' && (
                                <DropdownMenuItem
                                  onClick={() => updateStatusMutation.mutate({ id: listing.id, status: 'active' })}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Идэвхжүүлэх
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <p className="text-lg font-bold text-amber-600 mt-1">
                        {formatPrice(listing.price)}
                      </p>

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge className={status.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {listing.views || 0}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Танд зар байхгүй байна</h3>
            <p className="text-gray-500 mb-6">Эхний зараа нэмээрэй</p>
            <Link to={createPageUrl('CreateListing')}>
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Plus className="w-5 h-5 mr-2" />
                Зар нэмэх
              </Button>
            </Link>
          </motion.div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Зар устгах</AlertDialogTitle>
            <AlertDialogDescription>
              Та энэ зарыг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Болих</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Устгах
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-gray-900 hover:bg-gray-800 text-white shadow-lg flex items-center justify-center md:w-14 md:h-14"
          >
            <ArrowUp className="w-5 h-5 md:w-6 md:h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
