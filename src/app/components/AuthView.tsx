import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { MapPin, Shuffle } from 'lucide-react';
import headerImg from '../../assets/header.jpg';
import logoImg from '../../assets/logo.png';

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

  const generateRandomUsername = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/generate-username`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
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
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email, password, username }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('Signup error:', data);
        setError(data.error || `Sign up failed: ${response.status} ${response.statusText}`);
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
      className="size-full flex relative"
      style={{ backgroundImage: `url(${headerImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-slate-900/65" />

      {/* Left panel */}
      <div className="relative z-10 flex-1 flex flex-col justify-center p-12 lg:p-16 gap-6">
        <img src={logoImg} alt="WhereTwo" className="h-28 w-auto" />
        <div className="space-y-3">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Let's explore the world together
          </h2>
          <p className="text-white/60 flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 shrink-0" />
            Collaborative travel planning for every destination
          </p>
        </div>
        <p className="absolute bottom-10 text-white/40 text-sm">AI-powered itineraries</p>
      </div>

      {/* Right panel */}
      <div className="relative z-10 w-[460px] flex items-center justify-center p-8">
        <div className="w-full bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isSignUp ? 'Create account' : 'Welcome back'}
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {isSignUp ? 'Start planning your next adventure' : 'Sign in to continue planning'}
            </p>
          </div>

          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <Label className="text-white/80 text-sm">Username</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    required
                    placeholder="wheretwo-user-0"
                    className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-white/30"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={generateRandomUsername}
                    className="text-white/60 hover:text-white hover:bg-white/10 border border-white/20"
                  >
                    <Shuffle className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-white/35 text-xs">Lowercase letters, numbers, and dashes only</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-white/80 text-sm">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-white/30"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-white/80 text-sm">Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-white/30"
              />
            </div>

            {error && (
              <div className="text-sm text-green-300 bg-green-900/30 p-3 rounded-lg border border-green-500/30">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold bg-white text-gray-900 hover:bg-white/90"
              disabled={loading}
            >
              {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              className="text-sm text-white/50 hover:text-white/80 transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in →' : "Don't have an account? Sign up →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
