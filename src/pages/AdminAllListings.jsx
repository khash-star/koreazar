import React, { useState } from 'react';
import * as entities from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Eye, Trash2, Check, X, Star, Crown, Loader2, Search, ArrowUp, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { getListingImageUrl } from '@/utils/imageUrl';
import { categoryInfo } from '@/components/listings/CategoryCard';
import { formatDistanceToNow } from 'date-fns';
import { mn } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminAllListings() {
  const queryClient = useQueryClient();
  const { user, userData } = useAuth();
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['admin-all-listings'],
    queryFn: () => entities.Listing.list('-created_date', 500),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => entities.Listing.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-all-listings']);
      queryClient.invalidateQueries(['listings']);
      queryClient.invalidateQueries(['allListings']);
      setDeleteId(null);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => entities.Listing.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-all-listings']);
      queryClient.invalidateQueries(['listings']);
      queryClient.invalidateQueries(['allListings']);
    },
  });

  const updateTypeMutation = useMutation({
    mutationFn: ({ id, listing_type, listing_type_expires }) => 
      entities.Listing.update(id, { listing_type, listing_type_expires }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-all-listings']);
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

  const handleMakeFeatured = (id) => {
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    updateTypeMutation.mutate({ id, listing_type: 'featured', listing_type_expires: expires.toISOString() });
  };

  const handleMakeVIP = (id) => {
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    updateTypeMutation.mutate({ id, listing_type: 'vip', listing_type_expires: expires.toISOString() });
  };

  const handleRemoveVIP = (id) => {
    updateTypeMutation.mutate({ id, listing_type: 'regular', listing_type_expires: null });
  };

  const handleRemoveFeatured = (id) => {
    updateTypeMutation.mutate({ id, listing_type: 'regular', listing_type_expires: null });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredListings = listings.filter(l => 
    l.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.created_by?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    const listingsToExport = filteredListings.length > 0 ? filteredListings : listings;
    
    if (listingsToExport.length === 0) {
      alert('Экспортлох зар байхгүй байна.');
      return;
    }

    // CSV header
    const headers = [
      'ID',
      'Title',
      'Listing URL',
      'Category',
      'Subcategory',
      'Price',
      'Location',
      'Condition',
      'In Stock',
      'Listing Type',
      'Listing Type Expires',
      'Created By',
      'Created Date',
      'Views',
      'Image Links',
      'Phone',
      'Kakao ID',
      'WeChat ID',
      'WhatsApp',
      'Facebook',
      'Description'
    ];

    // CSV data rows
    const rows = listingsToExport.map(listing => {
      const createdDate = listing.created_date 
        ? new Date(listing.created_date).toLocaleString('mn-MN')
        : '';
      const expiresDate = listing.listing_type_expires
        ? new Date(listing.listing_type_expires).toLocaleString('mn-MN')
        : '';
      
      const imageLinks = listing.images && Array.isArray(listing.images)
        ? listing.images.map(img => typeof img === 'string' ? img : (img?.w800 || img?.w400 || img?.w150 || '')).filter(Boolean).join('; ')
        : '';
      
      const listingUrl = listing.id 
        ? `${window.location.origin}${createPageUrl(`ListingDetail?id=${listing.id}`)}`
        : '';
      
      return [
        listing.id || '',
        listing.title || '',
        listingUrl,
        listing.category || '',
        listing.subcategory || '',
        listing.price || '',
        listing.location || '',
        listing.condition || '',
        'in stock',
        listing.listing_type || 'regular',
        expiresDate,
        listing.created_by || '',
        createdDate,
        listing.views || 0,
        imageLinks,
        listing.phone || '',
        listing.kakao_id || '',
        listing.wechat_id || '',
        listing.whatsapp || '',
        listing.facebook || '',
        (listing.description || '').replace(/\n/g, ' ').replace(/,/g, ';')
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Escape commas and quotes in cell values
        const cellStr = String(cell || '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(','))
    ].join('\n');

    // Add BOM for Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const fileName = searchTerm 
      ? `бүх_зарууд_${searchTerm.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`
      : `бүх_зарууд_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isAdmin = userData?.role === 'admin' || user?.role === 'admin';
  
  if (!user || !isAdmin) {
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
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Бүх зарууд</h1>
              <p className="text-sm text-gray-500">{filteredListings.length} зар</p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleExportCSV}
              disabled={listings.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              CSV экспорт
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Зар эсвэл хэрэглэгч хайх..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredListings.map((listing) => (
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
                        src={getListingImageUrl(listing.images[0], 'w400')}
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
                        <h3 className="font-semibold text-gray-900 hover:text-amber-600 line-clamp-1">
                          {listing.title}
                        </h3>
                      </Link>
                      <div className="flex gap-1">
                        {listing.listing_type === 'vip' && (
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                            <Crown className="w-3 h-3 mr-1" />
                            VIP
                          </Badge>
                        )}
                        {listing.listing_type === 'featured' && (
                          <Badge className="bg-blue-600 text-white">
                            <Star className="w-3 h-3 mr-1" />
                            Онцгой
                          </Badge>
                        )}
                        {listing.status === 'pending' && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Хүлээгдэж байна
                          </Badge>
                        )}
                        {listing.status === 'active' && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Идэвхтэй
                          </Badge>
                        )}
                        {listing.status === 'rejected' && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            Татгалзсан
                          </Badge>
                        )}
                        {listing.status === 'sold' && (
                          <Badge variant="outline" className="bg-gray-100 text-gray-600">
                            Зарагдсан
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className="text-lg font-bold text-amber-600 mb-2">
                      ₩{new Intl.NumberFormat('ko-KR').format(listing.price)}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span>{categoryInfo[listing.category]?.name}</span>
                      <span>•</span>
                      <span>{listing.created_by}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(listing.created_date), { addSuffix: true, locale: mn })
                        .replace(/ойролцоогоор\s*/gi, '')
                        .replace(/өдрийн/gi, 'Ө')
                        .replace(/цагийн/gi, 'Ц')
                        .replace(/сарын/gi, 'С')}</span>
                      {listing.views > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {listing.views}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {listing.status === 'pending' && (
                        <>
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
                        </>
                      )}
                      
                      {listing.status === 'active' && (
                        <>
                          {listing.listing_type === 'regular' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMakeFeatured(listing.id)}
                                disabled={updateTypeMutation.isPending}
                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                              >
                                <Star className="w-4 h-4 mr-1" />
                                Онцгой болгох
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMakeVIP(listing.id)}
                                disabled={updateTypeMutation.isPending}
                                className="text-amber-600 border-amber-600 hover:bg-amber-50"
                              >
                                <Crown className="w-4 h-4 mr-1" />
                                VIP болгох
                              </Button>
                            </>
                          )}
                          {listing.listing_type === 'featured' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveFeatured(listing.id)}
                              disabled={updateTypeMutation.isPending}
                              className="text-gray-600 border-gray-400 hover:bg-gray-50"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Онцгой цуцлах
                            </Button>
                          )}
                          {listing.listing_type === 'vip' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveVIP(listing.id)}
                              disabled={updateTypeMutation.isPending}
                              className="text-gray-600 border-gray-400 hover:bg-gray-50"
                            >
                              <X className="w-4 h-4 mr-1" />
                              VIP цуцлах
                            </Button>
                          )}
                        </>
                      )}

                      <Link to={createPageUrl(`ListingDetail?id=${listing.id}`)}>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          Үзэх
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
              Энэ үйлдлийг буцаах боломжгүй. Зар бүрмösөн устах болно.
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