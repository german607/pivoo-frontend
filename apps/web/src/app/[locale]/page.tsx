'use client';

import { useAuth } from '@/contexts/auth';
import { Header } from '@/components/Header';
import { Link, useRouter } from '@/navigation';
import { useEffect } from 'react';
import { Zap, TrendingUp, Users, ArrowRight, Sparkles } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations('home');

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/matches');
    }
  }, [user, isLoading]);

  return (
    <main className="min-h-screen bg-white overflow-hidden">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-b from-teal-100 to-transparent rounded-full opacity-30" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-t from-blue-100 to-transparent rounded-full opacity-30" />
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-teal-50 rounded-full border border-teal-200">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-medium text-teal-700">{t('badge')}</span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              {t('heroTitle1')}
              <br />
              <span className="bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                {t('heroTitle2')}
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-10 leading-relaxed">{t('heroDesc')}</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/matches">
                <Button size="lg" variant="primary" icon={<ArrowRight className="w-5 h-5" />}>
                  {t('exploreMatches')}
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline">
                  {t('getStartedFree')}
                </Button>
              </Link>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-8 pt-16 border-t border-gray-200">
              <div>
                <p className="text-3xl font-bold text-gray-900">500+</p>
                <p className="text-gray-600 text-sm mt-2">{t('statActiveMatches')}</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">2.5K+</p>
                <p className="text-gray-600 text-sm mt-2">{t('statPlayers')}</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">50+</p>
                <p className="text-gray-600 text-sm mt-2">{t('statCities')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('whyTitle')}</h2>
            <p className="text-xl text-gray-600">{t('whySubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: t('feature1Title'),
                description: t('feature1Desc'),
                color: 'from-teal-600 to-teal-700',
              },
              {
                icon: TrendingUp,
                title: t('feature2Title'),
                description: t('feature2Desc'),
                color: 'from-blue-600 to-blue-700',
              },
              {
                icon: Users,
                title: t('feature3Title'),
                description: t('feature3Desc'),
                color: 'from-purple-600 to-purple-700',
              },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <Card key={i} variant="elevated" padding="lg" className="text-center hover:shadow-2xl transition-all duration-300">
                  <div className={`w-14 h-14 mx-auto mb-6 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-16 text-center">{t('howItWorksTitle')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { number: 1, title: t('step1Title'), desc: t('step1Desc') },
              { number: 2, title: t('step2Title'), desc: t('step2Desc') },
              { number: 3, title: t('step3Title'), desc: t('step3Desc') },
              { number: 4, title: t('step4Title'), desc: t('step4Desc') },
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-600 to-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold shadow-lg">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[40%] h-0.5 bg-gradient-to-r from-teal-200 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-teal-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-6">{t('ctaTitle')}</h2>
          <p className="text-lg text-teal-100 mb-10">{t('ctaDesc')}</p>
          <Link href="/register">
            <Button size="lg" variant="secondary">
              {t('ctaButton')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <p className="text-gray-600 text-sm">{t('copyright')}</p>
            </div>
            <div className="flex gap-8 text-sm text-gray-600">
              <a href="#" className="hover:text-teal-600 transition-colors">{t('footerPrivacy')}</a>
              <a href="#" className="hover:text-teal-600 transition-colors">{t('footerTerms')}</a>
              <a href="#" className="hover:text-teal-600 transition-colors">{t('footerContact')}</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
