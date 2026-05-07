'use client';

import { Header } from '@/components/Header';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { Trophy, Star, TrendingUp, Medal, ArrowLeft, Sparkles } from 'lucide-react';

export default function RankingsPage() {
  const router = useRouter();
  const t = useTranslations('rankings');

  const FEATURES = [
    { icon: Trophy,     text: t('feature1') },
    { icon: TrendingUp, text: t('feature2') },
    { icon: Medal,      text: t('feature3') },
    { icon: Star,       text: t('feature4') },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />

      {/* Decorative background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-teal-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-400/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <main className="relative max-w-2xl mx-auto px-6 py-20 flex flex-col items-center text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold uppercase tracking-widest mb-10">
          <Sparkles className="w-3 h-3" />
          {t('comingSoonBadge')}
        </div>

        {/* Icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-xl shadow-teal-500/25">
            <Trophy className="w-12 h-12 text-white" strokeWidth={1.5} />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Star className="w-3.5 h-3.5 text-white fill-white" />
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-4">
          {t('comingSoonTitle')}
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-300">
            {t('comingSoonTitleHighlight')}
          </span>
        </h1>

        <p className="text-slate-400 text-base leading-relaxed max-w-md mb-14">
          {t('comingSoonDesc')}
        </p>

        {/* Feature list */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mb-14">
          {FEATURES.map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-3 px-4 py-3.5 bg-slate-800/60 border border-slate-700/60 rounded-2xl text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-teal-400" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium text-slate-300">{text}</span>
            </div>
          ))}
        </div>

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 rounded-xl transition-all duration-150"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backBtn')}
        </button>
      </main>
    </div>
  );
}
