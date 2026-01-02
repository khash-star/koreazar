import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserData, redirectToLogin } from '@/services/authService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

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
              <p className="text-sm text-gray-500">Мэдээлэл засах</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Хувийн мэдээлэл</CardTitle>
            <CardDescription>
              Өөрийн мэдээллийг засварлана уу
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
      </div>
    </div>
  );
}

