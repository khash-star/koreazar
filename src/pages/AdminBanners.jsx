import React, { useState } from 'react';
import * as entities from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { compressImage } from '@/components/utils/imageCompressor';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Trash2, Upload, X, ArrowUp, ArrowDown, ArrowLeft, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminBanners() {
  const { user, userData } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    image_url: '',
    link: '#',
    title: '',
    is_active: true,
    order: 0
  });

  const queryClient = useQueryClient();

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['bannerAds'],
    queryFn: () => entities.BannerAd.list('-order')
  });

  const createMutation = useMutation({
    mutationFn: (data) => entities.BannerAd.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bannerAds'] });
      setShowDialog(false);
      setFormData({ image_url: '', link: '#', title: '', is_active: true, order: 0 });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => entities.BannerAd.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bannerAds'] });
      setShowDialog(false);
      setEditingBannerId(null);
      setFormData({ image_url: '', link: '#', title: '', is_active: true, order: 0 });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => entities.BannerAd.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bannerAds'] });
    }
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validFormats.includes(file.type)) {
      return;
    }
    setUploading(true);
    try {
      const compressed = await compressImage(file, 1200, 600, 0.8);
      const { file_url } = await UploadFile({ file: compressed });
      setFormData({ ...formData, image_url: file_url });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingBannerId) {
      updateMutation.mutate({ id: editingBannerId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openAddDialog = () => {
    setEditingBannerId(null);
    setFormData({ image_url: '', link: '#', title: '', is_active: true, order: 0 });
    setShowDialog(true);
  };

  const openEditDialog = (banner) => {
    setFormData({
      image_url: banner.image_url || '',
      link: banner.link || '#',
      title: banner.title || '',
      is_active: banner.is_active ?? true,
      order: banner.order ?? 0
    });
    setEditingBannerId(banner.id);
    setShowDialog(true);
  };

  const moveUp = (banner, index) => {
    if (index === 0) return;
    const prevBanner = banners[index - 1];
    updateMutation.mutate({ id: banner.id, data: { order: prevBanner.order } });
    updateMutation.mutate({ id: prevBanner.id, data: { order: banner.order } });
  };

  const moveDown = (banner, index) => {
    if (index === banners.length - 1) return;
    const nextBanner = banners[index + 1];
    updateMutation.mutate({ id: banner.id, data: { order: nextBanner.order } });
    updateMutation.mutate({ id: nextBanner.id, data: { order: banner.order } });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const isAdmin = userData?.role === 'admin' || user?.role === 'admin';
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Зөвхөн админ</h1>
          <p className="text-gray-500 mb-4">Та админ эрхгүй байна</p>
          <Link to={createPageUrl('Home')}>
            <Button>Нүүр хуудас руу буцах</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl('MyListings')}>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Баннер зарын удирдлага</h1>
                <p className="text-gray-500 mt-1">Нүүр хуудасны баннер зарыг удирдах</p>
              </div>
            </div>
            <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) setEditingBannerId(null); }}>
              <Button onClick={openAddDialog} className="bg-amber-500 hover:bg-amber-600">
                <Plus className="w-5 h-5 mr-2" />
                Баннер нэмэх
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingBannerId ? 'Баннер засах' : 'Шинэ баннер зар'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Зураг</Label>
                    {formData.image_url ? (
                      <div className="relative mt-2">
                        <img src={formData.image_url} alt="" className="w-full h-48 object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image_url: '' })}
                          className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center"
                        >
                          <X className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    ) : (
                      <label className="mt-2 block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-amber-400">
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        {uploading ? (
                          <Loader2 className="w-8 h-8 mx-auto animate-spin text-amber-500" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">Зураг оруулах</p>
                          </>
                        )}
                      </label>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="title">Нэр/Тайлбар</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Баннерын нэр"
                    />
                  </div>

                  <div>
                    <Label htmlFor="link">Холбоос</Label>
                    <Input
                      id="link"
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="order">Дарааллын дугаар</Label>
                    <Input
                      id="order"
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Идэвхтэй</Label>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!formData.image_url || createMutation.isPending || updateMutation.isPending}
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : editingBannerId ? (
                      'Хадгалах'
                    ) : (
                      'Нэмэх'
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Баннер зар байхгүй байна</p>
            <Button onClick={openAddDialog} className="bg-amber-500 hover:bg-amber-600">
              <Plus className="w-5 h-5 mr-2" />
              Эхний баннераа нэмэх
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {banners.map((banner, index) => (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
              >
                <div className="flex items-center gap-4">
                  <img src={banner.image_url} alt="" className="w-32 h-20 object-cover rounded-lg" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{banner.title || 'Баннер'}</h3>
                    <p className="text-sm text-gray-500">{banner.link}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${banner.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {banner.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}
                      </span>
                      <span className="text-xs text-gray-400">Дараалал: {banner.order}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveUp(banner, index)}
                      disabled={index === 0}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveDown(banner, index)}
                      disabled={index === banners.length - 1}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <Switch
                      checked={banner.is_active}
                      onCheckedChange={(checked) =>
                        updateMutation.mutate({ id: banner.id, data: { is_active: checked } })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Засах"
                      onClick={() => openEditDialog(banner)}
                    >
                      <Pencil className="w-4 h-4 text-gray-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (confirm('Баннер устгах уу?')) {
                          deleteMutation.mutate(banner.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}