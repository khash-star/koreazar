import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Бүх талбарыг бөглөнө үү.');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Нууц үг таарахгүй байна.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Имэйл хаяг буруу форматтай байна.');
      return false;
    }

    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await register(formData.email, formData.password, formData.displayName || null);
      // AuthContext automatically updates, so just navigate
      navigate('/Home');
    } catch (err) {
      console.error('Register error:', err);
      const errorCode = err?.code || err?.message || 'unknown';
      setError(getErrorMessage(errorCode));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (code) => {
    // Firebase error codes
    if (code?.includes('email-already-in-use') || code === 'auth/email-already-in-use') {
      return 'Энэ имэйл аль хэдийн бүртгэлтэй байна.';
    }
    if (code?.includes('invalid-email') || code === 'auth/invalid-email') {
      return 'Имэйл хаяг буруу форматтай байна.';
    }
    if (code?.includes('weak-password') || code === 'auth/weak-password') {
      return 'Нууц үг сул байна. Хамгийн багадаа 6 тэмдэгт байх ёстой.';
    }
    if (code?.includes('network') || code === 'auth/network-request-failed') {
      return 'Сүлжээний алдаа. Интернэт холболтыг шалгана уу.';
    }
    if (code?.includes('400') || code?.includes('Bad Request')) {
      return 'Хүсэлт буруу байна. Firebase config эсвэл Authentication тохиргоог шалгана уу.';
    }
    if (code?.includes('auth/operation-not-allowed')) {
      return 'Email/Password authentication идэвхжээгүй байна. Firebase Console дээр идэвхжүүлнэ үү.';
    }
    
    // Show actual error for debugging
    return `Бүртгүүлэхэд алдаа: ${code || 'Тодорхойгүй алдаа'}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Бүртгүүлэх</CardTitle>
          <CardDescription>
            Шинэ бүртгэл үүсгэх
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="displayName">Нэр (сонголттой)</Label>
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
              <Label htmlFor="email">Имэйл *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Нууц үг *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Хамгийн багадаа 6 тэмдэгт"
                required
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Нууц үг давтах *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Нууц үг давтах"
                required
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Бүртгүүлж байна...
                </>
              ) : (
                'Бүртгүүлэх'
              )}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">Аль хэдийн бүртгэлтэй юу? </span>
            <button
              onClick={() => navigate('/Login')}
              className="text-amber-600 hover:underline font-medium"
            >
              Нэвтрэх
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

