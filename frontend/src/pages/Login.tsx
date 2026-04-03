import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Mail, Lock, UserPlus, LogIn, ChevronRight, Target, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-6 relative overflow-hidden font-inter">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none opacity-10 bg-accent" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none opacity-5 bg-white" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-bg-surface border border-border-default p-8 md:p-12 w-full max-w-[480px] relative z-10 rounded-3xl shadow-2xl"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 flex items-center justify-center bg-accent rounded-xl mb-6 shadow-[0_0_30px_rgba(255,70,85,0.3)]">
            <Target size={24} color="#fff" strokeWidth={2.5} />
          </div>
          <h2 className="text-3xl font-rajdhani font-bold text-text-primary tracking-tight uppercase">
            Bienvenido al Comando
          </h2>
          <p className="text-text-secondary text-sm font-medium mt-1">Inicia sesión para acceder al análisis táctico.</p>
        </div>

        <AnimatePresence mode="wait">
          {method === 'google' ? (
            <motion.div key="google" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-text-primary text-bg-base py-4 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>Continuar con Google</span>
                  </>
                )}
              </button>
              <button 
                onClick={() => setMethod('email')}
                className="w-full text-text-secondary text-xs font-semibold py-2 hover:text-text-primary transition-all flex items-center justify-center gap-2"
              >
                 o usar correo electrónico <ArrowRight size={14} />
              </button>
            </motion.div>
          ) : (
            <motion.form key="email" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-text-secondary ml-1">Email OPS</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                  <input 
                    type="email" placeholder="nombre@equipo.com" required
                    className="w-full bg-bg-elevated border border-border-default rounded-xl pl-12 pr-4 py-4 text-sm text-text-primary outline-none focus:border-accent transition-all"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-text-secondary ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                  <input 
                    type="password" placeholder="••••••••" required
                    className="w-full bg-bg-elevated border border-border-default rounded-xl pl-12 pr-4 py-4 text-sm text-text-primary outline-none focus:border-accent transition-all"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              
              <button 
                type="submit" disabled={loading}
                className="w-full bg-accent text-white py-4 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,70,85,0.2)]"
              >
                {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Crear Cuenta' : 'Log in')}
              </button>

              <div className="flex flex-col items-center gap-4 mt-6 pt-6 border-t border-border-default">
                 <button 
                   type="button" onClick={() => setIsSignUp(!isSignUp)}
                   className="text-xs font-semibold text-accent hover:underline"
                 >
                   {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
                 </button>
                 <button 
                   type="button" onClick={() => setMethod('google')}
                   className="text-xs font-semibold text-text-secondary hover:text-text-primary transition-all"
                 >
                   Volver a Google
                 </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-12 text-center">
          <p className="text-[10px] text-text-secondary uppercase tracking-[0.2em] leading-relaxed opacity-50">
            Secure Tactical Infrastructure<br />
            © 2026 VAL Analytics
          </p>
        </div>
      </motion.div>
    </div>
  );
}
