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
      setResendCooldown(prev => {
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
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
          body: JSON.stringify({ userId: pendingUserId, code: verificationCode }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Verification failed');
        setLoading(false);
        return;
      }

      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
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
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
          body: JSON.stringify({ userId: pendingUserId }),
        }
      );
      startResendCooldown();
    } catch {
      /* silent */
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

      <main className="relative z-10 flex-1 flex items-center justify-center px-6">
        <div className="flex flex-col items-center w-full max-w-[380px] gap-4">
          <img src={logoImg} alt="WhereTwo" className="w-56 h-56 object-contain" />

          <div className="w-full px-6 py-6">
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
                  <h1 className="text-[28px] font-semibold tracking-tight text-white text-center mb-6">
                    {forgotMode === 'password' ? 'Reset password' : 'Find username'}
                  </h1>
                  <div className="flex gap-2 mb-6">
                    {(['password', 'username'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setForgotMode(mode);
                          setError('');
                        }}
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
                      onClick={() => {
                        setForgotMode(null);
                        setForgotEmail('');
                        setError('');
                      }}
                      className="text-sm text-white/55 hover:text-white transition-colors"
                    >
                      Back to sign in
                    </button>
                  </div>
                </>
              )
            ) : pendingVerification ? (
              <>...
              {elided for brevity}...
              </>
            ) : (
              <>...
              {elided for brevity}...
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