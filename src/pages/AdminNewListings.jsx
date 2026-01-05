import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, Trash2, Check, X, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { formatDistanceToNow } from 'date-fns';
import { mn } from 'date-fns/locale';

export default function AdminNewListings() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['admin-new-listings'],
    queryFn: () => base44.entities.Listing.filter({ status: 'pending' }, '-created_date', 200),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Listing.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-new-listings']);
      queryClient.invalidateQueries(['listings']);
      queryClient.invalidateQueries(['allListings']);
      setDeleteId(null);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Listing.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-new-listings']);
      queryClient.invalidateQueries(['listings']);
      queryClient.invalidateQueries(['allListings']);
    },
  });

  const handleApprove = (id) => {
    updateStatusMutation.mutate({ id, status: 'active' });
  };

  const handleReject = (id) => {
    updateStatusMutation.mutate({ id, status: 'rejected' });
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Хандах эрхгүй</h1>
          <p className="text-gray-500 mb-4">Зөвхөн админ хэрэглэгч энэ хуудсыг үзэх боломжтой</p>
          <Link to={createPageUrl('Home')}>
            <Button>Нүүр хуудас руу буцах</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Шинэ зарууд</h1>
              <p className="text-sm text-gray-500">{listings.length} батлах хүлээгдэж буй зар</p>
            </div>
          </div>
          <Link to={createPageUrl('AdminAllListings')}>
            <Button variant="outline">Бүх зар үзэх</Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Шинэ зар байхгүй</h3>
            <p className="text-gray-500">Батлах хүлээгдэж буй зар одоогоор байхгүй байна</p>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex gap-4">
                  <Link to={createPageUrl(`ListingDetail?id=${listing.id}`)} className="flex-shrink-0">
                    {listing.images?.[0] ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center text-3xl">
                        {categoryInfo[listing.category]?.icon || '📦'}
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Link to={createPageUrl(`ListingDetail?id=${listing.id}`)}>
                        <h3 className="font-semibold text-gray-900 hover:text-amber-600 line-clamp-2">
                          {listing.title}
                        </h3>
                      </Link>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex-shrink-0">
                        <Clock className="w-3 h-3 mr-1" />
                        Хүлээгдэж байна
                      </Badge>
                    </div>

                    <p className="text-lg font-bold text-amber-600 mb-2">
                      ₩{new Intl.NumberFormat('ko-KR').format(listing.price)}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span>{categoryInfo[listing.category]?.name}</span>
                      <span>•</span>
                      <span>{listing.created_by}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(listing.created_date), { addSuffix: true, locale: mn })}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(listing.id)}
                        disabled={updateStatusMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Батлах
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(listing.id)}
                        disabled={updateStatusMutation.isPending}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Татгалзах
                      </Button>
                      <Link to={createPageUrl(`ListingDetail?id=${listing.id}`)}>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          Дэлгэрэнгүй
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteId(listing.id)}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Устгах
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Зар устгах уу?</AlertDialogTitle>
            <AlertDialogDescription>
              Энэ үйлдлийг буцаах боломжгүй. Зар бүрмөсөн устах болно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Болих</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Устгах
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}