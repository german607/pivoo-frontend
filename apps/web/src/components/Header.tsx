'use client';

import { useAuth } from '@/contexts/auth';
import { Link, useRouter, usePathname } from '@/navigation';
import { Menu, X, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { UserRole } from '@pivoo/shared';

export function Header() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations('header');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLocale = () => {
    const nextLocale = locale === 'es' ? 'en' : 'es';
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 backdrop-blur-sm bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="font-bold text-lg text-gray-900 hidden sm:inline">Pivoo</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/matches" className="text-gray-600 hover:text-teal-600 font-medium transition-colors text-sm">
              {t('matches')}
            </Link>
            <Link href="/tournaments" className="text-gray-600 hover:text-teal-600 font-medium transition-colors text-sm">
              {t('tournaments')}
            </Link>
            <Link href="/rankings" className="text-gray-600 hover:text-teal-600 font-medium transition-colors text-sm">
              {t('rankings')}
            </Link>
            {user && user.role === UserRole.PLAYER && (
              <Link href="/teams" className="text-gray-600 hover:text-teal-600 font-medium transition-colors text-sm">
                {t('myTeam')}
              </Link>
            )}
            {user && user.role === UserRole.COMPLEX && (
              <Link href="/complex" className="text-gray-600 hover:text-teal-600 font-medium transition-colors text-sm">
                {t('myComplex')}
              </Link>
            )}
            {user && (
              <Link href="/profile" className="text-gray-600 hover:text-teal-600 font-medium transition-colors text-sm">
                {t('profile')}
              </Link>
            )}
          </nav>

          {/* Auth + Language Section */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleLocale}
              className="px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
              title={t('switchLang')}
            >
              {t('switchLang')}
            </button>

            {user ? (
              <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
                <div className="flex flex-col items-end">
                  <p className="text-sm font-medium text-gray-900">{user.email.split('@')[0]}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title={t('logout')}
                >
                  <LogOut className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                >
                  {t('signIn')}
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-sm hover:shadow-md"
                >
                  {t('signUp')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-gray-50 px-4 py-4 space-y-3">
            <Link
              href="/matches"
              className="block px-4 py-2 text-gray-700 hover:bg-white rounded-lg transition-colors font-medium"
            >
              {t('matches')}
            </Link>
            <Link
              href="/tournaments"
              className="block px-4 py-2 text-gray-700 hover:bg-white rounded-lg transition-colors font-medium"
            >
              {t('tournaments')}
            </Link>
            <Link
              href="/rankings"
              className="block px-4 py-2 text-gray-700 hover:bg-white rounded-lg transition-colors font-medium"
            >
              {t('rankings')}
            </Link>
            {user && user.role === UserRole.PLAYER && (
              <Link
                href="/teams"
                className="block px-4 py-2 text-gray-700 hover:bg-white rounded-lg transition-colors font-medium"
              >
                {t('myTeam')}
              </Link>
            )}
            {user && user.role === UserRole.COMPLEX && (
              <Link
                href="/complex"
                className="block px-4 py-2 text-gray-700 hover:bg-white rounded-lg transition-colors font-medium"
              >
                {t('myComplex')}
              </Link>
            )}
            {user && (
              <Link
                href="/profile"
                className="block px-4 py-2 text-gray-700 hover:bg-white rounded-lg transition-colors font-medium"
              >
                {t('profile')}
              </Link>
            )}
            <div className="border-t border-gray-200 pt-3 space-y-2">
              <button
                onClick={toggleLocale}
                className="w-full text-left px-4 py-2 text-teal-700 font-bold text-sm bg-teal-50 rounded-lg"
              >
                {t('switchLang')}
              </button>
              {user ? (
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  {t('logout')}
                </button>
              ) : (
                <div className="flex gap-2">
                  <Link
                    href="/login"
                    className="flex-1 px-4 py-2 text-sm font-medium text-teal-600 hover:bg-teal-50 rounded-lg transition-colors text-center"
                  >
                    {t('signIn')}
                  </Link>
                  <Link
                    href="/register"
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors text-center"
                  >
                    {t('signUp')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
