import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, Check, X, Shield, Zap, Moon, Sun, Target, Brain,
  BarChart2, Upload, Users, ChevronDown, ArrowRight, Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
const DARK = {
  bg: '#080809',
  bgCard: '#111114',
  bgAlt: '#0D0D10',
  border: 'rgba(255,255,255,0.06)',
  text: '#F5F5FA',
  textSub: '#8A8A9E',
  accent: '#FF4655',
  accentGlow: 'rgba(255,70,85,0.15)',
};

const LIGHT = {
  bg: '#F7F7FA',
  bgCard: '#FFFFFF',
  bgAlt: '#EEEEF3',
  border: 'rgba(0,0,0,0.08)',
  text: '#0D0D10',
  textSub: '#6B6B7E',
  accent: '#E8323F',
  accentGlow: 'rgba(232,50,63,0.12)',
};

export function LandingPage({ onEnter }: { onEnter: () => void }) {
  const [dark, setDark] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const tk = dark ? DARK : LIGHT;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navBg = scrolled
    ? dark ? 'rgba(8,8,9,0.92)' : 'rgba(247,247,250,0.92)'
    : 'transparent';

  return (
    <div style={{ background: tk.bg, color: tk.text }} className="min-h-screen transition-colors duration-300 font-sans selection:bg-red-500 selection:text-white overflow-x-hidden">

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 w-full h-16 z-[100] flex items-center justify-between px-6 md:px-12 transition-all duration-300"
        style={{
          background: navBg,
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          borderBottom: scrolled ? `1px solid ${tk.border}` : '1px solid transparent',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 flex items-center justify-center" style={{ background: tk.accent, borderRadius: 4 }}>
            <Target size={14} color="#fff" strokeWidth={2.5} />
          </div>
          <span className="font-rajdhani font-bold text-xl tracking-tight" style={{ color: tk.text }}>
            VAL<span className="font-light" style={{ color: tk.textSub }}>ANALYTICS</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-[12px] font-medium" style={{ color: tk.textSub }}>
          {['Features', 'How it works', 'Pricing', 'FAQ'].map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`}
              className="hover:text-red-500 transition-colors">{item}</a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setDark(!dark)}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-all"
            style={{ background: tk.bgCard, border: `1px solid ${tk.border}` }}
          >
            {dark ? <Sun size={15} style={{ color: tk.textSub }} /> : <Moon size={15} style={{ color: tk.textSub }} />}
          </button>
          <button
            onClick={onEnter}
            className="hidden md:block text-sm font-medium px-2 py-1 transition-colors hover:text-red-500"
            style={{ color: tk.textSub }}
          >
            Log in
          </button>
          <button
            onClick={onEnter}
            className="flex items-center gap-2 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-all hover:scale-[1.03]"
            style={{ background: tk.accent }}
          >
            Get Started <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-16 overflow-hidden">
        {/* Glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none"
          style={{ background: dark ? 'rgba(255,70,85,0.06)' : 'rgba(255,70,85,0.04)' }} />

        {/* Grid overlay */}
        {dark && (
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.4) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
        )}

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 max-w-4xl"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-medium mb-8 tracking-widest uppercase"
            style={{ background: `${tk.accent}18`, border: `1px solid ${tk.accent}30`, color: tk.accent }}
          >
            <Sparkles size={12} />
            Powered by Gemini 2.0 Flash Vision AI
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-rajdhani font-bold leading-[1] tracking-tight mb-6" style={{ color: tk.text }}>
            Stop guessing.<br />
            <span style={{ color: tk.accent }}>Start winning</span><br />
            with your own data.
          </h1>

          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: tk.textSub }}>
            Upload your scrim screenshots or connect your match history. VAL Analytics processes and visualizes every round into actionable coaching intelligence — built for Premier, Challengers, and Semi-Pro teams.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <button
              onClick={onEnter}
              className="flex items-center gap-2 text-white font-semibold px-8 py-4 rounded-xl text-base transition-all hover:scale-[1.03] hover:shadow-2xl"
              style={{ background: tk.accent, boxShadow: `0 0 30px ${tk.accentGlow}` }}
            >
              Create Your Team <ChevronRight size={18} />
            </button>
            <button
              className="flex items-center gap-2 font-semibold px-8 py-4 rounded-xl text-base transition-all"
              style={{ background: tk.bgCard, color: tk.text, border: `1px solid ${tk.border}` }}
              onClick={onEnter}
            >
              View Dashboard Demo
            </button>
          </div>

          {/* Hero Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="relative mx-auto max-w-5xl"
          >
            <div className="rounded-2xl overflow-hidden border"
              style={{ background: tk.bgCard, borderColor: tk.border, boxShadow: `0 40px 80px rgba(0,0,0,${dark ? 0.5 : 0.12})` }}>
              {/* Fake browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: tk.border, background: dark ? '#0A0A0C' : '#F0F0F5' }}>
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <div className="flex-1 mx-4 text-[11px] text-center font-mono rounded px-3 py-1"
                  style={{ background: dark ? '#111114' : '#E4E4ED', color: tk.textSub }}>
                  app.valanalytics.gg/dashboard
                </div>
                <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: tk.accentGlow }}>
                  <Target size={12} style={{ color: tk.accent }} />
                </div>
              </div>

              {/* Fake dashboard body */}
              <div className="grid grid-cols-12 gap-0 p-4 md:p-0" style={{ background: dark ? '#0D0D10' : '#F7F7FA' }}>
                {/* Sidebar */}
                <div className="hidden md:flex col-span-2 flex-col gap-2 p-4 border-r" style={{ borderColor: tk.border, background: dark ? '#0A0A0C' : '#F0F0F5' }}>
                  {['Dashboard', 'Analytics', 'Scrims', 'Players', 'Reports'].map((item, i) => (
                    <div key={item} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium transition-all"
                      style={{
                        background: i === 0 ? `${tk.accent}18` : 'transparent',
                        color: i === 0 ? tk.accent : tk.textSub,
                      }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: i === 0 ? tk.accent : 'transparent', border: i === 0 ? 'none' : `1px solid ${tk.border}` }} />
                      {item}
                    </div>
                  ))}
                </div>

                {/* Main content */}
                <div className="col-span-12 md:col-span-10 p-4 grid grid-cols-3 gap-3">
                  {[
                    { label: 'Scrims Logged', value: '—', trend: 'Link account to sync', red: false },
                    { label: 'Win Rate', value: '—', trend: 'Upload scrims to calculate', red: false },
                    { label: 'Top Agent', value: '—', trend: 'Based on your team data', red: false },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl p-4 border" style={{ background: tk.bgCard, borderColor: tk.border }}>
                      <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: tk.textSub }}>{stat.label}</div>
                      <div className="text-2xl font-rajdhani font-bold" style={{ color: tk.text }}>{stat.value}</div>
                      <div className="text-[10px] mt-1" style={{ color: tk.textSub }}>{stat.trend}</div>
                    </div>
                  ))}
                  {/* Chart placeholder */}
                  <div className="col-span-3 rounded-xl p-4 border" style={{ background: tk.bgCard, borderColor: tk.border }}>
                    <div className="text-[11px] font-medium mb-3" style={{ color: tk.textSub }}>Round Win/Loss Breakdown (per Scrim)</div>
                    <div className="flex items-end gap-1.5 h-16">
                      {[55, 70, 45, 80, 60, 90, 50, 75, 65, 85, 40, 88].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t-sm transition-all" style={{
                          height: `${h}%`,
                          background: i % 3 === 0 ? tk.accent : dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
                        }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-[11px] font-mono uppercase tracking-[0.25em] mb-4" style={{ color: tk.accent }}>// How it works</div>
            <h2 className="text-4xl md:text-5xl font-rajdhani font-bold" style={{ color: tk.text }}>
              From screenshot to insight<br />in under 30 seconds
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', icon: <Upload size={24} />, title: 'Upload or Connect', desc: 'Drop any Valorant scoreboard screenshot — no specific format required. Or link your account for automatic official match sync.' },
              { step: '02', icon: <Brain size={24} />, title: 'AI Processes Everything', desc: 'Gemini Vision AI reads the image, extracts player stats, round data, and map info regardless of screenshot type or crop.' },
              { step: '03', icon: <BarChart2 size={24} />, title: 'Coach with Data', desc: 'Review player performance trends, round breakdowns, agent picks, and AI-generated tactical recommendations for your next session.' },
            ].map((item) => (
              <motion.div
                key={item.step}
                whileHover={{ y: -4 }}
                className="p-8 rounded-2xl border transition-all"
                style={{ background: tk.bgCard, borderColor: tk.border }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ background: `${tk.accent}18`, color: tk.accent }}>
                  {item.icon}
                </div>
                <div className="text-[10px] font-mono mb-2" style={{ color: tk.accent }}>STEP {item.step}</div>
                <h3 className="text-xl font-rajdhani font-bold mb-3" style={{ color: tk.text }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: tk.textSub }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────────────── */}
      <section id="features" className="py-28 px-6" style={{ background: dark ? tk.bgAlt : tk.bgAlt }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-[11px] font-mono uppercase tracking-[0.25em] mb-4" style={{ color: tk.accent }}>// Everything you need</div>
            <h2 className="text-4xl md:text-5xl font-rajdhani font-bold" style={{ color: tk.text }}>
              Built for coaches.<br />
              <span style={{ color: tk.accent }}>Trusted by players.</span>
            </h2>
            <p className="text-base mt-4 max-w-xl mx-auto" style={{ color: tk.textSub }}>
              Every feature was designed around real coaching workflows, not hypothetical use cases.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { icon: <Upload size={20} />, title: 'Flexible Screenshot Import', desc: 'Any format, any crop. Our Gemini Vision AI understands scoreboard and timeline screenshots whether from in-game, OBS, or your phone camera.' },
              { icon: <Brain size={20} />, title: 'AI Tactical Feedback', desc: 'After each scrim, get a structured debrief: the central tactical problem, standout player performance, and one concrete action for next session.' },
              { icon: <BarChart2 size={20} />, title: 'Round Timeline Analysis', desc: 'Upload the Timeline view to extract which team won each round and how — eliminations, spike detonations, or defuses.' },
              { icon: <Target size={20} />, title: 'Player Performance Tracking', desc: 'Track ACS, KDA, First Bloods, First Deaths, and KAST across all your scrims and official matches in one place.' },
              { icon: <Users size={20} />, title: 'Team & Scrim Management', desc: 'Organize multiple scrims, tag opponents, assign map bans, and track your overall record over time.' },
              { icon: <Shield size={20} />, title: 'Privacy First', desc: 'Your match data is only visible to your team. We will never share, sell, or use your tactical information for any other purpose.' },
            ].map((feat, i) => (
              <motion.div
                key={feat.title}
                whileHover={{ scale: 1.01 }}
                className="flex gap-5 p-6 rounded-2xl border transition-all"
                style={{ background: tk.bgCard, borderColor: tk.border }}
              >
                <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: `${tk.accent}18`, color: tk.accent }}>
                  {feat.icon}
                </div>
                <div>
                  <h3 className="font-rajdhani font-bold text-lg mb-1" style={{ color: tk.text }}>{feat.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: tk.textSub }}>{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-[11px] font-mono uppercase tracking-[0.25em] mb-4" style={{ color: tk.accent }}>// Pricing</div>
            <h2 className="text-4xl md:text-5xl font-rajdhani font-bold" style={{ color: tk.text }}>Simple, honest plans</h2>
            <p className="mt-3 text-sm" style={{ color: tk.textSub }}>No contracts. No hidden fees. Cancel anytime.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <PricingCard tk={tk} dark={dark} tier="SCOUT" price="Free" desc="Get started at no cost" feats={['Up to 10 Scrims', 'Player Stats View', '1 Team', 'Screenshot Upload']} locks={['AI Tactical Feedback', 'Timeline Analysis', 'PDF Reports']} onEnter={onEnter} />
            <PricingCard tk={tk} dark={dark} tier="RISING" price="$19" freq="/mo" desc="For ambitious amateur teams" feats={['Up to 50 Scrims', 'Full Player Stats', 'AI Tactical Feedback', '3 Team Members']} locks={['PDF Reports']} onEnter={onEnter} />
            <PricingCard tk={tk} dark={dark} tier="PREMIER" price="$49" freq="/mo" desc="The complete coaching suite" active feats={['Unlimited Scrims', 'AI Tactical Feedback', 'Timeline Analysis', 'PDF Tactical Reports', '10 Team Members']} onEnter={onEnter} />
            <PricingCard tk={tk} dark={dark} tier="ORG" price="Custom" desc="For multi-roster organizations" feats={['Everything in Premier', 'Multiple Rosters', 'Priority Support', 'API Access', 'Custom Onboarding']} contact onEnter={onEnter} />
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-28 px-6" style={{ background: dark ? tk.bgAlt : tk.bgAlt }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-[11px] font-mono uppercase tracking-[0.25em] mb-4" style={{ color: tk.accent }}>// FAQ</div>
            <h2 className="text-4xl font-rajdhani font-bold" style={{ color: tk.text }}>Common Questions</h2>
          </div>
          {[
            { q: 'Is a Riot account required?', a: 'No. You can use the Scrim Tracker immediately by uploading scoreboard screenshots — no account linking needed. Official match auto-sync requires RSO linking, which is optional.' },
            { q: 'What image formats does it support?', a: 'Any standard image format (PNG, JPEG, WebP). You can upload full-screen captures, cropped scoreboard images, or phone photos of your monitor — Gemini Vision AI handles any crop or resolution.' },
            { q: 'Is my team data private?', a: 'Yes. Your data is only visible to the members you invite to your team. We do not share, sell, or analyze your data for any external purpose.' },
            { q: 'Is this affiliated with Riot Games?', a: 'No. VAL Analytics is an independent third-party tool. VALORANT and all related marks are property of Riot Games, Inc. We are applying for a Riot Games Production API Key to improve data quality.' },
            { q: 'What happens if I hit the scrim limit?', a: 'You will be notified as you approach the limit and can upgrade at any time. Existing data is always preserved regardless of plan.' },
          ].map((faq, i) => (
            <div key={i} className="mb-3 rounded-xl border overflow-hidden transition-all" style={{ background: tk.bgCard, borderColor: activeFaq === i ? tk.accent : tk.border }}>
              <button
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-semibold" style={{ color: tk.text }}>{faq.q}</span>
                <ChevronDown size={18} style={{ color: tk.accent, transform: activeFaq === i ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
              </button>
              <AnimatePresence>
                {activeFaq === i && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed" style={{ color: tk.textSub }}>{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="rounded-3xl p-12 border relative overflow-hidden"
            style={{ background: tk.bgCard, borderColor: tk.border }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 0%, ${tk.accentGlow} 0%, transparent 70%)` }} />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-rajdhani font-bold mb-4" style={{ color: tk.text }}>
                Ready to take the<br /><span style={{ color: tk.accent }}>commander's seat?</span>
              </h2>
              <p className="text-base mb-8" style={{ color: tk.textSub }}>
                Start for free. Your first 10 scrims are on us.
              </p>
              <button
                onClick={onEnter}
                className="inline-flex items-center gap-2 text-white font-semibold px-10 py-4 rounded-xl text-base transition-all hover:scale-[1.03]"
                style={{ background: tk.accent }}
              >
                Create Your Free Team <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="border-t px-6 py-12" style={{ borderColor: tk.border, background: dark ? tk.bgAlt : '#EEEEF3' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-8 mb-12">
            <div className="max-w-xs">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 flex items-center justify-center rounded" style={{ background: tk.accent }}>
                  <Target size={12} color="#fff" />
                </div>
                <span className="font-rajdhani font-bold text-lg" style={{ color: tk.text }}>VAL<span className="font-light" style={{ color: tk.textSub }}>ANALYTICS</span></span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: tk.textSub }}>
                Competitive analytics for Valorant coaches. Turn your scrims into structured insights.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8">
              {[
                { title: 'Product', links: ['Features', 'Pricing', 'FAQ'] },
                { title: 'Legal', links: ['Privacy Policy', 'Terms of Service'] },
              ].map((col) => (
                <div key={col.title}>
                  <div className="font-semibold text-sm mb-4" style={{ color: tk.text }}>{col.title}</div>
                  {col.links.map((link) => (
                    <a key={link} href="#" className="block text-sm mb-2 hover:text-red-500 transition-colors" style={{ color: tk.textSub }}>{link}</a>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="border-t pt-8 text-[11px] text-center space-y-1" style={{ borderColor: tk.border, color: tk.textSub }}>
            <p>VAL Analytics is an independent tool. Not affiliated with or endorsed by Riot Games, Inc.</p>
            <p>VALORANT™ and all related marks are trademarks of Riot Games, Inc.</p>
            <p className="mt-2">© 2026 VAL Analytics. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Background animations CSS */}
      <style>{`
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 25s linear infinite; }
      `}</style>
    </div>
  );
}

// ─── PRICING CARD ────────────────────────────────────────────────────────────
function PricingCard({ tk, dark, tier, price, freq, desc, feats, locks = [], active = false, contact = false, onEnter }: any) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="flex flex-col p-7 rounded-2xl border transition-all"
      style={{
        background: active ? (dark ? '#1A0A0D' : '#FFF0F1') : tk.bgCard,
        borderColor: active ? tk.accent : tk.border,
        boxShadow: active ? `0 0 40px ${tk.accentGlow}` : 'none',
      }}
    >
      {active && (
        <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] mb-4 px-2 py-1 rounded-full self-start"
          style={{ background: `${tk.accent}20`, color: tk.accent }}>
          Most Popular
        </div>
      )}
      <div className="mb-1 text-[11px] font-mono uppercase tracking-widest" style={{ color: tk.accent }}>{tier}</div>
      <div className="text-3xl font-rajdhani font-bold mb-1" style={{ color: tk.text }}>
        {price}<span className="text-sm font-normal" style={{ color: tk.textSub }}>{freq}</span>
      </div>
      <div className="text-xs mb-6" style={{ color: tk.textSub }}>{desc}</div>

      <div className="space-y-3 flex-1 mb-7">
        {feats.map((f: string) => (
          <div key={f} className="flex items-start gap-2.5 text-sm" style={{ color: tk.text }}>
            <Check size={14} style={{ color: tk.accent, flexShrink: 0, marginTop: 2 }} /> {f}
          </div>
        ))}
        {locks.map((f: string) => (
          <div key={f} className="flex items-start gap-2.5 text-sm line-through opacity-35" style={{ color: tk.textSub }}>
            <X size={14} style={{ flexShrink: 0, marginTop: 2 }} /> {f}
          </div>
        ))}
      </div>

      <button
        onClick={onEnter}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
        style={{
          background: active ? tk.accent : `${tk.accent}18`,
          color: active ? '#fff' : tk.accent,
        }}
      >
        {contact ? 'Contact Us' : active ? 'Get Started' : 'Start Free'}
      </button>
    </motion.div>
  );
}
