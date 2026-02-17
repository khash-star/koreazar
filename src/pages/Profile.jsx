import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserData, redirectToLogin } from '@/services/authService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { getListingImageUrl } from '@/utils/imageUrl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, Save, Loader2, User, FileText, Plus, Edit2, Trash2, Eye, MoreVertical, CheckCircle, XCircle } from 'lucide-react';
import * as entities from '@/api/entities';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { categoryInfo } from '@/components/listings/CategoryCard';
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

const statusLabels = {
  active: { label: 'Идэвхтэй', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  pending: { label: 'Хүлээгдэж', color: 'bg-yellow-100 text-yellow-700', icon: XCircle },
  sold: { label: 'Зарагдсан', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  rejected: { label: 'Татгалзсан', color: 'bg-red-100 text-red-700', icon: XCircle },
  expired: { label: 'Хугацаа дууссан', color: 'bg-gray-100 text-gray-700', icon: XCircle }
};

export default function Profile() {
  const { user, userData, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    kakao_id: '',
    wechat_id: '',
    whatsapp: '',
    facebook: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  
  // Fetch user's listings
  const { data: listings = [], isLoading: listingsLoading } = useQuery({
    queryKey: ['myListings', user?.email],
    queryFn: () => entities.Listing.filter({ created_by: userData?.email || user?.email }, '-created_date'),
    enabled: !!(userData?.email || user?.email)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => entities.Listing.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
      setDeleteId(null);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => entities.Listing.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
    }
  });

  const formatPrice = (price) => {
    if (!price) return 'Үнэ тохирно';
    return '₩' + new Intl.NumberFormat('ko-KR').format(price);
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      redirectToLogin(window.location.href);
      return;
    }

    // Load user data into form
    if (userData) {
      setFormData({
        displayName: userData.displayName || '',
        phone: userData.phone || '',
        kakao_id: userData.kakao_id || '',
        wechat_id: userData.wechat_id || '',
        whatsapp: userData.whatsapp || '',
        facebook: userData.facebook || ''
      });
    }
  }, [userData, isAuthenticated, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      if (!user?.uid) throw new Error('Хэрэглэгч олдсонгүй');
      return await updateUserData(user.uid, data);
    },
    onSuccess: () => {
      setSuccess('Мэдээлэл амжилттай шинэчлэгдлээ.');
      // Invalidate user data queries to refresh
      queryClient.invalidateQueries(['user', user?.uid]);
      queryClient.invalidateQueries(['userData']);
      // Navigate to home page after a short delay
      setTimeout(() => {
        navigate(createPageUrl('Home'));
      }, 1500);
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      setError(error.message || 'Мэдээлэл шинэчлэхэд алдаа гарлаа. Дахин оролдоно уу.');
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate phone if provided
    if (formData.phone && formData.phone.trim()) {
      const phoneDigits = formData.phone.replace(/[\s\-\(\)\+]/g, '');
      if (!/^\d+$/.test(phoneDigits)) {
        setError('Утасны дугаар зөвхөн тоо байх ёстой.');
        return;
      }
      if (phoneDigits.length < 8 || phoneDigits.length > 11) {
        setError('Утасны дугаар 8-11 оронтой байх ёстой.');
        return;
      }
    }

    updateMutation.mutate({
      displayName: formData.displayName.trim() || null,
      phone: formData.phone.trim() || '',
      kakao_id: formData.kakao_id.trim() || '',
      wechat_id: formData.wechat_id.trim() || '',
      whatsapp: formData.whatsapp.trim() || '',
      facebook: formData.facebook.trim() || ''
    });
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4" />
          <p className="text-gray-600">Уншиж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Профайл</h1>
              <p className="text-sm text-gray-500">Мэдээллийг засах</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Мэдээлэл
            </TabsTrigger>
            <TabsTrigger value="listings" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Миний зар ({listings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Хувийн мэдээлэл</CardTitle>
                <CardDescription>
                  Өөрийн мэдээллийг засварлаж болно
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  {success && (
                    <Alert className="bg-green-50 border-green-200">
                      <AlertDescription className="text-green-800">{success}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Имэйл</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userData?.email || user?.email || ''}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500">Имэйл хаягийг засах боломжгүй</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="displayName">Нэр</Label>
                    <Input
                      id="displayName"
                      name="displayName"
                      type="text"
                      value={formData.displayName}
                      onChange={handleChange}
                      placeholder="Таны нэр"
                      autoComplete="name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Утасны дугаар</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="01012345678 (8-11 орон)"
                      autoComplete="tel"
                    />
                    <p className="text-xs text-gray-500">8-11 оронтой тоо</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kakao_id">Kakao ID</Label>
                    <Input
                      id="kakao_id"
                      name="kakao_id"
                      type="text"
                      value={formData.kakao_id}
                      onChange={handleChange}
                      placeholder="Kakao ID"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wechat_id">WeChat ID</Label>
                    <Input
                      id="wechat_id"
                      name="wechat_id"
                      type="text"
                      value={formData.wechat_id}
                      onChange={handleChange}
                      placeholder="WeChat ID"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      name="whatsapp"
                      type="text"
                      value={formData.whatsapp}
                      onChange={handleChange}
                      placeholder="WhatsApp дугаар"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      name="facebook"
                      type="text"
                      value={formData.facebook}
                      onChange={handleChange}
                      placeholder="Facebook хаяг"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Хадгалж байна...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Хадгалах
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="listings">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Миний зарууд</h2>
                <p className="text-sm text-gray-500 mt-1">Нийт {listings.length} зар</p>
              </div>
              <Link to={createPageUrl('CreateListing')}>
                <Button className="bg-amber-500 hover:bg-amber-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Зар нэмэх
                </Button>
              </Link>
            </div>

            {listingsLoading ? (
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
                          <div className="flex items-start justify-between gap-2">
                            <Link to={createPageUrl(`ListingDetail?id=${listing.id}`)} className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate hover:text-amber-600 transition-colors">
                                {listing.title}
                              </h3>
                            </Link>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="flex-shrink-0 h-8 w-8">
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
                                  <Link to={createPageUrl(`EditListing?id=${listing.id}`)}>
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Засах
                                  </Link>
                                </DropdownMenuItem>
                                {listing.status === 'active' && (
                                  <DropdownMenuItem
                                    onClick={() => updateStatusMutation.mutate({ id: listing.id, status: 'sold' })}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Зарагдсан гэж тэмдэглэх
                                  </DropdownMenuItem>
                                )}
                                {listing.status === 'sold' && (
                                  <DropdownMenuItem
                                    onClick={() => updateStatusMutation.mutate({ id: listing.id, status: 'active' })}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Идэвхжүүлэх
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => setDeleteId(listing.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Устгах
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <p className="text-xl font-bold text-amber-600 mt-2">
                            {formatPrice(listing.price)}
                          </p>

                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={status.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {status.label}
                            </Badge>
                            {listing.location && (
                              <span className="text-sm text-gray-500">{listing.location}</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Зар байхгүй байна</h3>
                <p className="text-gray-500 mb-6">Анхны зараа нэмж эхэлцгээе</p>
                <Link to={createPageUrl('CreateListing')}>
                  <Button className="bg-amber-500 hover:bg-amber-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Зар нэмэх
                  </Button>
                </Link>
              </div>
            )}

            <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Зар устгах уу?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Энэ үйлдлийг буцаах боломжгүй. Зар бүрмөсөн устгагдана.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Цуцлах</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate(deleteId)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Устгах
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
