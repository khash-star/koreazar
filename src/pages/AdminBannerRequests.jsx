import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminBannerRequests() {
  const { user, userData } = useAuth();
  const [deleteId, setDeleteId] = useState(null);
  const [activeDialog, setActiveDialog] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['bannerRequests'],
    queryFn: () => base44.entities.BannerRequest.list('-created_date')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BannerRequest.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bannerRequests'] });
      setDeleteId(null);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, note }) => 
      base44.entities.BannerRequest.update(id, { 
        status, 
        admin_note: note || undefined 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bannerRequests'] });
      setActiveDialog(null);
      setAdminNote('');
    }
  });

  const approveMutation = useMutation({
    mutationFn: async ({ request }) => {
      // Create banner ad
      await base44.entities.BannerAd.create({
        image_url: request.image_url,
        link: request.link,
        title: request.title,
        is_active: true,
        order: 0
      });
      // Update request status
      await base44.entities.BannerRequest.update(request.id, { 
        status: 'approved',
        admin_note: adminNote || 'Баннер зар идэвхжүүлэгдлээ'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bannerRequests'] });
      queryClient.invalidateQueries({ queryKey: ['bannerAds'] });
      setActiveDialog(null);
      setAdminNote('');
    }
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4" />
          <p className="text-gray-600">Уншиж байна...</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Хандах эрхгүй</h2>
          <p className="text-gray-600 mb-4">Зөвхөн админ энэ хуудсыг үзэх боломжтой</p>
          <Link to={createPageUrl('Home')}>
            <Button>Нүүр хуудас руу буцах</Button>
          </Link>
        </div>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('AdminPanel')}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Баннер зарын хүсэлтүүд</h1>
              <p className="text-sm text-gray-500">
                Хүлээгдэж байгаа: {pendingRequests.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Хүсэлт байхгүй байна</h3>
            <p className="text-gray-500">Баннер зарын хүсэлтүүд энд харагдана</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Хүлээгдэж байгаа хүсэлтүүд
                </h2>
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl p-6 shadow-sm"
                    >
                      <div className="flex gap-6">
                        <img
                          src={request.image_url}
                          alt={request.title}
                          className="w-48 h-32 object-cover rounded-lg flex-shrink-0"
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900">
                                {request.title}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {request.created_by} • {new Date(request.created_date).toLocaleDateString('mn-MN')}
                              </p>
                              {request.link && (
                                <a 
                                  href={request.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-2"
                                >
                                  {request.link}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                              {request.message && (
                                <p className="text-sm text-gray-600 mt-3 bg-gray-50 p-3 rounded-lg">
                                  {request.message}
                                </p>
                              )}
                            </div>
                            <Badge className="bg-yellow-100 text-yellow-800">
                              Хүлээгдэж байна
                            </Badge>
                          </div>

                          <div className="flex gap-2 mt-4">
                            <Button
                              onClick={() => {
                                setActiveDialog(request.id);
                                setAdminNote('');
                              }}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Батлах
                            </Button>
                            <Button
                              onClick={() => updateStatusMutation.mutate({ 
                                id: request.id, 
                                status: 'rejected',
                                note: 'Баннер зар шаардлага хангахгүй байна'
                              })}
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Татгалзах
                            </Button>
                            <Button
                              onClick={() => setDeleteId(request.id)}
                              variant="ghost"
                              className="text-gray-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Approve Dialog */}
                      <Dialog open={activeDialog === request.id} onOpenChange={(open) => !open && setActiveDialog(null)}>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Баннер зар батлах</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p className="text-sm text-gray-600">
                              Энэ баннер зар нүүр хуудсанд идэвхжинэ. Хэрэглэгчид мэдэгдэл илгээх үү?
                            </p>
                            <Textarea
                              value={adminNote}
                              onChange={(e) => setAdminNote(e.target.value)}
                              placeholder="Админы тэмдэглэл (заавал биш)"
                              className="min-h-[80px]"
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={() => approveMutation.mutate({ request })}
                                disabled={approveMutation.isPending}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                Батлах
                              </Button>
                              <Button
                                onClick={() => setActiveDialog(null)}
                                variant="outline"
                                className="flex-1"
                              >
                                Болих
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Processed Requests */}
            {processedRequests.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Шийдвэрлэсэн хүсэлтүүд
                </h2>
                <div className="space-y-4">
                  {processedRequests.map((request) => (
                    <div key={request.id} className="bg-white rounded-xl p-6 shadow-sm opacity-60">
                      <div className="flex gap-6">
                        <img
                          src={request.image_url}
                          alt={request.title}
                          className="w-32 h-20 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900">{request.title}</h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {request.created_by}
                              </p>
                            </div>
                            <Badge className={
                              request.status === 'approved' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }>
                              {request.status === 'approved' ? 'Батлагдсан' : 'Татгалзсан'}
                            </Badge>
                          </div>
                          {request.admin_note && (
                            <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                              <strong>Тэмдэглэл:</strong> {request.admin_note}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Хүсэлт устгах уу?</AlertDialogTitle>
            <AlertDialogDescription>
              Энэ үйлдлийг буцаах боломжгүй.
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
    </div>
  );
}