import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Mail, Lock, UserPlus, LogIn, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export function Login() {
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<'google' | 'email'>('google');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success('Check your email for confirmation!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-6 relative overflow-hidden font-body">
      {/* Visual background flair */}
      <div className="absolute inset-0 z-0 opacity-10">
         <div className="absolute top-0 left-0 w-full h-1 bg-accent animate-pulse" />
         <div className="absolute top-0 left-1/4 w-[1px] h-full bg-accent/20" />
         <div className="absolute top-0 left-2/4 w-[1px] h-full bg-accent/20" />
         <div className="absolute top-0 left-3/4 w-[1px] h-full bg-accent/20" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-bg-surface border border-border-default p-10 w-full max-w-[420px] relative z-10 shadow-2xl"
      >
        <div className="text-center mb-10">
          <div className="text-accent font-rajdhani text-6xl font-bold tracking-tighter mb-2 custom-glitch">
            VAL
          </div>
          <div className="text-text-secondary font-mono text-[10px] uppercase tracking-[0.3em]">
            TACTICAL ANALYTICS PLATFORM
          </div>
        </div>

        <AnimatePresence mode="wait">
          {method === 'google' ? (
            <motion.div key="google" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-4 bg-white text-black py-4 font-mono text-sm font-bold hover:bg-accent hover:text-white transition-all group disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>CONTINUE WITH GOOGLE</span>
                  </>
                )}
              </button>
              <button 
                onClick={() => setMethod('email')}
                className="w-full mt-4 text-text-secondary font-mono text-[10px] uppercase hover:text-white transition-colors"
              >
                OR USE EMAIL REDACTED OPS
              </button>
            </motion.div>
          ) : (
            <motion.form key="email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleEmailAuth} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                <input 
                  type="email" placeholder="COACH_EMAIL@HQ.NET" required
                  className="w-full bg-bg-base border border-border-default pl-12 pr-4 py-3 font-mono text-sm text-white outline-none focus:border-accent"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                <input 
                  type="password" placeholder="OPS_PASSWORD" required
                  className="w-full bg-bg-base border border-border-default pl-12 pr-4 py-3 font-mono text-sm text-white outline-none focus:border-accent"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              <button 
                type="submit" disabled={loading}
                className="w-full bg-accent text-white py-4 font-mono font-bold text-sm hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? <><UserPlus size={18} /> CREATE OPS ACCOUNT</> : <><LogIn size={18} /> INITIATE SESSION</>)}
              </button>

              <div className="flex justify-between items-center px-1">
                 <button 
                   type="button" onClick={() => setIsSignUp(!isSignUp)}
                   className="text-[10px] font-mono text-accent uppercase hover:underline"
                 >
                   {isSignUp ? 'Already have access?' : 'Request new ops access'}
                 </button>
                 <button 
                   type="button" onClick={() => setMethod('google')}
                   className="text-[10px] font-mono text-text-secondary uppercase hover:text-white"
                 >
                   Back to Intel
                 </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-8 flex items-center gap-4 text-text-secondary opacity-30">
          <div className="h-[1px] flex-1 bg-white" />
          <span className="font-mono text-[10px]">SECURE OPS</span>
          <div className="h-[1px] flex-1 bg-white" />
        </div>

        <p className="text-center text-text-secondary font-mono text-[9px] mt-8 uppercase tracking-widest leading-relaxed">
          Operational Security Warning:<br />
          This platform is for competitive analysis only. 
          Not affiliated with Riot Games, Inc.
        </p>
      </motion.div>
    </div>
  );
}
