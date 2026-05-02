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

      // fallback: auto-login if somehow already confirmed
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) { setError(loginError.message); setLoading(false); return; }
      onLogin(loginData.session);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown(prev => { if (prev <= 1) { clearInterval(interval); return 0; } return prev - 1; });
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
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
          body: JSON.stringify({ userId: pendingUserId, code: verificationCode }),
        }
      );
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Verification failed'); setLoading(false); return; }

      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) { setError(loginError.message); setLoading(false); return; }
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
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
          body: JSON.stringify({ userId: pendingUserId }),
        }
      );
      startResendCooldown();
    } catch { /* silent */ }
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
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
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
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
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
    <div className="absolute inset-0 bg-black/55" />
    <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/30" />

    <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-10">
      <div className="flex flex-col items-center w-full max-w-[430px]">
        <img
          src={logoImg}
          alt="WhereTwo"
          className="w-56 h-56 object-contain"
        />

        <div className="w-full rounded-[2rem] bg-white/12 border border-white/20 shadow-2xl backdrop-blur-2xl px-8 py-9">
          {forgotMode ? (
            forgotSent ? (
              <>
                <h1 className="text-[28px] font-semibold tracking-tight text-white text-center mb-2">
                  Check your email
                </h1>
                <p className="text-sm text-white/50 text-center mb-8">
                  {forgotMode === 'password'
                    ? 'We sent a password reset link to '
                    : 'We sent your username to '}
                  <span className="text-white/80 font-medium">{forgotEmail}</span>
                </p>
                <Button
                  type="button"
                  className="h-12 w-full rounded-2xl bg-white text-gray-950 font-semibold shadow-lg hover:bg-white/90 transition-all"
                  onClick={() => { setForgotMode(null); setForgotSent(false); setForgotEmail(''); setError(''); }}
                >
                  Back to sign in
                </Button>
              </>
            ) : (
              <>
                <h1 className="text-[28px] font-semibold tracking-tight text-white text-center mb-6">
                  {forgotMode === 'password' ? 'Reset password' : 'Find username'}
                </h1>
                <div className="flex gap-2 mb-6">
                  {(['password', 'username'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => { setForgotMode(mode); setError(''); }}
                      className={`flex-1 py-2 rounded-2xl text-sm font-medium transition-all ${
                        forgotMode === mode
                          ? 'bg-white text-gray-950'
                          : 'bg-white/10 text-white/60 hover:bg-white/15'
                      }`}
                    >
                      {mode === 'password' ? 'Password' : 'Username'}
                    </button>
                  ))}
                </div>
                <form onSubmit={forgotMode === 'password' ? handleForgotPassword : handleForgotUsername} className="space-y-4">
                  <Input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    placeholder="Email"
                    className="h-12 rounded-2xl bg-white/12 border-white/15 text-white placeholder:text-white/35 focus-visible:ring-white/30"
                    autoFocus
                  />
                  {error && (
                    <div className="rounded-2xl border border-red-400/25 bg-red-500/15 px-4 py-3 text-sm text-red-100">
                      {error}
                    </div>
                  )}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-12 w-full rounded-2xl bg-white text-gray-950 font-semibold shadow-lg hover:bg-white/90 transition-all"
                  >
                    {loading ? 'Sending...' : forgotMode === 'password' ? 'Send reset link' : 'Send username'}
                  </Button>
                </form>
                <div className="pt-6 text-center">
                  <button
                    type="button"
                    onClick={() => { setForgotMode(null); setForgotEmail(''); setError(''); }}
                    className="text-sm text-white/55 hover:text-white transition-colors"
                  >
                    Back to sign in
                  </button>
                </div>
              </>
            )
          ) : pendingVerification ? (
            <>
              <h1 className="text-[28px] font-semibold tracking-tight text-white text-center mb-2">
                Check your email
              </h1>
              <p className="text-sm text-white/50 text-center mb-6">
                We sent a 6-digit code to <span className="text-white/80 font-medium">{email}</span>
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
                  className="h-12 rounded-2xl bg-white/12 border-white/15 text-white placeholder:text-white/35 focus-visible:ring-white/30 text-center text-2xl tracking-widest font-bold"
                  autoFocus
                />
                {error && (
                  <div className="rounded-2xl border border-red-400/25 bg-red-500/15 px-4 py-3 text-sm text-red-100">
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                  className="h-12 w-full rounded-2xl bg-white text-gray-950 font-semibold shadow-lg hover:bg-white/90 transition-all"
                >
                  {loading ? 'Verifying...' : 'Verify Email'}
                </Button>
              </form>
              <div className="pt-6 text-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className="text-sm text-white/55 hover:text-white transition-colors disabled:opacity-40"
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-[28px] font-semibold tracking-tight text-white text-center mb-6">
                {isSignUp ? 'Create account' : 'Welcome back'}
              </h1>

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
                        className="h-12 flex-1 rounded-2xl bg-white/12 border-white/15 text-white placeholder:text-white/35 focus-visible:ring-white/30"
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={generateRandomUsername}
                        className="h-12 w-12 rounded-2xl text-white/65 hover:text-white hover:bg-white/15 border border-white/15"
                      >
                        <Shuffle className="h-4 w-4" />
                      </Button>
                    </div>

                    <p className="text-xs text-white/35">
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
                  className="h-12 rounded-2xl bg-white/12 border-white/15 text-white placeholder:text-white/35 focus-visible:ring-white/30"
                />

                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Password"
                  className="h-12 rounded-2xl bg-white/12 border-white/15 text-white placeholder:text-white/35 focus-visible:ring-white/30"
                />

                {!isSignUp && (
                  <div className="flex justify-end -mt-1">
                    <button
                      type="button"
                      onClick={() => { setForgotMode('password'); setForgotEmail(email); setError(''); }}
                      className="text-xs text-white/45 hover:text-white/70 transition-colors"
                    >
                      Forgot password or username?
                    </button>
                  </div>
                )}

                {error && (
                  <div className="rounded-2xl border border-red-400/25 bg-red-500/15 px-4 py-3 text-sm text-red-100">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full rounded-2xl bg-white text-gray-950 font-semibold shadow-lg hover:bg-white/90 transition-all"
                >
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
                  className="text-sm text-white/55 hover:text-white transition-colors"
                >
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>

    <footer className="relative z-10 pb-5 text-center text-xs text-white/40">
      © {new Date().getFullYear()} Chloe Inocencio. All Rights Reserved.
    </footer>
  </div>
);
}
