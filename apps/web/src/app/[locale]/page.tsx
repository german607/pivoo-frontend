'use client';

import { useAuth } from '@/contexts/auth';
import { Header } from '@/components/Header';
import { Link, useRouter } from '@/navigation';
import { useEffect } from 'react';
import { Zap, TrendingUp, Users, ArrowRight, Trophy, Star } from 'lucide-react';
import { Button } from '@/components/ui';
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations('home');

  useEffect(() => {
    if (!isLoading && user) router.push('/matches');
  }, [user, isLoading]);

  return (
    <main className="min-h-screen bg-white overflow-hidden">
      <Header />

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative bg-slate-900 overflow-hidden">
        {/* Dot grid texture */}
        <div className="absolute inset-0 dot-grid opacity-100" />

        {/* Glow blobs */}
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-teal-500 rounded-full opacity-[0.06] blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-emerald-500 rounded-full opacity-[0.05] blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-teal-600 rounded-full opacity-[0.04] blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-32">
          <div className="text-center max-w-4xl mx-auto">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-teal-400/50 bg-teal-500/15">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-300 animate-pulse" />
              <span className="text-sm font-semibold text-teal-200 tracking-wide">{t('badge')}</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-[1.05] tracking-tight">
              {t('heroTitle1')}
              <br />
              <span className="bg-gradient-to-r from-teal-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">{t('heroTitle2')}</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 mb-10 leading-relaxed max-w-2xl mx-auto">
              {t('heroDesc')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/matches">
                <Button size="lg" variant="primary" icon={<ArrowRight className="w-5 h-5" />} iconPosition="right"
                  className="px-8 py-3.5 text-base">
                  {t('exploreMatches')}
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline"
                  className="px-8 py-3.5 text-base border-white/20 text-white hover:bg-white/8 hover:border-white/30 hover:text-white">
                  {t('getStartedFree')}
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-20 grid grid-cols-3 gap-4 sm:gap-8 max-w-lg mx-auto">
              {[
                { value: '500+', label: t('statActiveMatches') },
                { value: '2.5K+', label: t('statPlayers') },
                { value: '50+', label: t('statCities') },
              ].map((stat, i) => (
                <div key={i} className="glass rounded-2xl px-4 py-5">
                  <p className="text-2xl sm:text-3xl font-black text-white mb-1">{stat.value}</p>
                  <p className="text-xs text-slate-300 leading-snug">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ── Features ─────────────────────────────────── */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-bold text-teal-600 tracking-widest uppercase mb-3">Por qué elegirnos</p>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4 tracking-tight">{t('whyTitle')}</h2>
            <p className="text-lg text-slate-600 max-w-xl mx-auto">{t('whySubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: t('feature1Title'),
                description: t('feature1Desc'),
                gradient: 'from-teal-500 to-emerald-500',
                glow: 'shadow-teal',
              },
              {
                icon: TrendingUp,
                title: t('feature2Title'),
                description: t('feature2Desc'),
                gradient: 'from-blue-500 to-cyan-500',
                glow: 'shadow-blue-500/20',
              },
              {
                icon: Users,
                title: t('feature3Title'),
                description: t('feature3Desc'),
                gradient: 'from-violet-500 to-purple-600',
                glow: 'shadow-violet-500/20',
              },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i}
                  className="group relative bg-white border border-slate-200/80 rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                  <div className={`w-12 h-12 mb-6 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center shadow-lg ${feature.glow}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-sm">{feature.description}</p>
                  <div className={`absolute bottom-0 left-8 right-8 h-0.5 bg-gradient-to-r ${feature.gradient} rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────── */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-bold text-teal-600 tracking-widest uppercase mb-3">Simple y rápido</p>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">{t('howItWorksTitle')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-teal-300 to-transparent" />

            {[
              { number: '01', title: t('step1Title'), desc: t('step1Desc'), icon: Star },
              { number: '02', title: t('step2Title'), desc: t('step2Desc'), icon: Zap },
              { number: '03', title: t('step3Title'), desc: t('step3Desc'), icon: Users },
              { number: '04', title: t('step4Title'), desc: t('step4Desc'), icon: Trophy },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="relative text-center">
                  <div className="relative inline-flex mb-5">
                    <div className="w-20 h-20 rounded-2xl bg-white border-2 border-teal-100 flex items-center justify-center shadow-card mx-auto">
                      <Icon className="w-8 h-8 text-teal-500" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-white text-xs font-black flex items-center justify-center shadow">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="relative py-28 px-4 sm:px-6 lg:px-8 bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 dot-grid" />
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-teal-500 opacity-[0.07] blur-3xl rounded-full pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-5 tracking-tight">{t('ctaTitle')}</h2>
          <p className="text-lg text-slate-300 mb-10">{t('ctaDesc')}</p>
          <Link href="/register">
            <Button size="lg" variant="primary"
              className="px-10 py-4 text-base">
              {t('ctaButton')}
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="bg-slate-950 border-t border-white/5 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm leading-none">P</span>
            </div>
            <span className="font-bold text-white">Pivoo</span>
          </div>
          <p className="text-slate-500 text-sm">{t('copyright')}</p>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-slate-300 transition-colors">{t('footerPrivacy')}</a>
            <a href="#" className="hover:text-slate-300 transition-colors">{t('footerTerms')}</a>
            <a href="#" className="hover:text-slate-300 transition-colors">{t('footerContact')}</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
