import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { login, resetPassword } from '@/services/authService';
import { loginWithFacebook } from '@/services/facebookAuthService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || createPageUrl('Home');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFacebookLogin = async () => {
    setError('');
    setFacebookLoading(true);
    try {
      await loginWithFacebook();
      setTimeout(() => {
        const cleanUrl = redirectUrl.startsWith('/Login') ? createPageUrl('Home') : redirectUrl;
        navigate(cleanUrl || createPageUrl('Home'));
      }, 100);
    } catch (err) {
      console.error('Facebook login error:', err);
      const errorMessage = err?.message || 'Facebook-р нэвтрэхэд алдаа гарлаа. Дахин оролдоно уу.';
      setError(errorMessage);
    } finally {
      setFacebookLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // AuthContext automatically updates, wait a bit for context to update
      setTimeout(() => {
        // Clean redirect URL - remove /Login prefix if present
        const cleanUrl = redirectUrl.startsWith('/Login') ? createPageUrl('Home') : redirectUrl;
        navigate(cleanUrl || createPageUrl('Home'));
      }, 100);
    } catch (err) {
      console.error('Login error:', err);
      const errorCode = err?.code || err?.message || 'unknown';
      const errorMessage = getErrorMessage(errorCode);
      setError(errorMessage);
      // Additional debugging
      if (err?.code) {
        console.error('Firebase error code:', err.code);
      }
      if (err?.message) {
        console.error('Firebase error message:', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setResetLoading(true);
    setResetSuccess(false);

    try {
      await resetPassword(resetEmail);
      setResetSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setResetLoading(false);
    }
  };

  const getErrorMessage = (code) => {
    // Handle string codes that might contain the error code
    const codeStr = String(code || '').toLowerCase();
    
    if (codeStr.includes('user-not-found') || codeStr === 'auth/user-not-found') {
      return 'Энэ имэйл бүртгэлгүй байна. Бүртгүүлэх хуудас руу орох уу?';
    }
    if (codeStr.includes('wrong-password') || codeStr === 'auth/wrong-password' || codeStr.includes('invalid-credential')) {
      return 'Нууц үг эсвэл имэйл буруу байна. Нууц үгээ мартсан уу?';
    }
    if (codeStr.includes('invalid-email') || codeStr === 'auth/invalid-email') {
      return 'Имэйл хаяг буруу форматтай байна.';
    }
    if (codeStr.includes('too-many-requests') || codeStr === 'auth/too-many-requests') {
      return 'Хэт олон удаа оролдсон. Түр хүлээгээд дахин оролдоно уу.';
    }
    if (codeStr.includes('network') || codeStr.includes('network-request-failed')) {
      return 'Сүлжээний алдаа. Интернэт холболтыг шалгана уу.';
    }
    if (codeStr.includes('400') || codeStr.includes('bad request')) {
      return 'Хүсэлт буруу байна. Firebase тохиргоог шалгана уу.';
    }
    if (codeStr.includes('auth/operation-not-allowed')) {
      return 'Email/Password нэвтрэх арга идэвхжээгүй байна. Firebase Console дээр идэвхжүүлнэ үү.';
    }
    if (codeStr.includes('auth/invalid-api-key')) {
      return 'Firebase API key буруу байна. .env файл шалгана уу.';
    }
    
    // Show actual error for debugging
    return `Нэвтрэхэд алдаа гарлаа: ${code || 'Тодорхойгүй алдаа'}. Browser console (F12) шалгана уу.`;
  };

  if (showResetPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Нууц үг сэргээх</CardTitle>
            <CardDescription>
              Нууц үгээ сэргээх имэйл илгээх
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {resetSuccess && (
                <Alert>
                  <AlertDescription>
                    Имэйл илгээгдлээ! Имэйл хайрцгаа шалгана уу.
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Имэйл</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowResetPassword(false)}
                  className="flex-1"
                >
                  Буцах
                </Button>
                <Button type="submit" disabled={resetLoading} className="flex-1">
                  {resetLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Илгээж байна...
                    </>
                  ) : (
                    'Илгээх'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Нэвтрэх</CardTitle>
          <CardDescription>
            Бүртгэлтэй имэйл, нууц үгээрээ нэвтрэнэ үү
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Имэйл</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Нууц үг</Label>
                <button
                  type="button"
                  onClick={() => setShowResetPassword(true)}
                  className="text-sm text-amber-600 hover:underline"
                >
                  Нууц үг мартсан?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Нэвтэрч байна...
                </>
              ) : (
                'Нэвтрэх'
              )}
            </Button>
          </form>

          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Эсвэл</span>
              </div>
            </div>
            
            <Button
              type="button"
              variant="outline"
              className="w-full mt-4 bg-[#1877F2] hover:bg-[#1877F2]/90 text-white border-[#1877F2]"
              onClick={handleFacebookLogin}
              disabled={facebookLoading || loading}
            >
              {facebookLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Нэвтэрч байна...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook-р нэвтрэх
                </>
              )}
            </Button>
          </div>

          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">Бүртгэлгүй юу? </span>
            <button
              onClick={() => navigate('/Register')}
              className="text-amber-600 hover:underline font-medium"
            >
              Бүртгүүлэх
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

