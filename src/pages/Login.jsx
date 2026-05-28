import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom';
import {
  login,
  resetPassword,
  startPhoneLogin,
  confirmPhoneLogin,
  completePhoneUserProfile,
} from '@/services/authService';
import { auth } from '@/firebase/config';
import { RecaptchaVerifier } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast, dismissAllToasts } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { createPageUrl } from '@/utils';

/** Same-origin path only – prevents open redirect */
function safeRedirectPath(url) {
  if (!url || typeof url !== 'string') return null;
  const s = url.trim();
  if (s.startsWith('http://') || s.startsWith('https://')) return null;
  if (/[<>"']/.test(s)) return null;
  const path = s.startsWith('/') ? s : '/' + s;
  return path === '/' || path.startsWith('/Login') ? null : path;
}

function peekStoredLoginRedirect() {
  try {
    const stored = sessionStorage.getItem('loginRedirect');
    return stored ? safeRedirectPath(stored) : null;
  } catch {
    return null;
  }
}

const OTP_RESEND_COOLDOWN_SEC = 60;
const PHONE_COUNTRIES = [
  { value: '+82', name: 'Солонгос' },
  { value: '+976', name: 'Монгол' },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const redirectUrl = useMemo(() => {
    return (
      safeRedirectPath(location.state?.from)
      || safeRedirectPath(searchParams.get('redirect'))
      || peekStoredLoginRedirect()
      || createPageUrl('Home')
    );
  }, [location.state, searchParams]);

  useEffect(() => {
    let path = safeRedirectPath(searchParams.get('redirect'));
    if (!path) {
      try {
        const stored = sessionStorage.getItem('loginRedirect');
        if (stored) {
          path = safeRedirectPath(stored);
          sessionStorage.removeItem('loginRedirect');
        }
      } catch {
        /* ignore */
      }
    } else {
      try {
        sessionStorage.removeItem('loginRedirect');
      } catch {
        /* ignore */
      }
    }
    if (!path || location.state?.from === path) return;
    navigate('/Login', { replace: true, state: { from: path } });
  }, [navigate, searchParams, location.state?.from]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState('');
  const [loginMethod, setLoginMethod] = useState('phone');
  const [phoneCountryPrefix, setPhoneCountryPrefix] = useState('+82');
  const [phoneLocal, setPhoneLocal] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [phoneNameSetup, setPhoneNameSetup] = useState(false);
  const [profileDisplayName, setProfileDisplayName] = useState('');

  const startResendCountdown = useCallback(() => {
    setResendCountdown(OTP_RESEND_COOLDOWN_SEC);
  }, []);

  useEffect(() => {
    if (resendCountdown <= 0) return undefined;
    const timerId = window.setTimeout(() => {
      setResendCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearTimeout(timerId);
  }, [resendCountdown]);

  useEffect(() => {
    if (
      import.meta.env.DEV &&
      import.meta.env.VITE_FIREBASE_PHONE_TEST_MODE === 'true'
    ) {
      auth.settings.appVerificationDisabledForTesting = true;
    }
  }, []);

  const clearRecaptchaVerifier = useCallback(() => {
    try {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } catch {
      // noop
    }
  }, []);

  const ensureRecaptcha = useCallback(async () => {
    if (window.recaptchaVerifier) return window.recaptchaVerifier;
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {},
      'expired-callback': () => {
        clearRecaptchaVerifier();
      },
    });
    await verifier.render();
    window.recaptchaVerifier = verifier;
    return verifier;
  }, [clearRecaptchaVerifier]);

  useEffect(() => {
    if (loginMethod !== 'phone' || phoneNameSetup || otpSent) return undefined;
    let cancelled = false;
    (async () => {
      try {
        if (!cancelled) await ensureRecaptcha();
      } catch (e) {
        console.warn('reCAPTCHA prewarm:', e?.message || e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loginMethod, phoneNameSetup, otpSent, ensureRecaptcha]);

  const normalizePhoneE164 = (raw) => {
    const v = String(raw || '').trim().replace(/[\s-]/g, '');
    if (!v) return '';
    if (!v.startsWith('+')) return v.replace(/[^\d]/g, '');
    return `+${v.slice(1).replace(/[^\d]/g, '')}`;
  };

  /** 010-9497-0939 → 1094970939 (+82/+976 улсын кодтой хамт ашиглана) */
  const stripNationalTrunkZero = (digits, prefix) => {
    let d = String(digits || '').replace(/[^\d]/g, '');
    if (!d) return '';
    if (prefix === '+82') {
      if (d.startsWith('82')) d = d.slice(2);
    } else if (prefix === '+976') {
      if (d.startsWith('976')) d = d.slice(3);
    }
    if ((prefix === '+82' || prefix === '+976') && d.startsWith('0')) {
      d = d.replace(/^0+/, '');
    }
    return d;
  };

  const buildFullPhoneE164 = () => {
    const localDigits = stripNationalTrunkZero(phoneLocal, phoneCountryPrefix);
    return normalizePhoneE164(`${phoneCountryPrefix}${localDigits}`);
  };

  const parsePhoneInput = (raw, currentPrefix) => {
    const cleaned = String(raw || '').trim().replace(/[\s-]/g, '');
    const digitsOnly = cleaned.replace(/[^\d+]/g, '');
    const normalized = normalizePhoneE164(
      digitsOnly.startsWith('+') ? digitsOnly : `${currentPrefix}${stripNationalTrunkZero(digitsOnly, currentPrefix)}`
    );
    if (normalized.startsWith('+976')) {
      return { prefix: '+976', local: normalized.slice(4) };
    }
    if (normalized.startsWith('+82')) {
      return { prefix: '+82', local: normalized.slice(3) };
    }
    return {
      prefix: currentPrefix,
      local: stripNationalTrunkZero(cleaned.replace(/[^\d]/g, ''), currentPrefix),
    };
  };

  const handlePhoneLocalChange = (value) => {
    const parsed = parsePhoneInput(value, phoneCountryPrefix);
    setPhoneCountryPrefix(parsed.prefix);
    setPhoneLocal(parsed.local);
  };

  const handlePhoneCountryChange = (prefix) => {
    setPhoneCountryPrefix(prefix);
  };

  const resetPhoneOtpFlow = () => {
    dismissAllToasts();
    setOtpSent(false);
    setOtpCode('');
    setPhoneLocal('');
    setPhoneNameSetup(false);
    setProfileDisplayName('');
    setConfirmationResult(null);
    setResendCountdown(0);
    setError('');
    clearRecaptchaVerifier();
  };

  const sendOtpToPhone = async ({ forceNewRecaptcha = false } = {}) => {
    setError('');
    setTermsError('');
    if (!acceptedTerms) {
      setTermsError('Эхлээд үйлчилгээний нөхцөлийг зөвшөөрснөө тэмдэглэнэ үү.');
      return;
    }
    const normalized = buildFullPhoneE164();
    if (!/^\+\d{8,15}$/.test(normalized)) {
      setError('Утасны дугаараа +821012345678 хэлбэрээр оруулна уу.');
      return;
    }

    setPhoneLoading(true);
    try {
      if (forceNewRecaptcha) {
        clearRecaptchaVerifier();
      }
      const verifier = await ensureRecaptcha();
      const result = await startPhoneLogin(normalized, verifier);
      setConfirmationResult(result);
      setOtpSent(true);
      startResendCountdown();
      dismissAllToasts();
      toast({ title: 'OTP илгээгдлээ', description: 'Утасандаа ирсэн 6 оронтой кодоо оруулна уу.' });
    } catch (err) {
      console.error('Phone OTP send error:', err);
      const code = err?.code || err?.message || 'unknown';
      setError(getErrorMessage(code));
      if (String(code).toLowerCase().includes('captcha')) {
        clearRecaptchaVerifier();
      }
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setTermsError('');
    if (!acceptedTerms) {
      setTermsError('Эхлээд үйлчилгээний нөхцөлийг зөвшөөрснөө тэмдэглэнэ үү.');
      return;
    }
    setLoading(true);

    try {
      await login(email, password);
      // AuthContext automatically updates, wait a bit for context to update
      setTimeout(() => {
        navigate(redirectUrl);
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

  const handleSendOtp = async (e) => {
    e.preventDefault();
    await sendOtpToPhone();
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0 || phoneLoading) return;
    await sendOtpToPhone({ forceNewRecaptcha: true });
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setPhoneLoading(true);
    try {
      const normalized = buildFullPhoneE164();
      const { needsNameSetup } = await confirmPhoneLogin(confirmationResult, otpCode, normalized);
      if (needsNameSetup) {
        dismissAllToasts();
        setPhoneNameSetup(true);
        setProfileDisplayName('');
        return;
      }
      dismissAllToasts();
      setTimeout(() => {
        navigate(redirectUrl);
      }, 100);
    } catch (err) {
      console.error('Phone OTP verify error:', err);
      const code = err?.code || err?.message || 'unknown';
      setError(getErrorMessage(code));
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleCompletePhoneProfile = async (e) => {
    e.preventDefault();
    setError('');
    const name = profileDisplayName.trim();
    if (name.length < 2) {
      setError('Нэр хамгийн багадаа 2 тэмдэгт байх ёстой.');
      return;
    }
    setPhoneLoading(true);
    try {
      await completePhoneUserProfile(name);
      setTimeout(() => {
        navigate(redirectUrl);
      }, 100);
    } catch (err) {
      console.error('Phone profile setup error:', err);
      setError(err?.message || 'Профайл хадгалахад алдаа гарлаа.');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setResetLoading(true);

    try {
      await resetPassword(resetEmail);
      setShowResetPassword(false);
      toast({ title: 'Имэйл илгээгдлээ', description: 'Имэйл хайрцгаа шалгаад зааврыг дагана уу. Spam email-аа давхар шалгаарай.', variant: 'default' });
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
      return 'Нэвтрэх арга идэвхжээгүй байна. Firebase Console → Authentication шалгана уу.';
    }
    if (codeStr.includes('auth/invalid-api-key')) {
      return 'Firebase API key буруу байна. .env файл шалгана уу.';
    }
    if (codeStr.includes('auth/invalid-phone-number')) {
      return 'Утасны дугаар буруу байна. +821012345678 хэлбэрээр оруулна уу.';
    }
    if (codeStr.includes('auth/missing-phone-number')) {
      return 'Утасны дугаар оруулна уу.';
    }
    if (codeStr.includes('auth/invalid-verification-code')) {
      return 'OTP код буруу байна. Дахин шалгаад оруулна уу.';
    }
    if (codeStr.includes('auth/code-expired')) {
      return 'OTP кодын хугацаа дууссан байна. Дахин код илгээнэ үү.';
    }
    if (codeStr.includes('auth/captcha-check-failed')) {
      return 'reCAPTCHA баталгаажуулалт амжилтгүй боллоо. Дахин оролдоно уу.';
    }
    if (codeStr.includes('auth/quota-exceeded')) {
      return 'SMS лимит дууссан байна. Түр хүлээгээд дахин оролдоно уу.';
    }

    // Show actual error for debugging
    return `Нэвтрэхэд алдаа гарлаа: ${code || 'Тодорхойгүй алдаа'}. Browser console (F12) шалгана уу.`;
  };

  if (showResetPassword) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4 py-12">
        <Card className="mx-auto w-full max-w-md shrink-0">
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
    <div className="relative min-h-screen w-full flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="mx-auto w-full max-w-md shrink-0">
        <CardHeader>
          <CardTitle>Нэвтрэх</CardTitle>
          <CardDescription>
            Имэйл эсвэл утсаар OTP код ашиглан нэвтрэнэ үү
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex rounded-md border p-1">
            <button
              type="button"
              className={`flex-1 rounded px-3 py-2 text-sm font-medium ${loginMethod === 'phone' ? 'bg-amber-500 text-white' : 'text-gray-600'}`}
              onClick={() => {
                setLoginMethod('phone');
                setError('');
                setPhoneNameSetup(false);
              }}
            >
              Утас
            </button>
            <button
              type="button"
              className={`flex-1 rounded px-3 py-2 text-sm font-medium ${loginMethod === 'email' ? 'bg-amber-500 text-white' : 'text-gray-600'}`}
              onClick={() => {
                setLoginMethod('email');
                setError('');
              }}
            >
              Имэйл
            </button>
          </div>

          {loginMethod === 'email' ? (
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
                  onClick={() => {
                    setResetEmail(email);
                    setShowResetPassword(true);
                  }}
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
            <div className="space-y-2">
              <label className="flex gap-3 items-start cursor-pointer select-none">
                <Checkbox
                  checked={acceptedTerms}
                  onCheckedChange={(v) => {
                    setAcceptedTerms(!!v);
                    setTermsError('');
                  }}
                  className="mt-0.5"
                />
                <span className="text-sm text-gray-600 leading-relaxed">
                  Би ZARKOREA.COM сайтын{' '}
                  <Link
                    to={createPageUrl('Privacy')}
                    className="text-red-600 hover:underline font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    үйлчилгээний нөхцөл
                  </Link>{' '}
                  хүлээн зөвшөөрч, мөн өөрийгөө 18 нас хүрсэн болохыг баталж байна.
                </span>
              </label>
              <p className="text-xs text-gray-500 pl-7 mt-1 leading-snug">
                Хүчирхийлэл, spam, хууль бус контент хориглоно.
              </p>
              {termsError ? <p className="text-sm text-red-600 pl-7">{termsError}</p> : null}
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
          ) : phoneNameSetup ? (
          <form onSubmit={handleCompletePhoneProfile} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                Код баталгаажлаа. Таны нэрийг оруулаад бүртгэлээ дуусгана уу.
              </AlertDescription>
            </Alert>
            <p className="text-sm text-gray-600">
              Утасны дугаар: <span className="font-medium">{buildFullPhoneE164()}</span>
            </p>
            <div className="space-y-2">
              <Label htmlFor="profileDisplayName">Таны нэр</Label>
              <Input
                id="profileDisplayName"
                type="text"
                value={profileDisplayName}
                onChange={(e) => setProfileDisplayName(e.target.value)}
                placeholder="Жишээ: Батбаяр"
                required
                autoComplete="name"
                minLength={2}
                maxLength={60}
              />
              <p className="text-xs text-gray-500">
                Нэрээ оруулсны дараа зар, хадгалсан зүйлс таны дугаарт холбогдоно.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={phoneLoading}>
              {phoneLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Хадгалж байна...
                </>
              ) : (
                'Бүртгүүлэх'
              )}
            </Button>
          </form>
          ) : (
          <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="phoneLocal">Утасны дугаар</Label>
              {otpSent ? (
                <Input
                  id="phoneLocal"
                  type="tel"
                  value={buildFullPhoneE164()}
                  disabled
                  className="w-full"
                />
              ) : (
                <div className="flex gap-2">
                  <Select
                    value={phoneCountryPrefix}
                    onValueChange={handlePhoneCountryChange}
                    disabled={phoneLoading}
                  >
                    <SelectTrigger
                      className="w-[108px] shrink-0 bg-gray-800 text-white border-gray-800 focus:ring-amber-500 [&>svg]:text-white"
                      aria-label="Улсын код"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PHONE_COUNTRIES.map(({ value, name }) => (
                        <SelectItem key={value} value={value}>
                          <span className="font-medium">{value}</span>
                          <span className="text-muted-foreground ml-2">{name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phoneLocal"
                    type="tel"
                    value={phoneLocal}
                    onChange={(e) => handlePhoneLocalChange(e.target.value)}
                    placeholder={phoneCountryPrefix === '+82' ? '010-9497-0939' : '99112233'}
                    required
                    autoComplete="tel"
                    className="flex-1"
                  />
                </div>
              )}
              <p className="text-xs text-gray-500">
                010-9497-0939 эсвэл 01094970939 гэж бичиж болно. Зай, зураас, эхний 0 автоматаар зөв болно.
              </p>
              {!otpSent ? (
                <p className="text-xs text-gray-500">
                  Аюулгүй байдлын captcha заримдаа гарч болно (Google). Олон удаа дарахгүй.
                </p>
              ) : null}
            </div>

            {otpSent ? (
              <div className="space-y-2">
                <Label htmlFor="otpCode">Мессежээр ирсэн 6 оронтой код</Label>
                <Input
                  id="otpCode"
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Мессежээр ирсэн 6 оронтой код"
                  required
                  inputMode="numeric"
                  maxLength={6}
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="flex gap-3 items-start cursor-pointer select-none">
                <Checkbox
                  checked={acceptedTerms}
                  onCheckedChange={(v) => {
                    setAcceptedTerms(!!v);
                    setTermsError('');
                  }}
                  className="mt-0.5"
                />
                <span className="text-sm text-gray-600 leading-relaxed">
                  Би ZARKOREA.COM сайтын{' '}
                  <Link
                    to={createPageUrl('Privacy')}
                    className="text-red-600 hover:underline font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    үйлчилгээний нөхцөл
                  </Link>{' '}
                  хүлээн зөвшөөрч, мөн өөрийгөө 18 нас хүрсэн болохыг баталж байна.
                </span>
              </label>
              {termsError ? <p className="text-sm text-red-600 pl-7">{termsError}</p> : null}
            </div>

            <Button type="submit" className="w-full" disabled={phoneLoading}>
              {phoneLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {otpSent ? 'Баталгаажуулж байна...' : 'Код илгээж байна...'}
                </>
              ) : otpSent ? (
                'OTP-ээр нэвтрэх'
              ) : (
                'OTP код илгээх'
              )}
            </Button>

            {otpSent ? (
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={phoneLoading || resendCountdown > 0}
                  onClick={handleResendOtp}
                >
                  {resendCountdown > 0
                    ? `Дахин код илгээх (${resendCountdown}с)`
                    : 'Дахин код илгээх'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-gray-600"
                  disabled={phoneLoading}
                  onClick={resetPhoneOtpFlow}
                >
                  Дугаар солих
                </Button>
              </div>
            ) : null}
          </form>
          )}
          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">Бүртгэлгүй юу? </span>
            <button
              onClick={() => navigate('/Register')}
              className="text-amber-600 hover:underline font-medium"
            >
              Бүртгүүлэх
            </button>
          </div>
          <p className="mt-3 text-center">
            <Link to={createPageUrl('Privacy')} className="text-xs text-gray-500 hover:text-amber-600">
              Нууцлалын бодлого
            </Link>
          </p>
        </CardContent>
      </Card>
      <div
        id="recaptcha-container"
        className="pointer-events-none absolute left-0 top-0 h-px w-px overflow-hidden opacity-0"
        aria-hidden="true"
      />
    </div>
  );
}

