import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Shuffle } from 'lucide-react';
import headerImg from '../../assets/header.jpg';
import logoImg from '../../assets/pin-logo.png';

interface AuthViewProps {
  onLogin: (session: any) => void;
}

export function AuthView({ onLogin }: AuthViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [pendingUserId, setPendingUserId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [forgotMode, setForgotMode] = useState<'password' | 'username' | null>(null);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const inputStyle =
    'h-12 rounded-2xl bg-white/10 border-white/15 text-white placeholder:text-white/35 focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:border-white/30 transition-all';

  const primaryButtonStyle =
    'h-12 w-full rounded-2xl bg-white text-gray-950 font-semibold shadow-xl shadow-black/20 hover:bg-white/90 active:scale-[0.98] transition-all';

  const generateRandomUsername = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/generate-username`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setUsername(data.username);
      }
    } catch (err) {
      console.error('Failed to generate username:', err);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email, password, username }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || `Sign up failed: ${response.status} ${response.statusText}`);
        setLoading(false);
        return;
      }

      if (data.requiresVerification) {
        setPendingUserId(data.userId);
        setPendingVerification(true);
        setLoading(false);
        startResendCooldown();
        return;
      }

      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError(loginError.message);
        setLoading(false);
        return;
      }

      onLogin(loginData.session);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(60);

    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/verify-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            userId: pendingUserId,
            code: verificationCode,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Verification failed');
        setLoading(false);
        return;
      }

      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError(loginError.message);
        setLoading(false);
        return;
      }

      onLogin(loginData.session);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/resend-verification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ userId: pendingUserId }),
        }
      );

      startResendCooldown();
    } catch {
      // silent
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/account/forgot-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            email: forgotEmail,
            redirectTo: `${window.location.origin}${window.location.pathname}`,
          }),
        }
      );

      setForgotSent(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/account/forgot-username`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email: forgotEmail }),
        }
      );

      setForgotSent(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError(loginError.message);
        setLoading(false);
        return;
      }

      onLogin(data.session);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full relative flex flex-col overflow-hidden"
      style={{
        backgroundImage: `url(${headerImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-black/10 to-black/50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_42%)]" />

      <main className="relative z-10 flex-1 flex items-center justify-center px-5 py-8">
        <div className="w-full max-w-[420px] rounded-[2.25rem] border border-white/20 bg-white/[0.11] px-7 py-8 shadow-2xl shadow-black/35 backdrop-blur-2xl">
          <img
            src={logoImg}
            alt="WhereTwo"
            className="mx-auto mb-7 w-60 h-60 object-contain drop-shadow-2xl"
          />

          {forgotMode ? (
            forgotSent ? (
              <>
                <p className="mx-auto mb-8 max-w-[300px] text-center text-sm leading-6 text-white/60">
                  {forgotMode === 'password'
                    ? 'We sent a password reset link to '
                    : 'We sent your username to '}
                  <span className="font-medium text-white/90">{forgotEmail}</span>
                </p>

                <Button
                  type="button"
                  className={primaryButtonStyle}
                  onClick={() => {
                    setForgotMode(null);
                    setForgotSent(false);
                    setForgotEmail('');
                    setError('');
                  }}
                >
                  Back to sign in
                </Button>
              </>
            ) : (
              <>
                <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-white/8 p-1">
                  {(['password', 'username'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setForgotMode(mode);
                        setError('');
                      }}
                      className={`rounded-xl py-2 text-sm font-medium transition-all ${
                        forgotMode === mode
                          ? 'bg-white text-gray-950 shadow-lg'
                          : 'text-white/55 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {mode === 'password' ? 'Password' : 'Username'}
                    </button>
                  ))}
                </div>

                <form
                  onSubmit={forgotMode === 'password' ? handleForgotPassword : handleForgotUsername}
                  className="space-y-4"
                >
                  <Input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    placeholder="Email"
                    className={inputStyle}
                    autoFocus
                  />

                  {error && (
                    <div className="rounded-2xl border border-red-300/25 bg-red-500/15 px-4 py-3 text-sm text-red-50">
                      {error}
                    </div>
                  )}

                  <Button type="submit" disabled={loading} className={primaryButtonStyle}>
                    {loading
                      ? 'Sending'
                      : forgotMode === 'password'
                        ? 'Send reset link'
                        : 'Send username'}
                  </Button>
                </form>

                <div className="pt-6 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotMode(null);
                      setForgotEmail('');
                      setError('');
                    }}
                    className="text-sm font-medium text-white/55 transition-colors hover:text-white"
                  >
                    Back to sign in
                  </button>
                </div>
              </>
            )
          ) : pendingVerification ? (
            <>
              <p className="mx-auto mb-6 max-w-[310px] text-center text-sm leading-6 text-white/60">
                We sent a 6-digit code to{' '}
                <span className="font-medium text-white/90">{email}</span>
              </p>

              <form onSubmit={handleVerify} className="space-y-4">
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  required
                  placeholder="000000"
                  className={`${inputStyle} text-center text-2xl font-bold tracking-[0.35em]`}
                  autoFocus
                />

                {error && (
                  <div className="rounded-2xl border border-red-300/25 bg-red-500/15 px-4 py-3 text-sm text-red-50">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                  className={primaryButtonStyle}
                >
                  {loading ? 'Verifying' : 'Verify email'}
                </Button>
              </form>

              <div className="pt-6 text-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className="text-sm font-medium text-white/55 transition-colors hover:text-white disabled:opacity-40"
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            </>
          ) : (
            <>
              <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
                {isSignUp && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={username}
                        onChange={(e) =>
                          setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                        }
                        required
                        placeholder="Username"
                        className={`${inputStyle} flex-1`}
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={generateRandomUsername}
                        className="h-12 w-12 rounded-2xl border border-white/15 bg-white/10 text-white/65 transition-all hover:bg-white/15 hover:text-white active:scale-95"
                      >
                        <Shuffle className="h-4 w-4" />
                      </Button>
                    </div>

                    <p className="pl-1 text-xs text-white/35">
                      Lowercase letters, numbers, and dashes only
                    </p>
                  </div>
                )}

                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Email"
                  className={inputStyle}
                />

                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Password"
                  className={inputStyle}
                />

                {!isSignUp && (
                  <div className="flex justify-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotMode('password');
                        setForgotEmail(email);
                        setError('');
                      }}
                      className="text-center text-xs font-medium text-white/45 transition-colors hover:text-white/75"
                    >
                      Forgot password or username?
                    </button>
                  </div>
                )}

                {error && (
                  <div className="rounded-2xl border border-red-300/25 bg-red-500/15 px-4 py-3 text-sm text-red-50">
                    {error}
                  </div>
                )}

                <Button type="submit" disabled={loading} className={primaryButtonStyle}>
                  {loading ? 'Loading' : isSignUp ? 'Get started' : 'Log in'}
                </Button>
              </form>

              <div className="pt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  className="text-sm font-medium text-white/55 transition-colors hover:text-white"
                >
                  {isSignUp
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Sign up"}
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="relative z-10 pb-5 text-center text-xs text-white/35">
        © {new Date().getFullYear()} Chloe Inocencio. All Rights Reserved.
      </footer>
    </div>
  );
}
