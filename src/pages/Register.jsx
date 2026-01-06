import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
    
    // Real-time email validation
    if (name === 'email') {
      if (!value || !value.trim()) {
        setEmailError('Имэйл хаяг заавал оруулах шаардлагатай.');
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) {
          setEmailError('Имэйл хаяг буруу форматтай байна.');
        } else {
          setEmailError('');
        }
      }
    } else {
      setEmailError('');
    }
    
    // Real-time phone validation
    if (name === 'phone' && value && value.trim()) {
      const phoneDigits = value.replace(/[\s\-\(\)\+]/g, '');
      if (!/^\d+$/.test(phoneDigits)) {
        setPhoneError('Утасны дугаар зөвхөн тоо байх ёстой.');
      } else if (phoneDigits.length < 8 || phoneDigits.length > 11) {
        setPhoneError('Утасны дугаар .');
      } else {
        setPhoneError('');
      }
    } else if (name === 'phone') {
      setPhoneError('');
    }
  };

  const validateForm = () => {
    // Email заавал шаардлагатай
    if (!formData.email || !formData.email.trim()) {
      setError('Имэйл хаяг заавал оруулах шаардлагатай.');
      setEmailError('Имэйл хаяг заавал оруулах шаардлагатай.');
      return false;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = formData.email.trim();
    if (!emailRegex.test(trimmedEmail)) {
      setError('Имэйл хаяг буруу форматтай байна.');
      setEmailError('Имэйл хаяг буруу форматтай байна.');
      return false;
    }
    
    // Clear email error if valid
    setEmailError('');

    // Password заавал шаардлагатай
    if (!formData.password || !formData.confirmPassword) {
      setError('Нууц үг заавал оруулах шаардлагатай.');
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

    // Утасны дугаар validation (хэрэв оруулсан бол)
    if (formData.phone && formData.phone.trim()) {
      // Зөвхөн тоонуудыг авах (зураас, зай, хаалт зэргийг арилгах)
      const phoneDigits = formData.phone.replace(/[\s\-\(\)\+]/g, '');
      
      // Зөвхөн тоо байгаа эсэхийг шалгах
      if (!/^\d+$/.test(phoneDigits)) {
        setError('Утасны дугаар зөвхөн тоо байх ёстой.');
        setPhoneError('Утасны дугаар зөвхөн тоо байх ёстой.');
        return false;
      }
      
      // 8-11 оронтой байх ёстой
      if (phoneDigits.length < 8 || phoneDigits.length > 11) {
        setError('Утасны дугаар 8-11 оронтой байх ёстой.');
        setPhoneError('Утасны дугаар 8-11 оронтой байх ёстой.');
        return false;
      }
    }
    
    // Clear phone error if valid
    setPhoneError('');

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
      await register(formData.email, formData.password, formData.displayName || null, formData.phone || null);
      // AuthContext automatically updates, so just navigate
      navigate(createPageUrl('Home'));
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
              <Label htmlFor="phone">Утасны дугаар (сонголттой)</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="01012345678 (8-11 орон)"
                autoComplete="tel"
                pattern="[0-9\s\-\(\)\+]{8,15}"
                className={phoneError ? 'border-red-500' : ''}
              />
              {phoneError ? (
                <p className="text-xs text-red-500">{phoneError}</p>
              ) : (
                <p className="text-xs text-gray-500">8-11 оронтой тоо</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Имэйл *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={(e) => {
                  if (e.target.value && !emailError) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(e.target.value.trim())) {
                      setEmailError('Имэйл хаяг буруу форматтай байна.');
                    }
                  }
                }}
                placeholder="name@example.com"
                required
                autoComplete="email"
                className={emailError ? 'border-red-500' : ''}
              />
              {emailError && (
                <p className="text-xs text-red-500">{emailError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Нууц үг *</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Хамгийн багадаа 6 тэмдэгт"
                  required
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPassword(!showPassword);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900 focus:outline-none cursor-pointer z-10 transition-colors"
                  aria-label={showPassword ? "Нууц үг нуух" : "Нууц үг харуулах"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Нууц үг давтах *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Нууц үг давтах"
                  required
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowConfirmPassword(!showConfirmPassword);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900 focus:outline-none cursor-pointer z-10 transition-colors"
                  aria-label={showConfirmPassword ? "Нууц үг нуух" : "Нууц үг харуулах"}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
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

