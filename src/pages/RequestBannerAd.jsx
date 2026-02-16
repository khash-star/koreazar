import React, { useState } from 'react';
import * as entities from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { compressImage } from '@/components/utils/imageCompressor';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, Loader2, Check, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { redirectToLogin } from '@/services/authService';

export default function RequestBannerAd() {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    link: '',
    message: ''
  });

  React.useEffect(() => {
    if (!user && !userData) {
      redirectToLogin(window.location.href);
    }
  }, [user, userData]);

  const { data: myRequests = [] } = useQuery({
    queryKey: ['myBannerRequests'],
    queryFn: async () => {
      return entities.BannerRequest.filter({ created_by: userData?.email || user?.email }, '-created_date');
    },
    enabled: !!user
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return entities.BannerRequest.create(data);
    },
    onSuccess: () => {
      setFormData({ title: '', link: '', message: '' });
      setImageUrl('');
      // Show success message and navigate to home
      alert('Таны хүсэлт амжилттай илгээгдлээ! Админ баталгаажуулна.');
      navigate(createPageUrl('Home'));
    }
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validFormats.includes(file.type)) {
      alert('Зөвхөн JPG, PNG, WEBP зураг оруулна уу');
      return;
    }

    setUploading(true);
    try {
      const compressed = await compressImage(file, 1200, 600, 0.8);
      const { file_url } = await UploadFile({ file: compressed });
      setImageUrl(file_url);
    } catch (error) {
      alert('Зураг upload хийхэд алдаа гарлаа');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!imageUrl) {
      alert('Баннер зураг оруулна уу');
      return;
    }
    createMutation.mutate({
      ...formData,
      image_url: imageUrl,
      status: 'pending'
    });
  };

  const statusLabels = {
    pending: { text: 'Хүлээгдэж байна', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
    approved: { text: 'Батлагдсан', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    rejected: { text: 'Татгалзсан', color: 'bg-red-100 text-red-800', icon: AlertCircle }
  };

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

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Баннер зар хүсэх</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🎨</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Таны бизнесийг олон мянган хүнд таниулаарай!
              </h2>
              <p className="text-gray-700 mb-3">
                Нүүр хуудасны баннер зар нь өдөрт олон мянган хэрэглэгчдэд үзэгддэг. 
                Таны бүтээгдэхүүн, үйлчилгээг өргөн хүрээнд сурталчлах хамгийн үр дүнтэй арга!
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">✓</span>
                  <span className="text-gray-700">Өндөр үзэгдэх хувь - нүүр хуудасны эхний байрлал</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">✓</span>
                  <span className="text-gray-700">Автоматаар солигдох 3 баннер систем</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">✓</span>
                  <span className="text-gray-700">Таны вэбсайт руу шууд холбоос</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-amber-300">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Үнэ:</span>
                  <span className="text-2xl font-bold text-amber-600">50,000₩/сар</span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  💡 Админ батлагаажуулсны дараа төлбөр тооцох ба баннер таны сайт идэвхжинэ
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Request Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold mb-6">Шинэ баннер зар хүсэх</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div>
              <Label className="text-base font-semibold mb-2 block">
                Баннер зураг * (1200x400px санал болгох)
              </Label>
              
              {imageUrl ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-gray-200">
                  <img src={imageUrl} alt="Banner" className="w-full h-48 object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setImageUrl('')}
                    className="absolute top-3 right-3"
                  >
                    Устгах
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  {uploading ? (
                    <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-2" />
                  ) : (
                    <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  )}
                  <span className="text-sm text-gray-600">
                    {uploading ? 'Зураг upload хийж байна...' : 'Зураг оруулах'}
                  </span>
                </label>
              )}
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title" className="text-base font-semibold">
                Баннерын нэр/гарчиг *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Жишээ: 2024 Winter Sale"
                className="mt-2 h-12 rounded-xl"
                required
              />
            </div>

            {/* Link */}
            <div>
              <Label htmlFor="link" className="text-base font-semibold">
                Холбоос (дарахад очих линк)
              </Label>
              <Input
                id="link"
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="https://example.com"
                className="mt-2 h-12 rounded-xl"
              />
            </div>

            {/* Message */}
            <div>
              <Label htmlFor="message" className="text-base font-semibold">
                Нэмэлт мэдээлэл
              </Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Та баннер зарын тухай нэмэлт мэдээлэл, хүсэл бичнэ үү..."
                className="mt-2 min-h-[100px] rounded-xl"
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={createMutation.isPending || !imageUrl}
              className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Илгээж байна...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Хүсэлт илгээх
                </>
              )}
            </Button>
          </form>
        </motion.div>

        {/* My Requests */}
        {myRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold mb-4">Миний хүсэлтүүд</h2>
            <div className="space-y-4">
              {myRequests.map((request) => {
                const status = statusLabels[request.status];
                const Icon = status.icon;
                
                return (
                  <div key={request.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex gap-4">
                      <img
                        src={request.image_url}
                        alt={request.title}
                        className="w-32 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{request.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(request.created_date).toLocaleDateString('mn-MN')}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            <Icon className="w-3 h-3" />
                            {status.text}
                          </span>
                        </div>
                        {request.admin_note && (
                          <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                            <strong>Админ:</strong> {request.admin_note}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}