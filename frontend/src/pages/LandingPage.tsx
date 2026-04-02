import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import { 
  Play, 
  ChevronRight, 
  Check, 
  X, 
  Shield, 
  TrendingUp, 
  Zap, 
  Globe, 
  Plus, 
  ChevronDown,
  LayoutDashboard,
  FileText,
  Search,
  Users
} from 'lucide-react';
import { cn } from '../lib/utils';

// --- Translation Mock (Switch between internal state or i18next later) ---
const TRANSLATIONS = {
  en: {
    hero_title: "Your team plays to win.\nStart analyzing like the pros.",
    hero_sub: "Track scrims, analyze official matches, and get AI tactical insights for better decision making. For Premier, Challengers, and Semi-Pro teams.",
    cta_free: "Create Team Free",
    cta_demo: "View Demo",
    nav_features: "Features",
    nav_pricing: "Pricing",
    nav_faq: "FAQ",
    features_header: "Professional Analysis\nfor teams that mean business",
    pricing_header: "Plans for every competitive level",
    premier_badge: "MOST POPULAR",
  },
  es: {
    hero_title: "Tu equipo juega para ganar.\nAnaliza como los profesionales.",
    hero_sub: "Trackea scrims, analiza partidas oficiales y obtén insights de IA. Diseñado para equipos de Premier, Challengers y semiprofesionales.",
    cta_free: "Crear Equipo Gratis",
    cta_demo: "Ver Demo",
    nav_features: "Funciones",
    nav_pricing: "Precios",
    nav_faq: "FAQ",
    features_header: "Análisis Profesional\npara equipos que van en serio",
    pricing_header: "Planes para cada nivel competitivo",
    premier_badge: "MÁS POPULAR",
  }
};

export function LandingPage({ onEnter }: { onEnter: () => void }) {
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const [scrolled, setScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#080809] text-[#F5F5FA] font-sans selection:bg-accent selection:text-white">
      {/* NAVBAR */}
      <nav className={cn(
        "fixed top-0 left-0 w-full h-[64px] z-[100] transition-all duration-300 px-8 flex items-center justify-between border-b border-transparent",
        scrolled ? "bg-[#0A0A0C]/90 backdrop-blur-md border-white/5" : "bg-transparent"
      )}>
        <div className="flex items-center gap-2">
          <span className="text-accent font-rajdhani text-2xl font-bold tracking-tighter">VAL</span>
          <span className="font-rajdhani text-2xl font-light tracking-widest">ANALYTICS</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-[11px] font-mono uppercase tracking-[0.2em] text-text-secondary">
          <a href="#features" className="hover:text-accent transition-colors">{t.nav_features}</a>
          <a href="#pricing" className="hover:text-accent transition-colors">{t.nav_pricing}</a>
          <a href="#faq" className="hover:text-accent transition-colors">{t.nav_faq}</a>
        </div>

        <div className="flex items-center gap-4">
           <button 
             onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
             className="text-[10px] font-mono border border-border-default px-2 py-1 hover:border-accent"
           >
             {lang.toUpperCase()}
           </button>
           <button className="text-sm font-mono text-text-secondary hover:text-white transition-colors">LOG IN</button>
           <button 
             onClick={onEnter}
             className="bg-accent text-white px-5 py-2 font-rajdhani font-bold text-sm tracking-widest hover:bg-white hover:text-black transition-all"
           >
             GET STARTED FREE
           </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent" />
        <div className="absolute inset-0 z-1 opacity-20 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070')] bg-cover bg-center grayscale mix-blend-overlay" />
        <div className="absolute inset-0 z-2 bg-[#080809]/90" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-5xl"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 px-4 py-1 rounded-full mb-8"
          >
            <Zap size={14} className="text-accent" />
            <span className="text-[10px] font-mono text-accent uppercase tracking-widest">Powered by Gemini 2.5 Flash Táctico</span>
          </motion.div>
          
          <h1 className="text-5xl md:text-8xl font-rajdhani font-bold text-white mb-6 leading-[0.95] tracking-tight whitespace-pre-line">
            {t.hero_title}
          </h1>
          
          <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            {t.hero_sub}
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <button 
              onClick={onEnter}
              className="w-full md:w-auto bg-accent text-white px-10 py-5 font-rajdhani font-bold text-xl tracking-widest hover:bg-white hover:text-black transition-all group overflow-hidden relative"
            >
              <span className="relative z-10 flex items-center gap-2">
                {t.cta_free} <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <button className="w-full md:w-auto border border-white/10 px-10 py-5 font-rajdhani font-bold text-xl tracking-widest hover:bg-white/5 transition-all text-white flex items-center justify-center gap-2">
              <Play size={18} fill="currentColor" /> {t.cta_demo}
            </button>
          </div>

          {/* Hero Stats */}
          <div className="grid grid-cols-3 gap-8 mt-24">
             <div className="text-center">
                <div className="text-3xl md:text-5xl font-rajdhani font-bold text-white"><CountUp end={12000} duration={3} />+</div>
                <div className="text-[10px] font-mono text-text-secondary uppercase tracking-[0.2em] mt-2">Scrims Tracked</div>
             </div>
             <div className="text-center">
                <div className="text-3xl md:text-5xl font-rajdhani font-bold text-accent"><CountUp end={540000} duration={3} />+</div>
                <div className="text-[10px] font-mono text-text-secondary uppercase tracking-[0.2em] mt-2">Rounds Analyzed</div>
             </div>
             <div className="text-center">
                <div className="text-3xl md:text-5xl font-rajdhani font-bold text-white">99.4%</div>
                <div className="text-[10px] font-mono text-text-secondary uppercase tracking-[0.2em] mt-2">Coach Satisfaction</div>
             </div>
          </div>
        </motion.div>
      </section>

      {/* MARQUEE */}
      <div className="w-full border-y border-white/5 py-8 overflow-hidden bg-white/[0.02]">
        <div className="flex items-center gap-12 whitespace-nowrap animate-marquee">
          {['Team Liquid', 'LOUD', 'KRÜ Esports', 'Leviatán', 'Sentinels', 'Fnatic', 'T1', 'Gen.G'].map((team, i) => (
            <div key={i} className="flex items-center gap-4 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
              <Shield size={20} className="text-accent" />
              <span className="text-xl font-rajdhani font-bold text-white tracking-widest uppercase">{team}</span>
            </div>
          ))}
          {/* Duplicate for infinite effect */}
          {['Team Liquid', 'LOUD', 'KRÜ Esports', 'Leviatán', 'Sentinels', 'Fnatic', 'T1', 'Gen.G'].map((team, i) => (
            <div key={i + 10} className="flex items-center gap-4 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
              <Shield size={20} className="text-accent" />
              <span className="text-xl font-rajdhani font-bold text-white tracking-widest uppercase">{team}</span>
            </div>
          ))}
        </div>
      </div>

      {/* PROBLEM SECTION */}
      <section id="problem" className="py-24 px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
           <h2 className="text-5xl md:text-6xl font-rajdhani font-bold text-white mb-8 leading-tight uppercase">
             Excel is for taxes.<br />
             <span className="text-accent">Data is for winning.</span>
           </h2>
           <p className="text-xl text-text-secondary mb-8 leading-relaxed">
             Stop letting your match data rot in a spreadsheet. We turn chaotic screenshots and API raw data into tactical weapons. Every death, every round, every trend analyzed.
           </p>
           <ul className="space-y-4">
             {[
               "Auto-ingest from Riot API and OCR",
               "AI Tactical Analysis in real-time",
               "Role Benchmarking vs VCT Pro level",
               "VOD Sync & Round Breakdown"
             ].map((item, i) => (
               <li key={i} className="flex items-center gap-3 text-white font-mono text-xs uppercase tracking-widest">
                 <div className="w-1.5 h-1.5 bg-accent" /> {item}
               </li>
             ))}
           </ul>
        </div>
        <div className="relative group">
           <div className="absolute -inset-1 bg-gradient-to-r from-accent to-accent-secondary opacity-20 blur-2xl group-hover:opacity-40 transition-opacity" />
           <div className="bg-[#111114] border border-white/5 relative z-10 p-2">
              <img 
                src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070" 
                alt="Dashboard Preview" 
                className="w-full opacity-80"
              />
           </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-24 px-8 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto text-center mb-16">
           <h2 className="text-5xl font-rajdhani font-bold text-white uppercase mb-4">{t.pricing_header}</h2>
           <p className="text-text-secondary font-mono text-[10px] uppercase tracking-widest">No contracts. Cancel anytime.</p>
        </div>
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <PricingCard 
             tier="SCOUT" 
             price="0" 
             desc="Just a taste" 
             feats={["15 Scrims/mo", "Basic Player Stats", "Map Winrate", "1 User"]}
             locks={["AI Tactical Insights", "Round Breakdown", "RSO Sync"]}
           />
           <PricingCard 
             tier="RISING" 
             price="19" 
             desc="For amateur teams" 
             feats={["60 Scrims/mo", "Advanced Stats", "Rival Intelligence", "3 Users"]}
             locks={["AI Tactical Insights", "RSO Auto-Sync"]}
           />
           <PricingCard 
             tier="PREMIER" 
             price="49" 
             desc="The pro choice" 
             active={true}
             feats={["180 Scrims/mo", "⚡ Full AI Analysis", "RSO Match Sync", "Round Breakdown", "8 Users"]}
           />
           <PricingCard 
             tier="FRANCHISE" 
             price="149" 
             desc="For organizations" 
             contact={true}
             feats={["Unlimited Scrims", "PDF Tactical Reports", "API Access", "Unlimited Users", "Multi-Roster Support"]}
           />
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-24 px-8 max-w-3xl mx-auto">
        <h2 className="text-4xl font-rajdhani font-bold text-white text-center mb-12 uppercase tracking-widest">FAQ. OPS INTEL.</h2>
        <div className="space-y-4">
           {[
             { q: "Is a Riot account required?", a: "No. You can use the Scrim Tracker by uploading screenshots without linking a Riot account. However, official match sync requires RSO linking." },
             { q: "What happens if I exceed the limit?", a: "We notify you as you approach the limit. You can upgrade anytime or wait for the next billing cycle." },
             { q: "Is my data private?", a: "Yes. Your data is only visible to your team members. We never share or sell match intel." }
           ].map((faq, i) => (
             <div key={i} className="bg-[#111114] border border-white/5 overflow-hidden">
                <button 
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 hover:bg-white/[0.02] transition-colors"
                >
                   <span className="font-rajdhani font-bold text-lg text-white uppercase tracking-wider">{faq.q}</span>
                   <ChevronDown size={20} className={cn("text-accent transition-transform", activeFaq === i && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {activeFaq === i && (
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="px-6 pb-6 text-text-secondary text-sm leading-relaxed font-sans"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
           ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0A0A0C] border-t border-white/5 pt-20 pb-8 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-accent font-rajdhani text-2xl font-bold tracking-tighter">VAL</span>
              <span className="font-rajdhani text-2xl font-light tracking-widest">ANALYTICS</span>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed max-w-sm mb-6 font-sans">
              Competitive analytics for Valorant teams. Built for coaches who believe that data is the shortest path to a Major.
            </p>
          </div>
          <div className="space-y-4">
             <div className="text-white font-rajdhani font-bold uppercase tracking-widest text-sm mb-6">INTEL</div>
             <a href="#features" className="block text-text-secondary hover:text-accent transition-colors text-xs font-mono">FEATURES</a>
             <a href="#pricing" className="block text-text-secondary hover:text-accent transition-colors text-xs font-mono">PRICING</a>
             <a href="#faq" className="block text-text-secondary hover:text-accent transition-colors text-xs font-mono">FAQ</a>
          </div>
          <div className="space-y-4">
             <div className="text-white font-rajdhani font-bold uppercase tracking-widest text-sm mb-6">LEGAL</div>
             <a href="#" className="block text-text-secondary hover:text-accent transition-colors text-xs font-mono">PRIVACY POLICY</a>
             <a href="#" className="block text-text-secondary hover:text-accent transition-colors text-xs font-mono">TERMS OF SERVICE</a>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto border-t border-white/5 pt-8 text-[10px] text-text-secondary font-mono text-center space-y-4">
           <p className="opacity-50">THIS PRODUCT IS NOT AFFILIATED WITH OR ENDORSED BY RIOT GAMES, INC.</p>
           <p className="opacity-50 uppercase">VALORANT AND RIOT GAMES ARE TRADEMARKS OF RIOT GAMES, INC.</p>
           <p>&copy; 2026 VAL ANALYTICS OPS. ALL SYSTEMS GO.</p>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .custom-glitch { animation: glitch 2s infinite; }
        @keyframes glitch {
          0% { text-shadow: 2px 2px #ff4655; }
          25% { text-shadow: -2px -2px #00d4aa; }
          50% { text-shadow: 2px -2px #ff4655; }
          75% { text-shadow: -2px 2px #00d4aa; }
          100% { text-shadow: 2px 2px #ff4655; }
        }
      `}} />
    </div>
  );
}

function PricingCard({ tier, price, desc, feats, locks = [], active = false, contact = false }: any) {
  return (
    <div className={cn(
      "relative bg-[#111114] border p-8 flex flex-col group transition-all duration-300",
      active ? "border-accent shadow-[0_0_40px_rgba(255,70,85,0.15)] scale-[1.02] z-10" : "border-white/5 hover:border-white/10"
    )}>
      {active && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-white px-4 py-1 text-[8px] font-mono font-bold tracking-[0.2em] uppercase">
          MOST POPULAR
        </div>
      )}
      
      <div className="mb-8">
        <h3 className="font-rajdhani font-bold text-2xl text-white tracking-widest uppercase mb-1">{tier}</h3>
        <p className="text-text-secondary text-[10px] font-mono uppercase tracking-widest">{desc}</p>
      </div>

      <div className="mb-8 flex items-baseline gap-1">
        <span className="text-4xl font-rajdhani font-bold text-white tracking-tighter">
          {contact ? "CUSTOM" : `$${price}`}
        </span>
        {!contact && <span className="text-text-secondary text-sm font-mono uppercase">/mo</span>}
      </div>

      <div className="space-y-4 mb-10 flex-1">
        {feats.map((f: string, i: number) => (
          <div key={i} className="flex items-center gap-3 text-[11px] font-mono text-white/80">
            <Check size={14} className="text-accent" /> {f}
          </div>
        ))}
        {locks.map((f: string, i: number) => (
          <div key={i} className="flex items-center gap-3 text-[11px] font-mono text-text-secondary line-through opacity-40">
            <X size={14} /> {f}
          </div>
        ))}
      </div>

      <button className={cn(
        "w-full py-4 font-rajdhani font-bold tracking-[0.2em] text-xs transition-all",
        active ? "bg-accent text-white hover:bg-white hover:text-black" : "bg-white/5 text-white hover:bg-white hover:text-black"
      )}>
        {contact ? "CONTACT OPS" : "SELECT PLAN"}
      </button>
    </div>
  );
}
