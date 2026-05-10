import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Shuffle, MapPin } from 'lucide-react';
import logo from '../../assets/daily.png';
import headerBg from '../../assets/header.jpg';

interface AuthViewProps {
  onLogin: (session: any) => void;
}

const fadeUp: any = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.25 } },
};

const stagger: any = {
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

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
        { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
      );
      const data = await response.json();
      if (response.ok) setUsername(data.username);
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
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
          body: JSON.stringify({ email, password, username }),
        }
      );
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Sign up failed'); setLoading(false); return; }
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) { setError(loginError.message); setLoading(false); return; }
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
      const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) { setError(loginError.message); setLoading(false); return; }
      onLogin(data.session);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  // Shared form content
  const formContent = (isDark: boolean) => (
    <AnimatePresence mode="wait">
      <motion.div
        key={isSignUp ? 'signup' : 'signin'}
        variants={stagger}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {/* Heading */}
        <motion.div variants={fadeUp} className="mb-6">
          <h2 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-foreground'}`}>
            {isSignUp ? 'Create account' : 'Welcome back'}
          </h2>
          <p className={`mt-1 text-sm ${isDark ? 'text-white/60' : 'text-muted-foreground'}`}>
            {isSignUp ? 'Start planning your next adventure' : 'Sign in to continue planning'}
          </p>
        </motion.div>

        <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
          {isSignUp && (
            <motion.div variants={fadeUp} className="space-y-1.5">
              <Label htmlFor="username" className={`text-sm font-semibold ${isDark ? 'text-white/80' : ''}`}>Username</Label>
              <div className="flex gap-2">
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  required
                  placeholder="wheretwo-user-0"
                  className={`flex-1 h-11 transition-all duration-200 ${isDark ? 'bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-white/50' : 'bg-white/80 border-border/60 focus:border-primary'}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateRandomUsername}
                  className={`h-11 px-3 transition-all duration-200 ${isDark ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'hover:bg-primary/5 hover:border-primary/50'}`}
                  title="Generate random username"
                >
                  <Shuffle className="w-4 h-4" />
                </Button>
              </div>
              <p className={`text-xs ${isDark ? 'text-white/40' : 'text-muted-foreground'}`}>Lowercase letters, numbers, and dashes only</p>
            </motion.div>
          )}

          <motion.div variants={fadeUp} className="space-y-1.5">
            <Label htmlFor="email" className={`text-sm font-semibold ${isDark ? 'text-white/80' : ''}`}>Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className={`h-11 transition-all duration-200 ${isDark ? 'bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-white/50' : 'bg-white/80 border-border/60 focus:border-primary'}`}
            />
          </motion.div>

          <motion.div variants={fadeUp} className="space-y-1.5">
            <Label htmlFor="password" className={`text-sm font-semibold ${isDark ? 'text-white/80' : ''}`}>Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className={`h-11 transition-all duration-200 ${isDark ? 'bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-white/50' : 'bg-white/80 border-border/60 focus:border-primary'}`}
            />
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.25 }}
                className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/25 overflow-hidden"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div variants={fadeUp} className="pt-1">
            <Button
              type="submit"
              className={`w-full h-11 text-base font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 ${isDark ? 'bg-white text-foreground hover:bg-white/90' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2.5">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                  {isSignUp ? 'Creating account…' : 'Signing in…'}
                </span>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </Button>
          </motion.div>
        </form>

        <motion.div variants={fadeUp} className="mt-5 text-center">
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            className={`text-sm font-medium transition-colors underline-offset-4 hover:underline ${isDark ? 'text-white/70 hover:text-white' : 'text-primary hover:text-primary/75'}`}
          >
            {isSignUp ? 'Already have an account? Sign in →' : "Don't have an account? Sign up →"}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return (
    <div className="size-full overflow-hidden">

      {/* ══════════════════════════════════════════════
          MOBILE LAYOUT (hidden on md+)
      ══════════════════════════════════════════════ */}
      <div className="md:hidden size-full relative flex flex-col overflow-auto">

        {/* Full-screen background image */}
        <img
          src={headerBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-[center_42%] scale-105 blur-[1.5px]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/65" />

        {/* Logo + tagline */}
        <div className="relative z-10 flex flex-col items-center justify-center pt-16 pb-8 px-8 shrink-0">
          <motion.img
            src={logo}
            alt="WhereTwo"
            className="w-[190px] h-auto -my-6"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
          <motion.p
            className="text-white/90 text-base font-light tracking-wide text-center mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Let's explore the world together
          </motion.p>
          <motion.div
            className="flex items-center gap-1.5 mt-1.5 text-white/45 text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.6 }}
          >
            <MapPin className="w-3 h-3" />
            <span>AI-powered travel itineraries</span>
          </motion.div>
        </div>

        {/* Glass form card */}
        <motion.div
          className="relative z-10 mx-4 mb-8 rounded-2xl px-6 pt-7 pb-8 overflow-y-auto"
          style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.18)' }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {formContent(true)}
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════════
          DESKTOP LAYOUT (hidden on mobile)
      ══════════════════════════════════════════════ */}
      <div className="hidden md:flex size-full relative">

        {/* Full-screen background image behind both panels */}
        <img src={headerBg} alt="" className="absolute inset-0 w-full h-full object-cover object-[center_42%] scale-105 blur-[1.5px]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/40 to-black/55" />

        {/* Left panel: logo + tagline */}
        <motion.div
          className="w-[55%] relative z-10 flex flex-col items-center justify-center"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="flex flex-col items-center text-center px-14">
            <motion.img
              src={logo}
              alt="WhereTwo"
              className="w-[280px] h-auto -my-8 mb-2"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
            <motion.p
              className="text-white/90 text-2xl font-light tracking-wide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.6 }}
            >
              Let's explore the world together
            </motion.p>
            <motion.div
              className="flex items-center gap-2 mt-3 text-white/55 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75, duration: 0.6 }}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Collaborative travel planning for every destination</span>
            </motion.div>
          </div>

          <motion.div
            className="absolute bottom-6 left-0 right-0 flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <div className="text-white/40 text-xs">AI-powered itineraries</div>
          </motion.div>
        </motion.div>

        {/* Right panel: glass form */}
        <motion.div
          className="flex-1 relative z-10 flex items-center justify-center p-8 overflow-auto"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div
            className="w-full max-w-sm rounded-2xl px-8 py-10"
            style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', border: '1px solid rgba(255,255,255,0.18)' }}
          >
            {formContent(true)}
          </div>
        </motion.div>
      </div>

    </div>
  );
}
