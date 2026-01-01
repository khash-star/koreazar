import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { login, resetPassword } from '@/services/authService';
import { loginWithKakao } from '@/services/kakaoAuthService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/Home';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [kakaoLoading, setKakaoLoading] = useState(false);

  const handleKakaoLogin = async () => {
    setError('');
    setKakaoLoading(true);
    try {
      await loginWithKakao();
      setTimeout(() => {
        const cleanUrl = redirectUrl.startsWith('/Login') ? '/Home' : redirectUrl;
        navigate(cleanUrl || '/Home');
      }, 100);
    } catch (err) {
      console.error('Kakao login error:', err);
      setError('Kakao-р нэвтрэхэд алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setKakaoLoading(false);
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
        const cleanUrl = redirectUrl.startsWith('/Login') ? '/Home' : redirectUrl;
        navigate(cleanUrl || '/Home');
      }, 100);
    } catch (err) {
      console.error('Login error:', err);
      const errorCode = err?.code || err?.message || 'unknown';
      setError(getErrorMessage(errorCode));
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
      return 'Энэ имэйл бүртгэлгүй байна.';
    }
    if (codeStr.includes('wrong-password') || codeStr === 'auth/wrong-password' || codeStr.includes('invalid-credential')) {
      return 'Нууц үг эсвэл имэйл буруу байна.';
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
    
    // Show actual error for debugging
    return `Нэвтрэхэд алдаа гарлаа: ${code || 'Тодорхойгүй алдаа'}`;
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
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
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
              className="w-full mt-4 bg-[#FEE500] hover:bg-[#FEE500]/90 text-gray-900 border-[#FEE500]"
              onClick={handleKakaoLogin}
              disabled={kakaoLoading || loading}
            >
              {kakaoLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Нэвтэрч байна...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"/>
                  </svg>
                  KakaoTalk-р нэвтрэх
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

