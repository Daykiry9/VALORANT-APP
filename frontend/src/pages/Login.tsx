import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

export function Login() {
  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center relative">
      {/* Background dots grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />
      
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-[420px] bg-bg-surface border border-border-default p-10"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-accent font-display text-6xl font-bold tracking-widest custom-glitch mb-1">
            VAL
          </div>
          <div className="text-text-secondary font-mono text-[10px] uppercase tracking-[0.4em]">
            Analytics Platform
          </div>
          <div className="mt-3 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
        </div>

        <div className="space-y-3 mb-8">
          <p className="text-text-secondary font-mono text-[10px] uppercase tracking-widest text-center">
            Acceso para coaches y analistas
          </p>
        </div>

        {/* Google button */}
        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white text-black py-3 font-mono text-sm font-bold hover:bg-gray-50 transition-colors mb-4 group"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar con Google
        </button>

        {/* RSO disclaimer */}
        <div className="border-t border-border-default pt-6">
          <p className="text-text-secondary font-mono text-[9px] text-center leading-relaxed">
            Al acceder, aceptas nuestros términos de uso.<br />
            Para vincular tu cuenta Riot, se requiere autorización adicional.<br />
            <span className="text-text-secondary/50 mt-1 block">
              This product is not affiliated with or endorsed by Riot Games, Inc.
            </span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
